/*jshint jquery:true, devel:true */
/*global scale, PubSub*/

var EVENT_SLIDER_POSITION = 'EventSliderPosition';

function slider() {
   var sliderElem, position, axis, id, minBound, maxBound;

   fn.bounds = function(min, max) {
      if (!arguments.length) return [minBound, maxBound];
      minBound = min;
      maxBound = max;
      return fn;
   };

   fn.position = function(value) {
      if (!arguments.length) return position;
      position = value;
      return fn;
   };

   fn.redraw = function() {
      sliderElem.css('left', position);
   };

   function bind() {
      var body, win;

      win = $(window);
      body = $('body');

      sliderElem.bind('mousedown.' + id, function(e) {
         var axisOffset, bounds;

         e.preventDefault();

         axisOffset = axis.offset().left;

         bounds = scale().domain(axisOffset + minBound, axisOffset + maxBound).range(minBound, maxBound).clamp(true, true);

         body.addClass('col-resize');

         win.bind('mousemove.' + id, function(e) {
            position = bounds(e.pageX);
            fn.redraw();
         });

         win.bind('mouseup.' + id, function() {
            win.unbind('mousemove.' + id);
            win.unbind('mouseup.' + id);
            body.removeClass('col-resize');

            PubSub.publish(EVENT_SLIDER_POSITION, {id: id, position: position});
         });

      });
   }

   function fn(selector, postfixId) {
      var prefixId;

      axis = $(selector);
      prefixId = 'axis-ruler-slider';

      id = prefixId + '-' + postfixId;

      sliderElem = $('<div/>').attr('id', id).addClass(prefixId).addClass(postfixId).appendTo(axis);

      bind();
      fn.redraw();

      PubSub.subscribe(EVENT_SLIDER_POSITION, function (msg, data) {
         if (data.id === id) return;

         if (data.position < position) {
            // I'm the right slider
            fn.bounds(data.position, maxBound);
         } else {
            fn.bounds(minBound, data.position);
         }
      });
   }

   return fn;
}
