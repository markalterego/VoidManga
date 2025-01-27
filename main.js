import { pollMAL } from "./fetch/pollMAL.js";
import { pollMangadex } from "./fetch/pollMangadex.js";
import { filehandle } from "./filehandling/filehandle.js";
import { log } from "./output/logtoconsole.js";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

async function main() 
{
    console.clear(); // same as cls    
    await pollMangadex(); // searches for newest chapters
    //const lists = await pollMAL(); // searches and returns MAL lists

    //await menu(lists);

    //filehandle(lists);
}

async function menu(lists) {

    const rl = readline.createInterface({ input, output });
    let m = 0;

    console.clear();
    
    while (m !== 6) 
    {
        console.log('\n||\n|| What would you like to do?\n||');
        console.log('|| 0 -> Watching anime');
        console.log('|| 1 -> Completed anime');
        console.log('|| 2 -> Reading manga');
        console.log('|| 3 -> Completed manga');
        console.log('|| 4 -> All of the above');
        console.log('|| 5 -> Clear screen');
        console.log('|| 6 -> Exit\n||');

        const userInput = await rl.question('\n|| Input: '); // get user input
        m = parseInt(userInput, 10); // convert userinput to int
        
        console.clear();

        switch (m) 
        {
            case 0:
                await log('anime_watching', lists);
                break;
            case 1:
                await log('anime_completed', lists);
                break;
            case 2:
                await log('manga_reading', lists);
                break;
            case 3:
                await log('manga_completed', lists);
                break;
            case 4:
                await log('all', lists);
                break;
            case 5:
                console.clear();
                break;
            case 6:
                break;
            default:
                console.log('\n|| Please input a valid option');
        }
    }

    rl.close();
}

main();

/*

    - pollMangadex should poll into a const, the same as pollMAL
    
    - filehandle should get both polling results as input and save that info into 'mal.file' and e.g. 'mangadex.file' respectively


*/

/*

if read chapters is lower than newest chapter, 
then input new keyword to the output 

||
|| Sousou no Frieren - Frieren: Beyond Journey's End {( New! )}
||
|| Chapter: 140 - "The Ball"
|| Published: 25.12.2024 01:16 EET
||
|| Link: https://mangadex.org/chapter/d08901e2-9d12-4d0f-9b97-4820ed94da9f
||

*/