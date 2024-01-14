from bs4 import BeautifulSoup
import requests
import re
import argparse


################
### Preamble ###
################

###
### The following below should be changed on every run
###

# Input file name for finding games already processed in updates
INPUT_FILE_NAME =  "starterfile.txt"

# Output file cannot already exist or else I crash this... Prevents overwrites
OUTPUT_FILE_NAME = "diva2.temp"


###
### The following should be changed once every clan league
###

# This will turn to -> "Division A.txt"
FORUM_FILE_NAME = ".txt"

# Must point to the base league page on the clot (showing all tournaments)
CLOT_PAGE_URL = "http://wzclot.eastus.cloudapp.azure.com/leagues/860/"

# Division order to show in output (MUST MATCH CLOT NAMES)
# The dictionary matches the shortform (lowercase) to the actual CLOT name to allow for selecting certain divisions
#   from the CLI without having to modify this code
divisions = {
  "a": "Division A",
  "b": "Division B",
  "c1": "Division C1",
  "c2": "Division C2",
  "d": "Division D",
}

# Tournament order to show in output (MUST MATCH CLOT NAMES)
tournaments = [
  "3v3 Middle Earth in Third Age",
  "3v3 Deadman's Rome",
  "2v2 Volcano Island",
  "2v2 Szeurope",
  "2v2 Crimea Army Cap",
  "1v1 Unicorn Island",
  "1v1 MME MA LD LF",
  "1v1 Aseridith Islands",
  "1v1 Guiroma",
  "1v1 Landria",
  "1v1 Fogless Fighting (CL)"
]

# If a clan has a point penalty (ex. late submission), add their full name in this dict with the associated pts (MUST MATCH CLOT NAMES)
# ex { "CLAN": 3 }
point_penalties = {}

# If a clan has a long name, add their full name in `abrv_clans` and the shortform in `abrv_clans_shortforms`
# Note: the indices MUST match between the two lists (ex. first element in either list matches same clan)
abrv_clans = [
  "Fifth Column Confederation",
  "[V.I.W] Very Important Weirdos",
  "MASTER Clan",
  "French Community",
  "Brothers in Arms",
  "The Last Alliance",
  "The Hodopian Dynasty",
  "GRANDMASTER Clan",
  "Union of Soviet Socialist Republics"
]
abrv_clans_shortforms = [
  "FCC",
  "VIW",
  "Masters",
  "FC",
  "BIA",
  "TLA",
  "Hodopian Dynasty",
  "Grandmasters",
  "USSR"
]

