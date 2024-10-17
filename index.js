const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS)
app.use(express.static('public'));

// Helper function to remove BOM characters
function stripBom(str) {
    if (str.charCodeAt(0) === 0xFEFF) {
        return str.slice(1);
    }
    return str;
}

// Route to verify certificate
app.get('/verify', (req, res) => {
    const rid = req.query.rid;  // Get 'rid' (email) from URL
    let isValid = false;
    let result = {};

    if (rid) {
        // Read the CSV file and look for the matching certificate ID (email)
        fs.createReadStream('students.csv')
            .pipe(csv())
            .on('data', (row) => {
                // Clean the row keys by stripping BOM characters
                const cleanRow = {};
                Object.keys(row).forEach((key) => {
                    cleanRow[stripBom(key.trim())] = row[key].trim();
                });

                console.log(cleanRow);  // Log the cleaned row to see the structure
                if (cleanRow.Email === rid) {  // Check if the email matches the 'rid'
                    isValid = true;
                    result = cleanRow;  // Store the matching row
                }
            })
            .on('end', () => {
                if (isValid) {
                    console.log("Matched row:", result);  // Log the matching row

                    const studentName = result['Student Name'] ? result['Student Name'] : 'Unknown';
                    const courseCompleted = result['Course Completed'] ? result['Course Completed'] : 'Unknown';
                    const grade = result['Grade'] ? result['Grade'] : 'Unknown';
                    const completionDate = result['Date'] ? result['Date'] : 'Unknown';

                    // Render the valid.html page with the student details
                    res.send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Certificate Verified</title>
                            <link rel="stylesheet" href="style.css">
                        </head>
                        <body>
                            <div class="container">
                            <img class="logo" src="logo.jpg" alt="AI For ALL Logo" style="max-width: 30%; height: auto;" title="AI For ALL Logo">
                                <h1>Certificate Verified</h1>
                                <p class="message">This certificate is genuine and issued by AI For ALL.</p>
                                <div class="details">
                                    <p><strong>Student Name:</strong> ${studentName}</p>
                                    <p><strong>Course Completed:</strong> ${courseCompleted}</p>
                                    <p><strong>Marks obtained:</strong> ${grade}</p>
                                    <p><strong>Date of Completion:</strong> ${completionDate}</p>
                                </div>
                                <div class="footer">
            AI For ALL © 2024. All rights reserved.
        </div>
                            </div>
                            
                        </body>
                        </html>
                    `);
                } else {
                    // If invalid, send the invalid page
                    res.sendFile(path.join(__dirname, 'public', 'invalid.html'));
                }
            });
    } else {
        res.send('Certificate ID is missing in the URL.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
