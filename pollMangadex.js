import axios from 'axios';
import { toZonedTime, format } from 'date-fns-tz';

// Sousou No Frieren: b0b721ff-c388-4486-aa0f-c2b0bb321512
// Berserk: 801513ba-a712-498c-8f57-cae55b38cc92

const ids = ['b0b721ff-c388-4486-aa0f-c2b0bb321512',
             '801513ba-a712-498c-8f57-cae55b38cc92'];

async function pollMangadex() {
    console.log('\n|| Newest Chapters:\n'); // empty line

    for (const id of ids) {
        try {
            const mangaResponse = await axios.get(`https://api.mangadex.org/manga/${id}`); // fetching manga name
            const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching english chapters of manga
                params: {
                    manga: id,
                    translatedLanguage: ['en'],
                    'order[publishAt]': 'desc',
                }
            });
            
            const mangaTitle = mangaResponse.data.data; // saving name of the manga
            const latestChapter = chapterResponse.data.data[0]?.attributes; // saving info about latest chapter if available
            const formattedDate = format(toZonedTime(latestChapter.publishAt, 'Europe/Helsinki'), 'dd.MM.yyyy HH:mm z'); // formatting the publish date 

            // condition ? valueIfTrue : valueIfFalse ---> returns title - altTitle if altTitle exists
            console.log(`||\n|| ${mangaTitle.attributes.title.en}${mangaTitle.attributes.altTitles[0]?.en ? ' - ' + mangaTitle.attributes.altTitles[0].en : ''}\n||`);            
            console.log(`|| Chapter: ${latestChapter.chapter} - \"${latestChapter.title}\"`);
            console.log(`|| Published: ${formattedDate}`);
            console.log(`||\n|| Link: ${'https://mangadex.org/chapter/' + chapterResponse.data.data[0]?.id}\n||`);
            if(id !== ids[ids.length-1]) console.log(); 
        } catch (error) {
            if (error.response) {
                console.error(`|| ${id}: Error ${error.response.status}: ${error.response.statusText}\n`);
            } else {
                console.error('|| Error:', error.message, '\n');
            }
        }
    }
}

export { pollMangadex };