import axios from 'axios';
import { toZonedTime, format } from 'date-fns-tz';

// Sousou No Frieren: b0b721ff-c388-4486-aa0f-c2b0bb321512
// Berserk: 801513ba-a712-498c-8f57-cae55b38cc92

const ids = ['b0b721ff-c388-4486-aa0f-c2b0bb321512',
             '801513ba-a712-498c-8f57-cae55b38cc92'];

async function pollMangadex (lists) {
    const mangas = lists[1][0]; // points to mangas tagged as reading
    console.log('\n|| Newest Chapters:\n'); // empty line
    for (const id of ids) {
        try {
            const mangaResponse = await axios.get(`https://api.mangadex.org/manga/${id}`); 
            const chapterResponse = await axios.get('https://api.mangadex.org/chapter', { // fetching english chapters of manga
                params: {
                    manga: id,
                    // translatedLanguage: ['en'], <-- mangadex isoi juttui tapahtuu probably broke this line idk
                    'order[chapter]': 'desc',
                }
            });

            const mangaTitle = mangaResponse.data.data; // saving name of the manga
            const chapterResponseEn = chapterResponse.data.data.filter((chapter) => { // filtering all english translations from chapterResponse
                chapter.attributes.translatedLanguage === 'en'
            }); 
            let latestChapter = null;
            let formattedDate = null;
            if (chapterResponseEn.length===0) { // No english translations were found
                latestChapter = chapterResponse.data.data[0]?.attributes; // saving info about latest chapter if available
                formattedDate = format(toZonedTime(latestChapter.publishAt, 'Europe/Helsinki'), 'dd.MM.yyyy HH:mm z'); // formatting the publish date
            } else {
                latestChapter = chapterResponseEn[0]?.attributes; // saving info about latest chapter if available
                formattedDate = format(toZonedTime(latestChapter.publishAt, 'Europe/Helsinki'), 'dd.MM.yyyy HH:mm z'); // formatting the publish date
            }
            let newChapterFlag = false; // tells if the chapter is not yet read

            for (const manga of mangas) { // checks whether to set the newChapterFlag
                const manga_mal_id = manga.node.id;
                const manga_mdx_id = parseInt(mangaTitle.attributes.links?.mal);
                if (manga_mal_id===manga_mdx_id) { // mal id is found in the response of mangadex
                    if ((manga.list_status.num_chapters_read) < (parseInt(latestChapter.chapter))) {
                        newChapterFlag = true;
                    }
                    break; // break to avoid unnecessary looping
                }
            }

            // condition ? valueIfTrue : valueIfFalse ---> returns title - altTitle if altTitle exists
            if (!newChapterFlag) {
                console.log(`||\n|| ${mangaTitle.attributes.title.en}${mangaTitle.attributes.altTitles[0]?.en ? ' - ' + mangaTitle.attributes.altTitles[0].en : ''}\n||`);
            } else {
                console.log(`||\n|| ${mangaTitle.attributes.title.en}${mangaTitle.attributes.altTitles[0]?.en ? ' - ' + mangaTitle.attributes.altTitles[0].en : ''} {( New! )}\n||`);
            }
            console.log(`|| Chapter: ${latestChapter.chapter} - \"${latestChapter.title}\"`);      
            console.log(`|| Published: ${formattedDate}`);
            console.log(`||\n|| Link: ${'https://mangadex.org/chapter/' + chapterResponse.data.data[0]?.id}\n||`);
            if (id !== ids[ids.length-1]) console.log(); 
        } catch (error) {
            if (error.response) {
                console.error(`|| ${id}: Error ${error.response.status}: ${error.response.statusText}`);
            } else {
                console.error('|| Error:', error.message);
            }
        }
    }
}


export { pollMangadex };