import { rl } from '../main.js';
import { takeUserInput, clearScreen } from "../helpers/functions.js";
import { fetchComickMangas, fetchComickChapters, logComick } from "../fetch/fetchComick.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';

async function menuFetchComick (lists, config) {
    let m = 0, count = 0, searchStrings = [], selectionFound = false;
    let toggleStringSearch = config?.toggleStringSearchComick ? config.toggleStringSearchComick : false;
    let useFirstResult = config?.useFirstResultComick ? config.useFirstResultComick : false;

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
            // log current selection
            console.log('\n||\n|| Current selection:\n||');
            lists.forEach((type) => { // anime/manga
                type.forEach((status) => { // status
                    status.forEach((item) => { // item
                        if (item.includeInComickFetch) { 
                            console.log(`|| ${++count}: ${item.node.title}`);
                            selectionFound = true;
                        }
                    });
                });
            });
            count = 0; // resetting count
            // if no titles were selected show it clearly to user
            if (!selectionFound) {
                console.log('|| - No titles selected\n||');
            } else {
                console.log('||');
                selectionFound = false;
            }
        } else {
            // log current searchStrings
            console.log(`\n||\n|| Current searches:\n||`);
            searchStrings.forEach((search, search_index) => {
                console.log(`|| - ${search}`);
                if (search_index === searchStrings.length-1) console.log('||'); // last index
            });
            if (searchStrings?.length === 0) console.log('|| - No searches found\n||');
        }
        console.log(`\n||\n|| Custom fetch Comick (Search Type: ${!toggleStringSearch ? 'MAL' : 'Strings'})\n||`);
        console.log(`|| 0 -> Fetch with options`);
        console.log(`|| 1 -> ${!toggleStringSearch ? 'Filter MAL titles' : 'Add/Remove searches'}`);
        console.log(`|| 2 -> Toggle skip manga selection [${useFirstResult ? 'x' : ''}]`);
        console.log('|| 3 -> Toggle search type');
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
                if (!toggleStringSearch) { 
                    await filterEntriesFromFetch(lists, 'includeInComickFetch'); // include/exlude MAL titles from fetch
                } else { 
                    searchStrings = await changeSearchStrings(searchStrings); // change searchString for Manga fetch
                }
                break;
            case 2:
                // toggle skip manga selection menu
                if (useFirstResult) useFirstResult = false;
                else useFirstResult = true;
                break;
            case 3:
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

export { menuFetchComick, autoFetchComickChapters };