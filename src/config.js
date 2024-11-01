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
};

let config = {};

// Function to load the configuration from the JSON file
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

// Function to save the current config object to the file
export function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

// Function to get a configuration value by key
export function getConfig(key) {
  return config[key];
}

// Function to set a configuration value and save it
export function setConfig(key, value) {
  // We want to store this as an array
  if (key === "plexSections") {
    value = value.split(",").map((s) => s.trim());
  }

  config[key] = value;
  saveConfig();
}

loadConfig();
