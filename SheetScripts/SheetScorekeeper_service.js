const { writeFile, readFile } = require("fs");
const { google } = require("googleapis");
const axios = require('axios').default;
require("dotenv").config();

// Extra files
const { client_email, private_key } = require("./private.json")
const { webScrapeClot } = require("./WebScrapeClot.js");

/********************
 ***** Preamble *****
 ********************/

/*
The following should be updated somewhere once a clan league
*/

// UPDATE THE spreadsheet ID in the .env file... This is the ID in the URL
const spreadsheetId = process.env.CL18_SSID;
//CL17_SSID
//CL17_TEST_SSID
//CL16_SSID
//CL15_TEST_SSID

const EMAIL = process.env.Email
const TOKEN = process.env.APIToken

// This is a mapping from the clans true name (on wz and the clot) to the name normal name in the spreadsheet
// I separate divisions with an empty line, but this is purely visual and has no purpose
const API_TO_SHEET_CLANS = {
  "MASTER Clan": "MASTER Clan",
  "ONE!": "ONE!",
  "Lu Fredd": "Lu Fredd",
  "Python": "Python",
  "Union Strikes Back": "Union Strikes Back",
  "[Blitz]": "[Blitz]",
  "Optimum": "Optimum",

  "|GG|": "|GG|",
  "HAWKS": "HAWKS",
  "Harmony": "Harmony",
  "{101st}": "{101st}",
  "The Last Alliance": "The Last Alliance",
  "CORP": "CORP",
  "GRANDMASTER Clan": "GRANDMASTER Clan",

  "Vikinger": "Vikinger",
  "Brothers in Arms": "Brothers in Arms",
  "Myth Busters": "Myth Busters",
  "Prime": "Prime",
  "Union of Soviet Socialist Republics": "Union of Soviet Socialist Republics",
  "Polish Eagles": "Polish Eagles",
  "Partisans": "Partisans",

  "VS": "VS",
  "[V.I.W] Very Important Weirdos": "[V.I.W] Very Important Weirdos",
  "Nestlings": "Nestlings",
  "M'Hunters": "M'Hunters",
  "Battle Wolves": "Battle Wolves",
  "Soldiers of Fortune": "Soldiers of Fortune",
  "KILL ‘EM ALL": "KILL ‘EM ALL",

  "The Simulation": "The Simulation",
  "German Warlords": "German Warlords",
  "The Barbarians": "Barbarians",
  "The Poon Squad": "Poon Squad",
  "Undisputed": "Undisputed",

  // Keeping below for reference
  "Fifth Column Confederation": "Fifth Column Confederation",
  "French Community": "French Community",
  "Celtica": "Celtica",
  "The Blue Devils": "The Blue Devils",
  "peepee poo fard": "peepee poo fard",
  "Cats": "Cats",
  "SPARTA": "SPARTA",
  "Nofrag": "Nofrag",
  "[WG]": "|WG|",
  "Discovery": "Discovery",
  "M'Hunters": "M'Hunters",
  "Statisticians": "Statisticians",
  "The Boiz Army": "The Boiz Army",
  "Varangian Guard": "Varangian Guard",
  "The Hodopian Dynasty": "The Hodopian Dynasty",
};

// Divisions array for iterating
const DIVISIONS = ["A", "B", "C"];

const TEMPLATE_TO_POINTS = {
  "3v3 Middle Earth in Third Age": 5,
  "3v3 Deadman's Rome": 5,
  "2v2 Volcano Island": 4,
  "2v2 Szeurope": 4,
  "2v2 Crimea Army Cap": 4,
  "1v1 Unicorn Island": 3,
  "1v1 MME MA LD LF": 3,
  "1v1 Aseridith Islands": 3,
  "1v1 Guiroma": 3,
  "1v1 Landria": 3,
  "1v1 Fogless Fighting (CL)": 3,
};

/*************************************
 **** DO NOT CHANGE WHAT IS BELOW ****
 *************************************/

// Google API Scope for reading/writing spreadsheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**********************
 ** Helper Functions **
 ***********************/

