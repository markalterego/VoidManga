import { takeUserInput, truncateString, capitalFirstLetterString } from "../helpers/functions.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logDataDeepMenu } from "./menuLogMangadex.js";

const ANIME = 0, MANGA = 1;
let lists;

async function menuMAL (l) {
    const LOGLISTS = 0, UPDATELISTS = 1;
    let m = 0;
    lists = l; // reference to lists

    while (m !== 'e') 
    {
        console.log('\n||\n|| MyAnimeList options:\n||');
        console.log('|| 0 -> Log lists');
        console.log('|| 1 -> Update lists');
        console.log('|| e -> Go back\n||');
        
        m = await takeUserInput(true); // take userInput whole numbers
        
        if (m === LOGLISTS) {
            // await logMALMenu();
            const listsAsObject = formatListsToObject(lists);
            await logDataDeepMenu(listsAsObject, 'MAL', false, true);
        } else if (m === UPDATELISTS) {
            await updateMALMenu();
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
    const TRAVERSE_TITLES = 0, SEARCH_TITLE = 1;
    let m = 0;

    // TODO: 
    // - remove call to traverseType and instead just user 
    //   selects anime/manga list straight from this functions 
    //   menu

    while (m !== 'e') 
    {
        console.log('\n||\n|| MyAnimeList update:\n||');
        console.log('|| 0 -> Traverse titles');
        console.log('|| 1 -> Search title');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num

        if (m === TRAVERSE_TITLES) {
            await traverseType();
        } else if (m === SEARCH_TITLE) {
            // <-- searchTitles function here
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function traverseType() {
    let m = 0;

    while (m !== 'e') 
    {
        console.log('\n||\n|| Select type:\n||');
        console.log('|| 0 -> Anime');
        console.log('|| 1 -> Manga');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(true); // take user input as whole num

        if (m === ANIME) { 
            await traverseStatus(ANIME); // anime list
        } else if (m === MANGA) { 
            await traverseStatus(MANGA); // manga list
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
        console.log('\n||\n|| Select status:\n||');
        statuses.forEach((status, statusIndex) => {
            console.log(`|| ${statusIndex} -> ${capitalFirstLetterString(status)}`);
        });
        console.log('|| e -> Go back\n||');

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
        console.log('\n||\n|| Select entry:\n||');
        lists[typeIndex][statusIndex].forEach((entry, entryIndex) => {
            const entryTitle = entry.node.title;
            console.log(`|| ${entryIndex} -> ${entryTitle}`);
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
    const STATUS = 0, SCORE = 1, PROGRESS = 2, ISREWATCHING = 3, COMMENTS = 4;
    const entry_clone = structuredClone(entry); // clone of entry
    let m = 0;

    // TODO: 
    // - make possible to update start/finish dates as well...

    while (m !== 'e') 
    {
        const entryTitle = entry_clone.node.title; // anime/manga title
        const list_status = entry_clone.list_status; // list_status
        
        console.log(`\n||\n|| Update ${entryTitle}:\n||`);
        console.log(`|| 0 -> Status (${list_status.status})`);
        console.log(`|| 1 -> Score (${list_status.score})`);
        console.log(`|| 2 -> Progress (${type === 'anime' ? (`${list_status.num_episodes_watched} / ${entry_clone.node.num_episodes}`) : 
                                                            (`${list_status.num_chapters_read} / ${entry_clone.node.num_chapters}`) })`);
        console.log(`|| 3 -> ${type === 'anime' ? (`Re-watching (${list_status.is_rewatching === true ? 'yes' : 'no'})`) : 
                                                  (`Re-reading (${list_status.is_rereading === true ? 'yes' : 'no'})`) }`);
        console.log(`|| 4 -> Comments (${list_status.comments.length > 0 ? `'${truncateString(list_status.comments, 10)}'` : 'empty'})`);
        console.log('|| e -> Go back\n||');
        
        m = await takeUserInput(true); // take user input as whole num

        if (m === STATUS) {
            
        } else if (m === SCORE) {
            
        } else if (m === PROGRESS) {

        } else if (m === ISREWATCHING) {
            
        } else if (m === COMMENTS) {
            
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}



// async function sortLists ()

async function searchMALMenu() {
    let m = 0;

    while (m !== 'e') 
    {
        
    }
}

export { menuMAL };