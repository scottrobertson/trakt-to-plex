import Trakt from "trakt.tv";
import { buildPlexSectionCache, loadSections } from "../src/plex.js";
import { askQuestion, logRed, logBlue, logYellow } from "../src/utils.js";
import { getConfig, setConfig, configRequired } from "../src/config.js";
import { processShows } from "../src/shows.js";
import { processMovies } from "../src/movies.js";
import {
  processShowsWatchlist,
  processMoviesWatchlist,
} from "../src/watchlist.js";

// Ensure all required config values are set
for (const [key, message] of Object.entries(configRequired)) {
  if (!getConfig(key)) {
    const value = await askQuestion(`${message}: `);
    setConfig(key, value);
  }
}

const trakt = new Trakt({
  client_id: getConfig("traktClientId"),
  client_secret: getConfig("traktClientSecret"),
});

const traktAccessToken = getConfig("traktAccessToken");

if (traktAccessToken) {
  await trakt.import_token(traktAccessToken);
} else {
  const traktAuthUrl = await trakt.get_url();
  console.log("Go to the following URL, and copy the code");
  console.log("");
  console.log(traktAuthUrl);
  console.log("");

  const code = await askQuestion("Enter the code: ");
  trakt.exchange_code(code).then((result) => {
    setConfig("traktAccessToken", result.access_token);
  });
}

const timerStart = performance.now();
const isDryRun = process.argv.includes("--dry-run");

if (isDryRun) {
  logYellow("!! Dry Run. Will not mark as watched");
  console.log("");
}

logBlue("Fetching movies from Trakt");
const traktWatchedMovies = await trakt.users.watched({
  username: getConfig("traktUsername"),
  type: "movies",
});

// Sort movies by name
traktWatchedMovies.sort((a, b) => {
  return a.movie.title.localeCompare(b.movie.title);
});

console.log(`Fetched ${traktWatchedMovies.length} movies from Trakt`);
console.log("");

logBlue("Fetching shows from Trakt");
const traktWatchedShows = await trakt.users.watched({
  username: getConfig("traktUsername"),
  type: "shows",
});

// Sort shows by name
traktWatchedShows.sort((a, b) => {
  return a.show.title.localeCompare(b.show.title);
});

console.log(`Fetched ${traktWatchedShows.length} shows from Trakt`);
console.log("");

let traktShowsWatchlist, traktMoviesWatchlist;
const syncWatchlist = getConfig("syncWatchlist");

if (syncWatchlist) {
  logBlue("Fetching shows watchlist from Trakt");
  traktShowsWatchlist = await trakt.users.watchlist({
    username: getConfig("traktUsername"),
    type: "shows",
  });

  console.log(
    `Fetched ${traktShowsWatchlist.length} watchlist shows from Trakt`
  );
  console.log("");

  logBlue("Fetching movies watchlist from Trakt");
  traktMoviesWatchlist = await trakt.users.watchlist({
    username: getConfig("traktUsername"),
    type: "movies",
  });

  console.log(
    `Fetched ${traktMoviesWatchlist.length} watchlist movies from Trakt`
  );
  console.log("");
}

const sections = getConfig("plexSections");
const plexSections = await loadSections();

for (const section of sections) {
  const sectionTimerStart = performance.now();

  logBlue(`Fetching section from Plex: ${section}`);

  const sectionConfig = plexSections[section];
  if (!sectionConfig) {
    logRed(`Section not found`);
    console.log("");
    continue;
  }

  const plexCache = await buildPlexSectionCache(sectionConfig);
  console.log(`Fetched ${Object.keys(plexCache.keys).length} items from Plex`);
  console.log("");

  logBlue(`Processing type: ${sectionConfig.type}`);
  console.log("");

  if (sectionConfig.type === "movie") {
    if (syncWatchlist) {
      logBlue("Processing watchlist: movies");
      await processMoviesWatchlist(plexCache, traktMoviesWatchlist, isDryRun);
      console.log("");
    }

    logBlue("Processing watch states: movies");
    await processMovies(plexCache, sectionConfig, traktWatchedMovies, isDryRun);
  } else if (sectionConfig.type === "show") {
    if (syncWatchlist) {
      logBlue("Processing watchlist: shows");
      await processShowsWatchlist(plexCache, traktShowsWatchlist, isDryRun);
      console.log("");
    }

    logBlue("Processing watch states: shows");
    await processShows(plexCache, sectionConfig, traktWatchedShows, isDryRun);
  }

  const sectionDurationInSeconds =
    (performance.now() - sectionTimerStart) / 1000;
  console.log(`Took ${sectionDurationInSeconds.toFixed(2)}s`);
  console.log("------------");
  console.log("");
}

const durationInSeconds = (performance.now() - timerStart) / 1000;
console.log(`Full sync took ${durationInSeconds.toFixed(2)}s`);
