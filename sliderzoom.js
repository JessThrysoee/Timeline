
function sliderzoom() {
   var axis;

   function bind() {
      var zoomArea, win, body;

      win = $(window);
      body = $('body');
      zoomArea = $('.overview .lines .zoom-area');

      zoomArea.bind('mousedown.zoomRect', function(e) {
         var zoomRect, first, pageX, offsetX, axisLeft, axisWidth, bounds;

         e.preventDefault();

         axisLeft = axis.offset().left;
         axisWidth = axis.width();
         //offsetX = zoomArea.offset().left;

         zoomRect = $('<div/>').addClass('zoom-rect').appendTo(zoomArea);

         bounds = scale().domain(axisLeft, axisLeft + axisWidth).range(0, axisWidth).clamp(true, true);

         first = bounds(e.pageX);

         body.addClass('ew-resize');

         win.bind('mousemove.zoomRect', function(e) {
            var second;

            second = bounds(e.pageX);

            zoomRect.css({
               left: Math.min(first, second),
               width: Math.abs(first - second)
            });
         });

         win.bind('mouseup.zoomRect', function() {
            var left, width;

            win.unbind('mousemove.zoomRect');
            win.unbind('mouseup.zoomRect');

            left = zoomRect.position().left;
            width = zoomRect.width();

            // guard against click
            if (width > 10) {
               PubSub.publish(EVENT_SLIDER_POSITION, [left, left + width]);
            }

            zoomRect.remove();
            body.removeClass('ew-resize');
         });

      });
   }

   function fn(selector) {
      axis = $(selector);
      bind();
   }

   return fn;
}

