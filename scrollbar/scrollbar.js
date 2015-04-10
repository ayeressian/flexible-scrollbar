$.fn.scrollbar = function($targetElement, isHorizontal) {
    'use strict';

    $targetElement.css('overflow', 'hidden');

    function scrollbar   ($scrollbar) {
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
                    offsetEvent: function($event) {
                        return $event.offsetY;
                    },
                    offsetElement: function($element) {
                        return $element.offset().top;
                    },
                    page: function($event) {
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
                offsetEvent: function($event) {
                    return $event.offsetX;
                },
                offsetElement: function($element) {
                    return $element.offset().left;
                },
                page: function($event) {
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

        function updateSliderSize() {
            var scrollSize, targetElementRatio, targetSliderCalculatedPos;
            // actual operation is slow try to avoid it
            if ($scrollbar.css('display') === 'none') {
                sliderBedSize = helper.actual($sliderBed);
            } else {
                sliderBedSize = helper.size($sliderBed);
            }
            scrollSize = helper.scrollSize($targetElement);
            targetElementRatio = helper.size($targetElement) / scrollSize;
            if (targetElementRatio >= 1 && targetElementRatio <= 0) {
                $scrollbar.css('display', 'none');
            }
            sliderSize = sliderBedSize * targetElementRatio;
            if (sliderSize < MINIMUM_SLIDER_SIZE) {
                sliderSize = MINIMUM_SLIDER_SIZE;
            }
            helper.size($slider, sliderSize);

            //Set scroll to its correct position after target size change
            targetSliderCalculatedPos = helper.scroll($targetElement) / (helper.scrollSize($targetElement) - helper.size($targetElement));
            currentSliderPos = (sliderBedSize - sliderSize) * targetSliderCalculatedPos;
            helper.position($slider, currentSliderPos);
        }

        updateSliderSize();

        setInterval(function() {
            updateSliderSize();
        }, 100);

        //fetch the slider pos for resizing
        $slider.on('mousedown', function(event) {
            mousePosRelativeToSlider = helper.offsetEvent(event);
            event.stopPropagation();

            $('*').attr('unselectable', 'on').addClass('unselectable')
                .addClass('default-cursor');
        });

        function disableScrolling() {
            //Enable selection on drag
            $('*').removeAttr('unselectable').removeClass('unselectable')
                .removeClass('default-cursor');
            mousePosRelativeToSlider = null;
            stopArrowMouseDown = true;
        }

        $body.mouseup(disableScrolling).
        mousemove(function(event) {
            var newSliderPos;
            if (mousePosRelativeToSlider) {
                //Disable selection on drag

                newSliderPos = helper.page(event) - helper.offsetElement($sliderBed) - mousePosRelativeToSlider;
                setSliderPos(newSliderPos);
            }
        }).
        mouseleave(disableScrolling);

        //jump click
        $scrollbar.find('.slider-bed').on('mousedown', function(event) {
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

        $scrollbar.find('.left-arrow, .top-arrow').on('mousedown', function() {
            stopArrowMouseDown = false;
            var interval = setInterval(function() {
                if (stopArrowMouseDown || decreaseArrow()) {
                    clearInterval(interval);
                }
            }, CONST_MOVE_MIL);
        });

        $scrollbar.find('.right-arrow, .bottom-arrow').on('mousedown', function() {
            stopArrowMouseDown = false;
            var interval = setInterval(function() {
                if (stopArrowMouseDown || increaseArrow()) {
                    clearInterval(interval);
                }
            }, CONST_MOVE_MIL);
        });

        $targetElement.mousewheel(function(event) {
            var delta = helper.mousewheelDelta(event);
            if (!isHorizontal && event.webkitDirectionInvertedFromDevice) {
                delta *= -1;
            }
            setSliderPos(currentSliderPos + delta * event.deltaFactor);
            event.preventDefault();
        });

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
