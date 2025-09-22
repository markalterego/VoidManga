import axios from 'axios';
import open from 'open';
import { setTimeout } from "timers/promises";
import { takeUserInput } from '../helpers/functions.js';
// import { toZonedTime, format } from 'date-fns-tz'; 

async function fetchMangadexMangas (lists, options) {
    try {
        let searchResults = [];
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
                        searchResults.push(finalMangaResponseData); // appending search results to array
                        const mangaFetchTimeTaken = Math.round(performance.now()-startTimeManga); // time taken for fetch
                        if (mangaFetchTimeTaken < 200) await setTimeout(200-mangaFetchTimeTaken); // avoiding rate limit
                    }
                }
            }
        }
        return searchResults; // return searchResults for all manga searches
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
        let mangaAndChapterInfo = [];
        for (const selectedManga of selectedMangas) {
            const startTimeChapter = performance.now(); // timing chapter fetch start
            const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching chapters of manga
                params: {
                    manga: selectedManga.manga.id, // id taken from prior manga endpoint fetch
                    limit: options.limit_chapter, // preferred fetch length 
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

async function logMangadex (fetchResults) {
    let m = null, selectableIndex = 0;
    // <-- log fetched info...
    // console.dir(fetchResults, {depth: 4});

    // TODO:
    // - make it possible to open links by inputting the index next to said link
    //   through the ui
    // - consider formatting stuff earlier in code e.g. separate formatting function
    //   for taking first mangatitle's etc.etc.....
    while (m !== 'e') {   
        let infoIndex = 0;
        for (const search of fetchResults) {
            const manga = search.manga;
            const mangaTitle = Object.values(manga.attributes.title)[0]; // first title of titles
            const query = search.query;
            if (infoIndex === 0) console.log();
            console.log(`||\n|| ${mangaTitle}:\n||`);
            for (const chapter of search.chapters) {
                const title = chapter.attributes.title ? chapter.attributes.title : 'No Title'; // title
                const chNum = chapter.attributes.chapter !== null ? chapter.attributes.chapter : -1; // chapter number
                const chNumString = chNum >= 0 ? chNum : 'No Chapter Number'; // chapter number as string
                const transLang = chapter.attributes.translatedLanguage ? chapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
                const unreadTag = query.type === 1 && // is manga
                                  query.id === manga.attributes.links.mal && // is same id 
                                  query.progress < chNum ? // progress < chNum
                                  '- {( Unread! )}' : ''; 
                console.log(`|| ${selectableIndex++}: ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${title} (${transLang}) ${unreadTag}`);
            }
            if (search.chapters.length === 0) {
                console.log('|| - No chapters found');
            }
            if (infoIndex === fetchResults.length - 1) console.log('||');
        }
        
        m = await takeUserInput();

        if (m >= 0 && m <= selectableIndex - 1) {
            let i = 0; 
            for (const search of fetchResults) {
                for (const chapter of search.chapters) {
                    if (i === m) { // highest selectable index
                        await open(chapter.link) // open chapter in browser
                    }
                    i++;
                }
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }    
        selectableIndex = 0;
    }
}

export { fetchMangadexMangas, fetchMangadexChapters, logMangadex };