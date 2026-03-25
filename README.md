# VoidManga

An interactive Node.js CLI application for Windows that can be used to update your Anime- and Mangalist at MyAnimeList and fetch manga/chapter info from MangaDex.

## Requirements

- Windows
- Node.js: https://nodejs.org/en/download
- A MyAnimeList account

## Setup - Download & Install

1. Clone or download repository
2. Run `VoidManga.bat` to start the app (or manually run `npm install` then `node main.js` at project directory)

## Setup - MyAnimeList API Key

In order to fetch and update your personal Anime- and Mangalist at MyAnimeList, you will be needing a Client ID. 

1. Open https://myanimelist.net/apiconfig and login if prompted
2. Select `Create ID` next to `Clients Accessing the MAL API`
3. Fill form to apply for an API key

| Field | Value |
| --- | --- |
| App Name | `VoidManga` |
| App Type | `Other` - **must be exactly this** |
| App Description | *copy-paste the first paragraph after VoidManga above* |
| App Redirect URL | `http://localhost:3000/callback` - **must be exactly this** |
| Homepage URL | *link to this GitHub page or link to your MyAnimeList profile* |
| Commercial / Non-Commercial | `Non-commercial` |
| Name / Company Name | `VoidManga` |
| Purpose of Use | `Hobbyist` | 

4. Accept terms of use & Submit
5. Go back to https://myanimelist.net/apiconfig
6. You should now see `VoidManga` listed under `Clients Accessing the MAL API`. On the far right corner, select `Edit`
7. Your Client ID should now be listed next to `Client ID`

Note: I wouldn't go out sharing this Client ID with anyone, as it can be used to e.g. delete every entry from your Anime-/Mangalist

8. Open VoidManga, go to Settings and select `Update MAL_API_CLIENT_ID` 
9. Copy-paste your Client ID here. You should now be able to fetch/update your Anime- and Mangalist at MyAnimeList through VoidManga

## P.S.

This is a work in progress. It's not pretty but I hope someone can find it useful. 