import { logErrorDetails } from "../helpers/errorLogger.js";
import { updateListEntry } from "../fetch/fetchMAL.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";

/*
1. Update online
2. Update locally if update was successful
*/

const ANIME = 0; // anime index
const MANGA = 1; // manga -||-

async function updateMAL (lists, entry, changedFields) {
    try {
        const syncedEntry = await updateListEntry(entry, changedFields); // update online
        const existingEntry = findExistingEntry(lists, syncedEntry); // reference to existing MAL entry
        const finalEntry = existingEntry ? { ...existingEntry, ...syncedEntry } : syncedEntry; // merge existing + synced OR use synced
        if (existingEntry) removeOldEntry(lists, existingEntry); // remove existing entry 
        appendNewEntry(lists, finalEntry); // add entry to lists
        return lists; // return updated lists
    } catch (error) {
        logErrorDetails(error);
    }
}

function findExistingEntry (lists, entry) {
    const type = getTypeIndex(entry); // returns 0 OR 1
    // attempts finding reference to existing entry from all anime/manga entries
    return lists[type].flat().find(e => e.node.id === entry.node.id);
}

function appendNewEntry (lists, entry) {
    const type = getTypeIndex(entry); 
    const status = getStatusIndex(entry);
    lists[type][status].push(entry); // append entry to lists
    lists[type][status].sort((a,b) => a.node.title.localeCompare(b.node.title)); // sort at lists alphabetical
}

function removeOldEntry (lists, entry) {
    const type = getTypeIndex(entry);
    const status = getStatusIndex(entry);
    const index = getEntryIndex(lists, entry);
    lists[type][status].splice(index, 1);
}

function getTypeIndex (entry) {
    // returns index for anime/manga at lists e.g. lists[0] === anime 
    return entry.node.num_episodes === undefined ? MANGA : ANIME;
}

function getStatusIndex (entry) {
    const type = getTypeIndex(entry);
    // returns index of status
    return type === ANIME ? animeStatus.findIndex(s => s === entry.list_status.status): // anime
                            mangaStatus.findIndex(s => s === entry.list_status.status); // manga
}

function getEntryIndex (lists, entry) {
    const type = getTypeIndex(entry); // returns 0 OR 1
    const status = getStatusIndex(entry); // returns status
    // returns index of given entry at lists[type][status]
    return lists[type][status].findIndex(e => e.node.id === entry.node.id); 
}

export { updateMAL };

/*
entry {
    node,
    list_status,
    includeInMangadexFetch
}
*/