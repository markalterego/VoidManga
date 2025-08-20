import axios from 'axios';
import { setTimeout } from "timers/promises";

async function testFetching() {
    console.log('\n>> Fetching... >>');
    await fetchLocalServer('frieren');
    // await fetchComickAPI();
    // await fetchMangaUpdatesAPI();
}

// comick api through middleware
async function fetchLocalServer(search) { 
    try {
        const startTime = performance.now(); // starting timing fetch

        // hox! manga endpoint can't order mangas serverside
        const resManga = await axios.get('http://localhost:3000/manga', {
            params: {
                'q': search, // search
                // limit: 5 <-- doesn't seem to work
            }
        });
        const mangaData = resManga.data; // relevant data from fetch
        const manga_slug = mangaData[0].slug; // needed for url
        const manga_title = mangaData[0].title; // title
        const manga_hid = mangaData[0].hid; // can be used to poll chapters of manga
        
        // wouldn't recommend using as serverside ordering is slow
        // chap-order=0/1 - desc/asc - (0/desc as default value)

        const resChapter = await axios.get('http://localhost:3000/chapter', {
            params: {
                id: manga_hid, // hid of manga endpoint fetch
                limit: 10, // limit response size
                lang: 'en', // translated language
            }
        });
        const chapterData = resChapter.data.chapters; // relevant data from fetch
        
        let last_chapter_num = -1; // used for skipping duplicate chapters

        console.log(`\n-> ${manga_title}\n`);
        chapterData.forEach((chapter) => {
            const chapter_num = chapter.chap ? parseInt(chapter.chap, 10) : 'Unknown'; // chapter number 
            if (last_chapter_num !== chapter_num) { // logging once per chapter num
                last_chapter_num = chapter_num; // setting next skippable num
                const chapter_title = chapter.title ? chapter.title : 'No Title'; // chapter title
                const chapter_hid = chapter.hid ? chapter.hid : false; // needed for url
                const url = chapter_hid ? `https://comick.io/comic/${manga_slug}/${chapter_hid}` : `No URL`; // e.g. https://comick.io/comic/00-sousou-no-frieren/8Qv95pQa-chapter-140-en
                console.log(`> ${chapter_title} - ${chapter_num} - ${url}`);
            } 
        });
        
        const fetchTimeTaken = Math.round(performance.now()-startTime); // time it took to fetch
        console.log(`\n> ${fetchTimeTaken}ms`); // logging time taken by fetch
    } catch (error) {
        // console.log(error);
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.code}\n||`);
        } else {
            if (error.code!=='ECONNREFUSED') {
                console.error(`\n||\n|| Error: ${error.message}\n||`);
            } else {
                console.error(`\n||\n|| Error: Server most likely not running\n||`);
            }
        }
    }
}

async function fetchMangaUpdatesAPI() {
    try {
        const startTime = performance.now(); // starting timing fetch
        const response = await axios.post('https://api.mangaupdates.com/v1/series/search', {
            search: 'frieren',
            stype: 'title',
        },
        {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        console.log(response.data);
        const fetchTimeTaken = Math.round(performance.now()-startTime); // time it took to fetch

        const resultArr = response.data.results; // saving results to array
        resultArr.forEach((value) => {
            let recordsKeys = [], metadataKeys = [];
            let records = [], metadata = [];
            for (const key in value.record) {
                if (typeof value.record[key] === 'object') {
                    for (const key2 in value.record[key]) {
                        if (typeof value.record[key][key2] === 'object') {
                            for (const key3 in value.record[key][key2]) {
                                recordsKeys.push(key3);
                                records.push(value.record[key][key2][key3]);
                            }
                        } else {
                            recordsKeys.push(key2);
                            records.push(value.record[key][key2]);
                        }
                    }
                } else {
                    recordsKeys.push(key);
                    records.push(value.record[key]);
                }
            }
            for (const key in value.metadata) {
                if (typeof value.metadata[key] === 'object') {
                    for (const key2 in value.metadata[key]) {
                        if (typeof value.metadata[key][key2] === 'object') {
                            for (const key3 in value.metadata[key][key2]) {
                                metadataKeys.push(key3);
                                records.push(value.metadata[key][key2][key3]);
                            }
                        } else {
                            metadataKeys.push(key2);
                            records.push(value.metadata[key][key2]);
                        }
                    }
                } else {
                    metadataKeys.push(key);
                    records.push(value.metadata[key]);
                }
            }
            console.log(`\n${value.hit_title}:\n`);
            records.forEach((value,index) => console.log(`> ${recordsKeys[index]} - ${value}`));
            metadata.forEach((value,index) => console.log(`> ${metadataKeys[index]} - ${value}`));
        });

        console.log(`\n> ${fetchTimeTaken}ms`); // logging time taken by fetch
        if (fetchTimeTaken < 200) await setTimeout(200-fetchTimeTaken); // avoiding fetching too often
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { testFetching };

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