import { takeUserInput, customFetchMangadexDisplay, printMenuOptions, 
         capitalFirstLetterString, isValidLangCode } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, fetchMangadexOptions, SYM, MESSAGE } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchWithOptions } from '../controller/controllerMangadex.js';

let lists = null;
let options = null;
let mangadexData = null;
let mangadexFetchHistory = null;

async function menuFetchMangadex (l, { fetchMangadexOptions }, m, mfh) {
    const FETCH_MANGADEX = 0, CHANGE_OPTIONS = 1;
    let input = null;

    lists = l, 
    options = fetchMangadexOptions, 
    mangadexData = m, 
    mangadexFetchHistory = mfh;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // logs menu
        printMenuOptions(
            'Custom fetch Mangadex',
            [
                ['Fetch with options'], 
                ['Change options'],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === FETCH_MANGADEX) {
            await fetchWithOptions({
                l: lists,
                md: mangadexData,
                mfh: mangadexFetchHistory, 
                o: options
            });
        } else if (input === CHANGE_OPTIONS) {
            await fetchOptionsMenu();
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function fetchOptionsMenu() {
    const SEARCHQUEUE = 0, 
          MANGAFETCH = 1, 
          CHAPTERFETCH = 2, 
          CHANGECONTENTRATING = 3;
    let input = null;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        printMenuOptions(
            'Change fetch options',
            [
                ['Manage search queue'],
                ['Manga options'],
                ['Chapter options'],
                ['Content ratings'],
                '_',
                ['s', `Search mangas using ${options.fetchMangasByMALTitles ? 'manual input' : 'MAL titles'}`],
                ['f', `Fetch all chapters [${options.fetchAllChapters ? 'x' : ''}]`],
                ['r', 'Reset default options']
            ]
        );

        input = await takeUserInput(true);
        
        if (input === SEARCHQUEUE) { // Include/exclude titles
            options.fetchMangasByMALTitles ? await filterEntriesFromFetch(lists, 'includeInMangadexFetch') : await mangaSearchStringsMenu();
        } else if (input === MANGAFETCH) { // manga fetch options
            await mangaOptionsMenu();
        } else if (input === CHAPTERFETCH) { // chapter fetch options
            await chapterOptionsMenu();
        } else if (input === CHANGECONTENTRATING) { // change content ratings (manga && chapter both use the same content rating option)
            await optionContentRatings();
        } else if (input === 's') { // toggle fetching mangas by selected MAL titles
            options.fetchMangasByMALTitles = !options.fetchMangasByMALTitles;
        } else if (input === 'f') { // toggle fetching all chapters per selected manga
            options.fetchAllChapters = !options.fetchAllChapters;
        } else if (input === 'r') { // reset default options
            // when an object is converted to string (JSON.stringify), the object's format changes and therefore reference breaks
            // we can then convert the changed string into an object (JSON.parse), which means we've succesfully cloned an object
            options = JSON.parse(JSON.stringify(fetchMangadexOptions));
            console.log('\n\n  Options reset to default');
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaSearchStringsMenu() {
    let input = null;

    while (input !== 'e') 
    {
        customFetchMangadexDisplay({ lists, options });

        const optionsArray = [
            ['?', 'Add to queue'],
            '_',
            ['c', 'Clear queue']
        ];

        printMenuOptions(
            'Search queue',
            optionsArray
        );

        input = await takeUserInput(false, true, { useMixedCase: true });
        
        if (typeof input === 'string' && input.length && input !== 'e' && input !== 'c') {
            options.mangaSearchStrings = [...new Set(options.mangaSearchStrings).add(input)];
        } else if (input === 'c') {
            options.mangaSearchStrings = [];
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaOptionsMenu() {
    const MANGAFETCHSIZE = 0, MANGAORDER = 1;
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // logs menu
        printMenuOptions(
            'Manga options',
            [
                ['Manga fetch size'],
                ['Manga order'],
                '_'
            ]
        );

        input = await takeUserInput();
        
        if (input === MANGAFETCHSIZE) { // limit_manga
            await optionMangaLimit();
        } else if (input === MANGAORDER) { // mangaOrderType && mangaOrderDirection
            await optionMangaOrder();
        } else if (input !== 'e') { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionMangaLimit() {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });
        
        // logs menu
        printMenuOptions(
            'Manga fetch size',
            [
                ['?', 'Input a value between 0-100'],
                '_'
            ]
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= 100) {
            options.limit_manga = input;
        } else if (input > 100 || input < 0) {
            console.log('\n\n  The given value has to be be between 0-100');
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionMangaOrder() {
    let input = 0;

    // order types: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    // order directions: 'asc', 'desc'    

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // print order types
        printMenuOptions(
            'Manga order',
            [
                ...Object.keys(mangaOrderTypes).map(orderType => [capitalFirstLetterString(orderType)]), 
                '_',
                ['t', 'Toggle direction']
            ]
        );

        input = await takeUserInput(); 

        // handle user choice
        if (input >= 0 && input < Object.keys(mangaOrderTypes).length) { // selected type option
            options.mangaOrderType = Object.keys(mangaOrderTypes)[input];
        } else if (input === 't') { // toggle order direction -- highest selectable index
            if (options.mangaOrderDirection === 'asc') options.mangaOrderDirection = 'desc';
            else options.mangaOrderDirection = 'asc';
        } else if (input !== 'e') { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function chapterOptionsMenu() {
    const CHAPTERFETCHSIZE = options.fetchAllChapters ? null : 0, 
          CHAPTERORDER = options.fetchAllChapters ? null : 1, 
          CHAPTEROFFSET = options.fetchAllChapters ? null : 2, 
          CHAPTERLANGUAGES = options.fetchAllChapters ? 0 : 3;
    let input = 0;

    // some menu options are hidden + made inaccessible on purpose
    // when the user has set options.fetchAllChapters = true, as the 
    // options limit_chapter && chapterOrderType && chapterOrderDirection &&
    // offset_chapter are not used at all when fetching with options.fetchAllChapters
    // set to true

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // format menu options
        const chapterOptionsCustom = [['Chapter fetch size'], ['Chapter order'], ['Chapter offset'], ['Chapter languages'], '_'];
        const chapterOptionsAll = [['Chapter languages'], '_'];
        const optionsArray = options.fetchAllChapters
            ? chapterOptionsAll
            : chapterOptionsCustom;

        // print menu options
        printMenuOptions(
            'Chapter options',
            optionsArray
        );

        input = await takeUserInput();

        if (!options.fetchAllChapters && input === CHAPTERFETCHSIZE) { // limit_chapter
            await optionChapterLimit();
        } else if (!options.fetchAllChapters && input === CHAPTERORDER) { // chapterOrderType && chapterOrderDirection
            await optionChapterOrder();
        } else if (!options.fetchAllChapters && input === CHAPTEROFFSET) { // offset_chapter
            await optionChapterOffset();
        } else if (input === CHAPTERLANGUAGES) { // chapterTranslatedLanguage
            await optionChapterLanguages();
        } else if (input !== 'e') { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterLimit() {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });
        
        // print menu
        printMenuOptions(
            'Chapter fetch size',
            [
                ['?', 'Input a value between 0-100'],
                '_'
            ]
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= 100) {
            options.limit_chapter = input;
        } else if (input > 100 || input < 0) {
            console.log('\n\n  The given value has to be be between 0-100');
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterOrder() {
    let input = 0;

    // order types: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    // order directions: 'asc', 'desc'

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // print order types
        printMenuOptions(
            'Chapter order',
            [
                ...Object.keys(chapterOrderTypes).map(orderType => [capitalFirstLetterString(orderType)]), 
                '_',
                ['t', 'Toggle direction']
            ]
        );

        input = await takeUserInput(); 

        // handle user choice
        if (input >= 0 && input < Object.keys(chapterOrderTypes).length) { // selected type option
            options.chapterOrderType = Object.keys(chapterOrderTypes)[input];
        } else if (input === 't') { // toggle order direction -- highest selectable index
            if (options.chapterOrderDirection === 'asc') options.chapterOrderDirection = 'desc';
            else options.chapterOrderDirection = 'asc';
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionChapterOffset() {
    let input = 0;

    // TODO:
    // - make possible to add the current fetch size to offset by inputting e.g. 0/1

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });
        
        // offset is counted to request length and the maximum allowed request size is 10000, 
        // therefore maxOffset can be at maximum the difference of 10000 and limit_chapter 
        const maxOffset = 10000 - options.limit_chapter; 

        printMenuOptions(
            'Chapter offset',
            [['?', `Input a value between 0-${maxOffset}`], '_']
        );

        input = await takeUserInput();

        // setting the given option
        if (input >= 0 && input <= maxOffset) {
            options.offset_chapter = input;
        } else if (input < 0 || input > maxOffset) {
            console.log(`\n\n  The given value has to be between 0 and ${maxOffset}`);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    } 
}

async function optionChapterLanguages() {
    let input = 0;

    /*
        When changing the option for chapterTranslatedLanguage the user has two options:
        
        1. Select from one of the pre-defined language options by inputting 
            the corresponding number next to desired option

            e.g. || 0 -> en
                 || 1 -> pl
        
        2. Input a custom language code option in one of two formats

            'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
    */

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });
        
        // print selectable languages
        printMenuOptions(
            'Select chapter languages (or enter custom code)',
            [
                ...chapterTranslatedLanguages.map(lang => [capitalFirstLetterString(lang)]), 
                '_',
                ['c', 'Clear filters']
            ]
        );

        input = await takeUserInput();

        // handling menu choice
        if (input >= 0 && input < chapterTranslatedLanguages.length) { // pre-defined language options
            options.chapterTranslatedLanguage.push(chapterTranslatedLanguages[input]);
            options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input === 'c') { // clear current translatedLanguage options 
            options.chapterTranslatedLanguage = []; 
        } else if (isValidLangCode(input)) { // custom input e.g. 'en' or 'pt-br'
            options.chapterTranslatedLanguage.push(input);
            options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function optionContentRatings() {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay({ lists, options });

        // log content ratings
        printMenuOptions(
            'Choose content ratings',
            [
                ...contentRatings.map(contentRating => [capitalFirstLetterString(contentRating)]), 
                '_',
                [SYM.TOGGLE, 'Include/Exclude all']
            ]
        );

        input = await takeUserInput();

        // setting option / clearing options
        if (input >= 0 && input < contentRatings.length) {
            options.contentRating.push(contentRatings[input]); 
            options.contentRating = [...new Set(options.contentRating)]; // get rid of duplicate values
        } else if (input === '+') {
            options.contentRating = [...contentRatings];
        } else if (input === '-') {
            options.contentRating = [];
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function selectMangasFromFetchResults (mangaSearches, lists, mangadexData) {
    const allSearchResults = mangaSearches.flatMap(({ searchResults }) => searchResults); 
    const MALMangas = lists[1].flat(); 

    let input = null, selectedMangas = [];
    const hasSelectedMangas = () => selectedMangas.length;
    const appendSelectedMangas = (toAppend) => {
        const isDuplicate = selectedMangas.some(({ manga }) => manga.id === toAppend.id); // check for duplicates
        if (!isDuplicate) selectedMangas.push({ manga: toAppend }); // push and map toAppend as { manga: toAppend }
    } 

    // TODO: 
    // - make it possible to select all mangas which exist at mangadexData

    while (input !== 's' && input !== 'e') 
    {
        let index = 0;
    
        // 1. printing each mangaSearch as a separate menu
        // 
        //  [Berserk]:
        //  
        //  0 -> Berserk <-- Manga found in mangalist
        //  1 -> Berserk 2

        for (const { searchResults, searchTitle } of mangaSearches) {
            // formatting to {'index': 'title (<-- Manga found in mangalist)'}
            const mangaTitles = searchResults.map(({ attributes: { title, links }}) => {
                const mangaFoundAtLists = lists[1].flat().some(e => e.node.id === Number(links?.mal));
                const mangaFoundAtListsTag = mangaFoundAtLists ? '<-- Manga found in mangalist' : '';
                const value = `${Object.values(title)[0]} ${mangaFoundAtListsTag}`;
                return [ index++, value ];
            }); 

            const optionsArray = searchResults.length
                ? [...mangaTitles]
                : [['?', 'No results found']];

            printMenuOptions(
                `[${searchTitle}]`,
                optionsArray,
                { printExit: false }
            );
        }

        const mangaTitleCount = index;

        // 2. printing selected titles and options
        // 
        //  Selected titles
        //  
        //  - Berserk 
        //  - Frieren
        //    
        //  s -> Search chapters
        //  i -> Include mangas found at mangalist
        //  ± -> Include/Exclude all
        //  e -> Go back 

        // formatting selected titles
        const mangaTitles = selectedMangas.map(({ manga: { attributes: {title}}}) => 
            [null, '-', Object.values(title)?.[0]]
        ); 
        const noTitlesOption = [[null, '-', 'No selected titles']];
        const selectedTitles = selectedMangas.length ? mangaTitles : noTitlesOption;

        const optionsArray = [
            ...selectedTitles,
            '_',
            ['s', 'Search chapters'],
            ['i', 'Include mangas found at mangalist'],
            ['d', 'Include mangas found at mangadexData'],
            [SYM.TOGGLE, 'Include/Exclude all']
        ];  

        printMenuOptions(
            'Selected titles',
            optionsArray
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < mangaTitleCount) { // adding to search
            appendSelectedMangas(allSearchResults[input]);
        } else if (input === 'i') { // include mangas found at mangalist
            const foundMangas = allSearchResults.filter(({attributes: { links }}) => 
                MALMangas.some(e => e.node.id === Number(links?.mal)) 
            ); 
            foundMangas.forEach(match => appendSelectedMangas(match));
        } else if (input === 'd') { // include mangas found at mangadexData
            const foundMangas = allSearchResults.filter(result => 
                mangadexData.some(({ manga }) => manga.id === result.id)
            );
            foundMangas.forEach(result => appendSelectedMangas(result));
        } else if (input === '+') { // including all titles to fetch
            allSearchResults.forEach(result => appendSelectedMangas(result));
        } else if (input === 's' && !hasSelectedMangas(selectedMangas)) { 
            console.log('\n\n  Select at least one title to perform a search');
            input = null;
        } else if (input === '-' || input === 'e') { // clear current selection
            selectedMangas = [];
        } else {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
    return selectedMangas;
}

export { menuFetchMangadex, selectMangasFromFetchResults };

/*
    fetchResults complete layout (2025/09/30):
    [   
        {
            manga: {
                id: string,
                type: string,
                attributes: {
                    title: {
                        ?: string, (language code)
                        etc...                    
                    },
                    altTitles: [
                        ?: string, (language code)
                        etc...
                    ],
                    description: {
                        ?: string, (language code)
                        etc...
                    },
                    isLocked: boolean,
                    links: {
                        ?: string, (e.g. mal)
                        etc...
                    },
                    originalLanguage: string,
                    lastVolume: string,
                    lastChapter: string,
                    publicationDemographic: string, (e.g. shounen)
                    status: string, (e.g. completed)
                    year: num,
                    contentRating: string, (e.g. suggestive)
                    tags: [
                        {
                            id: string
                            type: string
                            attributes: {
                                name: {
                                    ?: string (e.g. action)
                                },
                                description: {
                                    ?: string
                                },
                                group: string,
                                version: num
                            },       
                            relationships: [
                                ?: ?
                            ]
                        },
                        etc...
                    ],
                    state: string, (e.g. published)
                    chapterNumbersResetOnNewVolume: boolean,
                    createdAt: string,
                    updatedAt: string,
                    version: num,
                    availableTranslatedLanguages: [
                        ?: string, (e.g. en)
                        etc...
                    ],
                    latestUploadedChapter: string, (id of latest uploaded chapter)
                }, // attributes end
                relationships: [
                    {
                        id: string,
                        type: string (e.g. author)
                    },
                    etc...
                ]
            }, // manga end
            chapters: [
                {
                    id: string,
                    type: string,
                    attributes: {
                        volume: string,
                        chapter: string,
                        title: string,
                        translatedLanguage: string,
                        externalUrl: ???,
                        isUnavailable: boolean,
                        publishAt: string,
                        readableAt: string,
                        createdAt: string,
                        updatedAt: string,
                        pages: num,
                        version: num
                    },
                    relationships: [
                        {
                            id: string,
                            type: string
                        },
                        etc...
                    ],
                    link: string
                },
                etc...
            ] 
        }, // fetchResult end
        etc...
    ]
*/