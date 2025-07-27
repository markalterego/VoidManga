import { animeStatus, mangaStatus } from "../regular/export.js";

/*
    Options:
    
    Gotten as string: 'options'
    Options in the form of: 'anime/manga||statuses'
    
    'x' <-- basic form of option
    'x,y,...' <-- option for logging specific titles
    'x-y' <-- option for logging titles between specified values
    '/' <-- separates different options in part 1 and 2 of string
    '|' <-- separates first part from second part

    example of a valid options string:
    '0|0' <-- logs all titles from lists[0][0] (anime|watching)
    '0-1|0-4' <-- logs every title from MAL lists (anime,manga|watching-plan_to_watch, reading-plan_to_read)
    '1|0,1' <-- logs lists[1][0-1] (manga|reading,completed)
    '0|0-2/4' <-- logs lists[0][0,1,2,4] (anime|watching,completed,on_hold,plan_to_watch)
*/

async function log (options, lists) {
    try {
        if (await validateParameters(options, lists)) { // check whether to allow logging
            let optionsArray = [ // optionsArray fully filled with false
                Array(animeStatus.length).fill(false),
                Array(mangaStatus.length).fill(false)
            ];            
            // if (options !== 'all') optionsArray[parseInt(options.charAt(0), 10)][parseInt(options.charAt(1), 10)] = true; // fill a specific point in optionsArray with true
            // else for (let i = 0; i < optionsArray.length; i++) for (let ii = 0; ii < optionsArray[i].length; ii++) optionsArray[i][ii] = true; // fill optionsArray with true
            await logMAL(optionsArray, lists); // log MAL titles based on optionsArray
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function validateParameters (options, lists) {
    let option1CompletedFlag = false, option2CompletedFlag = false; // highlights missing parameters
    let option1Flag = true, option2Flag = true, listsFlag = true; // highlights problems with parameters
    let result = false; // defines whether validation was a success or a failure
    let i = 0, char = options.charAt(i);

    // 0 <-- length 1
    // 0-1 <-- length 3
    // 0,1 <-- length maximum 3
    // number has to be followed by special character -> ',' or '-' or '/' or '|'
    // but also special character has to be followed by a number

    while (char !== '|' && i < 20) { // first option (anime/manga)
        char = options.charAt(i);
        if (!(i % 2)) { // checking for number
            if (!(parseInt(char, 10) < 2)) option1Flag = false; // if not number between 0 and 1
        } else { // checking for special character
            if (char !== ',' && char !== '-' && char !== '/' && char !== '|') option1Flag = false; // if not any of the expected special characters
        }
        i++; option1CompletedFlag = true;
    }

    while (i < options.length) { // second option (status)
        char = options.charAt(i); 
        if (!(i % 2)) { // checking for number
            if (!(parseInt(char, 10) < 5)) option2Flag = false; // if not number between 0 and 4
        } else { // checking for special character
            if (char !== ',' && char !== '-' && char !== '/' && char !== '|') option2Flag = false; // if not any of the expected special characters
        }
        i++; option2CompletedFlag = true;
    }

    if (lists) listsFlag = true; // flag is set if lists is defined

    if (!option1CompletedFlag && !option2CompletedFlag) { // logging errors by relevance
        console.log(`\n||\n|| Neither parameter was found\n||`)
    } else if (!option1CompletedFlag) {
        console.log(`\n||\n|| The first parameter was not found\n||`)
    } else if (!option2CompletedFlag) {
        console.log(`\n||\n|| The second parameter was not found\n||`)
    } else {
        if (!option1Flag) console.log(`\n||\n|| The first parameter has to be either 0 or 1\n||`);
        if (!option2Flag) console.log(`\n||\n|| The second parameter has to be between 0 and 4\n||`);
    }
    if (!listsFlag) console.log(`\n||\n|| Lists is not defined\n||`);
    
    // if every flag is set to true -> validation was successful -> result is also set to true
    if (option1Flag && option1CompletedFlag && option2Flag && option2CompletedFlag && listsFlag) result = true; 

    return result;
}

async function parseOptionsFromString() {
    // This function's purpose is to convert options into truthful statements
    // that are then inputted into optionsArray and can be then processed 
    // effortlessly by logMAL after conversion is completed.

    // I should also consider informing the user inside the function if 
    // the options given reap no results e.g. user hasn't set anything 
    // in their list as dropped.
}

async function logMAL (optionsArray, lists) {    
    for (let i = 0, animemangaheaderflag = false; i < optionsArray.length; i++, animemangaheaderflag = false) { // go through optionsArray[0 and 1]
        for (let ii = 0; ii < optionsArray[i].length; ii++) { // go through optionsArray[0 or 1][0 to 4]
            if (!i && !ii) console.log();
            if (optionsArray[i][ii]) { // if optionsArray[i][ii] is true
                for (let iii = 0; iii < lists[i][ii].length; iii++) { // log MAL lists from the same point where optionsArray is marked true
                    if (!animemangaheaderflag) console.log(`||\n|| == ${!i ? 'Anime' : 'Manga'} ==`); animemangaheaderflag = true; // logs Anime or Manga header at first encounter of one or the other
                    if (!iii) console.log(`||\n|| (${lists[i][ii][iii].list_status.status.charAt(0).toUpperCase()+lists[i][ii][iii].list_status.status.slice(1)})\n||`); // log list_status at ii
                    const progress = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].list_status.num_chapters_read : lists[i][ii][iii].list_status.num_episodes_watched; // how many episodes watched / chapters read 
                    const length = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].node.num_chapters : lists[i][ii][iii].node.num_episodes; // how many episodes / chapters does the series have
                    console.log(`|| - ${lists[i][ii][iii].node.title} ${!ii ? (('(' + progress + ' / ') + (length ? length : 'unknown') + ')') : ''}`); // log series
                }
            } 
            if (i === optionsArray.length - 1 && ii === optionsArray[i].length - 1) console.log('||');
        }
    }
}

export { log };