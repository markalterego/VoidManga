import { pollMAL } from "./fetch/pollMAL.js";
import { pollMangadex } from "./fetch/pollMangadex.js";
import { filehandle } from "./filehandling/filehandle.js";
import { log } from "./output/logtoconsole.js";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { existsSync } from 'fs';

let lists = null; // holds animelist and mangalist, refer to bottom of file for more info on syntax

async function main() 
{
    process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
    
    if (!existsSync('mal.file')) {
        lists = await pollMAL(); // searches and returns MAL lists
        await filehandle(lists);
    } else { 
        lists = await filehandle();
    }

    await menu(lists);
}

async function menu (lists) {

    const rl = readline.createInterface({ input, output });
    let m = 0;
    
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
                await filehandle(lists);
                break;
            case 13:
                process.stdout.write('\x1Bc'); // ANSI for full terminal reset (using in place of cls [this actually works])   
                break;
            case 14:
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }

    rl.close();
}

main();

/*
TODO (or not to do...)

- refine polling, e.g. only one poll for the anime and one for manga

- pollMangadex should poll into a const, the same as pollMAL

- filehandle should get both polling results as input and save that info into 'mal.file' and e.g. 'mangadex.file' respectively
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