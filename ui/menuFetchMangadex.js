import { takeUserInput, customFetchMangadexDisplay, printMenuOptions, capitalFirstLetterString, isValidLangCode } from "../helpers/functions.js";
import { MANGA } from '../helpers/entryHelpers.js'
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, DEFAULT_fetchMangadexOptions, MESSAGE, COMMANDS } from "../helpers/export.js";
const { FETCH } = COMMANDS.MDX;
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchWithOptions } from '../controller/controllerMangadex.js';
import { filehandle } from "../filehandling/filehandle.js";
import { updateConfig } from "../controller/controllerConfig.js";

let lists = null;
let config = null;
let fetchMangadexOptions = null;
let mangadexData = null;
let mangadexFetchHistory = null;

async function menuFetchMangadex (l, c, m, mfh) {
    const FETCH_MANGADEX = 0;
    const CHANGE_OPTIONS = 1;
    let input = null;

    lists = l;
    config = c;
    ({ fetchMangadexOptions } = config); 
    mangadexData = m;
    mangadexFetchHistory = mfh;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Custom fetch Mangadex',
            [
                ['Fetch with options'], 
                ['Change options'],
                '_'
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);

        if (input === FETCH_MANGADEX) {
            await fetchWithOptions({
                l: lists,
                md: mangadexData,
                mfh: mangadexFetchHistory, 
                o: fetchMangadexOptions
            });
        } else if (input === CHANGE_OPTIONS) {
            await fetchOptionsMenu();
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function fetchOptionsMenu() {
    const SEARCHQUEUE = 0;
    const MANGAFETCH = 1; 
    const CHAPTERFETCH = 2; 
    const CHANGECONTENTRATING = 3;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Change fetch options',
            [
                ['Manage search queue'],
                ['Manga options'],
                ['Chapter options'],
                ['Content ratings'],
                '_',
                [FETCH.TOGGLE_QUEUE_TYPE, `Search mangas using ${fetchMangadexOptions.fetchMangasByMALTitles ? 'manual input' : 'MAL titles'}`],
                [FETCH.TOGGLE_FETCH_ALL_CHAPTERS, `Fetch all chapters [${fetchMangadexOptions.fetchAllChapters ? 'x' : ''}]`],
                [COMMANDS.RESET_DEFAULT_OPTIONS, 'Reset default options']
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);
        
        if (input === SEARCHQUEUE) { // Include/exclude titles
            fetchMangadexOptions.fetchMangasByMALTitles ? await filterEntriesFromFetch(lists, 'includeInMangadexFetch', config.menuFetchFiltersOptions, fetchMangadexOptions) : await mangaSearchStringsMenu();
        } else if (input === MANGAFETCH) { // manga fetch options
            await mangaOptionsMenu();
        } else if (input === CHAPTERFETCH) { // chapter fetch options
            await chapterOptionsMenu();
        } else if (input === CHANGECONTENTRATING) { // change content ratings (manga && chapter both use the same content rating option)
            await optionContentRatings();
        } else if (input === FETCH.TOGGLE_QUEUE_TYPE) { // toggle fetching mangas by selected MAL titles
            fetchMangadexOptions.fetchMangasByMALTitles = !fetchMangadexOptions.fetchMangasByMALTitles;
        } else if (input === FETCH.TOGGLE_FETCH_ALL_CHAPTERS) { // toggle fetching all chapters per selected manga
            fetchMangadexOptions.fetchAllChapters = !fetchMangadexOptions.fetchAllChapters;
        } else if (input === COMMANDS.RESET_DEFAULT_OPTIONS) { // reset default options
            // when an object is converted to string (JSON.stringify), the object's format changes and therefore reference breaks
            // we can then convert the changed string into an object (JSON.parse), which means we've succesfully cloned an object
            config.fetchMangadexOptions = JSON.parse(JSON.stringify(DEFAULT_fetchMangadexOptions));
            ({ fetchMangadexOptions } = config); 
            filehandle('config', config);
            MESSAGE.print(MESSAGE.RESET_OPTIONS);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaSearchStringsMenu() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const optionsArray = [
            ['?', 'Add to queue'],
            '_',
            [COMMANDS.CLEAR, 'Clear queue']
        ];

        printMenuOptions(
            'Search queue',
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(false, true, { useMixedCase: true });
        
        if (typeof input === 'string' && input.length && input !== COMMANDS.EXIT && input !== 'c') {
            fetchMangadexOptions.mangaSearchStrings = [...new Set(fetchMangadexOptions.mangaSearchStrings).add(input)];
        } else if (input === COMMANDS.CLEAR) {
            fetchMangadexOptions.mangaSearchStrings = [];
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaOptionsMenu() {
    const MANGAFETCHSIZE = 0;
    const MANGAORDER = 1;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Manga options',
            [
                ['Manga fetch size'],
                ['Manga order'],
                '_'
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);
        
        if (input === MANGAFETCHSIZE) { // limit_manga
            await optionMangaLimit();
        } else if (input === MANGAORDER) { // mangaOrderType && mangaOrderDirection
            await optionMangaOrder();
        } else if (input !== COMMANDS.EXIT) { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionMangaLimit() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Manga fetch size',
            [
                ['?', 'Input a value between 0-100'],
                '_'
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= 100) {
            fetchMangadexOptions.limit_manga = input;
        } else if (input > 100 || input < 0) {
            console.log('\n\n  The given value has to be be between 0-100');
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionMangaOrder() {
    let input = null;

    // order types: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    // order directions: 'asc', 'desc'    

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Manga order',
            [
                ...Object.keys(mangaOrderTypes).map(orderType => [capitalFirstLetterString(orderType)]), 
                '_',
                [FETCH.TOGGLE_ORDER_DIRECTION, 'Toggle direction']
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true); 

        // handle user choice
        if (input >= 0 && input < Object.keys(mangaOrderTypes).length) { // selected type option
            fetchMangadexOptions.mangaOrderType = Object.keys(mangaOrderTypes)[input];
        } else if (input === FETCH.TOGGLE_ORDER_DIRECTION) { // toggle order direction -- highest selectable index
            fetchMangadexOptions.mangaOrderDirection = fetchMangadexOptions.mangaOrderDirection === 'asc' ? 'desc' : 'asc'; 
        } else if (input !== COMMANDS.EXIT) { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function chapterOptionsMenu() {
    const CHAPTERFETCHSIZE = fetchMangadexOptions.fetchAllChapters ? null : 0;
    const CHAPTERORDER = fetchMangadexOptions.fetchAllChapters ? null : 1;
    const CHAPTEROFFSET = fetchMangadexOptions.fetchAllChapters ? null : 2; 
    const CHAPTERLANGUAGES = fetchMangadexOptions.fetchAllChapters ? 0 : 3;
    let input = null;

    // some menu options are hidden + made inaccessible on purpose
    // when the user has set fetchMangadexOptions.fetchAllChapters = true, as the 
    // options limit_chapter && chapterOrderType && chapterOrderDirection &&
    // offset_chapter are not used at all when fetching with fetchMangadexOptions.fetchAllChapters
    // set to true

    while (input !== COMMANDS.EXIT) 
    {
        const chapterOptionsCustom = [
            ['Chapter fetch size'], 
            ['Chapter order'], 
            ['Chapter offset'], 
            ['Chapter languages'], 
            '_'
        ];
        const chapterOptionsAll = [
            ['Chapter languages'], 
            '_'
        ];
        const optionsArray = fetchMangadexOptions.fetchAllChapters
            ? chapterOptionsAll
            : chapterOptionsCustom;

        // print menu options
        printMenuOptions(
            'Chapter options',
            optionsArray,
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(true);

        if (!fetchMangadexOptions.fetchAllChapters && input === CHAPTERFETCHSIZE) { // limit_chapter
            await optionChapterLimit();
        } else if (!fetchMangadexOptions.fetchAllChapters && input === CHAPTERORDER) { // chapterOrderType && chapterOrderDirection
            await optionChapterOrder();
        } else if (!fetchMangadexOptions.fetchAllChapters && input === CHAPTEROFFSET) { // offset_chapter
            await optionChapterOffset();
        } else if (input === CHAPTERLANGUAGES) { // chapterTranslatedLanguage
            await optionChapterLanguages();
        } else if (input !== COMMANDS.EXIT) { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterLimit() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Chapter fetch size',
            [
                ['?', 'Input a value between 0-100'],
                '_'
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= 100) {
            fetchMangadexOptions.limit_chapter = input;
        } else if (input > 100 || input < 0) {
            console.log('\n\n  The given value has to be be between 0-100');
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterOrder() {
    let input = 0;

    // order types: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    // order directions: 'asc', 'desc'

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Chapter order',
            [
                ...Object.keys(chapterOrderTypes).map(orderType => [capitalFirstLetterString(orderType)]), 
                '_',
                [FETCH.TOGGLE_ORDER_DIRECTION, 'Toggle direction']
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput(); 

        // handle user choice
        if (input >= 0 && input < Object.keys(chapterOrderTypes).length) { // selected type option
            fetchMangadexOptions.chapterOrderType = Object.keys(chapterOrderTypes)[input];
        } else if (input === FETCH.TOGGLE_ORDER_DIRECTION) { // toggle order direction -- highest selectable index
            fetchMangadexOptions.chapterOrderDirection = fetchMangadexOptions.chapterOrderDirection === 'asc' ? 'desc' : 'asc';
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterOffset() {
    let input = null;

    // TODO:
    // - make possible to add the current fetch size to offset by inputting e.g. 0/1

    while (input !== COMMANDS.EXIT) 
    {
        // offset is counted to request length and the maximum allowed request size is 10000, 
        // therefore maxOffset can be at maximum the difference of 10000 and limit_chapter 
        const maxOffset = 10000 - fetchMangadexOptions.limit_chapter; 

        printMenuOptions(
            'Chapter offset',
            [['?', `Input a value between 0-${maxOffset}`], '_'],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= maxOffset) {
            fetchMangadexOptions.offset_chapter = input;
        } else if (input < 0 || input > maxOffset) {
            console.log(`\n\n  The given value has to be between 0 and ${maxOffset}`);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    } 
}

async function optionChapterLanguages() {
    let input = null;

    /*
        When changing the option for chapterTranslatedLanguage the user has two options:
        
        1. Select from one of the pre-defined language options by inputting 
            the corresponding number next to desired option

            e.g. || 0 -> en
                 || 1 -> pl
        
        2. Input a custom language code option in one of two formats

            'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
    */

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Select chapter languages (or enter custom code)',
            [
                ...chapterTranslatedLanguages.map(lang => [capitalFirstLetterString(lang)]), 
                '_',
                [COMMANDS.CLEAR, 'Clear filters']
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput();

        // handling menu choice
        if (input >= 0 && input < chapterTranslatedLanguages.length) { // pre-defined language options
            fetchMangadexOptions.chapterTranslatedLanguage.push(chapterTranslatedLanguages[input]);
            fetchMangadexOptions.chapterTranslatedLanguage = [...new Set(fetchMangadexOptions.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input === COMMANDS.CLEAR) { // clear current translatedLanguage options 
            fetchMangadexOptions.chapterTranslatedLanguage = []; 
        } else if (isValidLangCode(input)) { // custom input e.g. 'en' or 'pt-br'
            fetchMangadexOptions.chapterTranslatedLanguage.push(input);
            fetchMangadexOptions.chapterTranslatedLanguage = [...new Set(fetchMangadexOptions.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionContentRatings() {
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Choose content ratings',
            [
                ...contentRatings.map(contentRating => [capitalFirstLetterString(contentRating)]), 
                '_',
                [COMMANDS.INCLUDE_ALL, 'Include all'],
                [COMMANDS.EXCLUDE_ALL, 'Exclude all']
            ],
            { displayFn: () => customFetchMangadexDisplay({ lists, options: fetchMangadexOptions })}
        );

        input = await takeUserInput();

        // setting option / clearing options
        if (input >= 0 && input < contentRatings.length) {
            fetchMangadexOptions.contentRating.push(contentRatings[input]); 
            fetchMangadexOptions.contentRating = [...new Set(fetchMangadexOptions.contentRating)]; // get rid of duplicate values
        } else if (input === COMMANDS.INCLUDE_ALL) {
            fetchMangadexOptions.contentRating = [...contentRatings];
        } else if (input === COMMANDS.EXCLUDE_ALL) {
            fetchMangadexOptions.contentRating = [];
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function selectMangasFromFetchResults (mangaSearches, lists, mangadexData) {
    const allSearchResults = mangaSearches.flatMap(({ searchResults }) => searchResults); 
    const MALMangas = lists[MANGA].flat(); 
    let input = null;
    let selectedMangas = [];

    const hasSelectedMangas = () => selectedMangas.length;
    const isDuplicate = (id) => selectedMangas.some(({ manga }) => manga.id === id);
    const appendSelectedManga = (toAppend) => { if (!isDuplicate(toAppend.id)) selectedMangas.push({ manga: toAppend }) }; 

    while (input !== FETCH.SEARCH_MANGAS && input !== COMMANDS.EXIT) 
    {
        let index = 0;

        // --- formatting searchSection ---

        const searchSection = mangaSearches.flatMap(({ searchResults, searchTitle }, msIndex) => {
            // indexing search results and appending '<-- Manga found in mangalist'
            const mappedResults = searchResults.map(({ attributes: { title, links }}) => {
                const mangaFoundAtLists = MALMangas.some(e => e.node.id === Number(links?.mal));
                const mangaFoundAtListsTag = mangaFoundAtLists ? '<-- Manga found in mangalist' : '';
                const value = `${Object.values(title)[0]} ${mangaFoundAtListsTag}`;
                return [ index++, value ];
            });
            const noResults = [['?', 'No results found']];
            const formattedResults = searchResults.length ? mappedResults : noResults;
            return [
                [`[${searchTitle}]`, null, '\n'],
                ...formattedResults,
                (msIndex < mangaSearches.length - 1 ? '_' : null) // empty line between each result
            ];
        });

        const resultCount = index;

        // --- formatting selected titles ---

        const mangaTitles = selectedMangas.map(({ manga: { attributes: {title}}}) => 
            [null, '-', Object.values(title)?.[0]]
        ); 
        const noTitles = [[null, '-', 'No selected titles']];
        const selectedTitlesSection = selectedMangas.length ? mangaTitles : noTitles;

        // --- assemble menu ---

        const optionsArray = [
            '_', '_',
            ...searchSection,
            '_', '_',
            ['Selected titles', null, null],
            '_', 
            ...selectedTitlesSection,
            '_', '_',
            [FETCH.SEARCH_MANGAS,            'Search chapters'],
            [FETCH.INCLUDE_MANGAS_MANGALIST, 'Include mangas found at mangalist'],
            [FETCH.INCLUDE_MANGAS_MDXDATA,   'Include mangas found at mangadexData'],
            [COMMANDS.INCLUDE_ALL,           'Include all titles'],
            [COMMANDS.EXCLUDE_ALL,           'Clear selected titles']
        ];  

        printMenuOptions(
            null,
            optionsArray,
            { printHeader: false } 
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < resultCount) { // adding to search
            appendSelectedManga(allSearchResults[input]);
        } else if (input === FETCH.INCLUDE_MANGAS_MANGALIST) { // include mangas found at mangalist
            const foundMangas = allSearchResults.filter(({attributes: { links }}) => 
                MALMangas.some(e => e.node.id === Number(links?.mal)) 
            ); 
            foundMangas.forEach(match => appendSelectedManga(match));
        } else if (input === FETCH.INCLUDE_MANGAS_MDXDATA) { // include mangas found at mangadexData
            const foundMangas = allSearchResults.filter(result => 
                mangadexData.some(({ manga }) => manga.id === result.id)
            );
            foundMangas.forEach(result => appendSelectedManga(result));
        } else if (input === COMMANDS.INCLUDE_ALL) { // including all titles to fetch
            allSearchResults.forEach(result => appendSelectedManga(result));
        } else if (input === FETCH.SEARCH_MANGAS && !hasSelectedMangas(selectedMangas)) { 
            console.log('\n\n  Select at least one title to perform a search');
            input = null;
        } else if (input === COMMANDS.EXCLUDE_ALL || input === COMMANDS.EXIT) { // clear selected titles
            selectedMangas = [];
        } else if (input !== FETCH.SEARCH_MANGAS) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }

    return selectedMangas;
}

export { menuFetchMangadex, selectMangasFromFetchResults };