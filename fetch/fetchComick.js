import { page } from '../main.js';
import { setTimeout } from 'timers/promises';

async function fetchComickMangas (stringOrLists) {
    try {
        await avoidCloudFlareBlock(); // setup page 
        if (typeof stringOrLists !== 'string') { // search by lists
            const lists = stringOrLists, data = [];
            for (const type of lists) { // anime/manga
                for (const status of type) { // status
                    for (const entry of status) { // entry
                        if (entry.includeInComickFetch) { // included in search
                            const title = entry.node.title; // entry title
                            const url = `https://api.comick.io/v1.0/search?q=${title}`; // mapping MAL title to params
                            const startTime = performance.now(); // starting timing
                            const mangaData = await page.evaluate(async (url) => { // calling the api
                                const res = await fetch(url, {
                                    headers: {
                                        'Accept': 'application/json'
                                    }
                                });
                                return res.json();
                            }, url); // <-- search inputted here
                            const mangaDataFinal = { ...mangaData, searchQuery: entry.node.title };
                            data.push(mangaDataFinal); // append search result to data
                            const timeTaken = Math.round(performance.now()-startTime); // time taken for fetch
                            if (timeTaken < 250) await setTimeout(250-timeTaken); // avoiding rate-limit
                        }
                    }
                }
            }
            // returns array consisting found mangas
            return data; 
        }        
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchComickChapters (mangas) { // array of mangas taken as input
    try {
        await avoidCloudFlareBlock(); // setup page
        const data = Array(mangas?.length).fill(null).map(() => []); // [manga][chapters]
        let manga_index = 0;
        for (const manga of mangas) { // selected manga
            const manga_hid = manga?.hid; // used for chapter endpoint url
            const url = `https://api.comick.io/comic/${manga_hid}/chapters?limit=10&lang=en`; // chapter endpoint
            const startTime = performance.now(); // starting timing
            const chapterData = await page.evaluate(async (url) => { // calling chapter endpoint
                const res = await fetch(url, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                return res.json();
            }, url); // <-- search inputted here
            data[manga_index++].push(chapterData.chapters); // append chapterData to data
            const timeTaken = Math.round(performance.now()-startTime); // time taken for fetch
            if (timeTaken < 250) await setTimeout(250-timeTaken); // avoiding rate-limit
        }
        return data; 
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function avoidCloudFlareBlock() {
    try {
        // getting cookies etc. from main page to avoid getting cloudflare blocked later 
        await page.goto('https://comick.io/'); // go to comick.io
        await page.waitForSelector('#__next', { timeout: 5000 }); // wait for cloudflare checks
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }   
}

async function logComick (selectedMangaData, chapterData) {
    try {
        chapterData.forEach((search, search_index) => {
            const manga = Object.values(selectedMangaData)[search_index]; // manga info
            const manga_title = manga?.title; // title
            const manga_slug = manga?.slug; // needed for url
            Object.keys(search).forEach((key) => {
                console.log(`\n-> ${manga_title}\n`);
                const chapters = search[key]; // chapter info
                Object.values(chapters).forEach((chapter) => {
                    const chapter_num = chapter.chap ? parseInt(chapter.chap, 10) : 'Unknown'; // chapter number 
                    const chapter_title = chapter.title ? chapter.title : 'No Title'; // chapter title
                    const chapter_hid = chapter.hid ? chapter.hid : false; // needed for url
                    const url = chapter_hid ? `https://comick.io/comic/${manga_slug}/${chapter_hid}` : `No URL`; // e.g. https://comick.io/comic/00-sousou-no-frieren/8Qv95pQa-chapter-140-en
                    console.log(`> ${chapter_title} - ${chapter_num} - ${url}`);
                });
            });
        });
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);        
    }
}

export { fetchComickMangas, fetchComickChapters, logComick };

/*
    HOX!!!!!!
    RESPONSES FROM COMICK API MOST LIKELY NOT ACTUALLY ORDERED IN ANY WAY

    Comick API results (manga):
    
    -array of objects
    [
        {
            id: num,
            hid: string,
            slug: string, (e.g. "00-sousou-no-frieren" - needed for url)
            title: string,
            country: string,
            rating: string,
            bayesian_rating: string,
            rating_count: num,
            follow_count: num,
            desc: string,
            status: num,
            last_chapter: num,
            translation_completed: boolean,
            view_count: num,
            content_rating: string,
            demographic: num,
            uploaded_at: string,
            genres: [num, num, etc...],
            created_at: string,
            user_follow_count: num,
            year: num,
            mu_comics: { year: num },
            is_english_title: boolean?,
            md_titles: [ {title: string}, {title: string}, etc... ],
            md_covers: [ { w: num, h: num, b2key: string }, etc? ],
            highlight: string
        }, 
        {...},
    ]

    Comick API (chapter):
    
    -object of properties
    {
        chapters: 
        [
            { 
                id: num,
                chap: string,
                title: string,
                vol: string,
                lang: string,
                created_at: string,
                updated_at: string,
                up_count: num,
                down_count: num,
                is_the_last_chapter: boolean,
                publish_at: string,
                group_name: [ Array??? ], 
                hid: string, <-- distinct from manga hid
                identities: [ Object??? ],
                md_chapters_groups: [ Array??? ]
            },
            {...},
        ]
        total: num,
        checkVol2Chap1: boolean, <-- ???
        limit: num
    }
*/