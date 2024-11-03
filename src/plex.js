import axios from "axios";
import { getConfig } from "./config.js";
import { logRed } from "./utils.js";

const plexToken = getConfig("plexToken");
const plexServer = getConfig("plexServer");

axios.defaults.params = {
  "X-Plex-Token": plexToken,
};

export async function loadSections() {
  const url = `${plexServer}/library/sections`;
  const response = await axios.get(url);
  const sections = {};

  response.data.MediaContainer.Directory.forEach((section) => {
    sections[section.title] = {
      title: section.title,
      key: section.key,
      type: section.type,
    };
  });

  return sections;
}

export async function buildPlexSectionCache(sectionConfig) {
  const requestUrl = `${plexServer}/library/sections/${sectionConfig.key}/all?includeGuids=1`;
  const response = await axios.get(requestUrl);

  const cache = {
    watched: {},
    guids: {},
    keys: {},
  };

  response.data.MediaContainer.Metadata.forEach(async (element) => {
    cache.keys[element.ratingKey] = element.key;

    if (element.type == "movie") {
      if (element.viewCount > 0) {
        cache.watched[element.ratingKey] = true;
      }
    } else if (element.type == "show") {
      // Have all episodes have been watched?
      if (element.viewedLeafCount == element.leafCount) {
        cache.watched[element.ratingKey] = true;
      }
    }

    if (element.Guid) {
      element.Guid.forEach((guid) => {
        cache.guids[guid.id] = element.ratingKey;
      });
    }
  });

  return cache;
}

export async function getSeasons(showKey) {
  const url = `${plexServer}${showKey}`;
  const response = await axios.get(url);

  const seasonsHash = {};
  response.data.MediaContainer.Metadata.forEach((season) => {
    seasonsHash[season.index] = {
      watched: season.viewedLeafCount >= season.leafCount,
      ...season,
    };
  });

  return seasonsHash;
}

export async function getEpisodes(seasonKey) {
  const url = `${plexServer}${seasonKey}`;
  const response = await axios.get(url);

  const episodesHash = {};
  response.data.MediaContainer.Metadata.forEach((episode) => {
    episodesHash[episode.index] = {
      watched: episode.viewCount > 0,
      ...episode,
    };
  });

  return episodesHash;
}

export async function markAsWatched(ratingKey) {
  const url = `${plexServer}/:/scrobble?key=${ratingKey}&identifier=com.plexapp.plugins.library&X-Plex-Token=${plexToken}`;

  try {
    await axios.get(url);
  } catch (error) {
    logRed("Error marking as watched:", error.message);
  }
}

// Find the Plex ID from the External GUIDs
// This is used to match Trakt shows to Plex Shows
// The Trakt API returns shows with GUIDs like "imdb://tt123456"
export function findPlexIdFromGuid(plexCache, ids) {
  for (const [service, id] of Object.entries(ids)) {
    const identifier = `${service}://${id}`;
    if (plexCache.guids[identifier]) {
      return plexCache.guids[identifier];
    }
  }

  return null;
}
