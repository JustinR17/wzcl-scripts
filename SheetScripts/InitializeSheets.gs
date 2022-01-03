
var templates = ["Deadman's RoR", "Middle Earth", "Szeurope", "Strategic MME", "Biomes of America", "Timid Lands", "Aseridith Islands", "Battle Islands V", "Strategic Greece", "Numenor", "Great Lakes"];
var divisions = ["A", "B", "C", "D"];

// Finds the index'th occurrence of the subString in the string
function getPosition(string, subString, index) {
  return string.split(subString, index).join(subString).length;
}

// Reads the roster sheet to use for initializing the player stats
function readRosters() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Rosters");
  Logger.log("Here is the sheet name: " + SpreadsheetApp.getActive().getName());
  Logger.log("Here is the sheet: " + sheet.getSheetName());
    
  
  var divAClans = sheet.getRange("A2:U2").getValues();
  var divARosters = sheet.getRange("A4:U12").getValues();
  var divARostersLinks = sheet.getRange("A4:U12").getRichTextValues();

  var divBClans = sheet.getRange("A14:U14").getValues();
  var divBRosters = sheet.getRange("A16:U24").getValues();
  var divBRostersLinks = sheet.getRange("A16:U24").getRichTextValues();

  var divCClans = sheet.getRange("A26:U26").getValues();
  var divCRosters = sheet.getRange("A28:U36").getValues();
  var divCRostersLinks = sheet.getRange("A28:U36").getRichTextValues();
  
  var divDClans = sheet.getRange("A38:U38").getValues();
  var divDRosters = sheet.getRange("A40:U48").getValues();
  var divDRostersLinks = sheet.getRange("A40:U48").getRichTextValues();
  
  roster = [];
  order = [];
  
  // Grab the A players
  let divAPlayers = {};
  let divAClanOrder = []
  for (var i = 0; i < divAClans[0].length; i+=3) {
    let clanName = divAClans[0][i];
    divAPlayers[clanName] = [];
    divAClanOrder.push(clanName);
    
    for (let col = 0; col < 3; col++) {
      for (var row = 0; row < 9; row++) {
        if (divARosters[row][i+col]) {
          divAPlayers[clanName].push({link: divARostersLinks[row][i+col].copy().build(), name: divARosters[row][i+col].trim()});
        }
      }
    }
  }
  
  roster.push(divAPlayers);
  order.push(divAClanOrder);
  
  
  // Grab the B players
  let divBPlayers = {};
  let divBClanOrder = []
  for (var i = 0; i < divBClans[0].length; i+=3) {
    let clanName = divBClans[0][i];
    divBPlayers[clanName] = [];
    divBClanOrder.push(clanName);
    
    for (let col = 0; col < 3; col++) {
      for (var row = 0; row < 9; row++) {
        if (divBRosters[row][i+col]) {
          divBPlayers[clanName].push({link: divBRostersLinks[row][i+col].copy().build(), name: divBRosters[row][i+col].trim()});
        }
      }
    }
  }
  
  roster.push(divBPlayers);
  order.push(divBClanOrder);
  
  
  // Grab the C players
  let divCPlayers = {};
  let divCClanOrder = []
  for (var i = 0; i < divCClans[0].length; i+=3) {
    let clanName = divCClans[0][i];
    divCPlayers[clanName] = [];
    divCClanOrder.push(clanName);
    
    for (let col = 0; col < 3; col++) {
      for (var row = 0; row < 9; row++) {
        if (divCRosters[row][i+col]) {
          divCPlayers[clanName].push({link: divCRostersLinks[row][i+col].copy().build(), name: divCRosters[row][i+col].trim()});
        }
      }
    }
  }
  
  roster.push(divCPlayers);
  order.push(divCClanOrder);
  
  
  // Grab the D players
  let divDPlayers = {};
  let divDClanOrder = []
  for (var i = 0; i < divDClans[0].length; i+=3) {
    let clanName = divDClans[0][i];
    divDPlayers[clanName] = [];
    divDClanOrder.push(clanName);
    
    for (let col = 0; col < 3; col++) {
      for (var row = 0; row < 9; row++) {
        if (divDRosters[row][i+col]) {
          divDPlayers[clanName].push({link: divDRostersLinks[row][i+col].copy().build(), name: divDRosters[row][i+col].trim()});
        }
      }
    }
  }
  
  roster.push(divDPlayers);
  order.push(divDClanOrder);
  
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
    
  var divA = sheet.getRange("A4:BJ10").getValues();
  var divB = sheet.getRange("A14:BJ20").getValues();
  var divC = sheet.getRange("A24:BJ30").getValues();
  var divD = sheet.getRange("A34:BJ40").getValues();
  
  let lineups = [];
  
  
  // Grabbing A lineups
  let lineupA = [];
  
  for (let i = 0; i < divA[0].length-1; i+=6) {
    let templateLineup = {}
    
    for (let row = 0; row < 7; row++) {
      templateLineup[divA[row][0]] = [];
      for (let col = 0; col < 6; col+=2) {
        if (divA[row][col+1+i]) {
          templateLineup[divA[row][0]].push(divA[row][col+1+i].trim());
        }
      }
    }
    lineupA.push(templateLineup);
  }
  
  lineups.push(lineupA);
  
  
  
  // Grabbing B lineups
  let lineupB = [];
  
  for (let i = 0; i < divB[0].length-1; i+=6) {
    let templateLineup = {}
    
    for (let row = 0; row < 7; row++) {
      templateLineup[divB[row][0]] = [];
      for (let col = 0; col < 6; col+=2) {
        if (divB[row][col+1+i]) {
          templateLineup[divB[row][0]].push(divB[row][col+1+i].trim());
        }
      }
    }
    
    lineupB.push(templateLineup);
  }
  
  lineups.push(lineupB);
  
  
  
  // Grabbing C lineups
  let lineupC = [];
  
  for (let i = 0; i < divC[0].length-1; i+=6) {
    let templateLineup = {}
    
    for (let row = 0; row < 7; row++) {
      templateLineup[divC[row][0]] = [];
      for (let col = 0; col < 6; col+=2) {
        if (divC[row][col+1+i]) {
          templateLineup[divC[row][0]].push(divC[row][col+1+i].trim());
        }
      }
    }
    
    lineupC.push(templateLineup);
  }
  
  lineups.push(lineupC);
  
  
  
  // Grabbing D lineups
  let lineupD = [];
  
  for (let i = 0; i < divD[0].length-1; i+=6) {
    let templateLineup = {}
    
    for (let row = 0; row < 7; row++) {
      templateLineup[divD[row][0]] = [];
      for (let col = 0; col < 6; col+=2) {
        if (divD[row][col+1+i]) {
          templateLineup[divD[row][0]].push(divD[row][col+1+i].trim());
        }
      }
    }
    
    lineupD.push(templateLineup);
  }
  
  lineups.push(lineupD);
  
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
          lineupData[j+i*23][p+12] = link.substring(link.indexOf("=")+1);
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
  
  let statsRange = sheet.getRange("A2:E500");
  let data = statsRange.getValues();
  let rtvRange = sheet.getRange("B2:B500");
  let rtv = rtvRange.getRichTextValues();
  
  let template1Range = sheet.getRange("K2:K500");
  let template1Data = template1Range.getValues();
  let template1PointsRange = sheet.getRange("N2:N500");
  let template1Points = template1Range.getValues();
  
  let template2Range = sheet.getRange("O2:O500");
  let template2Data = template2Range.getValues();
  let template2PointsRange = sheet.getRange("R2:R500");
  let template2Points = template2Range.getValues();
  
  let template3Range = sheet.getRange("S2:S500");
  let template3Data = template3Range.getValues();
  let template3PointsRange = sheet.getRange("V2:V500");
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
  
  for (let i = 0; i < 4 && false; i++) {
    initializeDataSheets(divisions[i], roster.order[i], lineups[i]);
    initializeGLSheets(divisions[i], roster.order[i], lineups[i], roster.roster[i]);
    
  }
  
 initializeStatsSheets(roster.roster, lineups, roster.order);
  
}
