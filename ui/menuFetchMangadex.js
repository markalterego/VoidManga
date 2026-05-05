import { takeUserInput, customFetchMangadexDisplay, menuFetchFiltersDisplay, 
         printMenuOptions, capitalFirstLetterString, isValidLangCode } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, fetchMangadexOptions, SYM } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadexMangas, fetchMangadexChapters } from '../fetch/fetchMangadex.js';
import { filehandle } from "../filehandling/filehandle.js";
import stringWidth from 'string-width';

async function menuFetchMangadex (lists, config, mangadexData) {
    const options = config.fetchMangadexOptions;
    let input = 0;

    // TODO: 
    // - log to user how much stuff was fetched etc... after a succesful fetch

    while (input !== 'e') 
    {
        // logs currently selected MAL titles to be used in fetch
        menuFetchFiltersDisplay(lists, 'includeInMangadexFetch');

        // logs currently selected options
        customFetchMangadexDisplay(options);

        // logs menu
        printMenuOptions(
            'Custom fetch Mangadex',
            [
                ['Fetch with options'], 
                ['Change options'],
                ['Filter MAL titles'], 
                ['Reset default options'], 
                [`Fetch all chapters [${options.fetchAllChapters ? 'x' : ''}]`],
                '_'
            ]
        );

        input = await takeUserInput(true);

        switch (input)
        {
            case 0: // fetching with given options
                await fetchWithOptions(lists, options, mangadexData);
                break;
            case 1: // running menu for changing options
                await fetchOptionsMenu(options);
                break;
            case 2: // filtering items not wanted to be fetched
                await filterEntriesFromFetch(lists, 'includeInMangadexFetch');
                break;
            case 3: // re-assigning default options from fetchMangadexOptions to options
                Object.keys(options).forEach((key) => {
                    const value = fetchMangadexOptions[key];
                    options[key] = Array.isArray(options[key]) ? [...value] : value;
                });
                console.log('  Options reset to default');
                break;
            case 4: // toggle fetchAllChapters
                options.fetchAllChapters = !options.fetchAllChapters;
                break;
            case 'e':
                break;
            default: 
                console.log('\n  Please input a valid option');
        }
    }
}

async function fetchWithOptions (lists, options, mangadexData) {
    // attempts finding a title included to search at lists
    if (!anySelectedTitles(lists)) { // no titles selected
        console.log('\n  No MAL titles selected for search');
        return;
    } 
    // attempts fetching mangas by selected MAL titles
    const mangaData = await fetchMangadexMangas(lists, options);
    const foundManga = mangaData?.some(mangaSearch => mangaSearch?.searchResults?.length > 0); // mangas found for at least one search
    if (!foundManga) { // no mangas found for search
        console.log('\n  No mangas were found');
        return;
    } 
    // presents an indexed list of found mangas to user, from which
    // the user can select one/multiple mangas to include in chapter search
    const selectedMangas = await selectMangasFromFetchResults(mangaData);
    if (!selectedMangas.length) { // no mangas selected
        console.log('\n  No mangas were selected');
        return;
    } 
    // attempts to fetch chapters for each manga included in chapter search
    const combinedData = await fetchMangadexChapters(selectedMangas, options); // returns an array of { manga: {}, chapters: [] }
    const hasChapters = combinedData?.some(search => search?.chapters?.length > 0); 
    if (!hasChapters) { // no chapters found
        console.log('\n  No chapters were found');
        return;
    } 

    // appending combinedData into mangadexData
    const fetchInfoArr = combinedData.map(({ manga: fetchedManga, chapters: fetchedChapters }) => { 
        const title = Object.values(fetchedManga.attributes.title)[0];
        const existingData = mangadexData.find(obj => obj.manga.id === fetchedManga.id);

        // short circuit
        if (!existingData) {
            mangadexData.push({ manga: fetchedManga, chapters: fetchedChapters });
            return { id: fetchedManga.id, title, status: 'NEW', updatedCount: fetchedChapters.length };
        }

        // spread fetched manga data to existing data
        existingData.manga = { ...existingData.manga, ...fetchedManga }; 
        
        // filter new chapters
        const newChapters = fetchedChapters.filter(chapter => 
            !existingData.chapters.some(existing => existing.id = chapter.id)
        );

        // append new chapters to existing chapters
        newChapters.forEach(chapter => existingData.chapters.push(chapter));

        // fetch info
        return {
            id: fetchedManga.id,
            title,
            status: newChapters.length ? 'UPDATED' : 'UP_TO_DATE',
            updatedCount: newChapters.length
        };
    });

    // log fetch info
    const pad = (str, targetWidth) => {
        const spaces = targetWidth - stringWidth(str);
        return str + ' '.repeat(Math.max(0, spaces));
    }

    // padding = widest title
    const titlePadding = fetchInfoArr.reduce((longest, { title }) => { 
        const width = stringWidth(title);
        return width > longest ? width : longest;
    }, 0);
    
    console.log('\n  [Info]');
    for (const { title, status, updatedCount } of fetchInfoArr) {
        const paddedTitle = pad(title, titlePadding);
        if (status === 'UP_TO_DATE') {
            console.log(`    ${SYM[status]} ${paddedTitle} - up to date`);
        } else if (status === 'UPDATED') {
            console.log(`    ${SYM[status]} ${paddedTitle} - ${updatedCount} new chapters`);
        } else if (status === 'NEW') {
            console.log(`    ${SYM[status]} ${paddedTitle} - ${updatedCount} new chapters`);
        }
    }

    // save last fetch info to file
    filehandle('mangadex_latest', fetchInfoArr);
    // save fetched data to file
    filehandle('mangadex', mangadexData);
}

