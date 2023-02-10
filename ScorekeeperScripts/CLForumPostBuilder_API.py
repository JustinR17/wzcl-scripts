from bs4 import BeautifulSoup
import requests
import re
import sys


################
### Preamble ###
################

###
### The following below should be changed on every run
###

# Input file name for finding games already processed in updates
INPUT_FILE_NAME =  "starterfile.txt"

# Output file cannot already exist or else I crash this... Prevents overwrites
OUTPUT_FILE_NAME = "diva.temp"


###
### The following should be changed once every clan league
###

# This will turn to -> "Division A.txt"
FORUM_FILE_NAME = ".txt"

# Must point to the base league page on the clot (showing all tournaments)
CLOT_PAGE_URL = "http://wzclot.eastus.cloudapp.azure.com/leagues/777/"

# Division order to show in output (MUST MATCH CLOT NAMES)
divisions = ["Division A", "Division B", "Division C", "Division D1", "Division D2", "Division D3"]

# Tournament order to show in output (MUST MATCH CLOT NAMES)
tournaments = [
  "CL16: 3v3 Biomes of America",
  "CL16: 3v3 Europe",
  "CL16: 2v2 Final Earth",
  "CL16: 2v2 Guiroma",
  "CL16: 2v2 Timid Land",
  "CL16: 1v1 ME WR",
  "CL16: 1v1 Georgia Army Cap",
  "CL16: 1v1 Hannibal at the Gates",
  "CL16: 1v1 French Brawl",
  "CL16: 1v1 Elitist Africa",
  "CL16: 1v1 Post-Melt Antarctica"
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

  # Archived
  "CL15: 3v3 Middle Earth in the Third Age": "https://imgur.com/pPYvIov.png",
  "CL15: 3v3 Deadman's Rise of Rome": "https://imgur.com/bB4ex5B.png",
  "CL15: 2v2 Szeurope": "https://imgur.com/Nqvvx3Q.png",
  "CL15: 2v2 Strategic MME": "https://imgur.com/7PJHjkF.png",
  "CL15: 2v2 Biomes of America": "https://imgur.com/PawtFUG.png",
  "CL15: 1v1 Timid Lands": "https://imgur.com/R5e3lyn.png",
  "CL15: 1v1 Aseridith Islands": "https://imgur.com/GHxmTRo.png",
  "CL15: 1v1 Battle Islands V": "https://imgur.com/UVDYfG0.png",
  "CL15: 1v1 Strategic Greece": "https://imgur.com/SPudXtE.png",
  "CL15: 1v1 Numenor": "https://imgur.com/l2iq2zR.png",
  "CL15: 1v1 Great Lakes": "https://imgur.com/oAe8HTv.png"
}

# Imgur links for clans to show on the forums... Make sure clan name matches the clot names
# Note: we use imgur as the links are short (link characters count in WZ forum character limit)
clan_links = {
  # Div A
  "Python": "https://i.imgur.com/WnXXWFK.png",
  "HAWKS": "https://i.imgur.com/1xgfJ4G.png",
  "MASTER Clan": "https://i.imgur.com/uHxS00R.png",
  "ONE!": "https://imgur.com/MrRBTDH.png",
  "Lu Fredd": "https://i.imgur.com/0gujLpK.png",
  "{101st}": "https://i.imgur.com/OkdlLpM.png",
  "French Community": "https://i.imgur.com/CkKg0jG.png",

  # Div B
  "Fifth Column Confederation": "https://i.imgur.com/mn8RPhZ.png",
  "|GG|": "https://i.imgur.com/Rrj2rKK.png",
  "[Blitz]": "https://i.imgur.com/qIAwJPK.png",
  "[V.I.W] Very Important Weirdos": "https://i.imgur.com/2HOm8M1.png",
  "The Last Alliance": "https://i.imgur.com/c2FMNmu.png",
  "Harmony": "https://imgur.com/VZGl4LU.png",
  "Optimum": "https://imgur.com/K2HAsvM.png",

  # Div C
  "CORP": "https://i.imgur.com/0zWLmjC.png",
  "Brothers in Arms": "https://i.imgur.com/BWiTNux.png",
  "Polish Eagles": "https://i.imgur.com/pzZVaEU.png",
  "GRANDMASTER Clan": "https://imgur.com/AD8wUnD.png",
  "Partisans": "https://imgur.com/5UigdKO.png",
  "VS": "https://i.imgur.com/tTPt5ms.png",
  "Vikinger": "https://i.imgur.com/UzqbzFY.png",

  # Div D1
  "Celtica": "https://imgur.com/Bqwcrgv.png",
  "The Blue Devils": "https://imgur.com/pLeKWlC.png",
  "peepee poo fard": "https://imgur.com/8YrrEHN.png",
  "Prime": "https://imgur.com/4qF99Bd.png",
  "Cats": "https://imgur.com/oA545py.png",

  # Div D2
  "Union of Soviet Socialist Republics": "https://imgur.com/4dxPFEP.png",
  "SPARTA": "https://imgur.com/W6cex5J.png",
  "Soldiers of Fortune": "https://imgur.com/wkiTBkg.png",
  "The Barbarians": "https://imgur.com/MtmcR4R.png",
  "Nofrag": "https://imgur.com/AvCa36j.png",
  "Nestlings": "https://imgur.com/tZGPF9g.png",

  # Div D3
  "M'Hunters": "https://i.imgur.com/Ink4qVz.png",
  "Myth Busters": "https://imgur.com/tH6BflU.png",
  "KILL ‘EM ALL": "https://imgur.com/OM3mlos.png",
  "Battle Wolves": "https://imgur.com/jFJqWnz.png",
  "German Warlords": "https://imgur.com/LtA4QBx.png",

  # Archived
  "[WG]": "https://i.imgur.com/DhsEbOC.png",
  "Discovery": "https://i.imgur.com/qOmbM2e.png",
  "Statisticians": "https://i.imgur.com/3mwS52o.png",
  "The Hodopian Dynasty": "https://i.imgur.com/1ccfmyy.png",
  "Varangian Guard": "https://i.imgur.com/xxS0mba.png",
  "The Boiz Army": "https://i.imgur.com/vUBb9GA.png",
}


