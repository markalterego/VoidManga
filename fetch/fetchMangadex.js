import axios from 'axios';
import { setTimeout } from "timers/promises";
// import { toZonedTime, format } from 'date-fns-tz'; 

async function fetchMangadexMangas (lists, options) {
    try {
        let mangaEndpointFetchResults = [];
        for (const type of lists) { // anime/manga
            for (const status of type) { // status
                for (const entry of status) { // entry
                    if (entry.includeInMangadexFetch) { // fetch by filtered
                        const startTimeManga = performance.now(); // timing manga fetch start
                        const mangaResponse = await axios.get(`https://api.mangadex.org/manga`, { // fetching Mangadex mangas based on preference
                            params: {
                                title: entry.node.title, // entry title
                                limit: options.limit_manga, // preferred fetch length 
                                [`order[${options.mangaOrderType}]`]: options.mangaOrderDirection, // e.g 'order[relevance]': 'desc' - orders by most relevant to least relevant
                                contentRating: options.contentRating // includes preferred contentRatings
                            }
                        });
                        const finalMangaResponseData = { searchResults: mangaResponse.data.data, // searchResults 
                                                         query: { // relevant MAL info
                                                            title: entry.node.title, // title used for search
                                                            id: entry.node.id, // MAL id
                                                            type: type === 0 ? 'anime' : 'manga', // list type
                                                            progress: type === 0 ? entry.list_status.num_episodes_watched : entry.list_status.num_chapters_read // episodes watched/chapers read
                                                        }}; 
                        mangaEndpointFetchResults.push(finalMangaResponseData); // appending search results to array
                        const mangaFetchTimeTaken = Math.round(performance.now()-startTimeManga); // time taken for fetch
                        if (mangaFetchTimeTaken < 200) await setTimeout(200-mangaFetchTimeTaken); // avoiding rate limit
                    }
                }
            }
        }
        return mangaEndpointFetchResults; // return searchResults for all manga searches
    } catch (error) {
        if (error.response) {
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}`);
            if ((typeof error.response.data)!=='string') error.response.data.errors.forEach(err => { console.error(`|| ${err.detail}`); });
            else console.error(`\n|| ${error.response.data}`);
            console.log('||'); // hifistely
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchMangadexChapters (selectedMangas, options) {
    try {
        // TODO: 
        // - use ids[] params of /chapter endpoint to reduce the 
        //   number of fetches made to the endpoint 

        let mangaAndChapterInfo = [];
        for (const selectedManga of selectedMangas) {
            const startTimeChapter = performance.now(); // timing chapter fetch start
            const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching chapters of manga
                params: {
                    manga: selectedManga.manga.id, // id taken from prior manga endpoint fetch
                    limit: options.limit_chapter, // preferred fetch length 
                    offset: options.offset_chapter, // e.g. if offset 5, orders by given options and then moves index by 5
                    [`order[${options.chapterOrderType}]`]: options.chapterOrderDirection, // e.g 'order[chapter]': 'desc' - orders by newest to oldest chapter
                    translatedLanguage: options.chapterTranslatedLanguage // filter by preferred translation
                }
            });
            const finalChapterResponseData = (() => { // keep only relevant info from results
                return chapterResponse.data.data.map((chapter) => {
                    return { ...chapter, link: `https://mangadex.org/chapter/${chapter.id}` };
                }); 
            })();
            mangaAndChapterInfo.push({ query: selectedManga.query, 
                                       manga: selectedManga.manga, 
                                       chapters: finalChapterResponseData }); // push combined manga and chapter info to array 
            const chapterFetchTimeTaken = Math.round(performance.now()-startTimeChapter); // time taken for chapter fetch
            if (chapterFetchTimeTaken < 200) await setTimeout(200-chapterFetchTimeTaken); // avoiding rate limit
        }
        return mangaAndChapterInfo; // return array consisting of [mangaInfo, chapterInfo]
    } catch (error) {
        if (error.response) {
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}`);
            if ((typeof error.response.data)!=='string') error.response.data.errors.forEach(err => { console.error(`|| ${err.detail}`); });
            else console.error(`\n|| ${error.response.data}`);
            console.log('||'); // hifistely
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { fetchMangadexMangas, fetchMangadexChapters };

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
    - selectedMangas -- an array in format [ {manga, query}, etc... ] (constructed at ./menuFetchMangadex.js -- selectMangasFromFetchResults)
    - options -- an object currently consisting of 8 properties (more info at /helpers/export.js)

purpose:
    - fetch Mangadex endpoint for Mangadex chapters (https://api.mangadex.org/chapter)

logic:
    - fetchMangadexChapters goes through parameter selectedMangas in the format:   
    [
        {
            manga, (obj) -- consist of info about user selected manga
            query (obj) -- the same query appended to each search at fetchMangadexMangas
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
            query, (obj) -- info that was used to fetch the manga and chapter endpoints
            manga, (obj) -- info about the manga the chapters were fetched of
            chapters (array) -- found chapters for the given parameters
        },
        etc...
    ]
*/