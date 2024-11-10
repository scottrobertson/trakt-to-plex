import fs from "fs";
import path from "path";

const configPath = path.resolve("config.json");

export const configRequired = {
  plexServer: "What is your Plex Server URL?",
  plexToken: "What is your Plex Token?",
  plexSections:
    "What are the Plex sections you want to sync? (comma separated) e.g. Movies, TV Shows",
  traktClientId: "What is your Trakt Client ID?",
  traktClientSecret: "What is your Trakt Client Secret?",
  traktUsername: "What is your Trakt Username?",
  syncWatchlist: "Do you want to sync your Trakt watchlist to Plex? (yes/no)",
};

let config = {};

export function loadConfig() {
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(data);
  } else {
    console.log("writing config");
    config = {};
    saveConfig();
  }
}

export function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  // We want to store this as an array
  if (key === "plexSections") {
    value = value.split(",").map((s) => s.trim());
  }

  if (key === "syncWatchlist") {
    value = value === "yes";
  }

  config[key] = value;
  saveConfig();
}

loadConfig();
