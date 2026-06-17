/*
TODO:
  - Combine all common helper type small arrow functions, constants
    etc. related to mal/entry stuff into this single file for reducing
    redundancy of e.g. multiple const ANIME definitions
  - import or simply drag animeStatus/mangaStatus into this file in order
    for getStatus
*/
export const ANIME = 0;
export const MANGA = 1;
export const getType = (entry) => entry.node.num_episodes === undefined ? MANGA : ANIME;
export const getTypeString = (entry) => entry.node.num_episodes === undefined ? 'manga' : 'anime';
export const getStatus = (entry) => getType(entry) === ANIME 
                            ? animeStatus.findIndex(s => s === entry.list_status.status) 
                            : mangaStatus.findIndex(s => s === entry.list_status.status);
export const getStatusString = (entry) => getType(entry) === ANIME 
                            ? animeStatus.find(s => s === entry.list_status.status) 
                            : mangaStatus.find(s => s === entry.list_status.status);
export const id     = (entry) => entry.node.id;