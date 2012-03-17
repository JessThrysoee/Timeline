/*globals main, parseCSV */

jQuery.event.props.push('dataTransfer');

function handleFileSelect(e) {
   var files, reader;

   e.stopPropagation();
   e.preventDefault();

   files = e.dataTransfer.files;
   if (files.length) {
      reader = new FileReader();
      $(reader).on('load', function(e) {
         var metrics = parseCSV(e.target.result);

         main(metrics);
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
