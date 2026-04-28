import axios from 'axios';
import { setTimeout } from "timers/promises";
import { logErrorDetails } from '../helpers/errorLogger.js';
import { getTypeIndex } from '../updateMAL/updateMAL.js';
import { withRetry, rateLimitedFetch } from './fetchUtils.js';
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
            console.log(`|| [${searchTitle}] ${fetchedMangasCount ? `${fetchedMangasCount} mangas fetched`: 'no mangas found'} (${++fetchCount}/${includedEntries.length})${isLastEntry ? '\n||' : ''}`);
        } 
        return mangaEndpointFetchResults; // return searchResults for all manga searches
    } catch (error) {
        logErrorDetails(error);
    }
}

function findIncludedEntries (lists) {
    // filters lists by entries which have entry.includeInMangadexFetch set to true
    // and maps type: 'anime'/'manga' to each found entry based on if entry was found
    // at anime- or mangalist 
    const types = ['anime', 'manga'];
    return lists.flat(2)
                .filter(e => e.includeInMangadexFetch)
                .map(e => ( 
                    { ...e, type: types[getTypeIndex(e)] } 
                ));
}

async function fetchManga (entry, options) {
    const { type, node: { title, id } } = entry;
    const { limit_manga, mangaOrderType, mangaOrderDirection, contentRating } = options;
    
    const params = {
        title,
        limit: limit_manga,
        [`order[${mangaOrderType}]`]: mangaOrderDirection, // e.g 'order[relevance]': 'desc' - orders by most relevant to least relevant
        contentRating
    };

    // fetch manga 
    const response = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.get('https://api.mangadex.org/manga', { params })
        )
    );

    return {
        searchResults: response.data.data,
        query: { title, id, type }
    };
}
 
async function fetchMangadexChapters (selectedMangas, options) {
    try {
        
        // TODO: 
        // - make it so limit_chapter > 100 is allowed in a way that fetches are split
        //   into multiple 100 sized or smaller fetches 

        let mangaAndChapterInfo = [], fetchCount = 0;
        for (const selectedManga of selectedMangas) {
            const isFirstManga = selectedManga === selectedMangas[0]; // first manga of selectedMangas
            const mangaTitle = Object.values(selectedManga.manga.attributes.title)[0]; // first title at ...attributes.title
            console.log(`${isFirstManga ? '\n' : ''}||\n|| [${mangaTitle}] Fetching chapters... (${++fetchCount}/${selectedMangas.length})`);
            const fetchedChapters = !options.fetchAllChapters ? await fetchChaptersCustom(selectedManga, options) : await fetchChaptersAll(selectedManga, options); // fetch chapters for manga
            const combinedMangaChapterData = { manga: selectedManga.manga, chapters: fetchedChapters }; // combine selectedManga.manga && fetchedChapter into obj
            const fetchedChaptersCount = combinedMangaChapterData.chapters?.length; // total chapters found
            mangaAndChapterInfo.push(combinedMangaChapterData); // append combined manga chapter info to mangaAndChapterInfo
            const isLastManga = selectedManga === selectedMangas[selectedMangas.length-1]; // last manga in selectedMangas
            console.log(`||   ${fetchedChaptersCount ? `Total: ${fetchedChaptersCount} chapters` : 'No chapters found'}${isLastManga ? '\n||' : ''}`); // logging total found chapters for selectedManga
        }
        return mangaAndChapterInfo; // return array consisting of [mangaInfo, chapterInfo]
    } catch (error) {
        logErrorDetails(error);
    }
}

async function fetchChaptersCustom ({ manga: { id } }, options) {
    const { limit_chapter, offset_chapter, chapterOrderType, 
            chapterOrderDirection, chapterTranslatedLanguage, 
            contentRating } = options;

    const params = Object.fromEntries(
        Object.entries({
            limit: limit_chapter,
            offset: offset_chapter,
            [`order[${chapterOrderType}]`]: chapterOrderDirection, // e.g 'order[chapter]': 'desc' - orders by newest to oldest chapter
            translatedLanguage: chapterTranslatedLanguage,
            contentRating
        }).filter(([_, val]) => ( // filter invalid values
            (typeof val === 'number' && val >= 0) ||
            (Array.isArray(val) && val.length)
        ))
    );

    // fetch chapters
    const chapterResponse = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.get(`https://api.mangadex.org/manga/${id}/feed`, { params })
        )
    );

    // map links
    const formattedChapterResponse = chapterResponse.data.data?.map(chapter =>
        ({ ...chapter, link: `https://mangadex.org/chapter/${chapter.id}`})
    );

    return formattedChapterResponse ?? [];
}

async function fetchChaptersAll ({ manga: { id }}, { chapterTranslatedLanguage, contentRating }, limit = 100) {
    const hasMoreChapters = (amountFetched) => amountFetched === limit; // evaluates true when API returns limit amount of chapters
    const withinOffsetCap = (offset) => offset + limit < 10000; // evalutes true until offset cap is reached

    let chapters = [], amountFetched = limit;

    for (let offset = 0; hasMoreChapters(amountFetched) && withinOffsetCap(offset); offset += limit) {
        const params = Object.fromEntries(
            Object.entries({
                limit,
                offset,
                translatedLanguage: chapterTranslatedLanguage, 
                contentRating 
            }).filter(([_, val]) => ( // filter invalid values
                (typeof val === 'number' && val >= 0) ||
                (Array.isArray(val) && val.length)
            ))
        );

        // fetch chapters
        const chapterResponse = await withRetry(() =>
            rateLimitedFetch(() =>
                axios.get(`https://api.mangadex.org/manga/${id}/feed`, { params })
            )
        );

        amountFetched = chapterResponse.data.data?.length; 

        // format response
        const formattedChapters = chapterResponse.data.data?.map(chapter =>
            ({ ...chapter, link: `https://mangadex.org/chapter/${chapter.id}`})
        );

        chapters.push(formattedChapters);
        
        // log chapters fetched
        console.log(`||    ${String(amountFetched).padStart(3)} chapters (offset ${String(offset).padStart(4)})`);   
    }

    return chapters.flat();
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