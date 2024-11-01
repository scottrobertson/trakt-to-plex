import { findPlexIdFromGuid, markAsWatched } from "./plex.js";
import { logGreen, logRed, logYellow } from "./utils.js";

export async function processMovies(plexCache, sectionConfig, watchedMovies) {
  console.log(` - Movies in Trakt: ${watchedMovies.length}`);
  console.log(` - Movies in Plex: ${Object.keys(plexCache.keys).length}`);
  console.log("");
  console.log("------------");
  console.log("");

  for (const [index, movie] of watchedMovies.entries()) {
    console.log(`${index + 1}/${watchedMovies.length} - ${movie.movie.title}`);
    await processMovie(plexCache, sectionConfig, movie);
  }
}

async function processMovie(plexCache, sectionConfig, movie) {
  const plexGuid = findPlexIdFromGuid(plexCache, movie.movie.ids);

  if (plexGuid) {
    if (plexCache.watched[plexGuid]) {
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
