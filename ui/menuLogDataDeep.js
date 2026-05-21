import { takeUserInput, capitalFirstLetterString, isISODate, 
         formatDate, longStringToArray } from "../helpers/functions.js";
import { MESSAGE } from "../helpers/export.js";

async function logDataDeepMenu (data, dataTitle, sortByKeysAlphabetical, forceSkipSorting) {
    let input = 0;

    if (!forceSkipSorting && sortByKeysAlphabetical) {
        data = sortObjectByKeysAlphabetical(data, 'asc'); // sort by keys a-z
    }

    while (input !== 'e') 
    {   
        let index = 0;
        console.log(`\n\n  ${capitalFirstLetterString(dataTitle)}\n`);
        if (!Object.keys(data).length) {
            console.log('  ? -> No keys to select');
        } else {
            for (const key in data) {
                console.log(`  ${index++} -> ${capitalFirstLetterString(key)}`);
            }
        }
        console.log('\n  e -> Go back');
        const highestSelectableIndex = index - 1;
        
        input = await takeUserInput(true);

        // 1. display selectable keys of data
        // 2. handle user input
        //    - if data[selected] is primitive type, log --> key: value
        //      -- in case of a long string, format string prior to logging
        //    - else if data[selected] is array of primitives, log --> key\n -value\n -value etc...
        //    - else data[selected] is array of object(s) / object of objects, call function again with data[selected]

        if (input >= 0 && input <= highestSelectableIndex) { 
            // data[input] is an object: 
            // -> key = key of data[input]
            // -> value = value of data[input]
            const key = Object.keys(data)[input], value = Object.values(data)[input]; 
            const dataTypeOfValue = getDataTypeOfValue(value);
            if (!dataTypeOfValue) { // unknown datatype of value
                console.log('\n\n  Data type of value couldn\'t be resolved')
            } else if (dataTypeOfValue === 'primitive' || dataTypeOfValue === 'null') { // key: value || key: null/undefined
                logObject(key, value); 
            } else if (dataTypeOfValue === 'arrayOfPrimitives') { // key: [data1, data2]
                logArrayOfPrimitives(key, value);
            } else if (dataTypeOfValue === 'object') { // key: { key1: value1, key2: value2 }
                await logDataDeepMenu(value, key, 'asc', forceSkipSorting);
            } else if (dataTypeOfValue === 'arrayOfObjects') { // key: [ {key1: value1}, {key2: value2} ]
                const isFlattenable = isFilledWithOneLengthObjects(value); 
                const object = isFlattenable ? flattenArrayOfObjects(value) : reformatArrayObjectsToObject(value, key);
                await logDataDeepMenu(object, key, isFlattenable, forceSkipSorting); // isFlattenable triggers alphabetical sorting if true
            }
        } else if (input !== 'e') {
            MESSAGE.print(MESSAGE.INVALID_INPUT);
        }
    }
}

function getDataTypeOfValue (value) {
    // 1. value is null
    // 2. value is primitive type 
    // 3. value is array of primitive(s)
    // 4. value is array of object(s)
    // 5. value is object
    if (value === null || value === undefined) {
        return 'null';
    } else if (typeof value !== 'object') {
        return 'primitive';
    } else if (Array.isArray(value) && typeof value[0] !== 'object') {
        return 'arrayOfPrimitives';
    } else if (Array.isArray(value) && typeof value[0] === 'object') {
        return 'arrayOfObjects';
    } else if (typeof value === 'object') {
        return 'object';
    } 
}

function logObject (key, value) {
    const maxLineLength = 75;
    if (typeof value === 'string' && value.length > maxLineLength) {
        const stringAsArr = longStringToArray(value, maxLineLength);
        console.log(`\n\n  ${capitalFirstLetterString(key)}:\n`);
        stringAsArr.forEach(line => console.log(`  ${line}`));
    } else {
        const formattedKey = capitalFirstLetterString(key);
        const formatValue = (val) => !val && typeof val !== 'number' && typeof val !== 'boolean' ? 'N/A' : val;
        const formattedValue = isISODate(value) ? formatDate(value) : formatValue(value);
        console.log(`\n\n  ${formattedKey}: ${formattedValue}`);
    }
}

function logArrayOfPrimitives (title, array) {
    console.log(`\n\n  ${capitalFirstLetterString(title)}:\n`);
    array.forEach((value, index) => {
        if (index < array.length - 1) console.log(`  - ${value}`);
        else console.log(`  - ${value}\n`);
    });
    if (!array.length) console.log('  - Nothing was found');
}

function countKeyValuePairs (array) {
    let count = 0;
    for (const element of array) {
        for (const key in element) {
            count++;
        }
    }
    return count;
}

function flattenArrayOfObjects (array) {
    // flattens array of objects to a single object holding key-value pairs
    let flatObject = {}; // holds flattened object
    let keyCount = {}; // counts how many keys by name key encountered e.g. 'en': 2 <-- two keys by name 'en' encountered
    for (const obj of array) { // refers to e.g. '{ 'en': 'frieren' }'
        for (const key in obj) { // e.g. 'en'
            if (!flatObject[key]) { // key doesn't yet exist
                keyCount[key] = 1; // start counting key
                flatObject[key] = obj[key];
            } else { // key exists
                const formattedKey = `${key}_${keyCount[key]++}`; // format key && increment keyCount[key]
                flatObject[formattedKey] = obj[key]; // add data to formatted key
            }
        }
    }
    return flatObject;
}

function reformatArrayObjectsToObject (array, keyOfArray) {
    // formats array of objects to single object and names the keys
    // of each object it holds into keyOfArray_index e.g. tags -> tag_0, tag_1 etc...
    let newObject = {};
    for (const key in array) {
        const formattedKey = `${keyOfArray.slice(0, -1)}_${key}`; // format name of key by upper key
        newObject[formattedKey] = array[key]; // create newObject.formattedKey to hold value of array[obj]
    }
    return newObject;
}

function isFilledWithIndexedKeys (object) {
    // text <-- length text
    // _ <-- one underscore 
    // y <-- number
    for (const key in object) {
        const test = /[a-z]+_{1}[0-9]+/i.test(key); // test for each, return false right away if false otherwise return true at the end 
        if (!test) return false;
    }
    return true;
}

function isFilledWithOneLengthObjects (array) {
    for (const obj of array) { // obj
        if (Object.keys(obj).length > 1) return false; // more then one key value pair
    }
    return true; // every obj of length zero or one
}

function sortObjectByKeysAlphabetical (object, direction) {
    // re-arrange given object by the names of the objects keys
    // object can either be arranged in a-z or z-a order based on direction
    if (!direction || direction === 'asc') { // sort keys a-z
        object = Object.fromEntries( // format back to obj
            Object.entries(object).sort((a, b) => a[0].localeCompare(b[0])) // format obj to arr and sort by keys a-z
        ); 
    } else { // sort keys z-a
        object = Object.fromEntries( // re-arrange by keys
            Object.entries(object).sort((a, b) => b[0].localeCompare(a[0])) // format obj to arr and sort by keys z-a
        );
    }
    return object;
}

export { logDataDeepMenu };