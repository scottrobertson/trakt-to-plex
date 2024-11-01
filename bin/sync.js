import Trakt from "trakt.tv";
import {
  buildPlexCache,
  buildPlexEpisodesCache,
  markAsWatched,
  findPlexGuid,
  loadSections,
} from "../src/plex.js";

import {
  askQuestion,
  logGreen,
  logRed,
  logYellow,
  logBlue,
  formatSeasonEpisode,
} from "../src/utils.js";

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

const sections = getConfig("plexSections")
  .split(",")
  .map((s) => s.trim());

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
    const watchedMovies = await trakt.users.watched({
      username: getConfig("traktUsername"),
      type: "movies",
    });

    await processMovies(plexCache, sectionConfig, watchedMovies);
  } else if (sectionConfig.type === "show") {
    const watchedShows = await trakt.users.watched({
      username: getConfig("traktUsername"),
      type: "shows",
    });

    await processShows(plexCache, sectionConfig, watchedShows);
  }
}
