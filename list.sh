#!/bin/bash
#
#

DIR=$1



echo "<!DOCTYPE html>"
echo "<html>"
echo "   <head>"
echo "      <meta charset=\"utf-8\">"
echo "      <title>Metric Links</title>"
echo "   </head>"
echo ""
echo "   <body>"
echo "      <ul>"
echo ""

find $DIR -name '*.csv' -print0 | xargs -0 -I@ echo '<li><a href="./?file=@">@</a>' 

echo ""
echo "      </ul>"
echo "   </body>"
echo "</html>"

