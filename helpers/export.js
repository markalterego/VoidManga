import { ANIME, MANGA, animeStatus, mangaStatus } from './entryHelpers.js';
export const SYM = {
    UPTODATE:      '\u2022', // •
    UPDATED:       '\u2191', // ↑
    NEW:           '\u002B', // +
    INCLUDE:       '\u002B', // sab (same as before)
    EXCLUDE:       '\u002D', // -
    BORDER_H:      '\u2500', // ─
    POINTS_TO:     '\u2192', // →
    TOGGLE:        '\u00B1', // ±
    CHANGE_PAGE:   '\u00B1', // sab
    ADJUST:        '\u00B1', // sab
    PADFILLER:     '\u28A4', // ⢤
};
export const COMMANDS = {
    MAIN: {
        SETTINGS: 's',
    },
    MDX: {
        FETCH: {
            TOGGLE_QUEUE_TYPE:         's',
            TOGGLE_FETCH_ALL_CHAPTERS: 'f',
            TOGGLE_ORDER_DIRECTION:    't',
            SEARCH_MANGAS:             's',
            INCLUDE_MANGAS_MANGALIST:  'i',
            INCLUDE_MANGAS_MDXDATA:    'd',
        },
        LOG: {
            SORT: {
                ORDER_TYPE:     'o',
                SORT_DIRECTION: 's',
            },
            MANGA: {
                TOGGLE_FILTER_MANGALIST: 'f',
                TOGGLE_HIDE_NO_CHAPTERS: 'h',
            },
            CHAPTER: {
                HIDE_READ_CHAPTERS: 'h',
                CLEAR_LANG_CODES:   'l',
            },
            UPDATE_CHAPTERS: 'u',
        },
    },
    MAL: {
        FETCH_USER_LISTS:  'f',
        ENTRY_ADD:         'a',
        ENTRY_DELETE:      'd',
        PROGRESS_INCREASE: '+',
        PROGRESS_DECREASE: '-',
        PROGRESS_MAX:      '++',
        PROGRESS_MIN:      '--',
    },
    PAGE: {
        TOGGLE:   't',
        PREVIOUS: ',',
        NEXT:     '.',
        FIRST:    ',,',
        LAST:     '..'
    },
    RESET_DEFAULT_OPTIONS: 'r',
    INCLUDE_ALL:           '+',
    EXCLUDE_ALL:           'c',
    LOG:                   'l',
    CLEAR:                 'c',
    EXIT:                  'e',
};
export const MESSAGE = {
    INVALID_INPUT:     'Please input a valid option',
    MANGA_NOT_FOUND:   'Manga not found',
    CHAPTER_NOT_FOUND: 'Chapter not found',
    VOLUME_NOT_FOUND:  'Volume not found',
    MATCHES_NOT_FOUND: 'No matches found',
    URL_NOT_FOUND:     'URL not found',
    RESET_OPTIONS:     'Options reset to default',
    LISTS_NOT_FOUND:   'MAL lists not found',
    INVALID_KEY:       'The received key is not valid',
    INVALID_VALUE:     'Given value is not valid',
    CONFIG_NOT_OBJECT: 'Given Config is not an object',
    print (message) {
        console.log(`\n\n  ${message}`);
    },
    printFlipMessage (boolean, type, status) {
        const flippedTo    = boolean ? 'Included' : 'Excluded';
        const whereFlipped = type === undefined ? null : Number.isFinite(status) ? (type === ANIME ? animeStatus[status] : mangaStatus[status]) : (type === ANIME ? 'anime' : 'manga');
        const flippedAt    = !whereFlipped ? 'titles' : `${whereFlipped} titles`; 
        console.log(`\n\n  ${flippedTo} all ${flippedAt}`);
    }
};
// mangaOrderTypes: 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
export const mangaOrderTypes = {
    title: {
        asc: 'a to z',
        desc: 'z to a'
    },
    year: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    createdAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    updatedAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    latestUploadedChapter: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    followedCount: {
        asc: 'least to most',
        desc: 'most to least'
    },
    relevance: {
        asc: 'least to most',
        desc: 'most to least'
    }
};
// chapterOrderTypes: 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
export const chapterOrderTypes = {
    createdAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    }, 
    updatedAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    publishAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    readableAt: {
        asc: 'oldest to newest',
        desc: 'newest to oldest'
    },
    volume: {
        asc: 'lowest to highest',
        desc: 'highest to lowest'
    },
    chapter: {
        asc: 'lowest to highest',
        desc: 'highest to lowest'
    }
};
export const contentRatings             = ['safe', 'suggestive', 'erotica', 'pornographic'];
export const chapterTranslatedLanguages = ['en', 'es', 'pt-br', 'fr', 'de']; 
export const expectedFilters            = ['includeInMangadexFetch']; // expected function parameter values at filterEntriesFromFetch
export const logOrderTypes = {
    mangaOrderTypes: {
        title: {
            asc: 'a to z',
            desc: 'z to a'
        },
        chapters: {
            asc: 'least to most',
            desc: 'most to least'
        }
    },
    chapterOrderTypes: {
        title: {
            asc: 'a to z',
            desc: 'z to a'
        },
        chapter: {
            asc: 'lowest to highest',
            desc: 'highest to lowest'
        }
    },
    historyOrderTypes: {
        time: {
            asc: 'oldest to newest',
            desc: 'newest to oldest'
        },
        mangas: {
            asc: 'least to most',
            desc: 'most to least'
        }, 
        chapters: {
            asc: 'least to most',
            desc: 'most to least'
        }
    }
};
export const DEFAULT_MAL_ENTRY_FRAMEWORK_ANIME = {
    list_status: {
        status: 'watching',        // refer to animeStatus
        score: 0,                  // number  (0 - 10)
        num_episodes_watched: 0,   // number  (0 - ???) 
        start_date: '0000-00-00',  // string  ('yyyy-mm-dd')
        finish_date: '0000-00-00', // string  ('yyyy-mm-dd')
        comments: '',              // string
        priority: 0,               // number  (0 - ???)
        is_rewatching: false,      // boolean (true, false
        num_times_rewatched: 0,    // number  (0 - ???) 
        rewatch_value: 0,          // number  (0 - [maybe 10])
        tags: []                   // array of strings        
    },
    includeInMangadexFetch: false  // boolean (true, false)
};
export const DEFAULT_MAL_ENTRY_FRAMEWORK_MANGA = {
    list_status: {
        status: 'reading',         // refer to mangaStatus
        score: 0,                  // number  (0 - 10)
        num_volumes_read: 0,       // number  (0 - ???) 
        num_chapters_read: 0,      // number  (0 - ???) 
        start_date: '0000-00-00',  // string  ('yyyy-mm-dd')
        finish_date: '0000-00-00', // string  ('yyyy-mm-dd')
        comments: '',              // string
        priority: 0,               // number  (0 - ???)
        is_rereading: false,       // boolean (true, false)
        num_times_reread: 0,       // number  (0 - ???)      
        reread_value: 0,           // number  (0 - [maybe 10])     
        tags: []                   // array of strings         
    },
    includeInMangadexFetch: false  // boolean (true, false)
};
export const DEFAULT_fetchMangadexOptions = { 
    limit_manga: 10,                // default: 10, min: 0, max is 100
    limit_chapter: 10,              // default: 10, min: 0, max is 100 
    offset_chapter: 0,              // default: 0, min: 0, max is ???
    mangaOrderType: 'relevance',    // 'title', 'year', 'createdAt', 'updatedAt', 'latestUploadedChapter', 'followedCount', 'relevance'
    chapterOrderType: 'chapter',    // 'createdAt', 'updatedAt', 'publishAt', 'readableAt', 'volume', 'chapter'
    mangaOrderDirection: 'desc',    // 'asc', 'desc'
    chapterOrderDirection: 'desc',  // 'asc', 'desc'
    contentRating: [],              // ['safe','etc...'], undefined for default behavior
    chapterTranslatedLanguage: [],  // ['en','es','etc...'], undefined for all languages
    fetchMangasByMALTitles: false,  // true, false
    mangaSearchStrings: [],         // used for search when !fetchMangasByMALTitles
    fetchAllChapters: false         // when enabled, fetches all chapters corresponding to other options
};
export const DEFAULT_logMangadexOptions = {
    // traverseMangas
    filterByMangasFoundAtMangalist: false, // true, false
    hideZeroLengthManga: false,            // true, false
    logMangaDirection: 'asc',              // 'asc', 'desc'
    mangaOrderType: 'chapters',            // 'chapters', 'title'
    enablePagingManga: true,               // true, false
    
    // traverseChapters
    hideReadChapters: false,     // true, false
    filterChapterLanguages: [],  // true, false
    logChapterDirection: 'asc',  // 'asc', 'desc'
    chapterOrderType: 'chapter', // 'chapter', 'title'
    enablePagingChapter: true,   // true, false
    
    // traverseHistory
    logHistoryDirection: 'asc', // 'asc', 'desc'
    historyOrderType: 'time',   // 'time', 'mangas', 'chapters'
    enablePagingHistory: true   // true, false
};
export const DEFAULT_menuMALOptions = {
    fetchMALOnMenuOpen: true,  // true, false
    enablePagingEntries: true, // true, false
    logAuthURL: false          // true, false
};
export const DEFAULT_fetchMALOptions = {
    searchType: 'both', // 'both' or 'anime' or 'manga'
    limit: 10,          // default: 100, min: 0, max: 100 
    searchStrings: []   // strings to use in anime and manga search
};
export const DEFAULT_menuFetchFiltersOptions = {
    enablePagingEntries: true // true, false 
};