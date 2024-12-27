import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function pollMAL() {
    try {
        const malResponseAnimeWatching = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                limit: 1000, // max value
                status: 'watching'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseAnimeCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/animelist`, {
            params: {
                limit: 1000, // max value
                status: 'completed'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaReading = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                limit: 1000, // max value
                status: 'reading'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        const malResponseMangaCompleted = await axios.get(`https://api.myanimelist.net/v2/users/${process.env.MAL_USERNAME}/mangalist`, {
            params: {
                limit: 1000, // max value
                status: 'completed'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_API_CLIENT_ID
            }
        });

        // malResponseAnime.data.data  <---- points to response data array
        const animelist = [malResponseAnimeWatching.data.data, malResponseAnimeCompleted.data.data];
        const mangalist = [malResponseMangaReading.data.data, malResponseMangaCompleted.data.data];
        
        console.log('\n||\n|| = Animelist =\n||'); // logging MAL personal anime titles
        console.log('|| (Watching)\n||'); // logging titles marked as 'watching'
        for (let i = 0; i < animelist[0].length; i++) { 
            console.log(`|| - ${animelist[0][i].node.title}`);
            if (i===(animelist[0].length-1)) console.log('||');
        }
        console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
        for (let i = 0; i < animelist[1].length; i++) { 
            console.log(`|| - ${animelist[1][i].node.title}`);
            if (i===(animelist[1].length-1)) console.log('||');
        }

        console.log('\n||\n|| = Mangalist =\n||'); // logging MAL personal manga titles
        console.log('|| (Reading)\n||'); // logging titles marked as 'reading'
        for (let i = 0; i < mangalist[0].length; i++) { 
            console.log(`|| - ${mangalist[0][i].node.title}`);
            if (i===(mangalist[0].length-1)) console.log('||');
        }
        console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
        for (let i = 0; i < mangalist[1].length; i++) { 
            console.log(`|| - ${mangalist[1][i].node.title}`);
            if (i===(mangalist[1].length-1)) console.log('||');
        }

        //console.log(JSON.stringify(malResponseAnime));
        
    } catch (error) {
        if (error.response) {
            console.error(`|| Error: ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}

export { pollMAL };