/*global Raphael, formatTimestamp, formatTime, formatBytes*/

//var metric = {
//   url: 'http://newsgate.asv.local:7003/newsgate/Fit',
//   title: 'NewsPackagerUI-2709-103',
//   timestamp: 1329212902612,
//   elapsed: 48713,
//   meta: {
//      'internet-timestamp': 1329212903636,
//      'internet-elapsed': 47711,
//      'broker-timestamp': 1329212904636,
//      'broker-elapsed': 46710,
//      'server-timestamp': 1329212905614,
//      'server-elapsed': 45710,
//      'tx': 1013,
//      'rx': 3486
//   }
//};
//
//var clockOffsetServer = -2;
//var clockOffsetWebServer = -24;
//
//createDiagram(metric, clockOffsetWebServer, clockOffsetServer);

function createDiagram(element, metric, clockOffsetToWebServer, clockOffsetToServer) {
   var r;

   r = new Raphael(element, 562, 378);
   //r.rect(0.5, 0.5, 561, 377).attr({
   //   'stroke': '#000'
   //});
   console.log(metric);
   main();
   return r;

   function machineBox(x, y, w, h, label) {
      var rect, text, cx, cy;

      cx = x + w / 2;
      cy = y + 23;

      rect = r.rect(x, y, w, h);
      rect.attr({
         fill: 'rgba(99, 184, 163, 0.7)'
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
         stroke: 'rgb(99, 184, 163)'
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

   function request(x, y, l, label1, tooltip1, label2, tooltip2, label3, tooltip3, label4, tooltip4) {
      var xoff = 3,
         yoff = 15;

      r.path('M' + x + ',' + y + 'h' + l + rightArrow());

      r.text(x + xoff, y - yoff, label1).attr({
         'font-size': '11px',
         'text-anchor': 'start',
         'title': tooltip1
      });

      // above arrow
      r.text(x + l - xoff, y - yoff, label2).attr({
         'font-size': '11px',
         'text-anchor': 'end',
         'title': tooltip2
      });

      if (label3) {
         r.text(x + xoff, y + yoff, label3).attr({
            'font-size': '11px',
            'text-anchor': 'start',
            'title': tooltip3
         });
      }

      // below arrow
      if (label4) {
         r.text(x + l - xoff, y + yoff, label4).attr({
            'font-size': '11px',
            'text-anchor': 'end',
            'title': tooltip4
         });
      }
   }

   function response(x, y, l, label1, tooltip1, label2, tooltip2, label3, tooltip3, label4, tooltip4) {
      var xoff = 3,
         yoff = 15;

      r.path('M' + x + ',' + y + 'h-' + l + leftArrow());

      r.text(x - xoff, y - yoff, label1).attr({
         'font-size': '11px',
         'text-anchor': 'end',
         'title': tooltip1
      });

      // above arrow
      r.text(x - l + xoff, y - yoff, label2).attr({
         'font-size': '11px',
         'text-anchor': 'start',
         'title': tooltip2
      });

      if (label3) {
         r.text(x - xoff, y + yoff, label3).attr({
            'font-size': '11px',
            'text-anchor': 'end',
            'title': tooltip3
         });
      }

      // below arrow
      if (label4) {
         r.text(x - l + xoff, y + yoff, label4).attr({
            'font-size': '11px',
            'text-anchor': 'start',
            'title': tooltip4
         });
      }
   }


   function main() {
      var x, y, boxW, boxH, arrowX, arrowL, processUnit, t1, t2, t3, t4, tip1, tip2, tip3, tip4;

      x = 30.5;
      y = 30.5;
      boxW = 100;
      boxH = 36;
      arrowX = 7;
      arrowL = 14;

      processUnit = 20;

      machineBox(x, y, boxW, boxH, 'client');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + processUnit, 12 * processUnit);

      t1 = formatTimestamp(metric.timestamp);
      t2 = formatTimestamp(metric.meta['internet-timestamp'] + clockOffsetToWebServer);
      t3 = formatBytes(metric.meta.tx);
      t4 = formatTime((metric.meta['internet-timestamp'] + clockOffsetToWebServer) - metric.timestamp);
      tip1 = 'send timestamp';
      tip2 = 'receive timestamp';
      tip3 = 'request size';
      tip4 = 'calculated elapsed time for request';
      request(x + (boxW / 2) + arrowX, y + boxH + (3 * processUnit), 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);

      //
      x = x + (2 * boxW);
      machineBox(x, y, boxW, boxH, 'webserver');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + 3 * processUnit, 8 * processUnit);

      t1 = formatTimestamp(metric.meta['broker-timestamp'] + clockOffsetToWebServer);
      t2 = formatTimestamp(metric.meta['server-timestamp'] + clockOffsetToServer);
      t3 = formatTime(metric.meta['broker-timestamp'] - metric.meta['internet-timestamp']);
      t4 = formatTime((metric.meta['server-timestamp'] + clockOffsetToServer) - (metric.meta['internet-timestamp'] + clockOffsetToWebServer));
      tip1 = 'send timestamp';
      tip2 = 'receive timestamp';
      tip3 = 'elapsed time on webserver since request was received from client';
      tip4 = 'calculated elapsed time for request';

      request(x + (boxW / 2) + arrowX, y + boxH + (5 * processUnit), 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);

      //
      t1 = formatTime(metric.meta['internet-elapsed']);
      t2 = formatTime(metric.elapsed);
      t3 = formatTime(metric.elapsed);  // TODO here is a bug!!!!!!!!!
      t4 = formatBytes(metric.meta.rx);
      tip1 = 'elapsed time since request was received from client';
      tip2 = 'elapsed time since request was sent from client';
      tip3 = 'elapsed time on webserver since response was received from server';
      tip4 = 'respnse size';
      response(x + (boxW / 2) - arrowX, y + boxH + (11 * processUnit) - 1, 2 * boxW - arrowL, t1, tip1, t2, tip2, t3, tip3, t4, tip4);

      //
      x = x + (2 * boxW);
      machineBox(x, y, boxW, boxH, 'server');
      dashedVertical(x + (boxW / 2), y + boxH, 14 * processUnit);
      processBox(x + (boxW / 2), y + boxH + 5 * processUnit, 4 * processUnit);

      t1 = formatTime(metric.meta['server-elapsed']);
      t2 = formatTime(metric.meta['broker-elapsed']);
      tip1 = 'elapsed time on server';
      tip2 = 'elapsed time since request was sent to server';
      response(x + (boxW / 2) - arrowX, y + boxH + (9 * processUnit) - 1, 2 * boxW - arrowL, t1, tip1, t2, tip2);
   }
}
