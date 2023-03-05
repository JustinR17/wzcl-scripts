#!/bin/bash

source /home/pi/.bashrc
pushd /home/pi/Desktop/wzcl-scripts/SheetScripts/
printf '%s\n' "$(date)"
npm start
popd
echo
