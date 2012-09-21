/*jshint bitwise:false*/

function parseCSV(csv, threshold) {
   var i, l, timestamp, elapsed, lines, fields, metrics = [];
   lines = csv.split('\n');

   minTime = 0;
   maxTime = 0;

   for (i = 1, l = lines.length - 1; i < l; i++) {
      fields = lines[i].split('\t');

      // handle bug in NetworkMetrics files
      if (+fields[8] === -1 || +fields[9] === -1 || +fields[10] === -1 || +fields[11] === -1) {
         continue;
      }

      timestamp = +fields[4];
      elapsed = +fields[5];


      // ignore request with elapsed time less than <threshold> ms
      if (elapsed < threshold) {
         continue;
      }

      if (i === 1) {
         minTime = timestamp;
         maxTime = timestamp + elapsed;
      } else {
         if (timestamp < minTime) {
            minTime = timestamp;
         }
         if (timestamp + elapsed > maxTime) {
            maxTime = timestamp + elapsed;
         }
      }

      metrics.push({
         'title': fields[1],
         'timestamp': timestamp,
         'elapsed': elapsed,
         'webserver-nearside-timestamp': +fields[6],
         'webserver-nearside-elapsed': +fields[7],
         'webserver-farside-timestamp': +fields[8],
         'webserver-farside-elapsed': +fields[9],
         'server-timestamp': +fields[10],
         'server-elapsed': +fields[11],
         'tx': +fields[2],
         'rx': +fields[3],
         'client-webserver-offset': null,
         'webserver-server-offset': null
      });

   }

   metrics.minTime = minTime;
   metrics.maxTime = maxTime;

   addClientToWebserverOffset(metrics);
   addWebserverToServerOffset(metrics);

   return metrics;
}

function addWebserverToServerOffset(metrics) {
   addOffsetsTo(metrics, 'webserver-server-offset', 'webserver-farside-timestamp', 'webserver-farside-elapsed', 'server-timestamp', 'server-elapsed');
}


function addClientToWebserverOffset(metrics) {
   addOffsetsTo(metrics, 'client-webserver-offset', 'timestamp', 'elapsed', 'webserver-nearside-timestamp', 'webserver-nearside-elapsed');
}


function addOffsetsTo(metrics, property, fromTimestamp, fromElapsed, toTimestamp, toElapsed) {
   var i, l, m, hash, buckets;

   buckets = {};

   //for synchronized clocks where request and response times are equal, the following it true:
   //   m[fromTimestamp] + (m[fromElapsed] - m[toElapsed]) / 2 =  m[toTimestamp];
   function calcOffsets(m) {
      var o = {};

      o.elapsed = m[fromElapsed];
      o[property] = ~~ (m[fromTimestamp] + (m[fromElapsed] - m[toElapsed]) / 2 - m[toTimestamp]);

      return o;
   }

   function calcHash(m) {
      var interval = 1000 * 600; // 10 min buckets
      return ~~ (m[fromTimestamp] / interval);
   }

   function addTo(metric) {
      var offsets = buckets[calcHash(metric)];
      metric[property] = offsets[property];
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      m = metrics[i];

      hash = calcHash(m);
      if (buckets[hash]) {
         if (m[fromElapsed] < buckets[hash].elapsed) {
            buckets[hash] = calcOffsets(m);
         }
      } else {
         buckets[hash] = calcOffsets(m);
      }
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      addTo(metrics[i]);
   }
}
