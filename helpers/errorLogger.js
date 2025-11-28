
// purpose of logErrorDetails is to standardize error
// logging (for the most part...) -> no longer do I have
// to constantly think about 'how should I format this error'
// so that when it happens it looks nice to the user's eye...

function logErrorDetails (error) {
    const code = error.code;
    const message = error.message;

    const response = error.response;

    const status = response?.status;
    const statusText = response?.statusText;
    const data = response?.data;

    const responseError = data?.error;
    const responseMessage = data?.message;
    const responseHint = data?.hint;

    // header
    console.error(`\n||\n|| --- Error ---\n||`);

    // response status + info
    if (status)     console.error(`|| Status:     ${status}`);  
    if (statusText) console.error(`|| StatusText: ${statusText}`);
    
    // response details
    if (responseError || responseMessage || responseHint) {
        if (responseError)   console.error(`|| Error:      ${responseError}`);
        if (responseMessage) console.error(`|| Message:    ${responseMessage}`);
        if (responseHint)    console.error(`|| Hint:       ${responseHint}`);
    } else { 
        if (code)    console.error(`|| Code:       ${code}`);
        if (message) console.error(`|| Message:    ${message}`);
    }

    // footer
    console.error('||\n|| -------------\n||');
}

export { logErrorDetails };