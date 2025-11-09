```typescript
// Import the fs module for file operations
import * as fs from 'fs';

// Define a function to append officers to the log file
function appendOfficersToLog(officers: string[]) {
    // Specify the file path and name
    const logFilePath = 'officer_log.txt';

    // Check if the file exists, if not create it
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '');
    }

    // Append the found officers to the log file
    officers.forEach((officer) => {
        fs.appendFileSync(logFilePath, officer + '\n');
    });
}

// Example usage:
const foundOfficers = ['Officer John', 'Officer Jane', 'Officer Bob'];
appendOfficersToLog(foundOfficers);
```

Note: This code assumes that the `officer_log.txt` file is in the same directory as the TypeScript file. If the file is in a different directory, you need to specify the full path to the file in the `logFilePath` variable.

Also, this code uses the `fs` module which is a built-in Node.js module. If you are running this code in a browser, you will need to use a different approach as browsers do not have direct access to the file system.

Make sure to handle any potential errors that may occur during file operations. This example uses `writeFileSync` and `appendFileSync` which are synchronous methods. For a more robust solution, consider using the asynchronous versions (`writeFile` and `appendFile`) with proper error handling.