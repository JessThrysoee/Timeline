/*jshint jquery:true, devel:true */
/*global scale, PubSub, EVENT_SLIDER_POSITION, EVENT_SLIDER_POSITION_RIGHT, EVENT_SLIDER_POSITION_LEFT, */

function slidermask() {
   var axis, mask, mouseArea, left, right;

   fn.position = function(values) {
      if (!arguments.length) return [left, right];
      left = values[0];
      right = values[1];
      return fn;
   };

   fn.redraw = function() {
      mask.css({
         'left': left,
         'width': right - left
      });
      mouseArea.css({
         'left': left,
         'width': right - left
      });
   };

   function bind() {
      var win, body;

      win = $(window);
      body = $('body');

      mouseArea.bind('mousedown.slidermask', function(e) {
         var bounds, axisLeft, axisWidth, mouseAreaWidth, diff;

         e.preventDefault();

         axisLeft = axis.offset().left;
         axisWidth = axis.width();

         mouseAreaWidth = mouseArea.width();

         diff = e.pageX - mouseArea.offset().left;

         bounds = scale().domain(axisLeft + diff, axisLeft + axisWidth - (mouseAreaWidth - diff)).range(0, axisWidth - mouseAreaWidth).clamp(true, true);

         body.addClass('ew-resize');

         win.bind('mousemove.slidermask', function(e) {
            var newleft = bounds(e.pageX);

            fn.position([newleft, newleft + mouseAreaWidth]);

            publish();
            fn.redraw();
         });

         win.bind('mouseup.slidermask', function() {
            win.unbind('mousemove.slidermask');
            win.unbind('mouseup.slidermask');
            body.removeClass('ew-resize');
         });

      });
   }

   function publish() {
      PubSub.publishSync(EVENT_SLIDER_POSITION, fn.position());
   }

   function subscribe() {
      PubSub.subscribe(EVENT_SLIDER_POSITION, function(msg, data) {
         var pos = fn.position();

         if (msg === EVENT_SLIDER_POSITION_LEFT) {
            pos[0] = data;
            fn.position(pos);
         } else if (msg === EVENT_SLIDER_POSITION_RIGHT) {
            pos[1] = data;
            fn.position(pos);
         } else {
            fn.position(data);
         }
         fn.redraw();
      });
   }

   function fn(selector) {
      axis = $(selector);

      mask = $('.axis-rulers-white-bg');
      mouseArea = $('.axis-rulers-white-bg-mouse');

      bind();
      subscribe();
      fn.redraw();
   }

   return fn;

}
