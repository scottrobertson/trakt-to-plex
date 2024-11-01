# Trakt to Plex

A simple tool designed to sync your Trakt watch history to Plex.

### Why?

This is specifically designed to work with very large Plex libraries. Most of these types of tools work by scanning your Plex library and then checking Trakt to see if they are watched or not. That can take hours to run on a large library. This tool does the reverse and pulls from Trakt first and then only checks those items in Plex.

### Install

- Clone repo
- Run `npm install`
- Run `npm run sync`

### Notes

- This tool is early, and you should read the code before using it
- Do backups before using it
- If something is already marked as watched in Plex, it will be skipped
- It's not possible to set a watched time/date in Plex. It will be set as "now"
