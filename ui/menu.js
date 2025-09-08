import { fetchMAL } from "../fetch/fetchMAL.js";
import { fetchMangadex } from "../fetch/fetchMangadex.js";
import { customLogMAL } from "./customLogMAL.js";
import { filehandle } from "../filehandling/filehandle.js";
import { animeStatus, chapterOrderTypes, chapterTranslatedLanguages, 
         contentRatings, mangaOrderTypes, mangaStatus, orderDirections, 
         fetchMangadexOptions, expectedFilters } from "../helpers/export.js";
import { testFetching } from "../fetch/testFetching.js";
import { takeUserInput, clearScreen, customFetchMangadexDisplay } from "../helpers/functions.js";
import { rl } from '../main.js';
import { fetchComickMangas, fetchComickChapters, logComick } from "../fetch/fetchComick.js";

let lists = null; // holds animelist and mangalist, refer to bottom of file for more info on syntax
let config = null; // holds user specific options
let refresh = true; // loops through menu while set to true

async function menu(l, c) {
    try {
        lists = l; config = c;
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
                const returnArr = await customLogMenuMAL(); // log anime and/or manga by status
                config = { ...config, logMALOptions: returnArr[0], boolDisplayMAL: returnArr[1] };
                await filehandle('config', config); 
                break; }
            case 4: 
                // if autofetching is disabled, loops through customFetchMenuMangadex normally (default behavior)
                // in case enabled, calls fetchMangadex right away with options taken from config and goes back 
                // to upper menu right after completion
                if (!config?.autoFetchMangadex) {
                    const returnArr = await customFetchMenuMangadex(); // fetch Mangadex by preference
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
                    const toggleStringSearch = await customFetchMenuComick(); // search and log Comick API
                    config = { ...config, toggleStringSearchComick: toggleStringSearch }; // save toggleStringSearch to config
                    await filehandle('config', config); await filehandle('mal', lists); // save config and lists to file
                } else {
                    // if useFirstResult is false, the user is still able to select the Manga from the Manga endpoint fetch
                    // and use said Manga to fetch the chapter endpoint, if useFirstResult is true, autoFetchComickChapters 
                    // fetches the chapter endpoint by taking the first Manga fetch result per each fetch and calling the
                    // chapter endpoint with said results
                    await autoFetchComickChapters(config?.useFirstResultComick);
                }
                break;
            case 6:
                lists = await fetchMAL(); // searches and returns MAL lists
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

        await clearScreen(); // clears console window   

        switch (m) 
        {
            case 0:
                await customLogMAL({anime, manga}, lists);
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

                    await clearScreen(); // clears console window   

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
        console.log('|| 2 -> Filter MAL titles');
        console.log('|| 3 -> Empty options');
        console.log('|| 4 -> Toggle display');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window   

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
                await filterEntriesFromFetch('includeInMangadexFetch');
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

        await clearScreen(); // clears console window   
        
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   
                    
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

                    await clearScreen(); // clears console window   

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
                    /*
                    When changing the option for chapterTranslatedLanguage the user has two options:
                    
                    1. Select from one of the pre-defined language options by inputting 
                       the corresponding number next to desired option

                        e.g. || 0 -> en
                             || 1 -> pl
                    
                    2. Input a custom language code option in one of two formats

                        'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
                    */
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

                    await clearScreen(); // clears console window   

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

async function customFetchMenuComick() {
    let m = 0, count = 0, searchStrings = [], selectionFound = false;
    let toggleStringSearch = config?.toggleStringSearchComick ? config.toggleStringSearchComick : false;
    const useFirstResult = config?.useFirstResultComick ? config.useFirstResultComick : false;

    // the user can either search with an inputted searchString OR
    // search with MAL titles that have includeInComickFetch set as true
    // 
    // 1. Mangas are searched by MAL titles/searchString
    // 2. The user is then presented the search result from which he can pick the 
    //    specific manga/s he want's chapter info about 
    // 3. The specified manga/s is then passed into the chapter endpoint which
    //    then returns the requested chapters 

    while (m !== 'e') 
    {
        // display either MAL selection OR searchString
        // to user, based on toggled preference
        if (!toggleStringSearch) { 
            // log current selection
            console.log('\n||\n|| Current selection:\n||');
            lists.forEach((type) => { // anime/manga
                type.forEach((status) => { // status
                    status.forEach((item) => { // item
                        if (item.includeInComickFetch) { 
                            console.log(`|| ${++count}: ${item.node.title}`);
                            selectionFound = true;
                        }
                    });
                });
            });
            count = 0; // resetting count
            // if no titles were selected show it clearly to user
            if (!selectionFound) {
                console.log('|| - No titles selected\n||');
            } else {
                console.log('||');
                selectionFound = false;
            }
        } else {
            // log current searchStrings
            console.log(`\n||\n|| Current searches:\n||`);
            searchStrings.forEach((search, search_index) => {
                console.log(`|| - ${search}`);
                if (search_index === searchStrings.length-1) console.log('||'); // last index
            });
            if (searchStrings?.length === 0) console.log('|| - No searches found\n||');
        }
        console.log(`\n||\n|| Custom fetch Comick (Search Type: ${!toggleStringSearch ? 'MAL' : 'Strings'})\n||`);
        console.log(`|| 0 -> Fetch with options`);
        console.log(`|| 1 -> ${!toggleStringSearch ? 'Filter MAL titles' : 'Add/Remove searches'}`);
        console.log('|| 2 -> Toggle search type');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clear console window

        switch (m) 
        {
            case 0:
                {
                    let mangaData = false, selectedMangas = [], chapterData = false; 
                    if (!toggleStringSearch) { // fetch Comick by MAL 
                        mangaData = await fetchComickMangas(lists, toggleStringSearch); // returns arr 
                    } else { // fetch Comick by string
                        mangaData = await fetchComickMangas(searchStrings, toggleStringSearch); // returns arr
                    } 
                    if (!mangaData?.length > 0) { 
                        console.log('\n||\n|| Manga endpoint returned no results\n||');
                    } else {
                        if (!useFirstResult) {
                            // select mangas to use in fetch
                            selectedMangas = await selectMangasFromFetchResults(mangaData);
                        } else {
                            // skip manga selection and use the first result from each search
                            mangaData.forEach((search) => { // searches
                                const firstSearchResult = search[0]; // first search result
                                selectedMangas.push(firstSearchResult); // push first search result to selected
                                selectedMangas = [...new Set(selectedMangas)]; // get rid of duplicates
                            });
                        }
                        if (!selectedMangas?.length > 0) {
                            console.log('\n||\n|| No mangas were selected\n||')
                        } else {
                            chapterData = await fetchComickChapters(selectedMangas); // fetching chapters
                            if (!chapterData?.length > 0) console.log('\n||\n|| Chapter endpoint returned no results\n||');
                            else await logComick(selectedMangas, chapterData); // log fetched data
                        } 
                    }
                    break;
                }
            case 1:
                if (!toggleStringSearch) { 
                    await filterEntriesFromFetch('includeInComickFetch'); // include/exlude MAL titles from fetch
                } else { 
                    searchStrings = await changeSearchStrings(searchStrings); // change searchString for Manga fetch
                }
                break;
            case 2:
                // switch for toggling string search
                if (toggleStringSearch) toggleStringSearch = false;
                else toggleStringSearch = true;
                break;
            case 'e': 
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
    return toggleStringSearch;
}

async function autoFetchComickChapters (useFirstResult) { // <-- make useFirstresult to config etc...
    try {
        // At first I'll make this so that it only supports searching by 
        // tagged MAL titles, I might make it so that it somehow searches
        // by using the last searches made by string as well...
        const mangaData = await fetchComickMangas(lists, false); // <-- fetch manga
        let selectedMangas = [], chapterData = []; // holds mangas selected for fetch
        if (!useFirstResult) { // go through selectmangas first
            selectedMangas = await selectMangasFromFetchResults(mangaData); // select mangas use in chapter fetch
        } else { // <-- use first result from manga fetch to fetch chapters
            mangaData.forEach((search) => { // searches
                const firstSearchResult = search[0]; // first search result
                selectedMangas.push(firstSearchResult); // push first search result to selected
                selectedMangas = [...new Set(selectedMangas)]; // get rid of duplicates
            });
        }
        if (!selectedMangas?.length > 0) console.log('\n||\n|| No mangas were selected\n||');
        else {
            chapterData = await fetchComickChapters(selectedMangas); // fetching chapters
            if (!chapterData?.length > 0) console.log('\n||\n|| Chapter endpoint returned no results\n||');
            else await logComick(selectedMangas, chapterData); // log fetched data
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function selectMangasFromFetchResults (mangaData) {
    let m = 0, selectedMangas = [], index = 0;
    // mangaData = array of all searches [[search_1], [search_2]]
    // mangaData[0] = manga endpoint results ['1': {obj, obj}, '2': {obj, obj}, etc...]
    // mangaData[0][0] = specific result { id: 1234, hid: '1234', etc...}
    while (m !== 'e') 
    {
        console.log('\n||\n|| Select Manga from search results:\n||');
        mangaData.forEach((search) => {
            console.log(`|| ${search.searchQuery}:\n||`);
            for (const key in search) { // single search result
                const searchResult = search[key]; // single search result
                if (searchResult !== search.searchQuery) {
                    const title = searchResult?.title ? searchResult.title : 'No Title';
                    console.log(`|| ${index++} -> ${title}`);
                }
            }
            console.log('||');
        });
        const highest_selectable_index = index-1; // last index pointing to searchResults
        // log current selection
        console.log('\n||\n|| Current Selection:\n||');
        selectedMangas.forEach((manga, manga_index) => {
            console.log(`|| - ${manga.title}`);
            if (manga_index === selectedMangas.length-1) console.log('||');
        });
        if (selectedMangas?.length === 0) console.log('|| - No titles selected\n||');
        console.log(`\n||\n|| c -> Clear selections`);
        console.log(`|| e -> ${selectedMangas.length > 0 ? 'Search chapters' : 'Cancel search' }\n||`);
        
        m = await takeUserInput(); // get user input 
        await clearScreen(); // clear console window

        if (m >= 0 && m <= highest_selectable_index) { 
            // push selected searchResult to selectedMangas[]
            let i = 0;
            mangaData.forEach((search) => { // manga endpoint results
                Object.keys(search).forEach((key) => { // search result
                    if (search[key] !== search.searchQuery) {
                        if (i === m) {
                            selectedMangas.push(search[key]); // append searchResult
                            selectedMangas = [...new Set(selectedMangas)]; // get rid of dublicates
                        }
                        i++;
                    }
                });
            });
        } else if (m === 'c') {
            selectedMangas = []; // clear selectedMangas
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
        index = 0; // resetting index
    }
    // return array containing selected mangas
    return selectedMangas;
}

async function changeSearchStrings (searches) {
    let m = 0;

    while (m !== 'e') 
    {
        // log current searches
        console.log(`\n||\n|| Current searches:\n||`);
        searches.forEach((search, search_index) => {
            console.log(`|| - ${search}`);
            if (search_index === searches.length-1) console.log('||'); // last index
        });
        if (searches?.length === 0) console.log('|| - No searches found\n||');
        
        console.log(`\n||\n|| Input desired search:\n||`);
        console.log(`|| c -> Clear searches`);
        console.log(`|| e -> Exit\n||`);

        let userInput = (await rl.question('\n|| Input: ')).trim(); // get user input and remove leading/trailing whitespaces

        await clearScreen(); // clear console window

        // 3 letters or more = added to search
        // c = clears inputs
        // e = exits menu

        if (userInput.length >= 3) { 
            searches.push(userInput); // push search to array
            searches = [...new Set(searches)]; // get rid of duplicates
        } else if (userInput.toLowerCase() === 'c') { 
            searches = []; // clear searches
        } else if (userInput.toLowerCase() === 'e') { 
            m = userInput.toLowerCase(); // exiting while loop
        } else {
            console.log('\n||\n|| Minimum required search length is 3\n||');
        }
    }
    return searches;
}

async function filterEntriesFromFetch (key) { 
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    let m = 0;

    if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`\n||\n|| The received value '${key}' is not valid\n||`);
    } else { // function parameter is an expected value
        while (m !== 'e') 
        {
            // select where to list statuses from
            console.log(`\n||\n|| Filtering ${key}:\n||`);
            console.log('|| 0 -> Filter anime');
            console.log('|| 1 -> Filter manga');
            console.log('|| 2 -> Include all');
            console.log('|| 3 -> Exclude all');
            console.log('|| e -> Go back\n||');

            m = await takeUserInput(); // get user input

            await clearScreen(); // clears console window   
        
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

                    await clearScreen(); // clears console window  

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
                                    console.log(`|| ${index} -> ${item.node.title} ${item[key] ? '[x]' : '[]'}`); 
                                });
                                console.log('|| e -> Go back\n||');             

                                m = await takeUserInput(); // get user input

                                await clearScreen(); // clears console window  
                                
                                // toggling filter at given option
                                if (m > -1 && m < lists[type][status].length) {
                                    const item = lists[type][status][m]; // referring to item
                                    if (item[key]) item[key] = false; 
                                    else item[key] = true;
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
                // reassigning fetch filters as true
                for (const type of lists) {
                    for (const status of type) {
                        for (const item of status) {
                            item[key] = true;
                        }
                    }
                }
                console.log('\n||\n|| Included all titles to fetch\n||');
            } else if (m === 3) {
                // reassigning fetch filters as false
                for (const type of lists) {
                    for (const status of type) {
                        for (const item of status) {
                            item[key] = false;
                        }
                    }
                }
                console.log('\n||\n|| Excluded all titles from fetch\n||');
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
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