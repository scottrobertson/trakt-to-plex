import {
  buildPlexEpisodesCache,
  findPlexIdFromGuid,
  markAsWatched,
} from "./plex.js";
import { logGreen, logRed, logYellow, formatSeasonEpisode } from "./utils.js";

export async function processShows(plexCache, sectionConfig, watchedShows) {
  console.log(` - Shows in Trakt: ${watchedShows.length}`);
  console.log(` - Shows in Plex: ${Object.keys(plexCache.keys).length}`);
  console.log("");
  console.log("------------");
  console.log("");

  for (const [index, show] of watchedShows.entries()) {
    console.log(`${index + 1}/${watchedShows.length} - ${show.show.title}`);
    await processShow(plexCache, sectionConfig, show);
  }
}

async function processShow(plexCache, sectionConfig, show) {
  const plexGuid = findPlexIdFromGuid(plexCache, show.show.ids);
  const plexKey = plexCache.keys[plexGuid];
  const showWatched = plexCache.watched[plexGuid];

  if (showWatched) {
    logYellow("All available episodes already watched in Plex");
    console.log("");
    return;
  }

  if (plexGuid && plexKey) {
    const plexEpisodesCache = await buildPlexEpisodesCache(plexKey);

    for (const season of show.seasons) {
      for (const episode of season.episodes) {
        const formattedEpisode = formatSeasonEpisode(
          season.number,
          episode.number
        );

        const episodeInPlex =
          plexEpisodesCache[season.number]?.[episode.number];

        if (episodeInPlex) {
          const episodeWatchedInPlex = episodeInPlex?.watched;

          if (episodeWatchedInPlex) {
            logYellow(`${formattedEpisode} already watched in Plex`);
          } else {
            logGreen(`${formattedEpisode} marked as watched in Plex`);
            await markAsWatched(episodeInPlex?.key);
          }
        } else {
          logRed(
            `${formattedEpisode} not found in Plex Section: ${sectionConfig.title}`
          );
        }
      }
    }
  } else {
    logRed(`Could not find in Plex Section: ${sectionConfig.title}`);
  }

  console.log("");
}
