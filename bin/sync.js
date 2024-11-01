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

  await trakt.exchange_code(code).then((result) => {
    setConfig("traktAccessToken", result.access_token);
  });
}

const sections = getConfig("plexSections")
  .split(",")
  .map((s) => s.trim());

const plexSections = await loadSections();

for (const section of sections) {
  const sectionConfig = plexSections[section];

  logBlue(`Processing section: ${sectionConfig.title}`);
  const plexCache = await buildPlexCache(sectionConfig);
  console.log("");

  if (sectionConfig.type === "movie") {
    const watchedMovies = await trakt.users.watched({
      username: getConfig("traktUsername"),
      type: "movies",
    });

    logBlue("Processing watched movies", watchedMovies.length);
    console.log("");

    for (const movie of watchedMovies) {
      console.log(movie.movie.title);
      const plexGuid = findPlexGuid(plexCache, movie.movie.ids);

      if (plexGuid) {
        if (plexCache.lastViewedAt[plexGuid]) {
          logYellow("Already marked as watched in Plex");
        } else {
          logGreen("Marking as watched in Plex");
          await markAsWatched(plexGuid);
        }
      } else {
        logRed(`Could not find in Plex Section: ${sectionConfig.title}`);
      }

      console.log("");
    }
  } else if (sectionConfig.type === "show") {
    const watchedShows = await trakt.users.watched({
      username: getConfig("traktUsername"),
      type: "shows",
    });

    for (const show of watchedShows) {
      console.log(show.show.title);

      const plexGuid = findPlexGuid(plexCache, show.show.ids);
      const plexKey = plexCache.keys[plexGuid];

      if (plexGuid && plexKey) {
        const plexEpisodesCache = await buildPlexEpisodesCache(plexKey);

        for (const season of show.seasons) {
          for (const episode of season.episodes) {
            const episodeInPlex =
              plexEpisodesCache[season.number]?.[episode.number];

            const episodeWatchedInPlex = episodeInPlex?.lastViewedAt;

            if (episodeWatchedInPlex) {
              logYellow(
                `${formatSeasonEpisode(
                  season.number,
                  episode.number
                )} already marked as watched`
              );
            } else {
              if (episodeInPlex) {
                logGreen(
                  `${formatSeasonEpisode(
                    season.number,
                    episode.number
                  )} marked as watched`
                );

                await markAsWatched(episodeInPlex?.key);
              } else {
                logRed(
                  `${formatSeasonEpisode(
                    season.number,
                    episode.number
                  )} not found in Plex Section: ${sectionConfig.title}`
                );
              }
            }
          }
        }
      } else {
        logRed(`Could not find in Plex Section: ${sectionConfig.title}`);
      }

      console.log("");
    }
  }
}
