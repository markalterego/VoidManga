import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from "timers/promises";

dotenv.config();

async function pollMAL() {
    try {
        const malResponseAnimeWatching = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'watching'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseAnimeCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'completed'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaReading = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'reading'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                fields: 'list_status',
                limit: 1000, // max value
                status: 'completed'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        // malResponseAnime.data.data  <---- points to response data array
        const animelist = [malResponseAnimeWatching.data.data, malResponseAnimeCompleted.data.data]; // [watching, completed]
        const mangalist = [malResponseMangaReading.data.data, malResponseMangaCompleted.data.data]; // [reading, completed]
        
        await fetchSeriesLength(animelist,mangalist); // polling different endpoint for series length

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

            if (((i+1)%2) === 0) await setTimeout(2000); // avoiding rate limit
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
            
            if (((i+1)%2) === 0) await setTimeout(2000); // avoiding rate limit
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