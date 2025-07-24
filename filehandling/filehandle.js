import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function filehandle (fileIdentifier, input) {
    try {
        const __filepath = fileURLToPath(import.meta.url); // refers to current filepath e.g. C:\Code\file.js
        const __dirname = dirname(__filepath); // refers to current folder e.g. C:\Code 
        const destination = join(__dirname, '..', 'regular', (fileIdentifier + '.file')); // refers to regular folder
        if (fileIdentifier==='mal') {
            if (!input) { // read mal.file
                const data = await readFile(destination, 'utf8');
                return JSON.parse(data);
            } else { // write mal.file
                await writeFile(destination, JSON.stringify(input, null, 2), 'utf8');
            }
        } else if (fileIdentifier==='config') {
            if (!input) { // read config.file
                const data = await readFile(destination, 'utf8');
                return JSON.parse(data);
            } else { // write config.file
                await writeFile(destination, JSON.stringify(input, null, 2), 'utf8');
            }
        } else if ((typeof fileIdentifier)!=='string') {
            console.log(`\n||\n|| The given fileIdentifier has to be of type string\n||`);
        } else {
            console.log(`\n||\n|| The given fileIdentifier \'${fileIdentifier}\' doesn\'t exist\n||`);
        }
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

export { filehandle };