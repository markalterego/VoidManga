import { takeUserInput, capitalFirstLetterString, isISODate, 
         formatDate, longStringToArray, printMenuOptions} from "../helpers/functions.js";
import { MESSAGE } from "../helpers/export.js";

async function logDataDeepMenu (data, dataTitle, sortByKeysAlphabetical, forceSkipSorting) {
    let input = null;

    if (!forceSkipSorting && sortByKeysAlphabetical) {
        data = sortObjectByKeysAlphabetical(data, 'asc'); // sort by keys a-z
    }

    while (input !== 'e') 
    {   
        const dataEntries = Object.entries(data);
        const header = capitalFirstLetterString(dataTitle);
        const mappedKeys = dataEntries.map(([key, _]) => [capitalFirstLetterString(key)]);
        const keys = dataEntries.length ? mappedKeys : [['?', 'No keys to select']];
        const optionsArray = [
            ...keys,
            '_'
        ];

        printMenuOptions(
            header,
            optionsArray
        );
        
        input = await takeUserInput(true);

        // 1. display selectable keys of data
        // 2. handle user input
        //    - if data[selected] is primitive type, log --> key: value
        //      -- in case of a long string, format string prior to logging
        //    - else if data[selected] is array of primitives, log --> key\n -value\n -value etc...
        //    - else data[selected] is array of object(s) / object of objects, call function again with data[selected]

        if (input >= 0 && input < dataEntries.length) { 
            // data[input] is an object: 
            // -> key = key of data[input]
            // -> value = value of data[input]
            const [key, value] = dataEntries[input];
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
    const header = capitalFirstLetterString(title);
    const primitives = array.map(val => [null, '-', val]);
    const optionsArray = primitives.length ? primitives : [[null, '-', 'Nothing was found']];
    printMenuOptions(
        header,
        optionsArray,
        { printExit: false }
    );
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
    // [ {} ... ] -> { key_1: {} ... }
    return array.reduce((acc, obj, index) => {
        const formattedKey = `${keyOfArray.slice(0, -1)}_${index}`; // e.g. 'Tags' -> 'Tag'
        return { ...acc, [formattedKey]: obj };
    }, {});
}

function isFilledWithOneLengthObjects (array) {
    return array.every(obj => 
        Object.keys(obj).length === 1
    );
}

function sortObjectByKeysAlphabetical (object, direction = 'asc') {
    return direction === 'asc' 
        ? Object.fromEntries(Object.entries(object).sort((a, b) => a[0].localeCompare(b[0])))
        : Object.fromEntries(Object.entries(object).sort((a, b) => b[0].localeCompare(a[0])));
}

export { logDataDeepMenu };