# Trakt to Plex

A simple tool designed to sync your Trakt watch history to Plex.

You can also optionally sync your Watchlist from Trakt to Plex.

### Why?

This is specifically designed to work with very large Plex libraries. Most of these types of tools work by scanning your Plex library and then checking Trakt to see if they are watched or not. That can take hours to run on a large library. This tool does the reverse and pulls from Trakt first and then only checks those items in Plex.

### Example

An example of how long it takes to run on a large (30k Movies, 8k TV Shows) library.

```
Fetching movies from Trakt
Fetched 516 movies from Trakt

Fetching shows from Trakt
Fetched 302 shows from Trakt

Fetching section from Plex: Movies
Fetched 28692 items from Plex
Took 26.43s

Fetching section from Plex: TV Shows
Fetched 7979 items from Plex
Took 60.16s
```

### Install

- Clone repo
- Run `npm install`
- Run `npm run sync`

### Dry Run

You can run the tool without actually marking anything as watched:

```shell
npm run sync -- --dry-run
```

### Notes

- This tool is early, and you should read the code before using it
- Do backups before using it
- If something is already marked as watched in Plex, it will be skipped
- It's not possible to set a watched time/date in Plex. It will be set as "now"
