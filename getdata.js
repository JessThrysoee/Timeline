/*jshint bitwise:false*/

function parseCSV(csv, threshold) {
   var i, l, lines, fields, elapsedCorrection, metrics = [];
   lines = csv.split('\n');

   for (i = 1, l = lines.length - 1; i < l; i++) {
      fields = lines[i].split('\t');

      // handle bug in NetworkMetrics files
      if (+fields[8] === -1 || +fields[9] === -1 || +fields[10] === -1 || +fields[11] === -1) {
         continue;
      }

      //elapsedCorrection = +fields[11];
      elapsedCorrection = 0;

      // ignore request with elapsed time less than <threshold> ms
      if (+fields[5] - elapsedCorrection < threshold) {
         continue;
      }

      metrics.push({
         'title': fields[1],
         'timestamp': +fields[4],
         'elapsed': +fields[5] - elapsedCorrection,
         'webserver-nearside-timestamp': +fields[6],
         'webserver-nearside-elapsed': +fields[7] - elapsedCorrection,
         'webserver-farside-timestamp': +fields[8],
         'webserver-farside-elapsed': +fields[9] - elapsedCorrection,
         'server-timestamp': +fields[10],
         'server-elapsed': +fields[11] - elapsedCorrection,
         'tx': +fields[2],
         'rx': +fields[3],
         'client-webserver-offset': null,
         'webserver-server-offset': null
      });

   }

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
