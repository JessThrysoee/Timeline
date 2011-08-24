/*globals TimeAxis, SidebarResizer, metrics, formatTimestamp, formatTime, formatBytes */
/*jshint jquery:true, bitwise:false, devel:true */


(function (metrics) {
   var timeStart, timeElapsed, overviewAxis, detailsAxis, detailsTicks, sidebarResizer, body, statusBar;

   body = $('body');
   statusBar = $('.status-bar');

   /*
    *
    */

   function bindSizebarResizerResized() {
      var labels, lines, detailsAxisElem;

      labels = $('.labels'); // 2 elems
      lines = $('.lines'); // 2 elems
      detailsAxisElem = $('.details .axis');

      body.bind(SidebarResizer.ResizedEvent, function (e, left) {
         lines.css('left', left);
         labels.css('width', left);
         detailsAxisElem.css('left', left);
      });
   }


   /*
    *
    */

   function createOneLine(tmpLines, tmpLabels, metric, left, width, isEven) {
      var newLabel, newLine, metricElem;

      newLabel = $('<div/>').addClass('line');
      newLine = $('<div/>').addClass('line');

      newLine.data('label', newLabel);
      newLine.data('metric', metric);

      if (isEven) {
         newLabel.addClass('even');
         newLine.addClass('even');
      }

      newLabel.text(metric.title);

      metricElem = $('<div/>').addClass('metric').css({
         left: left + '%',
         width: width + '%'
      });

      metricElem.appendTo(newLine);

      tmpLabels.append(newLabel);
      tmpLines.append(newLine);
   }

   /*
    *
    */

   function createLines(metrics, minTime, maxTime, i, modulo) {
      var l, metric, time, elapsed, tmpLabels, tmpLines;

      tmpLines = $('<div/>');
      tmpLabels = $('<div/>');

      l = metrics.length;

      for (; i < l; i++) {

         metric = metrics[i];
         time = ((metric.timestamp - minTime) / (maxTime - minTime) * 100);
         if (time < 0) {
            time = 0;
         }

         elapsed = (metric.elapsed / (maxTime - minTime) * 100);
         if (elapsed > 100) {
            elapsed = 100;
         }

         createOneLine(tmpLines, tmpLabels, metric, time, elapsed, i % 2 === 0 ? true : false);

         if ((i + 1) % modulo === 0) {
            // continue later and let browser render some lines
            i += 1;
            break;
         }
      }

      $('.details .labels').append(tmpLabels.unwrap());
      $('.details .lines').append(tmpLines.unwrap());

      if (i < l) {
         statusBar.text('?/' + l);
         setTimeout(function () {
            createLines(metrics, minTime, maxTime, i, 100 * modulo);
         }, 300);
      } else {
         statusBar.text(l + '/' + l);
      }
   }

   /*
    *
    */

   function displayLines(metrics, minTime, maxTime) {
      var count, container, detachedLines, detachedLabels;

      count = 0;

      container = $('.details .scroll');
      detachedLines = container.children('.lines').detach();
      detachedLabels = container.children('.labels').detach();

      detachedLines.find('.line').each(function () {
         var line, metric, label, time, elapsed, timestampTmp, elapsedTmp, isEven;
         line = $(this);

         metric = line.data('metric');
         label = line.data('label');

         if ((metric.timestamp + (metric.elapsed) > minTime) && (metric.timestamp < maxTime)) {
            count += 1;

            timestampTmp = metric.timestamp;
            elapsedTmp = metric.elapsed;

            time = ((timestampTmp - minTime) / (maxTime - minTime) * 100);

            elapsed = (elapsedTmp / (maxTime - minTime) * 100);

            line.find('.metric').css({
               left: time + '%',
               width: elapsed + '%'
            });

            isEven = line.hasClass('even');
            if (count % 2 === 1) {
               if (!isEven) {
                  label.addClass('even');
                  line.addClass('even');
               }
            } else {
               if (isEven) {
                  label.removeClass('even');
                  line.removeClass('even');
               }
            }

            line.css('display', 'block');
            label.css('display', 'block');
         } else {
            line.css('display', 'none');
            label.css('display', 'none');
         }

      });

      container.prepend(detachedLines);
      container.prepend(detachedLabels);

      statusBar.text(count + '/' + metrics.length);
   }

   /*
    *
    */

   function addTimeExtramaPropertiesTo(metrics) {
      var i, l, minTime, maxTime;

      l = metrics.length;
      if (l > 0) {

         minTime = metrics[0].timestamp;
         maxTime = metrics[0].timestamp + metrics[0].elapsed;

         for (i = 1; i < l; i++) {

            if (metrics[i].timestamp < minTime) {
               minTime = metrics[i].timestamp;
            }
            if (metrics[i].timestamp + metrics[i].elapsed > maxTime) {
               maxTime = metrics[i].timestamp + metrics[i].elapsed;
            }
         }
      }
      metrics.minTime = minTime;
      metrics.maxTime = maxTime;
   }


   /*
    * Flatten all metrics to a set of disjoined intervals.
    *
    * Used in overview timeline.
    */

   function getIntervalsFrom(metrics) {
      var i, l, m, intervals, sorted, start, stop;

      intervals = [];

      sorted = metrics.slice(0).sort(function compare(a, b) {
         return a.timestamp - b.timestamp;
      });

      l = sorted.length;

      if (l > 0) {
         m = sorted[0];

         start = m.timestamp;
         stop = start + m.elapsed;

         for (i = 1; i < l; i++) {
            m = sorted[i];

            if (start <= m.timestamp && m.timestamp <= stop + 100) {
               if (stop < m.timestamp + m.elapsed) {
                  stop = m.timestamp + m.elapsed;
               }
            } else {
               intervals.push({
                  timestamp: start,
                  elapsed: stop - start
               });

               start = m.timestamp;
               stop = start + m.elapsed;
            }

            if (i === l - 1) {
               intervals.push({
                  timestamp: start,
                  elapsed: stop - start
               });
            }
         }
      }

      return intervals;
   }



   /*
    *
    */

   function createOverviewTimeline(metrics) {
      var i, l, m, intervals, line, time, elapsed;

      line = $('.overview .line');
      intervals = getIntervalsFrom(metrics);

      for (i = 0, l = intervals.length; i < l; i++) {
         m = intervals[i];

         time = ((m.timestamp - metrics.minTime) / (metrics.maxTime - metrics.minTime)) * 100;
         if (time < 0) {
            time = 0;
         }
         time = time + '%';

         elapsed = (m.elapsed / (metrics.maxTime - metrics.minTime)) * 100;
         if (elapsed > 100) {
            elapsed = 100;
         }
         elapsed = elapsed + '%';

         $('<div/>').addClass('metric').css({
            left: time,
            width: elapsed
         }).appendTo(line);
      }

   }


   /*
    *
    */

   function createAxes() {
      var lines = $('.details .lines');

      overviewAxis = new TimeAxis({
         axis: $('.overview .axis'),
         redrawEvents: SidebarResizer.ResizedEvent,
         timeStart: timeStart,
         timeElapsed: timeElapsed,
         withRulers: true
      });

      detailsAxis = new TimeAxis({
         redrawEvents: SidebarResizer.ResizedEvent,
         axis: $('.details .axis'),
         timeStart: timeStart,
         timeElapsed: timeElapsed,
         getWidth: function () {
            return lines.width();
         }
      });
      detailsTicks = new TimeAxis({
         axis: $('.details .ticks'),
         redrawEvents: SidebarResizer.ResizedEvent,
         timeStart: timeStart,
         timeElapsed: timeElapsed,
         withTickLabels: false
      });
   }


   /*
    *
    */

   function bindTimeAxisRuler(metrics) {
      body.bind(TimeAxis.RulerEvent, function (e, data) {
         var timeStart;

         detailsAxis.setTime(data.timeStart, data.timeElapsed);
         detailsTicks.setTime(data.timeStart, data.timeElapsed);

         timeStart = metrics.minTime + data.timeStart;
         displayLines(metrics, timeStart, timeStart + data.timeElapsed);

         // redraw to account for added/removed scrollbar
         detailsAxis.draw(true);
      });
   }



   function showToolTip() {
      var table, tbody;

       winH = $(window).height();
       winW = $(window).width();


      table = $('<table class="tooltip"/>');
      tbody = $('<tbody/>').appendTo(table);
      table.appendTo('body');

      function addKeyValue(key, value) {
         if (/timestamp$/.test(key)) {
            value = formatTimestamp(value);
         } else if (/elapsed$/.test(key)) {
            value = formatTime(value, ' ');
         } else if (/(rx$)|(tx$)/.test(key)) {
            value = formatBytes(value);
         }

         tbody.append('<tr><td class="key">' + key + ':</td><td>' + value + '</td></tr>');
      }


      $('.details').delegate('.metric', 'mouseenter', function (e) {
         var metric, meta, key;

         console.log(e.pageX, e.pageY, winW, winH, $(window).scrollTop());

         metric = $(this).closest('.line').data('metric');

         tbody.empty();
         addKeyValue('client-timestamp', metric.timestamp);
         addKeyValue('client-elapsed', metric.elapsed);

         if ('meta' in metric) {
            meta = metric.meta;
            for (key in meta) {
               addKeyValue(key, meta[key]);
            }
         }

         table.css({
            'top': e.pageY + 30,
            'left': e.pageX + 30
         }).show();

         return false;
      });

      $('.details').delegate('.metric', 'mouseleave', function (e) {
         table.hide();
         return false;
      });

   }


   /*
    *
    */

   function main(metrics) {
      addTimeExtramaPropertiesTo(metrics);

      timeStart = 0;
      timeElapsed = metrics.maxTime - metrics.minTime;

      createOverviewTimeline(metrics);

      sidebarResizer = new SidebarResizer($('.sidebar-resizer'), 100);
      bindSizebarResizerResized();

      createLines(metrics, metrics.minTime, metrics.maxTime, 0, 100);

      // depending of how many lines was added we add axes last to account for an added/removed scrollbar 
      createAxes();
      bindTimeAxisRuler(metrics);

      showToolTip();
   }


   main(metrics);

}(metrics));
