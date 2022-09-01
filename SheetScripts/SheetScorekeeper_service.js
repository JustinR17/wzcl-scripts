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
const spreadsheetId = process.env.CL15_TEST_SSID;
//CL16_SSID
//CL15_TEST_SSID

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
      range: `GL${division}!D1:E254`,
    })
  ).data.values;

  let templateGames = games["Division " + division];
  let tournaments = [];

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
      if (rightClanGamesWO[row] && rightClanGamesWO[row].length != 2) {
        // ensure arrays have proper length
        rightClanGamesWO[row] = ['',''];
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
          if (game.isBoot || game.isNonJoin) {
            game.division = division;
            game.template = template;
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
        range: `GL${division}!D1:E254`,
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
      range: `GL${division}!O3:AD253`,
    })
  ).data.values;
  // Avoid overwriting unchanging fomula values (ie clans) as these are expensive to recompute
  let playerTablesWO = (
    await sheet.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      valueRenderOption: "FORMULA",
      range: `GL${division}!Y3:Z253`,
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
        range: `GL${division}!Y3:Z253`,
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

  // Find the next row to add to
  let i = 0;
  while (currentBootsRO && currentBootsRO[i] && currentBootsRO[i][0]) {
    i++;
  }
  let currentBootsWO = [];

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

  for (const division of DIVISIONS) {
    console.log(`Updating sheet for division ${division}`);
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
