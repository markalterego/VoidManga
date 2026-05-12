import { takeUserInput, menuFetchFiltersDisplay, capitalFirstLetterString, 
         printMenuOptions } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters, SYM, MESSAGE } from '../helpers/export.js';
import { filehandle } from '../filehandling/filehandle.js';

const ANIME = 0, MANGA = 1;
let lists = null;
let key = null;

async function filterEntriesFromFetch (l, k) {      
    lists = l; key = k; // referring lists and key accordingly
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    if (!lists) { // lists was undefined in given parameters
        console.log(`\n\n  MAL lists not found`);
    } else if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`\n\n  The received value '${key}' is not valid`);
    } else { // function parameter is an expected value
        await filterTypeMenu();
        // save updated lists to file
        filehandle('mal', lists);
    } 
}

async function filterTypeMenu() {
    let input = 0;

    while (input !== 'e') 
    {
        const header = `Filtering ${key}:`;
        const optionsArray = [
            ['Filter anime'],
            ['Fitler manga'],
            '_',
            [SYM.TOGGLE, 'Include/Exclude all']  
        ];

        printMenuOptions(
            header,
            optionsArray  
        );

        input = await takeUserInput();

        if (input === ANIME || input === MANGA) {
            await filterStatusMenu(input);
        } else if (input === '+') {
            lists.flat(2).forEach(e => e[key] = true);
            console.log('\n\n  Included all titles');
        } else if (input === '-') {
            lists.flat(2).forEach(e => e[key] = false);
            console.log('\n\n  Excluded all titles');
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function filterStatusMenu (type) {
    let input = 0;
    
    while (input !== 'e') 
    {
        const header = 'Select a status';
        const statuses = type === ANIME
            ? animeStatus.map(s => [capitalFirstLetterString(s)])
            : mangaStatus.map(s => [capitalFirstLetterString(s)]);
        const optionsArray = [
            ...statuses,
            '_',
            [SYM.TOGGLE, 'Include/Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray
        );

        input = await takeUserInput();

        // logging titles by status
        if ((type === ANIME && input < animeStatus.length) || (type === MANGA && input < mangaStatus.length)) { 
            // saving the selected status
            const status = input;
            // going back to upper menu in case lists[type][status] is empty
            if (!lists[type][status].length) { 
                console.log('\n\n  No titles found for the selected status'); 
            } else {
                await filterEntriesMenu(type, status); // passing type + status
            }
        } else if (input === '+') { // include all
            // reassigning fetch filters as true
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = true;
                }
            }
            console.log(`\n\n  Included all ${type ? 'manga' : 'anime'} titles`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = false;
                }
            }
            console.log(`\n\n  Excluded all ${type ? 'manga' : 'anime'} titles`);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function filterEntriesMenu (type, status) {
    let input = 0;

    while (input !== 'e') 
    {
        const header = 'Select titles to be fetched';
        const entries = lists[type][status];
        const titles = entries.map((entry, index) => [index, `[${entry[key] ? 'x' : ''}] ${entry.node.title}`]);
        const noTitles = [['-', 'No titles found', '']];
        const optionsArray = [
            ...(titles.length ? titles : noTitles),
            '_',
            [SYM.TOGGLE, 'Include/Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray
        );

        input = await takeUserInput();

        // toggling filter at given option
        if (input > -1 && input < lists[type][status].length) {
            const item = lists[type][status][input]; // referring to item
            item[key] = !item[key]; 
        } else if (input === '+') { // include all
            // reassigning fetch filters as true
            for (const item of lists[type][status]) {
                item[key] = true;
            }
            console.log(`\n\n  Included all ${type ? mangaStatus[status] : animeStatus[status]} titles`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const item of lists[type][status]) {
                item[key] = false;
            }
            console.log(`\n\n  Excluded all ${type ? mangaStatus[status] : animeStatus[status]} titles`);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

export { filterEntriesFromFetch };