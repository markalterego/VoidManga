import { rl } from '../main.js'
import { logErrorDetails } from './errorLogger.js';
import { mangaOrderTypes, chapterOrderTypes, SYM, MESSAGE } from './export.js';
import open from 'open';

async function takeUserInput (useWhole = false, forceString = false, { useMixedCase = false, useUpperCase = false } = {}, skipClear = false) {
    //
    // Default behaviour (no params):
    //   - number input ... return as number e.g. '123' -> 123
    //   - string input ... return as lowercase e.g. 'Hello' -> 'hello'
    //   - empty input  ... return as undefined
    //
    // 1. if input includes only numbers
    //    - !useWhole                         ... return as whole/decimal number
    //    - useWhole AND !input.includes('.') ... return as whole number
    // 2. if input is a string (or forceString is forcing string handling)
    //    - useMixedCase                      ... return string as is
    //    - !useMixedCase && useUpperCase     ... return string converted to upper case letters 
    //    - !useMixedCase                     ... return string converted to lower case letters
    // 3. all checks fail, return undefined
    //
    let userInput = (await rl.question('\n  Input: ')).trim(); // get user input
    const isNumber = userInput.split(/\s+/) // split by whitespace char e.g. 'hello 123' = ['hello', '123']
                              .every(str => str !== '' && Number.isFinite(Number(str))); // check for numbers
    if (isNumber && !forceString) { // number input AND is not forcing string input
        if (useWhole) {
            userInput = userInput.includes('.') ? undefined : parseInt(userInput);
        } else {
            userInput = Number(userInput);
        }
    } else if (userInput.length) { // string input longer than 0
        if (!useMixedCase) {
            userInput = useUpperCase ? userInput.toUpperCase() : userInput.toLowerCase();
        }
    } else { // not valid user input
        userInput = undefined;
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
    const entries = lists.flat(2);
    const selectedTitles = entries.filter(entry => entry[key]);
    const titles = selectedTitles.length 
        ? selectedTitles.map(entry => ['-', entry.node.title, `(${entry.list_status.status})`])
        : [['-', 'No titles', 'selected']]
    const optionsArray = [
        ['', '\n\n  Current selection', '\n'],
        ...titles,
    ];
    printMenuOptions(
        null,
        optionsArray,
        { printHeader: false, printExit: false }
    );
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

function isISODate (str) {
    // e.g. 2018-07-09T14:59:44+00:00
    return /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}T[0-9]{2}\:[0-9]{2}\:[0-9]{2}\+[0-9]{2}\:[0-9]{2}$/.test(str);
}

function isMatchingAtStart (matchWith, matchTo) {
    // \b matches at the start of each word, i for case insensitive
    return new RegExp(`\\b${escapeRegex(matchWith)}`, 'i').test(matchTo);
}

function formatDate (DATE) {
    const date = new Date(DATE);
    const yyyy = date.getFullYear(); 
    const mm   = String(date.getMonth()).padStart(2, '0');
    const dd   = String(date.getDay()).padStart(2, '0');
    const hh   = String(date.getHours()).padStart(2, '0');
    const min  = String(date.getMinutes()).padStart(2, '0');
    const ss   = String(date.getSeconds()).padStart(2, '0');
    // e.g. `2026-04-02 06:42:54  m:44   c:1186`
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function openURLInBrowser (url, label = '', logURL = true) {
    if (!url) return MESSAGE.print(MESSAGE.URL_NOT_FOUND);
    const target = label ? `${label} ${SYM.POINTS_TO} ${url}` : url;
    if (logURL) MESSAGE.print(`Opening ${target}`);
    await open(url);
}

function printMenuOptions (header = null, optionsArray = [], { pageDetails = null, printExit = true, printHeader = true } = {}) {
    // creates a simple menu in a standardized format
    // header = string
    // optionsArray = array of arrays (expect skipLine, separatorLine, pageFooter)
    // { pageDetails = object, printExit = boolean, printHeader = boolean }
    const { BORDER_H, POINTS_TO } = SYM;
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
                return [i++, POINTS_TO, val[0]];
            } else if (Array.isArray(val) && val.length === 2) {
                return [val[0], POINTS_TO, val[1]];
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
                console.log('  ' + BORDER_H.repeat(20));
            } else if (arr === pageFooter) {
                if (pageDetails) {
                    const pageProgressString = `${pageDetails.currentPageIndex + 1} / ${pageDetails.lastPageIndex + 1}`.padStart(9, ' ');
                    const label = 'Page: '.padEnd(10, ' ');
                    console.log('\n  ' + BORDER_H.repeat(20) + `\n\n  ${label} ${pageProgressString}`);
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
        if (printExit) console.log(`  e ${POINTS_TO} Go back\n`);
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
    isISODate,
    isMatchingAtStart,
    formatDate,
    openURLInBrowser,
    printMenuOptions
};