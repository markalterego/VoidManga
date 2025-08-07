import axios from "axios";

async function fetchAnilist() {
    const response = await fetchManga();
    console.log(response.data);
    return response;
}   

async function fetchManga() {
    try {
        const query = ``; // a string consisting variables sent to the api
        const variables = {
            /*
            e.g.
            id: 1234,
            */
        };
        // anilist api 
        const url = 'https://graphql.anilist.co';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query: query, variables: variables })
        }; 
        




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