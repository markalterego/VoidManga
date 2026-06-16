import { filehandle } from "../filehandling/filehandle.js";
import { takeUserInput, truncateString, capitalFirstLetterString, printMenuOptions, escapeRegex } from "../helpers/functions.js";
import { animeStatus, mangaStatus, SYM, MESSAGE } from "../helpers/export.js";
import { updatePageDetails, pageContent, pagingOptions } from "./menuLogMangadex.js";
import { fetchMALUserLists, updateMAL, searchMAL } from "../controller/controllerMAL.js";
import { logDataDeepMenu } from "./menuLogDataDeep.js";

const ANIME = 0;
const MANGA = 1;
let lists = null; 
let options = null;

async function menuMAL (l, config) {
    const TRAVERSE_DATA = 0;
    const FETCH_DATA = 1;

    let input = null;

    options = config.menuMALOptions; // reference to config.menuMALOptions
    lists = l; // reference to lists

    if (options.fetchMALOnMenuOpen) {
        lists = await fetchMALUserLists(lists, options.logAuthURL); // searches and returns MAL lists
        filehandle('mal', lists);
    }

    while (input !== 'e') 
    {
        printMenuOptions(
            'MyAnimeList options', 
            [
                ['Your lists'],
                ['Fetch MAL'],
                '_'
            ]
        );

        input = await takeUserInput(true); 
        
        if (input === TRAVERSE_DATA) {
            await traverseMALMenu(); // traverse local MAL lists
        } else if (input === FETCH_DATA) {
            await fetchMALMenu(config.fetchMALOptions); // fetch MAL API
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }

    return lists;
}

async function traverseMALMenu () {
    const TRAVERSE_ANIME = 0;
    const TRAVERSE_MANGA = 1;
    const SEARCH_LISTS = 2;
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Your MyAnimeList',
            [
                ['Anime list'], 
                ['Manga list'], 
                ['Search lists'],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === TRAVERSE_ANIME) {
            await traverseStatus(ANIME); // anime list
        } else if (input === TRAVERSE_MANGA) {
            await traverseStatus(MANGA); // manga list
        } else if (input === SEARCH_LISTS) {
            await searchListsMenu(); // search lists
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function fetchMALMenu (fetchMALOptions) {
    const FETCH_LISTS = 0;
    const SEARCH_MAL = 1;
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Fetch MAL',
            [
                ['Fetch lists'], 
                ['Search MAL'],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === FETCH_LISTS) {
            lists = await fetchMALUserLists(lists, options.logAuthURL); // searches MAL user lists
            filehandle('mal', lists);
        } else if (input === SEARCH_MAL) {
            lists = await searchMAL(lists, fetchMALOptions, options.logAuthURL); // searches MAL for titles
            filehandle('mal', lists);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseEntry (typeIndex, statusIndex, entryArr) {
    const status = !entryArr ? (typeIndex === ANIME ? animeStatus[statusIndex] : mangaStatus[statusIndex]) : null;
    const entries = !entryArr ? lists[typeIndex][statusIndex] : entryArr;
    let input = 0, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }; 

    // TODO: 
    // - fix bug where if entryArr overwrites entries and user updates entries through
    //   updateEntryMenu, returns to this menu and again selects updateEntryMenu, the
    //   data at entry doesn't reflect the updated changes but rather the updates at the
    //   point of entries assignment ... (I think due to entryArr breaking reference or something) 

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
            pageFooter,
            '_',
            '_',
            ['t', `Toggle paging [${options.enablePagingEntries ? 'x' : ''}]`], 
            (options.enablePagingEntries ? [SYM.CHANGE_PAGE, 'Next/Previous page'] : null)
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateEntryMenu (entry, l = null, logAuthURL = null) {
    // parameters 'l' (standing for lists) and logAuthURL are supposed 
    // to be used when calling updateEntryMenu from outside menuMAL.js 

    const STATUS = 0, SCORE = 1, EPISODES = 2, VOLUMES = 2, CHAPTERS = 3;
    const append = getType(entry.list_status); // manga adds one selectable option
    const START_DATE = 3 + append, FINISH_DATE = 4 + append, ISRE = 5 + append, COMMENTS = 6 + append;

    const PADEND = 12, PADSTART = 0, NOT_SET = 'Not set';
    let input = null, changedFields = [], listsReference = l ?? lists;

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


        const s1_episodes = 'Episodes';
        const s2_episodes = `${num_episodes_watched} / ${num_episodes > 0 ? num_episodes : '?'}`
        const s_episodes  = s1_episodes.padEnd(PADEND, ' ') + ': ' + s2_episodes.padStart(PADSTART, ' '); 
        
        const s1_chapters = 'Chapters';
        const s2_chapters = `${num_chapters_read} / ${num_chapters > 0 ? num_chapters : '?'}`;
        const s_chapters  = s1_chapters.padEnd(PADEND, ' ') + ': ' + s2_chapters.padStart(PADSTART, ' '); 

        const s1_volumes = 'Volumes';
        const s2_volumes = `${num_volumes_read} / ${num_volumes > 0 ? num_volumes : '?'}`;
        const s_volumes  = s1_volumes.padEnd(PADEND, ' ') + ': ' + s2_volumes.padStart(PADSTART, ' ');
        
        const s_progress = getType(list_status) === ANIME ? [[s_episodes]] : [[s_volumes], [s_chapters]];


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
                ...s_progress, 
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
            ...(getType(list_status) === ANIME
                ? {[EPISODES]: { field: 'episodes', updater: updateEpisodesMenu }}  
                : {[VOLUMES]:  { field: 'volumes',  updater: updateVolumesMenu  }, [CHAPTERS]: { field: 'chapters', updater: updateChaptersMenu }}
            ),
            [START_DATE]:  { field: 'start_date',                                      updater: updateStartDateMenu  },
            [FINISH_DATE]: { field: 'finish_date',                                     updater: updateFinishDateMenu },
            [ISRE]:        { field: (is_rereading ? 'is_rereading' : 'is_rewatching'), updater: updateIsReMenu       },
            [COMMENTS]:    { field: 'comments',                                        updater: updateCommentsMenu   }
        };

        const selected = selectableFields[input];

        if (selected) { 
            const { field, updater } = selected;
            const old_list_status = structuredClone(list_status);
            const requiresEntryAsParameter = ['episodes', 'volumes', 'chapters'].some(v => v === field);
            requiresEntryAsParameter ? await updater(entry_clone) : await updater(list_status);
            // check for updates
            changedFields = Object.entries(list_status).filter(([key, _]) => { 
                const oldVal = old_list_status[key];
                const newVal = list_status[key];
                // arrays compared as string because arr[1] === arr[2] would be true
                if (Array.isArray(newVal)) return JSON.stringify(oldVal) !== JSON.stringify(newVal);
                else return oldVal !== newVal;
            });
        } else if (input === 'l') {
            await logDataDeepMenu(entry, entryTitle, false, true);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }

        // update changes
        if (changedFields.length) {
            listsReference = await updateMAL(listsReference, changedFields, entry, logAuthURL ?? options.logAuthURL); // update MAL entry
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateEpisodesMenu (entry) {
    const { list_status, node: { num_episodes } } = entry;
    const { num_episodes_watched } = list_status;
    let input = null;

    while (input !== 'e') 
    {
        const episodesLabel = `Update episodes`;
        const progressLabel = num_episodes_watched === list_status.num_episodes_watched 
            ? `current: ${num_episodes_watched} / ${num_episodes}`
            : `update to: ${list_status.num_episodes_watched} / ${num_episodes} - from: ${num_episodes_watched} / ${num_episodes}`; 
        const header = `${episodesLabel} (${progressLabel})`;

        const episodes = num_episodes > 0 ? num_episodes : '?';
        const optionsArray = [
            [SYM.ADJUST, 'Increase/Decrease progress'], 
            ['?', `Input a value [0 - ${episodes}]`], 
            '_'
        ];

        printMenuOptions(
            header,
            optionsArray
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input <= num_episodes || !num_episodes && input >= 0) {
            list_status.num_episodes_watched = input;
        } else if (input === '+' && (!num_episodes || list_status.num_episodes_watched + 1 <= num_episodes)) {
            list_status.num_episodes_watched++;
        } else if (input === '-' && list_status.num_episodes_watched - 1 >= 0) {
            list_status.num_episodes_watched--;
        } else if (input === '++' && num_episodes) {
            list_status.num_episodes_watched = num_episodes;
        } else if (input === '--') {
            list_status.num_episodes_watched = 0;
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateVolumesMenu (entry) {
    const { list_status, node: { num_volumes } } = entry;
    const { num_volumes_read } = list_status;
    let input = null;

    while (input !== 'e') 
    {
        const volumesLabel = `Update volumes`;
        const progressLabel = num_volumes_read === list_status.num_volumes_read 
            ? `current: ${num_volumes_read} / ${num_volumes}`
            : `update to: ${list_status.num_volumes_read} / ${num_volumes} - from: ${num_volumes_read} / ${num_volumes}`; 
        const header = `${volumesLabel} (${progressLabel})`;

        const volumes = num_volumes > 0 ? num_volumes : '?';
        const optionsArray = [
            [SYM.ADJUST, 'Increase/Decrease progress'], 
            ['?', `Input a value [0 - ${volumes}]`], 
            '_'
        ];

        printMenuOptions(
            header, 
            optionsArray
        );

        input = await takeUserInput(true);

        if (input >= 0 && input <= num_volumes || !num_volumes && input >= 0) {
            list_status.num_volumes_read = input;
        } else if (input === '+' && (!num_volumes || list_status.num_volumes_read + 1 <= num_volumes)) {
            list_status.num_volumes_read++;
        } else if (input === '-' && list_status.num_volumes_read - 1 >= 0) {
            list_status.num_volumes_read--;
        } else if (input === '++' && num_volumes) {
            list_status.num_volumes_read = num_volumes;
        } else if (input === '--') {
            list_status.num_volumes_read = 0;
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateChaptersMenu (entry) {
    const { list_status, node: { num_chapters } } = entry;
    const { num_chapters_read } = list_status;
    let input = null;

    while (input !== 'e') 
    {
        const chaptersLabel = `Update chapters`;
        const progressLabel = num_chapters_read === list_status.num_chapters_read 
            ? `current: ${num_chapters_read} / ${num_chapters}`
            : `update to: ${list_status.num_chapters_read} / ${num_chapters} - from: ${num_chapters_read} / ${num_chapters}`; 
        const header = `${chaptersLabel} (${progressLabel})`;

        const chapters = num_chapters > 0 ? num_chapters : '?';
        const optionsArray = [
            [SYM.ADJUST, 'Increase/Decrease progress'], 
            ['?', `Input a value [0 - ${chapters}]`], 
            '_'
        ];

        printMenuOptions(
            header, 
            optionsArray
        );

        input = await takeUserInput(true);

        if (input >= 0 && input <= num_chapters || !num_chapters && input >= 0) {
            list_status.num_chapters_read = input;
        } else if (input === '+' && (!num_chapters || list_status.num_chapters_read + 1 <= num_chapters)) {
            list_status.num_chapters_read++;
        } else if (input === '-' && list_status.num_chapters_read - 1 >= 0) {
            list_status.num_chapters_read--;
        } else if (input === '++' && num_chapters) {
            list_status.num_chapters_read = num_chapters;
        } else if (input === '--') {
            list_status.num_chapters_read = 0;
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function getType (list_status) {
    return list_status.num_episodes_watched === undefined ? MANGA : ANIME;
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
        console.log('\n\n  The given year is not a number');
        return false;
    } else if (Number.isNaN(mm)) {
        console.log('\n\n  The given month is not a number');
        return false;
    } else if (Number.isNaN(dd)) {
        console.log('\n\n  The given day is not a number');
        return false;
    }

    // date doesn't follow Year -> Month -> Day order
    if (yyyy === 0 && mm > 0) { 
        console.log(`\n\n  Given year can't be set to 0 when given month is over 0`);
        return false;
    } else if (mm === 0 && dd > 0) { 
        console.log(`\n\n  Given month can't be set to 0 when given day is over 0`);
        return false;
    } else if (yyyy > 0 && (yyyy < 1000 || yyyy > 2999)) {
        console.log('\n\n  Given year has to be between 1000 - 2999');
        return false;
    }

    // check date normally
    if (mm > 0 && dd > 0) {
        if (mm > 12) { // month > 12
            console.log('\n\n  Given month has to be between 1 - 12');
            return false;
        } else if (dd > 31) { // day > 31
            console.log('\n\n  Given day has to be between 1 - 31');
            return false;
        } else if (dd > daysByMonth[mm-1]) { // invalid day for month
            console.log('\n\n  Given date is invalid for given month');
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
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
    const commentsBeforeChange = list_status.comments, MIN_LENGTH = 3; // min comment length
    let input = '';
    const lowerCaseString = (string) => string?.toLowerCase(); 

    while (lowerCaseString(input) !== 'e') 
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

        input = await takeUserInput(false, true, { useMixedCase: true });
        
        if (lowerCaseString(input) === 'c') { // clear comment
            list_status.comments = ''; 
        } else if (lowerCaseString(input) !== 'e' && input?.length < MIN_LENGTH) { 
            console.log(`\n\n  Minimum required comment length: ${MIN_LENGTH} characters`);
        } else if (lowerCaseString(input) !== 'e') { // comment is valid
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
            MESSAGE.print(MESSAGE.INVALID_INPUT);
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
                console.log('\n\n  No matches found');
            } else { // traverse results
                await traverseEntry(null, null, matching);
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function selectNodesFromFetchResults (searches, lists) {        
    const allSearchResults = searches.flatMap(({ searchResults }) => searchResults); 
    let input = null;
    let selectedNodes = [];

    const appendSelectedNode = (node) => { 
        const isDuplicate = selectedNodes.some(selected => selected.node.id === node.id); // compare by id
        if (!isDuplicate) selectedNodes.push({ node: node });                             // append node
    }; 

    // --- formatting searchSection ---
    
    let index = 0;
    
    const searchSection = searches.flatMap(({ searchResults, searchTitle }, sIndex) => {
        const mappedResults = searchResults.map(({ node }) => {
            const foundTitle     = node.title;
            const typeLabel      = node.num_episodes >= 0 ? '* Anime' : '* Manga';
            const formattedTitle = `${node.title} ${typeLabel}`;
            return [index++, formattedTitle];
        });
        const noResults = [['?', 'No results found']];
        const formattedResults = searchResults.length ? mappedResults : noResults;
        return [ 
            [`[${searchTitle}]`, null, '\n'], 
            ...formattedResults,
            (sIndex < searches.length - 1 ? '_' : null) // empty line between each result
        ];
    });

    const resultCount = index;

    while (input !== 'a' && input !== 'e')
    {
        // --- formatting selected titles ---

        const selectedTitles = selectedNodes.map(({ node }) => 
            [null, '-', node.title]
        ); 
        const noTitles = [[null, '-', 'No selected titles']];
        const selectedTitlesSection = selectedTitles.length ? selectedTitles : noTitles;

        // --- assemble menu ---

        const optionsArray = [
            '_', '_',
            ...searchSection,
            '_', '_',
            ['Selected titles', null, null],
            '_',
            ...selectedTitlesSection,
            '_', '_',
            ['a', 'Add selected titles to your MAL list'],
            [SYM.INCLUDE, 'Include all titles'],
            ['c', 'Clear selected titles']
        ];

        printMenuOptions(
            null,
            optionsArray,
            { printHeader: false }
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < resultCount) { // append selected
            appendSelectedNode(allSearchResults[input].node);
        } else if (input === '+') { // append all 
            allSearchResults.forEach(obj => appendSelectedNode(obj.node));
        } else if (input === 'a' && !selectedNodes.length) { 
            console.log('\n\n  Nothing selected to be added to your MAL lists');
            input = null;
        } else if (input === 'c' || input === 'e') { // empty selected
            selectedNodes = [];
        } else if (input !== 'a') { // invalid input
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }

    return selectedNodes;
}

export { menuMAL, updateEntryMenu, selectNodesFromFetchResults };