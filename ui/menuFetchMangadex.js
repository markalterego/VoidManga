import { rl } from '../main.js';
import { takeUserInput, clearScreen, customFetchMangadexDisplay } from "../helpers/functions.js";
import { animeStatus, chapterOrderTypes, chapterTranslatedLanguages, 
         contentRatings, mangaOrderTypes, mangaStatus, orderDirections, 
         fetchMangadexOptions } from "../helpers/export.js";
import { filterEntriesFromFetch } from './menuFetchFilters.js';
import { fetchMangadex } from '../fetch/fetchMangadex.js';

async function menuFetchMangadex (lists, config) {
    const options = !config?.fetchMangadexOptions ? JSON.parse(JSON.stringify(fetchMangadexOptions)) : config.fetchMangadexOptions;
    let boolDisplay = !config?.boolDisplayMangadex ? false : config.boolDisplayMangadex; 
    let m = 0;

    while (m !== 'e') 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            await customFetchMangadexDisplay(options);
        }

        console.log('\n||\n|| Custom fetch Mangadex\n||');
        console.log('|| 0 -> Fetch with options');
        console.log('|| 1 -> Change options');
        console.log('|| 2 -> Filter MAL titles');
        console.log('|| 3 -> Empty options');
        console.log('|| 4 -> Toggle display');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window   

        switch (m)
        {
            case 0:
                // fetching with given options
                await fetchMangadex(lists, options);
                break;
            case 1:
                // running menu for changing options
                await changeMangadexOptionMenu(boolDisplay, options);
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
            case 4:
                // toggle display of options
                if (!boolDisplay) boolDisplay = true; 
                else boolDisplay = false; 
                break;
            case 'e':
                break;
            default: 
                console.log('\n|| Please input a valid option');
        }
    }

    return [options, boolDisplay];
}

async function changeMangadexOptionMenu (boolDisplay, fetchOptions) {
    const options = fetchOptions;
    let m = 0, i = 0, key = null;

    while (m !== 'e') 
    {
        if (boolDisplay) { // show if boolDisplay toggled
            await customFetchMangadexDisplay(options);
        }

        // lists options that can be changed 
        console.log('\n||\n|| Select an option:\n||');
        for (const key in options) { 
            console.log(`|| ${i} -> ${key}`);
            i++; 
        }
        console.log('|| e -> Go back\n||');
        i = 0; // resetting index

        m = await takeUserInput(); // get user input

        await clearScreen(); // clears console window   
        
        switch (m)
        {
            case 0: // MAL_list
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    console.log('|| 0 -> anime');
                    console.log('|| 1 -> manga');
                    console.log(`|| e -> Go back\n||`);
                    
                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m === 0 || m === 1) {
                        options.MAL_list = m;
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 1: // MAL_status
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    if (options.MAL_list === null) {
                        while (i < animeStatus.length) {
                            // watching/reading & plan_to_watch/plan_to_read
                            if (i === 0 || i === 4) console.log(`|| ${i} -> ${animeStatus[i]}/${mangaStatus[i]}`);
                            else console.log(`|| ${i} -> ${animeStatus[i]}`);
                            i++;    
                        }
                        i = 0; // resetting index
                    } else if (options.MAL_list === 0) {
                        animeStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    } else if (options.MAL_list === 1) {
                        mangaStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    }
                    console.log(`|| e -> Go back\n||`);

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m > -1 && m < 5) {
                        options.MAL_status = m;
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 2: // limit_manga
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
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
            case 3: // limit_chapter
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }
                    
                    console.log(`\n||\n|| Input a value between 0-100 (${key})\n||`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
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
            case 4: // mangaOrderType
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    mangaOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m > -1 && m < mangaOrderTypes.length) {
                        options.mangaOrderType = mangaOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 5: // chapterOrderType
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    chapterOrderTypes.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m > -1 && m < chapterOrderTypes.length) {
                        options.chapterOrderType = chapterOrderTypes[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 6: // mangaOrderDirection
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options.mangaOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 7: // chapterOrderDirection
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Select option for ${key}\n||`);
                    orderDirections.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   
                    
                    // setting the given option
                    if (m > -1 && m < orderDirections.length) {
                        options.chapterOrderDirection = orderDirections[m];
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
                break;
            case 8: // contentRating
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }

                    console.log(`\n||\n|| Add option for ${key}\n||`);
                    contentRatings.forEach((value, index) => {
                        console.log(`|| ${index} -> ${value}`);
                    });
                    console.log(`|| ${contentRatings.length} -> Select all`);
                    console.log(`|| ${contentRatings.length+1} -> Clear ratings`);
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window   

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
            case 9: // chapterTranslatedLanguage
                key = Object.keys(options)[m];
                while (m !== 'e') 
                {
                    if (boolDisplay) {
                        await customFetchMangadexDisplay(options);
                    }
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
                    console.log(`|| ${chapterTranslatedLanguages.length} -> Clear filters`);
                    console.log('|| e -> Go back\n||');

                    const userInput = await rl.question('\n|| Input: '); // get user input
                    // regex tests for manually inputted language codes and allows:
                    // 'en', 'Es', etc. <----OR----> 'eN-us', 'Pt-br', etc. 
                    const testResult = /^[a-z]{2}(-[a-z]{2})?$/i.test(userInput); // validating language code
                    if (!testResult && userInput.toLowerCase() !== 'e') m = parseInt(userInput, 10); // convert userinput to int
                    else m = userInput.toLowerCase(); // converts userInput to lowercase

                    await clearScreen(); // clears console window   

                    // handling menu choice
                    if (m > -1 && m < chapterTranslatedLanguages.length) { 
                        // options.chapterTranslatedLanguage = options.chapterTranslatedLanguage.filter(Boolean); // filters undefined
                        options.chapterTranslatedLanguage.push(chapterTranslatedLanguages[m]);
                        options.chapterTranslatedLanguage = [...new Set(options.chapterTranslatedLanguage)]; // filter duplicates
                    } else if (m === chapterTranslatedLanguages.length) {
                        options.chapterTranslatedLanguage = []; // clear current translatedLanguage options 
                    } else if (testResult) { // custom input e.g. 'en' or 'pt-br'
                        // options.chapterTranslatedLanguage = options.chapterTranslatedLanguage.filter(Boolean); // filters undefined
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

export { menuFetchMangadex };