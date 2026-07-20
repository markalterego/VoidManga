import { fetchAnimeList, fetchMangaList, putListEntry, fetchAnime, fetchManga, deleteEntryFromLists } from "../fetch/fetchMAL.js";
import { DEFAULT_MAL_ENTRY_FRAMEWORK_ANIME, DEFAULT_MAL_ENTRY_FRAMEWORK_MANGA, DEFAULT_lists, MESSAGE } from "../helpers/export.js";
import { getType, getStatus, getId, ANIME, MANGA, animeStatus, mangaStatus, getTypeString } from "../helpers/entryHelpers.js";
import { logErrorDetails } from "../helpers/errorLogger.js";
import { checkAndUpdateTokens } from '../fetch/fetchMALTokens.js';
import { editOrAddEntriesFromSearchResults } from '../ui/menuMAL.js';
import { filehandle } from "../filehandling/filehandle.js";
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
        filehandle('mal', lists); // save data to file
    } catch (error) {
        logErrorDetails(error);
    }
    return lists;
}

async function searchMAL (lists, options, logAuthURL = false) {
    try {
        await checkAndUpdateTokens(logAuthURL); // check token validity + update if necessary
        const formattedResults = await searchAndFormatResults(options); // [ { searchResults: [ { node: { ... } }, ... ], searchTitle: string }, ... ] 
        const finalResults = appendListStatusesToSearchResults(formattedResults, lists); // [ { searchResults: [ { node: { ... }, list_status: { ... } }, ... ], searchTitle: string }, ... ]
        await editOrAddEntriesFromSearchResults(finalResults, lists, logAuthURL); // access updateEntryMenu through this function
    } catch (error) {
        logErrorDetails(error);
    }
    return lists;
}

async function searchAndFormatResults (options) {
    const { searchType, searchStrings } = options;
    let results = [];
    if (!searchStrings.length) {
        throw new Error('No titles selected for search');
    }
    // fetch[Anime/Manga] = { searchTitle, searchResults }
    for (const searchString of searchStrings) {
        results.push(
            searchType === 'both' 
            ? [await fetchAnime(searchString, options), await fetchManga(searchString, options)]
            : searchType === 'anime'
            ? await fetchAnime(searchString, options) 
            : await fetchManga(searchString, options)
        );
    }
    // [{ searchTitle: string, searchResults: [] }, ...]
    return results.flat(Infinity);
}

function appendListStatusesToSearchResults (formattedResults, lists) {
    //      [ { searchResults: [ { node: { ... } }, ... ], searchTitle: string }, ... ] 
    // ---> [ { searchResults: [ { node: { ... }, list_status: { ... } }, ... ], searchTitle: string }, ... ]
    return formattedResults.map(item => {
        const formattedSearchResults = item.searchResults.map(({ node }) => {
            const type          = getType({ node }); 
            const existingEntry = lists[type].flat(Infinity).find(e => getId(e) === getId({ node }));
            // New Nodes included to either
            // 1. existing entries found at lists
            // 2. default entry frameworks based on type
            return existingEntry 
                ? { node, list_status: existingEntry.list_status, includeInMangadexFetch: existingEntry.includeInMangadexFetch } 
                : type === ANIME 
                ? { node, ...DEFAULT_MAL_ENTRY_FRAMEWORK_ANIME } 
                : { node, ...DEFAULT_MAL_ENTRY_FRAMEWORK_MANGA };
        });
        return { ...item, searchResults: formattedSearchResults };
    });
}

async function updateMAL (lists, draft, oldEntry, logAuthURL = false) {
    try {
        const syncedEntry = await updateListEntry(Object.entries(draft.list_status), draft, logAuthURL); // update online
        const finalEntry  = { ...draft, ...syncedEntry }; // merge existing data + synced
        const entryExists = lists[getType(draft)].flat(Infinity).some(e => getId(e) === getId(draft));
        if (entryExists) removeOldEntry(lists, oldEntry); // remove existing data 
        const newEntry = appendNewEntry(lists, finalEntry); // add entry to lists
        filehandle('mal', lists); // save data to file
        return { lists, success: true, newEntry };
    } catch (error) {
        logErrorDetails(error);
        return { lists, success: false };
    }
}

async function updateListEntry (changedFields, draft, logAuthURL = false) {
    try {
        await checkAndUpdateTokens(logAuthURL); // check token validity + update if necessary
        const updatedListStatus = await putListEntry(getId(draft), getTypeString(draft), changedFields); // put to MAL
        updatedListStatus.comments = he.decode(updatedListStatus.comments); // decode comments
        return { ...draft, list_status: updatedListStatus };
    } catch (error) {
        throw error;
    }
}

function removeOldEntry (lists, entry) {
    // finds and removes given entry at lists
    lists[getType(entry)][getStatus(entry)].splice(
        lists[getType(entry)][getStatus(entry)].findIndex((e) => getId(e) === getId(entry))
    , 1);
}

function appendNewEntry (lists, entry) {
    lists[getType(entry)][getStatus(entry)].push(entry); // append entry to lists
    lists[getType(entry)][getStatus(entry)].sort((a,b) => a.node.title.localeCompare(b.node.title)); // sort at lists alphabetical
    return lists[getType(entry)].flat(Infinity).find(e => getId(e) === getId(entry));
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

async function deleteMAL (lists, draft, logAuthURL = false) {
    try {
        await checkAndUpdateTokens(logAuthURL); // check token validity + update if necessary
        const entryExists = lists[getType(draft)].flat(Infinity).some(e => getId(e) === getId(draft));
        if (!entryExists) throw new Error(`Can't remove non-existing entry. Type: ${getTypeString(draft)} Id: ${getId(draft)}`);
        await deleteEntryFromLists(getId(draft), getTypeString(draft)); // delete online
        removeOldEntry(lists, draft); // delete locally
        filehandle('mal', lists); // save data to file
        return { lists, success: true };
    } catch (error) {
        logErrorDetails(error);
        return { lists, success: false };
    } 
}

function clearLocalMALData (printMessage = true) {
    const lists = structuredClone(DEFAULT_lists);
    filehandle('mal', lists);
    if (printMessage) MESSAGE.print(MESSAGE.CLEARED_LOCAL_DATA_MAL);
    return lists;
}

export { fetchMALUserLists, updateMAL, searchMAL, deleteMAL, clearLocalMALData };