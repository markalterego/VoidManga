import { takeUserInput, menuFetchFiltersDisplay, capitalFirstLetterString } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters } from '../helpers/export.js';

const ANIME = 0, MANGA = 1;
let lists = null;
let key = null;

async function filterEntriesFromFetch (l, k) {      
    lists = l; key = k; // referring lists and key accordingly
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    if (!lists) { // lists was undefined in given parameters
        console.log(`\n||\n|| MAL lists not found\n||`);
    } else if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`\n||\n|| The received value '${key}' is not valid\n||`);
    } else { // function parameter is an expected value
        await filterTypeMenu();
    } 
}

async function filterTypeMenu() {
    let m = 0;

    while (m !== 'e') 
    {
        // display current filters
        menuFetchFiltersDisplay(lists, key);
        // select where to list statuses from
        console.log(`\n||\n|| Filtering ${key}:\n||`);
        console.log('|| 0 -> Filter anime');
        console.log('|| 1 -> Filter manga');
        console.log('||\n|| ± -> Include/Exclude all');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        if (m === ANIME || m === MANGA) {
            // selecting status
            const type = m;
            await filterStatusMenu(type);
        } else if (m === '+') {
            // reassigning fetch filters as true
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item[key] = true;
                    }
                }
            }
            console.log('\n||\n|| Included all titles to fetch\n||');
        } else if (m === '-') {
            // reassigning fetch filters as false
            for (const type of lists) {
                for (const status of type) {
                    for (const item of status) {
                        item[key] = false;
                    }
                }
            }
            console.log('\n||\n|| Excluded all titles from fetch\n||');
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function filterStatusMenu (type) {
    let m = 0;
    
    while (m !== 'e') 
    {
        // display current filters
        menuFetchFiltersDisplay(lists, key);

        console.log('\n||\n|| Select a status\n||');
        if (type === ANIME) { // anime
            animeStatus.forEach((status, index) => {
                console.log(`|| ${index} -> ${capitalFirstLetterString(status)}`);
            });
        } else { // manga
            mangaStatus.forEach((status, index) => {
                console.log(`|| ${index} -> ${capitalFirstLetterString(status)}`);
            });
        }
        console.log('||\n|| ± -> Include/Exclude all');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        // logging titles by status
        if ((type === ANIME && m < animeStatus.length) || (type === MANGA && m < mangaStatus.length)) { 
            // saving the selected status
            const status = m;
            // going back to upper menu in case lists[type][status] is empty
            if (!lists[type][status].length) { 
                console.log('\n||\n|| No titles found for the selected status\n||'); 
            } else {
                await filterEntriesMenu(type, status); // passing type + status
            }
        } else if (m === '+') { // include all
            // reassigning fetch filters as true
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = true;
                }
            }
            console.log(`\n||\n|| Included all ${type ? 'manga' : 'anime'} titles to fetch\n||`);
        } else if (m === '-') { // exclude all
            // reassigning fetch filters as false
            for (const status of lists[type]) {
                for (const item of status) {
                    item[key] = false;
                }
            }
            console.log(`\n||\n|| Excluded all ${type ? 'manga' : 'anime'} titles from fetch\n||`);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function filterEntriesMenu (type, status) {
    let m = 0;

    while (m !== 'e') 
    {
        // display current filters
        menuFetchFiltersDisplay(lists, key);  

        console.log('\n||\n|| Select titles to be fetched\n||')
        lists[type][status].forEach((item, index) => {
            console.log(`|| ${index} -> ${item.node.title} ${item[key] ? '[x]' : '[]'}`); 
        });
        console.log('||\n|| ± -> Include/Exclude all');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        // toggling filter at given option
        if (m > -1 && m < lists[type][status].length) {
            const item = lists[type][status][m]; // referring to item
            if (item[key]) item[key] = false; 
            else item[key] = true;
        } else if (m === '+') { // include all
            // reassigning fetch filters as true
            for (const item of lists[type][status]) {
                item[key] = true;
            }
            console.log(`\n||\n|| Included all ${type ? mangaStatus[status] : animeStatus[status]} titles to fetch\n||`);
        } else if (m === '-') { // exclude all
            // reassigning fetch filters as false
            for (const item of lists[type][status]) {
                item[key] = false;
            }
            console.log(`\n||\n|| Excluded all ${type ? mangaStatus[status] : animeStatus[status]} titles from fetch\n||`);
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

export { filterEntriesFromFetch };