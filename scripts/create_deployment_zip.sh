#!/bin/bash

# This script will quit on the first error that is encountered.
set -e

CREATION_DATE=`date "+%Y%m%d-%H%M%S"`
FILENAME="GeneratePDF-$CREATION_DATE.zip"

mkdir -p dist

# Zip up source files. Exclude results, dist, and keys directories
zip -r -x "results/*" -x "dist/*" -x "keys/*" -X "./dist/$FILENAME" *
