import { takeUserInput, customFetchMangadexDisplay, menuFetchFiltersDisplay } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, fetchMangadexOptions } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadexMangas, fetchMangadexChapters } from '../fetch/fetchMangadex.js';

async function menuFetchMangadex (lists, config, mangadexData) {
    const options = !config?.fetchMangadexOptions ? JSON.parse(JSON.stringify(fetchMangadexOptions)) : config.fetchMangadexOptions;
    let m = 0;

    while (m !== 'e') 
    {
        // logs currently selected MAL titles to be used in fetch
        await menuFetchFiltersDisplay(lists, 'includeInMangadexFetch');

        // logs currently selected options
        await customFetchMangadexDisplay(options);

        console.log('\n||\n|| Custom fetch Mangadex\n||');
        console.log('|| 0 -> Fetch with options');
        console.log('|| 1 -> Change options');
        console.log('|| 2 -> Filter MAL titles');
        console.log('|| 3 -> Reset default options');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        switch (m)
        {
            case 0:
                // fetching with given options
                const mangaData = await fetchMangadexMangas(lists, options);
                const foundManga = mangaData?.some(mangaSearch => mangaSearch.searchResults?.length > 0); // mangas found for at least one search
                if (!foundManga) {
                    console.log('\n||\n|| No mangas were found\n||');
                } else {
                    const selectedMangas = await selectMangasFromFetchResults(mangaData);
                    if (selectedMangas.length === 0) { // no mangas selected
                        console.log('\n||\n|| No mangas were selected\n||');
                    } else {
                        const combinedData = await fetchMangadexChapters(selectedMangas, options);
                        const hasChapters = combinedData.some(search => search.chapters.length > 0); 
                        if (!hasChapters) { // no chapters found
                            console.log('\n||\n|| No chapters were found\n||');
                        } else {
                            // append combinedData into mangadexData
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
                            console.log('\n||\n|| Mangedex fetch was successful\n||');
                        }
                    }
                }
                break;
            case 1:
                // running menu for changing options
                await changeMangadexOptionMenu(options);
                break;
            case 2:
                // filtering items not wanted to be fetched
                await filterEntriesFromFetch(lists, 'includeInMangadexFetch');
                break;
            case 3:
                // re-assigning default options from fetchMangadexOptions to options
                Object.keys(options).forEach((key) => {
                    const value = fetchMangadexOptions[key];
                    options[key] = Array.isArray(options[key]) ? [...value] : value;
                });
                console.log('\n||\n|| Options reset to default\n||');
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
    return {options: options};
}

async function changeMangadexOptionMenu (fetchOptions) {
    const options = fetchOptions;
    let m = 0, i = 0;

    // TODO:
    // - Separate each option changing into more user-friendly parts
    //   e.g. 'change manga order options' or 'change length of returned results etc...

    while (m !== 'e') 
    {
        // logs currently selected options
        await customFetchMangadexDisplay(options);

        // lists options that can be changed 
        console.log('\n||\n|| Select an option:\n||');
        for (const key in options) { 
            console.log(`|| ${i} -> ${key}`);
            i++; 
        }
        console.log('|| e -> Go back\n||');
        i = 0; // resetting index

        m = await takeUserInput(); // get user input
        const key = Object.keys(options)[m]; // selected key of options

        switch (key)
        {
            case 'limit_manga':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < 101) {
                        options[key] = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'limit_chapter': 
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < 101) {
                        options[key] = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }    
                break;
            case 'offset_chapter':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    
                    // offset is counted to request length and the maximum allowed request size is 10000, 
                    // therefore maxOffset can be at maximum the difference of 10000 and limit_chapter 
                    const maxOffset = 10000 - options.limit_chapter; 

                    console.log(`\n||\n|| Input a value between 0-${maxOffset} (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m >= 0 && m <= maxOffset) {
                        options[key] = m;
                    } else if (m < 0 || m > maxOffset) {
                        console.log(`\n|| The given value has to be between 0 and ${maxOffset}`);
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }    
                break;
            case 'mangaOrderType':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    // mangaOrderTypes keys: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
                    const orderTypes = Object.keys(mangaOrderTypes);

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderTypes.forEach((orderType, index) => {
                        console.log(`|| ${index} -> ${orderType}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < orderTypes.length) {
                        options[key] = orderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'chapterOrderType':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    // chapterOrderTypes keys: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
                    const orderTypes = Object.keys(chapterOrderTypes);

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderTypes.forEach((orderType, index) => {
                        console.log(`|| ${index} -> ${orderType}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m >= 0 && m < orderTypes.length) {
                        options[key] = orderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'mangaOrderDirection':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    // mangaOrderTypes: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
                    // Each orderType is an object that holds keys asc, desc. These are objects that hold orderType specific explanation
                    // of what the order direction does when ordering this specific orderType by ascending
                    const orderDirections = mangaOrderTypes[options.mangaOrderType]; 

                    console.log(`\n||\n|| Order manga by ${options.mangaOrderType}\n||`);
                    Object.values(orderDirections).forEach((explanation, index) => { 
                        console.log(`|| ${index} -> ${explanation.charAt(0).toUpperCase() + explanation.slice(1)}`); // format first letter of explanation to upper case
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m >= 0 && m < Object.keys(orderDirections).length) {
                        options[key] = Object.keys(orderDirections)[m]; // asc/desc
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'chapterOrderDirection':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    // chapterOrderTypes: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
                    // Each orderType is an object that holds keys asc, desc. These are objects that hold orderType specific explanation
                    // of what the order direction does when ordering this specific orderType by ascending
                    const orderDirections = chapterOrderTypes[options.chapterOrderType]; 

                    console.log(`\n||\n|| Order chapters by ${options.chapterOrderType}\n||`);
                    Object.values(orderDirections).forEach((explanation, index) => {
                        console.log(`|| ${index} -> ${explanation.charAt(0).toUpperCase() + explanation.slice(1)}`); // format first letter of explanation to upper case
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m >= 0 && m < Object.keys(orderDirections).length) {
                        options[key] = Object.keys(orderDirections)[m]; // asc/desc
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'contentRating':
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    console.log(`\n||\n|| Choose content ratings\n||`);
                    contentRatings.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| ${contentRatings.length} -> Select all`);
                    console.log(`|| c -> Clear ratings`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting option / clearing options
                    if (m > -1 && m < contentRatings.length) {
                        options[key].push(contentRatings[m]); 
                        options[key] = [...new Set(options[key])]; // get rid of duplicate values
                    } else if (m === contentRatings.length) {
                        options[key] = [...contentRatings];
                    } else if (m === 'c') {
                        options[key] = [];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
            case 'chapterTranslatedLanguage': 
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    /*
                    When changing the option for chapterTranslatedLanguage the user has two options:
                    
                    1. Select from one of the pre-defined language options by inputting 
                       the corresponding number next to desired option

                        e.g. || 0 -> en
                             || 1 -> pl
                    
                    2. Input a custom language code option in one of two formats

                        'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
                    */
                    console.log(`\n||\n|| Select chapter languages (or enter custom code)\n||`);
                    chapterTranslatedLanguages.forEach((value, index) => { 
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| c -> Clear filters`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input
                    // regex tests for manually inputted language codes and allows:
                    // 'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
                    const testResult = /^[a-z]{2}(-[a-z]{2})?$/i.test(m); // validating language code

                    // handling menu choice
                    if (m >= 0 && m < chapterTranslatedLanguages.length) { // pre-defined language options
                        options[key].push(chapterTranslatedLanguages[m]);
                        options[key] = [...new Set(options[key])]; // filter duplicates
                    } else if (m === 'c') { // clear current translatedLanguage options 
                        options[key] = []; 
                    } else if (testResult) { // custom input e.g. 'en' or 'pt-br'
                        options[key].push(m);
                        options[key] = [...new Set(options[key])]; // filter duplicates
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                break;
        }
        if (key) m = null; // ensuring upper menu doesn't exit
        else if (m !== 'e') console.log('\n|| Please input a valid option'); // invalid input
    }
}

async function selectMangasFromFetchResults (mangaSearches) {
    let m = 0, index = 0, highestSelectableIndex = 0, selectedMangas = [];

    // TODO:
    // - make it possible to autosearch Mangadex by matching only perfect matches

    while (m !== 's' && m !== 'e') 
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
                console.log(`|| - ${attributes.title.en}`); 
            });
            console.log('||');
        }
        // log e -> exit, s -> search etc...
        console.log('\n||\n|| s -> Search chapters');
        console.log('|| p -> Select perfect matches');
        console.log('|| c -> Clear selection');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input
        
        // handle user choice
        if (m >= 0 && m <= highestSelectableIndex) { // adding to search
            mangaSearches.forEach((mangaSearch) => { // manga search
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => { // results for search
                    if (index === m) { // index matches user given choice
                        const isDuplicate = selectedMangas.find(selected => selected.manga.id === searchResult.id);
                        if (!isDuplicate) selectedMangas.push({manga: searchResult}); // pushing selected to selected
                    }
                    index++;
                }); 
            });
            index = 0;
        } else if (m === 's') { 
            if (selectedMangas.length === 0) {
                console.log('\n||\n|| Select at least one title to perform a search\n||');
                m = 0;
            }
        } else if (m === 'p') { // select all perfect matches
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
        } else if (m === 'c' || m === 'e') { // clear current selection
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