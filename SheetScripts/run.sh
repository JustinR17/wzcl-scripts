#!/bin/bash

pushd /home/pi/Desktop/clscripts/SheetScripts/
printf '%s\n' "$(date)" >> logs/output.txt
npm start >> logs/output.txt
popd
