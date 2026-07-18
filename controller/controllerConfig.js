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

function updateConfig (config = null, path = '', value = null) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((acc, key) => acc?.[key], config);
    if (parent === undefined) throw new Error(`Failed to update config at '${path}'`);
    parent[lastKey] = value;
    filehandle('config', config);
}

export { updateConfig };