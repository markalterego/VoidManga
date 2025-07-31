import axios from 'axios';
// import { toZonedTime, format } from 'date-fns-tz'; 

async function pollMangadex (lists, options) {
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
        const mangas = lists[options.MAL_list][options.MAL_status]; // points to preferred search
        console.log('\n>> Now searching for manga >>\n'); 
        for (const manga of mangas) { // going through mangas
            const mangaResponse = await axios.get(`https://api.mangadex.org/manga`, { // fetching MAL mangas based on preference
                params: {
                    title: manga.node.title, // manga title
                    limit: options.limit_manga, // preferred fetch length 
                    [`order[${options.mangaOrderType}]`]: options.mangaOrderDirection, // e.g 'order[relevance]': 'desc' - orders by most relevant to least relevant
                    contentRating: options.contentRating // includes preferred contentRatings
                }
            }); 
            console.log(`-> ${manga.node.title}\n`); // logging MAL manga title
            if (!mangaResponse.data.data.length) { // if manga wasn't found
                console.log('> Manga was not found');
                countMissingManga++;
            } else { 
                const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching chapters of manga
                    params: {
                        manga: mangaResponse.data.data[0].id, // id taken from prior manga endpoint fetch
                        limit: options.limit_chapter, // preferred fetch length 
                        [`order[${options.chapterOrderType}]`]: options.chapterOrderDirection, // e.g 'order[chapter]': 'desc' - orders by newest to oldest chapter
                        translatedLanguage: options.chapterTranslatedLanguage // filter by preferred translation
                    }
                });
                if (!chapterResponse.data.data.length) { // if manga had no chapters for given parameters
                    console.log('> No chapters found');
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
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}`);
            if ((typeof error.response.data)!=='string') error.response.data.errors.forEach(err => { console.error(`|| ${err.detail}`); });
            else console.error(`\n|| ${error.response.data}`);
            console.log('||'); // hifistely
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { pollMangadex };