# Imgur links for templates to show on the forums... Make sure template name matches the clot names (also copied above in `tournaments`)
# Note: we use imgur as the links are short (link characters count in WZ forum character limit)
template_links = {
  "3v3 Middle Earth in Third Age": "https://imgur.com/pPYvIov.png",
  "3v3 Deadman's Rome": "https://imgur.com/bB4ex5B.png",
  "2v2 Volcano Island": "https://imgur.com/10VeKTG.jpg",
  "2v2 Szeurope": "https://imgur.com/Nqvvx3Q.png",
  "2v2 Crimea Army Cap": "https://imgur.com/ln4QkqE.jpg",
  "1v1 Unicorn Island": "https://imgur.com/boXqSyb.jpg",
  "1v1 MME MA LD LF": "https://imgur.com/e54RPGO.jpg",
  "1v1 Aseridith Islands": "https://imgur.com/GHxmTRo.png",
  "1v1 Guiroma": "https://imgur.com/iN2ZawR.png",
  "1v1 Landria": "https://imgur.com/F0fbzMw.jpg",
  "1v1 Fogless Fighting (CL)": "https://imgur.com/IJTkbNl.jpg",

  # Archived
  "CL16: 3v3 Biomes of America": "https://imgur.com/Dduifq6.png",
  "CL16: 3v3 Europe": "https://imgur.com/9MWUoUN.png",
  "CL16: 2v2 Final Earth": "https://imgur.com/pMEAGCV.png",
  "CL16: 2v2 Guiroma": "https://imgur.com/NR9s4rB.png",
  "CL16: 2v2 Timid Land": "https://imgur.com/QhLhEeJ.png",
  "CL16: 1v1 ME WR": "https://imgur.com/cIZwh78.png",
  "CL16: 1v1 Georgia Army Cap": "https://imgur.com/IaSI0cv.png",
  "CL16: 1v1 Hannibal at the Gates": "https://imgur.com/MgsU57Q.png",
  "CL16: 1v1 French Brawl": "https://imgur.com/NpCxoTw.png",
  "CL16: 1v1 Elitist Africa": "https://imgur.com/vLXCtrN.png",
  "CL16: 1v1 Post-Melt Antarctica": "https://imgur.com/G71kHKb.png",
  "CL15: 2v2 Strategic MME": "https://imgur.com/7PJHjkF.png",
  "CL15: 2v2 Biomes of America": "https://imgur.com/PawtFUG.png",
  "CL15: 1v1 Timid Lands": "https://imgur.com/R5e3lyn.png",
  "CL15: 1v1 Battle Islands V": "https://imgur.com/UVDYfG0.png",
  "CL15: 1v1 Strategic Greece": "https://imgur.com/SPudXtE.png",
  "CL15: 1v1 Numenor": "https://imgur.com/l2iq2zR.png",
  "CL15: 1v1 Great Lakes": "https://imgur.com/oAe8HTv.png"
}

# Imgur links for clans to show on the forums... Make sure clan name matches the clot names
# Note: we use imgur as the links are short (link characters count in WZ forum character limit)
clan_links = {
  # Div A
  "Python": "https://imgur.com/WnXXWFK.png",
  "MASTER Clan": "https://imgur.com/uHxS00R.png",
  "ONE!": "https://imgur.com/MrRBTDH.png",
  "Lu Fredd": "https://imgur.com/0gujLpK.png",
  "[Blitz]": "https://imgur.com/qIAwJPK.png",
  "Optimum": "https://imgur.com/K2HAsvM.png",
  "Union Strikes Back": "https://imgur.com/IVnQ3TX.png",
  
  # Div B
  "The Last Alliance": "https://imgur.com/Oi0jmPf.png",
  "HAWKS": "https://imgur.com/1xgfJ4G.png",
  "Harmony": "https://imgur.com/VZGl4LU.png",
  "GRANDMASTER Clan": "https://imgur.com/l2S9RXr.png",
  "CORP": "https://imgur.com/0zWLmjC.png",
  "|GG|": "https://imgur.com/Rrj2rKK.png",
  "{101st}": "https://imgur.com/OkdlLpM.png",
  
  # Div C1
  "Vikinger": "https://imgur.com/UzqbzFY.png",
  "Union of Soviet Socialist Republics": "https://imgur.com/4dxPFEP.png",
  "Prime": "https://imgur.com/4qF99Bd.png",
  "Polish Eagles": "https://imgur.com/pzZVaEU.png",
  "Partisans": "https://imgur.com/5UigdKO.png",
  "Myth Busters": "https://imgur.com/tH6BflU.png",
  "Brothers in Arms": "https://imgur.com/BWiTNux.png",
  
  # Div C2
  "VS": "https://imgur.com/3XMds4x.png",
  "Soldiers of Fortune": "https://imgur.com/wkiTBkg.png",
  "Nestlings": "https://imgur.com/tZGPF9g.png",
  "M'Hunters": "https://imgur.com/Ink4qVz.png",
  "KILL ‘EM ALL": "https://imgur.com/OM3mlos.png",
  "Battle Wolves": "https://imgur.com/jFJqWnz.png",
  "[V.I.W] Very Important Weirdos": "https://imgur.com/2HOm8M1.png",

  # Div D
  "Undisputed": "https://imgur.com/Q409MJp.png",
  "The Poon Squad": "https://imgur.com/4r1LKyY.png",
  "The Barbarians": "https://imgur.com/MtmcR4R.png",
  "German Warlords": "https://imgur.com/LtA4QBx.png",
  "The Simulation": "https://imgur.com/4qtGbvs.png",

  # Archived
  "French Community": "https://imgur.com/CkKg0jG.png",
  "Fifth Column Confederation": "https://imgur.com/mn8RPhZ.png",
  "Celtica": "https://imgur.com/Bqwcrgv.png",
  "The Blue Devils": "https://imgur.com/pLeKWlC.png",
  "peepee poo fard": "https://imgur.com/8YrrEHN.png",
  "Cats": "https://imgur.com/oA545py.png",
  "SPARTA": "https://imgur.com/W6cex5J.png",
  "Nofrag": "https://imgur.com/AvCa36j.png",
  "[WG]": "https://imgur.com/DhsEbOC.png",
  "Discovery": "https://imgur.com/qOmbM2e.png",
  "Statisticians": "https://imgur.com/3mwS52o.png",
  "The Hodopian Dynasty": "https://imgur.com/1ccfmyy.png",
  "Varangian Guard": "https://imgur.com/xxS0mba.png",
  "The Boiz Army": "https://imgur.com/vUBb9GA.png",
}


