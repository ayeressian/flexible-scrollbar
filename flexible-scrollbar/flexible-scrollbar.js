$.fn.scrollbar = function(targetElement, isHorizontal, minSliderSize) {
    'use strict';
    var $targetElement = $(targetElement),
        html, $element = $(this);
    if (isHorizontal) {
        html = '<div class="scrollbar horizontal">' +
            '<div class="left-arrow arrow"></div>' +
            '<div class="right-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '</div>';
        $targetElement.css('overflow-x', 'hidden');
    } else {
        html = '<div class="scrollbar vertical">' +
            '<div class="top-arrow arrow"></div>' +
            '<div class="slider-bed">' +
            '<div class="slider"></div>' +
            '</div>' +
            '<div class="bottom-arrow arrow"></div>' +
            '</div>';
        $targetElement.css('overflow-y', 'hidden');
    }
    $element.html(html);
    scrollbar($element);

    function scrollbar($scrollbar) {

        function isTouchEvent(event) {
            var type;
            event = $.Event(event);
            type = event.type;
            return type === 'touchstart' ||
                type === 'touchmove' ||
                type === 'touchend' ||
                type === 'touchcancel';
        }

        var verticalHelper = {
            _size: function($element, size) {
                if (size) {
                    return $element.height(size);
                }
                return $element.height();
            },
            _scrollSize: function($element) {
                return $element.prop('scrollHeight');
            },
            _position: function($element, position) {
                if (position !== null && position !== undefined) {
                    return $element.css('top', position);
                }
                return $element.css('top');
            },
            _touchSinglePagePos: function($event) {
                var touch;
                touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                return touch.pageY;
            },
            _offsetEvent: function($event) {
                var touch, offsetY;
                if (isTouchEvent($event)) {
                    touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                    offsetY = touch.pageY - $($event.target).offset().top;
                    return offsetY;
                }
                return $event.offsetY || $event.pageY - $($event.target).offset().top;
            },
            _offsetElement: function($element) {
                return $element.offset().top;
            },
            _page: function($event) {
                if (isTouchEvent($event)) {
                    var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                    return touch.pageY;
                }
                return $event.pageY;
            },
            _scroll: function($element, amount) {
                if (amount !== null && amount !== undefined) {
                    return $element.scrollTop(amount);
                }
                return $element.scrollTop();
            },
            _positionRelParent: function($element) {
                return $element.position().top;
            },
            _mousewheelDelta: function($event) {
                return $event.deltaY;
            }
        };

        var horizontalHelper = {
            _size: function($element, size) {
                if (size) {
                    return $element.width(size);
                }
                return $element.width();
            },
            _scrollSize: function($element) {
                return $element.prop('scrollWidth');
            },
            _position: function($element, position) {
                if (position !== null && position !== undefined) {
                    return $element.css('left', position);
                }
                return $element.css('left');
            },
            _touchSinglePagePos: function($event) {
                var touch;
                touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                return touch.pageX;
            },
            _offsetEvent: function($event) {
                var touch, offsetX;
                if (isTouchEvent($event)) {
                    touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                    offsetX = touch.pageX - $($event.target).offset().left;
                    return offsetX;
                }
                return $event.offsetX || $event.pageX - $($event.target).offset().left;
            },
            _offsetElement: function($element) {
                return $element.offset().left;
            },
            _page: function($event) {
                if (isTouchEvent($event)) {
                    var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                    return touch.pageY;
                }
                return $event.pageX;
            },
            _scroll: function($element, amount) {
                if (amount !== null && amount !== undefined) {
                    return $element.scrollLeft(amount);
                }
                return $element.scrollLeft();
            },
            _positionRelParent: function($element) {
                return $element.position().left;
            },
            _mousewheelDelta: function($event) {
                return $event.deltaX;
            }
        };

        function Scrollbar() {
            var self = this;

            self._$sliderBed = $scrollbar.find('.slider-bed');
            self._$slider = self._$sliderBed.find('.slider');
            self._SLIDER_ARROW_AMOUNT = 15;
            self._CONST_MOVE_MIL = 75;
            self._MINIMUM_SLIDER_SIZE = 40;
            self._currentSliderPos = null;
            self._stopArrowMouseDown = false;
            self._mousePosRelativeToSlider = null;
            self._sliderBedSize = null;
            self._sliderSize = null;
            self._$body = $(document.body);

            self._setSliderPosFromTarget = function() {
                var targetSliderCalculatedPos = self._scroll($targetElement) / (self._scrollSize($targetElement) - self._size($targetElement));
                self._currentSliderPos = (self._sliderBedSize - self._sliderSize) * targetSliderCalculatedPos;
                self._position(self._$slider, self._currentSliderPos);
            };

            self._updateSliderSize = function() {
                var scrollSize, targetElementRatio;
                self._sliderBedSize = self._size(self._$sliderBed);
                scrollSize = self._scrollSize($targetElement);
                targetElementRatio = self._size($targetElement) / scrollSize;
                if (targetElementRatio >= 1 && targetElementRatio <= 0) {
                    $scrollbar.css('display', 'none');
                }
                self._sliderSize = self._sliderBedSize * targetElementRatio;
                if (self._sliderSize < minSliderSize) {
                    self._sliderSize = minSliderSize;
                }
                self._size(self._$slider, self._sliderSize);

                //Set scroll to its correct position after target size change
                self._setSliderPosFromTarget();
            };

            self._disableSelection = function() {
                $('*').attr('unselectable', 'on').addClass('unselectable')
                    .addClass('default-cursor');
            };

            self._enableSelection = function() {
                $('*').removeAttr('unselectable').removeClass('unselectable')
                    .removeClass('default-cursor');
            };

            self._disableScrolling = function() {
                self._enableSelection();
                self._mousePosRelativeToSlider = null;
                self._stopArrowMouseDown = true;
            };

            self._setSliderPos = function(sliderPos) {
                var edgeReached = false;

                if (sliderPos < 0) {
                    sliderPos = 0;
                    edgeReached = true;
                } else {
                    if (sliderPos > self._sliderBedSize - self._sliderSize) {
                        sliderPos = self._sliderBedSize - self._sliderSize;
                        edgeReached = true;
                    }
                }
                self._position(self._$slider, sliderPos);

                function updateTargetScroll(sliderPos) {
                    var sliderCalculatedPos = sliderPos / (self._sliderBedSize - self._sliderSize);
                    self._scroll($targetElement, (self._scrollSize($targetElement) - self._size($targetElement)) * sliderCalculatedPos);
                }

                updateTargetScroll(sliderPos);
                self._currentSliderPos = sliderPos;
                return edgeReached;
            };

            self._decreaseArrow = function() {
                var newSliderPos = self._positionRelParent(self._$slider) - self._SLIDER_ARROW_AMOUNT;
                return self._setSliderPos(newSliderPos);
            };

            self._increaseArrow = function() {
                var newSliderPos = self._positionRelParent(self._$slider) + self._SLIDER_ARROW_AMOUNT;
                return self._setSliderPos(newSliderPos);
            };

            self._targetElementTouchInit = function() {
                var touchPos, eventForSwipeLatest, eventForSwipeOneBeforeLatest, swipIntervalHandel;

                function inertiaAnimator(velocity) {
                    var MILLISECOND_PER_FRAME = 16,
                        FRICTION_COEFFICIENT = 0.95,
                        distancePerFrame;

                    distancePerFrame = velocity * MILLISECOND_PER_FRAME;

                    clearInterval(swipIntervalHandel);
                    swipIntervalHandel = setInterval(function() {
                        var pos;

                        distancePerFrame *= FRICTION_COEFFICIENT;
                        if (distancePerFrame < 1 && distancePerFrame > -1) {
                            clearInterval(swipIntervalHandel);
                            return;
                        }
                        pos = self._scroll($targetElement) - distancePerFrame;
                        if (pos < 0) {
                            clearInterval(swipIntervalHandel);
                            return;
                        }
                        self._scroll($targetElement, pos);
                        self._setSliderPosFromTarget();
                    }, MILLISECOND_PER_FRAME);
                }
                $targetElement.on('touchstart', function(event) {
                    if (event.originalEvent.targetTouches.length === 1) {
                        //Clear any ongoing inertia animation
                        clearInterval(swipIntervalHandel);
                        touchPos = self._touchSinglePagePos(event);
                        eventForSwipeLatest = {
                            position: touchPos,
                            time: event.timeStamp
                        };
                    }
                }).on('touchmove', function(event) {
                    var originaltouchPos;
                    if (touchPos) {
                        originaltouchPos = touchPos;
                        touchPos = self._touchSinglePagePos(event);
                        self._scroll($targetElement, self._scroll($targetElement) - touchPos + originaltouchPos);
                        self._setSliderPosFromTarget();
                        event.preventDefault();

                        eventForSwipeOneBeforeLatest = eventForSwipeLatest;
                        eventForSwipeLatest = {
                            position: touchPos,
                            time: event.timeStamp
                        };
                    }
                }).on('touchend touchcancel', function(event) {
                    var timeDelta = eventForSwipeLatest.time - eventForSwipeOneBeforeLatest.time;
                    var posDelta = eventForSwipeLatest.position - eventForSwipeOneBeforeLatest.position;
                    var velocity = posDelta / timeDelta;
                    inertiaAnimator(velocity);
                    touchPos = undefined;
                });
            };

            self.init = function() {
                if (minSliderSize === undefined || minSliderSize === null) {
                    minSliderSize = self._MINIMUM_SLIDER_SIZE;
                }

                self._updateSliderSize();

                setInterval(function() {
                    self._updateSliderSize();
                }, 100);

                //fetch the slider pos for resizing
                self._$slider.on('mousedown touchstart', function(event) {
                    self._mousePosRelativeToSlider = self._offsetEvent(event);
                    event.stopPropagation();
                    self._disableSelection();
                    return event.preventDefault();
                });

                self._$body.on('mouseup touchend', self._disableScrolling).
                on('mousemove touchmove', function(event) {
                    var newSliderPos;
                    if (self._mousePosRelativeToSlider) {
                        self._disableSelection();
                        newSliderPos = self._page(event) - self._offsetElement(self._$sliderBed) - self._mousePosRelativeToSlider;
                        self._setSliderPos(newSliderPos);
                        return event.preventDefault();
                    }
                }).
                mouseleave(self._disableScrolling);

                //jump click
                $scrollbar.find('.slider-bed').on('mousedown touchstart', function(event) {
                    var newSliderPos;
                    self._mousePosRelativeToSlider = self._size(self._$slider) / 2;
                    newSliderPos = self._offsetEvent(event) - self._mousePosRelativeToSlider;
                    self._setSliderPos(newSliderPos);
                });

                $scrollbar.find('.left-arrow, .top-arrow').on('mousedown touchstart', function() {
                    var interval;
                    self._stopArrowMouseDown = false;
                    self._decreaseArrow();
                    self._disableSelection();
                    interval = setInterval(function() {
                        if (self._stopArrowMouseDown || self._decreaseArrow()) {
                            clearInterval(interval);
                        }
                    }, self._CONST_MOVE_MIL);
                });

                $scrollbar.find('.right-arrow, .bottom-arrow').on('mousedown touchstart', function() {
                    var interval;
                    self._stopArrowMouseDown = false;
                    self._increaseArrow();
                    self._disableSelection();
                    interval = setInterval(function() {
                        if (self._stopArrowMouseDown || self._increaseArrow()) {
                            clearInterval(interval);
                        }
                    }, self._CONST_MOVE_MIL);
                });

                if ($targetElement.mousewheel) {
                    $targetElement.mousewheel(function(event) {
                        var delta = self._mousewheelDelta(event),
                            edgeReached;

                        if (!isHorizontal) {
                            //detect invert scrolling on mac safari
                            if (event.originalEvent.webkitDirectionInvertedFromDevice) {
                                delta *= -1;
                            } else if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
                                delta *= -1;
                            }
                        } else {
                            if (event.originalEvent.webkitDirectionInvertedFromDevice === false) {
                                delta *= -1;
                            } else if (navigator.platform.toUpperCase().indexOf('MAC') < 0) {
                                delta *= -1;
                            }
                        }
                        edgeReached = self._setSliderPos(self._currentSliderPos + delta * (event.deltaFactor / 4));
                        if (!edgeReached) {
                            event.preventDefault();
                        }
                    });
                }

                self._targetElementTouchInit();
            };
        }

        if (isHorizontal) {
            Scrollbar.prototype = horizontalHelper;
        } else {
            Scrollbar.prototype = verticalHelper;
        }

        (new Scrollbar()).init();
    }

    return this;
};
