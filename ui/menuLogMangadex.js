import open from 'open';
import { takeUserInput, menuLogMangadexMangaDisplay, menuLogMangadexChapterDisplay, capitalFirstLetterString, longStringToArray } from '../helpers/functions.js';
import { updateEntryMenu } from './menuMAL.js';

// TODO:
// - maybe save stuff like 'currentPage' to config as e.g. 'currentPageManga'
// - make it possible to LOG chapters from range. Make sure the user only 
//   has to provide a lower and upper limit and everything else is handled
//   automatically 

let lists = null; // MAL lists
let options = null; // config.logMangadexOptions

async function menuLogMangadex (mangadexData, l, config) {
    let m = null, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }, sortedMangas; 
    options = config.logMangadexOptions, lists = l; 

    // TODO: 
    // - if manga is found on the user's MAL lists, appends e.g. "*reading" or similar
    //   to the end of that specific title
    // - make it so that if user inputs 'p21' the current page is set to '21' (consider
    //   making this a thing at traverseChapters as well) 

    while (m !== 'e') 
    {
        // sort/filter mangadexData + update pageDetails
        sortedMangas = m === 's' || m === 'h' || m === 'o' || m === 'f' || m === null ? sortMangas(mangadexData, pageDetails) : sortedMangas; 
        // page mangas
        let pagedMangas = pageContent(sortedMangas, pageDetails.currentPageIndex, options.enablePagingManga); 

        // display selecable manga(s)
        menuLogMangadexMangaDisplay(pagedMangas, true, options.enablePagingManga, pageDetails); // true for indexed list

        console.log(`\n||\n|| f -> Filter by mangalist [${options.filterByMangasFoundAtMangalist ? 'x' : ''}]`);
        console.log(`|| h -> Hide manga with no chapters [${options.hideZeroLengthManga ? 'x' : ''}]`);
        console.log(`|| s -> Sort ${options.logMangaDirection === 'asc' ? 'descending' : 'ascending'}`);
        console.log(`|| o -> Order ${options.sortMangasAlphabetical ? 'by chapter count' : 'alphabetical'}`);
        console.log(`|| t -> Toggle paging [${options.enablePagingManga ? 'x' : ''}]`);
        if (options.enablePagingManga) console.log('|| ± -> Next/Previous page');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // get user input - true for whole numbers
        
        if (m >= 0 && m < pagedMangas.length) {
            await mangaOptionsMenu(pagedMangas[m]); // input selected manga
        } else if (m === 'f') { // filter mangas found at user's MAL mangalist
            if (options.filterByMangasFoundAtMangalist) options.filterByMangasFoundAtMangalist = false;
            else options.filterByMangasFoundAtMangalist = true;
        } else if (m === 'h') { // toggle hide/show zero length manga
            if (options.hideZeroLengthManga) options.hideZeroLengthManga = false;
            else options.hideZeroLengthManga = true;
        } else if (m === 's') { // toggle ascending/descending
            if (options.logMangaDirection === 'asc') options.logMangaDirection = 'desc';
            else options.logMangaDirection = 'asc';
        } else if (m === 'o') { // order alphabetical/chapter count
            if (options.sortMangasAlphabetical) options.sortMangasAlphabetical = false;
            else options.sortMangasAlphabetical = true;
        }  else if (m === 't') { // toggle paging on/off
            if (options.enablePagingManga) options.enablePagingManga = false;
            else options.enablePagingManga = true;
        } else if (m === '+') { // next page
            // if next page is not out of bounds
            if (options.enablePagingManga && (sortedMangas.length / 10 > 0) && (pageDetails.currentPageIndex + 1) <= pageDetails.lastPageIndex) {
                pageDetails.currentPageIndex++; // increment currentPage
            } 
        } else if (m === '-') { // previous page
            // if previous page is not out of bounds
            if (options.enablePagingManga && (sortedMangas.length / 10 > 0) && (pageDetails.currentPageIndex - 1) >= 0) {
                pageDetails.currentPageIndex--; // decrement currentPage
            }
        } else if (m === '++') { // last page
            // navigate to last page
            if (options.enablePagingManga && (sortedMangas.length / 10 > 0) ) {
                pageDetails.currentPageIndex = pageDetails.lastPageIndex;
            }
        } else if (m === '--') { // first page
            // navigate to first page
            if (options.enablePagingManga && (sortedMangas.length / 10 > 0) ) {
                pageDetails.currentPageIndex = 0;
            }
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }
    }    
}

