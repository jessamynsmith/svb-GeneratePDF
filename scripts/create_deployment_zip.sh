#!/bin/bash

# This script will quit on the first error that is encountered.
set -e

CREATION_DATE=`date "+%Y%m%d-%H%M%S"`
FILENAME="GeneratePDF-$CREATION_DATE.zip"

mkdir -p dist

zip -r -X "./dist/$FILENAME" *
