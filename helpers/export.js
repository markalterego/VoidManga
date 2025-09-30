export const animeStatus = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
export const mangaStatus = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']; 
export const fetchMangadexOptions = { 
    limit_manga: 10, // default: 10, min: 0, max is 100
    limit_chapter: 10, // default: 10, min: 0, max is 100 
    offset_chapter: 0, // default: 0, min: 0, max is ???
    mangaOrderType: 'relevance', // 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    chapterOrderType: 'chapter', // 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    mangaOrderDirection: 'desc', // 'asc', 'desc'
    chapterOrderDirection: 'desc', // 'asc', 'desc'
    contentRating: [], // ['safe','etc...'], undefined for default behavior
    chapterTranslatedLanguage: [], // ['en','es','etc...'], undefined for all languages
};
// mangaOrderTypes: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
export const mangaOrderTypes = {
    title: {
        asc: 'Ssort by title from a-z',
        desc: 'Sort by title from z-a'
    },
    year: {
        asc: 'Sort by year in ascending order',
        desc: 'Sort by year in descending order'
    },
    createdAt: {
        asc: 'Sort by created at from oldest-newest',
        desc: 'Sort by created at from newest-oldest'
    },
    updatedAt: {
        asc: 'Sort by updated at from oldest-newest',
        desc: 'Sort by updated at from newest-oldest'
    },
    latestUploadedChapter: {
        asc: 'Sort by manga with the oldest update',
        desc: 'Sort by manga with the newest update'
    },
    followedCount: {
        asc: 'Sort by least to most followed',
        desc: 'Sort by most to least followed'
    },
    relevance: {
        asc: 'Sort by least to most relevant',
        desc: 'Sort by most to least relevant'
    }
};
// chapterOrderTypes: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
export const chapterOrderTypes = {
    createdAt: {
        asc: 'Sort by created at from oldest-newest',
        desc: 'Sort by created at from newest-oldest'
    }, 
    updatedAt: {
        asc: 'Sort by updated at from oldest-newest',
        desc: 'Sort by updated at from newest-oldest'
    },
    publishAt: {
        asc: 'Sort by published at from oldest-newest',
        desc: 'Sort by published at from newest-oldest'
    },
    readableAt: {
        asc: 'Sort by readable at from oldest-newest',
        desc: 'Sort by readable at from newest-oldest'
    },
    volume: {
        asc: 'Sort by volume in ascending order',
        desc: 'Sort by volume in descending order'
    },
    chapter: {
        asc: 'Sort by chapter in ascending order',
        desc: 'Sort by chapter in descending order'
    }
};
export const contentRatings = ['safe', 'suggestive', 'erotica', 'pornographic'];
export const chapterTranslatedLanguages = ['en', 'es', 'pt-br', 'fr', 'de']; 
export const expectedFilters = ['includeInMangadexFetch']; // expected function parameter values at filterEntriesFromFetch
/*
    Options for Mangadex's fetchChapters() custom search:
        -MAL_list - anime/manga = 0/1
        -MAL_status - watching/reading, completed, on-hold, dropped, plan-to-watch/plan-to-read = 0/1/2/3/4
        -limit_manga: 0-100, undefined for default behavior (10)
        -limit_chapter: 0-100, undefined for default behavior (10)
        -mangaOrderType: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
        -chapterOrderType: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
        -mangaOrderDirection: 'asc', 'desc' - e.g. using 'desc' when order['relevance']: 'desc' sorts by most relevant to least relevant
        -chapterOrderDirection: 'asc, 'desc'
        -contentRating: ['safe','suggestive','erotica','pornographic'], undefined for default behavior (all expect pornographic)
        -chapterTranslatedLanguage: ['en','es','etc...'], undefined for all languages

    Options are saved as json:
    const options = {
        variable: ['value'],
        ...
    };
    params: options

    const can be spreaded to change values inside:
    options = { ...options, variable: 'short', etc...}
*/ 