function sortMangas (mangadexData, pageDetails) {
    // shallow copy of mangadexData
    let sortedMangas = [...mangadexData];
    // filter by mangas found at user's mangalist
    if (options.filterByMangasFoundAtMangalist) {
        sortedMangas = sortedMangas.filter(obj => findEntryAtLists(obj.manga));
    }
    // filter mangas with no chapters
    if (options.hideZeroLengthManga) { 
        sortedMangas = sortedMangas.filter(obj => obj.chapters.length > 0);    
    } 
    // sorting methods used
    if (options.sortMangasAlphabetical) { // sort ascending (A-Z) / descending (Z-A) - alphabetical
        if (options.logMangaDirection === 'asc') { 
            sortedMangas.sort((a, b) => 
                Object.values(a.manga.attributes.title)[0]
                .localeCompare(Object.values(b.manga.attributes.title)[0])
            );
        } else { // sort descending (Z-A) / ascending (A-Z) - alphabetical
            sortedMangas.sort((a, b) => 
                Object.values(b.manga.attributes.title)[0]
                .localeCompare(Object.values(a.manga.attributes.title)[0])
            );
        }
    } else { // sort ascending (0-999) / descending (999-0) - chapters amount
        if (options.logMangaDirection === 'asc') { 
            sortedMangas.sort((a, b) => a.chapters.length - b.chapters.length); // sort ascending
        } else { 
            sortedMangas.sort((a, b) => b.chapters.length - a.chapters.length); // sort descending
        }
    }
    // update page details if necessary
    pageDetails = updatePageDetails(pageDetails, sortedMangas);
    return sortedMangas;
}

async function mangaOptionsMenu (selectedManga) {
    const LOGDATA = 0, MALPROGRESS = 1, TRAVERSECHAPTERS = 2, FINDCHAPTEROFMANGA = 3;
    let m = 0;

    while (m !== 'e') 
    {
        const title = Object.values(selectedManga.manga.attributes.title)[0]; // first title of titles
        console.log(`\n||\n|| Select an option for ${title}\n||`);
        console.log('|| 0 -> Log manga data');
        console.log('|| 1 -> Log MAL progress');
        console.log('|| 2 -> Traverse chapters');
        console.log('|| 3 -> Search for chapter');
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === LOGDATA) {
            await logDataDeepMenu(selectedManga.manga, title, true);
        } else if (m === MALPROGRESS) { 
            logSeriesProgress(selectedManga.manga);
        } else if (m === TRAVERSECHAPTERS) { 
            await traverseChapters(selectedManga); 
        } else if (m === FINDCHAPTEROFMANGA) { 
            await findChapterOfManga(title, selectedManga);
        } else if (m !== 'e') { 
            console.log('\n|| Please input a valid option');
        }
    }
}

