import fs from 'fs';

function filehandle (lists) {
    try {
        if (lists) {
            fs.writeFile('mal.file', JSON.stringify(lists), (err) => {
                if (err) throw err;
            });
        }
    } catch (error) {
        if (error.response) {
            console.error(`|| Error: ${error.response.status}: ${error.response.statusText}\n`);
        } else {
            console.error('|| Error:', error.message, '\n');
        }
    }
}

export { filehandle };