# wzcl-scripts

This repository contains scripts that I (JustinR17) have made to help prevent burnout for the CL panel and scorekeepers & to make their lives better.

## ScorekeeperScripts

This directory contains files that scorekeepers will use on a regular basis. This includes scripts to create forum posts for updates and CSVs containing finished games (as some scorekeepers keep their own sheets).

## SheetScripts

This directory contains files that help update the spreadsheet. These are less documented as they were intended to run purely internally through myself. These scripts allow for most of the sheet to be automated. This includes:
* Initially populating the `GLX`, `DATA_X` and `Player_Stats` pages
* Updating the `Player_Stats` page using the `GLX` pages
* Updating the weekly stats tables in the `Data_X` pages
* Obtaining a list of boots & non-joins in the `Boots` pages
* Adding new game links and marking finished games under both clans & individual players on the `GLX`

All of the scripts with the `.gs` extension can be run directly from the spreadsheet in the `Apps Script` tab. I usually set time triggers for the scripts where the `Player_stats` will get updated daily, while the `Weekly stats` data is updated weekly.

The script that grabs new games and marks games as finished must be run externally. Since this requires the google API to read/write to the spreadsheet, a service account must be created on the Google Cloud Platform.
