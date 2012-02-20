/**
 *
 */

function zeroPad(num, len) {
   len = len || 2;
   return ('00' + num).substr(-len, len);
}

/**
 *
 */

function formatTimestamp(timestamp) {
   var f, d, sign;

   sign = timestamp < 0 ? '-' : ''; 
   timestamp = Math.abs(timestamp);

   d = new Date(timestamp);

   f = zeroPad(d.getUTCHours());
   f += ':' + zeroPad(d.getUTCMinutes());
   f += ':' + zeroPad(d.getUTCSeconds());
   f += ',' + zeroPad(d.getUTCMilliseconds(), 3);

   return sign + f;
}


/*
 * format time label
 */

function formatTime(time, space) {
   var s, min, hour;

   space = space || ' ';

   sign = time < 0 ? '-' : ''; 
   time = Math.abs(time);

   s = 1000;
   min = 60 * s;
   hour = 60 * min;

   if (time === 0) {
      return '0';
   } else if (time < s) {
      //ms
      return sign + time.toFixed(0) + space + 'ms';
   } else if (time < min) {
      //s
      return sign + (time / s).toFixed(2) + space + 's';
   } else if (time < hour) {
      //min
      return sign + (time / min).toFixed(1) + space + 'min';
   } else {
      //hour
      return sign + (time / hour).toFixed(1) + space + 'hrs';
   }
}

/**
 *
 */

function formatBytes(bytes) {
   var kB, MB, GB;

   kB = 1000;
   MB = 1000 * kB;
   GB = 1000 * MB;

   if (bytes === 0) {
      return '0';
   } else if (bytes < kB) {
      return bytes + ' B';
   } else if (bytes < MB) {
      return (bytes / kB).toFixed(3) + ' kB';
   } else if (bytes < GB) {
      return (bytes / MB).toFixed(3) + ' MB';
   } else {
      return (bytes / GB) + ' GB';
   }
}
