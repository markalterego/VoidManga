import { takeUserInput, customFetchMangadexDisplay, menuFetchFiltersDisplay, printMenuOptions, capitalFirstLetterString } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, fetchMangadexOptions } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadexMangas, fetchMangadexChapters } from '../fetch/fetchMangadex.js';
import { filehandle } from "../filehandling/filehandle.js";

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
            ['Fetch with options', 'Change options', 'Filter MAL titles', 'Reset default options', `Fetch all chapters [${options.fetchAllChapters ? 'x' : ''}]`, '_']
        );

        input = await takeUserInput(true); // get user input

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
                console.log('\n||\n|| Options reset to default\n||');
                break;
            case 4: // toggle fetchAllChapters
                options.fetchAllChapters = !options.fetchAllChapters;
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
}

async function fetchWithOptions (lists, options, mangadexData) {
    // attempts finding a title included to search at lists
    if (!anySelectedTitles(lists)) { // no titles selected
        console.log('\n||\n|| No MAL titles selected for search\n||');
        return;
    } 
    // attempts fetching mangas by selected MAL titles
    const mangaData = await fetchMangadexMangas(lists, options);
    const foundManga = mangaData?.some(mangaSearch => mangaSearch?.searchResults?.length > 0); // mangas found for at least one search
    if (!foundManga) { // no mangas found for search
        console.log('\n||\n|| No mangas were found\n||');
        return;
    } 
    // presents an indexed list of found mangas to user, from which
    // the user can select one/multiple mangas to include in chapter search
    const selectedMangas = await selectMangasFromFetchResults(mangaData);
    if (!selectedMangas.length) { // no mangas selected
        console.log('\n||\n|| No mangas were selected\n||');
        return;
    } 
    // attempts to fetch chapters for each manga included in chapter search
    const combinedData = await fetchMangadexChapters(selectedMangas, options); // returns an array of { manga: {}, chapters: [] }
    const hasChapters = combinedData?.some(search => search?.chapters?.length > 0); 
    if (!hasChapters) { // no chapters found
        console.log('\n||\n|| No chapters were found\n||');
        return;
    } 
    // appends combinedData into mangadexData
    combinedData.forEach((search) => { // search per title
        const foundKey = Object.keys(mangadexData).find(key => mangadexData[key].manga.id === search.manga.id);
        if (foundKey) { // manga found in existing data
            let reference = mangadexData[foundKey].chapters;
            // filter reference to contain only unique chapter ids
            const fetchedChapters = search.chapters;
            fetchedChapters.forEach((chapter) => {
                const isDuplicate = reference.some(existingChapter => existingChapter.id === chapter.id);
                if (!isDuplicate) {
                    reference.push(chapter); // append unique chapters to mangadexData
                }
            });
        } else {
            // appending new info to existing info
            mangadexData.push({ manga: search.manga, chapters: search.chapters});
        } 
    });
    // save fetched data to file
    filehandle('mangadex', mangadexData);
    // log successful fetch
    console.log('\n||\n|| Mangedex fetch was successful\n||');
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
            ['Manga options', 'Chapter options', 'Content ratings', '_']
        );

        input = await takeUserInput(true); // get user input
        
        if (input === MANGAFETCH) { // manga fetch options
            await mangaOptionsMenu(options);
        } else if (input === CHAPTERFETCH) { // chapter fetch options
            await chapterOptionsMenu(options);
        } else if (input === CHANGECONTENTRATING) { // change content ratings (manga && chapter both use the same content rating option)
            await optionContentRatings(options);
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option'); // invalid input
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
            ['Manga fetch size', 'Manga order', '_']
        );

        input = await takeUserInput(); // get user input
        
        if (input === MANGAFETCHSIZE) { // limit_manga
            await optionMangaLimit(options);
        } else if (input === MANGAORDER) { // mangaOrderType && mangaOrderDirection
            await optionMangaOrder(options);
        } else if (input !== 'e') { // invalid input
            console.log('\n|| Please input a valid option')
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
            null,
            [{'?': 'Input a value between 0-100'}, '_']
        );

        input = await takeUserInput(); // get user input

        // setting the given option
        if (input >= 0 && input <= 100) {
            options.limit_manga = input;
        } else if (input > 100 || input < 0) {
            console.log('\n|| The given value has to be be between 0-100');
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option');
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
            [...Object.keys(mangaOrderTypes).map(orderType => capitalFirstLetterString(orderType)), '_'],
            [{'t': 'Toggle direction'}]
        );

        input = await takeUserInput(); // get user input 

        // handle user choice
        if (input >= 0 && input < Object.keys(mangaOrderTypes).length) { // selected type option
            options.mangaOrderType = Object.keys(mangaOrderTypes)[input];
        } else if (input === 't') { // toggle order direction -- highest selectable index
            if (options.mangaOrderDirection === 'asc') options.mangaOrderDirection = 'desc';
            else options.mangaOrderDirection = 'asc';
        } else if (input !== 'e') { // invalid input
            console.log('\n|| Please input a valid option'); // invalid input
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

        // print menu options
        printMenuOptions(
            'Chapter options',
            (!options.fetchAllChapters ? ['Chapter fetch size', 'Chapter order', 'Chapter offset', 'Chapter languages', '_'] : 
                                         ['Chapter languages', '_'])
        );

        input = await takeUserInput(); // get user input

        if (!options.fetchAllChapters && input === CHAPTERFETCHSIZE) { // limit_chapter
            await optionChapterLimit(options);
        } else if (!options.fetchAllChapters && input === CHAPTERORDER) { // chapterOrderType && chapterOrderDirection
            await optionChapterOrder(options);
        } else if (!options.fetchAllChapters && input === CHAPTEROFFSET) { // offset_chapter
            await optionChapterOffset(options);
        } else if (input === CHAPTERLANGUAGES) { // chapterTranslatedLanguage
            await optionChapterLanguages(options);
        } else if (input !== 'e') { // invalid input
            console.log('\n|| Please input a valid option')
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
            null,
            [{'?': 'Input a value between 0-100'}, '_']
        );

        input = await takeUserInput(); // get user input

        // setting the given option
        if (input >= 0 && input <= 100) {
            options.limit_chapter = input;
        } else if (input > 100 || input < 0) {
            console.log('\n|| The given value has to be be between 0-100');
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option');
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
            [...Object.keys(chapterOrderTypes).map(orderType => capitalFirstLetterString(orderType)), '_'],
            [{'t': 'Toggle direction'}]
        );

        input = await takeUserInput(); // get user input 

        // handle user choice
        if (input >= 0 && input < Object.keys(chapterOrderTypes).length) { // selected type option
            options.chapterOrderType = Object.keys(chapterOrderTypes)[input];
        } else if (input === 't') { // toggle order direction -- highest selectable index
            if (options.chapterOrderDirection === 'asc') options.chapterOrderDirection = 'desc';
            else options.chapterOrderDirection = 'asc';
        } else if (input !== 'e') { // invalid input
            console.log('\n|| Please input a valid option'); // invalid input
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
            null,
            [{'?': `Input a value between 0-${maxOffset}`}, '_']
        );

        input = await takeUserInput(); // get user input

        // setting the given option
        if (input >= 0 && input <= maxOffset) {
            options.offset_chapter = input;
        } else if (input < 0 || input > maxOffset) {
            console.log(`\n|| The given value has to be between 0 and ${maxOffset}`);
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option');
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
            [...chapterTranslatedLanguages.map(lang => capitalFirstLetterString(lang)), '_'],
            [{'c': 'Clear filters'}]
        );

        input = await takeUserInput(); // get user input

        // regex tests for manually inputted language codes and allows:
        // 'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
        const testResult = /^[a-z]{2}(-[a-z]{2})?$/i.test(input); // validating language code

        // handling menu choice
        if (input >= 0 && input < chapterTranslatedLanguages.length) { // pre-defined language options
            options.chapterTranslatedLanguage.push(chapterTranslatedLanguages[input]);
            options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input === 'c') { // clear current translatedLanguage options 
            options.chapterTranslatedLanguage = []; 
        } else if (testResult) { // custom input e.g. 'en' or 'pt-br'
            options.chapterTranslatedLanguage.push(input);
            options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option');
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
            [...contentRatings.map(contentRating => capitalFirstLetterString(contentRating)), 'Select all', '_'],
            [{'c': 'Clear ratings'}]
        );

        input = await takeUserInput(); // get user input

        // setting option / clearing options
        if (input > -1 && input < contentRatings.length) {
            options.contentRating.push(contentRatings[input]); 
            options.contentRating = [...new Set(options.contentRating)]; // get rid of duplicate values
        } else if (input === contentRatings.length) {
            options.contentRating = [...contentRatings];
        } else if (input === 'c') {
            options.contentRating = [];
        } else if (input !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function selectMangasFromFetchResults (mangaSearches) {
    let input = 0, index = 0, highestSelectableIndex = 0, selectedMangas = [];

    while (input !== 's' && input !== 'e') 
    {
        // log search results
        mangaSearches.forEach((mangaSearch, mangaSearchIndex) => {
            if (mangaSearchIndex === 0) { // header
                console.log('\n||\n|| Add titles to chapter search:\n||');
            }
            console.log(`|| ${mangaSearch.query.title}:\n||`); // MAL title
            const searchResults = mangaSearch.searchResults; // results for title
            if (!searchResults.length) {
                console.log(`|| - No results for search`);
            } else {
                searchResults.forEach((searchResult) => {
                    const attributes = searchResult.attributes;
                    const title = Object.values(attributes.title)[0]; // title
                    const malId = mangaSearch.query.id; // MAL id
                    const searchId = parseInt(searchResult.attributes.links?.mal, 10); // Mangadex manga data sometimes has e.g. '85173' from 'https://myanimelist.net/manga/85173'
                    const sameIdTag = mangaSearch.query.type === 'manga' ? (malId === searchId ? '<-- Perfect Match!!!' : '') : ''; // exact same id and type
                    console.log(`|| ${index++}: ${title} ${sameIdTag}`);
                });
            }
            console.log('||');
        });
        // set highest selectable + reset index
        highestSelectableIndex = index - 1; index = 0; 
        // log selected
        console.log('\n||\n|| Currently selected titles:\n||');
        if (selectedMangas.length === 0) {
            console.log('|| - No titles selected\n||');
        } else {
            // logging selected titles
            selectedMangas.forEach((selectedManga) => { 
                const attributes = selectedManga.manga.attributes;
                const firstTitle = Object.values(attributes.title)[0]; // first title
                console.log(`|| - ${firstTitle}`); 
            });
            console.log('||');
        }
        // log e -> exit, s -> search etc...
        console.log('\n||\n|| s -> Search chapters');
        console.log('|| p -> Select perfect matches');
        console.log('|| ± -> Include/Exclude all');
        console.log('|| e -> Go back\n||');

        input = await takeUserInput(); // get user input
        
        // handle user choice
        if (input >= 0 && input <= highestSelectableIndex) { // adding to search
            mangaSearches.forEach((mangaSearch) => { // manga search
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => { // results for search
                    if (index === input) { // index matches user given choice
                        const isDuplicate = selectedMangas.find(selected => selected.manga.id === searchResult.id);
                        if (!isDuplicate) selectedMangas.push({manga: searchResult}); // pushing selected to selected
                    }
                    index++;
                }); 
            });
            index = 0;
        } else if (input === 's') { 
            if (selectedMangas.length === 0) {
                console.log('\n||\n|| Select at least one title to perform a search\n||');
                input = 0;
            }
        } else if (input === 'p') { // select all perfect matches
            mangaSearches.forEach((mangaSearch) => {
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => {
                    const type = mangaSearch.query.type; // 'anime' or 'manga'
                    const malId = mangaSearch.query.id; // MAL id
                    const searchId = parseInt(searchResult.attributes.links?.mal, 10); // Mangadex manga data sometimes has e.g. '85173' from 'https://myanimelist.net/manga/85173'
                    if (type === 'manga' && malId === searchId) { // perfect match found
                        const isDuplicate = selectedMangas.find(selected => selected.manga.id === searchResult.id);
                        if (!isDuplicate) selectedMangas.push({manga: searchResult}); // pushing selected to selected
                    }
                });
            }); 
        } else if (input === '+') {
            // including all Manga titles to fetch
            mangaSearches.forEach((mangaSearch) => {
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => {
                    const isDuplicate = selectedMangas.find(selected => selected.manga.id === searchResult.id);
                    if (!isDuplicate) selectedMangas.push({manga: searchResult}); // pushing selected to selected
                });
            });
        } else if (input === '-' || input === 'e') { // clear current selection
            selectedMangas = [];
        } else {
            console.log('\n|| Please input a valid option');
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