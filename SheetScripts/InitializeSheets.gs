var templates = [
  // 3v3
  "Deadman's Rome",
  "Middle Earth in Third Age",

  // 2v2
  "Volcano Island",
  "Szeurope",
  "Crimea Army Cap",

  // 1v1
  "Unicorn Island",
  "MME MA LD LF",
  "Aseridith Islands",
  "Guiroma",
  "Landria",
  "Fogless Fighting (CL)"
];
var divisions = ["A", "B", "C1", "C2", "D"];
const PLAYER_URL_REGEX = /^.*?p=(\d*).*$/;

// Finds the index'th occurrence of the subString in the string
function getPosition(stringToSearch, subString, index) {
  return stringToSearch.split(subString, index).join(subString).length;
}

// Returns the number of clans in a division for the Rosters page
function getNumberOfClansRoster(rosterRow) {
  let numClans = 0;
  for (let i = 0; i < rosterRow.length; i += 3) {
    if (!!rosterRow[i]) numClans++;
  }

  return numClans;
}

// Reads the roster sheet to use for initializing the player stats
function readRosters() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Rosters");
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
    
  var rosterData = sheet.getRange("A1:U72").getValues();
  var rosterLinks = sheet.getRange("A1:U72").getRichTextValues();
  
  roster = [];
  order = [];

  for (let i = 0; i < divisions.length; i++) {
    // Iterate each of the divisions for rosters
    let divPlayers = {};
    let divClanOrder = []
    
    let numClans = getNumberOfClansRoster(rosterData[i * 12 + 1])
    for (let anchor = 0; anchor < numClans * 3; anchor+=3) {
      let clanName = rosterData[i * 12 + 1][anchor];
      divPlayers[clanName] = [];
      divClanOrder.push(clanName);
      
      for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 9; row++) {
          if (rosterData[i * 12 + 3 + row][anchor+col]) {
            divPlayers[clanName].push({
              link: rosterLinks[i * 12 + 3 + row][anchor+col].copy().build(),
              name: rosterData[i * 12 + 3 + row][anchor+col].trim()
            });
          }
        }
      }
    }
    
    roster.push(divPlayers);
    order.push(divClanOrder);
  }
  
  let obj = {order: order, roster: roster};
  
  
  
  //// Object Structure:
  // obj = {roster: roster, order: order}
  
  // order = [divAClans, divBClans, ...]
  // divXClans = [Lynx, SNinja, ...]
  
  // roster = [divAClanRoster, divBClanRoster, ...]
  // divAClanRoster = {clan: [players]}
  
  return obj;
}



// Gets the lineup of all clans to initialize the DATA_X and GLX sheets
function readLineups() {

  var sheet = SpreadsheetApp.getActive().getSheetByName("Original Lineups");
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
  
  let lineupData = sheet.getRange("A1:BJ60").getValues();
  let lineups = [];
  
  for (let divIdx = 0; divIdx < divisions.length; divIdx++) {
    let lineup = []

    for (let i = 1; i < lineupData[0].length; i+=6) {
      let templateLineup = {}
      
      for (let row = 0; row < 7; row++) {
        if (!lineupData[divIdx * 10 + 3 + row][0]) continue;

        templateLineup[lineupData[divIdx * 10 + 3 + row][0]] = [];
        for (let col = 0; col < 6; col+=2) {
          if (lineupData[divIdx * 10 + 3 + row][col+i]) {
            templateLineup[lineupData[divIdx * 10 + 3 + row][0]].push(lineupData[divIdx * 10 + 3 + row][col+i].trim());
          }
        }
      }
      lineup.push(templateLineup);
    }
    
    lineups.push(lineup);
  }
  
  //// Object Structure:
  // lineups = [divALineups, divBLineups, ...]
  // divALineups = {clan: [players]}
  
  
  return lineups;
}





///////////////////////////////////////////////////////////////////////////


function initializeDataSheets(division, clanOrder, lineups) {
  let sheet = SpreadsheetApp.getActive().getSheetByName('DATA_' + division);
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
  
  let lineupRange = sheet.getRange("K18:O114");
  let lineupData = lineupRange.getValues();

  for (let i = 0; i < templates.length; i++) {
    Logger.log(lineups[i]);
    for (let j = 0; j < clanOrder.length; j++) {
      for (let p = 0; p < lineups[i][clanOrder[j]].length; p++) {
        lineupData[j+i*9][p*2] = lineups[i][clanOrder[j]][p];
      }
    }
  }
  
  lineupRange.setValues(lineupData);
}





