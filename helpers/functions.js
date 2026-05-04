import { rl } from '../main.js'
import { logErrorDetails } from './errorLogger.js';
import { mangaOrderTypes, chapterOrderTypes } from './export.js';

async function takeUserInput (useWhole, useString, skipClear) {
    // 1. function takes input from user,
    // 2. removes leading and trailing whitespaces from input
    // 3. checks if input includes only numbers
    // 4.1. if (input had only numbers) return Number(input) || return parseInt(input)
    // 4.2. else return input.toLowerCase()
    let userInput = (await rl.question('\n  Input: ')).trim(); // get user input
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
    console.log(`\n\n  Manga fetch size: ${options.limit_manga}`);
    console.log(`  Manga order: ${options.mangaOrderType} (${mangaOrderTypes[options.mangaOrderType][options.mangaOrderDirection]})`);
    console.log(`  Chapter fetch type: ${options.fetchAllChapters ? 'all' : 'custom'}`);
    if (!options.fetchAllChapters) {
        console.log(`  Chapter fetch size: ${options.limit_chapter}`); 
        console.log(`  Chapter order: ${options.chapterOrderType} (${chapterOrderTypes[options.chapterOrderType][options.chapterOrderDirection]})`);
        console.log(`  Chapter offset: ${options.offset_chapter}`);
    }
    console.log(`  Chapter languages: ${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}`);
    console.log(`  Content ratings: ${options.contentRating[0] === undefined ? 'default' : options.contentRating}\n`);
}

function menuFetchFiltersDisplay (lists, key) {
    // display current filters
    let selectionFound = false;
    lists?.forEach((type, type_index) => { // anime/manga
        if (type_index === 0) {
            console.log('\n\n  Current selection:\n');
        }
        type.forEach(status => { // status
            status.forEach(entry => { // entry
                if (entry[key]) { // key is set to true
                    console.log(` - ${entry.node.title} (${entry.list_status.status})`);
                    selectionFound = true;
                }
            });
        });
        if (type_index === lists.length-1) {
            if (!selectionFound) console.log('  - No titles selected');
            console.log();
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

function isValidLangCode (input) {
    return /^[a-z]{2}(-[a-z]{2})?$/i.test(input);
}

function escapeRegex (input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 

function printMenuOptions (header = null, optionsArray = [], { pageDetails = null, printExit = true, printHeader = true } = {}) {
    // creates a simple menu in a standardized format
    // header = string
    // optionsArray = array of arrays (expect skipLine, separatorLine, pageFooter)
    // { pageDetails = object, printExit = boolean, printHeader = boolean }
    
    const emptyLine = '_',     // console.log()
          separatorLine = '-', // console.log('  --------------------')
          pageFooter = 'p';    // logs 'Page: currentPage / lastPage'
    
    let i = 0;

    try {
        // header
        if (printHeader) console.log(`\n\n  ${header}\n`);

        // format options
        const formattedOptions = optionsArray.map((val) => {
            if (Array.isArray(val) && val.length === 1) {
                return [i++, '->', val[0]];
            } else if (Array.isArray(val) && val.length === 2) {
                return [val[0], '->', val[1]];
            } else if (Array.isArray(val) && val.length === 3) {
                return [val[0], val[1], val[2]];
            }
            return val;
        });

        // printing options
        for (const arr of formattedOptions) {
            if (arr === emptyLine) {
                console.log();
            } else if (arr === separatorLine) {
                console.log('  ' + '\u2500'.repeat(20));
            } else if (arr === pageFooter) {
                if (pageDetails) {
                    const pageProgressString = `${pageDetails.currentPageIndex + 1} / ${pageDetails.lastPageIndex + 1}`.padStart(9, ' ');
                    const label = 'Page: '.padEnd(10, ' ');
                    console.log('  ' + '\u2500'.repeat(20) + `\n\n  ${label} ${pageProgressString}\n`);
                }
            } else if (arr !== null) {
                // format menuOption
                const emptyString = '';
                const key = arr[0] ?? emptyString;
                const firstGap = key === emptyString ? emptyString : ' ';
                const separator = arr[1] ?? emptyString;
                const val = arr[2] ?? emptyString;
                const secondGap = val === emptyString ? emptyString : ' ';
                // print menuOption
                console.log(`  ${key}${firstGap}${separator}${secondGap}${val}`);
            }
        } 

        // end of print
        if (printExit) console.log('  e -> Go back\n');
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
    isValidLangCode,
    escapeRegex,
    printMenuOptions
};