#########################################
###### DO NOT CHANGE WHAT IS BELOW ######
#########################################
# pls

#
### Constants
#

# Total games by # of clans (= P choose 2) -- P := # of players per template
TOTAL_GAMES = {
  3: 33,
  4: 66,
  5: 110,
  6: 165,
  7: 231,
  8: 308,
  9: 396,
  10: 495
}

# Total points by # of clans (= 2*5*(P choose 2) + 3*4*(P choose 2) + 6*3*(P choose 2)) -- X := # of games per template
TOTAL_POINTS = {
  3: 120,
  4: 240,
  5: 400,
  6: 600,
  7: 840,
  8: 1120,
  9: 1440,
  10: 1800
}


############################
##### Helper Functions #####
############################

# Returns the name of the clan for a given team
def get_clan_name(cell):
  return cell['data-clan']

# Return result of division (used to prevent DivideByZero Errors)
def divide(a, b):
  return a/b if b else 0

# Returns a team object given the BS4 HTML cell
def format_team_dict(cell):
  # Grab clan name through the data attribute on the <td>s... Will always be correct
  obj = {"clan": cell['data-clan']}

  # Grab player names... Might be incorrect for games if player was subbed
  a_tags = cell.find_all("a")
  obj["players"] = []
  for i in range(1, len(a_tags), 2):
    obj["players"].append({"name": a_tags[i].get_text(), "id": a_tags[i]["href"][7:]})
  return obj

# Returns a string matching the clan name with the player names (for game log updates)
def format_team_string(team):
  team_str = team.clan
  for player in team["players"]:
    team_str += " {},".format(player.name)
  return team_str[:-1]

# Returns a mapping of all game links (used for set difference to find newly finished games)
# Ret: { division --> { template --> [game links]}}
def readInputFile():
  # Start reading the past results and parse shtuff
  input_file = open(INPUT_FILE_NAME, "r")

  previous_data = {}
  division = ""
  template = ""
  for line in input_file.readlines():
    if (re.search("^Division", line)):
      division = line[:-1]
      previous_data[division] = {}
    elif (re.search("^Template", line)):
      template = line[8:-1]
      previous_data[division][template] = []
    else:
      previous_data[division][template].append(line[:-1])
  input_file.close()
  return previous_data

