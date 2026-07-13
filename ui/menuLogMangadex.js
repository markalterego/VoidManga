import { takeUserInput, printMenuOptions, isValidLangCode, escapeRegex,
         openURLInBrowser, isISODate, formatDate, isMatchingAtStart } from '../helpers/functions.js';
import { MESSAGE, SYM, logOrderTypes, COMMANDS } from '../helpers/export.js';
const { mangaOrderTypes, chapterOrderTypes, historyOrderTypes } = logOrderTypes;
const { PAGE } = COMMANDS;
const { LOG }  = COMMANDS.MDX;
const { SORT, MANGA, CHAPTER } = LOG;
import { updateEntryMenu } from './menuMAL.js';
import cliTruncate from 'cli-truncate';
import stringWidth from 'string-width';
import { filehandle } from '../filehandling/filehandle.js';
import { existsSync } from 'fs';
import { logDataDeepMenu } from './menuLogDataDeep.js';
import { fetchWithOptions } from '../controller/controllerMangadex.js';
import { updatePageDetails, pageContent, pagingOptions, isPagingInput } from '../helpers/pageHelpers.js';

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
let fetchMangadexOptions = null; // config.fetchMangadexOptions

async function menuLogMangadex (m, l, config, mfh) {
    const TRAVERSEMANGAS = 0;
    const SEARCHMANGAS = 1;
    const TRAVERSE_HISTORY = 2;
    let input = null;

    mangadexData = m; 
    logAuthURL = config.menuMALOptions.logAuthURL;
    options = config.logMangadexOptions;
    fetchMangadexOptions = config.fetchMangadexOptions;
    lists = l;
    mangadexFetchHistory = mfh;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Log MangaDex',
            [
                ['Traverse mangas'],
                ['Search mangas'],
                ['Traverse history'],
                '_',
                [LOG.UPDATE_CHAPTERS, `Update chapters for all mangas (${mangadexData.length})`]
            ]
        );

        input = await takeUserInput(true);

        if (input === TRAVERSEMANGAS) {
            await traverseMangas();
        } else if (input === SEARCHMANGAS) {
            await searchMangas();
        } else if (input === TRAVERSE_HISTORY) {
            await traverseHistory();
        } else if (input === LOG.UPDATE_CHAPTERS) {
            await fetchWithOptions({ 
                l: lists,
                md: mangadexData, 
                mfh: mangadexFetchHistory, 
                sm: mangadexData, 
                o: fetchMangadexOptions
            });
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseMangas (traversable = null, skipToTraverseChapters = false) {
    const quickSearch = { 
        justUpdated: false, 
        searchString: null, 
        getAndResetJustUpdated () {
            const val = this.justUpdated;
            this.justUpdated = false;
            return val;
        },
        updateSearchString (str) { 
            this.justUpdated = true; 
            this.searchString = str;
        }
    };
    let input = null;
    let pageDetails = { currentPageIndex: 0, lastPageIndex: 0 };
    let sortedMangas;

    const parseSearchString = (str) => typeof str === 'string' && str.startsWith('\\s ') && str.slice(3).trim() || null;
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

    while (input !== COMMANDS.EXIT) 
    {
        const sortingOptions = [null, ...Object.values(LOG.MANGA), ...Object.values(LOG.SORT)];
        const shouldSort = sortingOptions.some(o => o === input) || quickSearch.getAndResetJustUpdated();
        sortedMangas = shouldSort ? sortMangas(traversable ?? mangadexData, { searchString: quickSearch.searchString }) : sortedMangas; 
        pageDetails = options.enablePagingManga ? updatePageDetails(pageDetails, sortedMangas) : pageDetails;
        let pagedMangas = pageContent(sortedMangas, pageDetails.currentPageIndex, options.enablePagingManga); 

        // formatting printMenuOptions parameters
        const header = `Select manga ${quickSearch.searchString ? `[search: ${quickSearch.searchString}] (${COMMANDS.CLEAR} ${SYM.POINTS_TO} clear)` : ''}`; 
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
            [MANGA.TOGGLE_FILTER_MANGALIST, `Filter by mangalist [${options.filterByMangasFoundAtMangalist ? 'x' : ''}]`],
            [MANGA.TOGGLE_HIDE_NO_CHAPTERS, `Hide manga with no chapters [${options.hideZeroLengthManga ? 'x' : ''}]`],
            [SORT.SORT_DIRECTION,           `Sort ${mangaOrderTypes[options.mangaOrderType][(options.logMangaDirection === 'asc' ? 'desc' : 'asc')]}`],
            [SORT.ORDER_TYPE,               `Order by ${nextOrderType({ orderType: options.mangaOrderType, orderTypes: mangaOrderTypes })}`],
            [PAGE.TOGGLE,                   `Toggle paging [${options.enablePagingManga ? 'x' : ''}]`],
            ...(options.enablePagingManga ? [[PAGE.NEXT, 'Next page'], [PAGE.PREVIOUS, 'Previous page']] : [null])
        ];

        // calling printMenuOptions
        printMenuOptions(
            header, 
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true);
        
        if (input >= 0 && input < pagedMangas.length) {
            skipToTraverseChapters ? await traverseChapters(pagedMangas[input]) : await mangaOptionsMenu(pagedMangas[input]);
        } else if (input === MANGA.TOGGLE_FILTER_MANGALIST) { 
            options.filterByMangasFoundAtMangalist = !options.filterByMangasFoundAtMangalist;
        } else if (input === MANGA.TOGGLE_HIDE_NO_CHAPTERS) { 
            options.hideZeroLengthManga = !options.hideZeroLengthManga;
        } else if (input === SORT.SORT_DIRECTION) { 
            options.logMangaDirection = options.logMangaDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === SORT.ORDER_TYPE) {
            options.mangaOrderType = nextOrderType({ orderType: options.mangaOrderType, orderTypes: mangaOrderTypes });
        } else if (input === PAGE.TOGGLE) { 
            options.enablePagingManga = !options.enablePagingManga;
        } else if (options.enablePagingManga && isPagingInput(input)) { 
            pageDetails = pagingOptions(input, sortedMangas, pageDetails);
        } else if (parseSearchString(input) || input === COMMANDS.CLEAR) { // quick search/clear quick search
            quickSearch.updateSearchString(parseSearchString(input));
        } else if (input !== COMMANDS.EXIT) { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }    
}

function sortMangas (data, { searchString = null } = {}) {
    const { filterByMangasFoundAtMangalist, hideZeroLengthManga, mangaOrderType,
            logMangaDirection } = options;
    let sortedMangas = [...data];
    // filter by searchString
    if (searchString) {
        sortedMangas = sortedMangas.filter(obj => isMatchingAtStart(searchString, Object.values(obj.manga.attributes.title)[0]));
    }
    // filter by mangas found at user's mangalist
    if (filterByMangasFoundAtMangalist) {
        sortedMangas = sortedMangas.filter(obj => findEntryAtLists(obj.manga));
    }
    // filter mangas with no chapters
    if (hideZeroLengthManga) { 
        sortedMangas = sortedMangas.filter(obj => obj.chapters.length > 0);    
    } 
    // sorting mangas
    if (mangaOrderType === 'chapters') {
        return logMangaDirection === 'asc'
            ? sortedMangas.sort((a, b) => a.chapters.length - b.chapters.length)  // 0 - 9999
            : sortedMangas.sort((a, b) => b.chapters.length - a.chapters.length); // 9999 - 0
    } else if (mangaOrderType === 'title') {
        const mangaTitle = (obj) => Object.values(obj.manga.attributes.title)[0];
        return logMangaDirection === 'asc' 
            ? sortedMangas.sort((a, b) => mangaTitle(a).localeCompare(mangaTitle(b)))  // a - z
            : sortedMangas.sort((a, b) => mangaTitle(b).localeCompare(mangaTitle(a))); // z - a
    } 
}

async function searchMangas() {
    const MANGATITLE = 0;
    let input = null;

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
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
        await traverseMangas(filteredFoundMangas);
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

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Input a manga title:'
        );

        input = await takeUserInput(false, true);

        if (typeof input === 'string' && input.length && input !== COMMANDS.EXIT) {
            const matching = mangadexData.filter(({manga: {attributes: {title}}}) => isMatchingAtStart(input, Object.values(title)[0])); // match title to input
            if (!matching.length) { // no matching results
                MESSAGE.print(MESSAGE.MATCHES_NOT_FOUND);
            } else if (matching.length === 1) { // open manga
                await mangaOptionsMenu(matching[0]);
            } else { // traverse results
                await traverseMangas(matching);
            }
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function mangaOptionsMenu (selectedManga) {
    const OPENINBROWSER = 0;
    const TRAVERSECHAPTERS = 1;
    const FINDCHAPTEROFMANGA = 2;
    let input = null;

    while (input !== COMMANDS.EXIT) 
    {
        const title = Object.values(selectedManga.manga.attributes.title)[0]; // first title of titles
        
        printMenuOptions(
            `Select an option for ${title}`,
            [
                ['Open manga in browser'],
                ['Traverse chapters'], 
                ['Search for chapter'],
                '_',
                [COMMANDS.LOG, 'Log manga data'],
                [LOG.UPDATE_CHAPTERS, 'Update chapters']
            ]
        );

        input = await takeUserInput(true);

        if (input === OPENINBROWSER) {
            await openURLInBrowser(selectedManga.manga?.url, title);
        } else if (input === TRAVERSECHAPTERS) { 
            await traverseChapters(selectedManga); 
        } else if (input === FINDCHAPTEROFMANGA) { 
            await searchChapters(title, selectedManga);
        } else if (input === COMMANDS.LOG) {
            await logDataDeepMenu(selectedManga.manga, title, true);
        } else if (input === LOG.UPDATE_CHAPTERS) { 
            // sm sourced from mangadexData (not selectedManga) to prevent fetching 
            // data based on stale chapters stored in traverseHistory
            await fetchWithOptions({ 
                l: lists,
                md: mangadexData, 
                mfh: mangadexFetchHistory, 
                sm: [mangadexData.find(({ manga }) => manga.id === selectedManga.manga.id)], 
                o: fetchMangadexOptions
            });
        } else if (input !== COMMANDS.EXIT) { 
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseHistory() {
    let input = null; 
    let pageDetails = { currentPageIndex: 0, lastPageIndex: 0 };
    let sortedHistory;
    let pagedHistory;
    
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

    while (input !== COMMANDS.EXIT) 
    {
        const shouldSort = [null, SORT.SORT_DIRECTION, SORT.ORDER_TYPE].some(o => o === input) || (input >= 0 && input < pagedHistory.length);
        sortedHistory = shouldSort ? sortHistory() : sortedHistory;
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
            [SORT.SORT_DIRECTION, `Sort ${historyOrderTypes[options.historyOrderType][(options.logHistoryDirection === 'asc' ? 'desc' : 'asc')]}`],
            [SORT.ORDER_TYPE,     `Order by ${nextOrderType({ orderType: options.historyOrderType, orderTypes: historyOrderTypes })}`],
            [PAGE.TOGGLE,         `Toggle paging [${options.enablePagingHistory ? 'x' : ''}]`],
            ...(options.enablePagingHistory ? [[PAGE.NEXT, 'Next page'], [PAGE.PREVIOUS, 'Previous page']] : [null])
        ];

        printMenuOptions(
            'Select fetch',
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true);

        if (input >= 0 && input < pagedHistory.length) {
            await historyOptionsMenu(pagedHistory[input]);
        } else if (input === SORT.SORT_DIRECTION) { // sort direction
            options.logHistoryDirection = options.logHistoryDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === SORT.ORDER_TYPE) { // order type
            options.historyOrderType = nextOrderType({ orderType: options.historyOrderType, orderTypes: historyOrderTypes });
        } else if (input === PAGE.TOGGLE) {
            options.enablePagingHistory = !options.enablePagingHistory;
        } else if (options.enablePagingHistory && isPagingInput(input)) {
            pageDetails = pagingOptions(input, sortedHistory, pageDetails);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function sortHistory() {
    const { historyOrderType, logHistoryDirection } = options;
    let history = mangadexFetchHistory;

    if (historyOrderType === 'time') {
        return logHistoryDirection === 'asc' 
            ? history.sort((a, b) => a.details.fetchedAt - b.details.fetchedAt)
            : history.sort((a, b) => b.details.fetchedAt - a.details.fetchedAt);
    } else if (historyOrderType === 'mangas') {
        return logHistoryDirection === 'asc' 
            ? history.sort((a, b) => countFetchedMangas(Object.values(a)) - countFetchedMangas(Object.values(b)))
            : history.sort((a, b) => countFetchedMangas(Object.values(b)) - countFetchedMangas(Object.values(a)));
    } else if (historyOrderType === 'chapters') {
        return logHistoryDirection === 'asc' 
            ? history.sort((a, b) => countFetchedChapters(Object.values(a)) - countFetchedChapters(Object.values(b)))
            : history.sort((a, b) => countFetchedChapters(Object.values(b)) - countFetchedChapters(Object.values(a)));
    }
}

function nextOrderType ({ orderType = null, orderTypes = null } = {}) {
    // e.g. orderType  = 'time'
    //      orderTypes = historyOrderTypes (from export.js)
    if (orderType && orderTypes) {
        const keys = Object.keys(orderTypes);
        const index = keys.findIndex(key => key === orderType);
        const nextIndex = index + 1;
        return nextIndex < keys.length ? keys[nextIndex] : keys[0];
    }
}

function countFetchedMangas (values) {
    return values.reduce((acc, info) => info.status ? acc + 1 : acc, 0);
}

function countFetchedChapters (values) {
    return values.reduce((acc, info) => info.updatedCount ? acc + info.updatedCount : acc, 0);
}

async function historyOptionsMenu (selectedFetch) {    
    const ALL = 0;
    const NEW = 1;
    const UPDATED = 2;
    const UPTODATE = 3;
    const { details } = selectedFetch;
    const { newMangas, updatedMangas, uptodateMangas } = details;
    const formattedDate = formatDate(details.fetchedAt);
    const header = `Fetch (${formattedDate})`;
    let input = null;

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function traverseChapters (selectedManga, chapterArr) {
    const chapters = chapterArr ?? selectedManga.chapters;
    const manga = chapterArr ? selectedManga : selectedManga.manga;
    let input = null;
    let pageDetails = { currentPageIndex: 0, lastPageIndex: 0 };
    let sortedChapters;
    let pagedChapters;

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
        const { num_chapters_read, num_volumes_read } = foundManga?.list_status ?? {};
        const unreadFlag = (!chapter || num_chapters_read < parseInt(chapter)) && (!volume || num_volumes_read < parseInt(volume)) ? '{( Unread! )}' : '';
        return [indexWithPadding, separatorWithPadding, `${progressLabelWithPadding}${truncatedTitleWithPadding}${transLangWithPadding}${unreadFlag}`];
    };

    while (input !== COMMANDS.EXIT) 
    {
        const foundManga = findEntryAtLists(manga);
        const sortingOptions = [null, ...Object.values(LOG.CHAPTER), ...Object.values(LOG.SORT)];
        const shouldSort = sortingOptions.some(o => o === input) || isValidLangCode(input) || (input >= 0 && input <= pagedChapters.length && options.hideReadChapters);
        sortedChapters = shouldSort ? sortChapters(chapters, foundManga) : sortedChapters;
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
            [CHAPTER.HIDE_READ_CHAPTERS, `Hide read chapters/volumes [${options.hideReadChapters ? 'x' : ''}]`],
            ['?',                        `Input lang-code [${options.filterChapterLanguages.length ? options.filterChapterLanguages : 'no filters'}] (${CHAPTER.CLEAR_LANG_CODES} to clear)`],
            [SORT.SORT_DIRECTION,        `Sort ${chapterOrderTypes[options.chapterOrderType][options.logChapterDirection === 'asc' ? 'desc' : 'asc']}`],
            [SORT.ORDER_TYPE,            `Order by ${nextOrderType({ orderType: options.chapterOrderType, orderTypes: chapterOrderTypes })}`],
            [PAGE.TOGGLE,                `Toggle paging [${options.enablePagingChapter ? 'x' : ''}]`],
            ...(options.enablePagingChapter ? [[PAGE.NEXT, 'Next page'], [PAGE.PREVIOUS, 'Previous page']] : [null])
        ];

        printMenuOptions(
            'Select chapter',
            optionsArray,
            { pageDetails }
        );

        input = await takeUserInput(true); 

        if (input >= 0 && input < pagedChapters.length) { 
            await chapterOptionsMenu(pagedChapters[input], manga);
        } else if (input === CHAPTER.HIDE_READ_CHAPTERS) { // toggle hide read chapters
            options.hideReadChapters = !options.hideReadChapters;
        } else if (input === CHAPTER.CLEAR_LANG_CODES) { // clear lang-codes
            options.filterChapterLanguages = [];
        } else if (isValidLangCode(input)) { // add lang-code
            options.filterChapterLanguages.push(input); 
            options.filterChapterLanguages = [...new Set(options.filterChapterLanguages)]; // clear duplicates
        } else if (input === SORT.SORT_DIRECTION) { // toggle sort direction
            options.logChapterDirection = options.logChapterDirection === 'asc' ? 'desc' : 'asc';
        } else if (input === SORT.ORDER_TYPE) { // order type
            options.chapterOrderType = nextOrderType({ orderType: options.chapterOrderType, orderTypes: chapterOrderTypes });
        } else if (input === PAGE.TOGGLE) { 
            options.enablePagingChapter = !options.enablePagingChapter;
        } else if (options.enablePagingChapter && isPagingInput(input)) { 
            pageDetails = pagingOptions(input, sortedChapters, pageDetails);
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function sortChapters (chapters, foundManga) {
    const { hideReadChapters, filterChapterLanguages, 
            logChapterDirection: logDirection, 
            chapterOrderType: orderType } = options;
    const { num_chapters_read, num_volumes_read } = foundManga.list_status;  
    let sortedChapters = Object.values(chapters); // chapters
    // hide read chapters
    if (hideReadChapters && foundManga) { // don't hide if foundManga undefined
        sortedChapters = sortedChapters.filter(({ attributes: { chapter, volume }}) => 
            (!chapter || parseInt(chapter) > num_chapters_read) && (!volume || parseInt(volume) > num_volumes_read)
        ); 
    } 
    // filter by translated language 
    if (filterChapterLanguages.length) { 
        sortedChapters = sortedChapters.filter(chapter => filterChapterLanguages.includes(chapter.attributes.translatedLanguage));
    }
    // sorting chapters
    if (orderType === 'title') { 
        const chapterTitle = (obj) => obj.attributes.title?.trim();
        
        const validTitles = sortedChapters.filter((obj) => chapterTitle(obj));

        // { en: [c, ...], es: [c, ...] }
        const titlesByLocale = validTitles.reduce((acc, chapter) => {
            const transLang = chapter.attributes.translatedLanguage;
            return acc[transLang]
                ? { ...acc, [transLang]: [...acc[transLang], chapter] }
                : { ...acc, [transLang]: [chapter] };
        }, {});

        // sort within each locale group, then flatten
        const sortedTitles = Object.entries(titlesByLocale)
            .flatMap(([transLang, chapters]) => 
                chapters.sort((a, b) => 
                    logDirection === 'asc' 
                        ? chapterTitle(a).localeCompare(chapterTitle(b), transLang)
                        : chapterTitle(b).localeCompare(chapterTitle(a), transLang)
                )
            );
        
        // unsortable titles ( null, '' )
        const invalidTitles = sortedChapters.filter((obj) => !chapterTitle(obj));

        return [
            ...sortedTitles,
            ...invalidTitles
        ];
    } else if (orderType === 'chapter') {
        const getVolume = (obj) => obj.attributes.volume;
        const getChapter = (obj) => obj.attributes.chapter;

        const chapterOnly = sortedChapters.filter(obj => !getVolume(obj) && getChapter(obj));
        const volumeOnly = sortedChapters.filter(obj => getVolume(obj) && !getChapter(obj));
        const volumeChapter = sortedChapters.filter(obj => getVolume(obj) && getChapter(obj));
        const noVolumeOrChapter = sortedChapters.filter(obj => !getVolume(obj) && !getChapter(obj));

        return [
            ...volumeOnly.sort((a, b) => // sort volume
                logDirection === 'asc' ? getVolume(a) - getVolume(b) : getVolume(b) - getVolume(a)
            ),
            ...volumeChapter.sort((a, b) => // sort volume first then chapter
                getVolume(a) !== getVolume(b) 
                    ? (logDirection === 'asc' ? getVolume(a) - getVolume(b) : getVolume(b) - getVolume(a))
                    : (logDirection === 'asc' ? getChapter(a) - getChapter(b) : getChapter(b) - getChapter(a))
            ), 
            ...chapterOnly.sort((a, b) => // sort chapter
                logDirection === 'asc' ? getChapter(a) - getChapter(b) : getChapter(b) - getChapter(a)
            ),
            ...noVolumeOrChapter
        ]; 
    }   
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
    const NEXTUNREADCHAPTER = 0;
    const LOWESTCHAPTER = 1;
    const HIGHESTCHAPTER = 2;
    const SPECIFICCHAPTER = 3;
    const CHAPTERTITLE = 4; 
    let input = 0; 

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
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

    while (input !== COMMANDS.EXIT) 
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
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function findChapterByChapterTitle (selectedManga) {
    const {manga, chapters} = selectedManga;
    let input = 0;

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            'Input a chapter title:'
        );

        input = await takeUserInput(false, true);

        if (typeof input === 'string' && input.length && input !== COMMANDS.EXIT) {
            const matching = chapters.filter(chapter => isMatchingAtStart(input, chapter.attributes.title)); // match title to input
            if (!matching.length) { // no matching results
                MESSAGE.print(MESSAGE.MATCHES_NOT_FOUND);
            } else if (matching.length === 1) { // open chapter
                await chapterOptionsMenu(matching[0], manga);
            } else { // traverse results
                await traverseChapters(manga, matching);
            }
        } else if (input !== COMMANDS.EXIT) {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

async function chapterOptionsMenu (selectedChapter, manga) {
    const OPENINBROWSER = 0;
    const OPENATLISTS = 1;
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

    while (input !== COMMANDS.EXIT) 
    {
        printMenuOptions(
            formattedTitle,
            [
                [`Open ${typeLabel} in browser`], 
                ['Find manga at lists'], 
                '_',
                [COMMANDS.LOG, `Log ${typeLabel}`] 
            ]
        );
        
        input = await takeUserInput(true);

         if (input === OPENINBROWSER) {
            await openURLInBrowser(selectedChapter?.url, typeLabel);
        } else if (input === OPENATLISTS) {
            await openMangaAtLists(manga);
        } else if (input === COMMANDS.LOG) {
            await logDataDeepMenu(selectedChapter, formattedTitle, true);
        } else if (input !== COMMANDS.EXIT) {
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

export { menuLogMangadex, updatePageDetails, pageContent, pagingOptions, nextOrderType };