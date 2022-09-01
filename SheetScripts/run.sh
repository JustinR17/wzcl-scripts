#!/bin/bash

pushd /home/pi/Desktop/wzscripts/ClanLeague/SheetScripts
printf '%s\n' "$(date)" >> logs/output.txt
npm start >> logs/output.txt
popd
