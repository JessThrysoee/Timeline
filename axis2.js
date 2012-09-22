/*jshint jquery:true, bitwise:false, devel:true */
/*global formatTime*/


function axis() {
   var width, minTime, maxTime, labels, axis;


   fn.width = function(value) {
      if (!arguments.length) return width;
      width = value;
      return fn;
   }

   fn.minTime = function(value) {
      if (!arguments.length) return minTime;
      minTime = value;
      return fn;
   }

   fn.maxTime = function(value) {
      if (!arguments.length) return maxTime;
      maxTime = value;
      return fn;
   }

   fn.labels = function(value) {
      if (!arguments.length) return labels;
      labels = value;
      return fn;
   }

   fn.redraw = function() {
      var count, container, percent, time, tickWidth = 65;

      c = ~~ (width / tickWidth);

      if (c === count) {
         return;
      }

      count = c;

      percent = scale().domain(0, count).range(0, 100);
      time = scale().domain(0, count).range(minTime, maxTime);

      axis.find('.tick-container').remove();
      container = $('<div/>').addClass('tick-container');

      for (i = 1; i <= count; i++) {
         tick = $('<div/>').addClass('tick').css('left', percent(i) + '%');

         if (i === count) tick.addClass('last');

         if (labels) $('<div/>').text(formatTime(time(i))).addClass('label').appendTo(tick);

         tick.appendTo(container);
      }

      axis.prepend(container);
   }

   function fn(selector) {
      axis = $(selector);

      fn.redraw();
   }

   return fn;
}
