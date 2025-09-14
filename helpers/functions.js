import { rl } from '../main.js'
import { animeStatus, mangaStatus } from './export.js';

async function takeUserInput() {
    let userInput = await rl.question('\n|| Input: '); // get user input
    if (userInput.toLowerCase() !== 'e' && userInput.toLowerCase() !== 'c' && userInput.toLowerCase() !== 's') userInput = parseInt(userInput, 10); // convert userinput to int
    else userInput = userInput.toLowerCase(); // convert userinput to lowercase
    return userInput;
} 

async function clearScreen() {
    // ANSI for full terminal reset (using in place of cls [this actually works])
    process.stdout.write('\x1Bc'); 
}

async function customFetchMangadexDisplay (options) {
    console.log(`\n||\n|| limit_manga: ${options.limit_manga}`);
    console.log(`|| limit_chapter: ${options.limit_chapter}`);
    console.log(`|| mangaOrderType: ${options.mangaOrderType}`);
    console.log(`|| chapterOrderType: ${options.chapterOrderType}`);
    console.log(`|| mangaOrderDirection: ${options.mangaOrderDirection}`);
    console.log(`|| chapterOrderDirection: ${options.chapterOrderDirection}`);
    console.log(`|| contentRating: [${options.contentRating[0] === undefined ? 'default' : options.contentRating}]`);
    console.log(`|| chapterTranslatedLanguage: [${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}]\n||`);
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

export { takeUserInput, clearScreen, customFetchMangadexDisplay, menuFetchFiltersDisplay };