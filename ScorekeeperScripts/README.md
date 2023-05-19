# Scorekeeper Scripts

This directory contains all of the scripts that I have made for the scorekeepers to use. This includes scripts for creating forum posts that are immediately ready to post in addition to an extra script (created for Let's Fight) to create a CSV of all finished games.

All scripts are written in Python and rely on web-scraping of the clot page (with an additional dependency of the WZ API for one form of the ForumPostBuilder).

**Currently updated for Clan League 16 -- 2023-05-18**

## Change Log

```
2023-05-18
    - Updated README with extra usage of the CLForumPostBuilder_API.py & CLForumPostBuilder.py scripts outlining using
        the -d <divisions> option
    - Updated run commands for both scripts
2023-05-15
    - Added proper CLI argument parsing for CLForumPostBuilder_API.py & CLForumPostBuilder.py (better usage help message)
    - Added a -d <divisions> option for the scripts to select which divisions to parse only
    - Modified the API version to first check the game with the API for all players. If the game is deleted, then switch
        to the original version and query each player against the API
        - This is done to significantly reduce the number of API calls (24min -> 8min)
        - This allows for parsing players that have blacklisted the user
        - Must have the fallback of checking individual players in case of game deletion
    - Fixed an uncaught error for players that have deleted their account. Default their name to (deleted)
```

## Installation

As each script contains the same dependencies, installation is very simple. An included `requirements.txt` speeds up the process with downloading all required dependencies with the version I am using to *hopefully* prevent bad versions.

I used Python3 when building/running these scripts, but I don't anticipate there being a difference on the version you use.

Note: if you use Python a lot externally, it might be smart to create a virtual environment (separate Python environment) as this will prevent issues with dependencies when switching projects.

### Creating a virtual environment

If you already have a virtual environment or are fine with downloading the dependencies on the global Python, skip this section.

If you are running python with `python3` instead of just `python`, make sure to update the command in step 2) accordingly.
1) Enter into the current directory in your terminal
2) Create a virtual environment by running:
```bash
python -m venv venv
```
This will create a virtual environment at the current directory and contain all relevant files in `venv`

3) Activate the virtual environment:

    a) On windows, run:
    ```bash
    venv/Scripts/activate.bat
    ```
    b) On Unix (ex. bash) or MacOS, run:
    ```bash
    source venv/bin/activate
    ```
4) Python should now point to the new virtual environment instead of the global executable


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
* `point_penalties` need to be updated as a mapping of the full clan name to the integer point penalty
* `abrv_clans`/`abrv_clans_shortforms` can be updated to your personal preference. Look in the script for details.
* `template_links` contain mappings from the template name on the CLOT to imgur links of the map at picks.
* `clan_links` contain mappings from the clan name on the CLOT to imgur links of the clan icon.

The starterfile also needs to be updated. The syntax for the file is as follows:
* `Division` must precede any division (obviously) where the following character is `A`/`B`/etc (As an example, `Division A`)
* `Template` must precede any template where the following suffix is the full template name on the clot. (As an example, `TemplateCL15: 3v3 Middle Earth in the Third Age`)
* There MUST be one division/template per line... Do not combine them.
```
Division X
TemplateA
TemplateB
TemplateC
...
Division Y
TemplateG
TemplateH
TemplateI
...
```



### FinishedGamesCSV

#### Updates per execution

* `OUTPUT_FILE_NAME` denotes the output file containing the CSV data. Note that the program will crash if the file already exists (as this prevents overwritting data).

#### Updates per clan league

* `CLOT_PAGE_URL`
* `divisions`
* `tournaments`

## How to run the scripts

**Recently (as of around 2023-05-15)** the scripts were updated with proper CLI argument parsing. As such, there is a better interface for understanding what each parameter does in addition to additional switch support to improve user experience.

To see help usage for each file, use the following:
```python
python CLForumPostBuilder_API.py -h
    usage: CLForumPostBuilder_API.py [-h] [-d DIVISIONS] email token     

    Parse Clan League games and generate forum bbcode output.

    positional arguments:
    email
    token

    optional arguments:
    -h, --help            show this help message and exit
    -d DIVISIONS, --divisions DIVISIONS
                            specify specific divisions to parse. (comma-delimited list)

python CLForumPostBuilder.py -h
    usage: CLForumPostBuilder.py [-h] [-d DIVISIONS]

    Parse Clan League games and generate forum bbcode output.

    optional arguments:
    -h, --help            show this help message and exit
    -d DIVISIONS, --divisions DIVISIONS
                            specify specific divisions to parse. (comma-delimited list)
```

**Note:** the following addition for selectively building forum output for certain divisions.
```python
python CLForumPostBuilder_API.py ... # This is the normal command, defaults to all divisions
python CLForumPostBuilder_API.py -d a ... # Only parses Division A
python CLForumPostBuilder_API.py -d a,d1,s,b # Only parses Divisions A, B, D1 (s is invalid & discard)
```

### CLForumPostBuilder

There are two variants of this script: one variant uses the WZ API to gather accurate player information while the other doesn't. These are respectively named `CLForumPostBuilder_API.py` and `CLForumPostBuilder.py`. Both output very similar information with the exception of the players included in the recently finished game section of each template.

For background information, the WZClot site created by B only shows the current players on a slot. That means that if a player is subbed in CL after playing a few games, there is no way for the script to know that the player was in those games. This is why the WZ API is required to query for the correct players.

#### CLForumPostBuilder_API.py Execution

**Only members can use this script as it requires your warzone email and API token (which is only allowed for members -- note that that free trial does not let you use the API)**

To run the script, use the following command:
```bash
python CLForumPostBuilder_API.py "<wz-email>" "<api-token>" [-d <divisions>]
```

Since this uses the WZ API, the script will take a while to run (couple minutes).

#### CLForumPostBuilder.py Execution


To run the script, use the following command:
```bash
python CLForumPostBuilder.py [-d <divisions>]
```

### FinishedGamesCSV

This script was created for Let's Fight and outputs all finished games in a CSV sorted by finish date. Each row corresponds to a finished game where the data includes the division, template, winner, loser, points, end date and game link.

To run the script, use the following command:
```bash
python FinishedGamesCSV.py run
```
