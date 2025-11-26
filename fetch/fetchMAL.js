import axios from 'axios';
import { setTimeout } from "timers/promises";
import { animeStatus, mangaStatus } from "../helpers/export.js";

// TODO:
// - re-arrange this file into smaller/clearer functions
// - somehow implement user OAuth2 authentication
// - allow limited functionality without explicit authentication
//   when authentication is not possible/not wanted by the user

/*

1.1 if MAL_USERNAME is not defined, check authentication status
1.2. 

fetchMAL <-- base function
- include timings in here

getAuthenticationToken <-- implement this
*/

async function fetchMAL (old_lists) {
    const username = process.env.MAL_USERNAME;
    if (!username?.length) {
        console.log(`\n||\n|| MAL_USERNAME was not defined at .env file\n||`);
    } else {
        console.log(`\n||\n|| Now fetching MAL lists for ${username}\n||`);
        const animelist = await fetchAnimeList(username); // fetch Anime endpoint
        const mangalist = await fetchMangaList(username); // fetch Manga endpoint
        const formattedLists = sortSeriesByStatus(animelist, mangalist, old_lists); // format anime- and manga lists
        return formattedLists; // return formatted lists
    }   
}

async function fetchAnimeList (username) {
    try {
        const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/${username}/animelist`, {
            params: {
                fields: 'list_status,num_episodes',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        }).then(await setTimeout(100)); // avoid rate-limit
        return malResponseAnime.data.data;
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchMangaList (username) {
    try {
        const malResponseManga = await axios.get(`https://api.myanimelist.net/v2/users/${username}/mangalist`, {
            params: {
                fields: 'list_status,num_chapters',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        }).then(await setTimeout(100)); // avoid rate-limit
        return malResponseManga.data.data; 
    } catch (error) {
        console.log(error.response);
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

function sortSeriesByStatus (animelist, mangalist, old_lists) {
    const animemangalist = [
        Array(animeStatus.length).fill(null).map(() => []), // animelist
        Array(mangaStatus.length).fill(null).map(() => [])  // mangalist
    ]; 
    const ANIME = 0, MANGA = 1;
    animeStatus.forEach((status, status_index) => { // anime statuses
        animelist.forEach(async (entry) => { // entries
            const entry_status = entry.list_status.status;
            if (entry_status === status) { // same status found
                const entry_title = entry.node.title; // MAL_title
                const result = handleFilters(ANIME, entry_title, old_lists); // get filters
                const entry_final = { ...entry, 
                                        includeInMangadexFetch: result.includeInMangadexFetch };
                animemangalist[ANIME][status_index].push(entry_final);
            }
        })
    });
    mangaStatus.forEach((status, status_index) => { // manga statuses
        mangalist.forEach(async (entry) => { // entries
            const entry_status = entry.list_status.status;
            if (entry_status === status) { // same status found
                const entry_title = entry.node.title; // MAL_title
                const result = handleFilters(MANGA, entry_title, old_lists); // get filters
                const entry_final = { ...entry, 
                                        includeInMangadexFetch: result.includeInMangadexFetch };
                animemangalist[MANGA][status_index].push(entry_final);
            }
        })
    });
    return animemangalist;
}

function handleFilters (animeOrManga, title, old_lists) {
    // the point of handleFilters is to retain the value of 
    // includeInMangadexFetch to avoid having to re-apply the
    // filters on each fetch
    // note: this should work even when you move a title from e.g. reading/dropped 
    //       in a way that it still retains the filter for that title
    // note2: from my understanding, there shouldn't be identical titles at MAL under the
    //        the same type of list (anime/manga) but if there are, this will not work as expected
    let result = { includeInMangadexFetch: false };
    if (Array.isArray(old_lists)) {
        for (const status of old_lists[animeOrManga]) { // go through old list
            for (const entry of status) { // entry of old list
                if (entry.node.title === title) { // if same title is found in old list
                    result.includeInMangadexFetch = entry.includeInMangadexFetch; 
                }
            }
        }
    }
    return result;
}

export { fetchMAL };