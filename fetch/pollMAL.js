import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";

dotenv.config();

async function pollMAL() {
    try {
        const startTime = performance.now();

        const malResponseAnimeWatching = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'watching',
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseAnimeCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'completed',
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaReading = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'reading',
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'completed',
                nsfw: true // allows a more accurate response
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        await setTimeout(80) // waiting 20ms per poll
        const pollMALTimeTaken = Math.round(performance.now()-startTime); // how long did fetching the first four endpoints take

        // malResponseAnime.data.data  <---- points to response data array
        const animelist = [malResponseAnimeWatching.data.data, malResponseAnimeCompleted.data.data]; // [watching, completed]
        const mangalist = [malResponseMangaReading.data.data, malResponseMangaCompleted.data.data]; // [reading, completed]

        await fetchSeriesLength(animelist,mangalist); // polling different endpoint for series length
        const fetchSeriesTimeTaken = Math.round(performance.now()-startTime-pollMALTimeTaken); // how long did fetching manga and anime watching take

        console.log(`\n||\n|| Fetching user's MAL lists took ${pollMALTimeTaken/1000}s\n|| Fetching the length of currently watching/reading series took ${fetchSeriesTimeTaken/1000}s\n||\n|| The total time taken was ${(pollMALTimeTaken+fetchSeriesTimeTaken)/1000}s\n||`);

        const animemangalist = [animelist, mangalist];
        return animemangalist;
    } catch (error) {
        if (error.response) {
            console.error(`\n|| Error: ${error.response.status}: ${error.response.statusText}`);
        } else {
            console.error('\n|| Error:', error.message);
        }
    }
}

async function fetchSeriesLength (animelist, mangalist) {
    try {
        for (let i = 0; i < animelist[0].length; i++) // appends number of episodes to watching anime
        {
            const id = animelist[0][i].node.id; 
            const response = await axios.get(`https://api.myanimelist.net/v2/anime/${id}`, { // getting info from anime endpoint
                params: {
                    fields: 'num_episodes'
                },
                headers: {
                    'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
                }
            });
            animelist[0][i].node.num_episodes = response.data.num_episodes; 
            await setTimeout(20); // avoiding rate limit
        }   

        for (let i = 0; i < mangalist[0].length; i++) // appends number of chapters to reading manga
        {
            const id = mangalist[0][i].node.id; 
            const response = await axios.get(`https://api.myanimelist.net/v2/manga/${id}`, { // getting info from manga endpoint
                params: {
                    fields: 'num_chapters'
                },
                headers: {
                    'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
                }
            });
            mangalist[0][i].node.num_chapters = response.data.num_chapters;
            await setTimeout(20); // avoiding rate limit
        } 
    } catch (error) {
        if (error.response) {
            console.error(`\n|| Error: ${error.response.status}: ${error.response.statusText}`);
        } else {
            console.error('\n|| Error:', error.message);
        }
    }
}

export { pollMAL };