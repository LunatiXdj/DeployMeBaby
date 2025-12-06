// Import the Firebase Admin SDK
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

/**
 * Reads and parses the Firebase service account key from the .env.local file.
 * This function is designed to be robust against common formatting issues.
 * @returns {object} The parsed service account key.
 */
function getServiceAccountKey() {
    const envLocalContent = readFileSync('./.env.local', 'utf-8');
    const lines = envLocalContent.split('\n');
    const keyLine = lines.find(line => line.trim().startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));

    if (!keyLine) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local. Please ensure it is present.');
    }

    // Extract the string value after the '='
    let jsonString = keyLine.substring(keyLine.indexOf('=') + 1).trim();

    // Remove the outer quotes if they exist (e.g., "...")
    if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
        jsonString = jsonString.slice(1, -1);
    }
    
    // Replace the escaped newline characters ('\\n') with actual newlines ('\n')
    const unescapedString = jsonString.replace(/\\n/g, '\n');

    try {
        // Parse the cleaned string into a JSON object
        return JSON.parse(unescapedString);
    } catch (e) {
        console.error("Fatal: Failed to parse the service account key JSON.");
        console.error("This usually means the key in your .env.local file is malformed.");
        // Throw the original error for more details
        throw e; 
    }
}

// --- Main script logic ---
const emailToMakeAdmin = "p.hueting@ph-service.de";

try {
    const serviceAccount = getServiceAccountKey();

    // Initialize Firebase Admin SDK if not already initialized
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const setAdminRole = async () => {
        try {
            console.log(`Fetching user with email: ${emailToMakeAdmin}...`);
            const user = await getAuth().getUserByEmail(emailToMakeAdmin);
            
            console.log(`Setting custom claim { role: 'admin' } for user UID: ${user.uid}...`);
            await getAuth().setCustomUserClaims(user.uid, { role: 'admin' });
            
            console.log(`✅ Successfully set role 'admin' for user: ${emailToMakeAdmin}`);
            console.log("Please log out and log back in to see the changes.");
        } catch (error) {
            console.error('❌ Error setting custom user claims:', error.message);
            process.exit(1);
        }
    };

    setAdminRole();

} catch (error) {
    // Catch errors from initialization or key parsing
    console.error("An error occurred during script execution:", error.message);
    process.exit(1);
}