#########################################
###### DO NOT CHANGE WHAT IS BELOW ######
#########################################
# pls

#
### Constants
#

# Total games by # of clans (11*X) -- X := # of games per template
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

WZ_API_URL = "https://www.warzone.com/API/ValidateInviteToken?Token="

############################
##### Helper Functions #####
############################

# Returns the name of the clan for a given team
def get_clan_name(cell):
  return cell['data-clan']

# Return result of division (used to prevent DivideByZero Errors)
def divide(a, b):
  return a/b if b else 0

def add_players_to_team_obj(obj, players):
  req_obj = {
    "Email": sys.argv[2],
    "APIToken": sys.argv[3]
  }

  obj["players"] = []

  for player in players.split("."):
    data = requests.post(WZ_API_URL + player, data=req_obj).json()

    if "name" in data:
      obj["players"].append({"name": data["name"], "id": player})
    else:
      # ID likely invalid or email/token wrong (for some reason... idk)
      print("Something bad happened while processing player of ID: '{}'".format(player))
      print(data)

# Returns a team object given the BS4 HTML cell
def format_team_dict(cell):
  # Grab clan name through the data attribute on the <td>s... Will always be correct
  obj = {"clan": cell['data-clan']}

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

  print("Starting to scrape games from the CLOT (44 tournaments in total)")

  # division --> { template --> [ {winners: [], losers: [], link: str} ]}
  masterData = {}
  # division --> { template --> {clan --> {wins: int, losses: int}}}
  masterTournamentStandings = {}
  # division --> { clan --> {wins, losses, winPoints, lossPoints}}
  masterClanStandings = {}
  # division --> { games: int, points: int}
  totalFinished = {}

  tournament_number = 0
  for element in elements:
    tournament_number += 1
    division = element.get_text()[0:11].strip()
    template = element.get_text()[13: element.get_text().index(" Games")].strip()
    total_games = 0
    print("\t{}. Processing {} - {} on the CLOT and WZ API".format(tournament_number, division, template))

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
          total_games += 1
          newGame = {}

          if row[iter]["style"][-8:-1] == "#FBDFDF":
            # Top team won
            newGame["winners"] = format_team_dict(topTeam)
            newGame["losers"] = format_team_dict(leftTeam)
          else:
            # Left team won
            newGame["losers"] = format_team_dict(topTeam)
            newGame["winners"] = format_team_dict(leftTeam)
          
          # Hit WZ API to obtain player names (Can't use CLOT names since these can be incorrect if there are subs)
          add_players_to_team_obj(newGame["winners"], row[iter]["data-players"].split("-")[0])
          add_players_to_team_obj(newGame["losers"], row[iter]["data-players"].split("-")[1])

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
    print("\t\tProcessed {} games in this tournament".format(total_games))
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

if len(sys.argv) < 4 or sys.argv[1] != "run":
  print("> Please pass in 'run', your email & API token enclosed in quotes as an argument to run the program.")
  print("> example: python CLForumPostBuilder_API.py run \"email@email.com\" \"apitoken123hi!345\"")
  sys.exit(0)

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
  total_games += total_game_count[division]
print("Number of games in total: {}".format(total_games))

# Create the forum text for each division
for division in divisions:
  division_game_list = full_game_list[division]
  division_standings = full_tournament_standings[division]
  division_clan_standings = full_clan_standings[division]
  division_finished = total_finished[division]
  writeForumPostForDivision(division_game_list, division_standings, division_clan_standings, division_finished, division)
