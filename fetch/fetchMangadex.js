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

async function openMangadexChaptersInBrowser (fetchResults) {
    let m = null;
    // console.dir(fetchResults, {depth: null});

    // TODO:
    // - consider formatting stuff earlier in code e.g. separate formatting function
    //   for taking first mangatitle's etc.etc.....
    // - consider moving this function to menuFetchMangadex.js instead

    while (m !== 'e') {   
        console.log('\n||\n|| Open chapter in browser:');
        let searchIndex = 0, selectableIndex = 0; // used for formatting
        for (const search of fetchResults) {
            const manga = search.manga;
            const mangaTitle = Object.values(manga.attributes.title)[0]; // first title of titles
            const query = search.query;
            console.log(`||\n|| ${mangaTitle}:\n||`);
            for (const chapter of search.chapters) {
                const title = chapter.attributes.title ? chapter.attributes.title : 'No Title'; // title
                const chNum = chapter.attributes.chapter !== null ? chapter.attributes.chapter : -1; // chapter number
                const transLang = chapter.attributes.translatedLanguage ? chapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
                const unreadTag = query.type === 'manga' && // is manga
                                  query.id === parseInt(manga.attributes.links?.mal, 10) && // is same id 
                                  query.progress < chNum ? // progress < chNum
                                  '- {( Unread! )}' : ''; 
                console.log(`|| ${selectableIndex++}: ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${title} (${transLang}) ${unreadTag}`);
            }
            if (search.chapters.length === 0) {
                console.log('|| - No chapters found');
            }
            if (searchIndex === fetchResults.length - 1) console.log('||');
            searchIndex++; 
        }
        console.log('\n||\n|| e -> Go back\n||');
        
        m = await takeUserInput(); // get user input

        // handle user input
        if (m >= 0 && m <= selectableIndex - 1) {
            let i = 0; 
            for (const search of fetchResults) { // searches
                for (const chapter of search.chapters) { // chapters
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

export { fetchMangadexMangas, fetchMangadexChapters, openMangadexChaptersInBrowser };

/*
    fetchResults complete layout (2025/09/23):
    [   
        {
            query: {
                title: string,
                id: num,
                type: string, (anime/manga)
                progress: num
            },
            manga: {
                id: string,
                type: string,
                attributes: {
                    title: {
                        ?: string, (language code)
                        etc...                    
                    },
                    altTitles: [
                        ?: string, (language code)
                        etc...
                    ],
                    description: {
                        ?: string, (language code)
                        etc...
                    },
                    isLocked: boolean,
                    links: {
                        ?: string, (e.g. mal)
                        etc...
                    },
                    originalLanguage: string,
                    lastVolume: string,
                    lastChapter: string,
                    publicationDemographic: string, (e.g. shounen)
                    status: string, (e.g. completed)
                    year: num,
                    contentRating: string, (e.g. suggestive)
                    tags: [
                        {
                            id: string
                            type: string
                            attributes: {
                                name: {
                                    ?: string (e.g. action)
                                },
                                description: {
                                    ?: string
                                },
                                group: string,
                                version: num
                            },       
                            relationships: [
                                ?: ?
                            ]
                        },
                        etc...
                    ],
                    state: string, (e.g. published)
                    chapterNumbersResetOnNewVolume: boolean,
                    createdAt: string,
                    updatedAt: string,
                    version: num,
                    availableTranslatedLanguages: [
                        ?: string, (e.g. en)
                        etc...
                    ],
                    latestUploadedChapter: string, (id of latest uploaded chapter)
                }, // attributes end
                relationships: [
                    {
                        id: string,
                        type: string (e.g. author)
                    },
                    etc...
                ]
            }, // manga end
            chapters: [
                {
                    id: string,
                    type: string,
                    attributes: {
                        volume: string,
                        chapter: string,
                        title: string,
                        translatedLanguage: string,
                        externalUrl: ???,
                        isUnavailable: boolean,
                        publishAt: string,
                        readableAt: string,
                        createdAt: string,
                        updatedAt: string,
                        pages: num,
                        version: num
                    },
                    relationships: [
                        {
                            id: string,
                            type: string
                        },
                        etc...
                    ],
                    link: string
                },
                etc...
            ] 
        }, // fetchResult end
        etc...
    ]
*/