import open from 'open';
import { takeUserInput, menuLogMangadexDisplay } from '../helpers/functions.js';

// TODO:
// - make it possible to LOG chapters from range. Make sure the user only 
//   has to provide a lower and upper limit and everything else is handled
//   automatically 

let lists = null; // MAL lists

async function menuLogMangadex (mangadexData, l) {
    let m = 0; lists = l; // referring to MAL lists
    
    while (m !== 'e') 
    {
        // display selected manga
        await menuLogMangadexDisplay(mangadexData, true); // true for indexed list

        console.log('\n||\n|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m >= 0 && m < mangadexData.length) {
            await mangaOptionsMenu(mangadexData[m]); // input selected manga
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }
    }    
}

async function mangaOptionsMenu (selectedManga) {
    const LOGDATA = 0, MALPROGRESS = 1, TRAVERSECHAPTERS = 2, FINDCHAPTEROFMANGA = 3;
    let m = 0;

    while (m !== 'e') 
    {
        // console.log(`${selectedManga}`);
        const title = Object.values(selectedManga.manga.attributes.title)[0]; // first title of titles
        console.log(`\n||\n|| Select an option for ${title}\n||`);
        console.log('|| 0 -> Log manga data');
        console.log('|| 1 -> Log MAL progress');
        console.log('|| 2 -> Traverse chapters');
        console.log('|| 3 -> Search for chapter');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === LOGDATA) {
            await logMangaData(selectedManga.manga);
        } else if (m === MALPROGRESS) { 
            await logSeriesProgress(selectedManga.manga);
        } else if (m === TRAVERSECHAPTERS) { 
            await traverseChapters(title, selectedManga.chapters); 
        } else if (m === FINDCHAPTEROFMANGA) { 
            await findChapterOfManga(title, selectedManga);
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }
    }
}

async function logMangaData (manga) {
    // <-- either do a menu here from which you can choose
    //     what data to log from selectedManga or simply
    //     log data that the user might be interested in 
    //     in regards to the manga
    console.log(); console.dir(manga, { depth: null });
}

