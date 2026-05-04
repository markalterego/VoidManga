import axios from 'axios';
import { setTimeout } from "timers/promises";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { checkAndUpdateTokens } from './fetchMALTokens.js';
import { logErrorDetails } from '../helpers/errorLogger.js';
import he from "he";

// TODO:
// - re-arrange this file into smaller/clearer functions
// - allow limited functionality without explicit authentication
//   when authentication is not possible/not wanted by the user
// - implement fetchMAL in a way where e.g. it takes in as input
//   what it's supposed to fetch and runs a specific function 
//   based on that input

async function fetchMAL (lists) {
    // fetch anime + manga lists
    // let manga = lists[1][4][0]; // dokumushi ruins hotel

    // // force moving location of entry in lists to when user
    // // changes the list_status.status of any entry  
    // manga.list_status.status = mangaStatus[3]; // status
    // // <-- move from current status to changed status if status changed

    // manga.list_status.score = 1; // score 
    // // also make it so that each time the list_status of
    // // an entry is updated locally, that same list_status is updated
    // // into user's MAL lists as well

    // manga = await updateListEntry(manga);
    try {
        lists = await fetchMALUserLists(lists);
    } catch (error) {
        logErrorDetails(error);
    }
    return lists;
}

async function fetchMALUserLists (old_lists) {
    await checkAndUpdateTokens(); // check token validity + update if necessary
    console.log(`\n\n  Now fetching MAL lists`);
    const animelist = await fetchAnimeList(); // fetch Anime endpoint
    const mangalist = await fetchMangaList(); // fetch Manga endpoint
    const sortedLists = sortSeriesByStatus(animelist, mangalist, old_lists); // format anime- and manga lists
    const finalLists = decodeComments(sortedLists); // encode each list_status.comments properly
    return finalLists; // return formatted lists
}

async function fetchAnimeList() {
    try {
        const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/@me/animelist`, {
            params: {
                fields: 'list_status{comments,priority,num_times_rewatched,rewatch_value,tags},num_episodes,type',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
            }
        }).then(await setTimeout(100)); // avoid rate-limit
        return malResponseAnime.data.data;
    } catch (error) {
        throw error;
    }
}

async function fetchMangaList() {
    try {
        const malResponseManga = await axios.get(`https://api.myanimelist.net/v2/users/@me/mangalist`, {
            params: {
                fields: 'list_status{comments,priority,num_times_reread,reread_value,tags},num_chapters',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
            }
        }).then(await setTimeout(100)); // avoid rate-limit
        return malResponseManga.data.data; 
    } catch (error) {
        throw error;
    }
}

function sortSeriesByStatus (animelist, mangalist, old_lists) {
    const animemangalist = [
        Array(animeStatus.length).fill(null).map(() => []), // animelist
        Array(mangaStatus.length).fill(null).map(() => [])  // mangalist
    ]; 
    const ANIME = 0, MANGA = 1;
    animeStatus.forEach((status, status_index) => { // anime statuses
        animelist.forEach((entry) => { // entries
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
        mangalist.forEach((entry) => { // entries
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

function decodeComments (lists) {
    // API tends to improperly replace some characters
    // to make them safe to use for websites - HTML entity
    // encoding. This causes some characters such as 'ä' and 'ö'
    // to be replace with '&auml;' and '&ouml;'. This function
    // manually decodes all comments with he librarys decode function.
    for (const type of lists) { // anime/manga
        for (const status of type) { // status
            for (const entry of status) { // entry
                entry.list_status.comments = he.decode(entry.list_status.comments);
            }
        }
    }
    return lists;
}

async function updateListEntry (changedFields, entry) {
    try {
        await checkAndUpdateTokens(); // check token validity + update if necessary
        const type = entry.node.num_episodes === undefined ? 'manga' : 'anime'; // type 
        const updatedListStatus = { list_status: await putListEntry(entry.node.id, type, changedFields) }; // put to MAL
        return { ...entry, ...updatedListStatus };
    } catch (error) {
        logErrorDetails(error);
        throw new Error('Failed to update MAL entry');
    }
}

async function putListEntry (entry_id, type, data_fields) {
    try {
        const url = `https://api.myanimelist.net/v2/${type}/${entry_id}/my_list_status`
        const data = new URLSearchParams(data_fields);
        const response = await axios.put(url, data.toString(), {
            headers: {
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(await setTimeout(100)); // avoid rate-limit;
        response.data.comments = he.decode(response.data.comments); // decode comments
        return response.data; // updated entry
    } catch (error) {
        throw error;
    }   
}

export { fetchMAL, updateListEntry };

/*
Ideas for implementing authentication with only client_id...

1.1 if MAL_USERNAME is not defined, check authentication status
1.2. 

fetchMAL <-- base function
- include timings in here

getAuthenticationToken <-- implement this
*/
