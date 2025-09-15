import { rl } from '../main.js';
import { fetchComickOptions, orderDirections, chapterTranslatedLanguages } from '../helpers/export.js';
import { takeUserInput, clearScreen, menuFetchFiltersDisplay, customFetchComickDisplay } from "../helpers/functions.js";
import { fetchComickMangas, fetchComickChapters, logComick } from "../fetch/fetchComick.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';

async function menuFetchComick (lists, config) {
    const options = !config?.fetchComickOptions ? JSON.parse(JSON.stringify(fetchComickOptions)) : config.fetchComickOptions;
    let toggleStringSearch = config?.toggleStringSearchComick ? config.toggleStringSearchComick : false;
    let useFirstResult = config?.useFirstResultComick ? config.useFirstResultComick : false;
    let m = 0, searchStrings = [];
    
    // the user can either search with an inputted searchString OR
    // search with MAL titles that have includeInComickFetch set as true
    // 
    // 1. Mangas are searched by MAL titles/searchString
    // 2. The user is then presented the search result from which he can pick the 
    //    specific manga/s he want's chapter info about 
    // 3. The specified manga/s is then passed into the chapter endpoint which
    //    then returns the requested chapters 

    while (m !== 'e') 
    {
        // display either MAL selection OR searchString
        // to user, based on toggled preference
        if (!toggleStringSearch) { 
            // display current selection
            await menuFetchFiltersDisplay(lists, 'includeInComickFetch');
        } else {
            // log current searchStrings
            console.log(`\n||\n|| Current searches:\n||`);
            searchStrings.forEach((search, search_index) => {
                console.log(`|| - ${search}`);
                if (search_index === searchStrings.length-1) console.log('||'); // last index
            });
            if (searchStrings?.length === 0) console.log('|| - No searches found\n||');
        }
        // displays currently selected options
        await customFetchComickDisplay(options); 

        console.log(`\n||\n|| Custom fetch Comick (Search Type: ${!toggleStringSearch ? 'MAL' : 'String'})\n||`);
        console.log(`|| 0 -> Fetch with options`);
        console.log('|| 1 -> Change options');
        console.log(`|| 2 -> ${!toggleStringSearch ? 'Filter MAL titles' : 'Add/Remove searches'}`);
        console.log(`|| 3 -> Toggle skip manga selection [${useFirstResult ? 'x' : ''}]`);
        console.log('|| 4 -> Toggle search type');
        console.log('|| e -> Exit\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clear console window

        switch (m) 
        {
            case 0:
                {
                    let mangaData = false, selectedMangas = [], chapterData = false; 
                    if (!toggleStringSearch) { // fetch Comick by MAL 
                        mangaData = await fetchComickMangas(lists, toggleStringSearch); // returns arr 
                    } else { // fetch Comick by string
                        mangaData = await fetchComickMangas(searchStrings, toggleStringSearch); // returns arr
                    } 
                    if (!mangaData?.length > 0) { 
                        console.log('\n||\n|| Manga endpoint returned no results\n||');
                    } else {
                        if (!useFirstResult) {
                            // select mangas to use in fetch
                            selectedMangas = await selectMangasFromFetchResults(mangaData);
                        } else {
                            // skip manga selection and use the first result from each search
                            mangaData.forEach((search) => { // searches
                                const firstSearchResult = search[0]; // first search result
                                selectedMangas.push(firstSearchResult); // push first search result to selected
                                selectedMangas = [...new Set(selectedMangas)]; // get rid of duplicates
                            });
                        }
                        if (!selectedMangas?.length > 0) {
                            console.log('\n||\n|| No mangas were selected\n||')
                        } else {
                            chapterData = await fetchComickChapters(selectedMangas); // fetching chapters
                            if (!chapterData?.length > 0) console.log('\n||\n|| Chapter endpoint returned no results\n||');
                            else await logComick(selectedMangas, chapterData); // log fetched data
                        } 
                    }
                    break;
                }
            case 1:
                // change options used in fetching
                await changeFetchOptionMenu(options);
                break;
            case 2:
                if (!toggleStringSearch) { 
                    await filterEntriesFromFetch(lists, 'includeInComickFetch'); // include/exlude MAL titles from fetch
                } else { 
                    searchStrings = await changeSearchStrings(searchStrings); // change searchString for Manga fetch
                }
                break;
            case 3:
                // toggle skip manga selection menu
                if (useFirstResult) useFirstResult = false;
                else useFirstResult = true;
                break;
            case 4:
                // switch for toggling string search
                if (toggleStringSearch) toggleStringSearch = false;
                else toggleStringSearch = true;
                break;
            case 'e': 
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }
    return [useFirstResult, toggleStringSearch];
}

async function autoFetchComickChapters (lists, useFirstResult) {
    try {
        // At first I'll make this so that it only supports searching by 
        // tagged MAL titles, I might make it so that it somehow searches
        // by using the last searches made by string as well...
        const mangaData = await fetchComickMangas(lists, false); // <-- fetch manga
        let selectedMangas = [], chapterData = []; // holds mangas selected for fetch
        if (!useFirstResult) { // go through selectmangas first
            selectedMangas = await selectMangasFromFetchResults(mangaData); // select mangas use in chapter fetch
        } else { // <-- use first result from manga fetch to fetch chapters
            mangaData.forEach((search) => { // searches
                const firstSearchResult = search[0]; // first search result
                selectedMangas.push(firstSearchResult); // push first search result to selected
                selectedMangas = [...new Set(selectedMangas)]; // get rid of duplicates
            });
        }
        if (!selectedMangas?.length > 0) console.log('\n||\n|| No mangas were selected\n||');
        else {
            chapterData = await fetchComickChapters(selectedMangas); // fetching chapters
            if (!chapterData?.length > 0) console.log('\n||\n|| Chapter endpoint returned no results\n||');
            else await logComick(selectedMangas, chapterData); // log fetched data
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function selectMangasFromFetchResults (mangaData) {
    let m = 0, selectedMangas = [], index = 0;
    // mangaData = array of all searches [[search_1], [search_2]]
    // mangaData[0] = manga endpoint results ['1': {obj, obj}, '2': {obj, obj}, etc...]
    // mangaData[0][0] = specific result { id: 1234, hid: '1234', etc...}
    while (m !== 'e') 
    {
        console.log('\n||\n|| Select Manga from search results:\n||');
        mangaData.forEach((search) => {
            Object.values(search).forEach((searchResult, searchResultIndex) => {
                if (searchResultIndex === 0) console.log(`|| ${searchResult?.searchQuery}:\n||`);
                if (searchResult !== search.searchQuery) {
                    const title = searchResult?.title ? searchResult.title : 'No Title';
                    console.log(`|| ${index++} -> ${title}`);
                }
            })
            console.log('||');
        });
        const highest_selectable_index = index-1; // last index pointing to searchResults
        // log current selection
        console.log('\n||\n|| Current Selection:\n||');
        selectedMangas.forEach((manga, manga_index) => {
            console.log(`|| - ${manga.title}`);
            if (manga_index === selectedMangas.length-1) console.log('||');
        });
        if (selectedMangas?.length === 0) console.log('|| - No titles selected\n||');
        console.log(`\n||\n|| c -> Clear selections`);
        console.log(`|| e -> ${selectedMangas.length > 0 ? 'Search chapters' : 'Cancel search' }\n||`);
        
        m = await takeUserInput(); // get user input 
        await clearScreen(); // clear console window

        if (m >= 0 && m <= highest_selectable_index) { 
            // push selected searchResult to selectedMangas[]
            let i = 0;
            mangaData.forEach((search) => { // manga endpoint results
                Object.keys(search).forEach((key) => { // search result
                    if (search[key] !== search.searchQuery) {
                        if (i === m) {
                            selectedMangas.push(search[key]); // append searchResult
                            selectedMangas = [...new Set(selectedMangas)]; // get rid of dublicates
                        }
                        i++;
                    }
                });
            });
        } else if (m === 'c') {
            selectedMangas = []; // clear selectedMangas
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
        index = 0; // resetting index
    }
    // return array containing selected mangas
    return selectedMangas;
}

async function changeSearchStrings (searches) {
    let m = 0;

    while (m !== 'e') 
    {
        // log current searches
        console.log(`\n||\n|| Current searches:\n||`);
        searches.forEach((search, search_index) => {
            console.log(`|| - ${search}`);
            if (search_index === searches.length-1) console.log('||'); // last index
        });
        if (searches?.length === 0) console.log('|| - No searches found\n||');
        
        console.log(`\n||\n|| Input desired search:\n||`);
        console.log(`|| c -> Clear searches`);
        console.log(`|| e -> Exit\n||`);

        let userInput = (await rl.question('\n|| Input: ')).trim(); // get user input and remove leading/trailing whitespaces

        await clearScreen(); // clear console window

        // 3 letters or more = added to search
        // c = clears inputs
        // e = exits menu

        if (userInput.length >= 3) { 
            searches.push(userInput); // push search to array
            searches = [...new Set(searches)]; // get rid of duplicates
        } else if (userInput.toLowerCase() === 'c') { 
            searches = []; // clear searches
        } else if (userInput.toLowerCase() === 'e') { 
            m = userInput.toLowerCase(); // exiting while loop
        } else {
            console.log('\n||\n|| Minimum required search length is 3\n||');
        }
    }
    return searches;
}

async function changeFetchOptionMenu (options) {
    const highest_selectable_index = Object.keys(options).length;
    let m = 0;

    while (m !== 'e') 
    {
        await customFetchComickDisplay(options); // displays current selection

        console.log('\n||\n|| Select an option:\n||');
        Object.keys(options).forEach((key, index) => { // log selectable options
            console.log(`|| ${index} -> ${key}`);
        });   
        console.log('|| e -> Go back\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window

        if (m >= 0 && m < highest_selectable_index) {
            const key = Object.keys(options)[m]; // selected option
            await changeOption(key, options); // changing option
        } else if (m !== 'e') {
            console.log('\n|| Please input a valid option');
        }
    }
}

async function changeOption (key, options) {
    let m = 0;
    if (key === 'limit_manga' || key === 'limit_chapter') {
        while (m !== 'e') 
        {   
            await customFetchComickDisplay(options); // displays current selection

            console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
            console.log(`|| e -> Go back\n||`);

            m = await takeUserInput(); // get user input
            
            await clearScreen(); // clears console window

            // handling user input
            if (m >= 0 && m <= 100) {
                options[key] = m;
            } else if (m > 100 || m < 0) {
                console.log('\n|| The given value has to be be between 0-100');
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
        }
    } else if (key === 'chapterOrderDirection') {
        while (m !== 'e') 
        {
            await customFetchComickDisplay(options); // displays current selection

            // either 'asc' or 'desc'
            console.log(`\n||\n|| Select option for ${key}\n||`);
            orderDirections.forEach((direction, direction_index) => {
                console.log(`|| ${direction_index} -> ${direction}`);
            });
            console.log(`|| e -> Go back\n||`);

            m = await takeUserInput(); // get user input
            
            await clearScreen(); // clears console window

            // handling user input
            if (m >= 0 && m < orderDirections.length) {
                options[key] = orderDirections[m];
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
        }
    } else if (key === 'chapterTranslatedLanguage') {
        while (m !== 'e') 
        {
            await customFetchComickDisplay(options); // displays current selection
            /*
            When changing the option for chapterTranslatedLanguage the user has two options:
            
            1. Select from one of the pre-defined language options by inputting 
                the corresponding number next to desired option

                e.g. || 0 -> en
                     || 1 -> pl
            
            2. Input a custom language code option in the format: 'en', 'Es', etc.  
            */
            console.log(`\n||\n|| Select option for ${key} (optionally input custom code)\n||`);
            chapterTranslatedLanguages.forEach((value, index) => { 
                console.log(`|| ${index} -> ${value}`);
            });
            console.log(`|| c -> Clear filters`);
            console.log('|| e -> Go back\n||');

            const userInput = await rl.question('\n|| Input: '); // get user input
            // regex tests for manually inputted language codes and allows: 'en', 'Es', etc.
            const testResult = /^[a-z]{2}(-[a-z]{2})?$/i.test(userInput); // validating language code
            if (!testResult && !(userInput.toLowerCase() === 'e' || userInput.toLowerCase() === 'c')) m = parseInt(userInput, 10); // convert userinput to int
            else m = userInput.toLowerCase(); // converts userInput to lowercase

            await clearScreen(); // clears console window   

            // handling menu choice
            if (m >= 0 && m < chapterTranslatedLanguages.length) { 
                options[key] = chapterTranslatedLanguages[m]; // add pre-defined language option
            } else if (m === 'c') {
                options[key] = null; // clear current option
            } else if (testResult) { 
                options[key] = m; // assign custom input e.g. 'en'
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
        }
    } else if (key === 'chapterNumber') {
        while (m !== 'e') 
        {
            await customFetchComickDisplay(options); // displays current selection

            console.log(`\n||\n|| Input value for ${key}\n||`);
            console.log('|| c -> Clear option');
            console.log(`|| e -> Go back\n||`);

            m = await takeUserInput(); // get user input

            await clearScreen(); // clears console window   

            // handling user input
            if (typeof m === 'number') {
                options[key] = m; // setting chapterNumber
            } else if (m === 'c') {
                options[key] = null; // re-setting chapterNumber
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
        }
    } else {
        console.log(`\n||\n|| The specified option can't currently be changed\n||`);
    }
}

export { menuFetchComick, autoFetchComickChapters };