import { takeUserInput, capitalFirstLetterString, printMenuOptions, escapeRegex, 
         isLeapYear, padString, searchMALDisplay, createQuickSearch, isMatchingAtStart} from "../helpers/functions.js";
import { MESSAGE, COMMANDS, DEFAULT_fetchMALOptions, DEFAULT_menuMALOptions } from "../helpers/export.js";
const { MAL, PAGE } = COMMANDS;
import { ANIME, MANGA, getId, getStatus, getType, animeStatus, mangaStatus, getTypeString, 
         getReValue, getPriorityString, getReValueString, priority_values, getTagsString, 
         getNumTimesRe, re_values } from "../helpers/entryHelpers.js";
import { updatePageDetails, pageContent, pagingOptions, isPagingInput } from '../helpers/pageHelpers.js';
import { fetchMALUserLists, updateMAL, searchMAL, deleteMAL } from "../controller/controllerMAL.js";
import { logDataDeepMenu } from "./menuLogDataDeep.js";
import cliTruncate from "cli-truncate";
import { updateConfig } from '../controller/controllerConfig.js';
import { filehandle } from "../filehandling/filehandle.js";

let lists = null; 
let config = null;
let menuMALOptions = null;
let fetchMALOptions = null;

async function menuMAL (l, c) {
    const TRAVERSE_DATA = 0;
    const SEARCH_MAL = 1;
    let input = null;

    config = c; 
    ({ menuMALOptions, fetchMALOptions } = config);
    lists = l; 

    if (menuMALOptions.fetchMALOnMenuOpen) {
        lists = await fetchMALUserLists(lists, menuMALOptions.logAuthURL); // searches and returns MAL lists
    }

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'MyAnimeList options', 
            [
                ['Your lists'],
                ['Search MAL'],
                '_',
                [MAL.FETCH_USER_LISTS, 'Fetch MAL lists']
            ]
        );

        input = await takeUserInput(true); 
        
        if (input === TRAVERSE_DATA) {
            await traverseMALMenu(); // traverse user MAL lists
        } else if (input === SEARCH_MAL) {
            await searchMALMenu(); // fetch anime (and/or) manga from MAL
        } else if (input === MAL.FETCH_USER_LISTS) {
            lists = await fetchMALUserLists(lists, menuMALOptions.logAuthURL); // searches MAL user lists
        } else if (input !== COMMANDS.EXIT) {
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

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function searchMALMenu() {
    const SEARCH_MAL = 0;
    const SEARCH_OPTIONS = 1;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Search MAL',
            [
                ['Search MAL'],
                ['Change search options'],
                '_',
            ],
            { displayFn: () => searchMALDisplay({options: fetchMALOptions}) }
        );

        input = await takeUserInput(true);

        if (input === SEARCH_MAL) {
            lists = await searchMAL(lists, fetchMALOptions, menuMALOptions.logAuthURL); // searches MAL for titles
        } else if (input === SEARCH_OPTIONS) {
            await updateSearchMALOptionsMenu(); // change search options
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateSearchMALOptionsMenu() { 
    const SEARCH_QUEUE = 0;
    const SEARCH_TYPE = 1;
    const SEARCH_LIMIT = 2;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const header = 'Change fetch options';
        const optionsArray = [
            ['Manage search queue'],
            ['Search type'],
            ['Search size'],
            '_',
            [COMMANDS.RESET_DEFAULT_OPTIONS, 'Reset default options']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => searchMALDisplay({options: fetchMALOptions}) }
        );

        input = await takeUserInput(true);
    
        if (input === SEARCH_QUEUE) {
            await updateSearchStrings(); // fetchMALOptions.searchStrings
        } else if (input === SEARCH_TYPE) {
            await updateSearchType(); // fetchMALOptions.searchType
        } else if (input === SEARCH_LIMIT) {
            await updateSearchLimit(); // fetchMALOptions.limit
        } else if (input === COMMANDS.RESET_DEFAULT_OPTIONS) {
            config.fetchMALOptions = JSON.parse(JSON.stringify(DEFAULT_fetchMALOptions)); // reset default options
            fetchMALOptions = config.fetchMALOptions; // re-referencing fetchMALOptions
            filehandle('config', config);
            MESSAGE.print(MESSAGE.RESET_OPTIONS);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateSearchStrings() {
    const MIN_LENGTH = 3;
    let input = null;

    while (input?.toLowerCase() !== COMMANDS.EXIT) 
    {        
        const optionsArray = [
            ['?', 'Add to queue'],
            '_',
            [COMMANDS.CLEAR, 'Clear queue']
        ];

        printMenuOptions(
            'Manage search queue',
            optionsArray,
            { displayFn: () => searchMALDisplay({options: fetchMALOptions}) }
        );

        input = await takeUserInput(false, true, { useMixedCase: true });

        if (input?.toLowerCase() === COMMANDS.CLEAR) {
            updateConfig(config, () => fetchMALOptions.searchStrings = []);
        } else if (typeof input === 'string' && input.length >= MIN_LENGTH) { // set search string
            updateConfig(config, () => fetchMALOptions.searchStrings = [...new Set(fetchMALOptions.searchStrings).add(input)]);
        } else if (input?.toLowerCase() !== COMMANDS.EXIT) {
            console.log(`\n\n  Minimum required search length: ${MIN_LENGTH} characters`);
        }
    }
}

async function updateSearchType() {
    const TYPE_BOTH = 0;
    const TYPE_ANIME = 1;
    const TYPE_MANGA = 2;
    let input = null;

    while (input !== COMMANDS.EXIT)
    {
        const { searchType } = fetchMALOptions;

        printMenuOptions(
            'Select search type',
            [
                [`Search anime & manga [${searchType === 'both' ? 'x' : ''}]`],
                [`Search anime         [${searchType === 'anime' ? 'x' : ''}]`],
                [`Search manga         [${searchType === 'manga' ? 'x' : ''}]`],
                '_'
            ],
            { displayFn: () => searchMALDisplay({options: fetchMALOptions}) }
        );

        input = await takeUserInput(true);

        if (input === TYPE_BOTH) {
            updateConfig(config, () => fetchMALOptions.searchType = 'both');
        } else if (input === TYPE_ANIME) {
            updateConfig(config, () => fetchMALOptions.searchType = 'anime');
        } else if (input === TYPE_MANGA) {
            updateConfig(config, () => fetchMALOptions.searchType = 'manga');
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateSearchLimit() {
    const MIN = 1; 
    const MAX = 100;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Change search size',
            [
                ['?', 'Input a value between 1-100'],
                '_'
            ],
            { displayFn: () => searchMALDisplay({options: fetchMALOptions}) }
        );

        input = await takeUserInput(true);

        if (input >= MIN && input <= MAX) {
            updateConfig(config, () => fetchMALOptions.limit = input);
        } else if (input > MAX || input < MIN) {
            console.log(`\n\n  The given value has to be be between ${MIN}-${MAX}`);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseStatus (typeIndex) {
    const statuses = typeIndex === ANIME ? animeStatus : mangaStatus; // list of statuses for type
    let input = null; 

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseEntry (typeIndex, statusIndex, searchResults) {
    
    // function is used for: 
    // - traversing lists[typeIndex][statusIndex] 
    // - traversing searchResults

    const quickSearch = createQuickSearch();
    const status = searchResults ? null : (typeIndex === ANIME ? animeStatus[statusIndex] : mangaStatus[statusIndex]);
    const header = searchResults ? `Search results` : `Status: ${capitalFirstLetterString(status)}`;
    
    let input = null;
    let pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }; 
    let entries = searchResults ?? lists[typeIndex][statusIndex];
    let sortedEntries;
    let pagedEntries;

    // TODO: 
    // - in case searchResults is defined, explicitly append some
    //   additional info next to an entry e.g. ('anime: plan_to_watch')
    //   so that user can differentiate '0 -> One Piece' (the anime) and 
    //   '1 -> One Piece' (the manga)  


    while (input !== COMMANDS.EXIT) 
    {
        const shouldSort = input === null || quickSearch.getAndResetJustUpdated(input);
        sortedEntries = shouldSort ? sortEntries(entries, { searchString: quickSearch.searchString }) : sortedEntries;
        pageDetails = menuMALOptions.enablePagingEntries ? updatePageDetails(pageDetails, sortedEntries) : pageDetails;
        pagedEntries = pageContent(sortedEntries, pageDetails.currentPageIndex, menuMALOptions.enablePagingEntries);

        const formattedHeader = `${header} ${quickSearch.searchLabel}`;
        const entryTitles = pagedEntries.map(e => [e.node.title]);
        const pageFooter = entryTitles.length && menuMALOptions.enablePagingEntries ? 'p' : null;
        const titles = entryTitles.length ? [...entryTitles] : [['?', 'No entries found']];

        const optionsArray = [
            '-', '_',
            ...titles,
            pageFooter,
            '_', '_',
            [PAGE.TOGGLE, `Toggle paging [${menuMALOptions.enablePagingEntries ? 'x' : ''}]`], 
            ...(menuMALOptions.enablePagingEntries ? [[PAGE.NEXT, 'Next page'], [PAGE.PREVIOUS, 'Previous page']] : [null])
        ];

        printMenuOptions(
            formattedHeader,
            optionsArray, 
            { pageDetails }
        );

        input = await takeUserInput(true); 
        
        if (input >= 0 && input < pagedEntries.length) {
            const entry = pagedEntries[input]; // reference to selected entry
            const entryExistsAtLists = await updateEntryMenu(entry); // update stuff related to selected entry

            // If an entry was deleted through updateEntryMenu 
            // and entries was initialized with searchResults (SR),
            // entry must be manually spliced from SR in order for
            // SR to reflect results existing at lists

            if (searchResults && !entryExistsAtLists) {
                const idx = entries.indexOf(entry);
                if (idx !== -1) entries.splice(idx, 1);
            }

            // If an entry was deleted through updateEntryMenu
            // while quickSearch was active, sortedEntries (SE) 
            // must be manually spliced in order for SE to reflect
            // results existing at lists 

            if (quickSearch.searchString && !entryExistsAtLists) {
                const idx = sortedEntries.indexOf(entry);
                if (idx !== -1) sortedEntries.splice(idx, 1);
            }
        } else if (input === PAGE.TOGGLE) { // toggle paging on/off
            updateConfig(config, () => menuMALOptions.enablePagingEntries = !menuMALOptions.enablePagingEntries);
        } else if (menuMALOptions.enablePagingEntries && isPagingInput(input)) { // paging options
            pageDetails = pagingOptions(input, sortedEntries, pageDetails);
        } else if (quickSearch.isSearchCommand(input)) { // quick search/clear quick search
            quickSearch.updateSearchString(input);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function sortEntries (entries, { searchString = null } = {}) {
    let sortedEntries = entries;
    // filter by searchString
    if (searchString) {
        sortedEntries = sortedEntries.filter(e => isMatchingAtStart(searchString, e.node.title));
    }
    return sortedEntries;
}

async function updateEntryMenu (entry, l = null, logAuthURL = null) {

    // parameters 'l' (standing for lists) and logAuthURL are supposed 
    // to be used when calling updateEntryMenu from outside menuMAL.js 

    const STATUS   = 0; 
    const SCORE    = 1;
    const EPISODES = 2;
    const VOLUMES  = 2;
    const CHAPTERS = 3;

    const append = getType(entry); // manga adds one selectable option
    
    const START_DATE   = 3 + append;
    const FINISH_DATE  = 4 + append;
    const IS_RE        = 5 + append;
    const NUM_TIMES_RE = 6 + append;
    const RE_VALUE     = 7 + append;
    const COMMENTS     = 8 + append;
    const PRIORITY     = 9 + append;
    const TAGS         = 10 + append;

    // PADEND && PADSTART mean the LENGTH OF
    // STRING after padding at START/END

    const PADEND   = getType(entry) === ANIME ? 15 : 14; 
    const PADSTART = 0; 
    const NOT_SET  = 'Not set';
    const COMMENTS_LENGTH = 15;

    let input = null;
    let listsReference = l ?? lists;
    let pushUpdates = false;
    let draft = structuredClone(entry); 
    let entryExists = null;

    const formatString = (s_left, s_right) => `${padString(s_left, PADEND, ' ')}: ${padString(s_right, PADSTART, ' ', true)}`; 
    const draftUpdated = (list_status, old_list_status) => {
        return Object.keys(list_status).some(key => {
            const oldVal = old_list_status[key];
            const newVal = list_status[key]; 
            // arrays compared as string because arr[1, 2, 3] === arr[33, 1] would be true
            return Array.isArray(newVal) ? JSON.stringify(oldVal) !== JSON.stringify(newVal) : oldVal !== newVal;
        });
    }
    const isEntryAtLists = () => listsReference[getType(draft)].flat(Infinity).some(e => getId(e) === getId(draft));

    // TODO: 
    // - make it so that start/finish dates are automatically applied
    //   upon e.g. the first episode/chapter read + setting the series
    //   as completed/updating last chapter of series etc...

    // Draft is updated within deeper updateMenu functions, 
    // after user returns to this function (updateEntryMenu), draft
    // is compared to the original entry. If any value of draft 
    // differs from the original entry, all values from draft 
    // are passed to updateMAL. If update is successful, draft
    // is cloned onto entry, if update failed, entry is cloned
    // onto draft, essentially reverting to latest synced edit. 

    while (input !== COMMANDS.EXIT) 
    {
        entryExists = isEntryAtLists();
        const { num_episodes, num_chapters, num_volumes, title } = draft.node; 
        const list_status = draft.list_status;
        const { status, is_rereading, is_rewatching, num_volumes_read, 
                num_chapters_read, num_episodes_watched, score, updated_at,
                start_date, finish_date, comments, priority, num_times_reread,
                num_times_rewatched, reread_value, rewatch_value, tags } = list_status;
        
        // --- formatting printMenuOptions params 

        const s_status     = formatString('Status', capitalFirstLetterString(status));
        const s_score      = formatString('Score', !!score ? score : NOT_SET);
        const s_episodes   = formatString('Episodes', `${num_episodes_watched} / ${!!num_episodes ? num_episodes : '?'}`);
        const s_chapters   = formatString('Chapters', `${num_chapters_read} / ${!!num_chapters ? num_chapters : '?'}`);
        const s_volumes    = formatString('Volumes', `${num_volumes_read} / ${!!num_volumes ? num_volumes : '?'}`);
        const s_startDate  = formatString('Start date', !!start_date ? start_date : NOT_SET);
        const s_finishDate = formatString('Finish date', !!finish_date ? finish_date : NOT_SET);
        const s_comments   = formatString('Comments', !!comments ? cliTruncate(comments, COMMENTS_LENGTH) : NOT_SET);
        const s_priority   = formatString('Priority', capitalFirstLetterString(getPriorityString(draft)));
        const s_reLabel    = capitalFirstLetterString(getType(draft) === ANIME ? 're-watch' : 're-read');
        const s_isRe       = formatString(`${s_reLabel}ing`, ((is_rewatching ?? is_rereading) ? 'Yes' : 'No')); 
        const s_numTimesRe = formatString(`${s_reLabel} count`, num_times_rewatched ?? num_times_reread);
        const s_reValue    = formatString(`${s_reLabel} value`, capitalFirstLetterString(getReValueString(entry)));        
        const s_tags       = formatString('Tags', getTagsString(entry));
        const s_progress   = getType(draft) === ANIME ? [[s_episodes]] : [[s_volumes], [s_chapters]];

        const s_toggleEntry = entryExists ? [MAL.ENTRY_DELETE, 'Delete entry from lists'] : [MAL.ENTRY_ADD, 'Add entry to lists'];
        const s_log         = [COMMANDS.LOG, 'Log entry'];

        const header = `${entryExists ? 'UPDATE' : 'ADD'} - ${title} (${capitalFirstLetterString(getTypeString(draft))})`;
        const optionsArray = [
            '-', '_',
            [s_status],
            [s_score], 
            ...s_progress, 
            [s_startDate], 
            [s_finishDate], 
            [s_isRe], 
            [s_numTimesRe],
            [s_reValue],
            [s_comments], 
            [s_priority],
            [s_tags],
            '_', '-', '_',
            s_toggleEntry,
            s_log
        ];
        const paddedOptionsArray = (() => { 
            let i = 0;
            return optionsArray.map(o => Array.isArray(o) && o.length === 1 ? [(String(i).length === 1 ? `${i++} ` : i++ ), o] : o);
        })();
        
        printMenuOptions(
            header,
            paddedOptionsArray
        );

        input = await takeUserInput(true); 

        // --- selectable fields mapped to refer to their corresponding updateMenu function
        
        const updaterFunctions = {
            [STATUS]:       updateStatusMenu,
            [SCORE]:        updateScoreMenu,
            ...(getType(draft) === ANIME ? { [EPISODES]: updateEpisodesMenu } : { [VOLUMES]:  updateVolumesMenu, [CHAPTERS]: updateChaptersMenu }),
            [START_DATE]:   updateStartDateMenu,
            [FINISH_DATE]:  updateFinishDateMenu,
            [IS_RE]:        updateIsReMenu,
            [NUM_TIMES_RE]: updateNumTimesReMenu,
            [RE_VALUE]:     updateReValueMenu, 
            [COMMENTS]:     updateCommentsMenu,
            [PRIORITY]:     updatePriorityMenu,
            [TAGS]:         updateTagsMenu
        };

        const updater = updaterFunctions[input];

        // 1. entry not at lists, need to manually push
        // 2. entry at lists, push automatically on each update

        if (updater) { 
            const old_list_status = structuredClone(list_status);
            await updater(draft);
            pushUpdates = entryExists && draftUpdated(list_status, old_list_status);
        } else if (input === COMMANDS.LOG) {
            await logDataDeepMenu(entry, title, false, true);
        } else if (!entryExists && input === MAL.ENTRY_ADD) { 
            pushUpdates = true;
        } else if (entryExists && input === MAL.ENTRY_DELETE) {
            const { lists: updatedLists, success } = await deleteMAL(listsReference, draft, logAuthURL ?? menuMALOptions.logAuthURL);
            listsReference = updatedLists;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }

        // update changes
        if (pushUpdates) {
            pushUpdates = false;  
            const { lists: updatedLists, success, newEntry } = await updateMAL(listsReference, draft, entry, logAuthURL ?? menuMALOptions.logAuthURL); // update MAL entry
            listsReference = updatedLists;
            if (success) entry = newEntry;
            draft = structuredClone(entry);
        } 
    }
    return entryExists;
}

async function updateStatusMenu (entry) {
    const list_status = entry.list_status;
    const statuses = list_status.num_episodes_watched !== undefined ? animeStatus : mangaStatus; // arr of available statuses
    const statusBeforeChange = list_status.status;
    let input = null;
    
    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Pick from available statuses (${statusBeforeChange === list_status.status ? `current: ${list_status.status}` : 
                                                                                         `update to: ${list_status.status} - from: ${statusBeforeChange}`})`,
            [...statuses.map(status => [capitalFirstLetterString(status)]), '_']
        )
        
        input = await takeUserInput(true); // take whole num as user input

        if (input >= 0 && input < statuses.length) {
            list_status.status = statuses[input]; // update status
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateScoreMenu (entry) {
    const list_status = entry.list_status;
    const scoreBeforeChange = list_status.score;
    let input = null;
    
    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Pick a score (${scoreBeforeChange === list_status.score ? `current: ${list_status.score}` :
                                                                       `update to: ${list_status.score} - from: ${scoreBeforeChange}`})`,
            [['?', 'Input a value between 0-10'], '_']
        );

        input = await takeUserInput(true); // take whole num as user input

        if (input >= 0 && input <= 10) {
            list_status.score = input; // save user input
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateEpisodesMenu (entry) {
    const { list_status, node: { num_episodes } } = entry;
    const { num_episodes_watched } = list_status;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const episodesLabel = `Update episodes`;
        const progressLabel = num_episodes_watched === list_status.num_episodes_watched 
            ? `current: ${num_episodes_watched} / ${num_episodes}`
            : `update to: ${list_status.num_episodes_watched} / ${num_episodes} - from: ${num_episodes_watched} / ${num_episodes}`; 
        const header = `${episodesLabel} (${progressLabel})`;

        const episodes = num_episodes > 0 ? num_episodes : '?';
        const optionsArray = [
            [MAL.PROGRESS_INCREASE, 'Increase progress'],
            [MAL.PROGRESS_DECREASE, 'Decrease progress'], 
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
        } else if (input === MAL.PROGRESS_INCREASE && (!num_episodes || list_status.num_episodes_watched + 1 <= num_episodes)) {
            list_status.num_episodes_watched++;
        } else if (input === MAL.PROGRESS_DECREASE && list_status.num_episodes_watched - 1 >= 0) {
            list_status.num_episodes_watched--;
        } else if (input === MAL.PROGRESS_MAX && num_episodes) {
            list_status.num_episodes_watched = num_episodes;
        } else if (input === MAL.PROGRESS_MIN) {
            list_status.num_episodes_watched = 0;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateVolumesMenu (entry) {
    const { list_status, node: { num_volumes } } = entry;
    const { num_volumes_read } = list_status;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const volumesLabel = `Update volumes`;
        const progressLabel = num_volumes_read === list_status.num_volumes_read 
            ? `current: ${num_volumes_read} / ${num_volumes}`
            : `update to: ${list_status.num_volumes_read} / ${num_volumes} - from: ${num_volumes_read} / ${num_volumes}`; 
        const header = `${volumesLabel} (${progressLabel})`;

        const volumes = num_volumes > 0 ? num_volumes : '?';
        const optionsArray = [
            [MAL.PROGRESS_INCREASE, 'Increase progress'],
            [MAL.PROGRESS_DECREASE, 'Decrease progress'], 
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
        } else if (input === MAL.PROGRESS_INCREASE && (!num_volumes || list_status.num_volumes_read + 1 <= num_volumes)) {
            list_status.num_volumes_read++;
        } else if (input === MAL.PROGRESS_DECREASE && list_status.num_volumes_read - 1 >= 0) {
            list_status.num_volumes_read--;
        } else if (input === MAL.PROGRESS_MAX && num_volumes) {
            list_status.num_volumes_read = num_volumes;
        } else if (input === MAL.PROGRESS_MIN) {
            list_status.num_volumes_read = 0;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateChaptersMenu (entry) {
    const { list_status, node: { num_chapters } } = entry;
    const { num_chapters_read } = list_status;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const chaptersLabel = `Update chapters`;
        const progressLabel = num_chapters_read === list_status.num_chapters_read 
            ? `current: ${num_chapters_read} / ${num_chapters}`
            : `update to: ${list_status.num_chapters_read} / ${num_chapters} - from: ${num_chapters_read} / ${num_chapters}`; 
        const header = `${chaptersLabel} (${progressLabel})`;

        const chapters = num_chapters > 0 ? num_chapters : '?';
        const optionsArray = [
            [MAL.PROGRESS_INCREASE, 'Increase progress'],
            [MAL.PROGRESS_DECREASE, 'Decrease progress'], 
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
        } else if (input === MAL.PROGRESS_INCREASE && (!num_chapters || list_status.num_chapters_read + 1 <= num_chapters)) {
            list_status.num_chapters_read++;
        } else if (input === MAL.PROGRESS_DECREASE && list_status.num_chapters_read - 1 >= 0) {
            list_status.num_chapters_read--;
        } else if (input === MAL.PROGRESS_MAX && num_chapters) {
            list_status.num_chapters_read = num_chapters;
        } else if (input === MAL.PROGRESS_MIN) {
            list_status.num_chapters_read = 0;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateStartDateMenu (entry) {
    const list_status = entry.list_status;
    const startDateBeforeChange = list_status.start_date;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Update start date (${startDateBeforeChange === list_status.start_date ? `current: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` : 
                                                                                     `update to: ${list_status.start_date} - from: ${startDateBeforeChange?.length > 0 ? startDateBeforeChange : 'Not set'}` })`,
            [
                ['?', 'Input date (year-mm-dd)'], 
                [COMMANDS.CLEAR, 'Clear date'], 
                '_'
            ]
        );  
        
        input = await takeUserInput(); // take user input

        if (input !== COMMANDS.CLEAR && input !== COMMANDS.EXIT && isValidDate(input)) { // is valid date
            list_status.start_date = input; 
        } else if (input === COMMANDS.CLEAR && list_status.start_date) { // clear date
            list_status.start_date = '0000-00-00';
        } 
    }
}

async function updateFinishDateMenu (entry) {
    const list_status = entry.list_status;
    const finishDateBeforeChange = list_status.finish_date;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Update finish date (${finishDateBeforeChange === list_status.finish_date ? `current: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` : 
                                                                                        `update to: ${list_status.finish_date} - from: ${finishDateBeforeChange?.length > 0 ? finishDateBeforeChange : 'Not set'}` })`,
            [
                ['?', 'Input date (\"year-mm-dd\")'], 
                [COMMANDS.CLEAR, 'Clear date'], 
                '_'
            ]
        );
        
        input = await takeUserInput(); // take user input

        if (input !== COMMANDS.CLEAR && input !== COMMANDS.EXIT && isValidDate(input)) { // is valid date
            list_status.finish_date = input; 
        } else if (input === COMMANDS.CLEAR && list_status.finish_date) { // clear date
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

async function updateIsReMenu (entry) {
    const list_status = entry.list_status;
    const getIsRe = (list_status)        => getType(entry) === ANIME ? list_status.is_rewatching         : list_status.is_rereading;
    const setIsRe = (list_status, value) => getType(entry) === ANIME ? list_status.is_rewatching = value : list_status.is_rereading = value;
    const isReBeforeChange = getIsRe(list_status);
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Update ${getType(entry) ? 're-reading' : 're-watching'} (${isReBeforeChange === getIsRe(list_status) ? `current: ${isReBeforeChange ? 'yes' : 'no'}` : 
                                                                                                                    `update to: ${getIsRe(list_status) ? 'yes' : 'no'} - from: ${isReBeforeChange ? 'yes' : 'no'}`})`,
            [
                ['no'], 
                ['yes'], 
                '_'
            ]
        );

        input = await takeUserInput(true); 
        
        if (input >= 0 && input <= 1) {
            const value = !!input;       // isRe value
            setIsRe(list_status, value); // update isRe
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        } 
    }
}

async function updateCommentsMenu (entry) {
    const list_status = entry.list_status;
    const commentsBeforeChange = list_status.comments;
    const MIN_LENGTH = 3; // min comment length
    let input = null;
    
    while (input?.toLowerCase() !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Update comment (${commentsBeforeChange === list_status.comments ? (`current: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set`}`) : // hasn't been updated
                                                                               (`update to: "${list_status.comments}" - from: ${commentsBeforeChange.length > 0 ? `"${commentsBeforeChange}"` : `Not Set` }`)})`,
            [
                ['?', `Input comment (minimum ${MIN_LENGTH} characters)`], 
                [COMMANDS.CLEAR, 'Clear comment'], 
                '_'
            ]
        );

        input = await takeUserInput(false, true, { useMixedCase: true });
        
        if (input?.toLowerCase() === COMMANDS.CLEAR) { // clear comment
            list_status.comments = ''; 
        } else if (typeof input === 'string' && input.length >= MIN_LENGTH) { 
            list_status.comments = input; // update comments
        } else if (input?.toLowerCase() !== COMMANDS.EXIT) { 
            console.log(`\n\n  Minimum required comment length: ${MIN_LENGTH} characters`);
        }
    }
}

async function updatePriorityMenu (entry) {
    const list_status = entry.list_status;
    const priorityBeforeChange = getPriorityString(entry);
    let input = null;

    // list_status.priority ::: 0 (low), 1 (medium), 2 (high)
    
    while (input !== COMMANDS.EXIT) 
    {
        const priorityState = priorityBeforeChange === getPriorityString(entry) ? `current: ${getPriorityString(entry)}` : `update to: ${getPriorityString(entry)} - from: ${priorityBeforeChange}`;
        const header        = `Update priority (${priorityState})`;
        const optionsArray  = [
            ...priority_values.map(v => [capitalFirstLetterString(v)]),
            '_'
        ];

        printMenuOptions(
            header,
            optionsArray
        );  

        input = await takeUserInput(true); // force whole numbers

        if (input >= 0 && input <= 2) {
            list_status.priority = input;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateTagsMenu (entry) {
    const list_status = entry.list_status;
    const MIN_LENGTH = 1;
    let input = null;
    
    while (input?.toLowerCase() !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            `Update tags (${getTagsString({ list_status }, { printBrackets: false })})`,
            [
                ['?', `Input tag (minimum ${MIN_LENGTH} characters)`], 
                [COMMANDS.CLEAR, 'Clear tags'], 
                '_'
            ]
        );

        input = await takeUserInput(false, true, { useMixedCase: true });

        if (input === COMMANDS.CLEAR) {
            list_status.tags = [];
        } else if (input?.toLowerCase() !== COMMANDS.EXIT && typeof input === 'string' && input.length >= MIN_LENGTH) {
            list_status.tags = [...new Set(list_status.tags).add(input)];
        } else if (input?.toLowerCase() !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateNumTimesReMenu (entry) {
    const type = getType(entry); // ANIME / MANGA (0 / 1)
    const numTimesReLabel = `${type === ANIME ? 're-watch' : 're-read'} count`;
    const numTimesReKey = type === ANIME ? 'num_times_rewatched' : 'num_times_reread';
    const numTimesReBeforeChange = getNumTimesRe(entry);
    const list_status = entry.list_status;
    let input = null;

    // - num_times_rewatched
    // - num_times_reread

    // TODO:
    // - allow inputs like + and - for adding/decreasing count

    while (input !== COMMANDS.EXIT) 
    {
        const numTimesReState = numTimesReBeforeChange === getNumTimesRe(entry) ? `current: ${getNumTimesRe(entry)}` : `update to: ${getNumTimesRe(entry)} - from: ${numTimesReBeforeChange}`;
        const header = `Update ${numTimesReLabel} (${numTimesReState})`; 

        printMenuOptions(
            header,
            [
                ['?', `Input ${numTimesReLabel}`],
                '_'
            ]
        );

        input = await takeUserInput(true);
        
        if (typeof input === 'number' && input >= 0) {
            list_status[numTimesReKey] = input;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateReValueMenu (entry) {
    const type = getType(entry); // ANIME / MANGA (0 / 1)
    const reValueBeforeChange = getReValueString(entry);
    const reValueLabel = `${type === ANIME ? 're-watch' : 're-read'} value`;
    const reValueKey = type === ANIME ? 'rewatch_value' : 'reread_value';
    const list_status = entry.list_status;
    let input = null;

    // - rewatch_value
    // - reread_value
    
    while (input !== COMMANDS.EXIT) 
    {
        const reValueState = reValueBeforeChange === getReValueString(entry) ? `current: ${getReValueString(entry)}` : `update to: ${getReValueString(entry)} - from: ${reValueBeforeChange}`;
        const header = `Update ${reValueLabel} (${reValueState})`; 
        const optionsArray = [ 
            ...re_values.map(v => [capitalFirstLetterString(v)]),
            '_'
        ];

        printMenuOptions(
            header,
            optionsArray
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < re_values.length) {
            list_status[reValueKey] = input;
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function searchListsMenu() {
    const SEARCH_BY_TITLE = 0;
    let input = null;

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function searchListsByTitleMenu() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Search lists by title', 
            [['?', 'Input title'], '_']
        );

        input = await takeUserInput(false, true); // take user input
        
        if (typeof input === 'string' && input.length && input !== COMMANDS.EXIT) {
            const regex = new RegExp(`\\b${escapeRegex(input)}`, 'i'); // regex matches input at beginning of each word
            const matching = lists.flat(2) // arr of entries
                                  .filter(e => regex.test(e.node.title)); // match title to input
            if (!matching.length) { // no matching results
                console.log('\n\n  No matches found');
            } else { // traverse results
                await traverseEntry(null, null, matching);
            }
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function editOrAddEntriesFromSearchResults (finalResults, lists, logAuthURL = false) {        
    // 
    // finalResults: [ { searchResults: [ { node: { ... }, list_status: { ... } }, ... ], searchTitle: string }, ... ]
    // 
    let input = null;

    // TODO: 
    // - consider making it possible to filter a long list 
    //   of searched stuff with e.g. '\s frieren' similar
    //   to traverseMangas at menuLogMangadex.js
    // - somehow mark the searchStrings used in the logged
    //   results ... maybe consider making it possible to
    //   select results regarding a specific used searchString

    while (input !== COMMANDS.EXIT)
    {
        let index = 0;

        // filter existing entries and new entries
        const { entriesToAdd, entriesToEdit } = finalResults.reduce((acc, result) => {
            const foundAtLists = (searchResult) => lists[getType(searchResult)].flat(Infinity).some(e => e.node.id === searchResult.node.id);
            const { searchTitle, searchResults, node, list_status } = result;
            // [ searchTitle: 'frieren', searchResults: ['frieren manga', 'frieren dj.', ...] ]
            for (const searchResult of searchResults) {
                const entryExists = foundAtLists(searchResult);
                if (!entryExists) { // if found append to edit
                    acc.entriesToAdd.push(searchResult);
                } else { // else append to add
                    acc.entriesToEdit.push(searchResult);
                }
            }
            return acc;
        }, { entriesToAdd: [], entriesToEdit: [] });
        const formatSection = (entry) => {
            const title          = entry.node.title;
            const typeLabel      = getType(entry) === ANIME ? '* Anime' : '* Manga';
            const formattedTitle = `${title} ${typeLabel}`; 
            return [index++, formattedTitle];
        };
        // [ { node, list_status, includeInMangadexFetch }, ... ]
        const noResults   = [['?', 'No results found']];
        const addSection  = entriesToAdd.length  ? entriesToAdd.map(entry => formatSection(entry))  : noResults;
        const editSection = entriesToEdit.length ? entriesToEdit.map(entry => formatSection(entry)) : noResults;
        const allEntries = [...entriesToAdd, ...entriesToEdit];
        const resultCount = index;
        const addHeader   = ['_', '_', ['Add section', null, null], '_'];
        const editHeader  = ['_', ['Edit section', null, null], '_'];
        
        // return [ 
        //     [`[${searchTitle}]`, null, '\n'], 
        //     ...formattedResults,
        //     (sIndex < reduced.entriesToAdd.length - 1 ? '_' : null) // empty line between each result
        // ];

        const optionsArray = [
            ...addHeader,
            ...addSection,
            ...editHeader,
            ...editSection,
            '_', '_',
            ['?', 'Select result to add/edit']
        ];

        printMenuOptions(
            null,
            optionsArray,
            { printHeader: false }
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < resultCount) {
            await updateEntryMenu(allEntries[input], lists, logAuthURL);
        } else if (input !== COMMANDS.EXIT) { // invalid input
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

export { menuMAL, updateEntryMenu, editOrAddEntriesFromSearchResults };