// Scrapes the clot page (should be used in live environment)
async function apiWebScrape() {
  let games = await webScrapeClot();
  writeFile("cl.json", JSON.stringify(games), (err) => {
    if (err) return console.error(err);
    console.log("Games stored to cl.json");
  });
  return games;
}

// Reads saved data from the cl.json file (which is saved from apiWebScrape())
// Useful for testing as apiWebScrape() takes a while
async function mockWebScrape() {
  return new Promise((resolve, reject) => {
    readFile("cl.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Sheets API.
      resolve(JSON.parse(content));
    });
  });
}

const QUERY_GAME_API = 'https://www.warzone.com/API/GameFeed';
async function getWarzoneGameTurn(gameUrl) {
  const gameId = /GameID=(\d*)$/.exec(gameUrl)[1];
  response = await axios.post(`${QUERY_GAME_API}?GameID=${gameId}`, `APIToken=${TOKEN}&Email=${EMAIL}`);

  return (response.data.state === "WaitingForPlayers" ? -2 : response.data.numberOfTurns) ?? -2;
}

async function updateSheet(division, games, sheet, boots, finished_game_list) {

  let clanGamesRO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: `GL${division}!A1:E254`,
    })
  ).data.values;

  // Need to extract specific columns to avoid expensive (useless) formula updates in sheet
  let leftClanGamesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: `GL${division}!B1:B254`,
    })
  ).data.values;
  let rightClanGamesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: `GL${division}!D1:F254`,
    })
  ).data.values;

  // Ensure lengths are identical
  while (leftClanGamesWO.length < clanGamesRO.length) {
    leftClanGamesWO.push([]);
  }
  while (rightClanGamesWO.length < clanGamesRO.length) {
    rightClanGamesWO.push([]);
  }

  let templateGames = games["Division " + division];
  let tournaments = [];
  console.log(JSON.stringify(templateGames, null, 4));

  //! Start with updating wins/losses & links for clans
  let template;
  let formats = ["1v1", "2v2", "3v3"];
  for (let row = 0; row < clanGamesRO.length; row++) {
    if (clanGamesRO[row] && formats.includes(clanGamesRO[row][0])) {
      // new template
      template = clanGamesRO[row][0] + " " + clanGamesRO[row][1];
      tournaments.push(template);
      console.log("\tStarting to process: " + template);

      // Check if the CLOT tournament has started
      // If tourney has started, then this means the names do not match
      if (!templateGames[template]) {
        console.log(`\t\tCould not find ${template}`);
      }
    } else if (template) {
      // If tourney has not started, then do not process rows
      if (!templateGames[template]) {
        continue;
      }
      
      if (leftClanGamesWO[row] && leftClanGamesWO[row].length != 1) {
        // ensure arrays have proper length
        leftClanGamesWO[row] = [''];
      }
      while (rightClanGamesWO[row].length < 3) {
        // ensure arrays have proper length
        rightClanGamesWO[row].push('');
      }

      // Find applicable game
      let game = templateGames[template].find(
        (obj) =>
          (API_TO_SHEET_CLANS[obj.winners.name] === clanGamesRO[row][0] &&
            API_TO_SHEET_CLANS[obj.losers.name] === clanGamesRO[row][2]) ||
          (API_TO_SHEET_CLANS[obj.winners.name] === clanGamesRO[row][2] &&
            API_TO_SHEET_CLANS[obj.losers.name] === clanGamesRO[row][0])
      );
      if (game) {
        if (game.isFinished && !clanGamesRO[row][1]) {
          game.division = division;
          game.template = template;
          finished_game_list.push(game)
          if (game.isBoot || game.isNonJoin) {
            boots.push(game);
          }

          if (clanGamesRO[row][0] === API_TO_SHEET_CLANS[game.winners.name]) {
            leftClanGamesWO[row][0] = "WON";
            rightClanGamesWO[row][0] = "LOST";
          } else {
            leftClanGamesWO[row][0] = "LOST";
            rightClanGamesWO[row][0] = "WON";
          }
        }
        
        if (!clanGamesRO[row][1] || !rightClanGamesWO[row][2]) {
          // add the current turn to the sheet
          // we only do this if the game has not been marked finished already
          rightClanGamesWO[row][2] = await getWarzoneGameTurn(game.link);
        }

        if (!clanGamesRO[row][4]) {
          rightClanGamesWO[row][1] = game.link;
        }
      }
    }
  }

  // Update left column (just contains updated WON/LOST values)
  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `GL${division}!B1:B254`,
        resource: { values: leftClanGamesWO },
        valueInputOption: "USER_ENTERED",
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
          // [START_EXCLUDE silent]
          reject(err);
          // [END_EXCLUDE]
        } else {
          console.log(`Successfully updated the left column of clans`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
  // Update right columns (WON/LOST vaues & game links)
  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `GL${division}!D1:F254`,
        resource: { values: rightClanGamesWO },
        valueInputOption: "USER_ENTERED",
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
          // [START_EXCLUDE silent]
          reject(err);
          // [END_EXCLUDE]
        } else {
          console.log(`Successfully updated the right columns of clans`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });



  //! Update individual player stats now
  let playerTablesRO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: division === 'C' ? 'GLC!P3:AE253' : `GL${division}!O3:AD253`,
    })
  ).data.values;
  // Avoid overwriting unchanging fomula values (ie clans) as these are expensive to recompute
  let playerTablesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: division === 'C' ? `GLC!Z3:AA315` : `GL${division}!Y3:Z253`,
    })
  ).data.values;

  let tindex = 0;

  for (let row = 0; row < playerTablesRO.length; row++) {
    // Update template index if start of new table
    // else check if there is a player on the slot (prevents empty rows or overall clan results)
    if (playerTablesRO[row][0] === "CLAN" && playerTablesRO[row][1] === "PLAYERS") {
      tindex++;
    } else if (playerTablesRO[row][13]) {
      // Skip row check if tournament has not started
      if (!templateGames[tournaments[tindex]]){
        continue;
      }

      // Process players
      let pids = [playerTablesRO[row][13]];
      if (playerTablesRO[row][14]) pids.push(playerTablesRO[row][14]);
      if (playerTablesRO[row][15]) pids.push(playerTablesRO[row][15]);

      // Find results of the specific team in the tournament
      let result = { wins: 0, losses: 0 };
      for (const game of templateGames[tournaments[tindex]]) {
        if (!game.isFinished) continue;
        if (game.winners.players.every((e) => pids.includes(e))) {
          result.wins++;
        } else if (game.losers.players.every((e) => pids.includes(e))) {
          result.losses++;
        }
      }
      
      playerTablesWO[row][0] = result.wins;
      playerTablesWO[row][1] = result.losses;
    }
  }

  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: division === 'C' ? `GLC!Z3:AA253` : `GL${division}!Y3:Z253`,
        resource: { values: playerTablesWO },
        valueInputOption: "USER_ENTERED",
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
          // [START_EXCLUDE silent]
          reject(err);
          // [END_EXCLUDE]
        } else {
          console.log(`Successfully updated the team results.`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
}

async function updateBoots(boots, sheet) {
  let currentBootsRO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: `Boots!A2:G200`
    })
  ).data.values;

  // Find the next empty row to append to
  let i = 0;
  while (currentBootsRO && currentBootsRO[i] && currentBootsRO[i][0]) {
    i++;
  }
  let currentBootsWO = [];

  // Sort the games by date first and then push new results to a writable rows array
  boots.sort((a, b) => (a.date < b.date ? -1 : 1));
  for (let idx = 0; idx < boots.length; idx++) {
    currentBootsWO.push([
      boots[idx].date,
      boots[idx].division,
      boots[idx].template,
      boots[idx].winners.name,
      boots[idx].losers.name,
      boots[idx].link,
      boots[idx].isBoot ? "Boot" : "Non-join",
    ]);
  }

  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `Boots!A${2+i}:G${2+i+boots.length}`,
        resource: { values: currentBootsWO },
        valueInputOption: "USER_ENTERED",
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
          // [START_EXCLUDE silent]
          reject(err);
          // [END_EXCLUDE]
        } else {
          console.log(`Successfully updated the boots table with ${boots.length} new boots.`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
}

function getClanPointsForGameList(clans, points, winner, loser) {
  let sheetOutput = [];

  // Return a list of points contested/won for each clan based on the new game row
  for (let clan of Object.keys(clans)) {
    // points contested increases for both winner and loser
    // points won increases for the winner only
    sheetOutput.push((clan === winner || clan === loser ? points : 0) + clans[clan].pc);
    sheetOutput.push((clan === winner ? points : 0) + clans[clan].pw);

    // Update the sums for any later games to parse
    if (clan === winner || clan === loser) clans[clan].pc += points
    if (clan === winner) clans[clan].pw += points
  }

  return sheetOutput
}

async function updateSheetGameList(division, game_list, sheet) {
  let currentGamesRO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: `Games_${division}!A1:T500`
    })
  ).data.values;


  // First we must iterate through existing games to tally the clan points contested (pc) & points won (pw)
  // This also initializes the writer head pointer to the next empty position
  let i = 1;
  while (currentGamesRO && currentGamesRO[i] && currentGamesRO[i][0]) {
    i++;
  }
  let currentGamesWO = [];
  // Sort the games by date first and then push new results to a writable rows array
  game_list.sort((a, b) => (a.date < b.date ? -1 : 1));
  for (let idx = 0; idx < game_list.length; idx++) {
    currentGamesWO.push([
      game_list[idx].template,
      API_TO_SHEET_CLANS[game_list[idx].winners.name],
      API_TO_SHEET_CLANS[game_list[idx].losers.name],
      TEMPLATE_TO_POINTS[game_list[idx].template],
      game_list[idx].date,
      game_list[idx].link,
    ]);
  }

  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `Games_${division}!A${1+i}:F${1+i+game_list.length}`,
        resource: { values: currentGamesWO },
        valueInputOption: "USER_ENTERED",
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
          // [START_EXCLUDE silent]
          reject(err);
          // [END_EXCLUDE]
        } else {
          console.log(`Successfully updated the contested points games table with ${game_list.length} new games.`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
}

// Partially flattens the games dictionary to a sorted list by division
function manuallyConstructDivisionGameList(game_list, games) {
  for (const [division, templates] of Object.entries(games)) {
    game_list[division] = []
    for (const [template, games] of Object.entries(templates)) {
      for (const game of games) {
        game.division = division;
        game.template = template;
        game_list[division].push(game);
      }
    }
  }
}

// Useful function to gather boots without updating the GL sheets
function manuallyAddBoots(boots, games) {
  for (const [division, templates] of Object.entries(games)) {
    for (const [template, games] of Object.entries(templates)) {
      for (const game of games) {
        if (game.isFinished && (game.isBoot || game.isNonJoin)) {
          game.division = division;
          game.template = template;
          boots.push(game);
        }
      }
    }
  }
}

async function updateAllSheets(auth) {
  let sheet = google.sheets({ version: "v4", auth });

  // apiWebScrape uses the newest data on the clot
  // mockWebScrape mainly used for testing... uses stored cl.json data that apiWebScrape updates
  let games = await apiWebScrape();
  // let games = await mockWebScrape();

  let boots = [];
  let game_list = {};

  for (const division of DIVISIONS) {
    console.log(`Updating sheet for division ${division}`);
    game_list[division] = [];
    await updateSheet(division, games, sheet, boots, game_list[division]);
    await updateSheetGameList(division, game_list[division], sheet);
  }

  // manuallyAddBoots(boots, games);

  await updateBoots(boots, sheet);
}

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
  client_email,
  null,
  private_key,
  SCOPES
);
//authenticate request
jwtClient.authorize(async (err, tokens) => {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Successfully connected!");
    await updateAllSheets();
  }
});
