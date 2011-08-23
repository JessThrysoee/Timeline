#!/usr/bin/tclsh

set out [open "data.js" w]
#set out stdout
set in [open data.tab r]
gets $in line


puts $out "var metrics = \["
set comma  ""

while {[gets $in line] >= 0} {
   set line [split $line \t]

   puts $out "$comma{"
   puts $out "   title: '[lindex $line 1]',"
   puts $out "   timestamp: [lindex $line 4],"
   puts $out "   elapsed: [lindex $line 5],"
   puts $out "   meta: {"
   puts $out "      'internet-timestamp': [lindex $line 6],"
   puts $out "      'internet-elapsed': [lindex $line 7],"
   puts $out "      'broker-timestamp': [lindex $line 8],"
   puts $out "      'broker-elapsed': [lindex $line 9],"
   puts $out "      'server-timestamp': [lindex $line 10],"
   puts $out "      'server-elapsed': [lindex $line 11],"
   puts $out "      'rx': [lindex $line 2],"
   puts $out "      'tx': [lindex $line 3]"
   puts $out "   }"
   puts $out "}"

   set comma ","
}

puts $out "\];"

close $in
close $out
