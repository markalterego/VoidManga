import { rl } from '../main.js'
import { animeStatus, mangaStatus, mangaOrderTypes, chapterOrderTypes } from './export.js';

async function takeUserInput() {
    // 1. function takes input from user,
    // 2. removes leading and trailing whitespaces from input
    // 3. checks if input includes only numbers
    // 4.1. if (input had only numbers) return parseInt(input)
    // 4.2. else return input.toLowerCase()
    let userInput = (await rl.question('\n|| Input: ')).trim(); // get user input
    const isNumber = userInput.split(/\s+/).every(str => !isNaN(str)); // check for numbers
    if (isNumber) userInput = parseInt(userInput, 10); // convert userinput to int
    else userInput = userInput.toLowerCase(); // convert userinput to lowercase
    await clearScreen(); // clear console window
    return userInput;
} 

async function clearScreen() {
    // ANSI for full terminal reset (using in place of cls [this actually works])
    process.stdout.write('\x1Bc'); 
}

async function customFetchMangadexDisplay (options) {
    console.log(`\n||\n|| Manga fetch size: ${options.limit_manga}`);
    console.log(`|| Manga order: ${options.mangaOrderType} (${mangaOrderTypes[options.mangaOrderType][options.mangaOrderDirection]})`);
    console.log(`|| Chapter fetch size: ${options.limit_chapter}`); 
    console.log(`|| Chapter order: ${options.chapterOrderType} (${chapterOrderTypes[options.chapterOrderType][options.chapterOrderDirection]})`);
    console.log(`|| Chapter offset: ${options.offset_chapter}`);
    console.log(`|| Chapter languages: ${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}`);
    console.log(`|| Content ratings: ${options.contentRating[0] === undefined ? 'default' : options.contentRating}\n||`);
}

async function menuLogMALDisplay (anime, manga) {
    console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
    console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
}

async function menuFetchFiltersDisplay (lists, key) {
    // display current filters
    let selectionFound = false;
    lists.forEach((type, type_index) => { // anime/manga
        if (type_index === 0) {
            console.log('\n||\n|| Current selection:\n||');
        }
        type.forEach(status => { // status
            status.forEach(entry => { // entry
                if (entry[key]) { // key is set to true
                    console.log(`|| - ${entry.node.title} (${entry.list_status.status})`);
                    selectionFound = true;
                }
            });
        });
        if (type_index === lists.length-1) {
            if (!selectionFound) console.log('|| - No titles selected');
            console.log('||');
        }
    });
}

export { takeUserInput, clearScreen, customFetchMangadexDisplay, menuLogMALDisplay, menuFetchFiltersDisplay };