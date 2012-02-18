function parseCSV(csv) {
   var i, l, lines, fields, metrics = [];
   lines = csv.split('\n');

   for (i = 1, l = lines.length - 1; i < l; i++) {
      fields = lines[i].split('\t');

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
            'rx': +fields[3]
         }
      });

   }

   metrics.offsetFromServer = timeOffsetFromClientTo('server', metrics);
   metrics.offsetFromInternet = timeOffsetFromClientTo('internet', metrics);

   return metrics;
}

function timeOffsetFromClientTo(to, metrics) {

   var i, l, m, accu, sorted;

   function sortBy(a, b) {

      var diff = a.elapsed - b.elapsed;
      if (diff === 0) return a.meta[to + '-elapsed'] - b.meta[to + '-elapsed'];

      return diff;
   }

   sorted = metrics.slice().sort(sortBy);

   l = Math.min(10, sorted.length);

   accu = 0;
   for (i = 0; i < l; i++) {
      m = sorted[i];
      accu += m.timestamp - (+m.meta[to + '-timestamp'] + (m.elapsed - m.meta[to + '-elapsed']) / 2);
   }

   return (accu / l).toFixed();
}