async function traverseChapters (selectedManga) {
    const chapters = selectedManga.chapters;
    let m = 0, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 };

    while (m !== 'e') 
    {
        // reference to manga at mangalist
        const foundManga = findEntryAtLists(selectedManga.manga);
        // sort chapters by options
        let sortedChapters = sortChapters(chapters, foundManga, pageDetails);
        // page chapters
        let pagedChapters = pageContent(sortedChapters, pageDetails.currentPageIndex, options.enablePagingChapter);
        // display selectedManga chapters
        menuLogMangadexChapterDisplay(pagedChapters, foundManga, options.enablePagingChapter, pageDetails);

        console.log(`\n||\n|| s -> Sort chapters ${options.logChapterDirection === 'asc' ? 'descending' : 'ascending'}`);
        console.log(`|| h -> Hide read chapters [${options.hideReadChapters ? 'x' : ''}]`);
        console.log(`|| ? -> Input lang-code [${options.filterChapterLanguages.length ? options.filterChapterLanguages : 'no filters'}] (l to clear)`);
        console.log(`|| t -> Toggle paging [${options.enablePagingChapter ? 'x' : ''}]`);
        if (options.enablePagingChapter) console.log('|| ± -> Next/Previous page');
        console.log('|| e -> Go back\n||');
        
        m = await takeUserInput(true); // get user input 

        const isValidLangCode = /^[a-z]{2}(-[a-z]{2})?$/i.test(m); // test lang-code 

        // handle user input
        if (m >= 0 && m < pagedChapters.length) { 
            await chapterOptionsMenu(pagedChapters[m], selectedManga.manga);
        } else if (m === 's') { // toggle SORTDIRECTION = asc/desc
            if (options.logChapterDirection === 'asc') options.logChapterDirection = 'desc';
            else options.logChapterDirection = 'asc';
        } else if (m === 'h') { // toggle hide read chapters
            if (options.hideReadChapters) options.hideReadChapters = false;
            else options.hideReadChapters = true;
        } else if (m === 'l') { // clear lang-codes
            options.filterChapterLanguages = [];
        } else if (isValidLangCode) { // add lang-code
            options.filterChapterLanguages.push(m); // add lang-code
            options.filterChapterLanguages = [...new Set(options.filterChapterLanguages)]; // clear duplicates
        } else if (m === 't') { // toggle paging on/off
            if (options.enablePagingChapter) options.enablePagingChapter = false;
            else options.enablePagingChapter = true;
        } else if (m === '+') { // next page
            // if next page is not out of bounds
            if (options.enablePagingChapter && (sortedChapters.length / 10 > 0) && (pageDetails.currentPageIndex + 1) <= pageDetails.lastPageIndex) {
                pageDetails.currentPageIndex++; // increment currentPage
            } 
        } else if (m === '-') { // previous page
            // if previous page is not out of bounds
            if (options.enablePagingChapter && (sortedChapters.length / 10 > 0) && (pageDetails.currentPageIndex - 1) >= 0) {
                pageDetails.currentPageIndex--; // decrement currentPage
            }
        } else if (m === '++') { // last page
            // navigate to last page
            if (options.enablePagingChapter && (sortedChapters.length / 10 > 0)) {
                pageDetails.currentPageIndex = pageDetails.lastPageIndex;
            }
        } else if (m === '--') { // first page
            // navigate to first page
            if (options.enablePagingChapter && (sortedChapters.length / 10 > 0)) {
                pageDetails.currentPageIndex = 0;
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

function sortChapters (chapters, foundManga, pageDetails) {
    let sortedChapters = Object.values(chapters); // chapters
    // hide read chapters
    if (options.hideReadChapters && foundManga) { // don't hide if foundManga undefined
        sortedChapters = sortedChapters.filter(chapter => chapter.attributes.chapter > parseInt(foundManga.list_status.num_chapters_read)); 
    } 
    // filter by translated language 
    if (options.filterChapterLanguages.length) { 
        sortedChapters = sortedChapters.filter(chapter => options.filterChapterLanguages.includes(chapter.attributes.translatedLanguage));
    }
    // log by chapter number either 1-999 or 999-1
    const logDirection = options.logChapterDirection;
    sortedChapters = sortedChapters.sort((a, b) => {
        // sorts array based on return value
        // A and B are two "random" points of array
        // if return value > 0 -> moves A after B
        // if return value < 0 -> moves A before B
        // if return value = 0 -> keeps A and B in place

        // check if A or B is volume
        const isVolumeA = a.attributes.volume && !a.attributes.chapter;
        const isVolumeB = b.attributes.volume && !b.attributes.chapter;
        // group by A and B so that volumes come first 
        const groupA = isVolumeA ? 0 : 1; 
        const groupB = isVolumeB ? 0 : 1;
        if (groupA !== groupB) return groupA - groupB; // short-circuit

        // sort by either chNum or vlNum
        const numA = isVolumeA ? Number(a.attributes.volume) : 
                                 Number(a.attributes.chapter);
        const numB = isVolumeB ? Number(b.attributes.volume) : 
                                 Number(b.attributes.chapter);
        // log ascending or descending based on user preference
        return logDirection === 'asc' ? numA - numB : // sort ascending e.g. 1-999
                                        numB - numA ; // sort descending e.g. 999-1
    });  
    // update page details if necessary
    pageDetails = updatePageDetails(pageDetails, sortedChapters);
    return sortedChapters;
}

function updatePageDetails (pageDetails, sortedContent) {
    // calculating lastPageIndex
    pageDetails.lastPageIndex = sortedContent.length > 10 ? Math.ceil(sortedContent.length / 10) - 1 : 0;
    // checking currentPageIndex value
    const isAllowedPage = pageDetails.currentPageIndex <= pageDetails.lastPageIndex;
    // set currentPage to lastPage if not allowed
    if (!isAllowedPage) pageDetails.currentPageIndex = pageDetails.lastPageIndex;
    return pageDetails;
}

function pageContent (sortedContent, currentPage, enablePaging) {
    // page content (sortedMangas/sortedChapters)
    if (enablePaging) { 
        // page is always of 10 length, unless 
        // there's not enough items to fill it
        let startIndex = currentPage > 0 ? currentPage * 10 : 0; // 0, 10, 20
        let endIndex = startIndex + 9; // 0 -> 9, 10 -> 19, 20 -> 30
        // filter 10 mangas from sortedMangas by range of startIndex - endIndex 
        return sortedContent.filter((_, index) => {
            return index >= startIndex && index <= endIndex;
        });
    } 
    return sortedContent;
}

function logSeriesProgress (manga) {
    const foundManga = findEntryAtLists(manga);
    if (!foundManga) {
        console.log('\n||\n|| Given manga was not found\n||');
    } else {
        console.log(`\n||\n|| Chapters read: ${foundManga.list_status.num_chapters_read} / ${foundManga.node.num_chapters}\n||`);
    }
}

async function findChapterOfManga (title, selectedManga) {
    const NEXTUNREADCHAPTER = 0, LOWESTCHAPTER = 1, HIGHESTCHAPTER = 2, SPECIFICCHAPTER = 3; 
    let m = 0; 

    // TODO: 
    // - if multiple chapters found, give user the option to pick a specific one
    //   e.g. could try something like if multiple chapters found, run traverseChapters
    //   with the array of found chapters etc...

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Search ${title}\n||`);
        console.log('|| 0 -> Next un-read chapter');
        console.log('|| 1 -> Lowest chapter number');
        console.log('|| 2 -> Highest chapter number');
        console.log('|| 3 -> Specific chapter number');
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput();
        
        if (m === NEXTUNREADCHAPTER) {
            const foundChapter = findNextUnreadChapter(selectedManga);
            if (foundChapter) await chapterOptionsMenu(foundChapter, selectedManga.manga);
        } else if (m === LOWESTCHAPTER) {
            const foundChapter = findLowestChapterNumber(selectedManga.chapters);
            if (foundChapter) await chapterOptionsMenu(foundChapter, selectedManga.manga);
        } else if (m === HIGHESTCHAPTER) {
            const foundChapter = findHighestChapterNumber(selectedManga.chapters);
            if (foundChapter) await chapterOptionsMenu(foundChapter, selectedManga.manga);
        } else if (m === SPECIFICCHAPTER) {
            await findChapterByChapterNumber(selectedManga.chapters, selectedManga.manga);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

function findNextUnreadChapter (selectedManga) {
    const mangaEntry = findEntryAtLists(selectedManga.manga);
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

function findLowestChapterNumber (chapters) {
    const lowestChapterNumber = Math.min(...chapters.map(chapter => Number(chapter.attributes.chapter)));
    const foundChapter = chapters.find(chapter => Number(chapter.attributes.chapter) === lowestChapterNumber);
    if (!foundChapter) {
        console.log('\n||\n|| Given chapter was not found\n||')
    } else {
        return foundChapter;
    }   
}

function findHighestChapterNumber (chapters) {
    const highestChapterNumber = Math.max(...chapters.map(chapter => Number(chapter.attributes.chapter)));
    const foundChapter = chapters.find(chapter => Number(chapter.attributes.chapter) === highestChapterNumber);
    if (!foundChapter) {
        console.log('\n||\n|| Given chapter was not found\n||')
    } else {
        return foundChapter;
    }
}

async function findChapterByChapterNumber (chapters, manga) {
    let m = 0;

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Input a chapter number:\n||`);
        console.log('|| e -> Go back\n||');

        m = await takeUserInput();
        
        if (m >= 0) {
            const foundChapter = chapters.find(chapter => Number(chapter.attributes.chapter) === m); // trying to find given chapter number
            if (!foundChapter) {
                console.log('\n||\n|| Given chapter was not found\n||');
            } else {
                await chapterOptionsMenu(foundChapter, manga);
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function chapterOptionsMenu (selectedChapter, manga) {
    const LOGDATA = 0, OPENINBROWSER = 1, OPENATLISTS = 2;
    let m = 0;

    while (m !== 'e') 
    {
        const chapterTitle = selectedChapter.attributes.title ? selectedChapter.attributes.title : ''; // title
        const chNum = selectedChapter.attributes.chapter !== null ? selectedChapter.attributes.chapter : -1; // chapter number 
        const vlNum = selectedChapter.attributes.volume !== null ? selectedChapter.attributes.volume : -1; // volume number
        const transLang = selectedChapter.attributes.translatedLanguage ? selectedChapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
        const mangaTitle = Object.values(manga.attributes.title)[0]; // title
        const formattedTitle = `${chapterTitle.length > 0 ? chapterTitle.trim() : mangaTitle.trim() }${chNum >= 0 ? ` (ch: ${chNum})` : (vlNum >= 0 ? ` (vol: ${vlNum})` : '' )}${transLang.length > 0 ? ` (${transLang})` : ''}`;
        console.log(`\n||\n|| ${formattedTitle}\n||`);
        console.log('|| 0 -> Log chapter data');
        console.log('|| 1 -> Open chapter in browser');
        console.log('|| 2 -> Find manga at lists');
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === LOGDATA) {
            const dataTitle = `${mangaTitle} ${chNum >= 0 ? `(ch: ${chNum})` : // chNum for context
                                (vlNum >= 0 ? `(vol: ${vlNum})` : '' )}`;       // log neither volume nor chapter// vlNum for context
            await logDataDeepMenu(selectedChapter, dataTitle, true);
        } else if (m === OPENINBROWSER) {
            await open(selectedChapter.link); 
        } else if (m === OPENATLISTS) {
            const mangaEntry = findEntryAtLists(manga);
            if (!mangaEntry) {
                console.log('\n||\n|| Manga is not in your lists\n||');
            } else {
                await updateEntryMenu(mangaEntry, lists);
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

function findEntryAtLists (manga) {
    return lists[1] // manga list
           ?.flatMap(status => status) // combines all entries from all statuses to one arr
           .find(entry => entry.node.id === parseInt(manga.attributes.links?.mal)); // return first entry where id is the same
}

async function logDataDeepMenu (data, dataTitle, sortByKeysAlphabetical, forceSkipSorting) {
    let m = 0;

    if (!forceSkipSorting && sortByKeysAlphabetical) {
        data = sortObjectByKeysAlphabetical(data, 'asc'); // sort by keys a-z
    }

    while (m !== 'e') 
    {   
        let index = 0;
        console.log(`\n||\n|| LOG - ${capitalFirstLetterString(dataTitle)}\n||`);
        if (!Object.keys(data).length) {
            console.log('|| ? -> No keys to select');
        } else {
            for (const key in data) {
                console.log(`|| ${index++} -> ${capitalFirstLetterString(key)}`);
            }
        }
        console.log('||\n|| e -> Go back\n||');
        const highestSelectableIndex = index - 1;
        
        m = await takeUserInput(true); // get user input

        // 1. display selectable keys of data
        // 2. handle user input
        //    - if data[selected] is primitive type, log --> key: value
        //      -- in case of a long string, format string prior to logging
        //    - else if data[selected] is array of primitives, log --> key\n -value\n -value etc...
        //    - else data[selected] is array of object(s) / object of objects, call function again with data[selected]

        if (m >= 0 && m <= highestSelectableIndex) { 
            // data[m] is an object: 
            // -> key = key of data[m]
            // -> value = value of data[m]
            const key = Object.keys(data)[m], value = Object.values(data)[m]; 
            const dataTypeOfValue = getDataTypeOfValue(value);
            if (!dataTypeOfValue) { // unknown datatype of value
                console.log('\n||\n|| Data type of value couldn\'t be resolved\n||')
            } else if (dataTypeOfValue === 'primitive' || dataTypeOfValue === 'null') { // key: value || key: null/undefined
                logObject(key, value); 
            } else if (dataTypeOfValue === 'arrayOfPrimitives') { // key: [data1, data2]
                logArrayOfPrimitives(key, value);
            } else if (dataTypeOfValue === 'object') { // key: { key1: value1, key2: value2 }
                await logDataDeepMenu(value, key, 'asc', forceSkipSorting);
            } else if (dataTypeOfValue === 'arrayOfObjects') { // key: [ {key1: value1}, {key2: value2} ]
                const isFlattenable = isFilledWithOneLengthObjects(value); 
                const object = isFlattenable ? flattenArrayOfObjects(value) : reformatArrayObjectsToObject(value, key);
                await logDataDeepMenu(object, key, isFlattenable, forceSkipSorting); // isFlattenable triggers alphabetical sorting if true
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

function getDataTypeOfValue (value) {
    // 1. value is null
    // 2. value is primitive type 
    // 3. value is array of primitive(s)
    // 4. value is array of object(s)
    // 5. value is object
    if (value === null || value === undefined) {
        return 'null';
    } else if (typeof value !== 'object') {
        return 'primitive';
    } else if (Array.isArray(value) && typeof value[0] !== 'object') {
        return 'arrayOfPrimitives';
    } else if (Array.isArray(value) && typeof value[0] === 'object') {
        return 'arrayOfObjects';
    } else if (typeof value === 'object') {
        return 'object';
    } 
}

function logObject (title, value) {
    const maxLineLength = 75;
    if (typeof value === 'string' && value.length > maxLineLength) {
        const stringAsArr = longStringToArray(value, maxLineLength);
        console.log(`\n||\n|| ${capitalFirstLetterString(title)}:\n||`);
        stringAsArr.forEach((line, index) => {
            if (index < stringAsArr.length - 1) console.log(`|| ${line}`);
            else console.log(`|| ${line}\n||`);
        });
    } else {
        // TODO: 
        // - make better logging for dates 
        console.log(`\n||\n|| ${capitalFirstLetterString(title)}: ${value === undefined || value === null || value?.length === 0 ? 'N/A' : value}\n||`);
    }
}

function logArrayOfPrimitives (title, array) {
    console.log(`\n||\n|| ${capitalFirstLetterString(title)}:\n||`);
    array.forEach((value, index) => {
        if (index < array.length - 1) console.log(`|| - ${value}`);
        else console.log(`|| - ${value}\n||`);
    });
    if (!array.length) console.log('|| - Nothing was found\n||');
}

function countKeyValuePairs (array) {
    let count = 0;
    for (const element of array) {
        for (const key in element) {
            count++;
        }
    }
    return count;
}

function flattenArrayOfObjects (array) {
    // flattens array of objects to a single object holding key-value pairs
    let flatObject = {}; // holds flattened object
    let keyCount = {}; // counts how many keys by name key encountered e.g. 'en': 2 <-- two keys by name 'en' encountered
    for (const obj of array) { // refers to e.g. '{ 'en': 'frieren' }'
        for (const key in obj) { // e.g. 'en'
            if (!flatObject[key]) { // key doesn't yet exist
                keyCount[key] = 1; // start counting key
                flatObject[key] = obj[key];
            } else { // key exists
                const formattedKey = `${key}_${keyCount[key]++}`; // format key && increment keyCount[key]
                flatObject[formattedKey] = obj[key]; // add data to formatted key
            }
        }
    }
    return flatObject;
}

function reformatArrayObjectsToObject (array, keyOfArray) {
    // formats array of objects to single object and names the keys
    // of each object it holds into keyOfArray_index e.g. tags -> tag_0, tag_1 etc...
    let newObject = {};
    for (const key in array) {
        const formattedKey = `${keyOfArray.slice(0, -1)}_${key}`; // format name of key by upper key
        newObject[formattedKey] = array[key]; // create newObject.formattedKey to hold value of array[obj]
    }
    return newObject;
}

function isFilledWithIndexedKeys (object) {
    // text <-- length text
    // _ <-- one underscore 
    // y <-- number
    for (const key in object) {
        const test = /[a-z]+_{1}[0-9]+/i.test(key); // test for each, return false right away if false otherwise return true at the end 
        if (!test) return false;
    }
    return true;
}

function isFilledWithOneLengthObjects (array) {
    for (const obj of array) { // obj
        if (Object.keys(obj).length > 1) return false; // more then one key value pair
    }
    return true; // every obj of length zero or one
}

function sortObjectByKeysAlphabetical (object, direction) {
    // re-arrange given object by the names of the objects keys
    // object can either be arranged in a-z or z-a order based on direction
    if (!direction || direction === 'asc') { // sort keys a-z
        object = Object.fromEntries( // format back to obj
            Object.entries(object).sort((a, b) => a[0].localeCompare(b[0])) // format obj to arr and sort by keys a-z
        ); 
    } else { // sort keys z-a
        object = Object.fromEntries( // re-arrange by keys
            Object.entries(object).sort((a, b) => b[0].localeCompare(a[0])) // format obj to arr and sort by keys z-a
        );
    }
    return object;
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

export { menuLogMangadex, logDataDeepMenu };