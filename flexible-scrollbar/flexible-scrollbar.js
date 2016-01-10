(function() {
    'use strict';

    /*Util*/
    var util = {
        /**
         * Determines whether the supplied event is touch related.
         * @param  {Object} event
         * @return {boolean}
         */
        isTouchEvent: function(event) {
            var type;
            event = $.Event(event);
            type = event.type;
            return type === 'touchstart' ||
                type === 'touchmove' ||
                type === 'touchend' ||
                type === 'touchcancel';
        },
        /**
         * Disables selection on the entire page.
         */
        disableSelection: function() {
            $('*').attr('unselectable', 'on').addClass('unselectable')
                .addClass('default-cursor');
        },
        /**
         * Enables selection on the entire page. Opposite of disableSelection.
         */
        enableSelection: function() {
            $('*').removeAttr('unselectable').removeClass('unselectable')
                .removeClass('default-cursor');
        },
        /**
         * Determines if the platform is Mac.
         * @return {boolean}
         */
        isMac: function() {
            return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        },
        /**
         * Determines whether event is natural scrolling. Natural scrolling is the default
         * behaviour on OSX. On Safari the return value is 100% correct. On other browsers
         * such as Firefox and Chrome the best guess is if the user is running Mac,
         * which is inconclusive because this value can be changed from OSX preferences.
         * @param  {Object} event
         * @return {boolean}
         */
        isNaturalScrolling: function(event) {
            return event.originalEvent.webkitDirectionInvertedFromDevice === true ||
                (event.originalEvent.webkitDirectionInvertedFromDevice === undefined && this.isMac());
        },
        /**
         * Determines if the browser is Safari.
         * @return {boolean}
         */
        isSafari: function() {
            return navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
        }
    };
    /*Util end*/

    /*Scrollbar*/
    /**
     * Abstract Scrollbar class
     * @constructor
     * @param {Object} $scrollbar         Jquery object that represents scrollbar.
     * @param {Object} $targetElement     Jquery object that represents an element that should be scrolled.
     * @param {number} [minSliderSize=40] As the targetElement's content increases the scrollbar thumb size decreases,
     *                                    but there is a minimum size that the thumb should have which is represented
     *                                    by this parameter.
     */
    function Scrollbar($scrollbar, $targetElement, minSliderSize) {
        this._$scrollbar = $scrollbar;
        this._$targetElement = $targetElement;

        this._$sliderBed = this._$scrollbar.find('.slider-bed');
        this._$slider = this._$sliderBed.find('.slider');
        this._$body = $(document.body);
        this._stopArrowMouseDown = false;

        if (!minSliderSize) {
            this._minSliderSize = Scrollbar._MINIMUM_SLIDER_SIZE;
        }
        this._updateSliderSize();
        //TODO: Find a better way to detect the container size change.
        setInterval(function(self) {
            self._updateSliderSize();
        }, 100, this);
        this._initEvents();
        this._initTouchEvents();
        this._initMouseWheel();
    }

    /**
     * Determines the amount of scrollbar movement on each scrollbar arrow click.
     * @constant
     * @type {Number}
     * @static
     * @private
     */
    Scrollbar._SLIDER_ARROW_AMOUNT = 15;

    /**
     * Determines the time interval of scrollbar arrow clicks perform action. In other words,
     * this is the render frame interval of scrollbar arrow click and scrollbar thumb movement.
     * @constant
     * @type {Number}
     * @static
     * @private
     */
    Scrollbar._CONST_MOVE_MIL = 75;

    /**
     * As the targetElement's content increases the scrollbar thumb size decreases,
     * but there is a minimum size that the thumb should have which is represented by this
     * variable.
     * @constant
     * @type {Number}
     * @static
     * @private
     */
    Scrollbar._MINIMUM_SLIDER_SIZE = 40;

    /**
     * Sets the slider (thumb) position to current position insider thumb bed.
     * @private
     */
    Scrollbar.prototype._setSliderPosFromTarget = function() {
        var targetSliderCalculatedPos = this._scroll(this._$targetElement) / (this._scrollSize(this._$targetElement) - this._size(this._$targetElement));
        this._currentSliderPos = (this._sliderBedSize - this._sliderSize) * targetSliderCalculatedPos;
        this._position(this._$slider, this._currentSliderPos);
    };

    /**
     * Update slider (thumb) size based on current container and content dimensions.
     * @private
     */
    Scrollbar.prototype._updateSliderSize = function() {
        var scrollSize, targetElementRatio;
        this._sliderBedSize = this._size(this._$sliderBed);
        scrollSize = this._scrollSize(this._$targetElement);
        targetElementRatio = this._size(this._$targetElement) / scrollSize;
        if (targetElementRatio >= 1 && targetElementRatio <= 0) {
            this._$scrollbar.css('display', 'none');
        }
        this._sliderSize = this._sliderBedSize * targetElementRatio;
        if (this._sliderSize < this._minSliderSize) {
            this._sliderSize = this._minSliderSize;
        }
        this._size(this._$slider, this._sliderSize);

        //Set scroll to its correct position after target size change
        this._setSliderPosFromTarget();
    };

    /**
     * Ends scrolling.
     * @private
     */
    Scrollbar.prototype._disableScrolling = function() {
        util.enableSelection();
        this._mousePosRelativeToSlider = null;
        this._stopArrowMouseDown = true;
    };

    /**
     * Sets new position for slider (thumb).
     * @private
     * @param  {number} sliderPos New slider position.
     * @return {boolean}          Determines if thumb (slider) reached to end or beginning of slider bed.
     */
    Scrollbar.prototype._setSliderPos = function(sliderPos) {
        var edgeReached = false,
            sliderCalculatedPos;

        if (sliderPos < 0) {
            sliderPos = 0;
            edgeReached = true;
        } else {
            if (sliderPos > this._sliderBedSize - this._sliderSize) {
                sliderPos = this._sliderBedSize - this._sliderSize;
                edgeReached = true;
            }
        }
        this._position(this._$slider, sliderPos);

        sliderCalculatedPos = sliderPos / (this._sliderBedSize - this._sliderSize);
        this._scroll(this._$targetElement, (this._scrollSize(this._$targetElement) - this._size(this._$targetElement)) * sliderCalculatedPos);
        this._currentSliderPos = sliderPos;
        return edgeReached;
    };

    /**
     * Decreases current slider position.
     * @private
     * @return {boolean} If the slider reached to the end or beginning of slider bed.
     */
    Scrollbar.prototype._decreaseArrow = function() {
        var newSliderPos = this._positionRelParent(this._$slider) - Scrollbar._SLIDER_ARROW_AMOUNT;
        return this._setSliderPos(newSliderPos);
    };

    /**
     * Increases current slider position.
     * @private
     * @return {boolean} If the slider reached to the end or beginning of slider bed.
     */
    Scrollbar.prototype._increaseArrow = function() {
        var newSliderPos = this._positionRelParent(this._$slider) + Scrollbar._SLIDER_ARROW_AMOUNT;
        return this._setSliderPos(newSliderPos);
    };

    /**
     * Animates the speed decreasing movement of scroll.
     * @todo  Change to css animation for better performance.
     * @param  {number} velocity Initial animation speed.
     * @private
     */
    Scrollbar.prototype._touchInertiaAnimator = function(velocity) {
        var MILLISECOND_PER_FRAME = 16,
            FRICTION_COEFFICIENT = 0.95,
            distancePerFrame;

        distancePerFrame = velocity * MILLISECOND_PER_FRAME;

        if (this._swipIntervalHandel) {
            clearInterval(this._swipIntervalHandel);
        }
        this._swipIntervalHandel = setInterval(function(self) {
            var pos;

            distancePerFrame *= FRICTION_COEFFICIENT;
            if (distancePerFrame < 1 && distancePerFrame > -1) {
                clearInterval(self._swipIntervalHandel);
                return;
            }
            pos = self._scroll(self._$targetElement) - distancePerFrame;
            if (pos < 0) {
                clearInterval(self._swipIntervalHandel);
                return;
            }
            self._scroll(self._$targetElement, pos);
            self._setSliderPosFromTarget();
        }, MILLISECOND_PER_FRAME, this);
    };

    /**
     * Initialises all the touch events.
     * @private
     */
    Scrollbar.prototype._initTouchEvents = function() {
        var touchPos, eventForSwipeLatest, eventForSwipeOneBeforeLatest;

        this._$targetElement.on('touchstart', $.proxy(function(event) {
            if (event.originalEvent.targetTouches.length === 1) {
                //Clear any ongoing inertia animation
                if (this._swipIntervalHandel) {
                    clearInterval(this._swipIntervalHandel);
                }
                touchPos = this._touchSinglePagePos(event);
                eventForSwipeLatest = {
                    position: touchPos,
                    time: event.timeStamp
                };
            }
        }, this)).on('touchmove', $.proxy(function(event) {
            var originaltouchPos;
            if (touchPos) {
                originaltouchPos = touchPos;
                touchPos = this._touchSinglePagePos(event);
                this._scroll(this._$targetElement, this._scroll(this._$targetElement) - touchPos + originaltouchPos);
                this._setSliderPosFromTarget();
                event.preventDefault();

                eventForSwipeOneBeforeLatest = eventForSwipeLatest;
                eventForSwipeLatest = {
                    position: touchPos,
                    time: event.timeStamp
                };
            }
        }, this)).on('touchend touchcancel', $.proxy(function(event) {
            var timeDelta = eventForSwipeLatest.time - eventForSwipeOneBeforeLatest.time;
            var posDelta = eventForSwipeLatest.position - eventForSwipeOneBeforeLatest.position;
            var velocity = posDelta / timeDelta;
            //Safari on IOS doesn't have inertia
            if (!util.isSafari()) {
                this._touchInertiaAnimator(velocity);
            }
            touchPos = undefined;
        }, this));
    };

    /**
     * Initialises mouse wheel or trackpad scrolling events.
     * @private
     */
    Scrollbar.prototype._initMouseWheel = function() {
        if (this._$targetElement.mousewheel) {
            this._$targetElement.on('mousewheel', $.proxy(function(event) {
                var delta = this._mousewheelDelta(event),
                    edgeReached;
                if (util.isNaturalScrolling(event)) {
                    delta *= this._mousewheelOrientation();
                } else {
                    delta *= -this._mousewheelOrientation();
                }
                edgeReached = this._setSliderPos(this._currentSliderPos + delta * (event.deltaFactor / 4));
                if (!edgeReached) {
                    event.preventDefault();
                }
            }, this));
        }
    };

    /**
     * Initialises all events.
     * @private
     */
    Scrollbar.prototype._initEvents = function() {
        //fetch the slider pos for resizing
        this._$slider.on('mousedown touchstart', $.proxy(function(event) {
            this._mousePosRelativeToSlider = this._offsetEvent(event);
            event.stopPropagation();
            util.disableSelection();
            return event.preventDefault();
        }, this));

        this._$body.on('mouseup touchend', $.proxy(this._disableScrolling, this)).
        on('mousemove touchmove', $.proxy(function(event) {
            var newSliderPos;
            if (this._mousePosRelativeToSlider) {
                util.disableSelection();
                newSliderPos = this._page(event) - this._offsetElement(this._$sliderBed) - this._mousePosRelativeToSlider;
                this._setSliderPos(newSliderPos);
                return event.preventDefault();
            }
        }, this)).
        on('mouseleave', $.proxy(this._disableScrolling, this));

        //jump click
        this._$scrollbar.find('.slider-bed').on('mousedown touchstart', $.proxy(function(event) {
            var newSliderPos;
            this._mousePosRelativeToSlider = this._size(this._$slider) / 2;
            newSliderPos = this._offsetEvent(event) - this._mousePosRelativeToSlider;
            this._setSliderPos(newSliderPos);
        }, this));

        this._$scrollbar.find('.left-arrow, .top-arrow').on('mousedown touchstart', $.proxy(function() {
            var interval;
            this._stopArrowMouseDown = false;
            this._decreaseArrow();
            util.disableSelection();
            interval = setInterval(function(self) {
                if (self._stopArrowMouseDown || self._decreaseArrow()) {
                    clearInterval(interval);
                }
            }, Scrollbar._CONST_MOVE_MIL, this);
        }, this));

        this._$scrollbar.find('.right-arrow, .bottom-arrow').on('mousedown touchstart', $.proxy(function() {
            var interval;
            this._stopArrowMouseDown = false;
            this._increaseArrow();
            util.disableSelection();
            interval = setInterval(function(self) {
                if (self._stopArrowMouseDown || self._increaseArrow()) {
                    clearInterval(interval);
                }
            }, Scrollbar._CONST_MOVE_MIL, this);
        }, this));
    };

    /**
     * Gets or sets $element size
     * @abstract
     * @param  {object} $element A Jquery object.
     * @param  {number} size     New size of $element.
     * @return {number} size     Size of $element. Will be undefined if second
     *                           param value exist.
     */
    Scrollbar.prototype._size = function($element, size) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Returns scroll size. Or in other words real size of $element.
     * @abstract
     * @param  {Object} $element A Jquery object.
     * @return {number}          Real size of $element, with considering hidden region,
     *                           which is covered by scroll control.
     */
    Scrollbar.prototype._scrollSize = function($element) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Sets or gets position of $element
     * @abstract
     * @param  {Object} $element A Jquery object.
     * @param  {number} position New position of $element.
     * @return {number}          Position of $element. Will be undefined if second
     *                           param value exist.
     */
    Scrollbar.prototype._position = function($element, position) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Get touch coordinate
     * @abstract
     * @param  {Object} $event A Jquery event object.
     * @return {number}        Touch coordinate.
     */
    Scrollbar.prototype._touchSinglePagePos = function($event) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Gets offset event.
     * @abstract
     * @param  {Object} $event A Jquery event Object.
     * @return {Object}        A Jquery event Object.
     */
    Scrollbar.prototype._offsetEvent = function($event) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Gets $element offset.
     * @abstract
     * @param  {Object} $element A Jquery object.
     * @return {number}          Offset amount.
     */
    Scrollbar.prototype._offsetElement = function($element) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * [function description]
     * @abstract
     * @param  {[type]} $event [description]
     * @return {[type]}        [description]
     */
    Scrollbar.prototype._page = function($event) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Move the container scroll to designated position.
     * @abstract
     * @param  {Object} $element A Jquery Object.
     * @param  {number} position Position of target scrollbar.
     * @return {number}          Position of scroll if position param hasn't
     *                           been specified.
     */
    Scrollbar.prototype._scroll = function($element, position) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Position of $element relative to parent.
     * @abstract
     * @param  {Object} $element A Jquery Object.
     */
    Scrollbar.prototype._positionRelParent = function($element) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Gets delta property of mouse wheel event.
     * @abstract
     * @param  {Object} $event A Jquery event.
     * @return {Number}        Delta value of mouse wheel event.
     */
    Scrollbar.prototype._mousewheelDelta = function($event) {
        throw new Error('Must be implemented by subclass.');
    };

    /**
     * Workaround bug in Jquery mousewheel. Gets mouse wheel orientation.
     * @abstract
     * @return {number} Orientation
     */
    Scrollbar.prototype._mousewheelOrientation = function() {
        throw new Error('Must be implemented by subclass.');
    };
    /*Scrollbar end*/

    /*ScrollbarHorizontal*/
    /**
     * This class represents horizontal scrollbar.
     * @constructor
     * @augments Scrollbar
     * @see super
     */
    function ScrollbarHorizontal($scrollbar, $targetElement, minSliderSize) {
        var html = '<div class="scrollbar horizontal">' +
            '<div class="left-arrow arrow"></div>' +
            '<div class="right-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '</div>';
        $targetElement.css('overflow-x', 'hidden');
        $scrollbar.html(html);
        Scrollbar.call(this, $scrollbar, $targetElement, minSliderSize);
    }
    ScrollbarHorizontal.prototype = Object.create(Scrollbar.prototype);

    /**
     * @see super._size
     */
    ScrollbarHorizontal.prototype._size = function($element, size) {
        if (size) {
            return $element.width(size);
        }
        return $element.width();
    };

    /**
     * @see super._scrollSize
     */
    ScrollbarHorizontal.prototype._scrollSize = function($element) {
        return $element.prop('scrollWidth');
    };

    /**
     * @see super._position
     */
    ScrollbarHorizontal.prototype._position = function($element, position) {
        if (position !== null && position !== undefined) {
            return $element.css('left', position);
        }
        return $element.css('left');
    };

    /**
     * @see super._touchSinglePagePos
     */
    ScrollbarHorizontal.prototype._touchSinglePagePos = function($event) {
        var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
        return touch.pageX;
    };

    /**
     * @see super._offsetEvent
     */
    ScrollbarHorizontal.prototype._offsetEvent = function($event) {
        var touch, offsetX;
        if (util.isTouchEvent($event)) {
            touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            offsetX = touch.pageX - $($event.target).offset().left;
            return offsetX;
        }
        return $event.offsetX || $event.pageX - $($event.target).offset().left;
    };

    /**
     * @see super._offsetElement
     */
    ScrollbarHorizontal.prototype._offsetElement = function($element) {
        return $element.offset().left;
    };

    /**
     * @see super._page
     */
    ScrollbarHorizontal.prototype._page = function($event) {
        if (util.isTouchEvent($event)) {
            var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            return touch.pageY;
        }
        return $event.pageX;
    };

    /**
     * @see super._scroll
     */
    ScrollbarHorizontal.prototype._scroll = function($element, amount) {
        if (amount !== null && amount !== undefined) {
            return $element.scrollLeft(amount);
        }
        return $element.scrollLeft();
    };

    /**
     * @see super._positionRelParent
     */
    ScrollbarHorizontal.prototype._positionRelParent = function($element) {
        return $element.position().left;
    };

    /**
     * @see super._mousewheelDelta
     */
    ScrollbarHorizontal.prototype._mousewheelDelta = function($event) {
        return $event.deltaX;
    };

    /**
     * @see super._mousewheelOrientation
     */
    ScrollbarHorizontal.prototype._mousewheelOrientation = function() {
        return 1;
    };
    /*ScrollbarHorizontal end*/

    /*ScrollbarVertical*/
    /**
     * This class represents vertical scrollbar.
     * @constructor
     * @augments Scrollbar
     * @see super
     */
    function ScrollbarVertical($scrollbar, $targetElement, minSliderSize) {
        var html = '<div class="scrollbar vertical">' +
            '<div class="top-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '<div class="bottom-arrow arrow"></div>' +
            '</div>';
        $targetElement.css('overflow-y', 'hidden');
        $scrollbar.html(html);
        Scrollbar.call(this, $scrollbar, $targetElement, minSliderSize);
    }
    ScrollbarVertical.prototype = Object.create(Scrollbar.prototype);

    /**
     * @see super._size
     */
    ScrollbarVertical.prototype._size = function($element, size) {
        if (size) {
            return $element.height(size);
        }
        return $element.height();
    };

    /**
     * @see super._scrollSize
     */
    ScrollbarVertical.prototype._scrollSize = function($element) {
        return $element.prop('scrollHeight');
    };

    /**
     * @see super._position
     */
    ScrollbarVertical.prototype._position = function($element, position) {
        if (position !== null && position !== undefined) {
            return $element.css('top', position);
        }
        return $element.css('top');
    };

    /**
     * @see super._touchSinglePagePos
     */
    ScrollbarVertical.prototype._touchSinglePagePos = function($event) {
        var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
        return touch.pageY;
    };

    /**
     * @see super._offsetEvent
     */
    ScrollbarVertical.prototype._offsetEvent = function($event) {
        var touch, offsetY;
        if (util.isTouchEvent($event)) {
            touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            offsetY = touch.pageY - $($event.target).offset().top;
            return offsetY;
        }
        return $event.offsetY || $event.pageY - $($event.target).offset().top;
    };

    /**
     * @see super._offsetElement
     */
    ScrollbarVertical.prototype._offsetElement = function($element) {
        return $element.offset().top;
    };

    /**
     * @see super._page
     */
    ScrollbarVertical.prototype._page = function($event) {
        if (util.isTouchEvent($event)) {
            var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            return touch.pageY;
        }
        return $event.pageY;
    };

    /**
     * @see super._scroll
     */
    ScrollbarVertical.prototype._scroll = function($element, amount) {
        if (amount !== null && amount !== undefined) {
            return $element.scrollTop(amount);
        }
        return $element.scrollTop();
    };

    /**
     * @see super._positionRelParent
     */
    ScrollbarVertical.prototype._positionRelParent = function($element) {
        return $element.position().top;
    };

    /**
     * @see super._mousewheelDelta
     */
    ScrollbarVertical.prototype._mousewheelDelta = function($event) {
        return $event.deltaY;
    };

    /**
     * @see super._mousewheelOrientation
     */
    ScrollbarVertical.prototype._mousewheelOrientation = function() {
        return -1;
    };
    /*ScrollbarVertical end*/

    $.fn.scrollbar = function(targetElement, isHorizontal, minSliderSize) {
        if (isHorizontal) {
            new ScrollbarHorizontal($(this), $(targetElement), minSliderSize);
        } else {
            new ScrollbarVertical($(this), $(targetElement), minSliderSize);
        }
    };
})();
