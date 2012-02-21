#!/usr/bin/tclsh
#
#

foreach file [glob metrics2/*.csv] {
   puts "<li><a href=\"./?file=$file\">$file</a>"

}
