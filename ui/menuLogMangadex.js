import open from 'open';
import { takeUserInput, menuLogMangadexDisplay } from '../helpers/functions.js';

// TODO:
// - make it possible to LOG chapters from range. Make sure the user only 
//   has to provide a lower and upper limit and everything else is handled
//   automatically 

async function menuLogMangadex (mangadexData, lists) {
    const SELECTMANGA = 0, OPENCHAPTERS = 1;
    let m = 0;

    while (m !== 'e') 
    {
        // display selected manga
        await menuLogMangadexDisplay(mangadexData);

        console.log('\n||\n|| Log Mangadex:\n||');
        console.log('|| 0 -> Traverse Mangas');
        console.log('|| 1 -> Open chapters in browser');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === SELECTMANGA) {
            await traverseMangas(mangadexData);
        } else if (m === OPENCHAPTERS) { // open chapters in in browser
            await openChaptersInBrowserMenu(mangadexData);
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }   
    }    
}

async function traverseMangas (mangadexData) { 
    let m = 0;

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
    const LOGDATA = 0, TRAVERSECHAPTERS = 1;
    let m = 0;

    while (m !== 'e') 
    {
        // console.log(`${selectedManga}`);
        const title = Object.values(selectedManga.manga.attributes.title)[0]; // first title of titles
        console.log(`\n||\n|| Select an option for ${title}\n||`);
        console.log('|| 0 -> Log manga data');
        console.log('|| 1 -> Traverse chapters');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === LOGDATA) {
            // <-- log manga data
        } else if (m === TRAVERSECHAPTERS) { 
            await traverseChapters(selectedManga); 
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }
    }
}

async function traverseChapters (selectedManga) {

}

async function chapterOptionsMenu (selectedChapter) {

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