#!/usr/bin/tclsh

set datajs [open "data.js" w]
set count [lindex $argv 0]

set timestamp 10000

puts $datajs "var metrics = \[\{"

for {set i 0} {$i < $count} {incr i} {

   puts $datajs "title: 'title-$i',"
   puts $datajs "timestamp: [incr timestamp 1000],"
   puts $datajs "elapsed: 1000,"
   puts $datajs "meta: {"
   puts $datajs "   'internet-timestamp': 121212121212,"
   puts $datajs "   'internet-elapsed': 12,"
   puts $datajs "   'broker-timestamp': 121212121212,"
   puts $datajs "   'broker-elapsed': 12,"
   puts $datajs "   'server-timestamp': 121212121212,"
   puts $datajs "   'server-elapsed': 12,"
   puts $datajs "   'rx': 9898912,"
   puts $datajs "   'tx': 78374812"
   puts $datajs "}"
   if {[expr $i + 1] != $count} {
      puts $datajs "\}, \{"
   }

}

puts $datajs "}\];"

close $datajs
