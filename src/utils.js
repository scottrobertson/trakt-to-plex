import readline from "readline";
import chalk from "chalk";

export function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

export function formatSeasonEpisode(season, episode) {
  const seasonStr = formatSeason(season);
  const episodeStr = `E${episode.toString().padStart(2, "0")}`;
  return `${seasonStr}${episodeStr}`;
}

export function formatSeason(season) {
  return `S${season.toString().padStart(2, "0")}`;
}

export function logBlue(message) {
  console.log(chalk.blue.bold(message));
}

export function logGreen(message) {
  console.log(chalk.green(message));
}

export function logRed(message) {
  console.log(chalk.red(message));
}

export function logYellow(message) {
  console.log(chalk.yellow(message));
}
