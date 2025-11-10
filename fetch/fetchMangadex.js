import axios from 'axios';
import { setTimeout } from "timers/promises";
// import { toZonedTime, format } from 'date-fns-tz'; 

async function fetchMangadexMangas (lists, options) {
    try {
        let mangaEndpointFetchResults = [], fetchCount = 0;
        const includedEntries = findIncludedEntries(lists); // returns an array of copies of found entries slightly re-formatted  
        console.log('\n||\n|| Fetching mangas...\n||');
        for (const entry of includedEntries) { // anime/manga     
            const fetchResult = await fetchManga(entry, options); // returns { searchResults: [obj, etc...], query: { key: value, etc... } }
            const searchTitle = fetchResult.query.title; // title used in search (MAL title)
            const fetchedMangasCount = fetchResult.searchResults?.length; // length of searchResults
            mangaEndpointFetchResults.push(fetchResult);
            const isLastEntry = entry === includedEntries[includedEntries.length-1]; // last entry in includedEntries
            console.log(`|| Fetch ${++fetchCount}: Search: ${searchTitle}: ${fetchedMangasCount ? `${fetchedMangasCount} mangas fetched`: 'no mangas found'}${isLastEntry ? '\n||' : ''}`);
        } 
        return mangaEndpointFetchResults; // return searchResults for all manga searches
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

function findIncludedEntries (lists) {
    // 1. find entry with .includeInMangadexFetch = true 
    // 2. copies found entry to formattedEntry 
    // 3. includes new key to formattedEntry called type holding either 'anime' or 'manga' 
    //    in reference to if said entry was found in lists[0] or lists[1]
    let foundEntries = [];
    for (const type of lists) {
        for (const status of type) {
            for (const entry of status) {
                if (entry.includeInMangadexFetch) {
                    const formattedEntry = JSON.parse(JSON.stringify(entry)); // copy entry found in lists to formattedEntry
                    formattedEntry.type = type === 0 ? 'anime' : 'manga'; // include type of entry to formattedEntry
                    foundEntries.push(formattedEntry); // push formattedEntry to found entries
                }
            }
        }
    }
    return foundEntries;
}

async function fetchManga (entry, options) {
    let formattedMangaResponse = {}, errorsInRow = 0, keepFetching = true;
    while (keepFetching) {
        const startTimeManga = performance.now(); // timing manga fetch start
        try {
            const mangaResponse = await axios.get(`https://api.mangadex.org/manga`, { // fetching Mangadex mangas based on preference
                params: {
                    title: entry.node.title, // entry title
                    limit: options.limit_manga, // preferred fetch length 
                    [`order[${options.mangaOrderType}]`]: options.mangaOrderDirection, // e.g 'order[relevance]': 'desc' - orders by most relevant to least relevant
                    contentRating: options.contentRating // includes preferred contentRatings
                }
            });
            formattedMangaResponse = { searchResults: mangaResponse.data.data, // searchResults 
                                       query: { // relevant MAL info
                                            title: entry.node.title, // title used for search
                                            id: entry.node.id, // MAL id
                                            type: entry.type === 0 ? 'anime' : 'manga', // list type
                                      }}; 
            keepFetching = false; // stop fetching
        } catch (error) {
            if (error.response) { // <-- error related to fetching 
                const triesRemaining = 5 - (++errorsInRow); // update errorsInRow and log failed fetch
                console.error(`|| Fetch failed (Tries remaining: ${triesRemaining ? `${triesRemaining})` : `${triesRemaining})\n||`}`);
                if (errorsInRow >= 5) throw new Error('Five fetches failed in a row'); // throw five fetches in a row err
            } else {
                throw error; // throw error up the hierarchy
            }
        }
        const mangaFetchTimeTaken = Math.round(performance.now()-startTimeManga); // time taken for fetch
        if (mangaFetchTimeTaken < 200) await setTimeout(200-mangaFetchTimeTaken); // avoiding rate limit
    }   
    return formattedMangaResponse;
}
 
