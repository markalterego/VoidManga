import { takeUserInput, capitalFirstLetterString, printMenuOptions, customFetchMangadexDisplay } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters, MESSAGE, ANIME, MANGA, COMMANDS } from '../helpers/export.js';
import { filehandle } from '../filehandling/filehandle.js';
import { updatePageDetails, pageContent, pagingOptions, isPagingInput } from '../helpers/pageHelpers.js';

let lists = null;
let key = null;
let options = null;
let options_fetch = null;

async function filterEntriesFromFetch (l, k, o = {}, of = {}) {
    lists = l; 
    key = k; 
    options = o;
    options_fetch = of;
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

    while (input !== COMMANDS.MENU.EXIT) 
    {
        const header = `Filtering ${key}:`;
        const optionsArray = [
            ['Filter anime'],
            ['Fitler manga'],
            '_',
            [COMMANDS.MENU.INCLUDE_ALL, 'Include all'],
            [COMMANDS.MENU.EXCLUDE_ALL, 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: options_fetch })}
        );

        input = await takeUserInput(true);

        if (input === ANIME || input === MANGA) {
            await filterStatusMenu(input);
        } else if (input === COMMANDS.MENU.INCLUDE_ALL) {
            flipAllEntries(true);
        } else if (input === COMMANDS.MENU.EXCLUDE_ALL) {
            flipAllEntries(false);
        } else if (input !== COMMANDS.MENU.EXIT) {
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
    
    while (input !== COMMANDS.MENU.EXIT) 
    {
        const header = 'Select a status';
        const statuses = type === ANIME
            ? animeStatus.map(s => [capitalFirstLetterString(s)])
            : mangaStatus.map(s => [capitalFirstLetterString(s)]);
        const optionsArray = [
            ...statuses,
            '_',
            [COMMANDS.MENU.INCLUDE_ALL, 'Include all'],
            [COMMANDS.MENU.EXCLUDE_ALL, 'Exclude all']
        ];

        printMenuOptions(
            header,
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: options_fetch })}
        );

        input = await takeUserInput(true);

        if (isValidInput(input)) { 
            await filterEntriesMenu(type, input); 
        } else if (input === COMMANDS.MENU.INCLUDE_ALL) { 
            flipAllType(type, true);
        } else if (input === COMMANDS.MENU.EXCLUDE_ALL) { 
            flipAllType(type, false);
        } else if (input !== COMMANDS.MENU.EXIT) {
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
    
    while (input !== COMMANDS.MENU.EXIT) 
    {
        pageDetails = options.enablePagingEntries ? updatePageDetails(pageDetails, entries) : pageDetails;
        const pagedEntries = pageContent(entries, pageDetails.currentPageIndex, options.enablePagingEntries);
        const pageFooter = pagedEntries.length && options.enablePagingEntries ? 'p' : null;
        
        const titles = pagedEntries.length ? pagedEntries.map(entry => [`[${entry[key] ? 'x' : ''}] ${entry.node.title}`]) : noTitles;
        const optionsArray = [
            '-',
            '_',
            ...titles,
            pageFooter,
            '_',
            '_',
            [COMMANDS.MENU.INCLUDE_ALL, 'Include all'],
            [COMMANDS.MENU.EXCLUDE_ALL, 'Exclude all'],
            [COMMANDS.MENU.PAGE.TOGGLE, `Toggle paging [${options.enablePagingEntries ? 'x' : ''}]`], 
            ...(options.enablePagingEntries ? [[COMMANDS.MENU.PAGE.NEXT, 'Next page'], [COMMANDS.MENU.PAGE.PREVIOUS, 'Previous page']] : [null])
        ];
            
        printMenuOptions(
            header,
            optionsArray,
            { pageDetails, displayFn: () => customFetchMangadexDisplay({ lists, options: options_fetch }) }
        );

        input = await takeUserInput(true);

        if (input >= 0 && input < pagedEntries.length) {
            pagedEntries[input][key] = !pagedEntries[input][key];
        } else if (input === COMMANDS.MENU.INCLUDE_ALL) { 
            flipAllStatus(type, status, true);
        } else if (input === COMMANDS.MENU.EXCLUDE_ALL) { 
            flipAllStatus(type, status, false);
        } else if (input === COMMANDS.MENU.PAGE.TOGGLE) { 
            options.enablePagingEntries = !options.enablePagingEntries;
        } else if (options.enablePagingEntries && isPagingInput(input)) { // paging options
            pageDetails = pagingOptions(input, entries, pageDetails);
        } else if (input !== COMMANDS.MENU.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

export { filterEntriesFromFetch };