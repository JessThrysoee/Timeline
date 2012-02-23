/*jshint bitwise:false*/

function parseCSV(csv) {
   var i, l, lines, fields, metrics = [];
   lines = csv.split('\n');

   for (i = 1, l = lines.length - 1; i < l; i++) {
      fields = lines[i].split('\t');

      // handle bug in NetworkMetrics files
      if (+fields[8] === -1 || +fields[9] === -1 || +fields[10] === -1 || +fields[11] === -1) {
         continue;
      }
      
     // ignore < 100ms requests
     if (+fields[5] < 100) {
        continue;
     }

      metrics.push({
         title: fields[1],
         timestamp: +fields[4],
         elapsed: +fields[5],
         meta: {
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
         }
      });

   }

   addClientToWebserverOffset(metrics);
   addWebserverToServerOffset(metrics);

   return metrics;
}

function addWebserverToServerOffset(metrics) {
   var i, l, m, hash, buckets;

   buckets = {};

   //for synchronized clocks where request and response times are equal, the following it true:
   //   m.timestamp + (m.elapsed - m.meta['webserver-nearside-elapsed']) / 2 = m.meta['webserver-nearside-timestamp'];
   function calcOffsets(m) {
      return {
         elapsed: m.meta['webserver-farside-elapsed'],
         'webserver-server-offset': ~~ (m.meta['webserver-farside-timestamp'] + (m.meta['webserver-farside-elapsed'] - m.meta['server-elapsed']) / 2 - m.meta['server-timestamp'])
      };
   }

   function calcHash(m) {
      var interval = 1000 * 600; // 10 min buckets
      return ~~ (m.meta['webserver-farside-timestamp'] / interval);
   }

   function addOffsetsTo(metric) {
      var offsets = buckets[calcHash(metric)];
      metric.meta['webserver-server-offset'] = offsets['webserver-server-offset'];
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      m = metrics[i];

      hash = calcHash(m);
      if (buckets[hash]) {
         if (m.meta['webserver-farside-elapsed'] < buckets[hash].elapsed) {
            buckets[hash] = calcOffsets(m);
         }
      } else {
         buckets[hash] = calcOffsets(m);
      }
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      addOffsetsTo(metrics[i]);
   }
}


function addClientToWebserverOffset(metrics) {
   var i, l, m, hash, buckets;

   buckets = {};

   //for synchronized clocks where request and response times are equal, the following it true:
   //   m.timestamp + (m.elapsed - m.meta['webserver-nearside-elapsed']) / 2 = m.meta['webserver-nearside-timestamp'];
   function calcOffsets(m) {
      return {
         elapsed: m.elapsed,
         'client-webserver-offset': ~~ (m.timestamp + (m.elapsed - m.meta['webserver-nearside-elapsed']) / 2 - m.meta['webserver-nearside-timestamp']),
      };
   }

   function calcHash(m) {
      var interval = 1000 * 600; // 10 min buckets
      return ~~ (m.timestamp / interval);
   }

   function addOffsetsTo(metric) {
      var offsets = buckets[calcHash(metric)];
      metric.meta['client-webserver-offset'] = offsets['client-webserver-offset'];
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      m = metrics[i];

      hash = calcHash(m);
      if (buckets[hash]) {
         if (m.elapsed < buckets[hash].elapsed) {
            buckets[hash] = calcOffsets(m);
         }
      } else {
         buckets[hash] = calcOffsets(m);
      }
   }

   for (i = 0, l = metrics.length; i < l; i++) {
      addOffsetsTo(metrics[i]);
   }
}