def writeOutputFile(full_games):
  try:
    output_file = open(OUTPUT_FILE_NAME, "x")
  except:
    raise Exception("Output file already exists... Please change 'OUTPUT_FILE_NAME'")

  iterated_templates = set()
  for division, div_obj in full_games.items():
    output_file.write("{}\n".format(division))
    for template, games in div_obj.items():
      iterated_templates.add(template)
      output_file.write("Template{}\n".format(template))
      for game in games:
        output_file.write("{}\n".format(game["link"]))
    for template in tournaments:
      if template not in iterated_templates:
        output_file.write("Template{}\n".format(template))
  output_file.close()


# Reads the clot page and scrapes all games
def readClotPage():
  req = requests.get(CLOT_PAGE_URL)
  soup = BeautifulSoup(req.content, 'html.parser')

  counter = 0
  elements = soup.find_all("div", "row")

  # Trim unneeded container tags
  print("Size before trimming unneeded elements: {}".format(len(elements)))
  while counter < len(elements):
    if not re.search("^Division", elements[counter].get_text()):
      elements.pop(counter)
    else:
      counter += 1
  print("Size after trimming unneeded elements: {}".format(len(elements)))

  # division --> { template --> [ {winners: [], losers: [], link: str} ]}
  masterData = {}
  # division --> { template --> {clan --> {wins: int, losses: int}}}
  masterTournamentStandings = {}
  # division --> { clan --> {wins, losses, winPoints, lossPoints}}
  masterClanStandings = {}
  # division --> { games: int, points: int}
  totalFinished = {}

  for element in elements:
    division = element.get_text()[0:11].strip()
    template = element.get_text()[13: element.get_text().index(" Games")].strip()

    # Create new entries in the dicts if missing
    if division not in masterData:
      masterData[division] = {}
      masterTournamentStandings[division] = {}
      masterClanStandings[division] = {}
      totalFinished[division] = {"games": 0, "points": 0}
    if template not in masterData[division]:
      masterData[division][template] = []
      masterTournamentStandings[division][template] = {}

    # Parse the table
    tableRows = element.find_all("tr")
    headerRow = tableRows[0].find_all("td")
    tableRows.pop(0)
    headerRow.pop(0)

    # Iterate through each row
    for i in range(len(tableRows)):
      row = tableRows[i].find_all("td")
      leftTeam = row[0]
      row.pop(0)

      # Iterate each column in row (only upper diagonal needed since symmetry)
      for iter in range(i, len(headerRow)):
        topTeam = headerRow[iter]
        left_clan_name = get_clan_name(leftTeam)
        top_clan_name = get_clan_name(topTeam)

        # Create new entries in the dicts if needed
        if left_clan_name not in masterTournamentStandings[division][template]:
          masterTournamentStandings[division][template][left_clan_name] = {"wins": 0, "losses": 0}
        if left_clan_name not in masterClanStandings[division]:
          masterClanStandings[division][left_clan_name] = {"wins": 0, "losses": 0, "winPoints": 0, "lossPoints": 0}
        if top_clan_name not in masterTournamentStandings[division][template]:
          masterTournamentStandings[division][template][top_clan_name] = {"wins": 0, "losses": 0}
        if top_clan_name not in masterClanStandings[division]:
          masterClanStandings[division][top_clan_name] = {"wins": 0, "losses": 0, "winPoints": 0, "lossPoints": 0}

        # Skip cells with no game link
        if len(row[iter].find_all("a")) == 0:
          continue

        # Only process game if it is completed
        cell = row[iter].find_all("a")[0]
        if row[iter]["style"][-8:-1] != "#ffe7a3":
          newGame = {}

          if row[iter]["style"][-8:-1] == "#FBDFDF":
            # Top team won
            newGame["winners"] = format_team_dict(topTeam)
            newGame["losers"] = format_team_dict(leftTeam)
          else:
            # Left team won
            newGame["losers"] = format_team_dict(topTeam)
            newGame["winners"] = format_team_dict(leftTeam)

          # Determine the points per win for the tournament
          # 3v3 == 5pts; 2v2 == 4pts; 1v1 == 3pts
          tournament_index = tournaments.index(template)
          if tournament_index < 2:
            points = 5
          elif tournament_index < 5:
            points = 4
          else:
            points = 3

          masterTournamentStandings[division][template][newGame["winners"]["clan"]]["wins"] += 1
          masterTournamentStandings[division][template][newGame["losers"]["clan"]]["losses"] += 1
          masterClanStandings[division][newGame["winners"]["clan"]]["wins"] += 1
          masterClanStandings[division][newGame["winners"]["clan"]]["winPoints"] += points
          masterClanStandings[division][newGame["losers"]["clan"]]["losses"] += 1
          masterClanStandings[division][newGame["losers"]["clan"]]["lossPoints"] += points

          totalFinished[division]["games"] += 1
          totalFinished[division]["points"] += points

          newGame["link"] = cell.attrs["href"]
          masterData[division][template].append(newGame)
  return masterData, masterTournamentStandings, masterClanStandings, totalFinished

