import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './ui/menu.js';
import { DEFAULT_config, DEFAULT_lists } from "./helpers/export.js";
import { animeStatus, mangaStatus } from "./helpers/entryHelpers.js";
import { clearScreen } from "./helpers/functions.js";
import { exit, stdin as input, stdout as output } from 'process';
import { resetConfig } from "./controller/controllerConfig.js";
import { clearLocalMALData } from "./controller/controllerMAL.js";
import { clearLocalMDXData, clearLocalMDXFHData } from "./controller/controllerMangadex.js";
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

    const printMessage = false;
    const MAL_PATH     = './data/mal.file';
    const CONFIG_PATH  = './data/config.file';
    const MDX_PATH     = './data/mangadex.file';
    const MDXFH_PATH   = './data/mangadexFetchHistory.file';
    const MAL_FNAME    = 'mal';
    const CONFIG_FNAME = 'config';
    const MDX_FNAME    = 'mangadex';
    const MDXFH_FNAME  = 'mangadexFetchHistory';

    lists                = existsSync(MAL_PATH) ? filehandle(MAL_FNAME) : clearLocalMALData(printMessage);
    config               = existsSync(CONFIG_PATH) ? filehandle(CONFIG_FNAME) : resetConfig(printMessage);
    mangadexData         = existsSync(MDX_PATH) ? filehandle(MDX_FNAME) : clearLocalMDXData(printMessage);
    mangadexFetchHistory = existsSync(MDXFH_PATH) ? filehandle(MDXFH_FNAME) : clearLocalMDXFHData(printMessage);

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