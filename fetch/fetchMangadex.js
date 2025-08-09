import axios from 'axios';
import { setTimeout } from "timers/promises";
// import { toZonedTime, format } from 'date-fns-tz'; 

async function fetchMangadex (lists, options) {
    try { // <-- consider removing this try catch
        // lists[1][0].push({node: {title: 'fsdaölkjfjlköasdafösldjk'}});
        await fetchChapters(lists, options);
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`); 
    }
}

async function fetchChapters (lists, options) {
    try {
        let countFoundManga = 0, countMissingManga = 0, countFoundChapter = 0, countMissingChapter = 0;
        const items = lists[options.MAL_list][options.MAL_status]; // points to preferred search
        console.log('\n>> Now searching for manga >>\n'); 
        const startTime = performance.now(); // timing fetch start
        for (const item of items) { // going through items
            if (item.includeInMangadexFetch) { // skip filtered items
                const startTimeManga = performance.now(); // timing manga fetch start
                const mangaResponse = await axios.get(`https://api.mangadex.org/manga`, { // fetching Mangadex mangas based on preference
                    params: {
                        title: item.node.title, // item title
                        limit: options.limit_manga, // preferred fetch length 
                        [`order[${options.mangaOrderType}]`]: options.mangaOrderDirection, // e.g 'order[relevance]': 'desc' - orders by most relevant to least relevant
                        contentRating: options.contentRating // includes preferred contentRatings
                    }
                }); 
                const mangaFetchTimeTaken = Math.round(performance.now()-startTimeManga); // time taken for manga fetch
                if (mangaFetchTimeTaken < 200) await setTimeout(200-mangaFetchTimeTaken); // avoiding rate limit
                console.log(`-> ${item.node.title}\n`); // logging MAL item title
                if (!mangaResponse.data.data.length) { // if manga wasn't found
                    console.log('> Manga was not found');
                    countMissingManga++;
                } else { 
                    const startTimeChapter = performance.now(); // timing chapter fetch start
                    const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching chapters of manga
                        params: {
                            manga: mangaResponse.data.data[0].id, // id taken from prior manga endpoint fetch
                            limit: options.limit_chapter, // preferred fetch length 
                            [`order[${options.chapterOrderType}]`]: options.chapterOrderDirection, // e.g 'order[chapter]': 'desc' - orders by newest to oldest chapter
                            translatedLanguage: options.chapterTranslatedLanguage // filter by preferred translation
                        }
                    });
                    const chapterFetchTimeTaken = Math.round(performance.now()-startTimeChapter); // time taken for chapter fetch
                    if (chapterFetchTimeTaken < 200) await setTimeout(200-chapterFetchTimeTaken); // avoiding rate limit
                    if (!chapterResponse.data.data.length) { // if manga had no chapters for given parameters
                        console.log('> No chapters found');
                        countMissingChapter++;
                    } else {
                        for (let i = 0; i < chapterResponse.data.data.length; i++) { // logging all found chapters
                            const chapter = chapterResponse.data.data[i]; // chapter info
                            const transLang = chapter.attributes?.translatedLanguage ? chapter.attributes.translatedLanguage + ' - ' : ''; // chapter translation language
                            const title = chapter.attributes?.title ? chapter.attributes.title + ' - ' : 'No title - '; // chapter title
                            const number = chapter.attributes?.chapter; // chapter number
                            const numberAsText = number !== undefined ? number + ' - ' : 'No chapter number - '; // chapter number as string
                            const link = 'https://mangadex.org/chapter/' + chapter.id; // link to chapter
                            const newChapter = parseInt(number, 10) > item.list_status?.num_chapters_read ? ' {( New! )}' : ''; // appends 'new' when chapter is unread
                            console.log(`> ${title}${numberAsText}${transLang}${link}${newChapter}`);
                            countFoundChapter++;
                        }
                    }
                    countFoundManga++;
                }
                console.log(); // empty line
            }
        }
        const fetchTimeTaken = Math.round(performance.now()-startTime); // time taken for full fetch
        // log statistics of all fetchs
        console.log(`>> Search result (${fetchTimeTaken}ms) >>\n\n> Found manga: ${countFoundManga}\n> Manga with no chapters: ${countMissingChapter}\n> Missing manga: ${countMissingManga}\n> Found chapter: ${countFoundChapter}`);
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

export { fetchMangadex };