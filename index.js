const fs = require('fs');

// Učitavanje podataka iz JSON fajlova
const groups = JSON.parse(fs.readFileSync('groups.json', 'utf-8'));
const exhibitions = JSON.parse(fs.readFileSync('exibitions.json', 'utf-8'));

// Funkcija za simulaciju rezultata na osnovu FIBA ranga i forme
function simulateGame(team1, team2, exhibitions) {
    const rankDifference = team1.FIBARanking - team2.FIBARanking;
    const baseWinProbability = 0.5 + (rankDifference / 100);

    const team1Form = calculateForm(team1.ISOCode, exhibitions);
    const team2Form = calculateForm(team2.ISOCode, exhibitions);

    const team1WinProbability = baseWinProbability + (team1Form - team2Form) / 100;

    return Math.random() < team1WinProbability ? team1 : team2;
}

// Funkcija za računanje forme tima na osnovu prijateljskih utakmica
function calculateForm(teamCode, exhibitions) {
    if (!exhibitions[teamCode]) return 0;
    let totalPoints = 0;
    exhibitions[teamCode].forEach(game => {
        const result = game.Result.split('-').map(Number);
        totalPoints += result[0] - result[1];
    });
    return totalPoints / exhibitions[teamCode].length;
}

// Simulacija grupne faze
function simulateGroupStage(groups, exhibitions) {
    const results = {};
    const standings = {};

    for (const groupName in groups) {
        const group = groups[groupName];
        results[groupName] = [];
        standings[groupName] = {};

        for (const team of group) {
            standings[groupName][team.Team] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
        }

        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const winner = simulateGame(group[i], group[j], exhibitions);
                const loser = winner === group[i] ? group[j] : group[i];
                const winnerPoints = randomPoints();
                const loserPoints = Math.floor(winnerPoints * Math.random());

                results[groupName].push({
                    game: `${winner.Team} - ${loser.Team}`,
                    result: `${winnerPoints}:${loserPoints}`,
                });

                // Ažuriranje rezultata
                standings[groupName][winner.Team].wins++;
                standings[groupName][loser.Team].losses++;
                standings[groupName][winner.Team].pointsFor += winnerPoints;
                standings[groupName][loser.Team].pointsFor += loserPoints;
                standings[groupName][winner.Team].pointsAgainst += loserPoints;
                standings[groupName][loser.Team].pointsAgainst += winnerPoints;
            }
        }
    }

    return { results, standings };
}

// Funkcija za generisanje nasumičnih poena za tim
function randomPoints() {
    return Math.floor(Math.random() * 40) + 80;
}

// Generisanje rezultata grupne faze
const { results: groupStageResults, standings: groupStandings } = simulateGroupStage(groups, exhibitions);

// Prikaz rezultata
for (const groupName in groupStageResults) {
    console.log(`Grupa ${groupName}:`);
    groupStageResults[groupName].forEach(game => {
        console.log(`  ${game.game} (${game.result})`);
    });

    console.log(`Konačan plasman u grupama:`);
    const teams = Object.keys(groupStandings[groupName]);
    teams.sort((a, b) => {
        const aStats = groupStandings[groupName][a];
        const bStats = groupStandings[groupName][b];
        const pointDiffA = aStats.pointsFor - aStats.pointsAgainst;
        const pointDiffB = bStats.pointsFor - bStats.pointsAgainst;
        return bStats.wins - aStats.wins || pointDiffB - pointDiffA; // Sortiranje po pobedama i koš razlici
    });

    teams.forEach((team, index) => {
        const stats = groupStandings[groupName][team];
        console.log(`    ${index + 1}. ${team} ${stats.wins} / ${stats.losses} / ${stats.wins + stats.losses} / ${stats.pointsFor} / ${stats.pointsAgainst} / ${stats.pointsFor - stats.pointsAgainst}`);
    });
}

// Žreb za četvrtfinale
const quarterfinals = {
    D: [], // Timovi sa rangom 1
    G: [], // Timovi sa rangom 2
    E: [], // Timovi sa rangom 3
    F: []  // Timovi sa rangom 4
};

