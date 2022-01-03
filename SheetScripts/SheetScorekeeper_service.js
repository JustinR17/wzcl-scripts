const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

// Extra files
let privateKey = require("./private.json");
const { webScrapeClot } = require("./WebScrapeClot");

/********************
 ***** Preamble *****
 ********************/

/*
The following should be updated somewhere once a clan league
*/

// UPDATE THE spreadsheet ID in the .env file... This is the ID in the URL
const spreadsheetId = process.env.SSID;

// This is a mapping from the clans true name (on wz and the clot) to the name normal name in the spreadsheet
// I separate divisions with an empty line, but this is purely visual and has no purpose
const API_TO_SHEET_CLANS = {
  "ONE!": "ONE!",
  "[WG]": "|WG|",
  "Fifth Column Confederation": "Fifth Column Confederation",
  "HAWKS": "HAWKS",
  "Lu Fredd": "Lu Fredd",
  "Python": "Python",
  "MASTER Clan": "MASTER Clan",
  
  "{101st}": "{101st}",
  "[Blitz]": "[Blitz]",
  "CORP": "CORP",
  "Discovery": "Discovery",
  "French Community": "French Community",
  "|GG|": "Good Gamers",
  "M'Hunters": "M'Hunters",
  
  "Brothers in Arms": "Brothers in Arms",
  "Statisticians": "Statisticians",
  "The Boiz Army": "The Boiz Army",
  "The Last Alliance": "The Last Alliance",
  "Varangian Guard": "Varangian Guard",
  "[V.I.W] Very Important Weirdos": "Very Important Weirdos",
  "Vikinger": "Vikinger",
  
  "GRANDMASTER Clan": "GRANDMASTER Clan",
  "Partisans": "Partisans",
  "Polish Eagles": "Polish Eagles",
  "The Hodopian Dynasty": "The Hodopian Dynasty",
  "VS": "VS",
};


/*************************************
 **** DO NOT CHANGE WHAT IS BELOW ****
 *************************************/

// Divisions array for iterating
const DIVISIONS = ["A", "B", "C", "D"];

// Google API Scope for reading/writing spreadsheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**********************
 ** Helper Functions **
 ***********************/

// Scrapes the clot page (should be used in live environment)
async function apiWebScrape() {
  let games = await webScrapeClot();
  fs.writeFile("cl.json", JSON.stringify(games), (err) => {
    if (err) return console.error(err);
    console.log("Games stored to cl.json");
  });
  return games;
}

// Reads saved data from the cl.json file (which is saved from apiWebScrape())
// Useful for testing as apiWebScrape() takes a while
async function mockWebScrape() {
  return new Promise((resolve, reject) => {
    fs.readFile("cl.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Sheets API.
      resolve(JSON.parse(content));
    });
  });
}

async function updateSheet(division, games, sheet, boots) {

  let clanGamesRO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: `GL${division}!A1:E255`,
    })
  ).data.values;
  let clanGamesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: `GL${division}!A1:E255`,
    })
  ).data.values;

  let templateGames = games["Division " + division];
  let tournaments = [];

  //! Start with updating wins/losses & links for clans
  let template;
  let formats = ["1v1", "2v2", "3v3"];
  for (let row = 0; row < clanGamesWO.length; row++) {
    if (clanGamesRO[row] && formats.includes(clanGamesRO[row][0])) {
      // new template
      template = clanGamesRO[row][0] + " " + clanGamesRO[row][1];
      tournaments.push(template);
      console.log("Starting to process: " + template);
    } else if (template) {
      if (!templateGames[template]) {
        console.log(`Could not find ${template}`);
        continue;
      }
      let game = templateGames[template].find(
        (obj) =>
          (API_TO_SHEET_CLANS[obj.winners.name] === clanGamesRO[row][0] &&
            API_TO_SHEET_CLANS[obj.losers.name] === clanGamesRO[row][2]) ||
          (API_TO_SHEET_CLANS[obj.winners.name] === clanGamesRO[row][2] &&
            API_TO_SHEET_CLANS[obj.losers.name] === clanGamesRO[row][0])
      );
      if (game) {
        if (game.isFinished && !clanGamesRO[row][1]) {
          if (game.isBoot || game.isNonJoin) {
            game.division = division;
            game.template = template;
            boots.push(game);
          }

          if (clanGamesRO[row][0] === API_TO_SHEET_CLANS[game.winners.name]) {
            clanGamesWO[row][1] = "WON";
            clanGamesWO[row][3] = "LOST";
          } else {
            clanGamesWO[row][1] = "LOST";
            clanGamesWO[row][3] = "WON";
          }
        }

        if (!clanGamesRO[row][4]) {
          clanGamesWO[row][4] = game.link;
        }
      }
    }
  }

  // Update cells
  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `GL${division}!A1:E255`,
        resource: { values: clanGamesWO },
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
          console.log(`${result.data.updatedCells} cells updated.`);
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
      range: `GL${division}!O3:AD255`,
    })
  ).data.values;
  let playerTablesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: `GL${division}!O3:AD255`,
    })
  ).data.values;

  let tindex = 0;

  for (let row = 0; row < playerTablesRO.length; row++) {
    if (
      playerTablesRO[row][0] === "CLAN" &&
      playerTablesRO[row][1] === "PLAYERS"
    ) {
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

      let result = { wins: 0, losses: 0 };
      for (const game of templateGames[tournaments[tindex]]) {
        if (!game.isFinished) continue;
        if (game.winners.players.every((e) => pids.includes(e))) {
          result.wins++;
        } else if (game.losers.players.every((e) => pids.includes(e))) {
          result.losses++;
        }
      }
      
      playerTablesWO[row][10] = result.wins;
      playerTablesWO[row][11] = result.losses;
    }
  }

  await new Promise((resolve, reject) => {
    sheet.spreadsheets.values.update(
      {
        auth: jwtClient,
        spreadsheetId: spreadsheetId,
        range: `GL${division}!O3:AD253`,
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
          console.log(`${result.data.updatedCells} cells updated.`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
}

async function updateBoots(boots, sheet) {
  boots.sort((a, b) => (a.date < b.date ? -1 : 1));
  let bootSheetRows = [];
  for (let idx = 0; idx < boots.length; idx++) {
    bootSheetRows.push([
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
        range: `Boots!A2:G${boots.length + 2}`,
        resource: { values: bootSheetRows },
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
          console.log(`${result.data.updatedCells} cells updated.`);
          // [START_EXCLUDE silent]
          resolve(result);
          // [END_EXCLUDE]
        }
      }
    );
  });
}

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

  let games = await apiWebScrape();
  // let games = await mockWebScrape();

  let boots = [];

  for (const division of DIVISIONS) {
    await updateSheet(division, games, sheet, boots);
  }

  // manuallyAddBoots(boots, games);

  await updateBoots(boots, sheet);
}

// configure a JWT auth client
let jwtClient = new google.auth.JWT(
  privateKey.client_email,
  null,
  privateKey.private_key,
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

