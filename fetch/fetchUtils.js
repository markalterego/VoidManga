import { setTimeout } from "timers/promises";

async function withRetry (fn, maxRetries = 5) {
    // executes a fetch related function until the 
    // fetch either succeeds OR fails a set amount
    // of times in a row
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (!error.response) throw error;
            const triesRemaining = maxRetries - attempt;
            console.error(`  Fetch failed (Tries remaining: ${triesRemaining ? `${triesRemaining})` : `${triesRemaining})\n`}`);
            if (triesRemaining === 0) throw new Error(`${maxRetries} fetches failed in a row`); // throw too many fetches failed in a row err
        }
    }
}

async function rateLimitedFetch (fn, minMs = 200) {
    // executes a function and waits a set amount
    // of time after the function if the execution
    // was faster than a set amount of milliseconds
    const start = performance.now();
    const result = await fn(); // run function
    const timeTaken = performance.now() - start;
    if (timeTaken < minMs) await setTimeout(timeTaken - minMs);
    return result;
}

export { withRetry, rateLimitedFetch };