// Prikupljanje timova u šešire
for (const groupName in groupStandings) {
    const teams = Object.keys(groupStandings[groupName]);
    quarterfinals.D.push(teams[0]); // 1. mesto
    quarterfinals.G.push(teams[1]); // 2. mesto
    quarterfinals.E.push(teams[2]); // 3. mesto
    quarterfinals.F.push(teams[3]); // 4. mesto
}

// Randomizacija parova četvrtfinala
const quarterfinalPairs = [
    [quarterfinals.D[0], quarterfinals.G[1]], // 1. mesto grupe A protiv 2. mesta grupe B
    [quarterfinals.D[1], quarterfinals.G[0]], // 1. mesto grupe B protiv 2. mesta grupe A
    [quarterfinals.E[0], quarterfinals.F[1]], // 3. mesto grupe A protiv 4. mesta grupe B
    [quarterfinals.E[1], quarterfinals.F[0]]  // 3. mesto grupe B protiv 4. mesta grupe A
];

// Prikazivanje šešira
console.log(`\nŠeširi:`);
console.log(`    Šešir D`);
quarterfinals.D.forEach(team => console.log(`        ${team}`));
console.log(`    Šešir G`);
quarterfinals.G.forEach(team => console.log(`        ${team}`));
console.log(`    Šešir E`);
quarterfinals.E.forEach(team => console.log(`        ${team}`));
console.log(`    Šešir F`);
quarterfinals.F.forEach(team => console.log(`        ${team}`));

// Eliminaciona faza - Četvrtfinale
const eliminationResults = [];
quarterfinalPairs.forEach(pair => {
    const winner = simulateGame({ Team: pair[0] }, { Team: pair[1] }, exhibitions).Team;
    const loser = pair[0] === winner ? pair[1] : pair[0];
    const winnerPoints = randomPoints();
    const loserPoints = Math.floor(winnerPoints * Math.random());
    eliminationResults.push({
        match: `${pair[0]} - ${pair[1]}`,
        result: `${winnerPoints}:${loserPoints}`,
        winner
    });
});

// Prikazivanje rezultata četvrtfinala
console.log(`\nČetvrtfinale:`);
eliminationResults.slice(0, 4).forEach(game => {
    console.log(`    ${game.match} (${game.result})`);
});

// Polufinale
const semifinalResults = [];
for (let i = 0; i < 4; i += 2) {
    const team1 = { Team: eliminationResults[i].winner };
    const team2 = { Team: eliminationResults[i + 1].winner };
    const winner = simulateGame(team1, team2, exhibitions).Team;
    const winnerPoints = randomPoints();
    const loserPoints = Math.floor(winnerPoints * Math.random());
    semifinalResults.push({ match: `${team1.Team} - ${team2.Team}`, result: `${winnerPoints}:${loserPoints}`, winner });
}

// Prikazivanje rezultata polufinala
console.log(`\nPolufinale:`);
semifinalResults.forEach(match => {
    console.log(`    ${match.match} (${match.result})`);
});

// Utakmica za treće mesto
const bronzeMatch = {
    team1: semifinalResults[0].winner === eliminationResults[0].winner ? eliminationResults[1].winner : eliminationResults[0].winner,
    team2: semifinalResults[1].winner === eliminationResults[2].winner ? eliminationResults[3].winner : eliminationResults[2].winner
};
const bronzeWinner = simulateGame({ Team: bronzeMatch.team1 }, { Team: bronzeMatch.team2 }, exhibitions).Team;
const bronzeWinnerPoints = randomPoints();
const bronzeLoserPoints = Math.floor(bronzeWinnerPoints * Math.random());

console.log(`\nUtakmica za treće mesto:`);
console.log(`    ${bronzeMatch.team1} - ${bronzeMatch.team2} (${bronzeWinnerPoints}:${bronzeLoserPoints})`);

// Finale
const finalWinner = simulateGame({ Team: semifinalResults[0].winner }, { Team: semifinalResults[1].winner }, exhibitions).Team;
const finalWinnerPoints = randomPoints();
const finalLoserPoints = Math.floor(finalWinnerPoints * Math.random());

console.log(`\nFinale:`);
console.log(`    ${semifinalResults[0].winner} - ${semifinalResults[1].winner} (${finalWinnerPoints}:${finalLoserPoints})`);
