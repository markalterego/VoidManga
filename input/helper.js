import { rl } from '../main.js';

async function takeUserInput() {
    try {
        let userInput = await rl.question('\n|| Input: '); // get user input
        if (userInput.toLowerCase() !== 'e') userInput = parseInt(userInput, 10); // convert userinput to int
        else userInput = userInput.toLowerCase(); // convert userinput to lowercase
        return userInput;
    } catch (error) {
        if (error.code==='ABORT_ERR') console.error(); // extra newline for extra cleanliness :)
        console.error(`\n||\n|| Error: ${error.message}\n||`); // handles e.g. CTRL + C
    } 
}

export { takeUserInput };