import { animeStatus, mangaStatus } from "../regular/export.js";

const MAL = { // determines what is logged
    anime: [],
    manga: []
}

async function log (options, lists) {
    try {
        if (await validateOptions(options)) { // making sure options is formatted correctly
            if (await parseOptions(options, lists)) { // parsing options and saving them to MAL
                await logMAL(lists);
            }
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function validateOptions (options) {
    let result = true; // determines whether validation was succesful or not
    for (const key in options) { // anime/manga
        if (!(Array.isArray(options[key]))) result = false; // given string not an array
        for (let i = 0; i < options[key].length; i++) { // status
            const status = options[key][i];
            if (!(status < 5 && status > -1)) result = false; // status must be between 0 and 4
        }
    }
    if (!result) console.log(`\n||\n|| The given options weren\'t formatted correctly\n||`);
    return result;
}

async function parseOptions (options, lists) {
    let result = false;
    // emptying arr    
    for (const key in MAL) { // anime/manga
        MAL[key].length = 0;
    }
    // filling arr with options
    for (const key in options) { // anime/manga
        for (let i = 0; i < options[key].length; i++) { // status
            MAL[key].push(options[key][i]);
        }
    } 
    // checking if lists has given options
    Object.keys(MAL).forEach((key, i) => { // anime/manga
        for (const status of MAL[key]) { // status
            if (lists[i][status].length > 0) result = true;
        }   
    });
    if (!result) console.log('\n||\n|| None of the given options were found on MAL\n||');
    return result;
}

async function logMAL (lists) {
    Object.keys(MAL).forEach((key, i) => { // anime/manga
        console.log(`\n||\n|| ${!i ? '== Anime ==' : '== Manga =='}`);
        for (const status of MAL[key]) { // status
            console.log(`||\n|| (${!i ? animeStatus[status] : mangaStatus[status]})\n||`);
            for (const entry of lists[i][status]) { // entry
                const title = entry.node.title;
                const progress = `( ${!i ? entry.list_status.num_episodes_watched : entry.list_status.num_chapters_read } / `;
                const length = `${!i ? entry.node.num_episodes : entry.node.num_chapters } )`; 
                console.log(`|| - ${title} ${status ? '' : progress + length}`);
            }
            console.log('||');
        }   
    });

    // for (const key in MAL) { // anime/manga
    //     for (let i = 0; i < MAL[key].length; i++) { // status

    //     }
    // }


    // for (let i = 0, animemangaheaderflag = false; i < optionsArray.length; i++, animemangaheaderflag = false) { // go through optionsArray[0 and 1]
    //     for (let ii = 0; ii < optionsArray[i].length; ii++) { // go through optionsArray[0 or 1][0 to 4]
    //         if (!i && !ii) console.log();
    //         if (optionsArray[i][ii]) { // if optionsArray[i][ii] is true
    //             for (let iii = 0; iii < lists[i][ii].length; iii++) { // log MAL lists from the same point where optionsArray is marked true
    //                 if (!animemangaheaderflag) console.log(`||\n|| == ${!i ? 'Anime' : 'Manga'} ==`); animemangaheaderflag = true; // logs Anime or Manga header at first encounter of one or the other
    //                 if (!iii) console.log(`||\n|| (${lists[i][ii][iii].list_status.status.charAt(0).toUpperCase()+lists[i][ii][iii].list_status.status.slice(1)})\n||`); // log list_status at ii
    //                 const progress = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].list_status.num_chapters_read : lists[i][ii][iii].list_status.num_episodes_watched; // how many episodes watched / chapters read 
    //                 const length = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].node.num_chapters : lists[i][ii][iii].node.num_episodes; // how many episodes / chapters does the series have
    //                 console.log(`|| - ${lists[i][ii][iii].node.title} ${!ii ? (('(' + progress + ' / ') + (length ? length : 'unknown') + ')') : ''}`); // log series
    //             }
    //         } 
    //         if (i === optionsArray.length - 1 && ii === optionsArray[i].length - 1) console.log('||');
    //     }
    // }
}

export { log };

/*
    (for manual text input[currently deprecated])

    Options: 
    
    Gotten as string: 'options'
    Options in the form of: 'anime/manga|statuses'
    
    'x' <-- basic form of option
    'x,y,...' <-- option for logging specific titles
    'x-y' <-- option for logging titles between specified values
    '|' <-- separates first part from second part

    example of a valid options string:
    '0|0' <-- logs all titles from lists[0][0] (anime|watching)
    '0-1|0-4' <-- logs every title from MAL lists (anime,manga|watching-plan_to_watch, reading-plan_to_read)
    '1|0,1' <-- logs lists[1][0-1] (manga|reading,completed)
    '0|0-2,4' <-- logs lists[0][0,1,2,4] (anime|watching,completed,on_hold,plan_to_watch)
*/

/*
async function validateOptionsString (options, lists) {
    let option1CompletedFlag = false, option2CompletedFlag = false; // highlights missing parameters
    let option1Flag = true, option2Flag = true, listsFlag = true; // highlights problems with parameters
    let result = false; // defines whether validation was a success or a failure
    let i = 0, char = options.charAt(i);

    // number has to always be followed by a special character -> ',' or '-' or '|'
    // but also special character has to always be followed by a number e.g. '0|0'
    // the given options has to always start with a number and end on a number

    while (char !== '|' && i < 20) { // first option (anime/manga)
        char = options.charAt(i);
        if (!(i % 2)) { // checking for number
            if (!(parseInt(char, 10) < 2)) option1Flag = false; // if not number between 0 and 1
        } else { // checking for special character
            if (char !== ',' && char !== '-' && char !== '|') option1Flag = false; // if not any of the expected special characters
        }
        i++; option1CompletedFlag = true;
    }

    while (i < options.length) { // second option (status)
        char = options.charAt(i); 
        if (!(i % 2)) { // checking for number
            if (!(parseInt(char, 10) < 5)) option2Flag = false; // if not number between 0 and 4
        } else { // checking for special character
            if (char !== ',' && char !== '-' && char !== '|') option2Flag = false; // if not any of the expected special characters
        }
        i++; option2CompletedFlag = true;
    }

    if (options.length % 2 !== 1) option2Flag = false; // check for tracing special characters e.g. options = '0|0,'
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
*/