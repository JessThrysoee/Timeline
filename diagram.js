/*global Raphael, formatTimestamp, formatTime, formatBytes*/

function createDiagram(element, metric) {
   var r;

   r = new Raphael(element, 562, 378);
   main();
   return r;

   function machineBox(x, y, w, h, label) {
      var rect, text, cx, cy;

      cx = x + w / 2;
      cy = y + 23;

      rect = r.rect(x, y, w, h);
      rect.attr({
         //fill: 'rgba(99, 184, 163, 0.7)'
         fill: 'rgb(214, 221, 229)'
      });

      text = r.text(cx, cy, label);
      text.attr({
         'font-size': '12px'
      });
   }

   function processBox(x, y, h) {
      var rect;

      rect = r.rect(x - 5, y, 10, h);
      rect.attr({
         'fill': '#FFF',
         //stroke: 'rgb(99, 184, 163)'
         //stroke: 'rgb(214, 221, 229)'
         stroke: 'rgb(153, 153, 153)'
      });

   }

   function dashedVertical(x, y, l) {
      r.path('M' + x + ',' + y + 'v' + l).attr({
         'stroke-dasharray': '--'
      });
   }

   function rightArrow() {
      return 'l-10,5m10,-5l-10,-5';
   }

   function leftArrow() {
      return 'l10,5m-10,-5l10,-5';
   }

   //  t1            t2
   //  --------------->
   //  t3            t4
   function request(x, y, l, t1, tip1, t2, tip2, t3, tip3, t4, tip4) {
      var xoff, yoff;

      xoff = 3;
      yoff = 15;

      r.path('M' + x + ',' + y + 'h' + l + rightArrow());

      r.text(x + xoff, y - yoff, t1).attr({
         'font-size': '11px',
         'text-anchor': 'start',
         'title': tip1
      });

      // above arrow
      r.text(x + l - xoff, y - yoff, t2).attr({
         'font-size': '11px',
         'text-anchor': 'end',
         'title': tip2
      });

      if (t3) {
         r.text(x + xoff, y + yoff, t3).attr({
            'font-size': '11px',
            'text-anchor': 'start',
            'title': tip3
         });
      }

      // below arrow
      if (t4) {
         r.text(x + l - xoff, y + yoff, t4).attr({
            'font-size': '11px',
            'text-anchor': 'end',
            'title': tip4
         });
      }
   }

   //  t2            t1
   //  <---------------
   //  t4            t3
   //  t5
   function response(x, y, l, t1, tip1, t2, tip2, t3, tip3, t4, tip4, t5, tip5) {
      var xoff, yoff;

      xoff = 3;
      yoff = 15;

      r.path('M' + x + ',' + y + 'h-' + l + leftArrow());

      r.text(x - xoff, y - yoff, t1).attr({
         'font-size': '11px',
         'text-anchor': 'end',
         'title': tip1
      });

      // above arrow
      r.text(x - l + xoff, y - yoff, t2).attr({
         'font-size': '11px',
         'text-anchor': 'start',
         'title': tip2
      });

      if (t3) {
         r.text(x - xoff, y + yoff, t3).attr({
            'font-size': '11px',
            'text-anchor': 'end',
            'title': tip3
         });
      }

      // 1. below arrow
      if (t4) {
         r.text(x - l + xoff, y + yoff, t4).attr({
            'font-size': '11px',
            'text-anchor': 'start',
            'title': tip4
         });
      }

      // 2. below arrow
      if (t5) {
         r.text(x - l + xoff, y + (2*yoff) + 2, t5).attr({
            'font-size': '11px',
            'text-anchor': 'start',
            'title': tip5
         });
      }
   }


   function main() {
      var x, y, boxW, boxH, arrowX, arrowL, processUnit, t1, t2, t3, t4, t5, tip1, tip2, tip3, tip4, tip5;

      x = 30.5;
      y = 30.5;
      boxW = 100;
      boxH = 36;
      arrowX = 7;
      arrowL = 14;
      processUnit = 20;

      // client box
      machineBox(x, y, boxW, boxH, 'client');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + processUnit, 12 * processUnit);

      t1 = formatTimestamp(metric.timestamp);
      t2 = formatTimestamp(metric.meta['webserver-nearside-timestamp'] + metric.meta['client-webserver-offset']);
      t3 = formatBytes(metric.meta.tx);
      t4 = formatTime((metric.meta['webserver-nearside-timestamp'] + metric.meta['client-webserver-offset']) - metric.timestamp);
      tip1 = 'send timestamp';
      tip2 = 'receive timestamp';
      tip3 = 'request size';
      tip4 = 'calculated elapsed time for request';
      // request from client to webserver
      request(x + (boxW / 2) + arrowX, y + boxH + (3 * processUnit), 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);

      // webserver box
      x += (2 * boxW);
      machineBox(x, y, boxW, boxH, 'webserver');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + 3 * processUnit, 8 * processUnit);

      t1 = formatTimestamp(metric.meta['webserver-farside-timestamp'] + metric.meta['client-webserver-offset']);
      t2 = formatTimestamp(metric.meta['server-timestamp'] + metric.meta['client-webserver-offset'] + metric.meta['webserver-server-offset']);
      t3 = formatTime(metric.meta['webserver-farside-timestamp'] - metric.meta['webserver-nearside-timestamp']);
      t4 = formatTime((metric.meta['server-timestamp'] + metric.meta['webserver-server-offset']) - metric.meta['webserver-farside-timestamp']);
      tip1 = 'send timestamp';
      tip2 = 'receive timestamp';
      tip3 = 'elapsed time on webserver since request was received from client';
      tip4 = 'calculated elapsed time for request';
      // request from webserver to server
      request(x + (boxW / 2) + arrowX, y + boxH + (5 * processUnit), 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);

      t1 = formatTime(metric.meta['webserver-nearside-elapsed']);
      t2 = formatTime(metric.elapsed);
      t3 = formatTime( (metric.meta['webserver-nearside-timestamp'] + metric.meta['webserver-nearside-elapsed']) - (metric.meta['webserver-farside-timestamp'] + metric.meta['webserver-farside-elapsed']));
      t4 = formatTime((metric.timestamp + metric.elapsed) - (metric.meta['webserver-nearside-timestamp'] + metric.meta['webserver-nearside-elapsed']+ metric.meta['client-webserver-offset']));
      t5 = formatBytes(metric.meta.rx);
      tip1 = 'elapsed time since request was received from client';
      tip2 = 'elapsed time since request was sent from client';
      tip3 = 'elapsed time on webserver since response was received from server';
      tip4 = 'calculated elapsed time for response';
      tip5 = 'respnse size';
      // response from webserver to client
      response(x + (boxW / 2) - arrowX, y + boxH + (11 * processUnit) - 1, 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4, t5, tip5);

      // server box
      x += (2 * boxW);
      machineBox(x, y, boxW, boxH, 'server');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + 5 * processUnit, 4 * processUnit);

      t1 = formatTime(metric.meta['server-elapsed']);
      t2 = formatTime(metric.meta['webserver-farside-elapsed']);
      t3 = null;
      t4 = formatTime((metric.meta['webserver-farside-timestamp'] + metric.meta['webserver-farside-elapsed']) - (metric.meta['server-timestamp'] + metric.meta['server-elapsed'] + metric.meta['webserver-server-offset']));
      tip1 = 'elapsed time on server';
      tip2 = 'elapsed time since request was sent to server';
      tip3 = null;
      tip4 = 'calculated elapsed time for response';
      // response from server to webserver
      response(x + (boxW / 2) - arrowX, y + boxH + (9 * processUnit) - 1, 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);
   }
}
