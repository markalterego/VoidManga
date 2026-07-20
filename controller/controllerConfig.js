import { filehandle } from "../filehandling/filehandle.js";
import { DEFAULT_config, MESSAGE } from "../helpers/export.js";

/*
  The purpose of this controller is mostly for 
  making sure that config is saved to file each
  time it is updated through the UI ... 
  
  Upon the creation of this file, there are still 
  many places in the project where logic related
  to this is simply different depending on what 
  part of the project you're inspecting.
*/

function updateConfig (config = null, updateFn = null) {
    if (Array.isArray(config) || typeof config !== 'object') throw new Error('Failed to update config: config is not an object');
    if (typeof updateFn !== 'function') throw new Error('Failed to update config: updateFn is not a function');    
    const before = JSON.stringify(config);
    updateFn();
    if (before === JSON.stringify(config)) throw new Error('Failed to update config: updater made no changes to config');
    filehandle('config', config);
}

function resetConfig (printMessage = true) {
    const default_config = JSON.parse(JSON.stringify(DEFAULT_config));
    filehandle('config', default_config);
    if (printMessage) MESSAGE.print(MESSAGE.RESET_OPTIONS);
    return default_config;
}

export { updateConfig, resetConfig };