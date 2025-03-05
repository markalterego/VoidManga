import { readFile, writeFile } from 'fs/promises';

async function filehandle (lists) {
    try {
        if (!lists) { // Returns whatever's inside mal.file
            const data = await readFile('mal.file', 'utf8');
            return JSON.parse(data);
        } else { // Logs given lists into mal.file
            await writeFile('mal.file', JSON.stringify(lists, null, 2), 'utf8');
        }
    } catch (error) {
        if (error.response) {
            console.error(`|| Error: ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}

export { filehandle };