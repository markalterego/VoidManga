import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";

dotenv.config();

const animeStatus = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
const mangaStatus = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']; 

let animemangalist = [
    Array(animeStatus.length).fill(null).map(() => []), // animelist
    Array(animeStatus.length).fill(null).map(() => [])  // mangalist
]; 

async function pollMAL() {
    try {
        const startTime = performance.now();

        console.log(`\n||\n|| Now polling MAL lists for \'${process.env.MAL_USERNAME}\'\n||`);
        
        await fetchSeries(); // fetching user's MAL lists
        const pollMALTimeTaken = Math.round(performance.now()-startTime); // how long did fetching the anime-/mangalist take

        await fetchSeriesLength(); // polling different endpoint for series length
        const fetchSeriesTimeTaken = Math.round(performance.now()-startTime-pollMALTimeTaken); // how long did fetching manga and anime watching take

        console.log(`\n||\n|| Fetching user's MAL lists took ${Number(pollMALTimeTaken/1000).toFixed(3)}s\n|| Fetching the length of currently watching/reading series took ${Number(fetchSeriesTimeTaken/1000).toFixed(3)}s\n||\n|| The total time taken was ${Number((pollMALTimeTaken+fetchSeriesTimeTaken)/1000).toFixed(3)}s\n||`);

        return animemangalist;
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchSeries() {
    try {
        const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
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
                fields: 'list_status',
                limit: 1000, // max value
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });
        await setTimeout(20); // avoiding rate limit

        sortSeriesByStatus(malResponseAnime.data.data, malResponseManga.data.data);
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function sortSeriesByStatus (animelist, mangalist) {
    try {
        for (let i = 0; i < animeStatus.length; i++) { // sort animelist by status
            for (let ii = 0, iii = 0; ii < animelist.length; ii++) { // sort by all series corresponding to animeStatus[i]
                if (animelist[ii].list_status.status === animeStatus[i]) { // if status of anime at point ii same as animestatus
                    animemangalist[0][i][iii] = animelist[ii]; iii++; 
                }
            }
        }
        for (let i = 0; i < mangaStatus.length; i++) { // sort mangalist by status
            for (let ii = 0, iii = 0; ii < mangalist.length; ii++) { // sort by all series corresponding to mangaStatus[i]
                if (mangalist[ii].list_status.status === mangaStatus[i]) { // if status of manga at point ii same as mangastatus
                   animemangalist[1][i][iii] = mangalist[ii]; iii++; 
                }
            }
        }
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchSeriesLength() {
    try {
        for (let i = 0; i < animemangalist[0][0].length; i++) { // appends number of episodes to watching anime
            const id = animemangalist[0][0][i].node.id; 
            const response = await axios.get(`https://api.myanimelist.net/v2/anime/${id}`, { // getting info from anime endpoint
                params: {
                    fields: 'num_episodes'
                },
                headers: {
                    'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
                }
            });
            animemangalist[0][0][i].node.num_episodes = response.data.num_episodes; 
            await setTimeout(20); // avoiding rate limit
        }   
        for (let i = 0; i < animemangalist[1][0].length; i++) { // appends number of chapters to reading manga
            const id = animemangalist[1][0][i].node.id; 
            const response = await axios.get(`https://api.myanimelist.net/v2/manga/${id}`, { // getting info from manga endpoint
                params: {
                    fields: 'num_chapters'
                },
                headers: {
                    'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
                }
            });
            animemangalist[1][0][i].node.num_chapters = response.data.num_chapters;
            await setTimeout(20); // avoiding rate limit
        } 
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { pollMAL };