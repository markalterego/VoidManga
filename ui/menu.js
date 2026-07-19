import { menuMAL } from "./menuMAL.js";
import { filehandle, writeEnv } from "../filehandling/filehandle.js";
import { printMenuOptions, takeUserInput } from "../helpers/functions.js";
import { MESSAGE, COMMANDS, DEFAULT_config, SYM } from "../helpers/export.js";
import { menuFetchMangadex } from "./menuFetchMangadex.js";
import { menuLogMangadex } from "./menuLogMangadex.js";
import { logErrorDetails } from "../helpers/errorLogger.js";
import { resetConfig, updateConfig } from "../controller/controllerConfig.js";
import { clearLocalMALData } from '../controller/controllerMAL.js';
import { clearLocalMDXData, clearLocalMDXHData } from "../controller/controllerMangadex.js";

let lists = null;                // animelist and mangalist
let config = null;               // user specific options
let mangadexData = null;         // mangas and chapters
let mangadexFetchHistory = null; // fetch related info

async function menu (l, c, m, mfh) {
    try {
        lists = l; 
        config = c; 
        mangadexData = m; 
        mangadexFetchHistory = mfh; 
        await rootMenu();
    } catch (error) {
        logErrorDetails(error);
    } 
}

async function rootMenu() {
    const MYANIMELIST = 0;
    const MANGADEX_LOG = 1;
    const MANGADEX_FETCH = 2;
    let input = null; 
    
    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'What would you like to do?',
            [
                ['MyAnimeList'], 
                ['Log Mangadex'], 
                ['Fetch Mangadex'], 
                '_', 
                [COMMANDS.MAIN.SETTINGS, 'Settings']
            ]
        );

        input = await takeUserInput();

        if (input === MYANIMELIST) {
            lists = await menuMAL(lists, config); 
        } else if (input === MANGADEX_LOG) {
            await menuLogMangadex(mangadexData, lists, config, mangadexFetchHistory); 
        } else if (input === MANGADEX_FETCH) {
            await menuFetchMangadex(lists, config, mangadexData, mangadexFetchHistory); 
        } else if (input === COMMANDS.MAIN.SETTINGS) {
            await settingsMenu();
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        } 
    }
}

async function settingsMenu() {
    const UPDATE_MAL_API_KEY     = 0; 
    const FETCH_MAL_ON_MENU_OPEN = 1;
    const LOG_AUTH_URL           = 2;
    let input = null;
    
    while (input !== COMMANDS.EXIT) 
    {
        const { menuMALOptions } = config;

        printMenuOptions(
            `Settings (${COMMANDS.MAIN.SETTINGS_EXTRA} ${SYM.POINTS_TO} additional settings)`,
            [
                ['Update MAL_API_CLIENT_ID'], 
                [`Fetch MAL lists when running menuMAL         [${menuMALOptions.fetchMALOnMenuOpen ? 'x' : ''}]`], 
                [`Log authorization URL when re-authenticating [${menuMALOptions.logAuthURL ? 'x' : ''}]`],
                '_',
                [COMMANDS.RESET_DEFAULT_OPTIONS, 'Reset default config options'],
            ]
        );

        input = await takeUserInput(true);

        if (input === COMMANDS.MAIN.SETTINGS_EXTRA) {
            await extraSettingsMenu();
        } else if (input === UPDATE_MAL_API_KEY) {
            await updateAPIKeyMenu();
        } else if (input === FETCH_MAL_ON_MENU_OPEN) {
            updateConfig(config, () => { menuMALOptions.fetchMALOnMenuOpen = !menuMALOptions.fetchMALOnMenuOpen; });
        } else if (input === LOG_AUTH_URL) {
            updateConfig(config, () => { menuMALOptions.logAuthURL = !menuMALOptions.logAuthURL; });
        } else if (input === COMMANDS.RESET_DEFAULT_OPTIONS) {
            config = resetConfig();
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        } 
    }
}

async function extraSettingsMenu() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'WARNING! THESE ACTIONS ARE IRREVERSIBLE!',
            [
                [`${COMMANDS.CLEAR_LOCAL_DATA_MAL} `, 'Clear LOCAL MyAnimeList data'],
                [`${COMMANDS.CLEAR_LOCAL_DATA_MDX} `, 'Clear LOCAL MangaDex data'],
                [COMMANDS.CLEAR_LOCAL_DATA_MDXH,      'Clear LOCAL MangaDex fetch history data'],
                '_'
            ]
        );

        input = await takeUserInput(true, false, { useMixedCase: true });

        if (input === COMMANDS.CLEAR_LOCAL_DATA_MAL) {
            lists = clearLocalMALData();
        } else if (input === COMMANDS.CLEAR_LOCAL_DATA_MDX) {
            mangadexData = clearLocalMDXData();
        } else if (input === COMMANDS.CLEAR_LOCAL_DATA_MDXH) {
            mangadexFetchHistory = clearLocalMDXHData();
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function updateAPIKeyMenu() {
    let input = null;
    
    while (input !== 'e') 
    {
        printMenuOptions(
            'Input MAL_API_CLIENT_ID',
            [
                ['?', 'https://myanimelist.net/apiconfig'], 
                '_'
            ]
        );
        
        input = await takeUserInput();

        const isValidAPIKey = (typeof input === 'string' && input.length === 32); // API key expected length is 32 characters

        if (isValidAPIKey) {
            writeEnv({ MAL_API_CLIENT_ID: input }, true); // write MAL_API_CLIENT_ID to .env
            MESSAGE.print(MESSAGE.UPDATED_MAL_API_KEY);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_MAL_API_KEY);
        }
    }
}

export { menu };

/* Understanding the layout of lists:

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