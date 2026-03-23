import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { logErrorDetails } from '../helpers/errorLogger.js';
import path from 'path';

function filehandle (fileIdentifier, input) {
    try {
        const folderDestination = path.resolve(import.meta.dirname, '../data'); // refers to data folder
        if (!existsSync(folderDestination)) mkdirSync(folderDestination); // creates data folder if it doesn't exist
        const destination = path.resolve(folderDestination, `${fileIdentifier}.file`); // file creation 
        if ((typeof fileIdentifier)==='string') {
            if (!input) { // read file
                const data = readFileSync(destination, 'utf8');
                return JSON.parse(data);
            } else { // write file
                writeFileSync(destination, JSON.stringify(input, null, 2), 'utf8');
            }
        } else {
            console.log(`\n||\n|| The given fileIdentifier has to be of type string\n||`);
        } 
    } catch (error) {
        logErrorDetails(error);
    }
}

function writeEnv (input, forceGenerateEmptyEnv) {
    try {
        const folderDestination = path.resolve(import.meta.dirname, '..'); // refers to pollManga folder
        const destination = path.resolve(folderDestination, '.env'); // refers to .env file
        if (!existsSync(destination) || forceGenerateEmptyEnv === true) writeFileSync(destination, ''); // creates empty .env file if not found
        const env = readFileSync(destination, 'utf-8').split('\n').filter(line => line !== ''); // env = [ "key1=value1", "key2=value2" ]
        for (const key in input) {
            const index = env.findIndex(line => line.startsWith(`${key}=`)); // find existing index of key
            const value = `${key}=${input[key]}`; // key=value pair as string
            if (index >= 0) env[index] = value; // found key at env
            else env.push(value); // append new key=value pair to env
            process.env[key] = input[key]; // updates process.env
        }
        // write .env file by combining each element of env to a single 
        // string separated by '\n' (the format of an .env file)
        writeFileSync(destination, env.join('\n'), 'utf8');
    } catch (error) {
        logErrorDetails(error);
    }
}

export { filehandle, writeEnv };