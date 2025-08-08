import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";
import { animeStatus, mangaStatus } from "../regular/export.js";

dotenv.config();

let animemangalist = [
    Array(animeStatus.length).fill(null).map(() => []), // animelist
    Array(animeStatus.length).fill(null).map(() => [])  // mangalist
]; 

async function fetchMAL() {
    const startTime = performance.now();

    console.log(`\n||\n|| Now fetching MAL lists for \'${process.env.MAL_USERNAME}\'\n||`);
    
    await fetchSeries(); // fetching user's MAL lists
    const fetchMALTimeTaken = Math.round(performance.now()-startTime); // how long did fetching the anime-/mangalist take

    console.log(`\n||\n|| Fetching user's MAL lists took ${Number(fetchMALTimeTaken/1000).toFixed(3)}s\n||`);

    return animemangalist;
}

async function fetchSeries() {
    try {
        const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status,num_episodes',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });
        await setTimeout(20); // avoiding rate limit

        const malResponseManga = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status,num_chapters',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });
        await setTimeout(20); // avoiding rate limit

        await sortSeriesByStatus(malResponseAnime.data.data, malResponseManga.data.data);
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function sortSeriesByStatus (animelist, mangalist) {
    for (let i = 0; i < animeStatus.length; i++) { // sort animelist by status
        for (let ii = 0, iii = 0; ii < animelist.length; ii++) { // sort by all series corresponding to animeStatus[i]
            if (animelist[ii].list_status.status === animeStatus[i]) { // if status of anime at point ii same as animestatus
                animemangalist[0][i][iii] = animelist[ii]; 
                animemangalist[0][i][iii].includeInMangadexFetch = true;
                iii++; 
            }
        }
    }
    for (let i = 0; i < mangaStatus.length; i++) { // sort mangalist by status
        for (let ii = 0, iii = 0; ii < mangalist.length; ii++) { // sort by all series corresponding to mangaStatus[i]
            if (mangalist[ii].list_status.status === mangaStatus[i]) { // if status of manga at point ii same as mangastatus
                animemangalist[1][i][iii] = mangalist[ii]; 
                animemangalist[1][i][iii].includeInMangadexFetch = true;
                iii++; 
            }
        }
    }
}

export { fetchMAL };