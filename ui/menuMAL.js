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
            await logDataDeepMenu(listsAsObject, 'MAL', false, true);
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
        console.log('\n||\n|| Select entry\n||');
        lists[typeIndex][statusIndex].forEach((entry, entryIndex) => {
            const entryTitle = entry.node.title;
            console.log(`|| ${entryIndex} -> ${entryTitle}`);
            if (entryIndex === lists[typeIndex][statusIndex].length - 1) console.log('||');
        });
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num
        
        if (m >= 0 && m < lists[typeIndex][statusIndex].length) {
            const entryIndex = m; // selected entry index
            const entry = lists[typeIndex][statusIndex][entryIndex]; // reference to selected entry
            const type = !typeIndex ? 'anime' : 'manga'; // type of lists
            await updateEntryMenu(type, entry); // update stuff related to selected entry
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function updateEntryMenu (type, entry) {
    // const PADSTART = 10, PADEND = 12, BLANK = ' ';
    const entry_clone = structuredClone(entry);
    const STATUS = 0, SCORE = 1, PROGRESS = 2, ISRE = 3, COMMENTS = 4;
    let m = 0, changedFields = {};

    // TODO: 
    // - make possible to update start/finish dates as well...

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
        const progress = type === 'anime' ? (`${list_status.num_episodes_watched} / ${entry_clone.node.num_episodes}`) : // if anime 
                                            (`${list_status.num_chapters_read} / ${entry_clone.node.num_chapters}`);     // if manga
        const isRe = type === 'anime' ? (list_status.is_rewatching ? 'yes' : 'no') : // if anime - isrewatching
                                        (list_status.is_rereading  ? 'yes' : 'no');  // if manga - isrereading
        const comments = list_status.comments.length > 0 ? truncateString(list_status.comments, 10) : // has comment
                                                           'no comment';                              // doesn't have comment

        console.log(`\n||\n|| UPDATE - ${entryTitle}\n||`);
        console.log(`|| 0 -> Status (${status})`);
        console.log(`|| 1 -> Score (${score})`);
        console.log(`|| 2 -> Progress (${progress})`);
        console.log(`|| 3 -> ${type === 'anime' ? 'Re-watching' : 'Re-reading'} (${isRe})`);
        console.log(`|| 4 -> Comments (${comments})`);
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num

        if (m === STATUS) {
            const oldStatus = list_status.status; // status before update
            await updateStatusMenu(list_status);  // update status menu 
            if (oldStatus !== list_status.status) changedFields.status = list_status.status; 
        } else if (m === SCORE) {
            await updateScoreMenu(list_status); 
        } else if (m === PROGRESS) {
            await updateProgressMenu(list_status);
        } else if (m === ISRE) {
            await updateIsReMenu(list_status);
        } else if (m === COMMENTS) {
            await updateCommentsMenu(list_status);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }

    // update changes
    if (Object.keys(changedFields).length > 0) {
        lists = await updateMAL(lists, changedFields, entry);
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

async function updateScoreMenu (entry) {
    

}

async function updateProgressMenu (entry) {
    // episodes watched/chapters read


}

async function updateIsReMenu (entry) {
    
}

async function updateCommentsMenu (entry) {

}

function hasEntryChanged (entry, entry_clone) {
    for (const key in entry.list_status) {
        if (key !== 'updated_at') { // ignore updated_at val
            const v1 = entry.list_status[key]; 
            const v2 = entry_clone.list_status[key]; 
            console.log(`${v1} - ${v2}`);
            if (v1 !== v2) {
                return true; // has changed
            }
        }        
    }
    return false; // has not changed
}

// async function sortLists ()

async function searchMALMenu() {
    let m = 0;

    while (m !== 'e') 
    {
        
    }
}

export { menuMAL };