async function traverseChapters (mangaTitle, chapters) {
    let m = 0, index = 0;

    while (m !== 'e') 
    {
        // attributes.links.mal
        console.log(`\n||\n|| ${mangaTitle}:\n||`);
        for (const chapter of chapters) {
            const chapterTitle = chapter.attributes.title ? chapter.attributes.title : 'No Title'; // title
            const chNum = chapter.attributes.chapter !== null ? chapter.attributes.chapter : -1; // chapter number
            const transLang = chapter.attributes.translatedLanguage ? chapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
            console.log(`|| ${index++} -> ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${chapterTitle} (${transLang})`);
            if (index === chapters.length) console.log('||');
        }
        const highestSelectableIndex = index - 1; index = 0; 
        console.log('\n||\n|| e -> Go back\n||');

        m = await takeUserInput(); // get user input 

        // handle user input
        if (m >= 0 && m <= highestSelectableIndex) { 
            await chapterOptionsMenu(chapters[m]); 
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function logSeriesProgress (manga) {
    const foundManga = lists[1] // manga list
                       .flatMap(status => status) // combines all entries from all statuses to one arr
                       .find(entry => entry.node.id === parseInt(manga.attributes.links?.mal)); // return first entry where id is the same
    if (!foundManga) {
        console.log('\n||\n|| Given manga was not found\n||');
    } else {
        console.log(`\n||\n|| Chapters read: ${foundManga.list_status.num_chapters_read} / ${foundManga.node.num_chapters}\n||`);
    }
}

async function findChapterOfManga (title, selectedManga) {
    const NEXTUNREADCHAPTER = 0, LOWESTCHAPTER = 1, HIGHESTCHAPTER = 2, SPECIFICCHAPTER = 3; 
    let m = 0; 

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Search ${title}\n||`);
        console.log('|| 0 -> Next un-read chapter');
        console.log('|| 1 -> Lowest chapter number');
        console.log('|| 2 -> Highest chapter number');
        console.log('|| 3 -> Specific chapter number');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput();
        
        if (m === NEXTUNREADCHAPTER) {
            const foundChapter = await findNextUnreadChapter(selectedManga);
            if (foundChapter) await chapterOptionsMenu(foundChapter);
        } else if (m === LOWESTCHAPTER) {
            const foundChapter = await findLowestChapterNumber(selectedManga.chapters);
            if (foundChapter) await chapterOptionsMenu(foundChapter);
        } else if (m === HIGHESTCHAPTER) {
            const foundChapter = await findHighestChapterNumber(selectedManga.chapters);
            if (foundChapter) await chapterOptionsMenu(foundChapter);
        } else if (m === SPECIFICCHAPTER) {
            await findChapterByChapterNumber(selectedManga.chapters);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function findNextUnreadChapter (selectedManga) {
    const mangaEntry = lists[1]
                       .flatMap(status => status) // flatten all manga statuses to one arr
                       .find(entry => entry.node.id === parseInt(selectedManga.manga.attributes.links?.mal)); // try to find matching id
    if (!mangaEntry) {
        console.log('\n||\n|| Given manga was not found\n||');
    } else {
        const nextUnreadChapterNumber = mangaEntry.list_status.num_chapters_read + 1; // num_chapters_read + 1
        const foundChapter = selectedManga.chapters.find(chapter => parseInt(chapter.attributes.chapter) === nextUnreadChapterNumber); // trying to find chapter
        if (!foundChapter) {
            console.log('\n||\n|| Given chapter was not found\n||');
        } else {
            return foundChapter;
        }
    }
}

async function findLowestChapterNumber (chapters) {
    const lowestChapterNumber = Math.min(...chapters.map(chapter => parseInt(chapter.attributes.chapter)));
    const foundChapter = chapters.find(chapter => parseInt(chapter.attributes.chapter) === lowestChapterNumber);
    if (!foundChapter) {
        console.log('\n||\n|| Given chapter was not found\n||')
    } else {
        return foundChapter;
    }   
}

async function findHighestChapterNumber (chapters) {
    const highestChapterNumber = Math.max(...chapters.map(chapter => parseInt(chapter.attributes.chapter)));
    const foundChapter = chapters.find(chapter => parseInt(chapter.attributes.chapter) === highestChapterNumber);
    if (!foundChapter) {
        console.log('\n||\n|| Given chapter was not found\n||')
    } else {
        return foundChapter;
    }
}

async function findChapterByChapterNumber (chapters) {
    let m = 0;

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Input a chapter number:\n||`);
        console.log('|| e -> Go back\n||');

        m = await takeUserInput();
        
        if (m >= 0) {
            const foundChapter = chapters.find(chapter => parseInt(chapter.attributes.chapter) === m); // trying to find given chapter number
            if (!foundChapter) {
                console.log('\n||\n|| Given chapter was not found\n||');
            } else {
                await chapterOptionsMenu(foundChapter);
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function chapterOptionsMenu (selectedChapter) {
    const LOGDATA = 0, OPENINBROWSER = 1;
    let m = 0;

    while (m !== 'e') 
    {
        const chapterTitle = selectedChapter.attributes.title ? selectedChapter.attributes.title : 'No Title'; // title
        const chNum = selectedChapter.attributes.chapter !== null ? selectedChapter.attributes.chapter : -1; // chapter number
        const transLang = selectedChapter.attributes.translatedLanguage ? selectedChapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
        console.log(`\n||\n|| ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${chapterTitle} (${transLang}):\n||`);
        console.log('|| 0 -> Log chapter data');
        console.log('|| 1 -> Open chapter in browser');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === LOGDATA) {
            await logChapterData(selectedChapter);
        } else if (m === OPENINBROWSER) {
            await open(selectedChapter.link); 
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function logChapterData (chapter) {
    // <-- either do a menu here from which you can choose
    //     what data to log from chapter or simply
    //     log data that the user might be interested in 
    //     in regards to the chapter
    console.log(); console.dir(chapter, { depth: null });
}

async function openChaptersInBrowserMenu (fetchResults) {
    let m = null;
    // console.dir(fetchResults, {depth: null});

    // TODO:
    // - consider formatting stuff earlier in code e.g. separate formatting function
    //   for taking first mangatitle's etc.etc.....

    while (m !== 'e') {   
        console.log('\n||\n|| Open chapter in browser:');
        let searchIndex = 0, selectableIndex = 0; // used for formatting
        for (const search of fetchResults) {
            const manga = search.manga;
            const mangaTitle = Object.values(manga.attributes.title)[0]; // first title of titles
            console.log(`||\n|| ${mangaTitle}:\n||`);
            for (const chapter of search.chapters) {
                const title = chapter.attributes.title ? chapter.attributes.title : 'No Title'; // title
                const chNum = chapter.attributes.chapter !== null ? chapter.attributes.chapter : -1; // chapter number
                const transLang = chapter.attributes.translatedLanguage ? chapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
                console.log(`|| ${selectableIndex++} -> ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${title} (${transLang})`);
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

export { menuLogMangadex };