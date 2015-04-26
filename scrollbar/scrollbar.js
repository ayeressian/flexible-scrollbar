$.fn.scrollbar = function(targetElement, isHorizontal, minSliderSize) {
    'use strict';
    var $targetElement = $(targetElement);
    $targetElement.css('overflow', 'hidden');

    function scrollbar($scrollbar) {
        var $sliderBed = $scrollbar.find('.slider-bed'),
            $mainDiv,
            $slider = $sliderBed.find('.slider'),
            SLIDER_ARROW_AMOUNT = 15,
            CONST_MOVE_MIL = 75,
            MINIMUM_SLIDER_SIZE = 40,
            currentSliderPos,
            stopArrowMouseDown = false,
            mousePosRelativeToSlider,
            helper,
            sliderBedSize,
            sliderSize,
            $body = $(document.body);

        if (minSliderSize === undefined || minSliderSize === null) {
            minSliderSize = MINIMUM_SLIDER_SIZE;
        }

        function isTouchEvent(event) {
            var type;
            event = $.Event(event);
            type = event.type;
            return type === 'touchstart' ||
                type === 'touchmove' ||
                type === 'touchend' ||
                type === 'touchcancel';
        }

        helper = (function() {
            if (!isHorizontal) {
                return {
                    size: function($element, size) {
                        if (size) {
                            return $element.height(size);
                        }
                        return $element.height();
                    },
                    scrollSize: function($element) {
                        return $element.prop('scrollHeight');
                    },
                    position: function($element, position) {
                        if (position !== null && position !== undefined) {
                            return $element.css('top', position);
                        }
                        return $element.css('top');
                    },
                    touchSinglePagePos: function($event) {
                        var touch;
                        touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                        return touch.pageY;
                    },
                    offsetEvent: function($event) {
                        var touch, offsetY;
                        if (isTouchEvent($event)) {
                            touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                            offsetY = touch.pageY - $($event.target).offset().top;
                            return offsetY;
                        }
                        return $event.offsetY;
                    },
                    offsetElement: function($element) {
                        return $element.offset().top;
                    },
                    page: function($event) {
                        if (isTouchEvent($event)) {
                            var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                            return touch.pageY;
                        }
                        return $event.pageY;
                    },
                    scroll: function($element, amount) {
                        if (amount !== null && amount !== undefined) {
                            return $element.scrollTop(amount);
                        }
                        return $element.scrollTop();
                    },
                    positionRelParent: function($element) {
                        return $element.position().top;
                    },
                    mousewheelDelta: function($event) {
                        return $event.deltaY;
                    },
                    actual: function($element) {
                        return $element.actual('height');
                    }
                };
            }
            return {
                size: function($element, size) {
                    if (size) {
                        return $element.width(size);
                    }
                    return $element.width();
                },
                scrollSize: function($element) {
                    return $element.prop('scrollWidth');
                },
                position: function($element, position) {
                    if (position !== null && position !== undefined) {
                        return $element.css('left', position);
                    }
                    return $element.css('left');
                },
                touchSinglePagePos: function($event) {
                    var touch;
                    touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                    return touch.pageX;
                },
                offsetEvent: function($event) {
                    var touch, offsetX;
                    if (isTouchEvent($event)) {
                        touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                        offsetX = touch.pageX - $($event.target).offset().left;
                        return offsetX;
                    }
                    return $event.offsetX;
                },
                offsetElement: function($element) {
                    return $element.offset().left;
                },
                page: function($event) {
                    if (isTouchEvent($event)) {
                        var touch = $event.originalEvent.touches[0] || $event.originalEvent.changedTouches[0];
                        return touch.pageY;
                    }
                    return $event.pageX;
                },
                scroll: function($element, amount) {
                    if (amount !== null && amount !== undefined) {
                        return $element.scrollLeft(amount);
                    }
                    return $element.scrollLeft();
                },
                positionRelParent: function($element) {
                    return $element.position().left;
                },
                mousewheelDelta: function($event) {
                    return $event.deltaX;
                },
                actual: function($element) {
                    return $element.actual('width');
                }
            };
        })();

        function setSliderPosFromTarget() {
            var targetSliderCalculatedPos = helper.scroll($targetElement) / (helper.scrollSize($targetElement) - helper.size($targetElement));
            currentSliderPos = (sliderBedSize - sliderSize) * targetSliderCalculatedPos;
            helper.position($slider, currentSliderPos);
        }

        function updateSliderSize() {
            var scrollSize, targetElementRatio, targetSliderCalculatedPos;
            sliderBedSize = helper.size($sliderBed);
            scrollSize = helper.scrollSize($targetElement);
            targetElementRatio = helper.size($targetElement) / scrollSize;
            if (targetElementRatio >= 1 && targetElementRatio <= 0) {
                $scrollbar.css('display', 'none');
            }
            sliderSize = sliderBedSize * targetElementRatio;
            if (sliderSize < minSliderSize) {
                sliderSize = minSliderSize;
            }
            helper.size($slider, sliderSize);

            //Set scroll to its correct position after target size change
            setSliderPosFromTarget();
        }

        updateSliderSize();

        setInterval(function() {
            updateSliderSize();
        }, 100);

        function disableSelection() {
            $('*').attr('unselectable', 'on').addClass('unselectable')
                .addClass('default-cursor');
        }

        function enableSelection() {
            $('*').removeAttr('unselectable').removeClass('unselectable')
                .removeClass('default-cursor');
        }

        //fetch the slider pos for resizing
        $slider.on('mousedown touchstart', function(event) {
            mousePosRelativeToSlider = helper.offsetEvent(event);
            event.stopPropagation();
            disableSelection();
            return event.preventDefault();
        });

        function disableScrolling() {
            enableSelection();
            mousePosRelativeToSlider = null;
            stopArrowMouseDown = true;
        }

        $body.on('mouseup touchend', disableScrolling).
        on('mousemove touchmove', function(event) {
            var newSliderPos;
            if (mousePosRelativeToSlider) {
                disableSelection();
                newSliderPos = helper.page(event) - helper.offsetElement($sliderBed) - mousePosRelativeToSlider;
                setSliderPos(newSliderPos);
                return event.preventDefault();
            }
        }).
        mouseleave(disableScrolling);

        //jump click
        $scrollbar.find('.slider-bed').on('mousedown touchstart', function(event) {
            var newSliderPos;
            mousePosRelativeToSlider = helper.size($slider) / 2;
            newSliderPos = helper.offsetEvent(event) - mousePosRelativeToSlider;
            setSliderPos(newSliderPos);
        });

        function setSliderPos(sliderPos) {
            var edgeReached = false;

            if (sliderPos < 0) {
                sliderPos = 0;
                edgeReached = true;
            } else {
                if (sliderPos > sliderBedSize - sliderSize) {
                    sliderPos = sliderBedSize - sliderSize;
                    edgeReached = true;
                }
            }
            helper.position($slider, sliderPos);

            function updateTargetScroll(sliderPos) {
                var sliderCalculatedPos = sliderPos / (sliderBedSize - sliderSize);
                helper.scroll($targetElement, (helper.scrollSize($targetElement) - helper.size($targetElement)) * sliderCalculatedPos);
            }

            updateTargetScroll(sliderPos);
            currentSliderPos = sliderPos;
            return edgeReached;
        }

        function decreaseArrow() {
            var newSliderPos = helper.positionRelParent($slider) - SLIDER_ARROW_AMOUNT;
            return setSliderPos(newSliderPos);
        }

        function increaseArrow() {
            var newSliderPos = helper.positionRelParent($slider) + SLIDER_ARROW_AMOUNT;
            return setSliderPos(newSliderPos);
        }

        $scrollbar.find('.left-arrow, .top-arrow').on('mousedown touchstart', function() {
            var interval;
            stopArrowMouseDown = false;
            decreaseArrow();
            interval = setInterval(function() {
                if (stopArrowMouseDown || decreaseArrow()) {
                    clearInterval(interval);
                }
            }, CONST_MOVE_MIL);
        });

        $scrollbar.find('.right-arrow, .bottom-arrow').on('mousedown touchstart', function() {
            var interval;
            stopArrowMouseDown = false;
            increaseArrow();
            interval = setInterval(function() {
                if (stopArrowMouseDown || increaseArrow()) {
                    clearInterval(interval);
                }
            }, CONST_MOVE_MIL);
        });

        $targetElement.mousewheel(function(event) {
            var delta = helper.mousewheelDelta(event);

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
            setSliderPos(currentSliderPos + delta * (event.deltaFactor / 4));
            event.preventDefault();
        });

        function targetElementTouchInit() {
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
                    pos = helper.scroll($targetElement) - distancePerFrame;
                    if (pos < 0) {
                        clearInterval(swipIntervalHandel);
                        return;
                    }
                    helper.scroll($targetElement, pos);
                    setSliderPosFromTarget();
                }, MILLISECOND_PER_FRAME);
            }
            $targetElement.on('touchstart', function(event) {
                if (event.originalEvent.targetTouches.length === 1) {
                    //Clear any ongoing inertia animation
                    clearInterval(swipIntervalHandel);
                    touchPos = helper.touchSinglePagePos(event);
                    eventForSwipeLatest = {
                        position: touchPos,
                        time: event.timeStamp
                    };
                }
            }).on('touchmove', function(event) {
                var originaltouchPos;
                if (touchPos) {
                    originaltouchPos = touchPos;
                    touchPos = helper.touchSinglePagePos(event);
                    helper.scroll($targetElement, helper.scroll($targetElement) - touchPos + originaltouchPos);
                    setSliderPosFromTarget();
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
        }

        targetElementTouchInit();
    }
    this.each(function() {
        var htmlUrl, $element = $(this);
        if (isHorizontal === true) {
            htmlUrl = 'scrollbar/scrollbar-horizontal.html';
        } else {
            htmlUrl = 'scrollbar/scrollbar-vertical.html';
        }

        $.get(htmlUrl)
            .success(function(html) {
                $element.html(html);
                scrollbar($element);
            });
    });

    return this;
};
