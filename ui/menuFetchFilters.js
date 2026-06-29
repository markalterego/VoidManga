import { takeUserInput, capitalFirstLetterString, printMenuOptions, customFetchMangadexDisplay } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters, SYM, MESSAGE } from '../helpers/export.js';
import { filehandle } from '../filehandling/filehandle.js';
import { pageContent, updatePageDetails } from './menuLogMangadex.js';

const ANIME = 0; 
const MANGA = 1;
let lists = null;
let key = null;
let options = null;

// TODO:
// - implement paging for traversing entries

async function filterEntriesFromFetch (l, k, o) {      
    lists = l; 
    key = k; 
    options = o;
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    if (!lists) { 
        MESSAGE.print(MESSAGE.LISTS_NOT_FOUND);
    } else if (!isValidFilterKey) { 
        MESSAGE.print(MESSAGE.INVALID_KEY);
    } else { 
        await filterTypeMenu();
        filehandle('mal', lists); // save lists to file
    } 
}

async function filterTypeMenu() {
    const flipAllEntries = (boolean) => {
        lists.flat(Infinity).forEach(e => e[key] = boolean);
        MESSAGE.printFlipMessage(boolean);
    };  
    let input = null;

    while (input !== 'e') 
    {
        const header = `Filtering ${key}:`;
        const optionsArray = [
            ['Filter anime'],
            ['Fitler manga'],
            '_',
            [SYM.INCLUDE, 'Include all'],
            ['c', 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options })}
        );

        input = await takeUserInput(true);

        if (input === ANIME || input === MANGA) {
            await filterStatusMenu(input);
        } else if (input === '+') {
            flipAllEntries(true);
        } else if (input === 'c') {
            flipAllEntries(false);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function filterStatusMenu (type) {
    const isValidInput = (input) => input >= 0 && input < (type === ANIME ? animeStatus.length : mangaStatus.length);
    const flipAllType = (type, boolean) => {
        lists[type].flat(Infinity).forEach(e => e[key] = boolean);
        MESSAGE.printFlipMessage(boolean, type);
    };
    let input = null;
    
    while (input !== 'e') 
    {
        const header = 'Select a status';
        const statuses = type === ANIME
            ? animeStatus.map(s => [capitalFirstLetterString(s)])
            : mangaStatus.map(s => [capitalFirstLetterString(s)]);
        const optionsArray = [
            ...statuses,
            '_',
            [SYM.INCLUDE, 'Include all'],
            ['c', 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options })}
        );

        input = await takeUserInput(true);

        if (isValidInput(input)) { 
            await filterEntriesMenu(type, input); 
        } else if (input === '+') { 
            flipAllType(type, true);
        } else if (input === 'c') { 
            flipAllType(type, false);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function filterEntriesMenu (type, status) {
    const flipAllStatus = (type, status, boolean) => {
        lists[type][status].forEach(e => e[key] = boolean);
        MESSAGE.printFlipMessage(boolean, type, status);
    };
    let input = null;

    while (input !== 'e') 
    {
        const header = 'Select titles to be fetched';
        const entries = lists[type][status];
        const titles = entries.map(entry => [`[${entry[key] ? 'x' : ''}] ${entry.node.title}`]);
        const noTitles = [['-', 'No titles found', null]];
        const optionsArray = [
            ...(titles.length ? titles : noTitles),
            '_',
            [SYM.INCLUDE, 'Include all'],
            ['c', 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options })}
        );

        input = await takeUserInput(true);

        if (input >= 0 && input < lists[type][status].length) {
            const item = lists[type][status][input];
            item[key] = !item[key];
        } else if (input === '+') { 
            flipAllStatus(type, status, true);
        } else if (input === 'c') { 
            flipAllStatus(type, status, false);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

export { filterEntriesFromFetch };