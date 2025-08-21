import { fetchMAL } from "../fetch/fetchMAL.js";
import { fetchMangadex } from "../fetch/fetchMangadex.js";
import { log } from "../output/logtoconsole.js";
import { filehandle } from "../filehandling/filehandle.js";
import { animeStatus, chapterOrderTypes, chapterTranslatedLanguages, contentRatings, mangaOrderTypes, mangaStatus, orderDirections, fetchMangadexOptions } from "../regular/export.js";
import { testFetching } from "../fetch/testFetching.js";
import { takeUserInput } from "./helper.js";
import { rl } from '../main.js';

let lists = null; // holds animelist and mangalist, refer to bottom of file for more info on syntax
let config = null; // holds user specific options
let refresh = true; // loops through menu while set to true

async function menu(l, c) {
    try {
        lists = l; config = c;
        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
        while (refresh) {
            if (config.menuOption==='short') {
                refresh = await shortMenu(); // displays the short version of the menu
            } else if (config.menuOption==='long') {
                refresh = await longMenu(); // displays the long version of the menu
            } else {
                console.log('\n||\n|| Given menuOption doesn\'t exist\n||');
            }
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`); 
    } 
}

async function shortMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Watching anime');
        console.log('|| 1 -> Reading manga');
        console.log('|| 2 -> Full list');
        console.log('|| 3 -> Custom log MAL');
        console.log(`|| 4 -> ${config?.autoFetchMangadex ? 'Auto' : 'Custom'} fetch Mangadex`);
        console.log('|| 5 -> Fetch MAL');
        console.log('|| 6 -> Clear screen');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime: [0]}, lists); // anime - watching
                break;
            case 1:
                await log({manga: [0]}, lists); // manga - reading
                break;
            case 2:
                await log({anime: [0,1,2,3,4], manga: [0,1,2,3,4]}, lists); // anime/manga - all
                break;
            case 3: {
                const returnArr = await customLogMenuMAL(); // log anime and/or manga by status
                config = { ...config, logMALOptions: returnArr[0], boolDisplayMAL: returnArr[1] };
                await filehandle('config', config); 
                break; }
            case 4: 
                // if autofetching is disabled, loops through customFetchMenuMangadex normally (default behavior)
                // in case enabled, calls fetchMangadex right away with options taken from config and goes back 
                // to upper menu right after completion
                if (!config.autoFetchMangadex) {
                    const returnArr = await customFetchMenuMangadex(); // fetch Mangadex by preference
                    config = { ...config, fetchMangadexOptions: returnArr[0], boolDisplayMangadex: returnArr[1] };
                    await filehandle('config', config); await filehandle('mal', lists);
                } else { 
                    await fetchMangadex(lists, config.fetchMangadexOptions);
                }
                break;
            case 5:
                lists = await fetchMAL(); // searches and returns MAL lists
                await filehandle('mal', lists);
                break;
            case 6:
                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                break;
            case 'e': // exit
                break; 
            case 888:
                await settingsMenu();  
                r = true; m = 'e'; // goes out of loop and refreshes menu
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }

    return r;
}

async function longMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 'e') 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Watching anime');
        console.log('|| 1 -> Completed anime');
        console.log('|| 2 -> On hold anime');
        console.log('|| 3 -> Dropped anime');
        console.log('|| 4 -> Plan to watch anime');
        console.log('|| 5 -> Reading manga');
        console.log('|| 6 -> Completed manga');
        console.log('|| 7 -> On hold manga');
        console.log('|| 8 -> Dropped manga');
        console.log('|| 9 -> Plan to read manga');
        console.log('|| 10 -> All of the above');
        console.log('|| 11 -> Custom log MAL');
        console.log(`|| 12 -> ${config?.autoFetchMangadex ? 'Auto' : 'Custom'} fetch Mangadex`);
        console.log('|| 13 -> Fetch MAL');
        console.log('|| 14 -> Clear screen');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime: [0]}, lists); // anime - watching
                break;
            case 1:
                await log({anime: [1]}, lists); // anime - completed
                break;
            case 2:
                await log({anime: [2]}, lists); // anime - on_hold
                break;
            case 3:
                await log({anime: [3]}, lists); // anime - dropped
                break;
            case 4:
                await log({anime: [4]}, lists); // anime - plan_to_watch
                break;
            case 5:
                await log({manga: [0]}, lists); // manga - reading
                break;
            case 6:
                await log({manga: [1]}, lists); // manga - completed
                break;
            case 7:
                await log({manga: [2]}, lists); // manga - on_hold
                break;
            case 8:
                await log({manga: [3]}, lists); // manga - dropped
                break;
            case 9:
                await log({manga: [4]}, lists); // manga - plan_to_read
                break;
            case 10:
                await log({anime: [0,1,2,3,4], manga: [0,1,2,3,4]}, lists); // anime/manga - all
                break;
            case 11: {
                const returnArr = await customLogMenuMAL(); // log anime and/or manga by status
                config = { ...config, logMALOptions: returnArr[0], boolDisplayMAL: returnArr[1] };
                await filehandle('config', config); 
                break; }
            case 12: 
                // if autofetching is disabled, loops through customFetchMenuMangadex normally (default behavior)
                // in case enabled, calls fetchMangadex right away with options taken from config and goes back 
                // to upper menu right after completion
                if (!config.autoFetchMangadex) {
                    const returnArr = await customFetchMenuMangadex(); // fetch Mangadex by preference
                    config = { ...config, fetchMangadexOptions: returnArr[0], boolDisplayMangadex: returnArr[1] };
                    await filehandle('config', config); await filehandle('mal', lists);
                } else { 
                    await fetchMangadex(lists, config?.fetchMangadexOptions);
                }
                break;
            case 13:
                lists = await fetchMAL(); // searches and returns MAL lists
                await filehandle('mal', lists);
                break;
            case 14:
                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                break;
            case 'e': // exit
                break; 
            case 888:
                await settingsMenu(); 
                r = true; m = 'e'; // goes out of loop and refreshes menu
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
        console.log(`|| 0 -> Toggle menu type (currently ${config.menuOption})`);
        console.log(`|| 1 -> Automatically fetch Mangadex when fetching (currently ${config.autoFetchMangadex ? 'on' : 'off'})`);
        console.log(`|| 2 -> Fetch ??? (WIP)`);
        console.log('|| e -> Return to main menu\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0: // short-/longmenu toggle
                if (config.menuOption === 'short') config = { ...config, menuOption: 'long' }; else config = { ...config, menuOption: 'short' }; // changing menuOption
                await filehandle('config', config); // writes config.file
                break;
            case 1: // autoFetchMangadex toggle
                if (config.autoFetchMangadex) config = { ...config, autoFetchMangadex: false }; else config = { ...config, autoFetchMangadex: true }; // toggling autofetching on Mangadex
                await filehandle('config', config); // writes config.file
                break;
            case 2: 
                await testFetching();    
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

async function customLogMenuMAL() {
    let boolDisplay = !config?.boolDisplayMAL ? false : config.boolDisplayMAL;
    let anime = !config?.logMALOptions?.anime ? [] : config.logMALOptions.anime;
    let manga = !config?.logMALOptions?.manga ? [] : config.logMALOptions.manga;
    let m = 0, boolRemove = false, boolManga = false;

    while (m !== 'e') 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
            console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
        }

        console.log('\n||\n|| Custom log MAL\n||');
        console.log('|| 0 -> Log with options');
        console.log('|| 1 -> Change options');
        console.log('|| 2 -> Empty options');
        console.log('|| 3 -> Toggle display');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime, manga}, lists);
                break;
            case 1:
                while (m !== 'e') 
                {
                    if (boolDisplay) { // show if boolDisplay toggled
                        console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
                        console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
                    }

                    console.log(`\n||\n|| Change options (${!boolManga ? 'anime' : 'manga'})\n||`);
                    if (!boolManga) { 
                        animeStatus.forEach((item, index) => {
                            console.log(`|| ${index} -> ${!boolRemove ? 'Add' : 'Remove'} ${item}`); // options 0-4
                        }); 
                    } else {
                        mangaStatus.forEach((item, index) => {
                            console.log(`|| ${index} -> ${!boolRemove ? 'Add' : 'Remove'} ${item}`); // options 0-4
                        }); 
                    }
                    console.log('|| 5 -> Toggle add/remove');
                    console.log('|| 6 -> Toggle anime/manga');
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

                    if (m < 5 && m > -1) { // add/remove entry
                        if (!boolRemove) {
                            if (!boolManga) anime.push(m); else manga.push(m); // add new entry
                            if (!boolManga) anime = [...new Set(anime)]; else manga = [...new Set(manga)]; // removing duplicates
                            if (!boolManga) anime.sort((a, b) => a - b); else manga.sort((a, b) => a - b); // sort in ascending order
                        } else {
                            if (!boolManga) anime = anime.filter(value => value !== m);  // remove entries corresponding to m
                            else manga = manga.filter(value => value !== m);
                        }
                    } else if (m === 5) { // toggle add/remove
                        if (!boolRemove) boolRemove = true; 
                        else boolRemove = false; 
                    } else if (m === 6) { // toggle anime/manga
                        if (!boolManga) boolManga = true; 
                        else boolManga = false; 
                    } else if (m !== 'e') { 
                        console.log('\n|| Please input a valid option');  
                    }
                }   
                m = null; // ensuring upper menu doesn't exit
                break;
            case 2:
                // re-initializing anime/manga as empty
                anime = [], manga = []; 
                console.log('\n||\n|| Cleared all selected anime/manga options\n||');
                break;
            case 3:
                // toggling boolDisplay
                if (!boolDisplay) boolDisplay = true; 
                else boolDisplay = false; 
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
    return [{anime, manga}, boolDisplay];
}

async function customFetchMenuMangadex() {
    const options = !config?.fetchMangadexOptions ? JSON.parse(JSON.stringify(fetchMangadexOptions)) : config.fetchMangadexOptions;
    let boolDisplay = !config?.boolDisplayMangadex ? false : config.boolDisplayMangadex; 
    let m = 0;

    while (m !== 'e') 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            await customFetchMangadexDisplay(options);
        }

        console.log('\n||\n|| Custom fetch Mangadex\n||');
        console.log('|| 0 -> Fetch with options');
        console.log('|| 1 -> Change options');
        console.log('|| 2 -> Fetch exclusions');
        console.log('|| 3 -> Empty options');
        console.log('|| 4 -> Toggle display');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m)
        {
            case 0:
                // fetching with given options
                await fetchMangadex(lists, options);
                break;
            case 1:
                // running menu for changing options
                await changeMangadexOptionMenu(boolDisplay, options);
                break;
            case 2:
                // filtering items not wanted to be fetched
                await filterEntriesFromFetch();
                break;
            case 3:
                // emptying / nullifying all options
                for (const key in options) {
                    if (!Array.isArray(options[key])) options[key] = null;
                    else options[key] = [];
                }
                console.log('\n||\n|| Cleared all selected options\n||');
                break;
            case 4:
                // toggle display of options
                if (!boolDisplay) boolDisplay = true; 
                else boolDisplay = false; 
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }

    return [options, boolDisplay];
}

async function changeMangadexOptionMenu (boolDisplay, fetchOptions) {
    const options = fetchOptions;
    let m = 0, i = 0, key = null;

    while (m !== 'e') 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            await customFetchMangadexDisplay(options);
        }

        // lists options that can be changed 
        console.log('\n||\n|| Select an option:\n||');
        for (const key in options) { 
            console.log(`|| ${i} -> ${key}`);
            i++; 
        }
        console.log('|| e -> Go back\n||');
        i = 0; // resetting index

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
        
        switch (m)
        {
            case 0: // MAL_list
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    console.log('|| 0 -> anime');
                    console.log('|| 1 -> manga');
                    console.log(`|| e -> Go back\n||`);
                    
                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m === 0 || m === 1) {
                        options.MAL_list = m;
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 1: // MAL_status
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    if (options.MAL_list === null) {
                        while (i < animeStatus.length) {
                            // watching/reading & plan_to_watch/plan_to_read
                            if (i === 0 || i === 4) console.log(`|| ${i} -> ${animeStatus[i]}/${mangaStatus[i]}`);
                            else console.log(`|| ${i} -> ${animeStatus[i]}`);
                            i++;    
                        }
                        i = 0; // resetting index
                    } else if (options.MAL_list === 0) {
                        animeStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    } else if (options.MAL_list === 1) {
                        mangaStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    }
                    console.log(`|| e -> Go back\n||`);

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < 5) {
                        options.MAL_status = m;
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 2: // limit_manga
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < 101) {
                        options.limit_manga = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 3: // limit_chapter
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < 101) {
                        options.limit_chapter = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }    
                m = null; // ensuring upper menu doesn't exit
                break;
            case 4: // mangaOrderType
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    mangaOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < mangaOrderTypes.length) {
                        options.mangaOrderType = mangaOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 5: // chapterOrderType
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    chapterOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < chapterOrderTypes.length) {
                        options.chapterOrderType = chapterOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 6: // mangaOrderDirection
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options.mangaOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 7: // chapterOrderDirection
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                    
                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options.chapterOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 8: // contentRating
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Add option for ${key}\n||`);
                    contentRatings.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| ${contentRatings.length} -> Select all`);
                    console.log(`|| ${contentRatings.length+1} -> Clear ratings`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

                    // setting option / clearing options
                    if (m > -1 && m < contentRatings.length) {
                        options.contentRating.push(contentRatings[m]); 
                        options.contentRating = [...new Set(options.contentRating)]; // get rid of duplicate values
                    } else if (m === contentRatings.length) {
                        options.contentRating = [...contentRatings];
                    } else if (m === contentRatings.length+1) {
                        options.contentRating = [];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 9: // chapterTranslatedLanguage
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Add option for ${key} (optionally input custom code)\n||`);
                    chapterTranslatedLanguages.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| ${chapterTranslatedLanguages.length} -> Clear filters`);
                    console.log('|| e -> Go back\n||');

                    const userInput = await rl.question('\n|| Input: '); // get user input
                    // regex tests for manually inputted language codes and allows:
                    // 'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
                    const testResult = /^[a-z]{2}(-[a-z]{2})?$/i.test(userInput); // validating language code
                    if (!testResult && userInput.toLowerCase() !== 'e') m = parseInt(userInput, 10); // convert userinput to int
                    else m = userInput.toLowerCase(); // converts userInput to lowercase

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

                    // handling menu choice
                    if (m > -1 && m < chapterTranslatedLanguages.length) { 
                        // options.chapterTranslatedLanguage = options.chapterTranslatedLanguage.filter(Boolean); // filters undefined
                        options.chapterTranslatedLanguage.push(chapterTranslatedLanguages[m]);
                        options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
                    } else if (m === chapterTranslatedLanguages.length) {
                        options.chapterTranslatedLanguage = []; // clear current translatedLanguage options 
                    } else if (testResult) { // custom input e.g. 'en' or 'pt-br'
                        // options.chapterTranslatedLanguage = options.chapterTranslatedLanguage.filter(Boolean); // filters undefined
                        options.chapterTranslatedLanguage.push(m);
                        options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
}

async function customFetchMangadexDisplay (options) {
    console.log(`\n||\n|| MAL_list: ${options.MAL_list === null ? options.MAL_list : (!options.MAL_list ? 'anime' : 'manga')}`);
    console.log(`|| MAL_status: ${options.MAL_status === null ? options.MAL_status : (options.MAL_list === null ? options.MAL_status : (!options.MAL_list ? animeStatus[options.MAL_status] : mangaStatus[options.MAL_status]))}`);
    console.log(`|| limit_manga: ${options.limit_manga}`);
    console.log(`|| limit_chapter: ${options.limit_chapter}`);
    console.log(`|| mangaOrderType: ${options.mangaOrderType}`);
    console.log(`|| chapterOrderType: ${options.chapterOrderType}`);
    console.log(`|| mangaOrderDirection: ${options.mangaOrderDirection}`);
    console.log(`|| chapterOrderDirection: ${options.chapterOrderDirection}`);
    console.log(`|| contentRating: [${options.contentRating[0] === undefined ? 'default' : options.contentRating}]`);
    console.log(`|| chapterTranslatedLanguage: [${options.chapterTranslatedLanguage[0] === undefined ? 'all' : options.chapterTranslatedLanguage}]\n||`);
}

async function filterEntriesFromFetch() {
    let m = 0;

    while (m !== 'e') 
    {
        // select where to list statuses from
        console.log('\n||\n|| What do you want to do?\n||');
        console.log('|| 0 -> Filter anime');
        console.log('|| 1 -> Filter manga');
        console.log('|| 2 -> Reset filters');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
    
        // logging statuses by type
        if (m === 0 || m === 1) {
            // saving selected type 
            const type = m;
            while (m !== 'e') 
            {
                console.log('\n||\n|| Select a status\n||');
                if (type === 0) { // anime
                    animeStatus.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                } else { // manga
                    mangaStatus.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                }
                console.log('|| e -> Go back\n||');

                m = await takeUserInput(); // get user input

                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])  

                // logging titles by status
                if ((type === 0 && m < animeStatus.length) || (type === 1 && m < mangaStatus.length)) { 
                    // saving the selected status
                    const status = m;
                    // going back to upper menu in case lists[type][status] is empty
                    if (!lists[type][status].length) { 
                        console.log('\n||\n|| No titles found for the selected status\n||'); 
                    } else {
                        while (m !== 'e') 
                        {
                            console.log('\n||\n|| Select titles to be fetched\n||')
                            lists[type][status].forEach((item, index) => {
                                console.log(`|| ${index} -> ${item.node.title} ${item.includeInMangadexFetch ? '[x]' : '[]'}`); 
                            });
                            console.log('|| e -> Go back\n||');             

                            m = await takeUserInput(); // get user input

                            process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])  
                            
                            // toggling filter at given option
                            if (m > -1 && m < lists[type][status].length) {
                                const item = lists[type][status][m]; // referring to item
                                if (item.includeInMangadexFetch) item.includeInMangadexFetch = false; 
                                else item.includeInMangadexFetch = true;
                            } else if (m !== 'e') {
                                console.log('\n|| Please input a valid option');
                            }
                        }
                    }
                    m = null; // ensuring upper menu doesn't exit
                } else if (m !== 'e') {
                    console.log('\n|| Please input a valid option');
                }
            }
            m = null; // ensuring upper menu doesn't exit
        } else if (m === 2) {
            // reassigning fetch filters for Mangadex as true
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item.includeInMangadexFetch = true;
                    }
                }
            }
        } else if (m !== 'e') {
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