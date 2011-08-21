/*jshint jquery:true, devel:true */

/*
 * Bind mouse events to sidebar resizer element.
 *
 * Trigger 'resized.sidebar-resizer' event on move.
 */

function SidebarResizer(resizerElement, minBound) {
   this.resizer = resizerElement;
   this.body = $('body');
   this.minBound = minBound;

   this.bind();
}

SidebarResizer.Namespace = '.sidebar-resizer';
SidebarResizer.ResizedEvent = 'resized' + SidebarResizer.Namespace;

SidebarResizer.prototype = {

   bind: function () {
      var self, ns;

      self = this;
      ns = SidebarResizer.Namespace;

      this.resizer.bind('mousedown' + ns, function (e) {
         var prevPageX, parentWidth, maxBound;

         e.preventDefault();

         prevPageX = e.pageX;
         parentWidth = self.resizer.parent().width();
         maxBound = self.body.width() / 2;

         self.body.addClass('col-resize');

         self.body.bind('mousemove' + ns, function (e) {
            var newLeft, delta;

            if (e.pageX < self.minBound) {
               newLeft = self.minBound;
            } else if (e.pageX > maxBound) {
               newLeft = maxBound;
            } else {

               delta = e.pageX - prevPageX;
               prevPageX = e.pageX;

               newLeft = self.resizer.position().left + delta;
               if (newLeft < self.minBound) {
                  newLeft = self.minBound;
               } else if (newLeft > maxBound) {
                  newLeft = maxBound;
               }
            }

            self.resizer.css('left', newLeft);
            self.resizer.trigger('resized' + ns, newLeft);
         });

         self.body.bind('mouseup' + ns, function () {
            self.unbind();
         });

      });
   },

   unbind: function () {
      var ns = SidebarResizer.Namespace;

      this.body.unbind('mouseup' + ns);
      this.body.unbind('mousemove' + ns);
      this.body.removeClass('col-resize');
   }
};
