# Scorekeeper Scripts

This directory contains all of the scripts that I have made for the scorekeepers to use. This includes scripts for creating forum posts that are immediately ready to post in addition to an extra script (created for Let's Fight) to create a CSV of all finished games.

All scripts are written in Python and rely on web-scraping of the clot page (with an additional dependency of the WZ API for one form of the ForumPostBuilder).

## Installation

As each script contains the same dependencies, installation is very simple. An included `requirements.txt` speeds up the process with downloading all required dependencies with the version I am using to *hopefully* prevent bad versions.

I used Python3 when building/running these scripts, but I don't anticipate there being a difference on the version you use.

Note: if you use Python a lot externally, it might be smart to create a virtual environment (separate Python environment) as this will prevent issues with dependencies when switching projects.

### Creating a virtual environment

If you already have a virtual environment or are fine with downloading the dependencies on the global Python, skip this section.

### Installing the dependencies

There is only a single command to install all of the dependencies:
```
pip install -r requirements.txt
```
If you are running python with `python3` instead of just `python`, you will need to switch `pip` with `pip3`.

## How to update the scripts

To maintain the scripts, there are a few variables that must be updated on every execution of the script, and before the start of a new clan league. For the most part, the logic of the script should remain sound as long as the warzone API lives and the WZClot clan league page stays the same.

### CLForumPostBuilder

Note: the updates for each variant are identical.
#### Updates per execution

* `INPUT_FILE_NAME` denotes the input file containing the games processed from the previous execution. The first execution should be `starterfile.txt`, while each subsequent file will be the `OUTPUT_FILE_NAME` of the previous iteration.
* `OUTPUT_FILE_NAME` denotes the output file that will contain the processsed games from the current execution. Note that the program will crash if the file already exists (as this prevents overwritting data).

#### Updates per clan league

* `CLOT_PAGE_URL` denotes the URL for the wzclot page. Just the ID needs to be updated
* `divisions` likely doesn't need to be changed, but just needs to match the CLOT divisions
* `tournaments` need to be updated to the exact name under the CLOT
* `abrv_clans`/`abrv_clans_shortforms` can be updated to your personal preference. Look in the script for details.
* `template_links` contain mappings from the template name on the CLOT to imgur links of the map at picks.
* `clan_links` contain mappings from the clan name on the CLOT to imgur links of the clan icon.

### FinishedGamesCSV

#### Updates per execution

* `OUTPUT_FILE_NAME` denotes the output file containing the CSV data. Note that the program will crash if the file already exists (as this prevents overwritting data).

#### Updates per clan league

* `CLOT_PAGE_URL`
* `divisions`
* `tournaments`

## How to run the scripts

### CLForumPostBuilder

There are two variants of this script: one variant uses the WZ API to gather accurate player information while the other doesn't. These are respectively named `CLForumPostBuilder_API.py` and `CLForumPostBuilder.py`. Both output very similar information with the exception of the players included in the recently finished game section of each template.

For background information, the WZClot site created by B only shows the current players on a slot. That means that if a player is subbed in CL after playing a few games, there is no way for the script to know that the player was in those games. This is why the WZ API is required to query for the correct players.

#### CLForumPostBuilder_API.py Execution

**Only members can use this script as it requires your warzone email and API token (which is only allowed for members -- note that that free trial does not let you use the API)**

To run the script, use the following command:
```bash
python CLForumPostBuilder_API.py run "<wz-email>" "<api-token>"
```

Since this uses the WZ API, the script will take a while to run (couple minutes).

#### CLForumPostBuilder.py Execution


To run the script, use the following command:
```bash
python CLForumPostBuilder.py run
```

### FinishedGamesCSV

This script was created for Let's Fight and outputs all finished games in a CSV sorted by finish date. Each row corresponds to a finished game where the data includes the division, template, winner, loser, points, end date and game link.

To run the script, use the following command:
```bash
python FinishedGamesCSV.py run
```
