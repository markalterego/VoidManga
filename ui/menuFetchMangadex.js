import open from 'open';
import { takeUserInput, customFetchMangadexDisplay, menuFetchFiltersDisplay } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, orderDirections, fetchMangadexOptions } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadexMangas, fetchMangadexChapters } from '../fetch/fetchMangadex.js';

async function menuFetchMangadex (lists, config) {
    const options = !config?.fetchMangadexOptions ? JSON.parse(JSON.stringify(fetchMangadexOptions)) : config.fetchMangadexOptions;
    let m = 0;

    // TODO:
    // - make it possible to fetch chapters from range by manipulating the 
    //   offset parameter when fetching chapters---make sure the user only 
    //   has to provide a lower and upper limit and everything else is handled
    //   automatically 

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
        console.log('|| 3 -> Empty options');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        switch (m)
        {
            case 0:
                // fetching with given options
                const mangaData = await fetchMangadexMangas(lists, options);
                const foundManga = mangaData.some(mangaSearch => mangaSearch.searchResults?.length > 0); // mangas found for at least one search
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
                            await openChaptersInBrowserMenu(combinedData); // logging fetched data
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
                // emptying / nullifying all options
                for (const key in options) {
                    if (!Array.isArray(options[key])) options[key] = null;
                    else options[key] = [];
                }
                console.log('\n||\n|| Cleared all selected options\n||');
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
    return [options];
}

async function changeMangadexOptionMenu (fetchOptions) {
    const options = fetchOptions;
    let m = 0, i = 0;

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

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    mangaOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < mangaOrderTypes.length) {
                        options[key] = mangaOrderTypes[m];
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

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    chapterOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < chapterOrderTypes.length) {
                        options[key] = chapterOrderTypes[m];
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

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options[key] = orderDirections[m];
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

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options[key] = orderDirections[m];
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

                    console.log(`\n||\n|| Add option for ${key}\n||`);
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
                    console.log(`\n||\n|| Add option for ${key} (optionally input custom code)\n||`);
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
    // - make it possible to select perfect options with the press of a button
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
                    const linkId = parseInt(searchResult.attributes.links?.mal, 10); // Mangadex manga data sometimes has e.g. '85173' from 'https://myanimelist.net/manga/85173'
                    const sameIdTag = mangaSearch.query.type === 'manga' ? (malId === linkId ? '<-- Perfect Match!!!' : '') : ''; // exact same id and type
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
        console.log('|| c -> Clear selection');
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input
        
        // handle user choice
        if (m >= 0 && m <= highestSelectableIndex) { // adding to search
            mangaSearches.forEach((mangaSearch) => { // manga search
                const search = mangaSearch.query;
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => { // results for search
                    if (index === m) { // index matches user given choice
                        const isDuplicate = selectedMangas.find((selected) => selected.manga.id === searchResult.id);
                        if (!isDuplicate) {
                            selectedMangas.push({manga: searchResult, query: search}); // pushing selected to selected
                        }
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
        } else if (m === 'c' || m === 'e') { // clear current selection
            selectedMangas = [];
        } else {
            console.log('\n|| Please input a valid option');
        }
    }
    return selectedMangas;
}

async function openChaptersInBrowserMenu (fetchResults) {
    let m = null;
    // console.dir(fetchResults, {depth: null});

    // TODO:
    // - consider formatting stuff earlier in code e.g. separate formatting function
    //   for taking first mangatitle's etc.etc.....
    // - consider moving this function to menuFetchMangadex.js instead

    while (m !== 'e') {   
        console.log('\n||\n|| Open chapter in browser:');
        let searchIndex = 0, selectableIndex = 0; // used for formatting
        for (const search of fetchResults) {
            const manga = search.manga;
            const mangaTitle = Object.values(manga.attributes.title)[0]; // first title of titles
            const query = search.query;
            console.log(`||\n|| ${mangaTitle}:\n||`);
            for (const chapter of search.chapters) {
                const title = chapter.attributes.title ? chapter.attributes.title : 'No Title'; // title
                const chNum = chapter.attributes.chapter !== null ? chapter.attributes.chapter : -1; // chapter number
                const transLang = chapter.attributes.translatedLanguage ? chapter.attributes.translatedLanguage : 'No Translated Language'; // translated language
                const unreadTag = query.type === 'manga' && // is manga
                                  query.id === parseInt(manga.attributes.links?.mal, 10) && // is same id 
                                  query.progress < chNum ? // progress < chNum
                                  '- {( Unread! )}' : ''; 
                console.log(`|| ${selectableIndex++} -> ${chNum >= 0 ? `Chapter: ${chNum} -` : ''} ${title} (${transLang}) ${unreadTag}`);
            }
            if (search.chapters.length === 0) {
                console.log('|| - No chapters found');
            }
            if (searchIndex === fetchResults.length - 1) console.log('||');
            searchIndex++; 
        }
        console.log('\n||\n|| e -> Go back\n||');
        
        m = await takeUserInput(); // get user input

        // handle user input
        if (m >= 0 && m <= selectableIndex - 1) {
            let i = 0; 
            for (const search of fetchResults) { // searches
                for (const chapter of search.chapters) { // chapters
                    if (i === m) { // highest selectable index
                        await open(chapter.link) // open chapter in browser
                    }
                    i++;
                }
            }
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }    
        selectableIndex = 0;
    }

}

export { menuFetchMangadex };


/*
    fetchResults complete layout (2025/09/23):
    [   
        {
            query: {
                title: string,
                id: num,
                type: string, (anime/manga)
                progress: num
            },
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