async function fetchMangadexChapters (selectedMangas, options) {
    try {
        
        // TODO: 
        // - make it so limit_chapter > 100 is allowed in a way that fetches are split
        //   into multiple 100 sized or smaller fetches 

        let mangaAndChapterInfo = [];
        for (const selectedManga of selectedMangas) {
            const isFirstManga = selectedManga === selectedMangas[0]; // first manga of selectedMangas
            const mangaTitle = Object.values(selectedManga.manga.attributes.title)[0]; // first title at ...attributes.title
            console.log(`${isFirstManga ? '\n' : ''}||\n|| Fetching: ${mangaTitle}`);
            const fetchedChapters = !options.fetchAllChapters ? await fetchChaptersCustom(selectedManga, options) : await fetchChaptersAll(selectedManga, options); // fetch chapters for manga
            const combinedMangaChapterData = { manga: selectedManga.manga, chapters: fetchedChapters }; // combine selectedManga.manga && fetchedChapter into obj
            const fetchedChaptersCount = combinedMangaChapterData.chapters?.length; // total chapters found
            mangaAndChapterInfo.push(combinedMangaChapterData); // append combined manga chapter info to mangaAndChapterInfo
            const isLastManga = selectedManga === selectedMangas[selectedMangas.length-1]; // last manga in selectedMangas
            console.log(`|| Total fetched: ${fetchedChaptersCount ? `${fetchedChaptersCount} chapters` : 'no chapters found'}${isLastManga ? '\n||' : ''}`); // logging total found chapters for selectedManga
        }
        return mangaAndChapterInfo; // return array consisting of [mangaInfo, chapterInfo]
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function fetchChaptersCustom (selectedManga, options) {
    let formattedChapterResponse = [], keepFetching = true;
    while (keepFetching) {
        const startTimeChapter = performance.now(); // timing chapter fetch start
        try {
            // format params from options 
            const formattedParams = Object.fromEntries( // obj
                Object.entries({ // arr
                    limit: options.limit_chapter, // preferred fetch length 
                    offset: options.offset_chapter, // e.g. if offset 5, orders by given options and then moves index by 5
                    [`order[${options.chapterOrderType}]`]: options.chapterOrderDirection, // e.g 'order[chapter]': 'desc' - orders by newest to oldest chapter
                    translatedLanguage: options.chapterTranslatedLanguage, // filter by preferred translation
                    contentRating: options.contentRating // includes preferred contentRatings
                }).filter(([_, value]) => ((Array.isArray(value) || typeof value === 'string') && value.length) || (typeof value === 'number' && value >= 0)) // remove empty keys
            );
            // fetching chapters of selectedManga
            const chapterResponse = await axios.get(`https://api.mangadex.org/manga/${selectedManga.manga.id}/feed`, { 
                params: formattedParams
            });
            // including links to each returned chapter
            formattedChapterResponse = chapterResponse?.data?.data?.map((chapter) => {
                return { ...chapter, link: `https://mangadex.org/chapter/${chapter.id}` };
            });
            keepFetching = false; // stop fetching
        } catch (error) {
            if (error.response) { // <-- error related to fetching 
                const triesRemaining = 5 - (++errorsInRow); // update errorsInRow and log failed fetch
                console.error(`|| Fetch failed (Tries remaining: ${triesRemaining ? `${triesRemaining})` : `${triesRemaining})\n||`}`);
                if (errorsInRow >= 5) throw new Error('Five fetches failed in a row'); // throw five fetches in a row err
            } else {
                throw error; // throw error up the hierarchy
            }
        } 
        const chapterFetchTimeTaken = Math.round(performance.now()-startTimeChapter); // time taken for chapter fetch
        if (chapterFetchTimeTaken < 200) await setTimeout(200-chapterFetchTimeTaken); // avoiding rate limit       
    }
    return formattedChapterResponse;
}

