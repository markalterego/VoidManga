/*
TODO:
  - Combine all common helper type small arrow functions, constants
    etc. related to mal/entry stuff into this single file for reducing
    redundancy of e.g. multiple const ANIME definitions
  - import or simply drag animeStatus/mangaStatus into this file in order
    for getStatus
*/

/**
 * Array of anime status strings = [watching, completed, on_hold, dropped, plan_to_watch]
 */
export const animeStatus = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
/**
 * Array of manga status strings = [reading, completed, on_hold, dropped, plan_to_read ]
 */
export const mangaStatus = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']; 
/**
 * Index for anime entries at lists.
 */
export const ANIME = 0;
/**
 * Index for manga entries at lists.
 */
export const MANGA = 1;
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns Index corresponding to ANIME = 0 or MANGA = 1.
 */
export const getType = (entry) => entry.node.num_episodes === undefined ? MANGA : ANIME;
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns String corresponding to ANIME = 'anime' or MANGA = 'manga'.
 */
export const getTypeString = (entry) => entry.node.num_episodes === undefined ? 'manga' : 'anime';
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns Index corresponding to animeStatus/mangaStatus index.
 */
export const getStatus = (entry) => getType(entry) === ANIME 
                            ? animeStatus.findIndex(s => s === entry.list_status.status) 
                            : mangaStatus.findIndex(s => s === entry.list_status.status);
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns String corresponding to animeStatus/mangaStatus string.
 */
export const getStatusString = (entry) => getType(entry) === ANIME 
                            ? animeStatus.find(s => s === entry.list_status.status) 
                            : mangaStatus.find(s => s === entry.list_status.status);
/**
 * 
 * @param {*} entry 
 * @returns Id of given entry = entry.node.id.
 */
export const getId = (entry) => entry.node.id;