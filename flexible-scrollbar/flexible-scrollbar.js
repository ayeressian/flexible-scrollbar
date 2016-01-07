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
            return navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
        }
    };
    /*Util end*/

    /*Scrollbar*/
    /**
     * Abstract Scrollbar class
     * @constructor
     * @param {Object} $scrollbar         Jquery object that represents scrollbar.
     * @param {Object} $targetElement     Jquery object that represents an element that should be scrolled.
     * @param {Object} util               Common utilities object.
     * @param {number} [minSliderSize=40] As the targetElement's content increases the scrollbar thumb size decreases,
     *                                    but there is a minimum size that the thumb should have which is represented
     *                                    by this parameter.
     */
    function Scrollbar($scrollbar, $targetElement, util, minSliderSize) {
        this._$scrollbar = $scrollbar;
        this._$targetElement = $targetElement;
        this._util = util;

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
     * @default
     */
    Scrollbar._SLIDER_ARROW_AMOUNT = 15;

    /**
     * Determines the time interval of scrollbar arrow clicks perform action. In other words,
     * this is the render frame interval of scrollbar arrow click and scrollbar thumb movement.
     * @constant
     * @type {Number}
     * @default
     */
    Scrollbar._CONST_MOVE_MIL = 75;

    /**
     * As the targetElement's content increases the scrollbar thumb size decreases,
     * but there is a minimum size that the thumb should have which is represented by this
     * variable.
     * @constant
     * @type {Number}
     * @default
     */
    Scrollbar._MINIMUM_SLIDER_SIZE = 40;

    Scrollbar.prototype._setSliderPosFromTarget = function() {
        var targetSliderCalculatedPos = this._scroll(this._$targetElement) / (this._scrollSize(this._$targetElement) - this._size(this._$targetElement));
        this._currentSliderPos = (this._sliderBedSize - this._sliderSize) * targetSliderCalculatedPos;
        this._position(this._$slider, this._currentSliderPos);
    };
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

    Scrollbar.prototype._disableScrolling = function() {
        this._util.enableSelection();
        this._mousePosRelativeToSlider = null;
        this._stopArrowMouseDown = true;
    };
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
    Scrollbar.prototype._decreaseArrow = function() {
        var newSliderPos = this._positionRelParent(this._$slider) - Scrollbar._SLIDER_ARROW_AMOUNT;
        return this._setSliderPos(newSliderPos);
    };
    Scrollbar.prototype._increaseArrow = function() {
        var newSliderPos = this._positionRelParent(this._$slider) + Scrollbar._SLIDER_ARROW_AMOUNT;
        return this._setSliderPos(newSliderPos);
    };
    //TODO: Change to css animation for better performance.
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
            if (!this._util.isSafari()) {
                this._touchInertiaAnimator(velocity);
            }
            touchPos = undefined;
        }, this));
    };
    Scrollbar.prototype._initMouseWheel = function() {
        if (this._$targetElement.mousewheel) {
            this._$targetElement.on('mousewheel', $.proxy(function(event) {
                var delta = this._mousewheelDelta(event),
                    edgeReached;
                if (this._util.isNaturalScrolling(event)) {
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
    Scrollbar.prototype._initEvents = function() {
        //fetch the slider pos for resizing
        this._$slider.on('mousedown touchstart', $.proxy(function(event) {
            this._mousePosRelativeToSlider = this._offsetEvent(event);
            event.stopPropagation();
            this._util.disableSelection();
            return event.preventDefault();
        }, this));

        this._$body.on('mouseup touchend', $.proxy(this._disableScrolling, this)).
        on('mousemove touchmove', $.proxy(function(event) {
            var newSliderPos;
            if (this._mousePosRelativeToSlider) {
                this._util.disableSelection();
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
            this._util.disableSelection();
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
            this._util.disableSelection();
            interval = setInterval(function(self) {
                if (self._stopArrowMouseDown || self._increaseArrow()) {
                    clearInterval(interval);
                }
            }, Scrollbar._CONST_MOVE_MIL, this);
        }, this));
    };
    /*Scrollbar end*/

    /*ScrollbarHorizontal*/
    function ScrollbarHorizontal($scrollbar, $targetElement, util, minSliderSize) {
        var html = '<div class="scrollbar horizontal">' +
            '<div class="left-arrow arrow"></div>' +
            '<div class="right-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '</div>';
        $targetElement.css('overflow-x', 'hidden');
        $scrollbar.html(html);
        Scrollbar.call(this, $scrollbar, $targetElement, util, minSliderSize);
    }
    ScrollbarHorizontal.prototype = Object.create(Scrollbar.prototype);
    ScrollbarHorizontal.prototype._size = function($element, size) {
        if (size) {
            return $element.width(size);
        }
        return $element.width();
    };
    ScrollbarHorizontal.prototype._scrollSize = function($element) {
        return $element.prop('scrollWidth');
    };
    ScrollbarHorizontal.prototype._position = function($element, position) {
        if (position !== null && position !== undefined) {
            return $element.css('left', position);
        }
        return $element.css('left');
    };
    ScrollbarHorizontal.prototype._touchSinglePagePos = function($event) {
        var touch;
        touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
        return touch.pageX;
    };
    ScrollbarHorizontal.prototype._offsetEvent = function($event) {
        var touch, offsetX;
        if (this._util.isTouchEvent($event)) {
            touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            offsetX = touch.pageX - $($event.target).offset().left;
            return offsetX;
        }
        return $event.offsetX || $event.pageX - $($event.target).offset().left;
    };
    ScrollbarHorizontal.prototype._offsetElement = function($element) {
        return $element.offset().left;
    };
    ScrollbarHorizontal.prototype._page = function($event) {
        if (this._util.isTouchEvent($event)) {
            var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            return touch.pageY;
        }
        return $event.pageX;
    };
    ScrollbarHorizontal.prototype._scroll = function($element, amount) {
        if (amount !== null && amount !== undefined) {
            return $element.scrollLeft(amount);
        }
        return $element.scrollLeft();
    };
    ScrollbarHorizontal.prototype._positionRelParent = function($element) {
        return $element.position().left;
    };
    ScrollbarHorizontal.prototype._mousewheelDelta = function($event) {
        return $event.deltaX;
    };
    //workaround bug in jquery mousewheel
    ScrollbarHorizontal.prototype._mousewheelOrientation = function() {
        return 1;
    };
    /*ScrollbarHorizontal end*/

    /*ScrollbarVertical*/
    function ScrollbarVertical($scrollbar, $targetElement, util, minSliderSize) {
        var html = '<div class="scrollbar vertical">' +
            '<div class="top-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '<div class="bottom-arrow arrow"></div>' +
            '</div>';
        $targetElement.css('overflow-y', 'hidden');
        $scrollbar.html(html);
        Scrollbar.call(this, $scrollbar, $targetElement, util, minSliderSize);
    }
    ScrollbarVertical.prototype = Object.create(Scrollbar.prototype);
    ScrollbarVertical.prototype._size = function($element, size) {
        if (size) {
            return $element.height(size);
        }
        return $element.height();
    };
    ScrollbarVertical.prototype._scrollSize = function($element) {
        return $element.prop('scrollHeight');
    };
    ScrollbarVertical.prototype._position = function($element, position) {
        if (position !== null && position !== undefined) {
            return $element.css('top', position);
        }
        return $element.css('top');
    };
    ScrollbarVertical.prototype._touchSinglePagePos = function($event) {
        var touch;
        touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
        return touch.pageY;
    };
    ScrollbarVertical.prototype._offsetEvent = function($event) {
        var touch, offsetY;
        if (this._util.isTouchEvent($event)) {
            touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            offsetY = touch.pageY - $($event.target).offset().top;
            return offsetY;
        }
        return $event.offsetY || $event.pageY - $($event.target).offset().top;
    };
    ScrollbarVertical.prototype._offsetElement = function($element) {
        return $element.offset().top;
    };
    ScrollbarVertical.prototype._page = function($event) {
        if (this._util.isTouchEvent($event)) {
            var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
            return touch.pageY;
        }
        return $event.pageY;
    };
    ScrollbarVertical.prototype._scroll = function($element, amount) {
        if (amount !== null && amount !== undefined) {
            return $element.scrollTop(amount);
        }
        return $element.scrollTop();
    };
    ScrollbarVertical.prototype._positionRelParent = function($element) {
        return $element.position().top;
    };
    ScrollbarVertical.prototype._mousewheelDelta = function($event) {
        return $event.deltaY;
    };
    //workaround bug in jquery mousewheel
    ScrollbarVertical.prototype._mousewheelOrientation = function() {
        return -1;
    };
    /*ScrollbarVertical end*/

    $.fn.scrollbar = function(targetElement, isHorizontal, minSliderSize) {
        if (isHorizontal) {
            new ScrollbarHorizontal($(this), $(targetElement), util, minSliderSize);
        } else {
            new ScrollbarVertical($(this), $(targetElement), util, minSliderSize);
        }
    };
})();
