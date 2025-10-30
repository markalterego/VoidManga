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
    fetchAllChapters: false // when enabled, fetches all chapters corresponding to other options
};
// mangaOrderTypes: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
export const mangaOrderTypes = {
    title: {
        asc: 'a to z',
        desc: 'z to a'
    },
    year: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    createdAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    updatedAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    latestUploadedChapter: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    followedCount: {
        asc: 'least to most',
        desc: 'most to least'
    },
    relevance: {
        asc: 'least to most',
        desc: 'most to least'
    }
};
// chapterOrderTypes: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
export const chapterOrderTypes = {
    createdAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    }, 
    updatedAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    publishAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    readableAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    volume: {
        asc: 'lowest to highest',
        desc: 'highest to lowest'
    },
    chapter: {
        asc: 'lowest to highest',
        desc: 'highest to lowest'
    }
};
export const contentRatings = ['safe', 'suggestive', 'erotica', 'pornographic'];
export const chapterTranslatedLanguages = ['en', 'es', 'pt-br', 'fr', 'de']; 
export const expectedFilters = ['includeInMangadexFetch']; // expected function parameter values at filterEntriesFromFetch
export const logMangadexOptions = {
    logMangaDirection: 'asc', // 'asc', 'desc'
    hideZeroLengthManga: false, // true, false
    logChapterDirection: 'asc', // 'asc', 'desc'
    hideReadChapters: false, // true, false
    filterChapterLanguages: [] // true, false
};
/*
    Options for Mangadex's fetchChapters() custom search:
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