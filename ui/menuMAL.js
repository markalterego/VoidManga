import { takeUserInput } from "../helpers/functions.js";
import { animeStatus, mangaStatus } from "../helpers/export.js";
import { logDataDeepMenu } from "./menuLogMangadex.js";

let lists;

async function menuMAL (l) {
    lists = l; // reference to lists
    const LOGLISTS = 0, UPDATELISTS = 1;
    let m = 0;

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

async function updateMALMenu () {

}

export { menuMAL };