import { readFile, writeFile } from 'fs/promises';

async function filehandle (fileIdentifier, input) {
    try {
        if (fileIdentifier==='mal') {
            if (!input) { // read mal.file
                const data = await readFile('mal.file', 'utf8');
                return JSON.parse(data);
            } else { // write mal.file
                await writeFile('mal.file', JSON.stringify(input, null, 2), 'utf8');
            }
        } else if (fileIdentifier==='config') {
            if (!input) { // read config.file
                const data = await readFile('config.file', 'utf8');
                return JSON.parse(data);
            } else { // write config.file
                await writeFile('config.file', JSON.stringify(input, null, 2), 'utf8');
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