#!/bin/bash
#
#

DIR=metric3
find $DIR -name '*.csv' -print0 | xargs -0 -I@ echo '<li><a href="./?file=@">@</a>' 

