import { takeUserInput, capitalFirstLetterString, printMenuOptions, customFetchMangadexDisplay } from '../helpers/functions.js';
import { expectedFilters, MESSAGE, COMMANDS } from '../helpers/export.js';
import { animeStatus, mangaStatus, ANIME, MANGA } from '../helpers/entryHelpers.js';
const { PAGE } = COMMANDS;
import { filehandle } from '../filehandling/filehandle.js';
import { updatePageDetails, pageContent, pagingOptions, isPagingInput } from '../helpers/pageHelpers.js';

let lists = null;
let key = null;
let menuFetchFiltersOptions = null;
let fetchMangadexOptions = null;

async function filterEntriesFromFetch (l, k, o = {}, of = {}) {
    lists = l; 
    key = k; 
    menuFetchFiltersOptions = o;
    fetchMangadexOptions = of;
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

    while (input !== COMMANDS.EXIT) 
    {
        const header = `Filtering ${key}:`;
        const optionsArray = [
            ['Filter anime'],
            ['Filter manga'],
            '_',
            [COMMANDS.INCLUDE_ALL, 'Include all'],
            [COMMANDS.EXCLUDE_ALL, 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);

        if (input === ANIME || input === MANGA) {
            await filterStatusMenu(input);
        } else if (input === COMMANDS.INCLUDE_ALL) {
            flipAllEntries(true);
        } else if (input === COMMANDS.EXCLUDE_ALL) {
            flipAllEntries(false);
        } else if (input !== COMMANDS.EXIT) {
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
    
    while (input !== COMMANDS.EXIT) 
    {
        const header = 'Select a status';
        const statuses = type === ANIME
            ? animeStatus.map(s => [capitalFirstLetterString(s)])
            : mangaStatus.map(s => [capitalFirstLetterString(s)]);
        const optionsArray = [
            ...statuses,
            '_',
            [COMMANDS.INCLUDE_ALL, 'Include all'],
            [COMMANDS.EXCLUDE_ALL, 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);

        if (isValidInput(input)) { 
            await filterEntriesMenu(type, input); 
        } else if (input === COMMANDS.INCLUDE_ALL) { 
            flipAllType(type, true);
        } else if (input === COMMANDS.EXCLUDE_ALL) { 
            flipAllType(type, false);
        } else if (input !== COMMANDS.EXIT) {
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
    let pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }; 

    const header = 'Select titles to be fetched';
    const entries = lists[type][status];
    const noTitles = [['-', 'No titles found', null]];
    
    while (input !== COMMANDS.EXIT) 
    {
        pageDetails = menuFetchFiltersOptions.enablePagingEntries ? updatePageDetails(pageDetails, entries) : pageDetails;
        const pagedEntries = pageContent(entries, pageDetails.currentPageIndex, menuFetchFiltersOptions.enablePagingEntries);
        const pageFooter = pagedEntries.length && menuFetchFiltersOptions.enablePagingEntries ? 'p' : null;
        
        const titles = pagedEntries.length ? pagedEntries.map(entry => [`[${entry[key] ? 'x' : ''}] ${entry.node.title}`]) : noTitles;
        const optionsArray = [
            '-',
            '_',
            ...titles,
            pageFooter,
            '_',
            '_',
            [COMMANDS.INCLUDE_ALL, 'Include all'],
            [COMMANDS.EXCLUDE_ALL, 'Exclude all'],
            [PAGE.TOGGLE, `Toggle paging [${menuFetchFiltersOptions.enablePagingEntries ? 'x' : ''}]`], 
            ...(menuFetchFiltersOptions.enablePagingEntries ? [[PAGE.NEXT, 'Next page'], [PAGE.PREVIOUS, 'Previous page']] : [null])
        ];
            
        printMenuOptions(
            header,
            optionsArray,
            { pageDetails, displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions }) }
        );

        input = await takeUserInput(true);

        if (input >= 0 && input < pagedEntries.length) {
            pagedEntries[input][key] = !pagedEntries[input][key];
        } else if (input === COMMANDS.INCLUDE_ALL) { 
            flipAllStatus(type, status, true);
        } else if (input === COMMANDS.EXCLUDE_ALL) { 
            flipAllStatus(type, status, false);
        } else if (input === PAGE.TOGGLE) { 
            menuFetchFiltersOptions.enablePagingEntries = !menuFetchFiltersOptions.enablePagingEntries;
        } else if (menuFetchFiltersOptions.enablePagingEntries && isPagingInput(input)) { // paging menuFetchFiltersOptions
            pageDetails = pagingOptions(input, entries, pageDetails);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

export { filterEntriesFromFetch };