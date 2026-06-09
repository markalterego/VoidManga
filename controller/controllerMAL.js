import { fetchAnimeList, fetchMangaList, putListEntry } from "../fetch/fetchMAL.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logErrorDetails } from "../helpers/errorLogger.js";
import { checkAndUpdateTokens } from '../fetch/fetchMALTokens.js';
import he from "he";

// TODO:
// - allow limited functionality without explicit authentication
//   when authentication is not possible/not wanted by the user
// - find a way to implement wrapper type logic in a function 
//   where you pass a function into something like fetchMAL()
//   then at start tokens are updated, the passed function is
//   ran from within the function and then results are handled 
//   accordingly right after 

async function fetchMALUserLists (lists, logAuthURL = false) {
    try {
        await checkAndUpdateTokens(logAuthURL); // check token validity + update if necessary
        console.log(`\n\n  Now fetching MAL lists`);
        const animelist = await fetchAnimeList(); // fetch Anime endpoint
        const mangalist = await fetchMangaList(); // fetch Manga endpoint
        const sortedLists = sortSeriesByStatus(animelist, mangalist, lists); // format anime- and manga lists
        lists = decodeComments(sortedLists); // encode each list_status.comments properly
    } catch (error) {
        logErrorDetails(error);
    }
    return lists;
}

async function updateListEntry (changedFields, entry, logAuthURL = false) {
    try {
        await checkAndUpdateTokens(logAuthURL); // check token validity + update if necessary
        const type = entry.node.num_episodes === undefined ? 'manga' : 'anime'; // type 
        const updatedListStatus = await putListEntry(entry.node.id, type, changedFields); // put to MAL
        updatedListStatus.comments = he.decode(updatedListStatus.comments); // decode comments
        return { ...entry, list_status: updatedListStatus };
    } catch (error) {
        logErrorDetails(error);
        throw new Error('Failed to update MAL entry');
    }
}

function sortSeriesByStatus (animelist, mangalist, old_lists) {
    // Takes in newly fetched animelist, mangalist. Goes through
    // all fetched entries (anime, manga), checks an entries status,
    // inputs entry at a place in animemangalist corresponding to that
    // status.
    // 
    // [
    //   anime: [watching, completed, on-hold, dropped, plan-to-watch],
    //   manga: [reading,  completed, on-hold, dropped, plan-to-read ]
    // ]
    //
    // Also! In the same loop, new entries are checked and compared
    // to existing entries so that the value of key-value pair 
    // includeInMangadexFetch is maintained throughout the process.
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

export { fetchMALUserLists, updateListEntry }