function anySelectedTitles (lists) {
    // determines if any MAL title at lists has the
    // value of includeInMangadexFetch set to true
    if (Array.isArray(lists)) {
        for (const type of lists) {
            for (const status of type) {
                for (const entry of status) {
                    if (entry.includeInMangadexFetch) return true;
                }
            }
        }
    }
    return false;
}

async function fetchOptionsMenu (options) {
    const MANGAFETCH = 0, CHAPTERFETCH = 1, CHANGECONTENTRATING = 2;
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);

        // lists options that can be changed 
        printMenuOptions(
            'Change fetch options',
            [
                ['Manga options'],
                ['Chapter options'],
                ['Content ratings'],
                '_'
            ]
        );

        input = await takeUserInput(true);
        
        if (input === MANGAFETCH) { // manga fetch options
            await mangaOptionsMenu(options);
        } else if (input === CHAPTERFETCH) { // chapter fetch options
            await chapterOptionsMenu(options);
        } else if (input === CHANGECONTENTRATING) { // change content ratings (manga && chapter both use the same content rating option)
            await optionContentRatings(options);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option'); // invalid input
        }
    }
}

async function mangaOptionsMenu (options) {
    const MANGAFETCHSIZE = 0, MANGAORDER = 1;
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);

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
            await optionMangaLimit(options);
        } else if (input === MANGAORDER) { // mangaOrderType && mangaOrderDirection
            await optionMangaOrder(options);
        } else if (input !== 'e') { // invalid input
            console.log('\n  Please input a valid option')
        }
    }
}

async function optionMangaLimit (options) {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);
        
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
            console.log('  The given value has to be be between 0-100');
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function optionMangaOrder (options) {
    let input = 0;

    // order types: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    // order directions: 'asc', 'desc'    

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);

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
        } else if (input !== 'e') { // invalid input
            console.log('\n  Please input a valid option'); // invalid input
        }
    }
}

async function chapterOptionsMenu (options) {
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
        customFetchMangadexDisplay(options);

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
            await optionChapterLimit(options);
        } else if (!options.fetchAllChapters && input === CHAPTERORDER) { // chapterOrderType && chapterOrderDirection
            await optionChapterOrder(options);
        } else if (!options.fetchAllChapters && input === CHAPTEROFFSET) { // offset_chapter
            await optionChapterOffset(options);
        } else if (input === CHAPTERLANGUAGES) { // chapterTranslatedLanguage
            await optionChapterLanguages(options);
        } else if (input !== 'e') { // invalid input
            console.log('\n  Please input a valid option')
        }
    }
}

async function optionChapterLimit (options) {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);
        
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
            console.log('  The given value has to be be between 0-100');
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function optionChapterOrder (options) {
    let input = 0;

    // order types: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    // order directions: 'asc', 'desc'

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);

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
        } else if (input !== 'e') { // invalid input
            console.log('\n  Please input a valid option'); // invalid input
        }
    }
}

async function optionChapterOffset (options) {
    let input = 0;

    // TODO:
    // - make possible to add the current fetch size to offset by inputting e.g. 0/1

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);
        
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
            console.log(`\n|| The given value has to be between 0 and ${maxOffset}`);
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    } 
}

async function optionChapterLanguages (options) {
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
        customFetchMangadexDisplay(options);
        
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
            console.log('\n  Please input a valid option');
        }
    }
}

