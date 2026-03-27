import { menuMAL } from "./menuMAL.js";
import { filehandle, writeEnv } from "../filehandling/filehandle.js";
import { testFetching } from "../fetch/testFetching.js";
import { takeUserInput } from "../helpers/functions.js";
import { menuFetchMangadex } from "./menuFetchMangadex.js";
import { menuLogMangadex } from "./menuLogMangadex.js";
import { logErrorDetails } from "../helpers/errorLogger.js";

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
let mangadexData = null; // holds mangas and chapters fetched from Mangadex

async function menu (l, c, m) {
    try {
        lists = l, config = c, mangadexData = m; // assigning lists, config and mangadexData
        await rootMenu(); // displays rootMenu
    } catch (error) {
        if (error.code==='ABORT_ERR') console.error(); // extra newline for extra cleanliness :)
        logErrorDetails(error);
    } 
}

async function rootMenu() {
    const MYANIMELIST = 0, LOGMANGADEX = 1, FETCHMANGADEX = 2;
    let m = 0; 
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> MyAnimeList');
        console.log('|| 1 -> Log Mangadex');
        console.log(`|| 2 -> Fetch Mangadex`);
        console.log('||\n|| s -> Settings');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        switch (m) 
        {
            case MYANIMELIST: 
                lists = await menuMAL(lists, config); // menuMAL options
                break; 
            case LOGMANGADEX: 
                await menuLogMangadex(mangadexData, lists, config); // <-- log mangadex
                filehandle('config', config);
                break;
            case FETCHMANGADEX:
                await menuFetchMangadex(lists, config, mangadexData); // fetch Mangadex by preference
                filehandle('config', config); // save config file
                break;
            case 's':
                await settingsMenu();
                filehandle('config', config); // save config to file
                break;
            case 'e': 
                break;                 
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

async function settingsMenu() {
    const UPDATEMALAPIKEY = 0, FETCHMALONMENUOPEN = 1;
    let m = 0;
    
    // TODO: 
    // - make an option for clearing all MAL/Mangadex data

    while (m !== 'e') 
    {
        console.log('\n||\n|| Settings\n||');
        console.log(`|| 0 -> Update MAL_API_CLIENT_ID`);
        console.log(`|| 1 -> Fetch MAL lists when running menuMAL [${config.menuMALOptions.fetchMALOnMenuOpen ? 'x' : ''}]`);
        console.log('||\n|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        switch (m) 
        {
            case UPDATEMALAPIKEY:
                await updateAPIKeyMenu();
                break;
            case FETCHMALONMENUOPEN:
                if (config.menuMALOptions.fetchMALOnMenuOpen) config.menuMALOptions.fetchMALOnMenuOpen = false;
                else config.menuMALOptions.fetchMALOnMenuOpen = true;
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

async function updateAPIKeyMenu () {
    let m = 0;
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| Input MAL_API_CLIENT_ID\n||');
        console.log('|| ? -> https://myanimelist.net/apiconfig');
        console.log('||\n|| e -> Go Back\n||');
        
        m = await takeUserInput(); // get user input

        const isValidAPIKey = (typeof m === 'string' && m.length === 32); // API key expected length is 32 characters

        if (isValidAPIKey) {
            writeEnv({ MAL_API_CLIENT_ID: m }, true); // write MAL_API_CLIENT_ID to .env
            console.log('\n||\n|| MAL_API_CLIENT_ID updated successfully\n||');
        } else if (m !== 'e') {
            console.log('\n||\n|| MAL_API_CLIENT_ID needs to be 32 characters in length\n||');
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