# Formats the template with its image on the forum post
def formatTemplateLine(template):
  return "[img]{}[/img] {}".format(template_links[template], template)

# Formats the players for a single team on a completed game
def formatPlayers(players):
  player_str = ""
  for player in players:
    player_str += "{}, ".format(player["name"])
  return player_str[:-2]

# Format the completed game line on the forum post
def formatGameLine(game):
  return "[i][img]{}[/img] {}[/i] defeated [i][img]{}[/img] {}[/i] - {}".format(clan_links[game["winners"]["clan"]], formatPlayers(game["winners"]["players"]), clan_links[game["losers"]["clan"]], formatPlayers(game["losers"]["players"]), game['link'])

# Format the entire tournament section (completed games + standings) on the forum post
def formatTournamentSection(tournament, tournament_games, tournament_standings):
  # Template information
  section_str = "{}\n\n".format(formatTemplateLine(tournament))

  # Recently completed games
  for game in tournament_games:
    section_str += "{}\n".format(formatGameLine(game))

  # Current Standings
  section_str += "\nCurrent Standings:\n\n[code]\n"
  games_per_clan = len(tournament_standings.items()) - 1
  sorted_tournament_standings = sorted(tournament_standings.items(), reverse=True, key=lambda e: (games_per_clan + e[1]["wins"] - e[1]["losses"]))
  for clan, standing in sorted_tournament_standings:
    section_str += "({}-{}) [img]{}[/img] {}\n".format(standing["wins"], standing["losses"], clan_links[clan], clan)
  section_str += "[/code]\n"

  return section_str

