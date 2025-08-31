import { fetchMAL } from "./fetch/fetchMAL.js";
import { filehandle } from "./filehandling/filehandle.js";
import { existsSync } from 'fs';
import { menu } from './ui/menu.js';
import { fetchMangadexOptions } from "./helpers/export.js";
import { clearScreen } from "./helpers/functions.js";
import { stdin as input, stdout as output } from 'process';
import readline from 'readline/promises';
import { chromium } from "playwright";

let lists = null; // holds animelist and mangalist, more info regarding syntax at the bottom of menu.js
let config = null; // holds user specific options
const rl = readline.createInterface({ input , output }); // enabling input/output

// launching and initializing a browser instance
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ // both viewport and userAgent definitions are essential
    viewport: { width: 1280, height: 800}, 
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});
const page = await context.newPage(); // opening a new page in browser
await page.addInitScript(() => { // runs before loading each site
    Object.defineProperty(navigator, 'webdriver', { get: () => false }); // I'm not a bot flag
});

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
            boolDisplayMAL: false,
            boolDisplayMangadex: false,
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
    await browser.close(); // closing browser instance
}

export { rl, page }; // exporting readline

/*
TODO (or not to do...)

- make it possible to list a series in a category (e.g. watching) and then by inputting the number of the series print out all dates at which the series was updated, essentially see how you progressed along the series

- an option to print out the complete history of every update to MAL (ascending/descending by date)

- logtoconsole.js <- add the possibility to log only specific stuff found per item of lists[i][ii] (more customizable logging...?)

- save Mangadex manga ids to mal.file to enhance fetching... 

- make it so that you can update .env username through e.g. settings menu

- make a separate menu to select titles from your mal lists and then fetch the selected ones from comick api (opposite of exluding feature at mangadex fetch)

- integrate headless browser into main and similar logic as found in localserver files
*/