import { fetchMAL } from "./fetch/fetchMAL.js";
import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './ui/menu.js';
import { fetchMangadexOptions } from "./helpers/export.js";
import { clearScreen } from "./helpers/functions.js";
import { stdin as input, stdout as output } from 'process';
import readline from 'readline/promises';

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
const rl = readline.createInterface({ input , output }); // enabling input/output

// main
(async () => {
    await clearScreen(); // starting app on a fresh screen

    if (!existsSync('./data/mal.file')) {
        lists = await fetchMAL(); // searches and returns MAL lists
        await filehandle('mal', lists); // writes mal.file
    } else { 
        lists = await filehandle('mal'); // reads mal.file
    }

    if (!existsSync('./data/config.file')) {
        // setting initial menu preference
        config = { 
            ...config,  
            autoFetchMangadex: false, 
            logMALOptions: { anime: [], manga: [] },
            fetchMangadexOptions: fetchMangadexOptions, 
        }; 
        await filehandle('config', config); // writes config.file
    } else {    
        config = await filehandle('config'); // reads config.file
    }

    await menu(lists, config); // menu ui
    await cleanup(); // clears interfaces etc...
})();

async function cleanup() {
    rl.close(); // closing readline interface
}

export { rl }; // exporting readline

/*
TODO (or not to do...)

- make it possible to list a series in a category (e.g. watching) and then by inputting the number of the series print out all dates at which the series was updated, essentially see how you progressed along the series

- an option to print out the complete history of every update to MAL (ascending/descending by date)

- logtoconsole.js <- add the possibility to log only specific stuff found per item of lists[i][ii] (more customizable logging...?)

- save Mangadex manga ids to mal.file to enhance fetching... 

- make it so that you can update .env username through e.g. settings menu

- could try to make it so that when you fetch chapters from Mangadex, you could then, by inputting the index next to the found chapter, automatically open said chapter in the browser on a new tab

- idea for MAL logging... e.g. user presses '0' to log watching from MAL, then can press '0' again and by doing that log the index of some specific entry in list (could also only implement this in customLogMAL) 
*/