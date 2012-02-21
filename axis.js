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
      this.markerLeft = 0;
      this.markerRight = this.axis.width();
      this.whiteBackground = $('.axis-rulers-white-bg');
      this.whiteBackgroundMouse = $('.axis-rulers-white-bg-mouse');
      this.axisRulers = $('.axis-rulers');

      this.markerLeftCb = $.Callbacks('stopOnFalse');
      this.markerLeftCb.add(this.markerUpdateLeft);
      this.markerLeftCb.add(this.whiteBackgroundUpdateLeft);
      this.markerLeftCb.add(this.axisRulersUpdateLeft);
      this.markerLeftCb.add(this.sliderUpdateLeft);
      this.markerLeftCb.add(this.rulerEventUpdate);

      this.markerRightCb = $.Callbacks('stopOnFalse');
      this.markerRightCb.add(this.markerUpdateRight);
      this.markerRightCb.add(this.whiteBackgroundUpdateRight);
      this.markerRightCb.add(this.axisRulersUpdateRight);
      this.markerRightCb.add(this.sliderUpdateRight);
      this.markerRightCb.add(this.rulerEventUpdate);

      this.addRulers();
   }

   // redraw on custom events
   if (options.redrawEvents) {
      $(window).bind(options.redrawEvents, function(e) {
         self.draw();
      });
   }

   // redraw on window resize
   $(window).bind('resize', function(e) {
      self.draw();
   });

}

TimeAxis.Namespace = '.timeaxis';
TimeAxis.RulerEvent = 'ruler' + TimeAxis.Namespace;


/*
 * Prototype
 */
