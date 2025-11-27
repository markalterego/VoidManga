import axios from 'axios';
import { setTimeout } from "timers/promises";

async function testFetching() {
    console.log('\n>> Fetching... >>');
    // await fetchMangaUpdatesAPI();
}

async function fetchMangaUpdatesAPI() {
    try {
        const startTime = performance.now(); // starting timing fetch
        const response = await axios.post('https://api.mangaupdates.com/v1/series/search', {
            search: 'frieren',
            stype: 'title',
        },
        {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        console.log(response.data);
        const fetchTimeTaken = Math.round(performance.now()-startTime); // time it took to fetch

        const resultArr = response.data.results; // saving results to array
        resultArr.forEach((value) => {
            let recordsKeys = [], metadataKeys = [];
            let records = [], metadata = [];
            for (const key in value.record) {
                if (typeof value.record[key] === 'object') {
                    for (const key2 in value.record[key]) {
                        if (typeof value.record[key][key2] === 'object') {
                            for (const key3 in value.record[key][key2]) {
                                recordsKeys.push(key3);
                                records.push(value.record[key][key2][key3]);
                            }
                        } else {
                            recordsKeys.push(key2);
                            records.push(value.record[key][key2]);
                        }
                    }
                } else {
                    recordsKeys.push(key);
                    records.push(value.record[key]);
                }
            }
            for (const key in value.metadata) {
                if (typeof value.metadata[key] === 'object') {
                    for (const key2 in value.metadata[key]) {
                        if (typeof value.metadata[key][key2] === 'object') {
                            for (const key3 in value.metadata[key][key2]) {
                                metadataKeys.push(key3);
                                records.push(value.metadata[key][key2][key3]);
                            }
                        } else {
                            metadataKeys.push(key2);
                            records.push(value.metadata[key][key2]);
                        }
                    }
                } else {
                    metadataKeys.push(key);
                    records.push(value.metadata[key]);
                }
            }
            console.log(`\n${value.hit_title}:\n`);
            records.forEach((value,index) => console.log(`> ${recordsKeys[index]} - ${value}`));
            metadata.forEach((value,index) => console.log(`> ${metadataKeys[index]} - ${value}`));
        });

        console.log(`\n> ${fetchTimeTaken}ms`); // logging time taken by fetch
        if (fetchTimeTaken < 200) await setTimeout(200-fetchTimeTaken); // avoiding fetching too often
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}: ${error.response.data.message}\n||`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}\n||`);
        }
    }
}

export { testFetching };