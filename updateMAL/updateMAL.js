import { logErrorDetails } from "../helpers/errorLogger.js";
import { updateListEntry } from "../fetch/fetchMAL.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";

/*
1. Update online
2. Update locally if update was successful
*/

const ANIME = 0; // anime index
const MANGA = 1; // manga -||-

async function updateMAL (lists, entry) {
    try {
        
        const syncedEntry = await updateListEntry(entry); // update online
        const existingEntry = findOldEntry(lists, syncedEntry); // reference to oldEntry

        if (!existingEntry) appendNewEntry(lists, syncedEntry); 
        else Object.assign(oldEntry, syncedEntry); // overwrite oldEntry by finalEntry
        
        return lists; // return updated lists
    } catch (error) {
        logErrorDetails(error);
    }
}

function findOldEntry (lists, updatedEntry) {
    // type never changes, we can use the same as in newer entry
    const type = updatedEntry.node.num_episodes === undefined ? MANGA : ANIME; 
    const allEntriesByType = lists[type].flat(); // all anime/manga entries regardless of status
    return allEntriesByType.find(entry => entry.node.id === updatedEntry.node.id);
}

function appendNewEntry (lists, updatedEntry) {
    const type = updatedEntry.node.num_episodes === undefined ? MANGA : ANIME; // type 
    const status = type === ANIME ? animeStatus.findIndex(status => status === updatedEntry.list_status.status) : // anime
                                    mangaStatus.findIndex(status => status === updatedEntry.list_status.status);  // manga
    lists[type][status].push(updatedEntry); // append updatedEntry to lists
}

function getType (entry) {
    
}

export { updateMAL };

/*
entry {
    node,
    list_status,
    includeInMangadexFetch
}
*/