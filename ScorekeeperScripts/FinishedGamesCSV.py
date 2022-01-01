from bs4 import BeautifulSoup
import requests
import re
import sys

# Output file cannot already exist or else I crash this... Prevents overwrites
OUTPUT_FILE_NAME = "output.txt"

# Must point to the base league page on the clot (showing all tournaments)
CLOT_PAGE_URL = "http://wzclot.eastus.cloudapp.azure.com/leagues/681/"


#########################################
###### DO NOT CHANGE WHAT IS BELOW ######
#########################################
# pls

############################
### Object Declarations ###
############################

# Ordering of divisions and tournaments for consistency
divisions = ["Division A", "Division B", "Division C", "Division D"]
tournaments = ["CL15: 3v3 Middle Earth in the Third Age", "CL15: 3v3 Deadman's Rise of Rome", "CL15: 2v2 Szeurope", "CL15: 2v2 Strategic MME", "CL15: 2v2 Biomes of America", "CL15: 1v1 Timid Lands", "CL15: 1v1 Aseridith Islands", "CL15: 1v1 Battle Islands V", "CL15: 1v1 Strategic Greece", "CL15: 1v1 Numenor", "CL15: 1v1 Great Lakes"]

abrv_clans = ["Fifth Column Confederation", "[V.I.W] Very Important Weirdos", "MASTER Clan", "French Community", "Brothers in Arms", "The Last Alliance", "The Hodopian Dynasty", "GRANDMASTER Clan"]
abrv_clans_shortforms = ["FCC", "VIW", "Masters", "FC", "BIA", "TLA", "Hodopian Dynasty", "Grandmasters"]



############################
##### Helper Functions #####
############################

# Returns a team object given the BS4 HTML cell
def format_team_dict(cell):
  # Grab clan name through the data attribute on the <td>s... Will always be correct
  return cell['data-clan']

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
  print("Starting to webscrape the CLOT page")
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

  for element in elements:
    division = element.get_text()[0:10]
    template = element.get_text()[13: element.get_text().index(" Games")]

    # Create new entries in the dicts if missing
    if division not in masterData:
      masterData[division] = {}
    if template not in masterData[division]:
      masterData[division][template] = []

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

        # Skip cells with no game link
        if len(row[iter].find_all("a")) == 0:
          continue

        # Only process game if it is completed
        cell = row[iter].find_all("a")[0]
        if row[iter]["style"][-8:-1] != "#ffe7a3":
          newGame = {}

          if row[iter]["style"][-8:-1] == "#FBDFDF":
            # Top team won
            newGame["winner"] = format_team_dict(topTeam)
            newGame["loser"] = format_team_dict(leftTeam)
          else:
            # Left team won
            newGame["loser"] = format_team_dict(topTeam)
            newGame["winner"] = format_team_dict(leftTeam)

          # Determine the points per win for the tournament
          # 3v3 == 5pts; 2v2 == 4pts; 1v1 == 3pts
          tournament_index = tournaments.index(template)
          if tournament_index < 2:
            points = 5
          elif tournament_index < 5:
            points = 4
          else:
            points = 3

          newGame["end_date"] = row[iter].attrs["data-date"]
          newGame["points"] = points
          newGame["link"] = cell.attrs["href"]
          masterData[division][template].append(newGame)
  return masterData

def parseDateTimeString(date):
  spl_date = re.split('/| |:', date)
  for i in range(len(spl_date)):
    if i != 2:
      # All fields except year are 2 digits
      spl_date[i] = ('0' + spl_date[i])[-2:]
  return "{}/{}/{} {}:{}:{}".format(spl_date[0], spl_date[1], spl_date[2], spl_date[3], spl_date[4], spl_date[5])

def findWZAPIData(game_list):
  flattened_game_list = []
  total_games = 0

  print("Starting the processing of games for output")
  for division, templates in game_list.items():
    for template, games in templates.items():
      for game in games:
        total_games += 1
        game["division"] = division
        game["template"] = template
        flattened_game_list.append(game)

  print("Number of games found to output: {}".format(total_games))
  flattened_game_list.sort(key= lambda e: e["end_date"])
  return flattened_game_list

def writeDataFile(game_list):
  of = open(OUTPUT_FILE_NAME, 'w', encoding='utf-8')
  of.write("Division\tTemplate\tWinner\tLoser\tPoints\tEnd Date\tLink\n")
  for game in game_list:
    of.write("{}\t{}\t{}\t{}\t{}\t{}\t{}\n".format(game["division"], game["template"], game["winner"], game["loser"], game["points"], game["end_date"], game["link"]))
  of.close()

#####################################################
##################### Main Code #####################
#####################################################

if len(sys.argv) < 2 or sys.argv[1] != "run":
  print("> Please pass in 'run' as an argument to run the program.")
  print("> example: python LFScript.py run")
  sys.exit(0)

# Get current CL game info from CLOT page (read-only)
full_game_list = readClotPage()

# Conver the nested div/template dictionary to a flattened list of games
games = findWZAPIData(full_game_list)

# Create the output file
writeDataFile(games)
