
function sliderrulers() {
   var rulers;

   fn.width = function(value) {
      if (!arguments.length) return width;
      width = value;
      return fn;
   }

   function subscribe() {
      PubSub.subscribe(EVENT_SLIDER_POSITION, function(msg, data) {
         console.log(data);
         if (msg === EVENT_SLIDER_POSITION_LEFT) {
            rulers.css('left', data);
         } else if (msg === EVENT_SLIDER_POSITION_RIGHT) {
            rulers.css('right', data);
         } else {
            rulers.css({'left': data[0], 'right': data[1]});
         }
      });
   }

   function fn(selector) {
      rulers = $('.overview .lines .axis-rulers');
      subscribe();
   }

   return fn;
}

