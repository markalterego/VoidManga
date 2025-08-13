import axios from 'axios';
import { setTimeout } from "timers/promises";

async function testFetching() {
    await fetchManga();
}

async function fetchManga() {
    try {
        
        
    } catch (error) {
        console.log(error);
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { testFetching };

/* "flex border-b border-b-base-200 pb-5" */
// div.flex.border-b.border-b-base-200.pb-5
