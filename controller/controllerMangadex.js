import { selectMangasFromFetchResults } from "../ui/menuFetchMangadex.js";
import { filehandle } from "../filehandling/filehandle.js";
import { fetchMangadexMangas, fetchMangadexChapters, fetchNewestChapters } from '../fetch/fetchMangadex.js';
import { logErrorDetails } from "../helpers/errorLogger.js";
import { SYM, MESSAGE } from '../helpers/export.js';
import { truncateThenPadString } from "../helpers/functions.js";

let lists = null;
let mangadexData = null;
let mangadexFetchHistory = null;
let options = null;
let selectedMangas = null;
let mangasPreselected = false;

async function fetchWithOptions ({ l = null, md = null, mfh = null, o = null, sm = null } = {}) {
    lists = l;
    mangadexData = md;
    mangadexFetchHistory = mfh;
    options = o;
    selectedMangas = sm;
    mangasPreselected = false;
    try {
        if (selectedMangas) {
            mangasPreselected = true;
        } else {
            selectedMangas = await fetchMangas();
        }
        const combinedData = await fetchChapters(selectedMangas);
        updateFetchHistory(combinedData);
        updateMangadexData(combinedData);
    } catch (error) {
        logErrorDetails(error);
    }
}

async function fetchMangas() {
    // gathering selected MAL titles / mangaSearchStrings
    const searchQueue = options.fetchMangasByMALTitles 
        ? lists.flat(2).filter(e => e.includeInMangadexFetch).map(e => e.node.title)
        : options.mangaSearchStrings;
    if (!searchQueue.length) {
        throw new Error('No titles selected for search');
    }
    // fetching mangas
    const mangaData = await fetchMangadexMangas(searchQueue, options);
    const foundManga = mangaData?.some(mangaSearch => mangaSearch?.searchResults?.length > 0); 
    if (!foundManga) {
        throw new Error('No mangas were found');
    }
    // selecting mangas from mangaData
    const selectedMangas = await selectMangasFromFetchResults(mangaData, lists, mangadexData);
    if (!selectedMangas.length) { 
        throw new Error('No mangas were selected');
    } 
    return selectedMangas;
}

async function fetchChapters (selectedMangas) {
    // fetching chapters --- returns [{ manga: {}, chapters: [] }, ...]
    const combinedData = await fetchMangadexChapters(selectedMangas, options, mangasPreselected);  
    const hasChapters = combinedData?.some(search => search?.chapters?.length > 0); 
    if (!hasChapters) {
        throw new Error ('No chapters were found');
    }
    return combinedData;
}

function updateFetchHistory (combinedData) {
    const getMangaTitle = (manga) => Object.values(manga.attributes.title)[0];

    // format fetch info
    const fetchInfo = combinedData.reduce((acc, { manga, chapters }) => { 
        const { id: mangaId } = manga;
        const newChapters     = filterNewChapters(mangaId, chapters);
        const newChapterIds   = newChapters.map(ch => ch.id);
        return { 
            ...acc, 
            [mangaId]: {
                title: getMangaTitle(manga),
                status: findMangaById(mangaId, mangadexData) ? (newChapters.length ? 'UPDATED' : 'UPTODATE') : 'NEW',
                updatedCount: newChapters.length,
                chapterIds: newChapterIds
            }
        };
    }, {});

    const fetchInfoValues = Object.values(fetchInfo);
    const countStatus = (status_string) => fetchInfoValues.reduce((acc, { status }) => status === status_string ? acc + 1 : acc, 0);

    // including additional details
    fetchInfo.details = {
        fetchedAt: Date.now(),
        newMangas: countStatus('NEW'),
        updatedMangas: countStatus('UPDATED'),
        uptodateMangas: countStatus('UPTODATE')
    };

    // append new info
    mangadexFetchHistory.push(fetchInfo);

    // log fetch details
    logFetchInfo(fetchInfoValues);

    // save fetch info to file
    filehandle('mangadexFetchHistory', mangadexFetchHistory);
}

function logFetchInfo (fetchInfoValues) {
    console.log('\n  [Info]');
    for (const { title, status, updatedCount } of fetchInfoValues) {
        const formattedTitle = truncateThenPadString(title, 45);
        if (status === 'UPTODATE') {
            console.log(`    ${SYM[status]} ${formattedTitle} - up to date`);
        } else if (status === 'UPDATED') {
            console.log(`    ${SYM[status]} ${formattedTitle} - ${updatedCount} new chapters`);
        } else if (status === 'NEW') {
            console.log(`    ${SYM[status]} ${formattedTitle} - ${updatedCount} new chapters`);
        }
    }
}

function updateMangadexData (combinedData) {
    // update mangadexData
    combinedData.forEach(({ manga: fetchedManga, chapters: fetchedChapters }) => {
        const mangaId      = fetchedManga.id;
        const existingData = findMangaById(mangaId, mangadexData);
        // update mangadexData
        if (!existingData) {
            mangadexData.push({ manga: fetchedManga, chapters: fetchedChapters });
        } else {
            existingData.manga = { ...existingData.manga, ...fetchedManga }; // update manga data
            existingData.chapters = [ ...existingData.chapters, ...filterNewChapters(mangaId, fetchedChapters) ]; // update chapter data
        }
    });
    // save updated data to file
    filehandle('mangadex', mangadexData);
}

function filterNewChapters (mangaId, fetchedChapters) {
    // finds manga from existing mangadexData and filters
    // chapters from fetchedChapters if they already exist
    return fetchedChapters.filter(chapter => 
        !findMangaById(mangaId)?.chapters.some(existing => existing.id === chapter.id)
    );
}

function findMangaById (mangaId) {
    // returns reference to mangadexData object where mangaId === manga.id
    return mangadexData.find(({ manga: { id }}) => id === mangaId);
}

function clearLocalMDXData() {
    const mangadexData = [];
    filehandle('mangadex', mangadexData);
    MESSAGE.print(MESSAGE.CLEARED_LOCAL_DATA_MDX);
    return mangadexData;
}

function clearLocalMDXHData() {
    const mangadexFetchHistory = [];
    filehandle('mangadexFetchHistory', mangadexFetchHistory);
    MESSAGE.print(MESSAGE.CLEARED_LOCAL_DATA_MDXH);
    return mangadexFetchHistory;
}

export { fetchWithOptions, clearLocalMDXData, clearLocalMDXHData }; 