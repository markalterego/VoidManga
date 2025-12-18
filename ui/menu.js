import { fetchMAL } from "../fetch/fetchMAL.js";
// import { customLogMAL } from "./customLogMAL.js";
// import { menuLogMAL } from "./menuLogMAL.js";
// import { updateMAL } from "../updateMAL/updateMAL.js";
// import { animeStatus, mangaStatus } from "../helpers/export.js";
import { menuMAL } from "./menuMAL.js";
import { filehandle } from "../filehandling/filehandle.js";
import { testFetching } from "../fetch/testFetching.js";
import { takeUserInput } from "../helpers/functions.js";
import { menuFetchMangadex } from "./menuFetchMangadex.js";
import { menuLogMangadex } from "./menuLogMangadex.js";
import { logErrorDetails } from "../helpers/errorLogger.js";

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
let mangadexData = null; // holds mangas and chapters fetched from Mangadex
let refresh = true; // loops through menu while set to true

async function menu (l, c, m) {
    try {
        lists = l, config = c, mangadexData = m; // assigning lists, config and mangadexData
        while (refresh) {
            refresh = await rootMenu(); // displays rootMenu
        }
    } catch (error) {
        if (error.code==='ABORT_ERR') console.error(); // extra newline for extra cleanliness :)
        logErrorDetails(error);
    } 
}

async function rootMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Log/Update MAL');
        console.log('|| 1 -> Log Mangadex');
        console.log(`|| 2 -> Fetch Mangadex`);
        console.log('|| 3 -> Fetch MAL');
        console.log('|| s -> Settings');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        switch (m) 
        {
            case 0: 
                lists = await menuMAL(lists);
                // const returnArr = await menuLogMAL(lists, config); // log anime and/or manga by status
                // config = { ...config, logMALOptions: returnArr[0] };
                // filehandle('config', config); 
                break; 
            case 1: {
                const options = await menuLogMangadex(mangadexData, lists, config); // <-- log mangadex
                config = { ...config, logMangadexOptions: options };
                filehandle('config', config);
                break; } 
            case 2: {
                const fetchMangadexData = await menuFetchMangadex(lists, config, mangadexData); // fetch Mangadex by preference
                config = { ...config, fetchMangadexOptions: fetchMangadexData.options }; // append options to config
                filehandle('config', config); // save config file
                filehandle('mal', lists); // save lists to file
                filehandle('mangadex', mangadexData); // save data to file
                break; }
            case 3: 
                lists = await fetchMAL(lists); // searches and returns MAL lists
                filehandle('mal', lists);
                break; 
            case 's':
                await settingsMenu();  
                r = true; m = 'e'; // goes out of loop and refreshes menu
                break;
            case 'e': // exit
                break;                 
            default:
                console.log('\n|| Please input a valid option');
        }
    }
    return r;
}

async function settingsMenu() {
    let m = 0;
    
    // TODO: 
    // - make an option for clearing all MAL/Mangadex data

    while (m !== 'e') 
    {
        console.log('\n||\n|| Settings (+experimental)\n||');
        console.log(`|| 0 -> Update MAL...`);
        console.log('|| e -> Return to main menu\n||');

        m = await takeUserInput(); // get user input

        switch (m) 
        {
            case 0: 
                await testFetching(); 
                // let cloned_entry = structuredClone(lists[1][4][0]); // 
                // cloned_entry.list_status.status = mangaStatus[0]; // reading
                // lists = await updateMAL(lists, cloned_entry);
                // filehandle('mal', lists);
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

export { menu };

/* Understanding the layout of lists:

lists[0]... = animelist 
    ...[0] = watching 
        ...[0 - ?] = specific series 
            .node/.list_status = info about series at given index
    ...[1] = completed
        ---||---
    ...[2] = on hold
        ---||---
    ...[3] = dropped
        ---||---
    ...[4] = plan to watch
        ---||---
        
lists[1]... = mangalist
    ...[0] = reading
        ---||---
    ...[1] = completed
        ---||---
    ...[2] = on hold
        ---||---
    ...[3] = dropped
        ---||---
    ...[4] = plan to read
        ---||---

e.g. 
lists[0][0][0].node.title
lists[0][0][0].list_status.num_episodes_watched

console.log('lists[0][0][0].node.title:', lists[0][0][0].node.title);
console.log('lists[0][0][0].list_status.num_episodes_watched:', lists[0][0][0].list_status.num_episodes_watched);
*/