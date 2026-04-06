import { filehandle } from "../filehandling/filehandle.js";
import { takeUserInput, truncateString, capitalFirstLetterString, printMenuOptions } from "../helpers/functions.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logDataDeepMenu } from "./menuLogMangadex.js";
import { fetchMAL } from "../fetch/fetchMAL.js";
import { updateMAL } from "../updateMAL/updateMAL.js";

const ANIME = 0, MANGA = 1;
let lists, options;

async function menuMAL (l, config) {
    const TRAVERSE_ANIME = 0, TRAVERSE_MANGA = 1, SEARCH_LISTS = 2, FETCHLISTS = 3;
    let m = 0;
    options = config.menuMALOptions; // reference to config.menuMALOptions
    
    if (!options.fetchMALOnMenuOpen) {
        lists = l; // reference to lists
    } else {
        lists = await fetchMAL(l); // searches and returns MAL lists
        filehandle('mal', lists);
    }

    while (m !== 'e') 
    {
        printMenuOptions(
            'MyAnimeList options', 
            ['Anime list', 'Manga list', 'Search lists', 'Fetch lists', '_']
        );

        m = await takeUserInput(true); // take userInput whole numbers
        
        if (m === TRAVERSE_ANIME) {
            await traverseStatus(ANIME); // anime list
        } else if (m === TRAVERSE_MANGA) {
            await traverseStatus(MANGA); // manga list
        } else if (m === SEARCH_LISTS) {
            await searchListsMenu(); // search lists
        } else if (m === FETCHLISTS) {
            lists = await fetchMAL(lists); // searches and returns MAL lists
            filehandle('mal', lists);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
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
    let m = 0; 

    while (m !== 'e') 
    {
        printMenuOptions(
            `Type: ${typeIndex === ANIME ? 'Anime' : 'Manga'}`,
            [...statuses.map(capitalFirstLetterString), '_']
        );  

        m = await takeUserInput(true); // take user input as whole num

        if (m >= 0 && m < statuses.length) {
            const statusIndex = m; // selected status
            await traverseEntry(typeIndex, statusIndex); // traverse entries for lists[typeIndex][statusIndex]
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function traverseEntry (typeIndex, statusIndex) {
    const status = typeIndex === ANIME ? animeStatus[statusIndex] : mangaStatus[statusIndex];
    const entries = lists[typeIndex][statusIndex];
    let m = 0; 

    while (m !== 'e') 
    {
        printMenuOptions(
            `Status: ${capitalFirstLetterString(status)}`,
            entries.map(entry => entry.node.title),
            (entries.length ? ['_'] : [{'?': 'No entries found'}, '_'])
        );

        m = await takeUserInput(true); // take user input as whole num
        
        if (m >= 0 && m < entries.length) {
            const entry = entries[m]; // reference to selected entry
            await updateEntryMenu(entry); // update stuff related to selected entry
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateEntryMenu (entry, l) {
    // second parameter for function is supposed to be used
    // when calling updateEntryMenu from outside (l = reference to 
    // lists from outside the function)
    const STATUS = 0, SCORE = 1, PROGRESS = 2, START_DATE = 3, FINISH_DATE = 4, ISRE = 5, COMMENTS = 6;
    const PADEND = 12, PADSTART = 0, NOT_SET = 'Not set';
    let m = 0, changedFields = {}, listsReference = l === undefined ? lists : l;

    // TODO: 
    // - make it so that start/finish dates are automatically applied
    //   upon e.g. the first episode/chapter read + setting the series
    //   as completed/updating last chapter of series etc...
    // - create some kind of system for actually being able to use
    //   the isre(watching/reading) keys for something useful, this
    //   also naturally includes integrating updating num_times_re...
    //   etc. key-value pairs to the mix

    while (m !== 'e') 
    {
        // 1. I need original reference to entry + clone of entry
        // 2. inside the loop I will only change data of the clone
        // 3. after going out of loop, I will NOT pass the clone to updateMAL function 
        //    as the clone is only used to reference changed values inside the loop 

        const entry_clone = structuredClone(entry); // clone of entry

        const entryTitle = entry_clone.node.title; // anime/manga title
        const list_status = entry_clone.list_status; // list_status
        
        // <-- formatting menu options START
        const s1_status = 'Status';
        const s2_status = capitalFirstLetterString(list_status.status);                             // watching/reading etc...
        const status    = s1_status.padEnd(PADEND, ' ') + ': ' + s2_status.padStart(PADSTART, ' '); // status with padding

        const s1_score = 'Score';
        const s2_score = `${list_status.score > 0 ? list_status.score : NOT_SET }`;              // 0 - 10 || 0
        const score    = s1_score.padEnd(PADEND, ' ') + ': ' + s2_score.padStart(PADSTART, ' '); // score with padding

        const s1_progress = 'Progress';
        const s2_progress = getType(list_status) === ANIME ? (`${list_status.num_episodes_watched} / ${entry_clone.node.num_episodes > 0 ? entry_clone.node.num_episodes : '?'}`) : // anime = num_episodes_watched
                                                             (`${list_status.num_chapters_read} / ${entry_clone.node.num_chapters > 0 ? entry_clone.node.num_chapters : '?'}`);     // manga = num_chapters_read
        const progress    = s1_progress.padEnd(PADEND, ' ') + ': ' + s2_progress.padStart(PADSTART, ' '); // progress with padding

        const s1_startDate = 'Start date';
        const s2_startDate = `${list_status.start_date?.length > 0 ? list_status.start_date : NOT_SET}`;     // yyyy-mm-dd
        const startDate    = s1_startDate.padEnd(PADEND, ' ') + ': ' + s2_startDate.padStart(PADSTART, ' '); // start date with padding
        
        const s1_finishDate = 'Finish date';
        const s2_finishDate = `${list_status.finish_date?.length > 0 ? list_status.finish_date : NOT_SET}`;     // yyyy-mm-dd
        const finishDate    = s1_finishDate.padEnd(PADEND, ' ') + ': ' + s2_finishDate.padStart(PADSTART, ' '); // finish date with padding

        const s1_isRe = `${getType(list_status) === ANIME ? 'Re-watching' : 'Re-reading'}`;
        const s2_isRe = getType(list_status) === ANIME ? `${list_status.is_rewatching ? 'Yes' : 'No'}` : // anime = is_rewatching
                                                         `${list_status.is_rereading  ? 'Yes' : 'No'}`;  // manga = is_rereading
        const isRe    = s1_isRe.padEnd(PADEND, ' ') + ': ' + s2_isRe.padStart(PADSTART, ' ');            // isRe(watching/reading) with padding
        
        const s1_comments = 'Comments';
        const s2_comments = list_status.comments.length > 0 ? truncateString(list_status.comments, 10) : NOT_SET; // list_status.comment || 'no comment'
        const comments    = s1_comments.padEnd(PADEND, ' ') + ': ' + s2_comments.padStart(PADSTART, ' ');         // comments with padding
        // <-- formatting menu options END

        console.log(`\n||\n|| UPDATE - ${entryTitle}\n||`);
        console.log('|| --------------------\n||');
        console.log(`|| 0 -> ${status}`);
        console.log(`|| 1 -> ${score}`);
        console.log(`|| 2 -> ${progress}`);
        console.log(`|| 3 -> ${startDate}`);
        console.log(`|| 4 -> ${finishDate}`);
        console.log(`|| 5 -> ${isRe}`);
        console.log(`|| 6 -> ${comments}`);
        console.log('||\n|| --------------------');
        console.log('||\n|| l -> Log entry');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num

        if (m === STATUS) {
            const oldStatus = list_status.status; // status before update
            await updateStatusMenu(list_status);  // update status menu 
            if (oldStatus !== list_status.status) changedFields.status = list_status.status; 
        } else if (m === SCORE) {
            const oldScore = list_status.score; // score before update
            await updateScoreMenu(list_status); // update score menu
            if (oldScore !== list_status.score) changedFields.score = list_status.score;
        } else if (m === PROGRESS) {
            const oldProgress = getProgress(list_status); // progress before update
            await updateProgressMenu(entry_clone);        // update progress menu
            if (oldProgress !== getProgress(list_status)) {
                // hox! for some reason the api expects num_watched_episodes but returns num_episodes_watched...
                if (!getType(list_status)) changedFields.num_watched_episodes = list_status.num_episodes_watched; // anime
                else changedFields.num_chapters_read = list_status.num_chapters_read;                             // manga
            }
        } else if (m === START_DATE) {
            const oldStartDate = list_status.start_date; // start date before update
            await updateStartDateMenu(list_status);      // update start date menu
            if (oldStartDate !== list_status.start_date) {
                changedFields.start_date = list_status.start_date;
                if (list_status.start_date === '0000-00-00') delete list_status.start_date;
            }
        } else if (m === FINISH_DATE) {
            const oldFinishDate = list_status.finish_date; // finish date before update
            await updateFinishDateMenu(list_status);       // update finish date menu
            if (oldFinishDate !== list_status.finish_date) {
                changedFields.finish_date = list_status.finish_date;
                if (list_status.finish_date === '0000-00-00') delete list_status.finish_date;
            }
        } else if (m === ISRE) {
            const oldIsRe = getIsRe(list_status); // isRe(reading/watching) before update
            await updateIsReMenu(list_status);    // update isRe
            if (oldIsRe !== getIsRe(list_status)) {
                if (!getType(list_status)) changedFields.is_rewatching = list_status.is_rewatching; // anime
                else changedFields.is_rereading = list_status.is_rereading;                         // manga
            }
        } else if (m === COMMENTS) {
            const oldComments = list_status.comments; // comments before update
            await updateCommentsMenu(list_status);    // update comments
            if (oldComments !== list_status.comments) changedFields.comments = list_status.comments;
        } else if (m === 'l') {
            await logDataDeepMenu(entry, entryTitle, false, true);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }

        // update changes
        if (Object.keys(changedFields).length > 0) {
            listsReference = await updateMAL(listsReference, changedFields, entry); // update MAL entry
            filehandle('mal', listsReference); // save updates to file
            changedFields = {}; // clear changedFields
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
    let m = 0;
    
    while (m !== 'e') 
    {
        printMenuOptions(
            `Pick from available statuses (${statusBeforeChange === list_status.status ? `current: ${list_status.status}` : 
                                                                                         `update to: ${list_status.status} - from: ${statusBeforeChange}`})`,
            [...statuses.map(status => capitalFirstLetterString(status)), '_']
        )
        
        m = await takeUserInput(true); // take whole num as user input

        if (m >= 0 && m < statuses.length) {
            list_status.status = statuses[m]; // update entry_clone status
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateScoreMenu (list_status) {
    const scoreBeforeChange = list_status.score;
    let m = 0;
    
    while (m !== 'e') 
    {
        printMenuOptions(
            `Pick a score (${scoreBeforeChange === list_status.score ? `current: ${list_status.score}` :
                                                                       `update to: ${list_status.score} - from: ${scoreBeforeChange}`})`,
            null,
            [{'?': 'Input a value between 0-10'}, '_']
        );

        m = await takeUserInput(true); // take whole num as user input

        if (m >= 0 && m <= 10) {
            list_status.score = m; // save user input
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateProgressMenu (entry) {
    // episodes watched/chapters read
    const list_status = entry.list_status;
    const progressBeforeChange = getProgress(list_status);
    let m = 0;

    // TODO:
    // - if changing progress to max doesn't update status of series to completed
    //   consider giving the user the option to update status to completed after 

    while (m !== 'e') 
    {
        printMenuOptions(
            `Update progress (${progressBeforeChange === getProgress(list_status) ? `current: ${getProgress(list_status)} / ${getTotal(entry)}` :
                                                                                    `update to: ${getProgress(list_status)} / ${getTotal(entry)} - from: ${progressBeforeChange} / ${getTotal(entry)}`})`,
            null,
            [{'±': 'Increase/Decrease progress'}, {'?': `Input a value 0-${getTotal(entry) > 0 ? getTotal(entry) : '?' }`}, '_']
        );

        m = await takeUserInput(true); // take whole num as user input

        if ((m >= 0 && m <= getTotal(entry)) || (!getTotal(entry) && m >= 0)) { // update progress by given user input
            setProgress(list_status, m); 
        } else if (m === '+') { // progress++
            // if total = 0 -- allows incrementing indefinitely
            // if total > 0 -- allows incrementing until getTotal(entry) [episode count]
            if (!getTotal(entry) || getProgress(list_status) < getTotal(entry)) {
                const amount = getProgress(list_status) + 1;
                setProgress(list_status, amount);
            }
        } else if (m === '-' && getProgress(list_status) > 0) { // progress--
            const amount = getProgress(list_status) - 1;
            setProgress(list_status, amount);
        } else if (m === '++' && getTotal(entry)) { // progress = max (only works when max > 0)
            const amount = getTotal(entry); 
            setProgress(list_status, amount);
        } else if (m === '--') { // progress = min (always sets progress to 0)
            setProgress(list_status, 0);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
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
    let m = 0;

    while (m !== 'e') 
    {
        printMenuOptions(
            `Update start date (${startDateBeforeChange === list_status.start_date ? `current: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` : 
                                                                                     `update to: ${list_status.start_date} - from: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` })`,
            null,
            [{'?': 'Input date (year-mm-dd)'}, {'c': 'Clear date'}, '_']
        );  
        
        m = await takeUserInput(); // take user input

        if (m !== 'c' && m !== 'e' && isValidDate(m)) { // is valid date
            list_status.start_date = m; 
        } else if (m === 'c' && list_status.start_date) { // clear date
            list_status.start_date = '0000-00-00';
        } 
    }
}

async function updateFinishDateMenu (list_status) {
    const finishDateBeforeChange = list_status.finish_date;
    let m = 0;

    while (m !== 'e') 
    {
        printMenuOptions(
            `Update finish date (${finishDateBeforeChange === list_status.finish_date ? `current: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` : 
                                                                                        `update to: ${list_status.finish_date} - from: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` })`,
            null,
            [{'?': 'Input date (\"year-mm-dd\")'}, {'c': 'Clear date'}, '_']
        );
        
        m = await takeUserInput(); // take user input

        if (m !== 'c' && m !== 'e' && isValidDate(m)) { // is valid date
            list_status.finish_date = m; 
        } else if (m === 'c' && list_status.finish_date) { // clear date
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
        console.log(`\n||\n|| Date expected in the format "year-mm-dd"\n||`);
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
        console.log('\n||\n|| The given year is not a number\n||');
        return false;
    } else if (Number.isNaN(mm)) {
        console.log('\n||\n|| The given month is not a number\n||');
        return false;
    } else if (Number.isNaN(dd)) {
        console.log('\n||\n|| The given day is not a number\n||');
        return false;
    }

    // date doesn't follow Year -> Month -> Day order
    if (yyyy === 0 && mm > 0) { 
        console.log(`\n||\n|| Given year can't be set to 0 when given month is over 0\n||`);
        return false;
    } else if (mm === 0 && dd > 0) { 
        console.log(`\n||\n|| Given month can't be set to 0 when given day is over 0\n||`);
        return false;
    } else if (yyyy > 0 && (yyyy < 1000 || yyyy > 2999)) {
        console.log('\n||\n|| Given year has to be between 1000 - 2999\n||');
        return false;
    }

    // check date normally
    if (mm > 0 && dd > 0) {
        if (mm > 12) { // month > 12
            console.log('\n||\n|| Given month has to be between 1 - 12\n||');
            return false;
        } else if (dd > 31) { // day > 31
            console.log('\n||\n|| Given day has to be between 1 - 31\n||');
            return false;
        } else if (dd > daysByMonth[mm-1]) { // invalid day for month
            console.log('\n||\n|| Given date is invalid for given month\n||');
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
    let m = 0;

    while (m !== 'e') 
    {
        printMenuOptions(
            `Update ${getType(list_status) ? 're-reading' : 're-watching'} (${isReBeforeChange === getIsRe(list_status) ? `current: ${isReBeforeChange ? 'yes' : 'no'}` : 
                                                                                                                          `update to: ${getIsRe(list_status) ? 'yes' : 'no'} - from: ${isReBeforeChange ? 'yes' : 'no'}`})`,
            ['no', 'yes', '_']
        );

        m = await takeUserInput(true); // take user input as whole number
        
        if (m >= 0 && m <= 1) {
            const value = m === 0 ? false : true; // isRe value
            setIsRe(list_status, value);          // update isRe
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
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
    let m = 0;

    while (m !== 'e') 
    {
        printMenuOptions(
            `Update comment (${commentsBeforeChange === list_status.comments ? (`current: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set`}`) : // hasn't been updated
                                                                               (`update to: "${list_status.comments}" - from: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set` }`)})`,
            null,
            [{'?': `Input comment (minimum ${MIN_LENGTH} characters)`}, {'c': 'Clear comment'}, '_']
        );

        m = await takeUserInput(); // take user input
        
        if (m === 'c') { // clear comment
            list_status.comments = ''; 
        } else if (m !== 'e' && (m === undefined || String(m).length < 3)) { // comment is too short
            console.log(`\n||\n|| Minimum required comment length: ${MIN_LENGTH} characters\n||`);
        } else if (m !== 'e') { // comment is valid
            list_status.comments = String(m); // update comments
        }
    }
}

async function searchListsMenu() {
    const SEARCH_BY_TITLE = 0;
    let m = null;

    while (m !== 'e') 
    {
        printMenuOptions(
            'Search for entry', 
            ['Search by title', '_']
        );

        m = await takeUserInput(true); // take user input
        
        if (m === SEARCH_BY_TITLE) {
            await searchListsByTitleMenu(); // search lists by title
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function searchListsByTitleMenu() {
    let m = null;

    while (m !== 'e') 
    {
        printMenuOptions(
            'Search lists by title', 
            null, 
            [{'?': 'Input title'}, '_']
        );

        m = await takeUserInput(false, true); // take user input
        
        if (typeof m === 'string') {
            console.log('\n||\n|| This has not been implemented yet (sowwy... </3)\n||');
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

export { menuMAL, updateEntryMenu };