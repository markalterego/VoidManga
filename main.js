import { pollMAL } from "./pollMAL.js";
import { pollMangadex } from "./pollMangadex.js";

async function main() 
{
    console.clear(); // same as cls    
    await pollMangadex(); // searches for newest chapters
    await pollMAL(); // logs MAL lists
}

main();