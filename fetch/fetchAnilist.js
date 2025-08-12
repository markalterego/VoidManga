import axios from "axios";
import { setTimeout } from "timers/promises";

async function fetchAnilist() {
    await fetchManga();
}   

async function fetchManga() {
    try {
        // basis for the query
        const query = `
        query ($search: String!) {
            Page (perPage: 3) {
                media(search: $search, type: MANGA) {
                id
                title {
                    romaji
                    english
                }
                }
            }
        }`; 
        const response = await axios.post('https://graphql.anilist.co', { // body
                query: query,
                variables: {
                    search: 'Frieren'
                }
            }, { // config
                headers: {
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json' 
                }
            }
        );
        const responseArr = response.data.data.Page.media;
        responseArr.forEach(value => console.log(value));
        await setTimeout(2000); // avoiding rate-limit
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

/*
The API is currently in a degraded state and is limited to 30 requests per minute. 
This is a temporary measure until the API is fully restored.

This is not currently reflected in the headers. You will notice rate limiting at an 
X-RateLimit-Remaining value of 60 once you have exceeded the available 30 requests per minute.
*/

export { fetchAnilist };