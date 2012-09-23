/*jshint jquery:true, devel:true */
/*global scale, PubSub, SLIDER_LEFT, EVENT_SLIDER_POSITION, EVENT_SLIDER_POSITION_RIGHT, EVENT_SLIDER_POSITION_LEFT, */

function slider() {
   var sliderElem, position, axis, minBound, maxBound, side;

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
      var body, win, id;

      win = $(window);
      body = $('body');

      id = 'slider' + side;

      sliderElem.bind('mousedown.' + id, function(e) {
         var off, bounds;

         e.preventDefault();

         off = axis.offset().left;

         bounds = scale().domain(off + minBound, off + maxBound).range(minBound, maxBound).clamp(true, true);

         body.addClass('col-resize');

         win.bind('mousemove.' + id, function(e) {
            position = bounds(e.pageX);
            publish();
            fn.redraw();
         });

         win.bind('mouseup.' + id, function() {
            win.unbind('mousemove.' + id);
            win.unbind('mouseup.' + id);
            body.removeClass('col-resize');
         });

      });
   }

   function publish() {
      var msg;
      msg = side === SLIDER_LEFT ? EVENT_SLIDER_POSITION_LEFT : EVENT_SLIDER_POSITION_RIGHT;
      PubSub.publishSync(msg, fn.position());
   }

   function subscribe() {
      PubSub.subscribe(EVENT_SLIDER_POSITION, function(msg, data) {

         if (msg === EVENT_SLIDER_POSITION_LEFT) {
            // left slider moved so update right slider bounds
            fn.bounds(data, maxBound);
         } else if (msg === EVENT_SLIDER_POSITION_RIGHT) {
            // left slider moved so update left slider bounds
            fn.bounds(minBound, data);
         } else {
            // move slider
            fn.position(data[side === SLIDER_LEFT ? 0 : 1]);
            fn.redraw();
         }
      });
   }

   function fn(selector, _side) {
      side = _side;
      axis = $(selector);

      sliderElem = $('<div/>').addClass(side).addClass('axis-ruler-slider').appendTo(axis);

      bind();
      subscribe();
      fn.redraw();
   }

   return fn;
}
