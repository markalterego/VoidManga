import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";
import { animeStatus, mangaStatus } from "../helpers/export.js";

dotenv.config();

async function fetchMAL (old_lists) {
    try {
        console.log(`\n||\n|| Now fetching MAL lists for \'${process.env.MAL_USERNAME}\'\n||`);
        
        const startTime = performance.now(); // saving when started fetching

        // fetch Anime endpoint
        const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status,num_episodes',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });
        const animeData = malResponseAnime.data.data;
        await setTimeout(20); // avoiding rate limit

        // fetch Manga endpoint
        const malResponseManga = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status,num_chapters',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });
        const mangaData = malResponseManga.data.data;
        await setTimeout(20); // avoiding rate limit

        // how long did fetching the anime-/mangalist take
        const fetchMALTimeTaken = Math.round(performance.now()-startTime); 
        console.log(`\n||\n|| Fetching user's MAL lists took ${Number(fetchMALTimeTaken/1000).toFixed(3)}s\n||`);

        // format anime- and manga lists
        const formattedLists = await sortSeriesByStatus(animeData, mangaData, old_lists);
        
        // return formatted lists
        return formattedLists;
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function sortSeriesByStatus (animelist, mangalist, old_lists) {
    const animemangalist = [
        Array(animeStatus.length).fill(null).map(() => []), // animelist
        Array(animeStatus.length).fill(null).map(() => [])  // mangalist
    ]; 
    const ANIME = 0, MANGA = 1;
    animeStatus.forEach((status, status_index) => { // anime statuses
        animelist.forEach(async (entry) => { // entries
            const entry_status = entry.list_status.status;
            if (entry_status === status) { // same status found
                const entry_title = entry.node.title; // MAL_title
                const result = await handleFilters(ANIME, entry_title, old_lists); // get filters
                const entry_final = { ...entry, 
                                        includeInMangadexFetch: result.includeInMangadexFetch, 
                                        includeInComickFetch: result.includeInComickFetch };
                animemangalist[ANIME][status_index].push(entry_final);
            }
        })
    });
    mangaStatus.forEach((status, status_index) => { // manga statuses
        mangalist.forEach(async (entry) => { // entries
            const entry_status = entry.list_status.status;
            if (entry_status === status) { // same status found
                const entry_title = entry.node.title; // MAL_title
                const result = await handleFilters(MANGA, entry_title, old_lists); // get filters
                const entry_final = { ...entry, 
                                        includeInMangadexFetch: result.includeInMangadexFetch, 
                                        includeInComickFetch: result.includeInComickFetch };
                animemangalist[MANGA][status_index].push(entry_final);
            }
        })
    });
    return animemangalist;
}

async function handleFilters (animeOrManga, title, old_lists) {
    // the point of handleFilters is to retain the values of 
    // includeInMangadexFetch & includeInComickFetch, to avoid
    // having to re-apply the filters on each fetch
    // note: this should work even when you move a title from e.g. reading/dropped 
    //       in a way that it still retains the filter for that title
    // note2: from my understanding, there shouldn't be identical titles at MAL under the
    //        the same type of list (anime/manga) but if there are, this will not work as expected
    let result = { includeInMangadexFetch: true, includeInComickFetch: false };
    if (Array.isArray(old_lists)) {
        for (const status of old_lists[animeOrManga]) { // go through old list
            for (const entry of status) { // entry of old list
                if (entry.node.title === title) { // if same title is found in old list
                    result.includeInMangadexFetch = entry.includeInMangadexFetch; 
                    result.includeInComickFetch = entry.includeInComickFetch;
                }
            }
        }
    }
    return result;
}

export { fetchMAL };