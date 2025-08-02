export const animeStatus = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
export const mangaStatus = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']; 
export const pollMangadexOptions = { 
    MAL_list: null, // 0 or 1
    MAL_status: null, // 0 - 4 
    limit_manga: null, // default: 10, min: 0, max is 100
    limit_chapter: null, // default: 10, min: 0, max is 100 
    mangaOrderType: null, // 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    chapterOrderType: null, // 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    mangaOrderDirection: null, // 'asc', 'desc'
    chapterOrderDirection: null, // 'asc', 'desc'
    contentRating: [null], // ['safe','etc...'], undefined for default behavior
    chapterTranslatedLanguage: [null], // ['en','es','etc...'], undefined for all languages
}
export const mangaOrderTypes = ['title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'];
export const chapterOrderTypes = ['createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'];
export const orderDirections = ['asc', 'desc'];
export const contentRatings = ['safe', 'suggestive', 'erotica', 'pornographic'];

/*
    Options for fetchChapters() custom search:
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