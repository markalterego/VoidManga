import { pollMAL } from "./fetch/pollMAL.js";
import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './input/menu.js';
 
let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options

async function main() {
    if (!existsSync('./regular/mal.file')) {
        lists = await pollMAL(); // searches and returns MAL lists
        await filehandle('mal', lists); // writes mal.file
    } else { 
        lists = await filehandle('mal'); // reads mal.file
    }

    if (!existsSync('./regular/config.file')) {
        config = { ...config, menuOption: 'short', autoFetchMangadex: false }; // setting initial menu preference
        await filehandle('config', config); // writes config.file
    } else {    
        config = await filehandle('config'); // reads config.file
    }

    await menu(lists, config);
}

main();

/*
TODO (or not to do...)

- pollMangadex should poll into a const, the same as pollMAL

- filehandle should get both polling results as input and save that info into 'mal.file' and e.g. 'mangadex.file' respectively

- make it possible to list a series in a category (e.g. watching) and then by inputting the number of the series print out all dates at which the series was updated, essentially see how you progressed along the series

- an option to print out the complete history of every update to MAL (ascending/descending by date)

- make it possible to do custom polling through ui in pollMangadex.js

- make it possible to exclude specific titles when polling Mangadex

- add an option to settings for enable/disable auto search (poll instantly when using pollMangadex.js [no additional menu at pollMangadex.js]) for mangadex polls

- make it possible to do custom log MAL stuff in logtoconsole.js <- add the possibility to log only specific stuff found per item of lists[i][ii] 
*/