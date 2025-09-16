import { rl } from '../main.js'

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
    // <-- consider adding clearScreen here and removing it from the rest of the program
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

async function customFetchComickDisplay (options) {
    console.log(`\n||\n|| limit_manga: ${options.limit_manga}`);
    console.log(`|| limit_chapter: ${options.limit_chapter}`);
    console.log(`|| chapterOrderDirection: ${options.chapterOrderDirection}`);
    console.log(`|| chapterTranslatedLanguage: ${options.chapterTranslatedLanguage}`);
    console.log(`|| chapterNumber: ${options.chapterNumber}\n||`);
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

export { takeUserInput, clearScreen, customFetchMangadexDisplay, customFetchComickDisplay, menuFetchFiltersDisplay };