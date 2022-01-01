var axios = require('axios').default;
var cheerio = require('cheerio').default;


async function formatTeamObjects(winnerCell, loserCell, gameObj, gameId, gameCell) {
    const reqstr = `Email=${process.env.Email}&APIToken=${process.env.APIToken}`;

    gameObj.winners = {name: winnerCell.attribs["data-clan"], players: gameCell.attribs['data-players'].split("-")[0].split(".")};
    gameObj.losers = {name: loserCell.attribs["data-clan"], players: gameCell.attribs['data-players'].split("-")[1].split(".")};
    gameObj.date = new Date(gameCell.attribs['data-date']);

    let gameData = await axios.post(process.env.WZ_GAME_API + "?GameID=" + gameId, reqstr);
    if (gameData.data.error && gameData.data.error.includes('ServerGameKeyNotFound')) {
        gameObj.isNonJoin = true;
        return;
    }

    for (const player of gameData.data.players) {
        if ((player.humanTurnedIntoAI === "True" && player.state !== "Won") || player.state === "Booted") {
            gameObj.isBoot = true;
        }
    }
}


async function webScrapeClot() {
    // Scrape the CLOT page to find the players & game results

    // games: { division: {template: [{winners: {clan, players}, losers, link}]}}}
    let games = {};

    return new Promise((resolve, reject) => {
        axios.get(process.env.CLOT_URL).then(async (html) => {
            const $ = cheerio.load(html.data);
            
            // Web scrape page for links
            let tables = $('table');

            
            for (let table of tables) {
                if (table.attribs.id || table.attribs.class == null || table.attribs.class.indexOf("clot_table") == -1) continue;
                
                // All remaining tables reflect CL game tables to parse
                
                let tablerows = table.children[0].children;
                let division = tablerows[0].children[0].children[0].data.substring(0, 10);
                let template = tablerows[0].children[0].children[0].data.substring(13);

                if (template.includes("Deadman's")) {
                    template = "3v3 Deadman's RoR";
                } else if (template.includes("Middle Earth")) {
                    template = "3v3 Middle Earth";
                }
                
                // Init games object if div/template does not exist
                if (!(division in games)) {
                    games[division] = {};
                }
                if (!(template in games[division])) {
                    games[division][template] = [];
                }

                let topteams = tablerows[0].children;
                // Get rid of first cell of row (shows div/template)
                topteams.slice(0, 1);
                // Get rid of first row of table (shows teams)
                tablerows.slice(0, 1);

                for (let i = 0; i < tablerows.length; i++) {
                    let leftteam = tablerows[i].children[0];
                    tablerows[i].children.slice(0, 1);

                    // Only consider upper diagonal (or else games are duplicated)
                    for (let col = i; col < tablerows[i].children.length; col++) {
                        // parse game cells
                        let cells = tablerows[i].children;
                        if ("style" in cells[col].attribs) {
                            // cell has game
                            if (cells[col].attribs.style.indexOf("ffe7a3") != -1) {
                                // Game in progres
                                games[division][template].push({link: cells[col].children[0].attribs.href, winners: {name: leftteam.attribs["data-clan"]}, losers: {name: topteams[col].attribs["data-clan"]}, isFinished: false});
                            } else {
                                let newgame = {link: cells[col].children[0].attribs.href};
                
                                if (cells[col].attribs.style.indexOf("#FBDFDF") != -1) {
                                    // Top team won
                                    await formatTeamObjects(topteams[col], leftteam, newgame, cells[col].children[0].attribs.href.substring(cells[col].children[0].attribs.href.indexOf("=")+1), cells[col]);
                                } else {
                                    // Left team won
                                    await formatTeamObjects(leftteam, topteams[col], newgame, cells[col].children[0].attribs.href.substring(cells[col].children[0].attribs.href.indexOf("=")+1), cells[col]);

                                }
                                newgame.isFinished = true;
                                games[division][template].push(newgame);
                            }
                        }
                    }
                }

                console.log(`Finished processing ${division} - ${template}`);
            }


            resolve(games);
        });
    });
}

module.exports = {
    webScrapeClot
};
