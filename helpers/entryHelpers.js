/*
TODO:
  - Combine all common helper type small arrow functions, constants
    etc. related to mal/entry stuff into this single file for reducing
    redundancy of e.g. multiple const ANIME definitions
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
 * Index is based on entry.node.num_episodes === undefined.
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns Index corresponding to ANIME = 0 or MANGA = 1.
 */
export const getType = (entry) => entry.node.num_episodes === undefined ? MANGA : ANIME;
/**
 * Index is based on entry.node.num_episodes === undefined.
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
 * @param {*} entry Item at lists[type][status].
 * @returns Id of given entry = entry.node.id.
 */
export const getId = (entry) => entry.node.id;
/**
 * Array of retype_value strings.
 */
export const re_values = ['not set', 'very low', 'low', 'medium', 'high', 'very high'];
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns Value of rewatch_value/reread_value based on entry type
 */
export const getReValue = (entry) => getType(entry) === ANIME ? entry.list_status.rewatch_value : entry.list_status.reread_value;
/**
 * 
 * @param {*} entry Item at lists[type][status].
 * @returns Value at re_values[retype_value] --- re_values = ['not set', 'very low', 'low', 'medium', 'high', 'very high']
 */
export const getReValueString = (entry) => re_values[getReValue(entry)];
/**
 * Array of priority strings.
 */
export const priority_values = ['low', 'medium', 'high'];
/**
 * @param {*} entry Item at lists[type][status].
 * @returns Value at priority_values[priority] --- priority_values = ['low', 'medium', 'high']
 */
export const getPriorityString = (entry) => priority_values[entry.list_status.priority];