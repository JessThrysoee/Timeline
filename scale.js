function scale() {
   var domainMin, domainMax, rangeMin, rangeMax;

   function fn(x) {
      return rangeMin + (((x - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin));
   }

   fn.domain = function (min, max) {
      if (!arguments.length) return [min, max];
      domainMin = min;
      domainMax = max;
      return fn;
   }

   fn.range = function (min, max) {
      if (!arguments.length) return [min, max];
      rangeMin = min;
      rangeMax = max;
      return fn;
   }

   return fn;
}

