/*jshint devel:true */

function scale() {
   var domainMin, domainMax, domainClamp, rangeMin, rangeMax, rangeClamp;

   function validateFrom(from) {
      if (from < domainMin || from > domainMax) {
         console.log(from + ' not  in [' + domainMin + ', ' + domainMax + ']');
      }
   }

   function validateTo(to) {
      if (to < rangeMin || to > rangeMax) {
         console.log(to + ' not  in [' + rangeMin + ', ' + rangeMax + ']');
      }
   }

   function clampFrom(from) {
      if (domainClamp) {
         from = from < domainMin ? domainMin : from;
         from = from > domainMax ? domainMax : from;
      }

      return from;
   }

   function clampTo(to) {
      if (rangeClamp) {
         to = to < rangeMin ? rangeMin : to;
         to = to > rangeMax ? rangeMax : to;
      }

      return to;
   }

   function fn(from) {
      var to;

      validateFrom(from);
      from = clampFrom(from);

      to = rangeMin + (((from - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin));

      validateTo(to);
      to = clampTo(to);

      return to;
   }

   fn.domain = function(min, max) {
      if (!arguments.length) return [min, max];
      domainMin = min;
      domainMax = max;
      return fn;
   };

   fn.range = function(min, max) {
      if (!arguments.length) return [min, max];
      rangeMin = min;
      rangeMax = max;
      return fn;
   };

   fn.clamp = function(domain, range) {
      if (!arguments.length) return [domainClamp, rangeClamp];
      domainClamp = Boolean(domain);
      rangeClamp = Boolean(range);
      return fn;
   };

   return fn;
}

