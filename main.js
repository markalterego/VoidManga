import { fetchMAL } from "./fetch/fetchMAL.js";
import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './input/menu.js';
import { fetchMangadexOptions } from "./regular/export.js";
import { stdin as input, stdout as output } from 'process';
import readline from 'readline/promises';

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
const rl = readline.createInterface({ input, output }); // enabling input/output

// main
(async () => {
    if (!existsSync('./regular/mal.file')) {
        lists = await fetchMAL(); // searches and returns MAL lists
        await filehandle('mal', lists); // writes mal.file
    } else { 
        lists = await filehandle('mal'); // reads mal.file
    }

    if (!existsSync('./regular/config.file')) {
        // setting initial menu preference
        config = { 
            ...config, 
            menuOption: 'short', 
            autoFetchMangadex: false, 
            logMALOptions: { anime: [], manga: [] },
            fetchMangadexOptions: fetchMangadexOptions, 
            boolDisplayMAL: false,
            boolDisplayMangadex: false,
        }; 
        await filehandle('config', config); // writes config.file
    } else {    
        config = await filehandle('config'); // reads config.file
    }

    try {
        await menu(lists, config);
    } finally {
        rl.close();
    }  
})()

export { rl };

/*
TODO (or not to do...)

- make it possible to list a series in a category (e.g. watching) and then by inputting the number of the series print out all dates at which the series was updated, essentially see how you progressed along the series

- an option to print out the complete history of every update to MAL (ascending/descending by date)

- logtoconsole.js <- add the possibility to log only specific stuff found per item of lists[i][ii] (more customizable logging...?)

- save Mangadex manga ids to mal.file to enhance fetching... 

- make it so that you can update .env username through e.g. settings menu
*/