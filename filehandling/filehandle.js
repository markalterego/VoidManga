import { readFile, writeFile } from 'fs/promises';

async function filehandle (lists, configData) {
    try {
        if (!lists) { // Returns whatever's inside mal.file
            const data = await readFile('mal.file', 'utf8');
            return JSON.parse(data);
        } else if (Array.isArray(lists)) { // Logs given lists into mal.file
            await writeFile('mal.file', JSON.stringify(lists, null, 2), 'utf8');
        } else if (lists === 'configWrite') { 
            await writeFile('config.file', JSON.stringify(configData, null, 2), 'utf8');
        } else if (lists === 'configRead') { 
            const data = await readFile('config.file', 'utf8');
            return JSON.parse(data);
        } else {
            console.log(`||\n|| The given filehandle option doesn\'t exist\n||`);
        }
    } catch (error) {
        if (error.response) {
            console.error(`||\n|| Error: ${error.response.status}: ${error.response.statusText}\n||`);
        } else {
            console.error('||\n|| Error:', error.message, '\n||');
        }
    }
}

export { filehandle };