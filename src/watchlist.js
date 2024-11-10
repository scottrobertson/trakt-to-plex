import {
  addToWatchlist,
  findMetadataId,
  findPlexIdFromGuid,
  isWatchlisted,
} from "./plex.js";
import { logGreen, logRed, logYellow } from "./utils.js";

export async function processShowsWatchlist(plexCache, shows, isDryRun) {
  for (const [index, show] of shows.entries()) {
    console.log(
      `${index + 1}/${shows.length} - ${show.show.title} (${show.show.year})`
    );

    const plexGuid = await findPlexIdFromGuid(plexCache, show.show.ids);
    const plexMetadataId = await findMetadataId(
      plexGuid,
      show.show.ids,
      "show"
    );

    await ensureInWatchlist(plexMetadataId, isDryRun);

    console.log("");
  }
}

export async function processMoviesWatchlist(plexCache, movies, isDryRun) {
  for (const [index, movie] of movies.entries()) {
    console.log(
      `${index + 1}/${movies.length} - ${movie.movie.title} (${
        movie.movie.year
      })`
    );

    const plexGuid = await findPlexIdFromGuid(plexCache, movie.movie.ids);
    const plexMetadataId = await findMetadataId(
      plexGuid,
      movie.movie.ids,
      "movie"
    );

    await ensureInWatchlist(plexMetadataId, isDryRun);

    console.log("");
  }
}

async function ensureInWatchlist(plexMetadataId, isDryRun) {
  if (plexMetadataId) {
    const plexIsWatchlisted = await isWatchlisted(plexMetadataId);
    if (plexIsWatchlisted) {
      logYellow("Already in watchlist");
    } else {
      if (isDryRun) {
        logGreen("Added to watchlist (dry run)");
      } else {
        await addToWatchlist(plexMetadataId);
        logGreen("Added to watchlist");
      }
    }
  } else {
    logRed(`Cannot find metadata id in section`);
  }
}
