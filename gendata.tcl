#!/usr/bin/tclsh

set datajs [open "data.js" w]
set count [lindex $argv 0]

set timestart 10000

puts $datajs "var metrics = \[\{"

for {set i 0} {$i < $count} {incr i} {

   puts $datajs "title: 'title-$i',"
   puts $datajs "timestart: [incr timestart 1000],"
   puts $datajs "timeelapsed: 1000"
   if {[expr $i + 1] != $count} {
      puts $datajs "\}, \{"
   }

}

puts $datajs "}\];"

close $datajs
