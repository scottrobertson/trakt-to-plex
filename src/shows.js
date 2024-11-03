import {
  findPlexIdFromGuid,
  markAsWatched,
  getSeasons,
  getEpisodes,
} from "./plex.js";
import {
  logGreen,
  logRed,
  logYellow,
  formatSeasonEpisode,
  formatSeason,
} from "./utils.js";

export async function processShows(
  plexCache,
  sectionConfig,
  watchedShows,
  isDryRun
) {
  for (const [index, show] of watchedShows.entries()) {
    console.log(
      `${index + 1}/${watchedShows.length} - ${show.show.title} (${
        show.show.year
      })`
    );

    await processShow(plexCache, sectionConfig, show, isDryRun);
  }
}

async function processShow(plexCache, sectionConfig, show, isDryRun) {
  const plexGuid = findPlexIdFromGuid(plexCache, show.show.ids);
  const plexKey = plexCache.keys[plexGuid];
  const showWatched = plexCache.watched[plexGuid];

  if (showWatched) {
    logYellow("All available episodes already watched in Plex");
    console.log("");
    return;
  }

  if (plexGuid && plexKey) {
    const plexSeasons = await getSeasons(plexKey);

    for (const season of show.seasons) {
      const seasonInPlex = plexSeasons[season.number];

      if (seasonInPlex?.watched) {
        logYellow(`${formatSeason(season.number)} already watched in Plex`);
        continue;
      }

      const plexEpisodes = seasonInPlex
        ? await getEpisodes(seasonInPlex.key)
        : {};

      for (const episode of season.episodes) {
        const formattedEpisode = formatSeasonEpisode(
          season.number,
          episode.number
        );

        const episodeInPlex = plexEpisodes[episode.number];

        if (episodeInPlex) {
          const episodeWatchedInPlex = episodeInPlex?.watched;

          if (episodeWatchedInPlex) {
            logYellow(`${formattedEpisode} already watched in Plex`);
          } else {
            if (isDryRun) {
              logGreen(
                `${formattedEpisode} marked as watched in Plex (dry run)`
              );
            } else {
              logGreen(`${formattedEpisode} marked as watched in Plex`);
              await markAsWatched(episodeInPlex.ratingKey);
            }
          }
        } else {
          logRed(
            `${formattedEpisode} not found in Plex (${sectionConfig.title})`
          );
        }
      }
    }
  } else {
    logRed(`Could not find in Plex (${sectionConfig.title})`);
  }

  console.log("");
}
