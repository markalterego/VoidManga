import { takeUserInput, customFetchMangadexDisplay, menuFetchFiltersDisplay } from "../helpers/functions.js";
import { chapterOrderTypes, chapterTranslatedLanguages, contentRatings, 
         mangaOrderTypes, orderDirections, fetchMangadexOptions } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadexMangas, fetchMangadexChapters, logMangadex } from '../fetch/fetchMangadex.js';

async function menuFetchMangadex (lists, config) {
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
        console.log('|| 3 -> Empty options');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        switch (m)
        {
            case 0:
                // fetching with given options
                const mangaData = await fetchMangadexMangas(lists, options);
                const selectedMangas = await selectMangasFromFetchResults(mangaData);
                if (selectedMangas.length === 0) {
                    console.log('\n||\n|| No mangas were selected\n||');
                } else {
                    const combinedData = await fetchMangadexChapters(selectedMangas, options);
                    if (combinedData.length === 0) {
                        console.log('\n||\n|| No chapters were found\n||');
                    } else {
                        await logMangadex(combinedData); // logging fetched data
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
    let m = 0, i = 0, key = null;

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

        switch (m)
        {
            case 0: // limit_manga
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < 101) {
                        options.limit_manga = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 1: // limit_chapter
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting the given option
                    if (m > -1 && m < 101) {
                        options.limit_chapter = m;
                    } else if (m > 100 || m < 0) {
                        console.log('\n|| The given value has to be be between 0-100');
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }    
                m = null; // ensuring upper menu doesn't exit
                break;
            case 2: // mangaOrderType
                key = Object.keys(options)[m];
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
                        options.mangaOrderType = mangaOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 3: // chapterOrderType
                key = Object.keys(options)[m];
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
                        options.chapterOrderType = chapterOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 4: // mangaOrderDirection
                key = Object.keys(options)[m];
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
                        options.mangaOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 5: // chapterOrderDirection
                key = Object.keys(options)[m];
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
                        options.chapterOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 6: // contentRating
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    // logs currently selected options
                    await customFetchMangadexDisplay(options);

                    console.log(`\n||\n|| Add option for ${key}\n||`);
                    contentRatings.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| ${contentRatings.length} -> Select all`);
                    console.log(`|| ${contentRatings.length+1} -> Clear ratings`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    // setting option / clearing options
                    if (m > -1 && m < contentRatings.length) {
                        options.contentRating.push(contentRatings[m]); 
                        options.contentRating = [...new Set(options.contentRating)]; // get rid of duplicate values
                    } else if (m === contentRatings.length) {
                        options.contentRating = [...contentRatings];
                    } else if (m === contentRatings.length+1) {
                        options.contentRating = [];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 7: // chapterTranslatedLanguage
                key = Object.keys(options)[m];
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
                        options.chapterTranslatedLanguage.push(chapterTranslatedLanguages[m]);
                        options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
                    } else if (m === 'c') { // clear current translatedLanguage options 
                        options.chapterTranslatedLanguage = []; 
                    } else if (testResult) { // custom input e.g. 'en' or 'pt-br'
                        options.chapterTranslatedLanguage.push(m);
                        options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
}

async function selectMangasFromFetchResults (mangaSearches) {
    let m = 0, index = 0, highestSelectableIndex = 0, selectedMangas = [];

    while (m !== 's' && m !== 'e') 
    {
        // log search results
        mangaSearches.forEach((mangaSearch, mangaSearchIndex) => {
            if (mangaSearchIndex === 0) { // header
                console.log('\n||\n|| Add titles to chapter search:\n||');
            }
            console.log(`|| ${mangaSearch.search}:\n||`); // MAL title
            const searchResults = mangaSearch.searchResults; // results for title
            if (!searchResults.length) {
                console.log(`|| - No results for search`);
            } else {
                searchResults.forEach((searchResult) => {
                    const attributes = searchResult.attributes;
                    const title = attributes.title.en;
                    console.log(`|| ${index++}: ${title}`);
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
                const search = mangaSearch.search;
                const searchResults = mangaSearch.searchResults;
                searchResults.forEach((searchResult) => { // results for search
                    if (index === m) { // index matches user given choice
                        const isDuplicate = selectedMangas.find((selected) => selected.manga.id === searchResult.id);
                        if (!isDuplicate) {
                            selectedMangas.push({manga: searchResult, search: search}); // pushing selected to selected
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

export { menuFetchMangadex };