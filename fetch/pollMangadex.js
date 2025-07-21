import axios from 'axios';
// import { toZonedTime, format } from 'date-fns-tz';

/*
    Options for fetchChapters() custom search:
        -MAL_list - anime/manga = 0/1
        -MAL_status - watching/reading, completed, on-hold, dropped, plan-to-watch/plan-to-read = 0/1/2/3/4
        
        -limit_manga = 0-100, undefined for default behavior (10)
        -limit_chapter = 0-100, undefined for default behavior (10)
        -translatedLanguage = ['en','es',etc...], undefined for all languages
        -contentRating: ['safe','suggestive','erotica','pornographic'], undefined for default behavior (all expect pornographic)

    Options are saved as json:
    const options = {
        variable: ['value'],
        ...
    };
    params: filters

    const can be spreaded to change values inside:
    options = { ...options, variable: 'short', etc...}
*/  

const options = {
    MAL_list: 1, // 0, 1
    MAL_status: 0, // 0 - 4 
    limit_manga: undefined, // default: 10, min: 0, max is 100
    limit_chapter: undefined, // default: 10, min: 0, max is 100 
    orderType: 'relevance', // check what was the default sorting method for the api!!!
}   

async function pollMangadex (lists) {
    try {
        await fetchChapters(lists, options);
    } catch (error) {
        if (error.response) {
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchChapters (lists, options) {
    try {
        let countFoundManga = 0, countMissingManga = 0, countFoundChapter = 0, countMissingChapter = 0;
        const mangas = lists[1][0]; // points to mangas tagged as reading
        console.log('\n>> Now searching for manga >>\n'); 
        for (const manga of mangas) { // going through mangas
            const mangaResponse = await axios.get(`https://api.mangadex.org/manga`, { // fetching mangas tagged as reading
                params: {
                    title: manga.node.title, // MAL mangas tagged as reading
                    contentRating: ['safe','suggestive','erotica','pornographic'], // includes all contentRatings
                    'order[relevance]': 'desc', // order by most relevant to least relevant
                    limit: undefined
                }
            }); 
            console.log(`-> ${manga.node.title}\n`); // logging MAL manga title
            if (!mangaResponse.data.data.length) { // if manga wasn't found
                console.log('> Manga was not found');
                countMissingManga++;
            } else { 
                const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching english chapters of manga
                    params: {
                        manga: mangaResponse.data.data[0].id, // id taken from prior manga endpoint fetch
                        translatedLanguage: ['en'], // ['en'], // filter english translations
                        'order[chapter]': 'desc', // order by newest chapter
                        limit: undefined
                    }
                });
                if (!chapterResponse.data.data.length) { // if manga had no english chapters
                    console.log('> No english chapters found');
                    countMissingChapter++;
                } else {
                    for (let i = 0; i < chapterResponse.data.data.length; i++) { // logging all found chapters
                        console.log(`> ${chapterResponse.data.data[i].attributes.title ? chapterResponse.data.data[i].attributes.title : 'No title'} - ${chapterResponse.data.data[i].attributes.chapter} - https://mangadex.org/chapter/${chapterResponse.data.data[i].id}`);
                        countFoundChapter++;
                    }
                }
                countFoundManga++;
            }
            console.log(); // empty line
        }
        // log statistics of all polls
        console.log(`>> Search result >>\n\n> Found manga: ${countFoundManga}\n> Manga with no chapters: ${countMissingChapter}\n> Missing manga: ${countMissingManga}\n> Found chapter: ${countFoundChapter}`);
    } catch (error) {
        if (error.response) {
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data}\n||`);
        } else {
            console.error(`||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { pollMangadex };