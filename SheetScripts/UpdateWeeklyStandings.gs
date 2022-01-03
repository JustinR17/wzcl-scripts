var divisions = ["A", "B", "C", "D"];

function updateDivisionStandings(division) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('DATA_' + division);
  var clanStatsRange = sheet.getRange("A4:P10");
  var standingsRange = sheet.getRange("X36:AM101");
  var percentCompletedRange = sheet.getRange("AW36:BC101");
  
  var clanStatsData = clanStatsRange.getValues();
  var standingsData = standingsRange.getValues();
  var percentCompletedData = percentCompletedRange.getValues();
  
  let clans = {};
  for (const clanRow of clanStatsData) {
    if (clanRow[0].trim() == "") {
      continue;
    }
    clans[clanRow[0].trim()] = {tp: clanRow[6], pc: clanRow[15]};
  }
  
  Logger.log("Clan Object: \n" + JSON.stringify(clans, null, 4));
    
  for (let i = 0; i < standingsData.length; i++) {
    if (new String(standingsData[i][1]).trim() == "") {
      
      // Set the week keys
      standingsData[i][0] = "Week " + (i-1);
      standingsData[i][8] = "Week " + (i-1);
      
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
        standingsData[i][j + 9] = clans[standingsData[0][j+9]].pc;
        percentCompletedData[i][j] = clans[percentCompletedData[0][j]].pc / 2.4;
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