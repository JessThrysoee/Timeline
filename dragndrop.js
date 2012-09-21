/*global main, parseCSV */

(function(parseFn, interpretFn) {

   function getQueryParamByName(name) {
      var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
      return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
   }

   // handle file drop
   function initFileDrop() {
      jQuery.event.props.push('dataTransfer');

      function handleFileSelect(e) {
         var files, reader;

         e.stopPropagation();
         e.preventDefault();

         files = e.dataTransfer.files;
         if (files.length) {
            reader = new FileReader();
            $(reader).on('load', function(e) {
               var data = parseFn(e.target.result);
               interpretFn(data);
            });

            reader.readAsText(files[0]);
         }
      }

      function handleDragOver(e) {
         e.stopPropagation();
         e.preventDefault();
         e.dataTransfer.dropEffect = 'copy';
      }

      var dropZone = $('body');
      dropZone.on('dragover', handleDragOver);
      dropZone.on('drop', handleFileSelect);
   }


   // handle querystring, ?file=param
   function initFileParam() {
      var file = getQueryParamByName('file');

      if (file) {
         $.get(file, function(text) {
            var data = parseFn(text);

            interpretFn(data);
         });
      }
   }

   initFileDrop();
   initFileParam();

}(parseCSV, main));
