import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";

dotenv.config();

async function pollMAL() {
    try {
        const startTime = performance.now();
        
        const animemangalist = await fetchSeries(); // fetching user's MAL lists
        const pollMALTimeTaken = Math.round(performance.now()-startTime); // how long did fetching the first four endpoints take

        await fetchSeriesLength(animemangalist); // polling different endpoint for series length
        const fetchSeriesTimeTaken = Math.round(performance.now()-startTime-pollMALTimeTaken); // how long did fetching manga and anime watching take

        console.log(`\n||\n|| Fetching user's MAL lists took ${pollMALTimeTaken/1000}s\n|| Fetching the length of currently watching/reading series took ${fetchSeriesTimeTaken/1000}s\n||\n|| The total time taken was ${(pollMALTimeTaken+fetchSeriesTimeTaken)/1000}s\n||`);

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
        let animemangalist = [[null],[null]];
        const animeStatus = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];
        const mangaStatus = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read']; 

        for (let i = 0; i < animeStatus.length; i++) { // polling anime
            const malResponseAnime = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: animeStatus[i],
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
            });
            animemangalist[0][i] = malResponseAnime.data.data; // adding response to animemangalist
            await setTimeout(20); // avoiding rate limit
        }

        for (let i = 0; i < mangaStatus.length; i++) { // polling manga
            const malResponseManga = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: mangaStatus[i],
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
            });
            animemangalist[1][i] = malResponseManga.data.data; // adding response to animemangalist
            await setTimeout(20); // avoiding rate limit
        }

        return animemangalist;
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

async function fetchSeriesLength (animemangalist) {
    try {
        for (let i = 0; i < animemangalist[0][0].length; i++) // appends number of episodes to watching anime
        {
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

        for (let i = 0; i < animemangalist[1][0].length; i++) // appends number of chapters to reading manga
        {
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