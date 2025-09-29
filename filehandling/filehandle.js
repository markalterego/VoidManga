import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function filehandle (fileIdentifier, input) {
    try {
        const folderDestination = path.resolve(import.meta.dirname, '../data'); // refers to data folder
        if (!existsSync(folderDestination)) mkdirSync(folderDestination); // creates data folder if it doesn't exist
        const destination = path.resolve(folderDestination, `${fileIdentifier}.file`); // file creation 
        if ((typeof fileIdentifier)==='string') {
            if (!input) { // read file
                const data = await readFile(destination, 'utf8');
                return JSON.parse(data);
            } else { // write file
                await writeFile(destination, JSON.stringify(input, null, 2), 'utf8');
            }
        } else {
            console.log(`\n||\n|| The given fileIdentifier has to be of type string\n||`);
        } 
    } catch (error) {
        console.error(`\n||\n|| Error: ${error.message}\n||`);
    }
}

export { filehandle };