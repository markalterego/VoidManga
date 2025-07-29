import { pollMAL } from "../fetch/pollMAL.js";
import { pollMangadex } from "../fetch/pollMangadex.js";
import { log } from "../output/logtoconsole.js";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { filehandle } from "../filehandling/filehandle.js";
import { animeStatus, mangaStatus } from "../regular/export.js";

let lists = null; // holds animelist and mangalist, refer to bottom of file for more info on syntax
let config = null; // holds user specific options
let refresh = true; // loops through menu while set to true
const rl = readline.createInterface({ input, output }); // enabling input/output

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
                console.log('\n|| Given menuOption doesn\'t exist');
            }
        }
    } catch (error) {
        if (error.code==='ABORT_ERR') console.error(); // extra newline for extra cleanliness :)
        console.error(`\n||\n|| Error: ${error.message}\n||`); // handles e.g. CTRL + C
    } finally {
        rl.close(); 
    }
}

async function shortMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 8) 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Watching anime');
        console.log('|| 1 -> Completed anime');
        console.log('|| 2 -> Reading manga');
        console.log('|| 3 -> Completed manga');
        console.log('|| 4 -> Full list');
        console.log('|| 5 -> Poll mangadex');
        console.log('|| 6 -> Poll mal');
        console.log('|| 7 -> Clear screen');
        console.log('|| 8 -> Exit\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime: [0]}, lists);
                break;
            case 1:
                await log({anime: [1]}, lists);
                break;
            case 2:
                await log({manga: [0]}, lists);
                break;
            case 3:
                await log({manga: [1]}, lists);
                break;
            case 4:
                await log({anime: [0,1,2,3,4], manga: [0,1,2,3,4]}, lists);
                break;
            case 5:
                await pollMangadex(lists); // searches for newest chapters   
                break;
            case 6:
                lists = await pollMAL(); // searches and returns MAL lists
                await filehandle('mal', lists);
                break;
            case 7:
                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                break;
            case 8:
                break;
            case 888:
                await settingsMenu(); 
                r = true; m = 8; // goes out of loop and refreshes menu
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }

    return r;
}

async function longMenu() {
    let m = 0, r = false; // m = menu, r = refresh
    
    while (m !== 14) 
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
        console.log('|| 11 -> Poll mangadex');
        console.log('|| 12 -> Poll mal');
        console.log('|| 13 -> Clear screen');
        console.log('|| 14 -> Exit\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime: [0]}, lists);
                break;
            case 1:
                await log({anime: [1]}, lists);
                break;
            case 2:
                await log({anime: [2]}, lists);
                break;
            case 3:
                await log({anime: [3]}, lists);
                break;
            case 4:
                await log({anime: [4]}, lists);
                break;
            case 5:
                await log({manga: [0]}, lists);
                break;
            case 6:
                await log({manga: [1]}, lists);
                break;
            case 7:
                await log({manga: [2]}, lists);
                break;
            case 8:
                await log({manga: [3]}, lists);
                break;
            case 9:
                await log({manga: [4]}, lists);
                break;
            case 10:
                await log({anime: [0,1,2,3,4], manga: [0,1,2,3,4]}, lists);
                break;
            case 11:
                await pollMangadex(lists); // searches for newest chapters   
                break;
            case 12:
                lists = await pollMAL(); // searches and returns MAL lists
                await filehandle('mal', lists);
                break;
            case 13:
                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                break;
            case 14:
                break;
            case 888:
                await settingsMenu(); 
                r = true; m = 14; // goes out of loop and refreshes menu
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }

    return r;
}

