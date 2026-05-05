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
        console.log(`\n  MAL lists not found`);
    } else if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`\n  The received value '${key}' is not valid`);
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
        console.log(`\n  Filtering ${key}:\n`);
        console.log('  0 -> Filter anime');
        console.log('  1 -> Filter manga');
        console.log('\n  ± -> Include/Exclude all');
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
            console.log('\n  Included all titles to fetch');
        } else if (input === '-') {
            // reassigning fetch filters as false
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item[key] = false;
                    }
                }
            }
            console.log('\n  Excluded all titles from fetch');
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

        console.log('\n  Select a status\n');
        if (type === ANIME) { // anime
            animeStatus.forEach((status, index) => {
                console.log(`  ${index} -> ${capitalFirstLetterString(status)}`);
            });
        } else { // manga
            mangaStatus.forEach((status, index) => {
                console.log(`  ${index} -> ${capitalFirstLetterString(status)}`);
            });
        }
        console.log('\n  ± -> Include/Exclude all');
        console.log('  e -> Go back');

        input = await takeUserInput();

        // logging titles by status
        if ((type === ANIME && input < animeStatus.length) || (type === MANGA && input < mangaStatus.length)) { 
            // saving the selected status
            const status = input;
            // going back to upper menu in case lists[type][status] is empty
            if (!lists[type][status].length) { 
                console.log('\n  No titles found for the selected status\n'); 
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
            console.log(`\n  Included all ${type ? 'manga' : 'anime'} titles to fetch\n`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = false;
                }
            }
            console.log(`\n  Excluded all ${type ? 'manga' : 'anime'} titles from fetch\n`);
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

        console.log('\n  Select titles to be fetched\n')
        lists[type][status].forEach((item, index) => {
            console.log(`  ${index} -> ${item.node.title} ${item[key] ? '[x]' : '[]'}`); 
        });
        console.log('\n  ± -> Include/Exclude all');
        console.log('  e -> Go back\n');

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
            console.log(`\n  Included all ${type ? mangaStatus[status] : animeStatus[status]} titles to fetch\n`);
        } else if (input === '-') { // exclude all
            // reassigning fetch filters as false
            for (const item of lists[type][status]) {
                item[key] = false;
            }
            console.log(`\n  Excluded all ${type ? mangaStatus[status] : animeStatus[status]} titles from fetch\n`);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

export { filterEntriesFromFetch };