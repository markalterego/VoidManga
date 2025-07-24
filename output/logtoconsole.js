import { animeStatus, mangaStatus } from "../regular/export.js";

async function log (options, lists) {
    try {
        let optionsArray = [ // optionsArray fully filled with false
            Array(animeStatus.length).fill(false),
            Array(mangaStatus.length).fill(false)
        ];
        if (options !== 'all') optionsArray[parseInt(options.charAt(0), 10)][parseInt(options.charAt(1), 10)] = true; // fill optionsArray with true
        else for (let i = 0; i < optionsArray.length; i++) for (let ii = 0; ii < optionsArray[i].length; ii++) optionsArray[i][ii] = true; // fill a specific point in optionsArray with true
        await logMAL(optionsArray, lists); // log MAL titles based on optionsArray
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

async function logMAL (optionsArray, lists) {    
    for (let i = 0; i < optionsArray.length; i++) { // go through optionsArray[0 and 1]
        for (let ii = 0; ii < optionsArray[i].length; ii++) { // go through optionsArray[0 or 1][0 to 4]
            if (optionsArray[i][ii]) { // if optionsArray[i][ii] is true
                for (let iii = 0; iii < lists[i][ii].length; iii++) { // log MAL lists from the same point where optionsArray is marked true
                    if (!iii) console.log(`\n||\n|| (${lists[i][ii][iii].list_status.status.charAt(0).toUpperCase()+lists[i][ii][iii].list_status.status.slice(1)})\n||`); // log list_status at ii
                    const progress = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].list_status.num_chapters_read : lists[i][ii][iii].list_status.num_episodes_watched; // how many episodes watched / chapters read 
                    const length = lists[i][ii][iii].node.num_episodes===undefined ? lists[i][ii][iii].node.num_chapters : lists[i][ii][iii].node.num_episodes; // how many episodes / chapters does the series have
                    console.log(`|| - ${lists[i][ii][iii].node.title} ( ${progress} / ${length ? length : 'unknown'} )`); // log series
                    if (iii===lists[i][ii].length-1) console.log('||');
                }
            }
        }
    }
}

export { log };