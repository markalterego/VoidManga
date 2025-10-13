import { menuLogMALDisplay, takeUserInput } from '../helpers/functions.js';
import { customLogMAL } from "./customLogMAL.js";
import { animeStatus, mangaStatus } from '../helpers/export.js';

async function menuLogMAL (lists, config) {
    let anime = !config?.logMALOptions?.anime ? [] : config.logMALOptions.anime;
    let manga = !config?.logMALOptions?.manga ? [] : config.logMALOptions.manga;
    let m = 0, boolRemove = false, boolManga = false;

    while (m !== 'e') 
    {
        // logs currently selected options
        menuLogMALDisplay(anime, manga);

        console.log('\n||\n|| Custom log MAL\n||');
        console.log('|| 0 -> Log with options');
        console.log('|| 1 -> Change options');
        console.log('|| 2 -> Empty options');
        console.log('|| e -> Return to menu\n||');

        m = await takeUserInput(); // get user input

        switch (m) 
        {
            case 0:
                await customLogMAL({anime, manga}, lists);
                break;
            case 1:
                while (m !== 'e') 
                {
                    // logs currently selected options
                    menuLogMALDisplay(anime, manga);

                    console.log(`\n||\n|| Change options (${!boolManga ? 'anime' : 'manga'})\n||`);
                    if (!boolManga) { 
                        animeStatus.forEach((item, index) => {
                            console.log(`|| ${index} -> ${!boolRemove ? 'Add' : 'Remove'} ${item}`); // options 0-4
                        }); 
                    } else {
                        mangaStatus.forEach((item, index) => {
                            console.log(`|| ${index} -> ${!boolRemove ? 'Add' : 'Remove'} ${item}`); // options 0-4
                        }); 
                    }
                    console.log('|| 5 -> Toggle add/remove');
                    console.log('|| 6 -> Toggle anime/manga');
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    if (m < 5 && m > -1) { // add/remove entry
                        if (!boolRemove) {
                            if (!boolManga) anime.push(m); else manga.push(m); // add new entry
                            if (!boolManga) anime = [...new Set(anime)]; else manga = [...new Set(manga)]; // removing duplicates
                            if (!boolManga) anime.sort((a, b) => a - b); else manga.sort((a, b) => a - b); // sort in ascending order
                        } else {
                            if (!boolManga) anime = anime.filter(value => value !== m);  // remove entries corresponding to m
                            else manga = manga.filter(value => value !== m);
                        }
                    } else if (m === 5) { // toggle add/remove
                        if (!boolRemove) boolRemove = true; 
                        else boolRemove = false; 
                    } else if (m === 6) { // toggle anime/manga
                        if (!boolManga) boolManga = true; 
                        else boolManga = false; 
                    } else if (m !== 'e') { 
                        console.log('\n|| Please input a valid option');  
                    }
                }   
                m = null; // ensuring upper menu doesn't exit
                break;
            case 2:
                // re-initializing anime/manga as empty
                anime = [], manga = []; 
                console.log('\n||\n|| Cleared all selected anime/manga options\n||');
                break;
            case 'e':
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }
    return [{anime, manga}];
}

export { menuLogMAL };