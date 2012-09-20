#!/bin/sh

## Download and unpack to e.g. JessThrysoee-timeline-6f5b86b/
curl -L -k https://github.com/JessThrysoee/timeline/tarball/master | tar zx

## move all to this dir
mv JessThrysoee-timeline-*/* .

rm -rf JessThrysoee-timeline-*

