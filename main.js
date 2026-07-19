import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './ui/menu.js';
import { DEFAULT_config, DEFAULT_lists } from "./helpers/export.js";
import { animeStatus, mangaStatus } from "./helpers/entryHelpers.js";
import { clearScreen } from "./helpers/functions.js";
import { stdin as input, stdout as output } from 'process';
import readline from 'readline/promises';
import dotenv from 'dotenv';

let lists = null; // animelist and mangalist
let config = null; // user specific options
let mangadexData = null; // mangas and chapters
let mangadexFetchHistory = null; // fetch related info
const rl = readline.createInterface({ input , output }); // enabling input/output
dotenv.config(); // load .env file to process.env

// main
(async () => {
    clearScreen(); // starting app on a fresh screen

    // prior to running menu.js, lists, config, mangadexData and mangadexFetchHistory
    // are either initialized and saved to file or simply retrieved from their respective
    // files (lists = mal.file, config = config.file, mangadexData = mangadex.file, 
    // mangadexFetchHistory = mangadexFetchHistory.file)

    if (!existsSync('./data/mal.file')) {
        lists = DEFAULT_lists;
        filehandle('mal', lists); 
    } else {
        lists = filehandle('mal'); 
    }

    if (!existsSync('./data/config.file')) {
        config = DEFAULT_config;
        filehandle('config', config);
    } else {    
        config = filehandle('config');
    }

    if (!existsSync('./data/mangadex.file')) {
        mangadexData = [];
        filehandle('mangadex', mangadexData);
    } else {
        mangadexData = filehandle('mangadex');
    }

    if (!existsSync('./data/mangadexFetchHistory.file')) {
        mangadexFetchHistory = [];
        filehandle('mangadexFetchHistory', mangadexFetchHistory);
    } else {
        mangadexFetchHistory = filehandle('mangadexFetchHistory');
    }

    await menu(lists, config, mangadexData, mangadexFetchHistory); // menu ui
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

- save Mangadex manga ids to mal.file to enhance fetching... 
*/