function initializeGLSheets(division, clanOrder, lineups, roster) {
  let sheet = SpreadsheetApp.getActive().getSheetByName('GL' + division);
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
  
  let lineupRange = sheet.getRange("P3:AD253");
  
  let lineupData = lineupRange.getFormulas();

  
  for (let i = 0; i < templates.length; i++) {
    for (let j = 0; j < clanOrder.length; j++) {
      for (let p = 0; p < lineups[i][clanOrder[j]].length; p++) {
        lineupData[j+i*23][p*3] = lineups[i][clanOrder[j]][p];

        // Add player IDs
        let playerObj = roster[clanOrder[j]].find(e => e.name === lineups[i][clanOrder[j]][p]);
        if (playerObj) {
          let link = playerObj.link.getLinkUrl();
          lineupData[j+i*23][p+12] = PLAYER_URL_REGEX.exec(link)[1];
        }
      }
      lineupData[j+i*23][9] = 0;
      lineupData[j+i*23][10] = 0;
    }
  }
  
  lineupRange.setValues(lineupData);
}


function getPointsMultiplier(template) {
  let templateIndex = templates.indexOf(template);
  if (templateIndex < 2) return 5;
  else if (templateIndex < 5) return 4;
  else return 3;
}

function getPointsAdjustedMultiplier(division) {
  if (division == 0) return 2.5;
  else if (division == 1) return 1.75;
  else if (division == 2) return 1.25;
  else return 1;
}

function initializeStatsSheets(rosters, lineups, clanOrders) {
  let sheet = SpreadsheetApp.getActive().getSheetByName('Player_Stats');
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
  
  Logger.log(lineups.length);
  
  let statsRange = sheet.getRange("A2:E800");
  let data = statsRange.getValues();
  let rtvRange = sheet.getRange("B2:B800");
  let rtv = rtvRange.getRichTextValues();
  
  let template1Range = sheet.getRange("K2:K800");
  let template1Data = template1Range.getValues();
  let template1PointsRange = sheet.getRange("N2:N800");
  let template1Points = template1Range.getValues();
  
  let template2Range = sheet.getRange("O2:O800");
  let template2Data = template2Range.getValues();
  let template2PointsRange = sheet.getRange("R2:R800");
  let template2Points = template2Range.getValues();
  
  let template3Range = sheet.getRange("S2:S800");
  let template3Data = template3Range.getValues();
  let template3PointsRange = sheet.getRange("V2:V800");
  let template3Points = template3Range.getValues();
 
  
  let rowPointer = 0;
  for (let i = 0; i < divisions.length; i++) {
    Logger.log(i);
    
    for (let clan of clanOrders[i]) {
      Logger.log(clan);
      for (let player of rosters[i][clan]) {
        data[rowPointer][0] = divisions[i];
        data[rowPointer][1] = player.name;
        rtv[rowPointer][0] = player.link;
        data[rowPointer][2] = clan;
        data[rowPointer][4] = "=H" + (2+rowPointer) + "*" + getPointsAdjustedMultiplier(i);
        
        // Now we need to find the template info
        let playerTemplates = [];
        Logger.log(player.name);
        for (let j = 0; j < templates.length; j++) {
          if (lineups[i][j][clan].includes(player.name.trim())) {
            playerTemplates.push(templates[j]);
          }
        }
        Logger.log(playerTemplates);
        template1Points[rowPointer][0] = "=0";
        template2Points[rowPointer][0] = "=0";
        template3Points[rowPointer][0] = "=0";
        if (playerTemplates.length) {
          template1Data[rowPointer][0] = playerTemplates[0];
          let multiplier = getPointsMultiplier(playerTemplates[0]);
          template1Points[rowPointer][0] = "=L" + (2 + rowPointer) + "*" + multiplier;
          
          if (playerTemplates[1]) {
            template2Data[rowPointer][0] = playerTemplates[1];
            multiplier = getPointsMultiplier(playerTemplates[1]);
            template2Points[rowPointer][0] = "=P" + (2 + rowPointer) + "*" + multiplier;
          }
          if (playerTemplates[2]) {
            template3Data[rowPointer][0] = playerTemplates[2];
            multiplier = getPointsMultiplier(playerTemplates[2]);
            template3Points[rowPointer][0] = "=T" + (2 + rowPointer) + "*" + multiplier;
          }
        }
        
        rowPointer++;
      }
    }
  }
  
  statsRange.setValues(data);
  rtvRange.setRichTextValues(rtv);
  template1Range.setValues(template1Data);
  template1PointsRange.setValues(template1Points);
  template2Range.setValues(template2Data);
  template2PointsRange.setValues(template2Points);
  template3Range.setValues(template3Data);
  template3PointsRange.setValues(template3Points);
}

function initialize() {
  
  let roster = readRosters();
  let lineups = readLineups();
  
  for (let i = 0; i < divisions.length; i++) {
    initializeDataSheets(divisions[i], roster.order[i], lineups[i]);
    initializeGLSheets(divisions[i], roster.order[i], lineups[i], roster.roster[i]);
    
  }
  
 initializeStatsSheets(roster.roster, lineups, roster.order);
  
}
