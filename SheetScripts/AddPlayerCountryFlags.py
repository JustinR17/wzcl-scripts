import os
import re
import traceback
from typing import List

import requests
from bs4 import BeautifulSoup
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import Resource, build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
if os.path.exists("private.json"):
    creds = Credentials.from_service_account_file("private.json", scopes=SCOPES)
spreadsheet_id = os.environ.get("CL18_SSID")

try:
    service: Resource = build("sheets", "v4", credentials=creds)

    # Call the Sheets API
    sheet: Resource = service.spreadsheets()
except HttpError as err:
    print(err)


def get_player_country(player_url: str):
    req = requests.get(player_url)
    soup = BeautifulSoup(req.content, "html.parser")
    imgs = soup.find_all("img")

    for img in imgs:
        if "Images/Flags" in img["src"]:
            return re.search(
                r"^Plays from ([A-Za-z _]*)(: [A-Za-z _]*)?$", img["title"]
            ).group(1)
    print(f'No flag found for "{player_url}"')
    return ""


player_links = sheet.get(
    spreadsheetId=spreadsheet_id,
    ranges=[f"Player_Stats!B2:B600"],
    fields="sheets/data/rowData/values/hyperlink",
).execute()

player_countries: List[List[str]] = (
    sheet.values()
    .get(spreadsheetId=spreadsheet_id, range=f"Player_Stats!D2:D600")
    .execute()["values"]
)

values_updated = 0
print(player_countries)
for i, row in enumerate(player_links["sheets"][0]["data"][0]["rowData"]):
    try:
        if "values" not in row:
            continue
        if len(player_countries) < i + 1:
            player_countries.append([""])
        elif player_countries[i]:
            continue
        country = get_player_country(row["values"][0]["hyperlink"])
        print(f'{row["values"][0]["hyperlink"]}:\n\t{country}')
        player_countries[i] = [country]
        values_updated += 1
    except Exception as e:
        print(f"unable to find result for {i}: {row}")
        print(e)
        print(traceback.format_exc())

print(f"\n==========================\n\nValues updated: {values_updated}")
sheet.values().update(
    spreadsheetId=spreadsheet_id,
    range=f"Player_Stats!D2:D600",
    valueInputOption="USER_ENTERED",
    body={"values": player_countries},
).execute()
