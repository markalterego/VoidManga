import axios from 'axios';
import { setTimeout } from "timers/promises";
import { withRetry, rateLimitedFetch } from './fetchUtils.js';

async function fetchAnimeList() {
    const url = `https://api.myanimelist.net/v2/users/@me/animelist`;
    const params = {
        fields: 'list_status{comments,priority,num_times_rewatched,rewatch_value,tags},num_episodes,type',
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
        fields: 'list_status{comments,priority,num_times_reread,reread_value,tags},num_chapters,num_volumes',
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
    const data = new URLSearchParams(data_fields).toString();
    const headers = {
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // put update
    const response = await withRetry(() => 
        rateLimitedFetch(() => 
            axios.put(url, data, { headers })
        )
    );
    
    return response.data;
}

export { fetchAnimeList, fetchMangaList, putListEntry };