TimeAxis.prototype = {

   markerUpdateLeft: function(value) {
      if (value === this.markerLeft) {
         // don't call all the other callbacks
         return false;
      }
      this.markerLeft = value;
   },

   markerUpdateRight: function(value) {
      if (value === this.markerRight) {
         // don't call all the other callbacks
         return false;
      }
      this.markerRight = value;
   },

   whiteBackgroundUpdateLeft: function() {
      var axisWidth, newLeft;

      axisWidth = this.axis.width();
      newLeft = this.toPercent(this.markerLeft, axisWidth);
      this.whiteBackground.css('left', newLeft);
      this.whiteBackgroundMouse.css('left', newLeft);
   },

   whiteBackgroundUpdateRight: function() {
      var axisWidth, newRight;

      axisWidth = this.axis.width();
      newRight = this.toPercent(axisWidth - this.markerRight, axisWidth);
      this.whiteBackground.css('right', newRight);
      this.whiteBackgroundMouse.css('right', newRight);
   },

   axisRulersUpdateLeft: function() {
      var axisWidth, newLeft;

      axisWidth = this.axis.width();
      newLeft = this.toPercent(this.markerLeft, axisWidth);
      this.axisRulers.css('left', newLeft);
   },

   axisRulersUpdateRight: function() {
      var axisWidth, newRight;

      axisWidth = this.axis.width();
      newRight = this.toPercent(axisWidth - this.markerRight, axisWidth);

      this.axisRulers.css('right', newRight);
   },

   sliderUpdateLeft: function() {
      var newLeft;
      newLeft = this.toPercent(this.markerLeft, this.axis.width());
      this.sliderLeft.css('left', newLeft);
   },

   sliderUpdateRight: function() {
      var newLeft;
      newLeft = this.toPercent(this.markerRight, this.axis.width());
      this.sliderRight.css('left', newLeft);
   },

   rulerEventUpdate: function() {
      // it ok that this is called both for left and right because of the debounce
      this.triggerRulerEvent(this.markerLeft, this.markerRight, this.axis.width());
   },

   /*
    *  draw ticks and calculate tick labels
    */
   draw: function(force) {
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
   setTime: function(timeStart, timeElapsed) {
      this.timeStart = timeStart;
      this.timeElapsed = timeElapsed;
   },


   /*
    * convert to % of axisWidth
    */

   toPercent: function(pxValue, axisWidth) {
      return (pxValue * 100 / axisWidth) + '%';
   },




   /*
    * add sliders and rulers
    */
   addRulers: function() {
      var self, id;

      self = this;

      this.addZoomRect();
      this.whiteBackgroundBind();

      // Left slider
      id = 'axis-ruler-slider-left';
      this.sliderLeft = $('<div/>').attr('id', id).addClass('axis-ruler-slider left');

      this.bindSlider(this.sliderLeft, id, this.markerLeftCb, function() {
         // from beginning of axis...
         return 0;
      }, function() {
         // ...to right slider
         return self.markerRight;
      });

      // Right slider
      id = 'axis-ruler-slider-right';
      this.sliderRight = $('<div/>').attr('id', id).addClass('axis-ruler-slider right');

      this.bindSlider(this.sliderRight, id, this.markerRightCb, function() {
         // from left slider...
         return self.markerLeft;
      }, function() {
         // ...to end of axis
         return self.axis.width();
      });

      this.sliderLeft.appendTo(this.axis);
      this.sliderRight.appendTo(this.axis);
   },

   /*
    * bind mouse events to sliders. Trigger 'resized.ruler' event.
    */
   bindSlider: function(slider, id, markerCb, getMinBoundFn, getMaxBoundFn) {
      var self, axis, body, win;

      self = this;

      win = $(window);
      body = $('body');
      axis = this.axis;

      slider.bind('mousedown.' + id, function(e) {
         var axisOffset, minBound, maxBound;

         e.preventDefault();

         axisOffset = axis.offset().left;

         minBound = getMinBoundFn();
         maxBound = getMaxBoundFn();

         body.addClass('col-resize');

         win.bind('mousemove.' + id, function(e) {
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

            markerCb.fire.call(self, newLeft);
         });

         win.bind('mouseup.' + id, function() {
            win.unbind('mousemove.' + id);
            win.unbind('mouseup.' + id);
            body.removeClass('col-resize');
         });

      });
   },

   addZoomRect: function() {
      var self, zoomArea, win, body;

      self = this;

      win = $(window);
      body = $('body');
      zoomArea = $('.overview .lines .zoom-area');

      zoomArea.bind('mousedown.zoomRect', function(e) {
         var zoomRect, pageX, offsetX, axisWidth;

         e.preventDefault();

         axisWidth = self.axis.width();
         offsetX = zoomArea.offset().left;

         zoomRect = $('<div/>').addClass('zoom-rect').appendTo(zoomArea);
         pageX = e.pageX;

         zoomRect.css({
            left: pageX - offsetX
         });

         body.addClass('ew-resize');

         win.bind('mousemove.zoomRect', function(e) {
            var left, width;

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

         win.bind('mouseup.zoomRect', function() {
            var newLeft, newRight, zoomRectLeft, zoomRectWidth;
            win.unbind('mousemove.zoomRect');
            win.unbind('mouseup.zoomRect');

            zoomRectLeft = zoomRect.position().left;
            zoomRectWidth = zoomRect.width();

            // guard against click
            if (zoomRectWidth > 10) {
               newLeft = zoomRectLeft;
               newRight = axisWidth - (axisWidth - (zoomRectLeft + zoomRectWidth));

               self.markerLeftCb.fire.call(self, newLeft);
               self.markerRightCb.fire.call(self, newRight);
            }

            zoomRect.remove();
            body.removeClass('ew-resize');
         });

      });
   },

   whiteBackgroundBind: function() {
      var self, whiteBackground, win, body;

      self = this;

      win = $(window);
      body = $('body');
      whiteBackground = this.whiteBackgroundMouse;

      whiteBackground.bind('mousedown.whiteBackground', function(e) {
         var pageX, width, axisWidth;

         e.preventDefault();

         axisWidth = self.axis.width();
         width = whiteBackground.width();

         pageX = e.pageX;

         body.addClass('ew-resize');

         win.bind('mousemove.whiteBackground', function(e) {
            var left, off;

            off = e.pageX - pageX;
            if (off > 0) {
               left = self.markerLeft + off;
               if (left + width > axisWidth) {
                  left = axisWidth - width;
               }
            } else {
               left = self.markerLeft + off;
               if (left < 0) {
                  left = 0;
               }
            }
            pageX = e.pageX;

            self.markerLeftCb.fire.call(self, left);
            self.markerRightCb.fire.call(self, left + width);
         });

         win.bind('mouseup.whiteBackground', function() {
            win.unbind('mousemove.whiteBackground');
            win.unbind('mouseup.whiteBackground');
            body.removeClass('ew-resize');
         });

      });
   },


   /**
    * clear debounce timer
    */
   clearTimeout: function() {
      if (this.timeout) {
         clearTimeout(this.timeout);
         this.timeout = null;
      }
   },

   /*
    *
    */
   triggerRulerEvent: function(sliderLeftPos, sliderRightPos, axisWidth) {
      var self = this;

      // debounce trigger
      this.clearTimeout();
      this.timeout = setTimeout(function() {
         self.clearTimeout();
         self.axis.trigger(TimeAxis.RulerEvent, {
            timeStart: self.timeStart + sliderLeftPos * self.timeElapsed / axisWidth,
            timeElapsed: (sliderRightPos - sliderLeftPos) * self.timeElapsed / axisWidth
         });
      }, 100);
   }

};
