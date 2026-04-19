import { rl } from '../main.js'
import { logErrorDetails } from './errorLogger.js';
import { mangaOrderTypes, chapterOrderTypes } from './export.js';

async function takeUserInput (useWhole, useString, skipClear) {
    // 1. function takes input from user,
    // 2. removes leading and trailing whitespaces from input
    // 3. checks if input includes only numbers
    // 4.1. if (input had only numbers) return Number(input) || return parseInt(input)
    // 4.2. else return input.toLowerCase()
    let userInput = (await rl.question('\n|| Input: ')).trim(); // get user input
    const isNumber = userInput.split(/\s+/).every(str => !isNaN(str)); // check for numbers
    if (!useString && isNumber && userInput.length > 0) { // convert userinput to num
        userInput = Number(userInput);
        if (useWhole) { // whole numbers
            if (userInput % 1 === 0) userInput = parseInt(userInput);
            else userInput = undefined;
        } 
    } else {
        if (userInput.length > 0) userInput = userInput.toLowerCase(); // convert userinput to lowercase
        else userInput = undefined;
    }
    if (!skipClear) clearScreen(); // clear console window
    return userInput;
} 

function clearScreen() {
    // ANSI for full terminal reset (using in place of cls [this actually works])
    process.stdout.write('\x1Bc'); 
}

function customFetchMangadexDisplay (options) {
    console.log(`\n||\n|| Manga fetch size: ${options.limit_manga}`);
    console.log(`|| Manga order: ${options.mangaOrderType} (${mangaOrderTypes[options.mangaOrderType][options.mangaOrderDirection]})`);
    console.log(`|| Chapter fetch type: ${options.fetchAllChapters ? 'all' : 'custom'}`);
    if (!options.fetchAllChapters) {
        console.log(`|| Chapter fetch size: ${options.limit_chapter}`); 
        console.log(`|| Chapter order: ${options.chapterOrderType} (${chapterOrderTypes[options.chapterOrderType][options.chapterOrderDirection]})`);
        console.log(`|| Chapter offset: ${options.offset_chapter}`);
    }
    console.log(`|| Chapter languages: ${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}`);
    console.log(`|| Content ratings: ${options.contentRating[0] === undefined ? 'default' : options.contentRating}\n||`);
}

function menuFetchFiltersDisplay (lists, key) {
    // display current filters
    let selectionFound = false;
    lists?.forEach((type, type_index) => { // anime/manga
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

function capitalFirstLetterString (string) {
    return string.at(0).toUpperCase() + string.slice(1);
}

function longStringToArray (string, maxLengthOfElement) {
    let arr = [];
    // special/whitespace replaced by single space
    // two or more spaces replaced by single space
    const formattedString = string.replace(/\s/g, ' ').replace(/ {2,}/g, ' '); 
    for (let i = 0; i < formattedString.length; i += maxLengthOfElement) {
        arr.push(formattedString.slice(i, i + maxLengthOfElement).trim());
    }
    return arr;
}

function truncateString (string, maxLengthOfString) {
    return string.length > maxLengthOfString ? `${string.slice(0, maxLengthOfString).trim()}...`: string;
}

function printMenuOptions (header, optionsArray, specialOptionsArray, pageDetails) {
    // creates a simple menu in a standardized format
    // header = string
    // optionsArray = array of strings
    // specialOptionsArray = array of objects

    const skipLine = '_',      // console.log('||') 
          emptyLine = '',      // console.log()
          separatorLine = '-', // console.log('|| --------------------')
          pageFooter = 'p';    // logs 'Page: currentPage / lastPage'
    
    try {
        // handle invalid parameters
        if (!header) {
            throw new Error ('Failed to log menu. Header is not defined.');
        } else if (!optionsArray && !specialOptionsArray) {
            throw new Error ('Failed to log menu. Neither optionsArray nor specialOptionsArray are defined.');
        } 
        
        // header
        console.log(`\n||\n|| ${header}\n||`);

        // mapping optionsArray        as { 'index': val } 
        //         specialOptionsArray as { 'special': val }
        const allOptions = [
            ...(optionsArray?.map(val => ({ type: 'index', val })) ?? []),
            ...(specialOptionsArray?.map(val => ({ type: 'special', val })) ?? [])
        ];

        // indicates selectable option for 'index' type options
        let selectableIndex = 0;

        // printing allOptions
        for (const { type, val } of allOptions) {
            if (val === skipLine) {
                console.log('||');
            } else if (val === emptyLine) {
                console.log();
            } else if (val === separatorLine) {
                console.log('|| --------------------');
            } else if (val === pageFooter) {
                if (pageDetails) {
                    const pageProgressString = `${pageDetails.currentPageIndex + 1} / ${pageDetails.lastPageIndex + 1}`.padStart(9, ' ');
                    const label = 'Page: '.padEnd(10, ' ');
                    console.log(`|| --------------------\n||\n|| ${label} ${pageProgressString}\n||`);
                }
            } else if (val !== null) {
                if (type === 'index') { 
                    // optionsArray printed as "0 -> MyAnimeList"
                    console.log(`|| ${selectableIndex++} -> ${val.trim()}`);
                } else { 
                    // specialOptionsArray printed as "s -> Settings"
                    const [[key, label]] = Object.entries(val);
                    console.log(`|| ${key} -> ${label}`);
                }
            }
        } 

        // end of print
        console.log('|| e -> Go back\n||');
    } catch (error) {
        logErrorDetails(error);
    }
}

export { 
    takeUserInput, 
    clearScreen, 
    customFetchMangadexDisplay, 
    menuFetchFiltersDisplay,
    capitalFirstLetterString, 
    longStringToArray,
    truncateString,
    printMenuOptions
};