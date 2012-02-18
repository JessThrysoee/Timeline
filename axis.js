/*jshint jquery:true, bitwise:false, devel:true */
/*global formatTime*/

/*
 * Constructor
 */

function TimeAxis(options) {
   var defaults, self = this;

   defaults = {
      //redrawEvents: 'resized.sidebar',
      withTickLabels: true,
      withRulers: false,
      getWidth: null // used to follow width of '.details .lines' with scrollbar
   };

   options = $.extend({}, defaults, options);

   this.axis = options.axis;
   this.getWidth = options.getWidth;
   this.timeStart = options.timeStart;
   this.timeElapsed = options.timeElapsed;

   this.withTickLabels = options.withTickLabels;
   this.withRulers = options.withRulers;

   this.tickCount = 0;
   this.tickLengthPreferred = 65;

   this.draw();

   if (options.withRulers) {
      this.addRulers();
   }

   // redraw on custom events
   if (options.redrawEvents) {
      $(window).bind(options.redrawEvents, function (e) {
         self.draw();
      });
   }

   // redraw on window resize
   $(window).bind('resize', function (e) {
      self.draw();
   });
}

TimeAxis.Namespace = '.timeaxis';
TimeAxis.RulerEvent = 'ruler' + TimeAxis.Namespace;


/*
 * Prototype
 */
