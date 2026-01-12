import { filehandle } from "../filehandling/filehandle.js";
import { takeUserInput, truncateString, capitalFirstLetterString } from "../helpers/functions.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logDataDeepMenu } from "./menuLogMangadex.js";
import { fetchMAL } from "../fetch/fetchMAL.js";
import { updateMAL } from "../updateMAL/updateMAL.js";

const ANIME = 0, MANGA = 1;
let lists;

async function menuMAL (l) {
    const LOGLISTS = 0, UPDATELISTS = 1, FETCHLISTS = 2;
    let m = 0;
    lists = l; // reference to lists

    while (m !== 'e') 
    {
        console.log('\n||\n|| MyAnimeList options\n||');
        console.log('|| 0 -> Log lists');
        console.log('|| 1 -> Update lists');
        console.log('|| 2 -> Fetch lists');
        console.log('||\n|| e -> Go back\n||');
        
        m = await takeUserInput(true); // take userInput whole numbers
        
        if (m === LOGLISTS) {
            // await logMALMenu();
            const listsAsObject = formatListsToObject(lists);
            await logDataDeepMenu(listsAsObject, 'MyAnimeList', false, true);
        } else if (m === UPDATELISTS) {
            await updateMALMenu();
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

async function updateMALMenu() {
    const TRAVERSE_ANIME = 0, TRAVERSE_MANGA = 1, SEARCH_TITLE = 2;
    let m = 0;

    // TODO: 
    // - remove call to traverseType and instead just user 
    //   selects anime/manga list straight from this functions 
    //   menu

    while (m !== 'e') 
    {
        console.log('\n||\n|| Update MyAnimeList\n||');
        console.log('|| 0 -> Traverse anime');
        console.log('|| 1 -> Traverse manga');
        console.log('|| 2 -> Search title');
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num

        if (m === TRAVERSE_ANIME) {
            await traverseStatus(ANIME); // anime list
        } else if (m === TRAVERSE_MANGA) {
            await traverseStatus(MANGA); // manga list
        } else if (m === SEARCH_TITLE) {
            // <-- searchTitles function here
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function traverseStatus (typeIndex) {
    const statuses = typeIndex === ANIME ? animeStatus : mangaStatus; // list of statuses for type
    let m = 0; 

    while (m !== 'e') 
    {
        console.log('\n||\n|| Select status\n||');
        statuses.forEach((status, statusIndex) => {
            console.log(`|| ${statusIndex} -> ${capitalFirstLetterString(status)}`);
        });
        console.log('||\n|| e -> Go back\n||');

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
    let m = 0; 

    while (m !== 'e') 
    {
        const status = typeIndex === ANIME ? animeStatus[statusIndex] : mangaStatus[statusIndex];
        console.log(`\n||\n|| Status: ${capitalFirstLetterString(status)}\n||`);
        lists[typeIndex][statusIndex].forEach((entry, entryIndex) => {
            const entryTitle = entry.node.title;
            console.log(`|| ${entryIndex} -> ${entryTitle}`);
            if (entryIndex === lists[typeIndex][statusIndex].length - 1) console.log('||');
        });
        if (!lists[typeIndex][statusIndex].length) {
            console.log('|| ? -> No entries found\n||');
        }
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num
        
        if (m >= 0 && m < lists[typeIndex][statusIndex].length) {
            const entryIndex = m; // selected entry index
            const entry = lists[typeIndex][statusIndex][entryIndex]; // reference to selected entry
            await updateEntryMenu(entry); // update stuff related to selected entry
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateEntryMenu (entry) {
    // const PADSTART = 10, PADEND = 12, BLANK = ' ';
    const entry_clone = structuredClone(entry);
    const STATUS = 0, SCORE = 1, PROGRESS = 2, START_DATE = 3, FINISH_DATE = 4, ISRE = 5, COMMENTS = 6;
    let m = 0, changedFields = {};

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

        const entryTitle = entry_clone.node.title; // anime/manga title
        const list_status = entry_clone.list_status; // list_status
        const status = list_status.status; // watching/reading etc...
        const score = list_status.score > 0 ? list_status.score : // 1 - 10 
                                              'not set';          // 0
        const progress = getType(list_status) === ANIME ? (`${list_status.num_episodes_watched} / ${entry_clone.node.num_episodes}`) : // if anime 
                                                          (`${list_status.num_chapters_read} / ${entry_clone.node.num_chapters}`);     // if manga
        const isRe = getType(list_status) === ANIME ? (list_status.is_rewatching ? 'yes' : 'no') : // if anime - isrewatching
                                                      (list_status.is_rereading  ? 'yes' : 'no');  // if manga - isrereading
        const comments = list_status.comments.length > 0 ? truncateString(list_status.comments, 10) : // has comment
                                                           'no comment';                              // doesn't have comment

        console.log(`\n||\n|| UPDATE - ${entryTitle}\n||`);
        console.log(`|| 0 -> Status (${status})`);
        console.log(`|| 1 -> Score (${score})`);
        console.log(`|| 2 -> Progress (${progress})`);
        console.log(`|| 3 -> Start date ()`);
        console.log(`|| 4 -> Finish date ()`);
        console.log(`|| 5 -> ${getType(list_status) === ANIME ? 'Re-watching' : 'Re-reading'} (${isRe})`);
        console.log(`|| 6 -> Comments (${comments})`);
        console.log('||\n|| e -> Go back\n||');

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
            if (oldStartDate !== list_status.start_date) changedFields.start_date = list_status.start_date;
        } else if (m === FINISH_DATE) {
            const oldFinishDate = list_status.finish_date; // finish date before update
            await updateFinishDateMenu(list_status);       // update finish date menu
            if (oldFinishDate !== list_status.finish_date) changedFields.finish_date = list_status.finish_date;
        } else if (m === ISRE) {
            const oldIsRe = getIsRe(list_status); // isRe(reading/watching) before update
            await updateIsReMenu(list_status);    // update isRe
            if (oldIsRe !== getIsRe(list_status)) {
                if (!getType(list_status)) changedFields.is_rewatching = list_status.is_rewatching; // anime
                else changedFields.is_rereading = list_status.is_rereading;                         // manga
            }
        } else if (m === COMMENTS) {
            await updateCommentsMenu(list_status);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
    
    // update changes
    if (Object.keys(changedFields).length > 0) {
        lists = await updateMAL(lists, changedFields, entry);
        filehandle('mal', lists);
    }
}

async function updateStatusMenu (list_status) {
    const statuses = list_status.num_episodes_watched !== undefined ? animeStatus : mangaStatus; // arr of available statuses
    const statusBeforeChange = list_status.status;
    let m = 0;
    
    while (m !== 'e') 
    {
        console.log(`\n||\n|| Pick from available statuses (${statusBeforeChange === list_status.status ? `current: ${list_status.status}` : 
                                                                                                          `update to: ${list_status.status} - from: ${statusBeforeChange}`})\n||`);
        statuses.forEach((status, statusIndex) => { // anime/manga statuses
            console.log(`|| ${statusIndex} -> ${capitalFirstLetterString(status)}`);
        });
        console.log('||\n|| e -> Go back\n||');
        
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
        console.log(`\n||\n|| Pick a score (${scoreBeforeChange === list_status.score ? `current: ${list_status.score}` :
                                                                                        `update to: ${list_status.score} - from: ${scoreBeforeChange}`})\n||`);
        console.log('|| ? -> Input a value between 0-10');
        console.log('||\n|| e -> Go back\n||');

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
        console.log(`\n||\n|| Update progress (${progressBeforeChange === getProgress(list_status) ? `current: ${getProgress(list_status)} / ${getTotal(entry)}` :
                                                                                                     `update to: ${getProgress(list_status)} / ${getTotal(entry)} - from: ${progressBeforeChange} / ${getTotal(entry)}`})\n||`);      
        console.log('|| ± -> Increase/Decrease progress'); // + = increase by one, ++ = set max || - = decrease by one, -- = set min
        console.log(`|| ? -> Input a value 0-${getTotal(entry) > 0 ? getTotal(entry) : '?' }`);
        console.log('||\n|| e -> Go back\n||');

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
        console.log(`\n||\n|| Update start date (${startDateBeforeChange === list_status.start_date ? `current: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'not set'}` : 
                                                                                                      `update to: ${list_status.start_date} - from: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'not set'}` })\n||`);
        console.log('|| ? -> Input date (year-mm-dd)');
        console.log('|| c -> Clear date');
        console.log('||\n|| e -> Go back\n||');
        
        m = await takeUserInput(); // take user input

        if (isValidDate(m)) { // is valid date
            list_status.start_date = m; 
        } else if (m === 'c') { // clear date
            list_status.start_date = '0000-00-00';
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateFinishDateMenu (list_status) {
    const finishDateBeforeChange = list_status.finish_date;
    let m = 0;

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Update finish date (${finishDateBeforeChange === list_status.finish_date ? `current: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'not set'}` : 
                                                                                                         `update to: ${list_status.finish_date} - from: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'not set'}` })\n||`);
        console.log('|| ? -> Input date (\"year-mm-dd\")');
        console.log('|| c -> Clear date');
        console.log('||\n|| e -> Go back\n||');
        
        m = await takeUserInput(); // take user input

        if (isValidDate(m)) { // is valid date
            list_status.finish_date = m; 
        } else if (m === 'c') { // clear date
            list_status.finish_date = '0000-00-00';
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

function isValidDate (date) {
    // year-mm-dd including the dashes --- e.g. '2024-07-12'
    // allows year = 1996-2999
    // allows mm   = 01-12
    // allows dd   = 01-31
    // currently does not take in account leap years or month lengths
    
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
    // 
    // Thanks for coming into my TED talk!!!

    // TODO: 
    // - make it so that leap years and correct month lenghts are taken into 
    //   account e.g. current system allows dates such as yyyy-02-31 although
    //   february is never 31 days of length 

    return /^(199[6-9]{1}|2[0-1]{1}[0-9]{2})-(0[1-9]{1}|1[0-2]{1}|00)-(0[1-9]{1}|[1-2]{1}[0-9]{1}|3[0-1]{1}|00)$/.test(date); 
}

async function updateIsReMenu (list_status) {
    const isReBeforeChange = getIsRe(list_status);
    let m = 0;

    while (m !== 'e') 
    {
        console.log(`\n||\n|| Update ${getType(list_status) ? 're-reading' : 're-watching'} (${isReBeforeChange === getIsRe(list_status) ? `current: ${isReBeforeChange ? 'yes' : 'no'}` : 
                                                                                                                                               `update to: ${getIsRe(list_status) ? 'yes' : 'no'} - from: ${isReBeforeChange ? 'yes' : 'no'}`})\n||`);
        console.log('|| 0 -> no');
        console.log('|| 1 -> yes');
        console.log('||\n|| e -> Go back\n||');

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

async function updateCommentsMenu (entry) {

}

async function searchMALMenu() {
    let m = 0;

    while (m !== 'e') 
    {
        
    }
}

export { menuMAL };