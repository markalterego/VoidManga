//console.log(lists[0][0][0]?.node.title); // first title in animelist
//console.log(lists[1][0][0]?.node.title); // first title in mangalist

async function log (options, lists) {
    try {
        logMAL(options, lists);
    } catch (error) {
        if (error.response) {
            console.error(`|| Error: ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}

function logMAL (options, lists) {
    try {
        const animelist = lists[0];
        const mangalist = lists[1];

        switch (options) {
            case 'anime_watching':
                //console.log('\n||\n|| = Animelist =\n||'); // logging MAL personal anime titles
                console.log('\n||\n|| (Watching)\n||'); // logging titles marked as 'watching'
                for (let i = 0; i < animelist[0].length; i++) { 
                    console.log(`|| - ${animelist[0][i].node.title} ( ${animelist[0][i].list_status.num_episodes_watched} / ${animelist[0][i].node.num_episodes ? animelist[0][i].node.num_episodes : 'unknown'} )`);
                    if (i===(animelist[0].length-1)) console.log('||');
                }
                break;
            case 'anime_completed':
                console.log('\n||\n|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < animelist[1].length; i++) { 
                    console.log(`|| - ${animelist[1][i].node.title}`);
                    if (i===(animelist[1].length-1)) console.log('||');
                }
                break;
            case 'manga_reading':
                //console.log('\n||\n|| = Mangalist =\n||'); // logging MAL personal manga titles
                console.log('\n||\n|| (Reading)\n||'); // logging titles marked as 'reading'
                for (let i = 0; i < mangalist[0].length; i++) { 
                    console.log(`|| - ${mangalist[0][i].node.title} ( ${mangalist[0][i].list_status.num_chapters_read} / ${mangalist[0][i].node.num_chapters ? mangalist[0][i].node.num_chapters : 'unknown'} )`);
                    if (i===(mangalist[0].length-1)) console.log('||');
                }
                break;
            case 'manga_completed':
                console.log('\n||\n|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < mangalist[1].length; i++) { 
                    console.log(`|| - ${mangalist[1][i].node.title}`);
                    if (i===(mangalist[1].length-1)) console.log('||');
                }
                break;
            case 'all':
                console.log('\n||\n|| = Animelist =\n||'); // logging MAL personal anime titles
                console.log('|| (Watching)\n||'); // logging titles marked as 'watching'
                for (let i = 0; i < animelist[0].length; i++) { 
                    console.log(`|| - ${animelist[0][i].node.title} ( ${animelist[0][i].list_status.num_episodes_watched} / ${animelist[0][i].node.num_episodes ? animelist[0][i].node.num_episodes : 'unknown'} )`);
                    if (i===(animelist[0].length-1)) console.log('||');
                }
                console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < animelist[1].length; i++) { 
                    console.log(`|| - ${animelist[1][i].node.title}`);
                    if (i===(animelist[1].length-1)) console.log('||');
                }

                console.log('\n||\n|| = Mangalist =\n||'); // logging MAL personal manga titles
                console.log('|| (Reading)\n||'); // logging titles marked as 'reading'
                for (let i = 0; i < mangalist[0].length; i++) { 
                    console.log(`|| - ${mangalist[0][i].node.title} ( ${mangalist[0][i].list_status.num_chapters_read} / ${mangalist[0][i].node.num_chapters ? mangalist[0][i].node.num_chapters : 'unknown'} )`);
                    if (i===(mangalist[0].length-1)) console.log('||');
                }
                console.log('|| (Completed)\n||'); // logging titles marked as 'completed'
                for (let i = 0; i < mangalist[1].length; i++) { 
                    console.log(`|| - ${mangalist[1][i].node.title}`);
                    if (i===(mangalist[1].length-1)) console.log('||');
                }
                break;
            default:
                console.log('\n|| No valid logging option received');
        }
    } catch (error) {
        if (error.response) {
            console.error(`|| Error: ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}

export { log };