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
    console.log(`\n||\n|| MAL_list: ${options.MAL_list === null ? options.MAL_list : (!options.MAL_list ? 'anime' : 'manga')}`);
    console.log(`|| MAL_status: ${options.MAL_status === null ? options.MAL_status : (options.MAL_list === null ? options.MAL_status : (!options.MAL_list ? animeStatus[options.MAL_status] : mangaStatus[options.MAL_status]))}`);
    console.log(`|| limit_manga: ${options.limit_manga}`);
    console.log(`|| limit_chapter: ${options.limit_chapter}`);
    console.log(`|| mangaOrderType: ${options.mangaOrderType}`);
    console.log(`|| chapterOrderType: ${options.chapterOrderType}`);
    console.log(`|| mangaOrderDirection: ${options.mangaOrderDirection}`);
    console.log(`|| chapterOrderDirection: ${options.chapterOrderDirection}`);
    console.log(`|| contentRating: [${options.contentRating[0] === undefined ? 'default' : options.contentRating}]`);
    console.log(`|| chapterTranslatedLanguage: [${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}]\n||`);
}

export { takeUserInput, clearScreen, customFetchMangadexDisplay };