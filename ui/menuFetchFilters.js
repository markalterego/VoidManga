import { takeUserInput, clearScreen } from '../helpers/functions.js';
import { animeStatus, mangaStatus, expectedFilters } from '../helpers/export.js';

async function filterEntriesFromFetch (lists, key) { 
    const isValidFilterKey = expectedFilters.some(expectedKey => key === expectedKey);
    let m = 0;

    if (!isValidFilterKey) { // function parameter is not an expected value
        console.log(`\n||\n|| The received value '${key}' is not valid\n||`);
    } else { // function parameter is an expected value
        while (m !== 'e') 
        {
            // select where to list statuses from
            console.log(`\n||\n|| Filtering ${key}:\n||`);
            console.log('|| 0 -> Filter anime');
            console.log('|| 1 -> Filter manga');
            console.log('|| 2 -> Include all');
            console.log('|| 3 -> Exclude all');
            console.log('|| e -> Go back\n||');

            m = await takeUserInput(); // get user input

            await clearScreen(); // clears console window   
        
            // logging statuses by type
            if (m === 0 || m === 1) {
                // saving selected type 
                const type = m;
                while (m !== 'e') 
                {
                    console.log('\n||\n|| Select a status\n||');
                    if (type === 0) { // anime
                        animeStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    } else { // manga
                        mangaStatus.forEach((value, index) => {
                            console.log(`|| ${index} -> ${value}`);
                        });
                    }
                    console.log('|| e -> Go back\n||');

                    m = await takeUserInput(); // get user input

                    await clearScreen(); // clears console window  

                    // logging titles by status
                    if ((type === 0 && m < animeStatus.length) || (type === 1 && m < mangaStatus.length)) { 
                        // saving the selected status
                        const status = m;
                        // going back to upper menu in case lists[type][status] is empty
                        if (!lists[type][status].length) { 
                            console.log('\n||\n|| No titles found for the selected status\n||'); 
                        } else {
                            while (m !== 'e') 
                            {
                                console.log('\n||\n|| Select titles to be fetched\n||')
                                lists[type][status].forEach((item, index) => {
                                    console.log(`|| ${index} -> ${item.node.title} ${item[key] ? '[x]' : '[]'}`); 
                                });
                                console.log('|| e -> Go back\n||');             

                                m = await takeUserInput(); // get user input

                                await clearScreen(); // clears console window  
                                
                                // toggling filter at given option
                                if (m > -1 && m < lists[type][status].length) {
                                    const item = lists[type][status][m]; // referring to item
                                    if (item[key]) item[key] = false; 
                                    else item[key] = true;
                                } else if (m !== 'e') {
                                    console.log('\n|| Please input a valid option');
                                }
                            }
                        }
                        m = null; // ensuring upper menu doesn't exit
                    } else if (m !== 'e') {
                        console.log('\n|| Please input a valid option');
                    }
                }
                m = null; // ensuring upper menu doesn't exit
            } else if (m === 2) {
                // reassigning fetch filters as true
                for (const type of lists) {
                    for (const status of type) {
                        for (const item of status) {
                            item[key] = true;
                        }
                    }
                }
                console.log('\n||\n|| Included all titles to fetch\n||');
            } else if (m === 3) {
                // reassigning fetch filters as false
                for (const type of lists) {
                    for (const status of type) {
                        for (const item of status) {
                            item[key] = false;
                        }
                    }
                }
                console.log('\n||\n|| Excluded all titles from fetch\n||');
            } else if (m !== 'e') {
                console.log('\n|| Please input a valid option');
            }
        }
    }
}

export { filterEntriesFromFetch };