import axios from 'axios';
import { setTimeout } from "timers/promises";
import { withRetry, rateLimitedFetch } from './fetchUtils.js';

async function fetchAnimeList() {
    const url = `https://api.myanimelist.net/v2/users/@me/animelist`;
    const params = {
        fields: 'list_status{comments,priority,num_times_rewatched,rewatch_value,tags},num_episodes,alternative_titles',
        limit: 1000, // max value
        nsfw: true // allows a more accurate response
    };
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
    };

    // fetch animelist
    const malResponseAnime = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.get(url, { params, headers })
        )
    );

    return malResponseAnime.data.data;
}

async function fetchMangaList() {
    const url = `https://api.myanimelist.net/v2/users/@me/mangalist`;
    const params = {
        fields: 'list_status{comments,priority,num_times_reread,reread_value,tags},num_chapters,num_volumes,alternative_titles',
        limit: 1000, // max value
        nsfw: true // allows a more accurate response
    };
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
    };

    // fetch mangalist
    const malResponseManga = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.get(url, { params, headers })
        )
    );

    return malResponseManga.data.data; 
}

async function putListEntry (entry_id, type, data_fields) {
    const url = `https://api.myanimelist.net/v2/${type}/${entry_id}/my_list_status`
    // API expects num_episodes_watched as num_watched_episodes 
    // but returns num_episodes_watched
    data_fields = data_fields.map(([key, val]) => key === 'num_episodes_watched' ? ['num_watched_episodes', val] : [key, val])
    const data = new URLSearchParams(data_fields);
    // deleting updated_at (list_status value which can't be updated by the user)
    data.delete('updated_at');
    const data_string = data.toString();
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // put update
    const response = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.put(url, data_string, { headers })
        )
    );
    
    return response.data;
}

async function fetchAnime (searchTitle, { limit, offset }) {
    //     q : string  (searchString ... API expects at least 3 non empty characters in the string)
    // limit : integer (default 100, max 100)
    // offset: integer (default: 0 , max ???)
    // fields: string  (fields to include)

    const url = 'https://api.myanimelist.net/v2/anime';
    const params = {
        fields: 'num_episodes,alternative_titles',
        q: searchTitle,  
        limit, 
        offset,
        nsfw: true // allows a more accurate response
    };
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await withRetry(() =>
        rateLimitedFetch(() => 
            axios.get(url, { params, headers })
        )
    );

    return {
        searchResults: response.data.data,
        searchTitle
    };
}

async function fetchManga (searchTitle, { limit, offset }) {
    //     q : string  (searchString)
    // limit : integer (default 100, max 100)
    // offset: integer (default: 0 , max ???) 	
    // fields: string  (fields to include )

    // https://api.myanimelist.net/v2/manga

    const url = 'https://api.myanimelist.net/v2/manga';
    const params = { 
        fields: 'num_chapters,num_volumes,alternative_titles',
        q: searchTitle,
        limit, 
        offset,
        nsfw: true // allows a more accurate response
    };
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await withRetry(() =>
        rateLimitedFetch(() => 
            axios.get(url, { params, headers })
        )
    );

    return {
        searchResults: response.data.data,
        searchTitle
    };
}

async function deleteEntryFromLists (entry_id, type) {
    // Whether using the anime or the manga endpoint,
    // the only thing expected from them to be returned
    // is either an empty array OR an error simply stating
    // '404 Not found' ... 
    // 
    // The catch is that, you can pretty much delete an id
    // which when looked up from 'https://myanimelist.net/anime/115165'
    // only shows a 404 page BUT when deleting this same id
    // through the API, instead of returning an error, the
    // API returns the empty array ... 
    //
    // My conclusion is that, as of 2026-07-06, I wouldn't 
    // trust what the API returns. 
    // 
    // I think that there's probably something like a hard limit
    // for the API, which when given a value e.g. (val === null || val < 1 || val > 999999),
    // the API will throw no matter what. 
    // 
    // I also think that if the value is accepted, it will essentially do 
    // something like send a command e.g. 'delete this id from this person's lists',
    // and then just return an empty array without checking if anything was 
    // actually deleted.
    
    // https://api.myanimelist.net/v2/anime/${entry_id}/my_list_status
    // https://api.myanimelist.net/v2/manga/${entry_id}/my_list_status

    const url = `https://api.myanimelist.net/v2/${type}/${entry_id}/my_list_status`;
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    }; 
    const response = await withRetry(() =>
        rateLimitedFetch(() =>
            axios.delete(url, { headers })
        )
    );
}

export { fetchAnimeList, fetchMangaList, putListEntry, fetchAnime, fetchManga, deleteEntryFromLists };