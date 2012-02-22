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

      metrics.push({
         title: fields[1],
         timestamp: +fields[4],
         elapsed: +fields[5],
         meta: {
            'internet-timestamp': +fields[6],
            'internet-elapsed': +fields[7],
            'broker-timestamp': +fields[8],
            'broker-elapsed': +fields[9],
            'server-timestamp': +fields[10],
            'server-elapsed': +fields[11],
            'tx': +fields[2],
            'rx': +fields[3],
            'client-webserver-offset': null,
            'webserver-server-offset': null
         }
      });

   }

   addOffsets(metrics);

   return metrics;
}


function addOffsets(metrics) {
   var i, l, m, hash, buckets;

   buckets = {};

   //for synchronized clocks where request and response times are equal, the following it true:
   //   m.timestamp + (m.elapsed - m.meta['internet-elapsed']) / 2 = m.meta['internet-timestamp'];
   function calcOffsets(m) {
      return {
         elapsed: m.elapsed,
         'client-webserver-offset': ~~ (m.timestamp + (m.elapsed - m.meta['internet-elapsed']) / 2 - m.meta['internet-timestamp']),
         'webserver-server-offset': ~~ (m.meta['broker-timestamp'] + (m.meta['broker-elapsed'] - m.meta['server-elapsed']) / 2 - m.meta['server-timestamp'])
      };
   }

   function calcHash(m) {
      var interval = 1000 * 600; // 10 min buckets
      return ~~ (m.timestamp / interval);
   }

   function addOffsetsTo(metric) {
      var offsets = buckets[calcHash(metric)];
      metric.meta['client-webserver-offset'] = offsets['client-webserver-offset'];
      metric.meta['webserver-server-offset'] = offsets['webserver-server-offset'];
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
