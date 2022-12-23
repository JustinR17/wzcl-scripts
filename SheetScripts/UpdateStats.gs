
var templates = [
  "Biomes of Americas",
  "Europe",
  "Final Earth",
  "Guiroma",
  "Timid Land",
  "ME WR",
  "Georgia Army Cap",
  "Hannibal at the Gates",
  "French Brawl",
  "Elitist Africa",
  "Post-Melt Antarctica"
];
var divisions = ["A", "B", "C", "D1", "D2", "D3"];

function updateSheet(division) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('GL' + division);
  Logger.log(division);

  
    
  var res = sheet.getRange("O1:Z254").getValues();
  var lastRow = sheet.getLastRow();
  
  var isStanding = false;
  var clanName = "";
  var players = {};
  var templateIndex=-1;
  for (var row = 0; row < res.length; row++) {
    if (res[row][0] == "CLAN" && res[row][1] == "PLAYERS") {
      // Found new table to parse... commence parsing
      templateIndex++;
      console.log(`Started ${templates[templateIndex]} at row ${row}`);
      isStanding = true;
      continue;
    } else if (!isStanding) {
      continue;
    } else if (res[row][0] === "" && res[row][1] === "" && res[row][10] === "") {
      // Reached end of list... disable parsing for now
      Logger.log(`Finished ${templates[templateIndex]} at row ${row}`);
      isStanding = false;
      continue;
    }
    
    // Parses the GLX sheets line-by-line to determine the total wins/losses of every player by template
    if (res[row][0].trim()) {
      clanName = res[row][0].trim();
    }
    
    
    if (res[row][1].trim()) {
      if (res[row][1].trim() in players) {
        let targetPlayerTemplate = players[res[row][1].trim()].temp.filter((e) => e.name == templates[templateIndex]);
        if (targetPlayerTemplate.length) {
          targetPlayerTemplate[0].wins += res[row][10];
          targetPlayerTemplate[0].losses += res[row][11];
        } else {
          players[res[row][1].trim()].temp.push({name: templates[templateIndex], wins: res[row][10], losses: res[row][11]});
        }
      } else {
          players[res[row][1].trim()] = {clan: clanName, temp: [{name: templates[templateIndex], wins: res[row][10], losses: res[row][11]}]};
      }
      
      if (res[row][4].trim()) {
        if (res[row][4].trim() in players) {
          let targetPlayerTemplate = players[res[row][4].trim()].temp.filter((e) => e.name == templates[templateIndex]);
          if (targetPlayerTemplate.length) {
            targetPlayerTemplate[0].wins += res[row][10];
            targetPlayerTemplate[0].losses += res[row][11];
          } else {
            players[res[row][4].trim()].temp.push({name: templates[templateIndex], wins: res[row][10], losses: res[row][11]});
          }
        } else {
          players[res[row][4].trim()] = {clan: clanName, temp: [{name: templates[templateIndex], wins: res[row][10], losses: res[row][11]}]};
        }
      
        if (res[row][7].trim()) {
          if (res[row][7].trim() in players) {
            let targetPlayerTemplate = players[res[row][7].trim()].temp.filter((e) => e.name == templates[templateIndex]);
            if (targetPlayerTemplate.length) {
              targetPlayerTemplate[0].wins += res[row][10];
              targetPlayerTemplate[0].losses += res[row][11];
            } else {
              players[res[row][7].trim()].temp.push({name: templates[templateIndex], wins: res[row][10], losses: res[row][11]});
            }
          } else {
            players[res[row][7].trim()] = {clan: clanName, temp: [{name: templates[templateIndex], wins: res[row][10], losses: res[row][11]}]};
          }
        }
      
      }
    }
  }
  
  // Quick test:
//  Logger.log("Number of keys in " + division + ": " + Object.keys(players).length);
//  Logger.log("Farah: " + players["Farah♦"]);
  // Parsed through all players
  // Now writes results to stats page
  writeResults(players, division);
  Logger.log("\n");
}

function playerTemplateDataIndex(templateData, templateName) {
  for (let i = 0; i < templateData.length; i++) {
    if (templateData[i].name == templateName) {
      return i;
    }
  }
  
  return -1;
}

function writeResults(players, division) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Player_Stats');
  var nameRange = sheet.getRange("A2:C510");
  var template1Range = sheet.getRange("K2:M510");
  var template2Range = sheet.getRange("O2:Q510");
  var template3Range = sheet.getRange("S2:U510");
  
  var nameData = nameRange.getValues();
  var template1Data = template1Range.getValues();
  var template2Data = template2Range.getValues();
  var template3Data = template3Range.getValues();
  
  for (var row = 0; row < nameData.length; row++) {
    if (!nameData[row] || nameData[row][0] != division) {
      continue;
    }
    var name = nameData[row][1].trim();
    
    //Logger.log(players[name]);
    if (nameData[row][0].trim() == division && name in players && players[name].clan == nameData[row][2].trim()) {
      Logger.log("Template: " + template1Data[row][0] + "\n" + playerTemplateDataIndex(players[name].temp, template1Data[row][0]));
      if (template1Data[row][0] && playerTemplateDataIndex(players[name].temp, template1Data[row][0]) != -1) {
        let template = players[name].temp[playerTemplateDataIndex(players[name].temp, template1Data[row][0])];
        template1Data[row][1] = template.wins;
        template1Data[row][2] = template.losses;
      }
      if (template2Data[row][0] && playerTemplateDataIndex(players[name].temp, template2Data[row][0]) != -1) {
        let template = players[name].temp[playerTemplateDataIndex(players[name].temp, template2Data[row][0])];
        template2Data[row][1] = template.wins;
        template2Data[row][2] = template.losses;
      }
      if (template3Data[row][0] && playerTemplateDataIndex(players[name].temp, template3Data[row][0]) != -1) {
        let template = players[name].temp[playerTemplateDataIndex(players[name].temp, template3Data[row][0])];
        template3Data[row][1] = template.wins;
        template3Data[row][2] = template.losses;
      }
    }
  }
  
  template1Range.setValues(template1Data);
  template2Range.setValues(template2Data);
  template3Range.setValues(template3Data);
}

function updateStats() {
  
  for (let div of divisions) {
    Logger.log(div);
    updateSheet(div);
  }
}