async function settingsMenu() {
    let m = 0;
    
    while (m !== 3) 
    {
        console.log('\n||\n|| Settings (+experimental)\n||');
        console.log(`|| 0 -> Toggle ${config.menuOption === 'short' ? 'long' : 'short'}Menu`);
        console.log(`|| 1 -> Automatically fetch Mangadex when polling (currently ${config.autoFetchMangadex ? 'on' : 'off'})`);
        console.log('|| 2 -> Custom log MAL');
        console.log('|| 3 -> Return to main menu\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0: 
                if (config.menuOption === 'short') config = { ...config, menuOption: 'long' }; else config = { ...config, menuOption: 'short' }; // changing menuOption
                m = 2; await filehandle('config', config); // writes config.file
                break;
            case 1:
                if (config.autoFetchMangadex) config = { ...config, autoFetchMangadex: false }; else config = { ...config, autoFetchMangadex: true }; // toggling autofetching on Mangadex
                m = 2; await filehandle('config', config); // writes config.file
                break;
            case 2:
                await customLogMenu();
                break;
            case 3:
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

async function customLogMenu() {
    let m = 0, boolRemove = false, anime = [], manga = [], boolDisplay = false;

    while (m !== 5) 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
            console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
        }

        console.log('\n||\n|| Custom log MAL\n||');
        console.log('|| 0 -> Log with options');
        console.log('|| 1 -> Anime options');
        console.log('|| 2 -> Manga options');
        console.log('|| 3 -> Empty options');
        console.log('|| 4 -> Toggle display');
        console.log('|| 5 -> Return to settings menu\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0:
                await log({anime, manga}, lists);
                break;
            case 1:
                while (m !== 6) 
                {
                    if (boolDisplay) { // show if boolDisplay toggled
                        console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
                        console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
                    }

                    console.log('\n||\n|| Custom log MAL\n||');
                    console.log(`|| 0 -> ${!boolRemove ? 'Add' : 'Remove'} watching`);
                    console.log(`|| 1 -> ${!boolRemove ? 'Add' : 'Remove'} completed`);
                    console.log(`|| 2 -> ${!boolRemove ? 'Add' : 'Remove'} on_hold`);
                    console.log(`|| 3 -> ${!boolRemove ? 'Add' : 'Remove'} dropped`);
                    console.log(`|| 4 -> ${!boolRemove ? 'Add' : 'Remove'} plan_to_watch`);
                    console.log(`|| 5 -> Toggle add/remove (currently ${!boolRemove ? 'add' : 'remove'})`);
                    console.log('|| 6 -> Go back\n||');

                    const userInput = await rl.question('\n|| Input: '); // get user input
                    m = parseInt(userInput, 10); // convert userinput to int

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

                    if (m < 5 && m > -1) { // add/remove entry
                        if (!boolRemove) {
                            anime.push(m); // add new entry
                            anime = [...new Set(anime)]; // removing duplicates
                            anime.sort((a, b) => a - b); // sort in ascending order
                        } else {
                            anime = anime.filter(value => value !== m); // remove entries corresponding to m
                        }
                    } else if (m === 5) { // toggle add/remove
                        if (!boolRemove) boolRemove = true; 
                        else boolRemove = false; 
                    } else if (m !== 6) {
                        console.log('\n|| Please input a valid option'); 
                    }
                }
                break;
            case 2:
                while (m !== 6) 
                {
                    if (boolDisplay) { // show if boolDisplay toggled
                        console.log(`\n||\n|| anime: [${anime.map(item => animeStatus[item])}]`);
                        console.log(`|| manga: [${manga.map(item => mangaStatus[item])}]\n||`);
                    }

                    console.log('\n||\n|| Custom log MAL\n||');
                    console.log(`|| 0 -> ${!boolRemove ? 'Add' : 'Remove'} reading`);
                    console.log(`|| 1 -> ${!boolRemove ? 'Add' : 'Remove'} completed`);
                    console.log(`|| 2 -> ${!boolRemove ? 'Add' : 'Remove'} on_hold`);
                    console.log(`|| 3 -> ${!boolRemove ? 'Add' : 'Remove'} dropped`);
                    console.log(`|| 4 -> ${!boolRemove ? 'Add' : 'Remove'} plan_to_read`);
                    console.log(`|| 5 -> Toggle add/remove (currently ${!boolRemove ? 'add' : 'remove'})`);
                    console.log('|| 6 -> Go back\n||');

                    const userInput = await rl.question('\n|| Input: '); // get user input
                    m = parseInt(userInput, 10); // convert userinput to int

                    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

                    if (m < 5 && m > -1) { // add/remove entry
                        if (!boolRemove) {
                            manga.push(m); // add new entry
                            manga = [...new Set(manga)]; // removing duplicates
                            manga.sort((a, b) => a - b); // sort in ascending order
                        } else {
                            manga = manga.filter(value => value !== m); // remove entries corresponding to m
                        }
                    } else if (m === 5) { // toggle add/remove
                        if (!boolRemove) boolRemove = true; 
                        else boolRemove = false; 
                    } else if (m !== 6) {
                        console.log('\n|| Please input a valid option'); 
                    }
                }
                break;
            case 3:
                // re-initializing anime/manga as empty
                anime = [], manga = []; 
                console.log('\n||\n|| Cleared all selected anime/manga options\n||');
                break;
            case 4:
                // toggling boolDisplayOptions
                if (!boolDisplay) boolDisplay = true; 
                else boolDisplay = false; 
                break;
            case 5:
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