TimeAxis.prototype = {

   /*
    *  draw ticks and calculate tick labels
    */
   draw: function (force) {
      var i, tickContainer, axisWidth, tick, tickValue, tickCountNew, tickLengthInPercent;

      if (this.getWidth) {
         axisWidth = this.getWidth();
         this.axis.css('width', axisWidth);
      } else {
         axisWidth = this.axis.width();
      }

      tickCountNew = ~~ (axisWidth / this.tickLengthPreferred);

      if (!force && this.tickCount === tickCountNew) {
         return;
      }

      this.tickCount = tickCountNew;
      tickLengthInPercent = 100 / this.tickCount;


      tickContainer = this.axis.find('.tick-container');

      if (tickContainer.length > 0) {
         tickContainer.remove();
      }
      tickContainer = $('<div/>').addClass('tick-container');

      for (i = 1; i <= this.tickCount; i++) {
         tick = $('<div/>', {
            'class': 'tick',
            css: {
               left: i * tickLengthInPercent + '%'
            }
         });

         if (i === this.tickCount) {
            tick.addClass('last');
         }

         if (this.withTickLabels) {
            tickValue = this.timeStart + (this.timeElapsed * i * tickLengthInPercent / 100);
            $('<div/>').text(formatTime(tickValue)).addClass('label').appendTo(tick);
         }
         tick.appendTo(tickContainer);
      }

      this.axis.prepend(tickContainer);
   },


   /*
    * redraw axis with new boundaries
    */
   setTime: function (timeStart, timeElapsed) {
      this.timeStart = timeStart;
      this.timeElapsed = timeElapsed;
   },


   /*
    * convert to % of axisWidth
    */

   toPercent: function (pxValue, axisWidth) {
      return (pxValue * 100 / axisWidth) + '%';
   },


   addZoomRect: function () {
      var self, lines, win;

      self = this;
      win = $(window);
      lines = $('.overview .lines');

      lines.bind('mousedown.zoomRect', function (e) {

         var zoomRect, pageX, offsetX, axisWidth;
         e.preventDefault();

         axisWidth = self.axis.width();
         offsetX = lines.offset().left;

         zoomRect = $('<div/>').addClass('zoom-rect').appendTo(lines);
         pageX = e.pageX;

         zoomRect.css({
            left: pageX - offsetX
         });

         win.bind('mousemove.zoomRect', function (e) {
            var top, left, width, height;

            width = Math.abs(e.pageX - pageX);

            if (e.pageX > pageX) {
               left = pageX - offsetX;
               if (left + width > axisWidth) {
                  width = axisWidth - left;
               }
            } else {
               left = e.pageX - offsetX;
               if (left < 0) {
                  left = 0;
                  width = pageX - offsetX;
               }
            }

            zoomRect.css({
               left: left,
               width: width
            });

         });

         win.bind('mouseup.zoomRect', function () {
      var whiteBackground, axisRulers;
            win.unbind('mousemove.zoomRect');
            win.unbind('mouseup.zoomRect');

            console.log('axisWidth', axisWidth);
            console.log(zoomRect.position().left);
            console.log(zoomRect.width());

      whiteBackground = $('.axis-rulers-white-bg');
      axisRulers = $('.axis-rulers');

      var newLeft = self.toPercent(zoomRect.position().left, axisWidth);
      var newRight = self.toPercent(axisWidth - (zoomRect.position().left + zoomRect.width()), axisWidth);

      console.log(newLeft);
      console.log(newRight);

         whiteBackground.css('left', newLeft);
         axisRulers.css('left', newLeft);
         whiteBackground.css('right', newRight);
         axisRulers.css('right', newRight);
         //self.triggerRulerEvent(leftPos, rightPos, axisWidth);

            zoomRect.remove();
         });

      });


   },

   /*
    * add sliders and rulers
    */
   addRulers: function () {
      var self, id, whiteBackground, axisRulers;

      self = this;

      whiteBackground = $('.axis-rulers-white-bg');
      axisRulers = $('.axis-rulers');

      this.addZoomRect();

      // Left slider
      id = 'axis-ruler-slider-left';
      this.sliderLeft = $('<div/>').attr('id', id).addClass('axis-ruler-slider left');

      this.bindSlider(this.sliderLeft, id, function () {
         // from beginning of axis...
         return 0;
      }, function () {
         // ...to right slider
         return self.sliderRight.position().left;
      }, function (left, right) {
         whiteBackground.css('left', left);
         axisRulers.css('left', left);
      });

      // Right slider
      id = 'axis-ruler-slider-right';
      this.sliderRight = $('<div/>').attr('id', id).addClass('axis-ruler-slider right');

      this.bindSlider(this.sliderRight, id, function () {
         // from left slider...
         return self.sliderLeft.position().left;
      }, function () {
         // ...to end of axis
         return self.axis.width();
      }, function (left, right) {
         whiteBackground.css('right', right);
         axisRulers.css('right', right);
      });

      this.sliderLeft.appendTo(this.axis);
      this.sliderRight.appendTo(this.axis);
   },


   /*
    *
    */
   updateSlider: function (slider, newLeft, axisWidth, updateBackgroundAndRulersFn) {
      var newRight, leftPos, rightPos;

      newRight = this.toPercent(axisWidth - newLeft, axisWidth);
      newLeft = this.toPercent(newLeft, axisWidth);
      slider.css('left', newLeft);

      updateBackgroundAndRulersFn(newLeft, newRight);

      leftPos = this.sliderLeft.position().left;
      rightPos = this.sliderRight.position().left;

      this.triggerRulerEvent(leftPos, rightPos, axisWidth);
   },


   /**
    * clear debounce timer
    */
   clearTimeout: function () {
      if (this.timeout) {
         clearTimeout(this.timeout);
         this.timeout = null;
      }
   },

   /*
    *
    */
   triggerRulerEvent: function (sliderLeftPos, sliderRightPos, axisWidth) {
      var self = this;

      // debounce trigger
      this.clearTimeout();
      this.timeout = setTimeout(function () {
         self.clearTimeout();
         self.axis.trigger(TimeAxis.RulerEvent, {
            timeStart: self.timeStart + sliderLeftPos * self.timeElapsed / axisWidth,
            timeElapsed: (sliderRightPos - sliderLeftPos) * self.timeElapsed / axisWidth
         });
      }, 300);
   },


   /*
    * bind mouse events to sliders. Trigger 'resized.ruler' event.
    */
   bindSlider: function (slider, id, getMinBoundFn, getMaxBoundFn, updateBackgroundAndRulersFn) {
      var self, axis, body, win;

      self = this;

      win = $(window);
      body = $('body');
      axis = this.axis;

      slider.bind('mousedown.' + id, function (e) {
         var axisOffset, axisWidth, minBound, maxBound;

         e.preventDefault();

         axisWidth = axis.width();
         axisOffset = axis.offset().left;

         minBound = getMinBoundFn();
         maxBound = getMaxBoundFn();

         body.addClass('col-resize');

         win.bind('mousemove.' + id, function (e) {
            var newLeft;

            if (e.pageX < axisOffset + minBound) {
               newLeft = minBound;
            } else if (e.pageX > axisOffset + maxBound) {
               newLeft = maxBound;
            } else {
               newLeft = e.pageX - axisOffset;

               if (newLeft < minBound) {
                  newLeft = minBound;
               } else if (newLeft > maxBound) {
                  newLeft = maxBound;
               }
            }

            self.updateSlider(slider, newLeft, axisWidth, updateBackgroundAndRulersFn);
         });

         win.bind('mouseup.' + id, function () {
            win.unbind('mousemove.' + id);
            win.unbind('mouseup.' + id);
            body.removeClass('col-resize');
         });

      });
   }

};
