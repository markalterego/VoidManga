import { filehandle } from "../filehandling/filehandle.js";
import { takeUserInput, truncateString, capitalFirstLetterString, printMenuOptions, escapeRegex } from "../helpers/functions.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logDataDeepMenu, updatePageDetails, pageContent, pagingOptions } from "./menuLogMangadex.js";
import { fetchMALUserLists } from "../fetch/fetchMAL.js";
import { updateMAL } from "../updateMAL/updateMAL.js";

const ANIME = 0, MANGA = 1;
let lists, options;

async function menuMAL (l, config) {
    const TRAVERSE_ANIME = 0, TRAVERSE_MANGA = 1, SEARCH_LISTS = 2, FETCHLISTS = 3;
    let input = 0;
    options = config.menuMALOptions; // reference to config.menuMALOptions
    
    if (!options.fetchMALOnMenuOpen) {
        lists = l; // reference to lists
    } else {
        lists = await fetchMALUserLists(l); // searches and returns MAL lists
        filehandle('mal', lists);
    }

    while (input !== 'e') 
    {
        printMenuOptions(
            'MyAnimeList options', 
            [
                ['Anime list'], 
                ['Manga list'], 
                ['Search lists'], 
                ['Fetch lists'], 
                '_'
            ]
        );

        input = await takeUserInput(true); // take userInput whole numbers
        
        if (input === TRAVERSE_ANIME) {
            await traverseStatus(ANIME); // anime list
        } else if (input === TRAVERSE_MANGA) {
            await traverseStatus(MANGA); // manga list
        } else if (input === SEARCH_LISTS) {
            await searchListsMenu(); // search lists
        } else if (input === FETCHLISTS) {
            lists = await fetchMALUserLists(lists); // searches and returns MAL lists
            filehandle('mal', lists);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
    return lists;
}

function formatListsToObject (lists_array) {
    let lists_object = {};
    for (let typeIndex = 0; typeIndex < lists_array.length; typeIndex++) {
        let typeKey = !typeIndex ? 'anime' : 'manga';
        lists_object[typeKey] = {}; // create object at typeKey
        for (let statusIndex = 0; statusIndex < lists_array[typeIndex].length; statusIndex++) {
            let statusKey = typeKey === 'anime' ? animeStatus[statusIndex] : mangaStatus[statusIndex];
            lists_object[typeKey][statusKey] = {}; // create object at typeKey + statusKey
            for (let entryIndex = 0; entryIndex < lists_array[typeIndex][statusIndex].length; entryIndex++) {
                let entryKey = lists_array[typeIndex][statusIndex][entryIndex].node.title; // create object at typeKey + statusKey + entryKey
                lists_object[typeKey][statusKey][entryKey] = lists_array[typeIndex][statusIndex][entryIndex]; // initialize ...[typeKey][statusKey][entryKey] with entry data
            }
        }
    }
    return lists_object;
}

async function traverseStatus (typeIndex) {
    const statuses = typeIndex === ANIME ? animeStatus : mangaStatus; // list of statuses for type
    let input = 0; 

    while (input !== 'e') 
    {
        printMenuOptions(
            `Type: ${typeIndex === ANIME ? 'Anime' : 'Manga'}`,
            [
                ...statuses.map(s => [capitalFirstLetterString(s)]), 
                '_'
            ]
        );  

        input = await takeUserInput(true); 

        if (input >= 0 && input < statuses.length) {
            const statusIndex = input; // selected status
            await traverseEntry(typeIndex, statusIndex); // traverse entries for lists[typeIndex][statusIndex]
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function traverseEntry (typeIndex, statusIndex, entryArr) {
    const status = !entryArr ? (typeIndex === ANIME ? animeStatus[statusIndex] : mangaStatus[statusIndex]) : null;
    const entries = !entryArr ? lists[typeIndex][statusIndex] : entryArr;
    let input = 0, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }; 

    while (input !== 'e') 
    {
        pageDetails = options.enablePagingEntries ? updatePageDetails(pageDetails, entries) : pageDetails;
        let pagedEntries = pageContent(entries, pageDetails.currentPageIndex, options.enablePagingEntries);

        // formatting printMenuOptions parameters
        const header = !entryArr ? `Status: ${capitalFirstLetterString(status)}`: 'Search results';
        const entryTitles = pagedEntries.map(e => [e.node.title]);
        const pageFooter = entryTitles.length && options.enablePagingEntries ? 'p' : null;
        const titles = entryTitles.length ? [...entryTitles] : [['?', 'No entries found']];

        const optionsArray = [
            '-',
            '_',
            ...titles,
            '_',
            pageFooter,
            '_',
            '_',
            ['t', `Toggle paging [${options.enablePagingEntries ? 'x' : ''}]`], 
            (options.enablePagingEntries ? ['±', 'Next/Previous page'] : null)
        ];

        printMenuOptions(
            header,
            optionsArray, 
            { pageDetails }
        );

        input = await takeUserInput(true); 
        
        if (input >= 0 && input < pagedEntries.length) {
            const entry = pagedEntries[input]; // reference to selected entry
            await updateEntryMenu(entry); // update stuff related to selected entry
        } else if (input === 't') { // toggle paging on/off
            options.enablePagingEntries = !options.enablePagingEntries;
        } else if (options.enablePagingEntries && (input === '+' || input === '-' || input === '++' || input === '--' || input?.[0] === 'p')) { // paging options
            pageDetails = pagingOptions(input, entries, pageDetails);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function updateEntryMenu (entry, l) {
    //
    // second parameter 'l' (standing for lists) is supposed to be used
    // when calling updateEntryMenu from outside menuMAL.js (l = lists)
    //
    const STATUS = 0, SCORE = 1, PROGRESS = 2, START_DATE = 3, FINISH_DATE = 4, ISRE = 5, COMMENTS = 6;
    const PADEND = 12, PADSTART = 0, NOT_SET = 'Not set';
    let input = 0, changedFields = [], listsReference = l === undefined ? lists : l;

    // TODO: 
    // - make it so that start/finish dates are automatically applied
    //   upon e.g. the first episode/chapter read + setting the series
    //   as completed/updating last chapter of series etc...
    // - create some kind of system for actually being able to use
    //   the isre(watching/reading) keys for something useful, this
    //   also naturally includes integrating updating num_times_re...
    //   etc. key-value pairs to the mix

    while (input !== 'e') 
    {
        // entry_clone is updated within deeper updateMenu functions, 
        // after user returns to this function (updateEntryMenu), entry_clone
        // is compared to the original entry - which remains unchanged - 
        // and all key-value pairs which are different are appended to
        // the changedFields array in the form of [key, value]. At the end
        // of the loop, changedFields passed to updateMAL and emptied right after 

        const entry_clone = structuredClone(entry); 
        const { num_episodes, num_chapters, num_volumes } = entry_clone.node; 
        const entryTitle = entry_clone.node.title; 
        const list_status = entry_clone.list_status; 
        const { status, is_rereading, is_rewatching, num_volumes_read, 
                num_chapters_read, num_episodes_watched, score, updated_at,
                start_date, finish_date, comments, priority, num_times_reread,
                num_times_rewatched, reread_value, rewatch_value, tags } = list_status;
        
        // formatting printMenuOptions parameters
        const s1_status = 'Status';
        const s2_status = capitalFirstLetterString(status);                                         // watching/reading etc...
        const s_status  = s1_status.padEnd(PADEND, ' ') + ': ' + s2_status.padStart(PADSTART, ' '); // status with padding

        const s1_score = 'Score';
        const s2_score = `${score > 0 ? score : NOT_SET }`;                                      // 0 - 10 || 0
        const s_score  = s1_score.padEnd(PADEND, ' ') + ': ' + s2_score.padStart(PADSTART, ' '); // score with padding

        const s1_progress = 'Progress';
        const s2_progress = getType(list_status) === ANIME ? (`${num_episodes_watched} / ${num_episodes > 0 ? num_episodes : '?'}`) : // anime = num_episodes_watched
                                                             (`${num_chapters_read} / ${num_chapters > 0 ? num_chapters : '?'}`);     // manga = num_chapters_read
        const s_progress  = s1_progress.padEnd(PADEND, ' ') + ': ' + s2_progress.padStart(PADSTART, ' '); // progress with padding

        const s1_startDate = 'Start date';
        const s2_startDate = `${start_date?.length > 0 ? start_date : NOT_SET}`;                             // yyyy-mm-dd
        const s_startDate  = s1_startDate.padEnd(PADEND, ' ') + ': ' + s2_startDate.padStart(PADSTART, ' '); // start date with padding
        
        const s1_finishDate = 'Finish date';
        const s2_finishDate = `${finish_date?.length > 0 ? finish_date : NOT_SET}`;                             // yyyy-mm-dd
        const s_finishDate  = s1_finishDate.padEnd(PADEND, ' ') + ': ' + s2_finishDate.padStart(PADSTART, ' '); // finish date with padding

        const s1_isRe = `${getType(list_status) === ANIME ? 'Re-watching' : 'Re-reading'}`;
        const s2_isRe = getType(list_status) === ANIME ? `${is_rewatching ? 'Yes' : 'No'}` :            // anime = is_rewatching
                                                         `${list_status.is_rereading  ? 'Yes' : 'No'}`; // manga = is_rereading
        const s_isRe  = s1_isRe.padEnd(PADEND, ' ') + ': ' + s2_isRe.padStart(PADSTART, ' ');           // isRe(watching/reading) with padding
        
        const s1_comments = 'Comments';
        const s2_comments = list_status.comments.length > 0 ? truncateString(list_status.comments, 10) : NOT_SET; // list_status.comment || 'no comment'
        const s_comments  = s1_comments.padEnd(PADEND, ' ') + ': ' + s2_comments.padStart(PADSTART, ' ');         // comments with padding
        
        // calling printMenuOptions
        printMenuOptions(
            `UPDATE - ${entryTitle}`,
            [
                '-', 
                '_', 
                [s_status], 
                [s_score], 
                [s_progress], 
                [s_startDate], 
                [s_finishDate], 
                [s_isRe], 
                [s_comments], 
                '_', 
                '-', 
                '_',
                ['l', 'Log entry']
            ]
        );

        input = await takeUserInput(true); 

        // selectable fields mapped to refer to their corresponding updateMenu function
        const selectableFields = {
            [STATUS]:      { field: 'status',                                          updater: updateStatusMenu     },
            [SCORE]:       { field: 'score',                                           updater: updateScoreMenu      },
            [PROGRESS]:    { field: 'progress',                                        updater: updateProgressMenu   },
            [START_DATE]:  { field: 'start_date',                                      updater: updateStartDateMenu  },
            [FINISH_DATE]: { field: 'finish_date',                                     updater: updateFinishDateMenu },
            [ISRE]:        { field: (is_rereading ? 'is_rereading' : 'is_rewatching'), updater: updateIsReMenu       },
            [COMMENTS]:    { field: 'comments',                                        updater: updateCommentsMenu   }
        };

        const selected = selectableFields[input];

        if (selected) { 
            const { field, updater } = selected;
            const old_list_status = structuredClone(list_status);
            field === 'progress' ? await updater(entry_clone) : await updater(list_status);
            // check for updates
            changedFields = Object.entries(list_status).filter(([key, _]) => { 
                const oldVal = old_list_status[key];
                const newVal = list_status[key];
                if (Array.isArray(newVal)) return JSON.stringify(oldVal) !== JSON.stringify(newVal);
                else return oldVal !== newVal;
            });
        } else if (input === 'l') {
            await logDataDeepMenu(entry, entryTitle, false, true);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }

        // update changes
        if (changedFields.length) {
            listsReference = await updateMAL(listsReference, changedFields, entry); // update MAL entry
            filehandle('mal', listsReference); // save updates to file
            changedFields = []; // clear changedFields
            // re-find entry reference
            entry = listsReference[getType(list_status)]                    // type
                                  .flatMap(s => s)                          // status
                                  .find(e =>  e.node.id === entry.node.id); // entry
        }
    }
}

async function updateStatusMenu (list_status) {
    const statuses = list_status.num_episodes_watched !== undefined ? animeStatus : mangaStatus; // arr of available statuses
    const statusBeforeChange = list_status.status;
    let input = 0;
    
    while (input !== 'e') 
    {
        printMenuOptions(
            `Pick from available statuses (${statusBeforeChange === list_status.status ? `current: ${list_status.status}` : 
                                                                                         `update to: ${list_status.status} - from: ${statusBeforeChange}`})`,
            [...statuses.map(status => [capitalFirstLetterString(status)]), '_']
        )
        
        input = await takeUserInput(true); // take whole num as user input

        if (input >= 0 && input < statuses.length) {
            list_status.status = statuses[input]; // update entry_clone status
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function updateScoreMenu (list_status) {
    const scoreBeforeChange = list_status.score;
    let input = 0;
    
    while (input !== 'e') 
    {
        printMenuOptions(
            `Pick a score (${scoreBeforeChange === list_status.score ? `current: ${list_status.score}` :
                                                                       `update to: ${list_status.score} - from: ${scoreBeforeChange}`})`,
            [['?', 'Input a value between 0-10'], '_']
        );

        input = await takeUserInput(true); // take whole num as user input

        if (input >= 0 && input <= 10) {
            list_status.score = input; // save user input
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function updateProgressMenu (entry) {
    // episodes watched/chapters read
    const list_status = entry.list_status;
    const progressBeforeChange = getProgress(list_status);
    let input = 0;

    // TODO:
    // - if changing progress to max doesn't update status of series to completed
    //   consider giving the user the option to update status to completed after 

    while (input !== 'e') 
    {
        printMenuOptions(
            `Update progress (${progressBeforeChange === getProgress(list_status) ? `current: ${getProgress(list_status)} / ${getTotal(entry)}` :
                                                                                    `update to: ${getProgress(list_status)} / ${getTotal(entry)} - from: ${progressBeforeChange} / ${getTotal(entry)}`})`,
            [
                ['±', 'Increase/Decrease progress'], 
                ['?', `Input a value 0-${getTotal(entry) > 0 ? getTotal(entry) : '?' }`], 
                '_'
            ]
        );

        input = await takeUserInput(true); // take whole num as user input

        if ((input >= 0 && input <= getTotal(entry)) || (!getTotal(entry) && input >= 0)) { // update progress by given user input
            setProgress(list_status, input); 
        } else if (input === '+') { // progress++
            // if total = 0 -- allows incrementing indefinitely
            // if total > 0 -- allows incrementing until getTotal(entry) [episode count]
            if (!getTotal(entry) || getProgress(list_status) < getTotal(entry)) {
                const amount = getProgress(list_status) + 1;
                setProgress(list_status, amount);
            }
        } else if (input === '-' && getProgress(list_status) > 0) { // progress--
            const amount = getProgress(list_status) - 1;
            setProgress(list_status, amount);
        } else if (input === '++' && getTotal(entry)) { // progress = max (only works when max > 0)
            const amount = getTotal(entry); 
            setProgress(list_status, amount);
        } else if (input === '--') { // progress = min (always sets progress to 0)
            setProgress(list_status, 0);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }  
}

function getType (list_status) {
    return list_status.num_episodes_watched === undefined ? MANGA : ANIME;
}

function getProgress (list_status) {
    return getType(list_status) ? list_status.num_chapters_read : list_status.num_episodes_watched; 
}

function getTotal (entry) {
    return getType(entry.list_status) ? entry.node.num_chapters : entry.node.num_episodes; 
}

function setProgress (list_status, amount) {
    if (!getType(list_status)) { // anime
        list_status.num_episodes_watched = amount;
    } else { // manga
        list_status.num_chapters_read = amount;
    }
}

async function updateStartDateMenu (list_status) {
    const startDateBeforeChange = list_status.start_date;
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            `Update start date (${startDateBeforeChange === list_status.start_date ? `current: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` : 
                                                                                     `update to: ${list_status.start_date} - from: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` })`,
            [['?', 'Input date (year-mm-dd)'], ['c', 'Clear date'], '_']
        );  
        
        input = await takeUserInput(); // take user input

        if (input !== 'c' && input !== 'e' && isValidDate(input)) { // is valid date
            list_status.start_date = input; 
        } else if (input === 'c' && list_status.start_date) { // clear date
            list_status.start_date = '0000-00-00';
        } 
    }
}

async function updateFinishDateMenu (list_status) {
    const finishDateBeforeChange = list_status.finish_date;
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            `Update finish date (${finishDateBeforeChange === list_status.finish_date ? `current: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` : 
                                                                                        `update to: ${list_status.finish_date} - from: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` })`,
            [['?', 'Input date (\"year-mm-dd\")'], ['c', 'Clear date'], '_']
        );
        
        input = await takeUserInput(); // take user input

        if (input !== 'c' && input !== 'e' && isValidDate(input)) { // is valid date
            list_status.finish_date = input; 
        } else if (input === 'c' && list_status.finish_date) { // clear date
            list_status.finish_date = '0000-00-00';
        } 
    }
}

function isValidDate (date) {
    // a valid date is in the format of year-mm-dd 
    // including the dashes e.g. '2024-07-12'

    // year OR mm OR dd is allowed to be set to zero when
    // the number before that is higher than zero e.g. 2000-01-00,
    // this will set the date to be 2000-01 at you MAL entry 

    // allows year = 1000-2999
    // allows mm   = 01-12
    // allows dd   = 01-31

    // setting the year below 1996 or above the current year is valid
    // but won't show up when checking an entry in your list through EDIT,
    // however the date still is valid + exists AND can be fetched normally
    
    // HOX!
    // Although pushing dates such as 0000-01-00 is allowed by the 
    // endpoint, a date like this won't be returned back by the api.
    // 
    // The API can return dates as strings exclusively in the format of
    // 1. yyyy
    // 2. yyyy-mm
    // 3. yyyy-mm-dd
    //
    // If you happen to set a date such as 2000-00-01, the API WILL accept
    // the date and in fact you will even see the change reflected on your 
    // anime/manga list, HOWEVER you won't be able to fetch back this date
    // NOT through fetching your entire lists through anime/manga endpoints
    // NOR when you push the update through the PUT endpoint. 
    //
    // If you happen to set a date such as 2000-02-30, a date that doesn't exist
    // into the API, one more thing that will happen is that this will cause
    // MAL to reject the date entirely and this will cause the date on MAL's side
    // to be set to 'null' instead of retaining the old date. But again, doing something
    // like 2000-02-00 is completely allowed and will return 2000-02 when you fetch
    // an entry containing that specific date.

    if (typeof date !== 'string' || date.length !== 10 || date.split('-').length !== 3) { // wrong format
        console.log(`  Date expected in the format "year-mm-dd"`);
        return false;
    }

    const date_split = date.split('-'); // takes first three parts
    const yyyy = Number(date_split[0]);
    const mm   = Number(date_split[1]);
    const dd   = Number(date_split[2]);
    const daysByMonth = [
        31, // JAN
        (isLeapYear(yyyy) ? 29 : 28), // FEB
        31, // MARCH
        30, // APRIL
        31, // MAY
        30, // JUN 
        31, // JUL
        31, // AUG
        30, // SEP
        31, // OCT
        30, // NOV
        31  // DEC
    ];
    
    // check for NaN values
    if (Number.isNaN(yyyy)) {
        console.log('  The given year is not a number');
        return false;
    } else if (Number.isNaN(mm)) {
        console.log('  The given month is not a number');
        return false;
    } else if (Number.isNaN(dd)) {
        console.log('  The given day is not a number');
        return false;
    }

    // date doesn't follow Year -> Month -> Day order
    if (yyyy === 0 && mm > 0) { 
        console.log(`  Given year can't be set to 0 when given month is over 0`);
        return false;
    } else if (mm === 0 && dd > 0) { 
        console.log(`  Given month can't be set to 0 when given day is over 0`);
        return false;
    } else if (yyyy > 0 && (yyyy < 1000 || yyyy > 2999)) {
        console.log('  Given year has to be between 1000 - 2999');
        return false;
    }

    // check date normally
    if (mm > 0 && dd > 0) {
        if (mm > 12) { // month > 12
            console.log('  Given month has to be between 1 - 12');
            return false;
        } else if (dd > 31) { // day > 31
            console.log('  Given day has to be between 1 - 31');
            return false;
        } else if (dd > daysByMonth[mm-1]) { // invalid day for month
            console.log('  Given date is invalid for given month');
            return false;
        } 
    }

    return true; // given date is valid
}

function isLeapYear (year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

async function updateIsReMenu (list_status) {
    const isReBeforeChange = getIsRe(list_status);
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            `Update ${getType(list_status) ? 're-reading' : 're-watching'} (${isReBeforeChange === getIsRe(list_status) ? `current: ${isReBeforeChange ? 'yes' : 'no'}` : 
                                                                                                                          `update to: ${getIsRe(list_status) ? 'yes' : 'no'} - from: ${isReBeforeChange ? 'yes' : 'no'}`})`,
            [
                ['no'], 
                ['yes'], 
                '_'
            ]
        );

        input = await takeUserInput(true); 
        
        if (input >= 0 && input <= 1) {
            const value = input === 0 ? false : true; // isRe value
            setIsRe(list_status, value);          // update isRe
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        } 
    }
}

function getIsRe (list_status) {
    // 0 = is_rewatching ... 1 = is_rereading
    return getType(list_status) ? list_status.is_rereading : list_status.is_rewatching;
}

function setIsRe (list_status, value) {
    if (!getType(list_status)) { // anime = is_rewatching
        list_status.is_rewatching = value;
    } else {                     // manga = is_rereading
        list_status.is_rereading = value;
    }
}

async function updateCommentsMenu (list_status) {
    const commentsBeforeChange = list_status.comments;
    const MIN_LENGTH = 3; // min required length for comment
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            `Update comment (${commentsBeforeChange === list_status.comments ? (`current: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set`}`) : // hasn't been updated
                                                                               (`update to: "${list_status.comments}" - from: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set` }`)})`,
            [
                ['?', `Input comment (minimum ${MIN_LENGTH} characters)`], 
                ['c', 'Clear comment'], 
                '_'
            ]
        );

        input = await takeUserInput(); // take user input
        
        if (input === 'c') { // clear comment
            list_status.comments = ''; 
        } else if (input !== 'e' && (input === undefined || String(input).length < 3)) { // comment is too short
            console.log(`  Minimum required comment length: ${MIN_LENGTH} characters`);
        } else if (input !== 'e') { // comment is valid
            list_status.comments = String(input); // update comments
        }
    }
}

async function searchListsMenu() {
    const SEARCH_BY_TITLE = 0;
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Search for entry', 
            [
                ['Search by title'], 
                '_'
            ]
        );

        input = await takeUserInput(true); // take user input
        
        if (input === SEARCH_BY_TITLE) {
            await searchListsByTitleMenu(); // search lists by title
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function searchListsByTitleMenu() {
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Search lists by title', 
            [['?', 'Input title'], '_']
        );

        input = await takeUserInput(false, true); // take user input
        
        if (typeof input === 'string' && input.length && input !== 'e') {
            const regex = new RegExp(`\\b${escapeRegex(input)}`, 'i'); // regex matches input at beginning of each word
            const matching = lists.flat(2) // arr of entries
                                  .filter(e => regex.test(e.node.title)); // match title to input
            if (!matching.length) { // no matching results
                console.log('  No matches found');
            } else { // traverse results
                await traverseEntry(null, null, matching);
            }
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

export { menuMAL, updateEntryMenu };