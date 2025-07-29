import { animeStatus, mangaStatus } from "../regular/export.js";

const MAL = { // determines what is logged
    anime: [],
    manga: []
}

async function log (options, lists) {
    try {
        if (await validateOptions(options)) { // making sure options is formatted correctly
            if (await parseOptions(options, lists)) { // parsing options and saving them to MAL
                await logMAL(lists); // logging given options
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
        if (MAL[key].length > 0) console.log(`\n||\n|| ${!i ? '== Anime ==' : '== Manga =='}`);
        for (const status of MAL[key]) { // status
            console.log(`||\n|| (${!i ? animeStatus[status] : mangaStatus[status]})\n||`);
            for (const entry of lists[i][status]) { // entry
                const title = entry.node.title;
                const progress = `( ${!i ? entry.list_status.num_episodes_watched : entry.list_status.num_chapters_read} / `;
                const length = `${!i ? (entry.node.num_episodes ? entry.node.num_episodes : 'unknown') : (entry.node.num_chapters ? entry.node.num_chapters : 'unknown')} )`; 
                console.log(`|| - ${title} ${status ? '' : progress + length}`);
            }
        }   
        if (MAL[key].length > 0) console.log('||');
    });
}

export { log };