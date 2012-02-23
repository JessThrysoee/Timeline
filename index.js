/*globals TimeAxis, SidebarResizer, metrics, formatTimestamp, formatTime, formatBytes, QueryString, parseCSV, createDiagram */
/*jshint jquery:true, bitwise:false, devel:true */

(function() {
   var timeStart, timeElapsed, overviewAxis, detailsAxis, detailsTicks, sidebarResizer, body, statusBar, statusBarCounter, querystring, file, slow, reallySlow;

   body = $('body');
   statusBar = $('.status-bar');
   statusBarCounter = $('<div/>').addClass('status-bar-item-counter').appendTo(statusBar);

   slow = 200;
   reallySlow = 2000;


   /*
    *
    */

   function bindSizebarResizerResized() {
      var labels, lines, detailsAxisElem;

      labels = $('.labels'); // 2 elems
      lines = $('.lines'); // 2 elems
      detailsAxisElem = $('.details .axis');

      body.bind(SidebarResizer.ResizedEvent, function(e, left) {
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

      metricElem.addClass(elapsedCategory(metric.elapsed));
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
         statusBarCounter.text('?/' + l);
         setTimeout(function() {
            createLines(metrics, minTime, maxTime, i, 100 * modulo);
         }, 300);
      } else {
         statusBarCounter.text(l + '/' + l);
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

      detachedLines.find('.line').each(function() {
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

      statusBarCounter.text(count + '/' + metrics.length);
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

   function elapsedCategory(elapsed) {

      if (elapsed < slow) return 'instant';

      if (elapsed < reallySlow) return 'slow';

      return 'really-slow';
   }

   function getCategoryList() {
      return ['instant', 'slow', 'really-slow'];
   }


   /*
    * Flatten all metrics to a set of disjoined intervals.
    *
    * Used in overview timeline.
    */

   function getIntervalsFrom(metrics, drawable) {
      var i, l, m, intervals, interval, sorted, category;

      intervals = {
         'instant': {
            data: []
         },
         'slow': {
            data: []
         },
         'really-slow': {
            data: []
         }
      };

      sorted = metrics.slice(0).sort(function compare(a, b) {
         return a.timestamp - b.timestamp;
      });

      l = sorted.length;


      for (i = 0; i < l; i++) {
         m = sorted[i];

         category = elapsedCategory(m.elapsed);
         interval = intervals[category];

         if (!('start' in interval)) {
            interval.start = m.timestamp;
            interval.stop = interval.start + m.elapsed;
            continue;
         }

         if (interval.start <= m.timestamp && m.timestamp <= interval.stop + drawable) {
            if (interval.stop < m.timestamp + m.elapsed) {
               interval.stop = m.timestamp + m.elapsed;
            }
         } else {
            interval.data.push({
               timestamp: interval.start,
               elapsed: interval.stop - interval.start
            });

            interval.start = m.timestamp;
            interval.stop = interval.start + m.elapsed;
         }

         if (i === l - 1) {
            interval.data.push({
               timestamp: interval.start,
               elapsed: interval.stop - interval.start
            });
         }
      }

      return intervals;
   }



   /*
    *
    */

   function createOverviewTimeline(metrics) {
      var i, j, l, m, intervals, line, time, elapsed, cssMetricMinWidth, drawable, category, data;

      line = $('.overview .line');

      cssMetricMinWidth = 8; //    .metric {min-width: 8px;}
      // 8px correspond to ms, less is not drawable
      drawable = 8 * (metrics.maxTime - metrics.minTime) / line.width();

      intervals = getIntervalsFrom(metrics, drawable);

      for (j = 0; j < getCategoryList().length; j++) {
         category = getCategoryList()[j];

         data = intervals[category].data;

         for (i = 0, l = data.length; i < l; i++) {
            m = data[i];

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

            $('<div/>').addClass('metric').addClass(category).css({
               left: time,
               width: elapsed
            }).appendTo(line);
         }
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
         getWidth: function() {
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
      body.bind(TimeAxis.RulerEvent, function(e, data) {
         var timeStart;

         detailsAxis.setTime(data.timeStart, data.timeElapsed);
         detailsTicks.setTime(data.timeStart, data.timeElapsed);

         timeStart = metrics.minTime + data.timeStart;
         displayLines(metrics, timeStart, timeStart + data.timeElapsed);

         // redraw to account for added/removed scrollbar
         detailsAxis.draw(true);
      });
   }

   function showDiagramToolTip(metrics) {
      var win, html, diagram, details, clicked, visible;

      clicked = false;
      visible = false;

      html = $('html');
      win = $(window);
      details = $('.details');

      diagram = $('<div class="tooltip"/>');
      diagram.appendTo('body');

      function show(e) {
         var metric, diagramW, diagramH, winW, winH, offsetX, offsetY;

         if (visible) {
            return;
         }
         visible = true;

         e.stopPropagation();

         metric = $(this).closest('.line').data('metric');

         createDiagram(diagram[0], metric);

         winW = win.width();
         winH = win.height();
         diagramW = diagram.width();
         diagramH = diagram.height();

         offsetY = -14;
         if (e.pageY > winH / 2) {
            offsetY = diagramH + 14;
         }
         offsetX = 10;
         if (e.pageX > winW - diagramW) {
            offsetX = diagramW - (winW - e.pageX - 10);

         }

         diagram.css({
            'top': e.pageY - offsetY,
            'left': e.pageX - offsetX
         }).show();
      }

      html.on('click.tooltip', function(e) {
         if (clicked) {
            diagram.empty();
            clicked = false;
            visible = false;
            return false;
         }
      });

      details.on('click.tooltip', '.metric', function(e) {
         clicked = true;
         show.call(this, e);
         return false;
      });

      details.on('mouseenter', '.metric', function(e) {
         if (!clicked) {
            show.call(this, e);
            return false;
         }
      });

      details.on('mouseleave', '.metric', function(e) {
         if (!clicked) {
            diagram.empty();
            visible = false;
            return false;
         }
      });

   }


   /*
    *
    */
   function addClockOffsetsToStatusBar(metrics) {
      $('<div/>').addClass('status-bar-item-divider').appendTo(statusBar);
      $('<div>web server clock offset: ' + formatTimestamp(metrics.clockOffsetToWebServer) + '</div>').addClass('status-bar-item').appendTo(statusBar);
      $('<div/>').addClass('status-bar-item-divider').appendTo(statusBar);
      $('<div>server clock offset: ' + formatTimestamp(metrics.clockOffsetToServer) + '</div>').addClass('status-bar-item').appendTo(statusBar);
      $('<div/>').addClass('status-bar-item-divider').appendTo(statusBar);
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

      showDiagramToolTip(metrics);
   }


   querystring = new QueryString();
   file = querystring.value('file');

   $.get(file, function(csv) {
      var metrics = parseCSV(csv);

      //addClockOffsetsToStatusBar(metrics);
      main(metrics);
   });

}());
