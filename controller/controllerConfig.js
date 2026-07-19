import { filehandle } from "../filehandling/filehandle.js";
import { MESSAGE } from "../helpers/export.js";

/*
  The purpose of this controller is mostly for 
  making sure that config is saved to file each
  time it is updated through the UI ... 
  
  Upon the creation of this file, there are still 
  many places in the project where logic related
  to this is simply different depending on what 
  part of the project you're inspecting.
*/

function updateConfig (config = null, path = null, value = null) {
    if (Array.isArray(config) || typeof config !== 'object') throw new Error('Failed to update config: config is not an object');
    if (value === null || value === undefined || Number.isNaN(value)) throw new Error('Failed to update config: value is undefined, null or NaN');
    if (typeof path !== 'string') throw new Error('Failed to update config: path is not a string');
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((acc, key) => acc?.[key], config);
    if (parent === undefined || parent[lastKey] === undefined) throw new Error(`Failed to update config: path is invalid`);
    parent[lastKey] = value;
    filehandle('config', config);
}

export { updateConfig };