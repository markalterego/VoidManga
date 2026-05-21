import { takeUserInput, capitalFirstLetterString, longStringToArray, 
         printMenuOptions, isValidLangCode, escapeRegex, truncateString,
         openURLInBrowser, isISODate } from '../helpers/functions.js';
import { MESSAGE, SYM, historyOrderTypes } from '../helpers/export.js';
import { updateEntryMenu } from './menuMAL.js';
import cliTruncate from 'cli-truncate';
import stringWidth from 'string-width';
import { filehandle } from '../filehandling/filehandle.js';
import { existsSync } from 'fs';

// TODO:
// - maybe save stuff like 'currentPage' to config as e.g. 'currentPageManga'
// - make it possible to LOG chapters from range. Make sure the user only 
//   has to provide a lower and upper limit and everything else is handled
//   automatically 

let lists = null; // MAL lists
let options = null; // config.logMangadexOptions
let logAuthURL = null; // config.menuMALOptions.logAuthURL
let mangadexData = null; // mangas and their chapters
let mangadexFetchHistory = null; // fetch related info

async function menuLogMangadex (m, l, config, mfh) {
    const TRAVERSEMANGAS = 0, SEARCHMANGAS = 1, TRAVERSE_HISTORY = 2;
    let input = null;

    mangadexData = m, 
    { logAuthURL } = config.menuMALOptions, 
    options = config.logMangadexOptions, 
    lists = l,
    mangadexFetchHistory = mfh;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Log MangaDex',
            [
                ['Traverse mangas'],
                ['Search mangas'],
                ['Traverse history'],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === TRAVERSEMANGAS) {
            await traverseMangas();
        } else if (input === SEARCHMANGAS) {
            await searchMangas();
        } else if (input === TRAVERSE_HISTORY) {
            await traverseHistory();
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseMangas (traversable = null, skipToTraverseChapters = false) {
    let input = null, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }, sortedMangas; 
    const formatMangaTitle = (index, title, chaptersLength) => {
        const indexWithPadding = String(index).padEnd(4); // pads up to 4 digits
        const separatorWithPadding = ':'.padEnd(1); // pads 1 after separator
        const maxTitleWidth = 35;
        const truncatedTitle = cliTruncate(title, maxTitleWidth); // cliTruncate takes into account 2 width chars
        const truncatedTitleWithPadding = truncatedTitle + ' '.repeat(maxTitleWidth - stringWidth(truncatedTitle) + 2); // stringWidth counts 2 width chars 
        return [indexWithPadding, separatorWithPadding, truncatedTitleWithPadding + `(${chaptersLength})`];
    };

    // TODO: 
    // - if manga is found on the user's MAL lists, appends e.g. "*reading" or similar
    //   to the end of that specific title

    while (input !== 'e') 
    {
        sortedMangas = input === 'f' || input === 'h' || input === 's'  || input === 'o' || input === null ? sortMangas(traversable ?? mangadexData) : sortedMangas; 
        pageDetails = options.enablePagingManga ? updatePageDetails(pageDetails, sortedMangas) : pageDetails;
        let pagedMangas = pageContent(sortedMangas, pageDetails.currentPageIndex, options.enablePagingManga); 

        // formatting printMenuOptions parameters
        const mangaTitles = pagedMangas.map((obj, index) => formatMangaTitle(index, Object.values(obj.manga.attributes.title)[0], obj.chapters.length));
        const pageFooter = mangaTitles.length && options.enablePagingManga ? 'p' : null;
        const titles = pagedMangas.length ? [...mangaTitles] : [['?', 'No manga found']];
        
        const optionsArray = [
            '-',
            '_',
            ...titles,
            pageFooter,
            '_',
            '_',
            ['f', `Filter by mangalist [${options.filterByMangasFoundAtMangalist ? 'x' : ''}]`],
            ['h', `Hide manga with no chapters [${options.hideZeroLengthManga ? 'x' : ''}]`],
            ['s', `Sort ${options.logMangaDirection === 'asc' ? 'descending' : 'ascending'}`],
            ['o', `Order ${options.sortMangasAlphabetical ? 'by chapter count' : 'alphabetical'}`],
            ['t', `Toggle paging [${options.enablePagingManga ? 'x' : ''}]`],
            (options.enablePagingManga ? [SYM.CHANGE_PAGE, 'Next/Previous page'] : null)
        ];

        // calling printMenuOptions
        printMenuOptions(
            'Select manga', 
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < pagedMangas.length) {
            skipToTraverseChapters ? await traverseChapters(pagedMangas[input]) : await mangaOptionsMenu(pagedMangas[input]);
        } else if (input === 'f') { // filter mangas found at user's MAL mangalist
            options.filterByMangasFoundAtMangalist = !options.filterByMangasFoundAtMangalist;
        } else if (input === 'h') { // toggle hide/show zero length manga
            options.hideZeroLengthManga = !options.hideZeroLengthManga;
        } else if (input === 's') { // toggle ascending/descending
            options.logMangaDirection = options.logMangaDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === 'o') { // order alphabetical/chapter count
            options.sortMangasAlphabetical = !options.sortMangasAlphabetical;
        } else if (input === 't') { // toggle paging on/off
            options.enablePagingManga = !options.enablePagingManga;
        } else if (options.enablePagingManga && (input === '+' || input === '-' || input === '++' || input === '--' || input?.[0] === 'p')) { // pageOptions
            pageDetails = pagingOptions(input, sortedMangas, pageDetails);
        } else if (input !== 'e') { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }    
}

function sortMangas (data) {
    const { filterByMangasFoundAtMangalist, hideZeroLengthManga, sortMangasAlphabetical,
            logMangaDirection } = options;
    let sortedMangas = [...data];
    // filter by mangas found at user's mangalist
    if (filterByMangasFoundAtMangalist) {
        sortedMangas = sortedMangas.filter(obj => findEntryAtLists(obj.manga));
    }
    // filter mangas with no chapters
    if (hideZeroLengthManga) { 
        sortedMangas = sortedMangas.filter(obj => obj.chapters.length > 0);    
    } 
    // sorting methods used
    if (sortMangasAlphabetical) {  
        if (logMangaDirection === 'asc') { // sort ascending (A-Z)
            sortedMangas.sort((a, b) => 
                Object.values(a.manga.attributes.title)[0]
                .localeCompare(Object.values(b.manga.attributes.title)[0])
            );
        } else { // sort descending (Z-A) 
            sortedMangas.sort((a, b) => 
                Object.values(b.manga.attributes.title)[0]
                .localeCompare(Object.values(a.manga.attributes.title)[0])
            );
        }
    } else { // sort ascending (0-999) / descending (999-0) - chapters amount
        if (options.logMangaDirection === 'asc') { 
            sortedMangas.sort((a, b) => a.chapters.length - b.chapters.length); // sort ascending
        } else { 
            sortedMangas.sort((a, b) => b.chapters.length - a.chapters.length); // sort descending
        }
    }
    return sortedMangas;
}

async function searchMangas() {
    const MANGATITLE = 0;
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Search mangas',
            [
                ['Manga title'],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === MANGATITLE) {
            await findMangaByMangaTitle();
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function findMangasByFetchInfo ({fetchInfo = {}, status = null} = {}) {
    // filters param fetchInfo by param status
    // e.g. if we filter by status = 'new'
    // { mangaId: { ..., status: NEW }} <-- { mangaId: { ..., status: UPTODATE }, mangaId: { ..., status: NEW }}
    const filteredFetchInfo = status 
        ? Object.entries(fetchInfo).filter(([_, val]) => val.status === status.toUpperCase()) 
        : Object.entries(fetchInfo);
    
    if (!filteredFetchInfo.length) {
        MESSAGE.print(MESSAGE.MANGA_NOT_FOUND);
    } else {
        // find mangas from mangadexData 
        const foundMangas = mangadexData.filter(({ manga }) => 
            filteredFetchInfo.some(([id, _]) => id === manga.id)
        );
        // filter found mangas by chapterIds
        const filteredFoundMangas = foundMangas.map(({ manga, chapters }) => {
            const updatedIds      = Object.fromEntries(filteredFetchInfo)[manga.id].chapterIds;
            const updatedChapters = chapters.filter(chapter => updatedIds.some(id => chapter.id === id));
            return { manga: manga, chapters: updatedChapters };
        });
        // traverse found mangas + chapters
        await traverseMangas(filteredFoundMangas, true);
    }
}

function findLatestFetchInfo({ status = null, min = 1 } = {}) {
    //
    //  - By default, finds the latest fetchInfo object 
    //    > the returned object has the largest details.fetchedAt value
    //  
    //  - Filtering with status ('new' || 'updated' || 'uptodate') only allows 
    //    returning objects where the count of objects labelled with that status
    //    is equal to or exceeds min
    //
    const toReduce = status 
        ? mangadexFetchHistory.filter(fetchInfo => fetchInfo.details[`${status.toLowerCase()}Mangas`] >= min) // match details.[updated/new/uptodate]Mangas
        : mangadexFetchHistory;
    
    if (!toReduce.length) return {};

    // find latest from filtered
    return toReduce.reduce((acc, fetchInfo) => 
        fetchInfo.details.fetchedAt > acc.details.fetchedAt ? { ...fetchInfo } : { ...acc }
    , toReduce[0]); 
}

async function findMangaByMangaTitle() {
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Input a manga title:'
        );

        input = await takeUserInput(false, true);

        if (typeof input === 'string' && input.length && input !== 'e') {
            const regex = new RegExp(`\\b${escapeRegex(input)}`, 'i'); // regex matches input at beginning of each word
            const matching = mangadexData.filter(({manga: {attributes: {title}}}) => regex.test(Object.values(title)[0])); // match title to input
            if (!matching.length) { // no matching results
                MESSAGE.print(MESSAGE.MATCHES_NOT_FOUND);
            } else if (matching.length === 1) { // open manga
                await mangaOptionsMenu(matching[0]);
            } else { // traverse results
                await traverseMangas(matching);
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaOptionsMenu (selectedManga) {
    const OPENINBROWSER = 0, TRAVERSECHAPTERS = 1, FINDCHAPTEROFMANGA = 2, LOGDATA = 'l';
    let input = 0;

    while (input !== 'e') 
    {
        const title = Object.values(selectedManga.manga.attributes.title)[0]; // first title of titles
        
        printMenuOptions(
            `Select an option for ${title}`,
            [
                ['Open manga in browser'],
                ['Traverse chapters'], 
                ['Search for chapter'],
                '_',
                ['l', 'Log manga data']
            ]
        );

        input = await takeUserInput(true);

        if (input === OPENINBROWSER) {
            await openURLInBrowser(selectedManga.manga?.url, title);
        } else if (input === TRAVERSECHAPTERS) { 
            await traverseChapters(selectedManga); 
        } else if (input === FINDCHAPTEROFMANGA) { 
            await searchChapters(title, selectedManga);
        } else if (input === LOGDATA) {
            await logDataDeepMenu(selectedManga.manga, title, true);
        } else if (input !== 'e') { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseHistory() {
    let input = null, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }, sortedHistory, pagedHistory;
    const formatFetchInfo = (fetchInfo) => {
        // counting mangas/chapters fetched
        const values = Object.values(fetchInfo);
        const fetchedMangas   = countFetchedMangas(values);
        const paddedMangas    = String(fetchedMangas).padEnd(4, ' ');
        const fetchedChapters = countFetchedChapters(values);
        // fetchedAt as yyyy-mm-dd hh:mm:ss
        const formattedDate = formatDate(fetchInfo.details.fetchedAt);
        return [`${formattedDate}  m:${paddedMangas} c:${fetchedChapters}`];
    };

    while (input !== 'e') 
    {
        sortedHistory = input === null || input === 's' || input === 'o' ? sortHistory() : sortedHistory;
        pageDetails   = options.enablePagingHistory ? updatePageDetails(pageDetails, sortedHistory) : pageDetails;
        pagedHistory  = pageContent(sortedHistory, pageDetails.currentPageIndex, options.enablePagingHistory);

        // format menu options
        const fetchHistory = pagedHistory.map((info) => formatFetchInfo(info));
        const history = pagedHistory.length ? [...fetchHistory] : [['?', 'No fetches found']];
        const pageFooter = pagedHistory.length && options.enablePagingHistory ? 'p' : null;
        const optionsArray = [
            '-',
            '_',
            ...history,
            pageFooter,
            '_',
            '_',
            ['s', `Sort ${historyOrderTypes[options.historyOrderType][(options.logHistoryDirection === 'asc' ? 'desc' : 'asc')]}`],
            ['o', `Order by ${nextHistoryOrderType()}`],
            ['t', `Toggle paging [${options.enablePagingHistory ? 'x' : ''}]`],
            (options.enablePagingHistory ? [SYM.CHANGE_PAGE, 'Next/Previous page'] : null)
        ];

        printMenuOptions(
            'Select fetch',
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true);

        if (input >= 0 && input < pagedHistory.length) {
            await historyOptionsMenu(pagedHistory[input]);
        } else if (input === 't') { // enable paging
            options.enablePagingHistory = !options.enablePagingHistory;
        } else if (input === 's') { // sort direction
            options.logHistoryDirection = options.logHistoryDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === 'o') { // order type
            options.historyOrderType = nextHistoryOrderType();
        } else if (options.enablePagingHistory && (input === '+' || input === '-' || input === '++' || input === '--' || input?.[0] === 'p')) {
            pageDetails = pagingOptions(input, sortedHistory, pageDetails);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function sortHistory() {
    let history = mangadexFetchHistory;
    const orderType = options.historyOrderType;
    const logDirection = options.logHistoryDirection;

    if (orderType === 'time') {
        return logDirection === 'asc' 
            ? history.sort((a, b) => a.details.fetchedAt - b.details.fetchedAt)
            : history.sort((a, b) => b.details.fetchedAt - a.details.fetchedAt);
    } else if (orderType === 'mangas') {
        return logDirection === 'asc' 
            ? history.sort((a, b) => countFetchedMangas(Object.values(a)) - countFetchedMangas(Object.values(b)))
            : history.sort((a, b) => countFetchedMangas(Object.values(b)) - countFetchedMangas(Object.values(a)));
    } else if (orderType === 'chapters') {
        return logDirection === 'asc' 
            ? history.sort((a, b) => countFetchedChapters(Object.values(a)) - countFetchedChapters(Object.values(b)))
            : history.sort((a, b) => countFetchedChapters(Object.values(b)) - countFetchedChapters(Object.values(a)));
    }
}

function nextHistoryOrderType() {
    const keys = Object.keys(historyOrderTypes);
    const index = keys.findIndex(key => key === options.historyOrderType);
    const nextIndex = index + 1;
    return nextIndex < keys.length ? keys[nextIndex] : keys[0];
}

function countFetchedMangas (values) {
    return values.reduce((acc, info) => info.status ? acc + 1 : acc, 0);
}

function countFetchedChapters (values) {
    return values.reduce((acc, info) => info.updatedCount ? acc + info.updatedCount : acc, 0);
}

function formatDate (DATE) {
    const date = new Date(DATE);
    const yyyy = date.getFullYear(); 
    const mm   = String(date.getMonth()).padStart(2, '0');
    const dd   = String(date.getDay()).padStart(2, '0');
    const hh   = String(date.getHours()).padStart(2, '0');
    const min  = String(date.getMinutes()).padStart(2, '0');
    const ss   = String(date.getSeconds()).padStart(2, '0');
    // e.g. `2026-04-02 06:42:54  m:44   c:1186`
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function historyOptionsMenu (selectedFetch) {    
    const ALL = 0, NEW = 1, UPDATED = 2, UPTODATE = 3;
    const { details } = selectedFetch;
    const { newMangas, updatedMangas, uptodateMangas } = details;
    const formattedDate = formatDate(details.fetchedAt);
    const header        = `Fetch (${formattedDate})`;
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            header,
            [
                [`All        [${newMangas + updatedMangas + uptodateMangas}]`],
                [`New        [${newMangas}]`],
                [`Updated    [${updatedMangas}]`],
                [`Up To Date [${uptodateMangas}]`],
                '_'
            ]
        );

        input = await takeUserInput(true);

        if (input === ALL) {
            await findMangasByFetchInfo({ fetchInfo: selectedFetch });
        } else if (input === NEW) {
            await findMangasByFetchInfo({ fetchInfo: selectedFetch, status: 'new' }); 
        } else if (input === UPDATED) {
            await findMangasByFetchInfo({ fetchInfo: selectedFetch, status: 'updated'});
        } else if (input === UPTODATE) {
            await findMangasByFetchInfo({ fetchInfo: selectedFetch, status: 'uptodate'});
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseChapters (selectedManga, chapterArr) {
    const chapters = chapterArr ?? selectedManga.chapters;
    const manga = chapterArr ? selectedManga : selectedManga.manga;
    let input = null, pageDetails = { currentPageIndex: 0, lastPageIndex: 0 }, sortedChapters, pagedChapters;
    const formatChapterTitle = (index, { attributes: { title, volume, chapter, translatedLanguage } }, foundManga) => {
        const indexWithPadding = String(index).padEnd(4); // pads up to 4 digit indexes
        const separatorWithPadding = ':'.padEnd(1); // pads separator once
        const progressLabelWithPadding = (() => {
            const vlLabel = volume ? `Vol.${volume}` : ''; 
            const chLabel = chapter ? `Ch.${chapter}` : ''; 
            const combined = [vlLabel, chLabel].filter(Boolean).join(' ');
            const wrapped = combined ? `[${combined}]` : '[???]';
            return wrapped.padEnd(18);
        })();
        const maxTitleWidth = 35;
        const chTitle = title?.trim() || 'No Title'; // empty strings count as 'No Title'
        const truncatedTitle = cliTruncate(chTitle, maxTitleWidth);
        const truncatedTitleWithPadding = truncatedTitle + ' '.repeat(maxTitleWidth - stringWidth(truncatedTitle) + 2); 
        const transLangWithPadding = `(${translatedLanguage ?? '??-??'})`.padEnd(8); // minimum one padding after max length
        const unreadFlag = foundManga?.list_status.num_chapters_read < chapter ? '{( Unread! )}' : '';
        return [indexWithPadding, separatorWithPadding, `${progressLabelWithPadding}${truncatedTitleWithPadding}${transLangWithPadding}${unreadFlag}`];
    };

    // TODO:
    // - make it possible to arrange chapters by their title a-z and z-a

    while (input !== 'e') 
    {
        const foundManga = findEntryAtLists(manga);
        sortedChapters = input === 'h' || input === 'l' || isValidLangCode(input) || input === 's' || input === null || (input >= 0 && input <= pagedChapters.length && options.hideReadChapters) ? sortChapters(chapters, foundManga) : sortedChapters;
        pageDetails = options.enablePagingChapter ? updatePageDetails(pageDetails, sortedChapters) : pageDetails;
        pagedChapters = pageContent(sortedChapters, pageDetails.currentPageIndex, options.enablePagingChapter);

        // formatting printMenuOptions parameters
        const chapterTitles = pagedChapters.map((ch, index) => formatChapterTitle(index, ch, foundManga));
        const titles = chapterTitles.length ? [...chapterTitles] : [['?', 'No chapters found']];
        const pageFooter = chapterTitles.length && options.enablePagingChapter ? 'p' : null;

        const optionsArray = [
            '-',
            '_',
            ...titles,
            pageFooter,
            '_',
            '_',
            ['h', `Hide read chapters [${options.hideReadChapters ? 'x' : ''}]`],
            ['?', `Input lang-code [${options.filterChapterLanguages.length ? options.filterChapterLanguages : 'no filters'}] (l to clear)`],
            ['s', `Sort ${options.logChapterDirection === 'asc' ? 'descending' : 'ascending'}`],
            ['t', `Toggle paging [${options.enablePagingChapter ? 'x' : ''}]`],
            (options.enablePagingChapter ? [SYM.CHANGE_PAGE, 'Next/Previous page'] : null)
        ];

        // calling printMenuOptions
        printMenuOptions(
            'Select chapter',
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true); 

        if (input >= 0 && input < pagedChapters.length) { 
            await chapterOptionsMenu(pagedChapters[input], manga);
        } else if (input === 'h') { // toggle hide read chapters
            options.hideReadChapters = !options.hideReadChapters;
        } else if (input === 'l') { // clear lang-codes
            options.filterChapterLanguages = [];
        } else if (isValidLangCode(input)) { // add lang-code
            options.filterChapterLanguages.push(input); 
            options.filterChapterLanguages = [...new Set(options.filterChapterLanguages)]; // clear duplicates
        } else if (input === 's') { // toggle sort direction
            options.logChapterDirection = options.logChapterDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === 't') { // toggle paging on/off
            options.enablePagingChapter = !options.enablePagingChapter;
        } else if (options.enablePagingChapter && (input === '+' || input === '-' || input === '++' || input === '--' || input?.[0] === 'p')) { // pageOptions
            pageDetails = pagingOptions(input, sortedChapters, pageDetails);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function sortChapters (chapters, foundManga) {
    let sortedChapters = Object.values(chapters); // chapters
    // hide read chapters
    if (options.hideReadChapters && foundManga) { // don't hide if foundManga undefined
        sortedChapters = sortedChapters.filter(chapter => chapter.attributes.chapter > parseInt(foundManga.list_status.num_chapters_read)); 
    } 
    // filter by translated language 
    if (options.filterChapterLanguages.length) { 
        sortedChapters = sortedChapters.filter(chapter => options.filterChapterLanguages.includes(chapter.attributes.translatedLanguage));
    }
    // log by chapter number either 1-999 or 999-1
    const logDirection = options.logChapterDirection;

    const chapterOnly = sortedChapters.filter(({ attributes: { volume, chapter } }) => !volume && chapter);
    const volumeOnly = sortedChapters.filter(({ attributes: { volume, chapter }})  => volume && !chapter);
    const volumeChapter = sortedChapters.filter(({ attributes: { volume, chapter }}) => volume && chapter);
    const noVolumeOrChapter = sortedChapters.filter(({ attributes: { volume, chapter }}) => !volume && !chapter);

    return [
        ...volumeOnly.sort((a, b) => {
            return logDirection === 'asc'
                ? a.attributes.volume - b.attributes.volume
                : b.attributes.volume - a.attributes.volume
        }),
        ...volumeChapter.sort((a, b) => {
            if (a.attributes.volume !== b.attributes.volume) {
                return logDirection === 'asc'
                    ? a.attributes.volume - b.attributes.volume
                    : b.attributes.volume - a.attributes.volume
            }
            return logDirection === 'asc'
                ? a.attributes.chapter - b.attributes.chapter
                : b.attributes.chapter - a.attributes.chapter
        }), 
        ...chapterOnly.sort((a, b) => {
            return logDirection === 'asc' 
                ? Number(a.attributes.chapter) - Number(b.attributes.chapter)
                : Number(b.attributes.chapter) - Number(a.attributes.chapter)
        }),
        ...noVolumeOrChapter
    ]; 
}

function updatePageDetails (pageDetails, sortedContent) {
    // calculating lastPageIndex
    pageDetails.lastPageIndex = sortedContent.length > 10 ? Math.ceil(sortedContent.length / 10) - 1 : 0;
    // checking currentPageIndex value
    const isAllowedPage = pageDetails.currentPageIndex <= pageDetails.lastPageIndex;
    // set currentPage to lastPage if not allowed
    if (!isAllowedPage) pageDetails.currentPageIndex = pageDetails.lastPageIndex;
    return pageDetails;
}

function pageContent (sortedContent, currentPage, enablePaging) {
    // page content (sortedMangas/sortedChapters)
    if (enablePaging) { 
        // page is always of 10 length, unless 
        // there's not enough items to fill it
        let startIndex = currentPage > 0 ? currentPage * 10 : 0; // 0, 10, 20
        let endIndex = startIndex + 9; // 0 -> 9, 10 -> 19, 20 -> 30
        // filter 10 mangas from sortedMangas by range of startIndex - endIndex 
        return sortedContent.filter((_, index) => {
            return index >= startIndex && index <= endIndex;
        });
    } 
    return sortedContent;
}

function pagingOptions (input, sortedContent, pageDetails) {
    const isSpecificPage = (input) => {
        return /^p[0-9]+$/i.test(input);
    };
    if (input === '+') { // next page
        if (sortedContent.length / 10 > 0 && pageDetails.currentPageIndex + 1 <= pageDetails.lastPageIndex) {
            pageDetails.currentPageIndex++; 
        } 
    } else if (input === '-') { // previous page
        if ((sortedContent.length / 10 > 0) && (pageDetails.currentPageIndex - 1) >= 0) {
            pageDetails.currentPageIndex--; 
        }
    } else if (input === '++') { // navigate to last page
        if (sortedContent.length / 10 > 0) {
            pageDetails.currentPageIndex = pageDetails.lastPageIndex;
        }
    } else if (input === '--') { // navigate to first page
        if (sortedContent.length / 10 > 0) {
            pageDetails.currentPageIndex = 0;
        }
    } else if (isSpecificPage(input)) { // navigate to specific page
        const pageNumIndex = Number(input.slice(1)) - 1;
        if ((sortedContent.length / 10 > 0) && pageNumIndex >= 0 && pageNumIndex <= pageDetails.lastPageIndex) {
            pageDetails.currentPageIndex = pageNumIndex;
        }
    } 
    return pageDetails;
}

function logSeriesProgress (manga) {
    const foundManga = findEntryAtLists(manga);
    if (!foundManga) {
        MESSAGE.print(MESSAGE.MANGA_NOT_FOUND);
    } else {
        console.log(`\n\n  Chapters read: ${foundManga.list_status.num_chapters_read} / ${foundManga.node.num_chapters}`);
    }
}

async function searchChapters (title, selectedManga) {
    const NEXTUNREADCHAPTER = 0, LOWESTCHAPTER = 1, HIGHESTCHAPTER = 2, SPECIFICCHAPTER = 3, CHAPTERTITLE = 4; 
    let input = 0; 

    // TODO: 
    // - if multiple chapters found, give user the option to pick a specific one
    //   e.g. could try something like if multiple chapters found, run traverseChapters
    //   with the array of found chapters etc...

    while (input !== 'e') 
    {
        printMenuOptions(
            `Search ${title}`,
            [
                ['Next un-read chapter'], 
                ['Lowest chapter'], 
                ['Highest chapter'], 
                ['Chapter number'], 
                ['Chapter title'], 
                '_'
            ]
        );

        input = await takeUserInput(true);
        
        if (input === NEXTUNREADCHAPTER) {
            await findNextUnreadChapter(selectedManga);
        } else if (input === LOWESTCHAPTER) {
            await findLowestChapterNumber(selectedManga);
        } else if (input === HIGHESTCHAPTER) {
            await findHighestChapterNumber(selectedManga);
        } else if (input === SPECIFICCHAPTER) {
            await findChapterByChapterNumber(selectedManga);
        } else if (input === CHAPTERTITLE) {
            await findChapterByChapterTitle(selectedManga);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function findNextUnreadChapter (selectedManga) {
    const {manga, chapters} = selectedManga;
    const mangaEntry = findEntryAtLists(manga);
    if (!mangaEntry) {
        MESSAGE.print(MESSAGE.MANGA_NOT_FOUND)
    } else {
        const nextUnreadChapterNumber = mangaEntry.list_status.num_chapters_read + 1; // num_chapters_read + 1
        const foundChapters = chapters.filter(chapter => parseInt(chapter.attributes.chapter) === nextUnreadChapterNumber); // trying to find chapter
        if (!foundChapters.length) {
            MESSAGE.print(MESSAGE.CHAPTER_NOT_FOUND);
        } else if (foundChapters.length === 1) { // open result
            await chapterOptionsMenu(foundChapters[0], manga);
        } else { // traverse results
            await traverseChapters(manga, foundChapters);
        }
    }
}

async function findLowestChapterNumber (selectedManga) {
    const { manga, chapters } = selectedManga;
    
    // finds the lowest chapter number across all chapters,
    // and returns all chapter objects that match that number

    const { chapters: foundChapters } = chapters
        .filter(ch => ch.attributes.chapter) // filter existing chapter numbers
        .reduce((acc, ch) => {
            const chNum = Number(ch.attributes.chapter); // chapter num
            if (chNum < acc.min) { 
                return { min: chNum, chapters: [ch] }; // overwrite acc
            } else if (chNum === acc.min) { 
                return { ...acc, chapters: [...acc.chapters, ch]}; // spread to acc  
            } 
            return acc; // keep acc as is
    }, { min: Infinity, chapters: []});

    if (!foundChapters.length) {
        MESSAGE.print(MESSAGE.CHAPTER_NOT_FOUND);
    } else if (foundChapters.length === 1) { // open result
        await chapterOptionsMenu(foundChapters[0], manga);
    } else { // traverse results
        await traverseChapters(manga, foundChapters);
    }
}

async function findHighestChapterNumber (selectedManga) {
    const { manga, chapters } = selectedManga;
    
    // finds the highest chapter number across all chapters,
    // and returns all chapter objects that match that number

    const { chapters: foundChapters } = chapters
        .filter(ch => ch.attributes.chapter) // filter existing chapter numbers
        .reduce((acc, ch) => {
            const chNum = Number(ch.attributes.chapter); // chapter num
            if (chNum > acc.max) { 
                return { max: chNum, chapters: [ch] }; // overwrite acc
            } else if (chNum === acc.max) { 
                return { ...acc, chapters: [...acc.chapters, ch]}; // spread to acc  
            } 
            return acc; // keep acc as is
    }, { max: 0, chapters: []});

    if (!foundChapters.length) { // no results
        MESSAGE.print(MESSAGE.CHAPTER_NOT_FOUND);
    } else if (foundChapters.length === 1) { // one result
        await chapterOptionsMenu(foundChapters[0], manga); // open result
    } else { // multiple results
        await traverseChapters(manga, foundChapters); // traverse results
    }
}

async function findChapterByChapterNumber (selectedManga) {
    const {manga, chapters} = selectedManga;
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Input a chapter number:'
        );

        input = await takeUserInput();
        
        if (input >= 0) {
            const foundChapters = chapters.filter(chapter => Number(chapter.attributes.chapter) === input); // trying to find given chapter number
            if (!foundChapters.length) {
                MESSAGE.print(MESSAGE.CHAPTER_NOT_FOUND);
            } else if (foundChapters.length === 1) { // open chapter
                await chapterOptionsMenu(foundChapters[0], manga);
            } else { // traverse chapters
                await traverseChapters(manga, foundChapters);
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function findChapterByChapterTitle (selectedManga) {
    const {manga, chapters} = selectedManga;
    let input = 0;

    while (input !== 'e') 
    {
        printMenuOptions(
            'Input a chapter title:'
        );

        input = await takeUserInput(false, true);

        if (typeof input === 'string' && input.length && input !== 'e') {
            const regex = new RegExp(`\\b${escapeRegex(input)}`, 'i'); // regex matches input at beginning of each word
            const matching = chapters.filter(chapter => regex.test(chapter.attributes.title)); // match title to input
            if (!matching.length) { // no matching results
                MESSAGE.print(MESSAGE.MATCHES_NOT_FOUND);
            } else if (matching.length === 1) { // open chapter
                await chapterOptionsMenu(matching[0], manga);
            } else { // traverse results
                await traverseChapters(manga, matching);
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function chapterOptionsMenu (selectedChapter, manga) {
    const OPENINBROWSER = 0, OPENATLISTS = 1, LOGDATA = 'l';
    const { volume, chapter } = selectedChapter.attributes;
    const formattedTitle = (({ attributes: { title: chapterTitle, translatedLanguage }}) => {
        const title         = chapterTitle?.trim() || Object.values(manga.attributes.title)[0]?.trim();
        const vlLabel       = volume  ? `Vol.${volume}` : '';
        const chLabel       = chapter ? `Ch.${chapter}` : '';
        const combined      = [vlLabel, chLabel].filter(Boolean);
        const progressLabel = combined.length ? `[${combined.join(' ')}]` : '';
        const transLang     = `(${translatedLanguage})`;
        return [title, progressLabel, transLang].filter(Boolean).join(' ');
    })(selectedChapter);
    // this works because the value of volume or chapter is either a null or a string (e.g. '0' or '10')
    const typeLabel = volume && !chapter ? 'volume' : 'chapter';
    let input = null;

    while (input !== 'e') 
    {
        printMenuOptions(
            formattedTitle,
            [
                [`Open ${typeLabel} in browser`], 
                ['Find manga at lists'], 
                '_',
                ['l', `Log ${typeLabel}`] 
            ]
        );
        
        input = await takeUserInput();

         if (input === OPENINBROWSER) {
            await openURLInBrowser(selectedChapter?.url, typeLabel);
        } else if (input === OPENATLISTS) {
            await openMangaAtLists(manga);
        } else if (input === LOGDATA) {
            await logDataDeepMenu(selectedChapter, formattedTitle, true);
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function findEntryAtLists (manga) {
    return lists[1] // manga list
           ?.flatMap(status => status) // combines all entries from all statuses to one arr
           .find(entry => entry.node.id === parseInt(manga.attributes.links?.mal)); // return first entry where id is the same
}

async function openMangaAtLists (manga) {
    const mangaEntry = findEntryAtLists(manga);
    if (!mangaEntry) return MESSAGE.print(MESSAGE.MANGA_NOT_FOUND);
    await updateEntryMenu(mangaEntry, lists, logAuthURL);
}

async function logDataDeepMenu (data, dataTitle, sortByKeysAlphabetical, forceSkipSorting) {
    let input = 0;

    if (!forceSkipSorting && sortByKeysAlphabetical) {
        data = sortObjectByKeysAlphabetical(data, 'asc'); // sort by keys a-z
    }

    while (input !== 'e') 
    {   
        let index = 0;
        console.log(`\n\n  ${capitalFirstLetterString(dataTitle)}\n`);
        if (!Object.keys(data).length) {
            console.log('  ? -> No keys to select');
        } else {
            for (const key in data) {
                console.log(`  ${index++} -> ${capitalFirstLetterString(key)}`);
            }
        }
        console.log('\n  e -> Go back');
        const highestSelectableIndex = index - 1;
        
        input = await takeUserInput(true);

        // 1. display selectable keys of data
        // 2. handle user input
        //    - if data[selected] is primitive type, log --> key: value
        //      -- in case of a long string, format string prior to logging
        //    - else if data[selected] is array of primitives, log --> key\n -value\n -value etc...
        //    - else data[selected] is array of object(s) / object of objects, call function again with data[selected]

        if (input >= 0 && input <= highestSelectableIndex) { 
            // data[input] is an object: 
            // -> key = key of data[input]
            // -> value = value of data[input]
            const key = Object.keys(data)[input], value = Object.values(data)[input]; 
            const dataTypeOfValue = getDataTypeOfValue(value);
            if (!dataTypeOfValue) { // unknown datatype of value
                console.log('\n\n  Data type of value couldn\'t be resolved')
            } else if (dataTypeOfValue === 'primitive' || dataTypeOfValue === 'null') { // key: value || key: null/undefined
                logObject(key, value); 
            } else if (dataTypeOfValue === 'arrayOfPrimitives') { // key: [data1, data2]
                logArrayOfPrimitives(key, value);
            } else if (dataTypeOfValue === 'object') { // key: { key1: value1, key2: value2 }
                await logDataDeepMenu(value, key, 'asc', forceSkipSorting);
            } else if (dataTypeOfValue === 'arrayOfObjects') { // key: [ {key1: value1}, {key2: value2} ]
                const isFlattenable = isFilledWithOneLengthObjects(value); 
                const object = isFlattenable ? flattenArrayOfObjects(value) : reformatArrayObjectsToObject(value, key);
                await logDataDeepMenu(object, key, isFlattenable, forceSkipSorting); // isFlattenable triggers alphabetical sorting if true
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function getDataTypeOfValue (value) {
    // 1. value is null
    // 2. value is primitive type 
    // 3. value is array of primitive(s)
    // 4. value is array of object(s)
    // 5. value is object
    if (value === null || value === undefined) {
        return 'null';
    } else if (typeof value !== 'object') {
        return 'primitive';
    } else if (Array.isArray(value) && typeof value[0] !== 'object') {
        return 'arrayOfPrimitives';
    } else if (Array.isArray(value) && typeof value[0] === 'object') {
        return 'arrayOfObjects';
    } else if (typeof value === 'object') {
        return 'object';
    } 
}

function logObject (key, value) {
    const maxLineLength = 75;
    if (typeof value === 'string' && value.length > maxLineLength) {
        const stringAsArr = longStringToArray(value, maxLineLength);
        console.log(`\n\n  ${capitalFirstLetterString(key)}:\n`);
        stringAsArr.forEach(line => console.log(`  ${line}`));
    } else {
        const formattedKey = capitalFirstLetterString(key);
        const formatValue = (val) => !val && typeof val !== 'number' && typeof val !== 'boolean' ? 'N/A' : val;
        const formattedValue = isISODate(value) ? formatDate(value) : formatValue(value);
        console.log(`\n\n  ${formattedKey}: ${formattedValue}`);
    }
}

function logArrayOfPrimitives (title, array) {
    console.log(`\n\n  ${capitalFirstLetterString(title)}:\n`);
    array.forEach((value, index) => {
        if (index < array.length - 1) console.log(`  - ${value}`);
        else console.log(`  - ${value}\n`);
    });
    if (!array.length) console.log('  - Nothing was found');
}

function countKeyValuePairs (array) {
    let count = 0;
    for (const element of array) {
        for (const key in element) {
            count++;
        }
    }
    return count;
}

function flattenArrayOfObjects (array) {
    // flattens array of objects to a single object holding key-value pairs
    let flatObject = {}; // holds flattened object
    let keyCount = {}; // counts how many keys by name key encountered e.g. 'en': 2 <-- two keys by name 'en' encountered
    for (const obj of array) { // refers to e.g. '{ 'en': 'frieren' }'
        for (const key in obj) { // e.g. 'en'
            if (!flatObject[key]) { // key doesn't yet exist
                keyCount[key] = 1; // start counting key
                flatObject[key] = obj[key];
            } else { // key exists
                const formattedKey = `${key}_${keyCount[key]++}`; // format key && increment keyCount[key]
                flatObject[formattedKey] = obj[key]; // add data to formatted key
            }
        }
    }
    return flatObject;
}

function reformatArrayObjectsToObject (array, keyOfArray) {
    // formats array of objects to single object and names the keys
    // of each object it holds into keyOfArray_index e.g. tags -> tag_0, tag_1 etc...
    let newObject = {};
    for (const key in array) {
        const formattedKey = `${keyOfArray.slice(0, -1)}_${key}`; // format name of key by upper key
        newObject[formattedKey] = array[key]; // create newObject.formattedKey to hold value of array[obj]
    }
    return newObject;
}

function isFilledWithIndexedKeys (object) {
    // text <-- length text
    // _ <-- one underscore 
    // y <-- number
    for (const key in object) {
        const test = /[a-z]+_{1}[0-9]+/i.test(key); // test for each, return false right away if false otherwise return true at the end 
        if (!test) return false;
    }
    return true;
}

function isFilledWithOneLengthObjects (array) {
    for (const obj of array) { // obj
        if (Object.keys(obj).length > 1) return false; // more then one key value pair
    }
    return true; // every obj of length zero or one
}

function sortObjectByKeysAlphabetical (object, direction) {
    // re-arrange given object by the names of the objects keys
    // object can either be arranged in a-z or z-a order based on direction
    if (!direction || direction === 'asc') { // sort keys a-z
        object = Object.fromEntries( // format back to obj
            Object.entries(object).sort((a, b) => a[0].localeCompare(b[0])) // format obj to arr and sort by keys a-z
        ); 
    } else { // sort keys z-a
        object = Object.fromEntries( // re-arrange by keys
            Object.entries(object).sort((a, b) => b[0].localeCompare(a[0])) // format obj to arr and sort by keys z-a
        );
    }
    return object;
}

export { menuLogMangadex, logDataDeepMenu, updatePageDetails, pageContent, pagingOptions };