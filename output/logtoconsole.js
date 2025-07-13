//console.log(lists[0][0][0]?.node.title); // first title in animelist
//console.log(lists[1][0][0]?.node.title); // first title in mangalist

async function log (options, lists) {
    try {
        logMAL(options, lists);
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}`);
        }
    }
}

function logMAL (options, lists) {
    try {
        const animelist = lists[0];
        const mangalist = lists[1];

        switch (options) {
            case 'anime_watching':
                console.log('\n||\n|| (Watching)\n||'); // logging titles marked as 'watching'
                for (let i = 0; i < animelist[0].length; i++) { 
                    console.log(`|| - ${animelist[0][i].node.title} ( ${animelist[0][i].list_status.num_episodes_watched} / ${animelist[0][i].node.num_episodes ? animelist[0][i].node.num_episodes : 'unknown'} )`);
                    if (i===(animelist[0].length-1)) if (animelist[0].length < 10) console.log('||'); else console.log(`||\n|| Currently watching ${i+1} different anime\n||`);
                }
                break;
            case 'anime_completed':
                console.log('\n||\n|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < animelist[1].length; i++) { 
                    console.log(`|| - ${animelist[1][i].node.title}`);
                    if (i===(animelist[1].length-1)) if (animelist[1].length < 10) console.log('||'); else console.log(`||\n|| You have watched ${i+1} different anime\n||`);
                }
                break;
            case 'anime_on_hold':
                console.log('\n||\n|| (On Hold)\n||'); // logging titles marked as 'on hold'
                for (let i = 0; i < animelist[2].length; i++) { 
                    console.log(`|| - ${animelist[2][i].node.title}`);
                    if (i===(animelist[2].length-1)) if (animelist[2].length < 10) console.log('||'); else console.log(`||\n|| You have ${i+1} different anime on hold\n||`);
                }
                break;
            case 'anime_dropped':
                console.log('\n||\n|| (Dropped)\n||'); // logging titles marked as 'dropped'
                for (let i = 0; i < animelist[3].length; i++) { 
                    console.log(`|| - ${animelist[3][i].node.title}`);
                    if (i===(animelist[3].length-1)) if (animelist[3].length < 10) console.log('||'); else console.log(`||\n|| You have dropped ${i+1} different anime\n||`);
                }
                break;
            case 'anime_plan_to_watch':
                console.log('\n||\n|| (Plan To Watch)\n||'); // logging titles marked as 'plan to watch'
                for (let i = 0; i < animelist[4].length; i++) { 
                    console.log(`|| - ${animelist[4][i].node.title}`);
                    if (i===(animelist[4].length-1)) if (animelist[4].length < 10) console.log('||'); else console.log(`||\n|| You are planning to watch ${i+1} different anime\n||`);
                }
                break;
            case 'manga_reading':
                console.log('\n||\n|| (Reading)\n||'); // logging titles marked as 'reading'
                for (let i = 0; i < mangalist[0].length; i++) { 
                    console.log(`|| - ${mangalist[0][i].node.title} ( ${mangalist[0][i].list_status.num_chapters_read} / ${mangalist[0][i].node.num_chapters ? mangalist[0][i].node.num_chapters : 'unknown'} )`);
                    if (i===(mangalist[0].length-1)) if (mangalist[0].length < 10) console.log('||'); else console.log(`||\n|| You are reading ${i+1} different manga\n||`);
                }
                break;
            case 'manga_completed':
                console.log('\n||\n|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < mangalist[1].length; i++) { 
                    console.log(`|| - ${mangalist[1][i].node.title}`);
                    if (i===(mangalist[1].length-1)) if (mangalist[1].length < 10) console.log('||'); else console.log(`||\n|| You have read ${i+1} mangas\n||`);
                }
                break;
            case 'manga_on_hold':
                console.log('\n||\n|| (On Hold)\n||'); // logging titles marked as 'on hold'
                for (let i = 0; i < mangalist[2].length; i++) { 
                    console.log(`|| - ${mangalist[2][i].node.title}`);
                    if (i===(mangalist[2].length-1)) if (mangalist[2].length < 10) console.log('||'); else console.log(`||\n|| You have ${i+1} different manga on hold\n||`);
                }
                break;
            case 'manga_dropped':
                console.log('\n||\n|| (Dropped)\n||'); // logging titles marked as 'dropped'
                for (let i = 0; i < mangalist[3].length; i++) { 
                    console.log(`|| - ${mangalist[3][i].node.title}`);
                    if (i===(mangalist[3].length-1)) if (mangalist[3].length < 10) console.log('||'); else console.log(`||\n|| You have dropped ${i+1} different manga\n||`);
                }
                break;
            case 'manga_plan_to_read':
                console.log('\n||\n|| (Plan To Read)\n||'); // logging titles marked as 'plan to read'
                for (let i = 0; i < mangalist[4].length; i++) { 
                    console.log(`|| - ${mangalist[4][i].node.title}`);
                    if (i===(mangalist[4].length-1)) if (mangalist[4].length < 10) console.log('||'); else console.log(`||\n|| You are planning to read ${i+1} different manga\n||`);
                }
                break;
            case 'all':
                let totalEntries = 0;
                console.log('\n||\n|| = Animelist =\n||'); // logging MAL personal anime titles
                console.log('|| (Watching)\n||'); // logging titles marked as 'watching'
                for (let i = 0; i < animelist[0].length; i++) { 
                    console.log(`|| - ${animelist[0][i].node.title} ( ${animelist[0][i].list_status.num_episodes_watched} / ${animelist[0][i].node.num_episodes ? animelist[0][i].node.num_episodes : 'unknown'} )`);
                    if (i===(animelist[0].length-1)) { totalEntries+=i+1; console.log('||') }; 
                }
                console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < animelist[1].length; i++) { 
                    console.log(`|| - ${animelist[1][i].node.title}`);
                    if (i===(animelist[1].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (On Hold)\n||'); // logging titles marked as 'on hold'
                for (let i = 0; i < animelist[2].length; i++) { 
                    console.log(`|| - ${animelist[2][i].node.title}`);
                    if (i===(animelist[2].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (Dropped)\n||'); // logging titles marked as 'dropped'
                for (let i = 0; i < animelist[3].length; i++) { 
                    console.log(`|| - ${animelist[3][i].node.title}`);
                    if (i===(animelist[3].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (Plan To Watch)\n||'); // logging titles marked as 'plan to watch'
                for (let i = 0; i < animelist[4].length; i++) { 
                    console.log(`|| - ${animelist[4][i].node.title}`);
                    if (i===(animelist[4].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('\n||\n|| = Mangalist =\n||'); // logging MAL personal manga titles
                console.log('|| (Reading)\n||'); // logging titles marked as 'reading'
                for (let i = 0; i < mangalist[0].length; i++) { 
                    console.log(`|| - ${mangalist[0][i].node.title} ( ${mangalist[0][i].list_status.num_chapters_read} / ${mangalist[0][i].node.num_chapters ? mangalist[0][i].node.num_chapters : 'unknown'} )`);
                    if (i===(mangalist[0].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < mangalist[1].length; i++) { 
                    console.log(`|| - ${mangalist[1][i].node.title}`);
                    if (i===(mangalist[1].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (On Hold)\n||'); // logging titles marked as 'on hold'
                for (let i = 0; i < mangalist[2].length; i++) { 
                    console.log(`|| - ${mangalist[2][i].node.title}`);
                    if (i===(mangalist[2].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (Dropped)\n||'); // logging titles marked as 'dropped'
                for (let i = 0; i < mangalist[3].length; i++) { 
                    console.log(`|| - ${mangalist[3][i].node.title}`);
                    if (i===(mangalist[3].length-1)) { totalEntries+=i+1; console.log('||') };
                }
                console.log('|| (Plan To Read)\n||'); // logging titles marked as 'plan to read'
                for (let i = 0; i < mangalist[4].length; i++) { 
                    console.log(`|| - ${mangalist[4][i].node.title}`);
                    if (i===(mangalist[4].length-1)) { console.log('||'); totalEntries+=i+1; console.log(`\n||\n|| In total your list consists of ${totalEntries} entries\n||`) };
                }
                break;
            default:
                console.log('\n|| No valid logging option received');
        }
    } catch (error) {
        if (error.response) {
            console.error(`\n||\n|| Error: ${error.response.status}: ${error.response.statusText}`);
        } else {
            console.error(`\n||\n|| Error: ${error.message}`);
        }
    }
}

export { log };