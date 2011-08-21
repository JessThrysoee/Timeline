/*globals TimeAxis, SidebarResizer, metrics */
/*jshint jquery:true, bitwise:false, devel:true */


(function (metrics) {

   var timeStart, timeElapsed, overviewAxis, detailsAxis, detailsTicks, sidebarResizer, statusBar;

   statusBar = $('.status-bar');

   /*
    *
    */

   function bindSizebarResizerResized() {
      var labels, lines, detailsAxisElem;

      labels = $('.labels'); // 2 elems
      lines = $('.lines'); // 2 elems
      detailsAxisElem = $('.details .axis');

      $('body').bind(SidebarResizer.ResizedEvent, function (e, left) {
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
         time = ((metric.timestart - minTime) / (maxTime - minTime) * 100);
         if (time < 0) {
            time = 0;
         }

         elapsed = (metric.timeelapsed / (maxTime - minTime) * 100);
         if (elapsed > 100) {
            elapsed = 100;
         }

         createOneLine(tmpLines, tmpLabels, metric, time, elapsed, i % 2 === 0 ? true : false);

         if ((i + 1) % modulo === 0) {
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
         var line, metric, label, time, elapsed, timestartTmp, timeelapsedTmp;
         line = $(this);


         metric = line.data('metric');
         label = line.data('label');

         if ((metric.timestart + (metric.timeelapsed) > minTime) && (metric.timestart < maxTime)) {
            count += 1;

            timestartTmp = metric.timestart;
            timeelapsedTmp = metric.timeelapsed;

            if (metric.timestart < minTime) {
               timestartTmp = minTime;
               timeelapsedTmp = metric.timeelapsed - (minTime - metric.timestart);
            }
            if (metric.timestart + metric.timeelapsed > maxTime) {
               timeelapsedTmp = metric.timeelapsed - (metric.timestart + metric.timeelapsed - maxTime);
            }

            time = ((timestartTmp - minTime) / (maxTime - minTime) * 100);
            if (time < 0) {
               time = 0;
            }

            elapsed = (timeelapsedTmp / (maxTime - minTime) * 100);
            if (elapsed > 100) {
               elapsed = 100;
            }

            line.find('.metric').css({
               left: time + '%',
               width: elapsed + '%'
            });

            line.css('display', 'block');
            label.css('display', 'block');


            label.removeClass('even');
            line.removeClass('even');
            if (count % 2 === 1) {
               label.addClass('even');
               line.addClass('even');
            }



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

         minTime = metrics[0].timestart;
         maxTime = metrics[0].timestart + metrics[0].timeelapsed;

         for (i = 1; i < l; i++) {

            if (metrics[i].timestart < minTime) {
               minTime = metrics[i].timestart;
            }
            if (metrics[i].timestart + metrics[i].timeelapsed > maxTime) {
               maxTime = metrics[i].timestart + metrics[i].timeelapsed;
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
         return a.timestart - b.timestart;
      });

      l = sorted.length;

      if (l > 0) {
         m = sorted[0];

         start = m.timestart;
         stop = start + m.timeelapsed;

         for (i = 1; i < l; i++) {
            m = sorted[i];

            if (start <= m.timestart && m.timestart <= stop) {
               if (stop < m.timestart + m.timeelapsed) {
                  stop = m.timestart + m.timeelapsed;
               }
            } else {
               intervals.push({
                  timestart: start,
                  timeelapsed: stop - start
               });

               start = m.timestart;
               stop = start + m.timeelapsed;
            }

            if (i === l - 1) {
               intervals.push({
                  timestart: start,
                  timeelapsed: stop - start
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

         time = ((m.timestart - metrics.minTime) / (metrics.maxTime - metrics.minTime)) * 100;
         if (time < 0) {
            time = 0;
         }
         time = time + '%';

         elapsed = (m.timeelapsed / (metrics.maxTime - metrics.minTime)) * 100;
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
      $('body').bind(TimeAxis.RulerEvent, function (e, data) {
         var timeStart;

         detailsAxis.setTime(data.timeStart, data.timeElapsed);
         detailsTicks.setTime(data.timeStart, data.timeElapsed);

         timeStart = metrics.minTime + data.timeStart;
         displayLines(metrics, timeStart, timeStart + data.timeElapsed);

         // redraw to account for added/removed scrollbar
         detailsAxis.draw(true);
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

      createLines(metrics, metrics.minTime, metrics.maxTime, 0, 200);

      // depending of how many lines was added we add axes last to account for an added/removed scrollbar 
      createAxes();
      bindTimeAxisRuler(metrics);
   }


   main(metrics);


}(metrics));
