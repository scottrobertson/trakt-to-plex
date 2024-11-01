import axios from "axios";
import { getConfig } from "./config.js";

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

export async function buildPlexCache(sectionConfig) {
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

export async function buildPlexEpisodesCache(key) {
  const cache = {};
  const seasonsUrl = `${plexServer}${key}`;
  const seasons = await axios.get(seasonsUrl);

  for (const season of seasons.data.MediaContainer.Metadata) {
    const episodesUrl = `${plexServer}${season.key}`;
    const episodes = await axios.get(episodesUrl);

    for (const episode of episodes.data.MediaContainer.Metadata) {
      cache[episode.parentIndex] ||= {};
      cache[episode.parentIndex][episode.index] = {
        watched: episode.viewCount > 0,
        key: episode.ratingKey,
      };
    }
  }

  return cache;
}

export async function markAsWatched(ratingKey) {
  const url = `${plexServer}/:/scrobble?key=${ratingKey}&identifier=com.plexapp.plugins.library&X-Plex-Token=${plexToken}`;

  try {
    const response = await axios.get(url);
    if (response.status !== 200) {
      console.error("Failed to mark as watched:", response.statusText);
    }
  } catch (error) {
    console.error("Error marking as watched:", error.message);
  }
}

export function findPlexGuid(plexCache, ids) {
  for (const [service, id] of Object.entries(ids)) {
    const identifier = `${service}://${id}`;
    if (plexCache.guids[identifier]) {
      return plexCache.guids[identifier];
    }
  }

  return null;
}
