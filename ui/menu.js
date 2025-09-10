import { fetchMAL } from "../fetch/fetchMAL.js";
import { fetchMangadex } from "../fetch/fetchMangadex.js";
import { customLogMAL } from "./customLogMAL.js";
import { filehandle } from "../filehandling/filehandle.js";
import { testFetching } from "../fetch/testFetching.js";
import { takeUserInput, clearScreen } from "../helpers/functions.js";
import { customFetchMenuComick, autoFetchComickChapters } from "./customFetchMenuComick.js";
import { customFetchMenuMangadex } from "./customFetchMenuMangadex.js";
import { customLogMenuMAL } from "./customLogMenuMAL.js";

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
let refresh = true; // loops through menu while set to true

async function menu (l, c) {
    try {
        lists = l, config = c; // assigning lists and config
        while (refresh) {
            refresh = await rootMenu(); // displays rootMenu
        }
    } catch (error) {
        if (error.code==='ABORT_ERR') console.error(); // extra newline for extra cleanliness :)
        console.error(`\n||\n|| Error: ${error.message}\n||`); 
    } 
}

async function rootMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Watching anime');
        console.log('|| 1 -> Reading manga');
        console.log('|| 2 -> Full list');
        console.log('|| 3 -> Custom log MAL');
        console.log(`|| 4 -> ${config?.autoFetchMangadex ? 'Auto' : 'Custom'} fetch Mangadex`);
        console.log(`|| 5 -> ${config?.autoFetchComick ? (config?.useFirstResultComick ? 'Auto' : 'Semi-Auto') : 'Custom'} fetch Comick`);
        console.log('|| 6 -> Fetch MAL');
        console.log('|| s -> Settings');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window  

        switch (m) 
        {
            case 0:
                await customLogMAL({anime: [0]}, lists); // anime - watching
                break;
            case 1:
                await customLogMAL({manga: [0]}, lists); // manga - reading
                break;
            case 2:
                await customLogMAL({anime: [0,1,2,3,4], manga: [0,1,2,3,4]}, lists); // anime/manga - all
                break;
            case 3: {
                const returnArr = await customLogMenuMAL(lists, config); // log anime and/or manga by status
                config = { ...config, logMALOptions: returnArr[0], boolDisplayMAL: returnArr[1] };
                await filehandle('config', config); 
                break; }
            case 4: 
                // if autofetching is disabled, loops through customFetchMenuMangadex normally (default behavior)
                // in case enabled, calls fetchMangadex right away with options taken from config and goes back 
                // to upper menu right after completion
                if (!config?.autoFetchMangadex) {
                    const returnArr = await customFetchMenuMangadex(lists, config); // fetch Mangadex by preference
                    config = { ...config, fetchMangadexOptions: returnArr[0], boolDisplayMangadex: returnArr[1] };
                    await filehandle('config', config); await filehandle('mal', lists); // save config and lists to file
                } else { 
                    await fetchMangadex(lists, config?.fetchMangadexOptions);
                }
                break;
            case 5:
                // if autofetching is disabled, loops through customFetchMenuComick normally (default behavior)
                // in case enabled, calls autoFetchComickChapters instead with useFirstResult
                if (!config?.autoFetchComick) {
                    const toggleStringSearch = await customFetchMenuComick(lists, config); // search and log Comick API
                    config = { ...config, toggleStringSearchComick: toggleStringSearch }; // save toggleStringSearch to config
                    await filehandle('config', config); await filehandle('mal', lists); // save config and lists to file
                } else {
                    // if useFirstResult is false, the user is still able to select the Manga from the Manga endpoint fetch
                    // and use said Manga to fetch the chapter endpoint, if useFirstResult is true, autoFetchComickChapters 
                    // fetches the chapter endpoint by taking the first Manga fetch result per each fetch and calling the
                    // chapter endpoint with said results
                    await autoFetchComickChapters(lists, config?.useFirstResultComick);
                }
                break;
            case 6: 
                lists = await fetchMAL(lists); // searches and returns MAL lists
                await filehandle('mal', lists);
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
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| Settings (+experimental)\n||');
        console.log(`|| 0 -> Automatically fetch Mangadex when fetching (currently ${config?.autoFetchMangadex ? 'on' : 'off'})`);
        console.log(`|| 1 -> Automatically fetch Comick when fetching (currently ${config?.autoFetchComick ? 'on' : 'off'})`);
        console.log(`|| 2 -> Skip Manga selection when fetching Comick chapters (currently ${config?.useFirstResultComick ? 'on' : 'off'})`);
        console.log(`|| 3 -> Fetch ??? (WIP)`);
        console.log('|| e -> Return to main menu\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window   

        switch (m) 
        {
            case 0: // autoFetchMangadex toggle
                if (config?.autoFetchMangadex) config = { ...config, autoFetchMangadex: false }; else config = { ...config, autoFetchMangadex: true }; // toggling autofetching on Mangadex
                await filehandle('config', config); // writes config.file
                break;
            case 1: // autoFetchComick toggle
                if (config?.autoFetchComick) config = { ...config, autoFetchComick: false }; else config = { ...config, autoFetchComick: true }; // toggling autofetching on Comick
                await filehandle('config', config); // writes config.file
                break;
            case 2: // useFirstResult
                if (config?.useFirstResultComick) config = { ...config, useFirstResultComick: false }; else config = { ...config, useFirstResultComick: true }; // toggling useFirstResultComick
                await filehandle('config', config); // writes config.file
                break;
            case 3: 
                await testFetching();    
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

export { menu };

/*
Understanding the layout of lists:

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