async function fetchChaptersAll (selectedManga, options) {
    const limit = 100; let chapters = [], offset = 0, keepFetching = true, errorsInRow = 0, fetchIndex = 0;
    while (keepFetching) {
        const startTimeChapter = performance.now(); // timing chapter fetch start
        try {
            // format params
            const formattedParams = Object.fromEntries( // obj
                Object.entries({ // arr
                    limit: limit, // max fetch size
                    offset: offset, // offset
                    translatedLanguage: options.chapterTranslatedLanguage, // filter by preferred translation
                    contentRating: options.contentRating // includes preferred contentRatings
                }).filter(([_, value]) => (Array.isArray(value) && value.length) || (typeof value === 'number' && value >= 0)) // remove empty keys
            );
            // fetch chapter endpoint
            const chapterResponse = await axios.get(`https://api.mangadex.org/manga/${selectedManga.manga.id}/feed`, { // fetching chapters of manga
                params: formattedParams
            }); 
            // handle received chapter data
            const fetchedChaptersCount = chapterResponse.data.data?.length;
            const hasNoMoreFetchableChapters = fetchedChaptersCount !== limit; // endpoint didn't return the amount of chapters it was asked to return
            const nextFetchExceedsAllowedOffsetSizeSum = offset + limit + 100 >= 10000; // calculates the next fetches offset + size -> api allows offset + size < 10k
            if (fetchedChaptersCount) { // found chapters
                const finalChapterResponseData = chapterResponse.data.data.map((chapter) => { // keep only relevant info from results
                    return { ...chapter, link: `https://mangadex.org/chapter/${chapter.id}` };
                });
                chapters.push(finalChapterResponseData); // pushes array of obj to chapters
            }
            if (hasNoMoreFetchableChapters || nextFetchExceedsAllowedOffsetSizeSum) {
                chapters = chapters.flatMap(c => c); // flatten arr of arr of obj TO arr of obj
                keepFetching = false; // stop fetching
            }
            console.log(`|| Fetch ${++fetchIndex}: ${fetchedChaptersCount} chapters fetched (Offset: ${offset})`);
            offset += 100; // append offset by 100
            errorsInRow = 0; // resetting consecutive errors
        } catch (error) { 
            if (error.response) { // <-- error related to fetching
                const triesRemaining = 5 - (++errorsInRow); // update errorsInRow and log failed fetch
                console.log(`|| Fetch failed (Tries remaining: ${triesRemaining ? `${triesRemaining})` : `${triesRemaining})\n||`}`);
                if (errorsInRow >= 5) throw new Error('Five fetches failed in a row'); // five fetches in a row err
            } else {
                throw error; // throw error up the hierarchy
            }
        }
        const chapterFetchTimeTaken = Math.round(performance.now()-startTimeChapter); // time taken for chapter fetch
        if (chapterFetchTimeTaken < 200) await setTimeout(200-chapterFetchTimeTaken); // avoiding rate limits
    }   
    return chapters;
}

export { fetchMangadexMangas, fetchMangadexChapters };

// HOX... the below comments may not be up to date anymore...

/* fetchMangadexMangas:

parameters: 
    - lists -- essentially an array [animelist, mangalist] (extended format explanation found at the bottom of /ui/menu.js) 
    - options -- an object currently consisting of 8 properties (more info at /helpers/export.js)

purpose:
    - fetch Mangadex endpoint for Mangadex mangas (https://api.mangadex.org/manga)

logic:
    - every lists entry -- anime- or mangalist -- is in the format of an object: 
    { 
        node, (object)
        list_status, (object)
        includeInMangadexFetch (boolean)
    } 
    - the function checks includeInMangadexFetch for each entry in lists and in case includeInMangadexFetch
      is set to true, uses the title of the entry (entry.node.title) to fetch the manga endpoint
    - the options parameter affects what type of data is returned by the endpoint and in this context, the function
      uses specifically the properties: limit_manga, mangaOrderType, mangaOrderDirection and contentRating 

    - if neither parameter is defined, the function will return an empty array
    - each result returned by the manga endpoint will be formatted and then pushed into mangaEndpointFetchResults
    - after lists is iterated and checked through completely, mangaEndpointFetchResults is returned by the function
      in the format of:
    [
        {
            searchResults, (array) -- found mangas
            query: {
                title, (string) -- MAL title used in search
                id, (num)
                type, (string) -- anime/manga
            }
        },
        etc...
    ] 
*/

/* fetchMangadexChapters:

parameters:
    - selectedMangas -- an array in format [ {manga}, etc... ] (constructed at ./menuFetchMangadex.js -- selectMangasFromFetchResults)
    - options -- an object currently consisting of 8 properties (more info at /helpers/export.js)

purpose:
    - fetch Mangadex endpoint for Mangadex chapters (https://api.mangadex.org/manga/{id}/feed)

logic:
    - fetchMangadexChapters goes through parameter selectedMangas in the format:   
    [
        {
            manga, (obj) -- consist of info about user selected manga
        },
        etc..
    ]
    - for each object stored inside the array, the function will perform one fetch of endpoint
    - for the fetch itself, the function uses specifically manga.id to perform the search itself
    - for the server-side formatting of the results returned by the endpoint, the function will use a few properties of the options
      parameter, specifically: limit_chapter, chapterOrderType, chapterOrderDirection and chapterTranslatedLanguage 

    - each result returned by the manga endpoint will be formatted and then pushed into mangaAndChapterInfo
    - after the parameter selectedMangas is looped through entirely, the function will return mangaAndChapterInfo 
      in the format of:
    [
        {
            manga, (obj) -- info about the manga the chapters were fetched of
            chapters (array) -- found chapters for the given parameters
        },
        etc...
    ]
*/