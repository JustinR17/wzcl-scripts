var divisions = ["A", "B", "C", "D1", "D2", "D3"];
var TOTAL_POINTS = {
  3: 0.80,
  4: 1.20,
  5: 1.60,
  6: 2.00,
  7: 2.40,
  8: 2.80,
  9: 3.20,
  10: 3.60
};

function updateDivisionStandings(division) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('DATA_' + division);
  var clanStatsRange = sheet.getRange("A4:P10");
  var standingsRange = sheet.getRange("X36:AU101");
  var percentCompletedRange = sheet.getRange("AW36:BC101");
  
  var clanStatsData = clanStatsRange.getValues();
  var standingsData = standingsRange.getValues();
  var percentCompletedData = percentCompletedRange.getValues();
  
  let clans = {};
  for (const clanRow of clanStatsData) {
    if (clanRow[0].trim() == "") {
      continue;
    }
    clans[clanRow[0].trim()] = {tp: clanRow[6], pc: clanRow[8], wr: clanRow[13], tpc: clanRow[15]};
  }
  let clanCount = Object.keys(clans).length;
  
  Logger.log("Clan Count: " + clanCount + "\nClan Object: \n" + JSON.stringify(clans, null, 4));
    
  for (let i = 0; i < standingsData.length; i++) {
    if (new String(standingsData[i][1]).trim() == "") {
      
      // Set the week keys
      standingsData[i][0] = "Week " + (i-1);
      standingsData[i][8] = "Week " + (i-1);
      standingsData[i][16] = "Week " + (i-1);
      
      for (let j = 1; j < 8; j++) {
        if (!(standingsData[0][j] in clans)) {
          continue;
        }
        standingsData[i][j] = clans[standingsData[0][j]].tp;
      }
      
      for (let j = 0; j < 7; j++) {
        if (!(standingsData[0][j+1] in clans)) {
          continue;
        }
        standingsData[i][j + 9] = clans[standingsData[0][j+1]].pc;
        standingsData[i][j + 17] = clans[standingsData[0][j+1]].wr;
        percentCompletedData[i][j] = clans[standingsData[0][j+1]].tpc / TOTAL_POINTS[clanCount];
      }
      
      break;
    }
  }
  
  standingsRange.setValues(standingsData);
  percentCompletedRange.setValues(percentCompletedData);
}

function updateAllDivisionStandings() {
  for (const div of divisions) {
    Logger.log("Updating division " + div);
    updateDivisionStandings(div);
  }
}

function patchPointsContested() {
  for (const div of divisions) {
    Logger.log(`Running Division ${div}`);
    var sheet = SpreadsheetApp.getActive().getSheetByName('DATA_' + div);
    var standingsRange = sheet.getRange("X36:AM101");
    var standingsData = standingsRange.getValues();

    var winRateRange = sheet.getRange("AO36:AU101");
    var winRateData = winRateRange.getValues();

    var percentCompletedRange = sheet.getRange("AW36:BC101");
    var percentCompletedData = percentCompletedRange.getValues();


    if (new String(standingsData[0][7]).trim() == "") {
      // Patch the % completed
      // Total points by # of clans (= 2*5*(P choose 2) + 3*4*(P choose 2) + 6*3*(P choose 2)) -- X := # of games per template
      clanCount = 0;
      for (let i = 1; i < 8; i++) {
        if (new String(standingsData[0][i]).trim() != "") clanCount++;
      }

      for (let i = 1; i < standingsData.length; i++) {
        if (new String(standingsData[i][1]).trim() != "") {
          for (let j = 0; j < clanCount; j++) {
            percentCompletedData[i][j] = Number(standingsData[i][j+9]) / TOTAL_POINTS[clanCount];
          }
        } else {
          break;
        }
      }

      percentCompletedRange.setValues(percentCompletedData);
    }

      
    for (let i = 1; i < standingsData.length; i++) {
      if (new String(standingsData[i][0]).trim() != "") {

        for (let j = 1; j < 8; j++) {
          if (new String(standingsData[i][j]).trim() == "") {
            Logger.log(`Skipping ${i}-${j}`);
            continue;
          }

          winRateData[i][j-1] = Number(standingsData[i][j]) / Math.max(Number(standingsData[i][j+8]), 1) * 100
          standingsData[i][j+8] = Number(standingsData[i][j]) / Math.max(Number(standingsData[i][j+8]), 1) * 100
        }
      }
    }
    
    standingsRange.setValues(standingsData);
    winRateRange.setValues(winRateData);
  }
}

