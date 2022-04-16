# Sheet Scripts

This directory contains scripts used for updating the spreadsheet. All of the scripts with an `*.gs` extension are run directly in the spreadsheet through the `Apps Script` (under `Extensions` on any unlocked page).

The scripts handle the following tasks:
* Initially populating the `GLX`, `Data_X`, `Player_Stats` pages using the `Original Lineups` and `Rosters` pages
* Updating the weekly stats tables in the `Data_X` pages (set on a weekly timer in the `Apps Script` triggers)
* Updating the `Player_Stats` page using the `GLX` pages (set on a daily timer in the `Apps Script` triggers)
* Adding new game links & updating clan/player wins/losses on the `GLX` pages (external script)


## Installation

Any file with a `*.gs` extension can be coped into the `Apps Script` tab and be run immediately.

### SheetScorekeeper_service

To run the script, you will need `Node` (any version should work -- I was using `v13.14.0` at the time). You can install the dependencies with `npm` using the following command:

```bash
npm install
```

A `.env` file will need to be created with certain secrets. This surrounds various WZ & spreadsheet credentials. A sample `.env` file is:
```
Email="<wz-email>"
APIToken='<wz-apitoken>'
WZ_GAME_API='https://www.warzone.com/API/GameFeed'
CLOT_URL="http://wzclot.eastus.cloudapp.azure.com/leagues/681/"
SSID="<spreadsheet-id>"
```

* `Email` is your warzone email
* `APIToken` is your warzone API Token (can be obtained form [here](https://www.warzone.com/wiki/Get_API_Token_API))
* `WZ_GAME_API` is the API for checking game progress -- this should not need to be changed
* `CLOT_URL` is the link to the current CL's Clot page (only the ID needs to be updated)
* `SSID` is the spreadsheet ID to update

### Google Cloud Platform - Service Account

`Google Cloud Platform` needs to be used in order to use the Google API. A new project will need to be created that enables the Google API. A service account must also be created which will be used to update the script. Once the service account is created, the email must be shared as an editor on the spreadsheet.

A `private.json` file will also need to be created which will allow the script to use the Google API to read/write the spreadsheet. The following is a sample `private.json` file:
```json
{
    "type": "service_account",
    "project_id": "<project_id>",
    "private_key_id": "<private_key_id>",
    "private_key": "<private-key>",
    "client_email": "<service-account-email>",
    "client_id": "<service-account-id>",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "<cert-url>"
}
```

* `project_id` is the ID of the Google Cloud Platform project created containing the service account
* The following does not need to be changed:
    * `type`
    * `auth_uri`
    * `token_uri`
    * `auth_provider_x509_cert_url`
* The remaining credentials can all be taken from the GCP project

## Updating & running the scripts

All of the scripts here need to be updated once at the beginning of clan league. This generally just involves updating the list of templates/tournaments and clans.

### SheetScorekeeper_service.js

The following should be updated once a clan league:
* `API_TO_SHEET_CLANS` denotes a mapping from the actual clan name (shown on the WZClot & WZ) to the clan name in the spreadsheet. These must match exactly.
* `SSID` in the `.env` file denotes the spreadsheet ID (in the link of the spreadsheet)
* `CLOT_URL` in the `.env` file denotes the URL to the WZClot clan league page (just the ID needs to be updated)

Run the script with the following command:
```bash
npm start
```

### InitializeSheets.gs

The script will initially populate the players (name/id/slots) in the `GLX`, `DATA_X` and `Player_Stats` pages using the `Original Lineups` and `Roster` pages. All players in the `Roster` page should contain hyperlinks to their warzone profile & all names in the lineups should match EXACTLY as copied in the rosters page.

The following needs to be updated every clan league:
* `templates` is a list of the templates in CL. The names must match exactly to the template names in the sheet.
* `divisions` likely does not need to be changed

Run the script (in `Apps Script`) by calling the `initialize()` function.

### UpdateStats.gs

The script will update player wins/losses on the `Player_Stats` page using the `GLX` pages.

The following needs to be updated every clan league:
* `templates` same list as `InitializeSheets.gs`
* `divisions` likely does not need to be changed

Run the script (in `Apps Script`) by calling the `updateStats()` function.

### UpdateWeeklyStandings.gs

The script will update the weekly stats tables in the `Data_X` tables (pts/pts contested/win rate/percentage completed). It will automatically create a new row name `Week X`. The table must have the `Start` row zeroed in to work properly initially.

The following probably doesn't need to be updated every clan league:
* `divisions` likely does not need to be changed

Run the script (in `Apps Script`) by calling the `updateAllDivisionStandings()` function.


### UpdateWeeklyStandings_GAMES.gs

This script is identical to `UpdateWeeklyStandings.gs` with the exception of updating the calculation for `Percent Completed`. Originally, the points were used to determine this metric, but this script changes the format to use the number of games completed instead.

The following probably doesn't need to be updated every clan league:
* `divisions` likely does not need to be changed

Run the script (in `Apps Script`) by calling the `updateAllDivisionStandings()` function.
