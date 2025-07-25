import { animeStatus, mangaStatus } from "../regular/export.js";

async function log (options, lists) {
    try {
        if (await validateParameters(options, lists)) { // check whether to allow logging
            let optionsArray = [ // optionsArray fully filled with false
                Array(animeStatus.length).fill(false),
                Array(mangaStatus.length).fill(false)
            ];
            if (options !== 'all') optionsArray[parseInt(options.charAt(0), 10)][parseInt(options.charAt(1), 10)] = true; // fill a specific point in optionsArray with true
            else for (let i = 0; i < optionsArray.length; i++) for (let ii = 0; ii < optionsArray[i].length; ii++) optionsArray[i][ii] = true; // fill optionsArray with true
            await logMAL(optionsArray, lists); // log MAL titles based on optionsArray
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function validateParameters (options, lists) {
    let option1Flag = false, option2Flag = false, listsFlag = false, result = false;
    
    const o1 = parseInt(options.charAt(0)); // parsing first option from the string
    const o2 = parseInt(options.charAt(1)); // parsing second option from the string

    if (o1 === 0 || o1 === 1) option1Flag = true; // flag is set if either 0 or 1
    if (o2 >= 0 && o2 <= 4) option2Flag = true; // flag is set if between 0 and 4
    if (lists[o1]?.[o2]?.length > 0) listsFlag = true; // flag is set if entries can be found at given options

    if (!option1Flag) console.log(`\n||\n|| The first parameter has to be either 0 or 1\n||`);
    if (!option2Flag) console.log(`\n||\n|| The second parameter has to be between 0 and 4\n||`);
    if (!listsFlag) console.log(`\n||\n|| No matches were found on MAL for the given parameters\n||`)
    
    if (option1Flag && option2Flag && listsFlag) result = true;

    return result;
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