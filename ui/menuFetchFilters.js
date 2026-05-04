import { takeUserInput, menuFetchFiltersDisplay, capitalFirstLetterString } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters } from '../helpers/export.js';
import { filehandle } from '../filehandling/filehandle.js';

const ANIME = 0, MANGA = 1;
let lists = null;
let key = null;

async function filterEntriesFromFetch (l, k) {      
    lists = l; key = k; // referring lists and key accordingly
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    if (!lists) { // lists was undefined in given parameters
        console.log(`  MAL lists not found`);
    } else if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`  The received value '${key}' is not valid`);
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
        // display current filters
        menuFetchFiltersDisplay(lists, key);
        // select where to list statuses from
        console.log(`  Filtering ${key}:`);
        console.log('  0 -> Filter anime');
        console.log('  1 -> Filter manga');
        console.log('  ± -> Include/Exclude all');
        console.log('  e -> Go back');

        input = await takeUserInput();

        if (input === ANIME || input === MANGA) {
            // selecting status
            const type = input;
            await filterStatusMenu(type);
        } else if (input === '+') {
            // reassigning fetch filters as true
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item[key] = true;
                    }
                }
            }
            console.log('  Included all titles to fetch');
        } else if (input === '-') {
            // reassigning fetch filters as false
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item[key] = false;
                    }
                }
            }
            console.log('  Excluded all titles from fetch');
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function filterStatusMenu (type) {
    let input = 0;
    
    while (input !== 'e') 
    {
        // display current filters
        menuFetchFiltersDisplay(lists, key);

        console.log('  Select a status');
        if (type === ANIME) { // anime
            animeStatus.forEach((status, index) => {
                console.log(`  ${index} -> ${capitalFirstLetterString(status)}`);
            });
        } else { // manga
            mangaStatus.forEach((status, index) => {
                console.log(`  ${index} -> ${capitalFirstLetterString(status)}`);
            });
        }
        console.log('  ± -> Include/Exclude all');
        console.log('  e -> Go back');

        input = await takeUserInput();

        // logging titles by status
        if ((type === ANIME && input < animeStatus.length) || (type === MANGA && input < mangaStatus.length)) { 
            // saving the selected status
            const status = input;
            // going back to upper menu in case lists[type][status] is empty
            if (!lists[type][status].length) { 
                console.log('  No titles found for the selected status'); 
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
            console.log(`  Included all ${type ? 'manga' : 'anime'} titles to fetch`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = false;
                }
            }
            console.log(`  Excluded all ${type ? 'manga' : 'anime'} titles from fetch`);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function filterEntriesMenu (type, status) {
    let input = 0;

    while (input !== 'e') 
    {
        // display current filters
        menuFetchFiltersDisplay(lists, key);  

        console.log('  Select titles to be fetched')
        lists[type][status].forEach((item, index) => {
            console.log(`  ${index} -> ${item.node.title} ${item[key] ? '[x]' : '[]'}`); 
        });
        console.log('  ± -> Include/Exclude all');
        console.log('  e -> Go back');

        input = await takeUserInput();

        // toggling filter at given option
        if (input > -1 && input < lists[type][status].length) {
            const item = lists[type][status][input]; // referring to item
            if (item[key]) item[key] = false; 
            else item[key] = true;
        } else if (input === '+') { // include all
            // reassigning fetch filters as true
            for (const item of lists[type][status]) {
                item[key] = true;
            }
            console.log(`  Included all ${type ? mangaStatus[status] : animeStatus[status]} titles to fetch`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const item of lists[type][status]) {
                item[key] = false;
            }
            console.log(`  Excluded all ${type ? mangaStatus[status] : animeStatus[status]} titles from fetch`);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

export { filterEntriesFromFetch };