async function optionContentRatings (options) {
    let input = 0;

    while (input !== 'e') 
    {
        // logs currently selected options
        customFetchMangadexDisplay(options);

        // log content ratings
        printMenuOptions(
            'Choose content ratings',
            [
                ...contentRatings.map(contentRating => [capitalFirstLetterString(contentRating)]), 
                ['Select all'], 
                '_',
                ['c', 'Clear ratings']
            ]
        );

        input = await takeUserInput();

        // setting option / clearing options
        if (input > -1 && input < contentRatings.length) {
            options.contentRating.push(contentRatings[input]); 
            options.contentRating = [...new Set(options.contentRating)]; // get rid of duplicate values
        } else if (input === contentRatings.length) {
            options.contentRating = [...contentRatings];
        } else if (input === 'c') {
            options.contentRating = [];
        } else if (input !== 'e') {
            console.log('\n  Please input a valid option');
        }
    }
}

async function selectMangasFromFetchResults (mangaSearches) {
    let input = null, selectedMangas = [];
    const hasSelectedMangas = () => selectedMangas.length;
    const appendSelectedMangas = (toAppend) => {
        const isDuplicate = selectedMangas.some(({ manga }) => manga.id === toAppend.id); // check for duplicates
        if (!isDuplicate) selectedMangas.push({ manga: toAppend }); // push and map toAppend as { manga: toAppend }
    } 

    while (input !== 's' && input !== 'e') 
    {
        let index = 0;
    
        // 1. printing each mangaSearch as a separate menu
        // 
        // || 
        // || Berserk:
        // || 
        // || 0 -> Berserk <-- Perfect match
        // || 1 -> Berserk 2
        // || 
        // 

        for (const { searchResults, query: { title: MAL_title, id: MAL_id, type: MAL_type } } of mangaSearches) {
            // formatting to {'index': 'title (<-- Perfect match)'}
            const mangaTitles = searchResults.map(({ attributes: { title, links }}) => {
                const mal = links?.mal;
                const isPerfectMatch = MAL_type === 'manga' 
                    ? Number(mal) === Number(MAL_id) // e.g. mal = '85173' from 'https://myanimelist.net/manga/85173'
                    : false;
                const perfectMatchTag = isPerfectMatch ? '<-- Perfect match' : '';
                const value = `${Object.values(title)[0]} ${perfectMatchTag}`;
                return [ index++, value ];
            }); 

            const optionsArray = searchResults.length
                ? [...mangaTitles]
                : [['?', 'No results found']];

            printMenuOptions(
                `${MAL_title}:`,
                optionsArray,
                { printExit: false }
            );
        }

        const mangaTitleCount = index;

        // 2. printing selected titles and options
        // 
        // || 
        // || Selected titles
        // || 
        // || - Berserk 
        // || - Frieren
        // || 
        // 
        // ||
        // || s -> Search chapters
        // || p -> Select perfect matches
        // || ± -> Include/Exclude all
        // || e -> Go back
        // ||

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
            ['p', 'Select perfect matches'],
            ['±', 'Include/Exclude all']
        ];  

        printMenuOptions(
            'Selected titles',
            optionsArray
        );

        input = await takeUserInput();
        
        if (input >= 0 && input < mangaTitleCount) { // adding to search
            const allResults = mangaSearches.flatMap(({ searchResults }) => searchResults);
            const selectedManga = allResults[input];
            appendSelectedMangas(selectedManga);
        } else if (input === 's' && !hasSelectedMangas(selectedMangas)) { 
            console.log('\n  Select at least one title to perform a search');
            input = null;
        } else if (input === 'p') { // select all perfect matches
            const mangaOnlySearches = mangaSearches.filter(({ query: { type: MAL_type }}) => MAL_type === 'manga');
            const perfectMatches = mangaOnlySearches.flatMap(({ searchResults, query: { id: MAL_id }}) => 
                searchResults.filter(({ attributes }) => Number(attributes.links?.mal) === MAL_id)
            );
            perfectMatches.forEach(perfectMatch => appendSelectedMangas(perfectMatch));
        } else if (input === '+') {
            // including all Manga titles to fetch
            const allResults = mangaSearches.flatMap(({ searchResults }) => searchResults);
            allResults.forEach(result => appendSelectedMangas(result));
        } else if (input === '-' || input === 'e') { // clear current selection
            selectedMangas = [];
        }
    }
    return selectedMangas;
}

export { menuFetchMangadex };

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