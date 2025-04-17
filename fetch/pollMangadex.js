import axios from 'axios';
import { toZonedTime, format } from 'date-fns-tz';

// Sousou No Frieren: b0b721ff-c388-4486-aa0f-c2b0bb321512
// Berserk: 801513ba-a712-498c-8f57-cae55b38cc92

const ids = ['b0b721ff-c388-4486-aa0f-c2b0bb321512',
             '801513ba-a712-498c-8f57-cae55b38cc92',
             'fc7f2c19-0a26-4d89-9505-332fcb7d60c6',
             'b30dfee3-9d1d-4e8d-bfbe-8fcabc3c96f6'];

async function pollMangadex (lists) {
    const mangas = lists[1][0]; // points to mangas tagged as reading
    console.log('\n|| Newest Chapters:\n'); // empty line
    try {
        for (const id of ids) {
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
            let newChapterFlag = false; // tells if the chapter is not yet read

            for (const manga of mangas) {
                const re = /'|-|:|,/g; // regex  
                const manga_mal = manga.node.title.toLowerCase().replace(re,'').replace('  ', ' ');
                const manga_mdx = mangaTitle.attributes.altTitles[0].en?.toLowerCase().replace(re,'').replace('  ', ' ');
                console.log('1: ' + manga_mal);
                console.log('2: ' + manga_mdx + '\n');
                if (manga_mal===manga_mdx) { // if manga.node.title in small letters is the same as mangatitle in small letters
                    console.log(manga_mal,manga_mdx);
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
            // console.log(mangaResponse.data.data);
            // console.log(chapterResponse.data.data);
        }
    } catch (error) {
        if (error.response) {
            console.error(`|| ${id}: Error ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}


export { pollMangadex };