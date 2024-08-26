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

    return Math.random() < team1WinProbability ? [team1, team2] : [team2, team1];
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
    for (const groupName in groups) {
        const group = groups[groupName];
        results[groupName] = [];
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const [winner, loser] = simulateGame(group[i], group[j], exhibitions);
                const winnerPoints = randomPoints();
                const loserPoints = Math.floor(winnerPoints * Math.random());
                results[groupName].push({
                    game: `${winner.Team} - ${loser.Team}`,
                    result: `${winnerPoints}:${loserPoints}`,
                });
            }
        }
    }
    return results;
}

// Funkcija za generisanje nasumičnih poena za tim
function randomPoints() {
    return Math.floor(Math.random() * 40) + 80;
}

// Generisanje rezultata grupne faze
const groupStageResults = simulateGroupStage(groups, exhibitions);

// Prikaz rezultata
for (const groupName in groupStageResults) {
    console.log(`Grupa ${groupName}:`);
    groupStageResults[groupName].forEach(game => {
        console.log(`  ${game.game} (${game.result})`);
    });
}
