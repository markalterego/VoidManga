import { pollMAL } from "./fetch/pollMAL.js";
import { pollMangadex } from "./fetch/pollMangadex.js";
import { filehandle } from "./filehandling/filehandle.js";
import { log } from "./output/logtoconsole.js";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { existsSync } from 'fs';

let lists = null; // holds animelist and mangalist, refer to bottom of file for more info on syntax
let config = null; // holds user specific options
const rl = readline.createInterface({ input, output }); // enabling input/output

async function main() 
{
    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
    
    if (!existsSync('mal.file')) {
        lists = await pollMAL(); // searches and returns MAL lists
        await filehandle('mal', lists); // writes mal.file
    } else { 
        lists = await filehandle('mal'); // reads mal.file
    }

    if (!existsSync('config.file')) {
        config = { ...config, menuOption: 'short' }; // setting initial menu preference
        await filehandle('config', config); // writes config.file
    } else {    
        config = await filehandle('config'); // reads config.file
    }

    await menu();
    rl.close(); 
}

async function menu() {
    let refresh = true;
    while (refresh) {
        if (config.menuOption==='short') {
            refresh = await shortMenu(); // displays the short version of the menu
        } else if (config.menuOption==='long') {
            refresh = await longMenu(); // displays the long version of the menu
        } else {
            console.log('\n|| Given menuOption doesn\'t exist');
        }
    }
}

async function shortMenu() {
    let m = 0; let r = false; // m = menu, r = refresh
    
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
                await log('anime_watching', lists);
                break;
            case 1:
                await log('anime_completed', lists);
                break;
            case 2:
                await log('manga_reading', lists);
                break;
            case 3:
                await log('manga_completed', lists);
                break;
            case 4:
                await log('all', lists);
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
    let m = 0; let r = false; // m = menu, r = refresh
    
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
                await log('anime_watching', lists);
                break;
            case 1:
                await log('anime_completed', lists);
                break;
            case 2:
                await log('anime_on_hold', lists);
                break;
            case 3:
                await log('anime_dropped', lists);
                break;
            case 4:
                await log('anime_plan_to_watch', lists);
                break;
            case 5:
                await log('manga_reading', lists);
                break;
            case 6:
                await log('manga_completed', lists);
                break;
            case 7:
                await log('manga_on_hold', lists);
                break;
            case 8:
                await log('manga_dropped', lists);
                break;
            case 9:
                await log('manga_plan_to_read', lists);
                break;
            case 10:
                await log('all', lists);
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
    
    while (m !== 1) 
    {
        console.log('\n||\n|| Settings\n||');
        console.log(`|| 0 -> Toggle ${config.menuOption === 'short' ? 'long' : 'short'}Menu`);
        console.log('|| 1 -> Return to main menu\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int

        process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   

        switch (m) 
        {
            case 0: 
                if (config.menuOption === 'short') config = { ...config, menuOption: 'long' }; else config = { ...config, menuOption: 'short' }; // changing menuOption
                m = 1; await filehandle('config', config); // writes config.file
                break;
            case 1:
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
}

main();

/*
TODO (or not to do...)

- pollMangadex should poll into a const, the same as pollMAL

- filehandle should get both polling results as input and save that info into 'mal.file' and e.g. 'mangadex.file' respectively

- make it possible to list a series in a category (e.g. watching) and then by inputting the number of the series print out all dates at which the series was updated, essentially see how you progressed along the series

- an option to print out the complete history of every update to MAL (ascending/descending by date)

- make it possible to do custom polling through ui in pollMangadex.js

- make it possible to exclude specific titles when polling

- add an option to settings for enable/disable auto search (poll instantly when using pollMangadex.js [no additional menu at pollMangadex.js]) for mangadex polls
*/

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