#!/bin/bash

SCRIPT=$(realpath "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

pushd $SCRIPTPATH/SheetScripts/
npm install
popd
