import Trakt from "trakt.tv";
import { buildPlexCache, loadSections } from "../src/plex.js";
import { askQuestion, logRed, logBlue } from "../src/utils.js";
import { getConfig, setConfig, configRequired } from "../src/config.js";
import { processShows } from "../src/shows.js";
import { processMovies } from "../src/movies.js";

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

const sections = getConfig("plexSections");
const plexSections = await loadSections();

for (const section of sections) {
  logBlue(`Processing section: ${section}`);
  console.log("");

  const sectionConfig = plexSections[section];
  if (!sectionConfig) {
    logRed(`Section not found`);
    console.log("");
    continue;
  }

  const plexCache = await buildPlexCache(sectionConfig);

  if (sectionConfig.type === "movie") {
    await processMovies(plexCache, sectionConfig, traktWatchedMovies);
  } else if (sectionConfig.type === "show") {
    await processShows(plexCache, sectionConfig, traktWatchedShows);
  }
}