# Write a forum post for a single division
def writeForumPostForDivision(division_game_list, division_tournament_standings, division_standings, division_finished, division):
  forum_post = open(division + FORUM_FILE_NAME, 'w', encoding='utf-8')
  for tournament in tournaments:
    if tournament not in division_game_list:
      continue
    forum_post.write("{}[hr]\n\n".format(formatTournamentSection(tournament, division_game_list[tournament], division_tournament_standings[tournament])))

  # Horserace section... Order according to formula: (#ofGamesPerClan) + (#ofWins) - (#ofLosses)
  forum_post.write("[b]Horserace:[/b]\n[code]\n")

  idx = 1
  sorted_division_standings = sorted(division_standings.items(), key= lambda e: (-divide(e[1]["winPoints"] - point_penalties.get(e[0], 0), e[1]["winPoints"]+e[1]["lossPoints"]), -(e[1]["winPoints"] - point_penalties.get(e[0], 0))))

  longest_clan_name = 0
  for clan in sorted_division_standings:
    if clan[0] in abrv_clans:
      if len(abrv_clans_shortforms[abrv_clans.index(clan[0])]) > longest_clan_name:
        longest_clan_name = len(abrv_clans_shortforms[abrv_clans.index(clan[0])])
    else:
      if len(clan[0]) > longest_clan_name:
        longest_clan_name = len(clan[0])

  for clan, standings in sorted_division_standings:
    clan_win_points = standings["winPoints"] - point_penalties.get(clan, 0)
    if clan in abrv_clans:
      clan_name = abrv_clans_shortforms[abrv_clans.index(clan)]
    else:
      clan_name = clan

    total_points = TOTAL_POINTS[len(division_standings.items())] / len(division_standings.items()) * 2 - point_penalties.get(clan, 0)
    forum_post.write("{}. [img]{}[/img] {} - {:2d}W - {:2d}L - {:3d}/{:3d} pts, {:3.0f} MP, {:5.1f}% PC, {:5.1f}% GW\n".format(idx, clan_links[clan], (clan_name + (" " * longest_clan_name))[0:longest_clan_name], standings["wins"], standings["losses"], clan_win_points, (standings["winPoints"]+standings["lossPoints"]), total_points - standings["lossPoints"], round(divide(clan_win_points,(standings["winPoints"]+standings["lossPoints"])) * 100, 1), round(divide(standings["wins"],(standings["wins"]+standings["losses"])) * 100, 1)))
    idx += 1

  forum_post.write("[/code]\n\n")

  total_games = TOTAL_GAMES[len(division_standings.items())]
  total_points = TOTAL_POINTS[len(division_standings.items())]

  forum_post.write("[b]% of games finished:[/b] {}\n".format(round((division_finished["games"] / total_games) * 100, 1)))
  forum_post.write("[b]% of points finished:[/b] {}\n".format(round((division_finished["points"] / total_points) * 100, 1)))
  forum_post.close()



#####################################################
##################### Main Code #####################
#####################################################

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Parse Clan League games and generate forum bbcode output.", allow_abbrev=True)
parser.add_argument("-d", "--divisions", help="specify specific divisions to parse. (comma-delimited list)", default="*")
args = parser.parse_args()
print(args)
print()

divisions_to_iterate = set()
if args.divisions == "*":
  # default case: iterate all divisions
  divisions_to_iterate = divisions.values()
else:
  # special case: only iterate selected divisions
  for division in args.divisions.split(','):
    if division.lower() in divisions:
      divisions_to_iterate.add(divisions[division])

# There must be some division to parse
if len(divisions_to_iterate) == 0:
  raise Exception(f"Invalid division selection provided: '{args.divisions}'. Expected a comma-delimited list of '{','.join(divisions.keys())}'.")
print(f"Divisions to output: {', '.join(divisions_to_iterate)}\n")

# Get current CL game info from CLOT page (read-only)
full_game_list, full_tournament_standings, full_clan_standings, total_finished = readClotPage()
# Create new log file with all games to date (write-only)
writeOutputFile(full_game_list)
# Read previous log file with all games from previous update (read-only)
previous_game_list = readInputFile()

# Remove games that have been processed already (from input.txt)
removed_game_count = {}
total_game_count = {}
for division, div_obj in full_game_list.items():
  removed_game_count[division] = 0
  total_game_count[division] = 0
  for template, template_obj in div_obj.items():
    idx = 0
    while idx < len(template_obj):
      total_game_count[division] += 1
      if template_obj[idx]['link'] in previous_game_list[division][template]:
        full_game_list[division][template].pop(idx)
        removed_game_count[division] += 1
      else:
        idx += 1

# Output to console the game specs (ie # of games in div a to process/ etc)
total_games = 0
for division in total_game_count.keys():
  print("{} games to process: {}".format(division, total_game_count[division] - removed_game_count[division]))
  total_games += total_game_count[division]
print("Number of games in total: {}".format(total_games))

# Create the forum text for each division
for division in divisions_to_iterate:
  division_game_list = full_game_list[division]
  division_standings = full_tournament_standings[division]
  division_clan_standings = full_clan_standings[division]
  division_finished = total_finished[division]
  writeForumPostForDivision(division_game_list, division_standings, division_clan_standings, division_finished, division)
