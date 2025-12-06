// scripts/reenable-user.js
// One-off script to re-enable a Firebase Auth user by email.
// Usage: place your service-account.json next to this script and run:
//   node scripts/reenable-user.js you@example.com

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', 'service-account.json');
if (!fs.existsSync(keyPath)) {
    console.error('service-account.json not found at project root. Please download from Firebase Console and save as service-account.json');
    process.exit(1);
}

const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function reenableByEmail(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        if (!user.disabled) {
            console.log('User already enabled:', user.uid);
            return;
        }
        await admin.auth().updateUser(user.uid, { disabled: false });
        console.log('User re-enabled:', user.uid);
    } catch (err) {
        console.error('Error re-enabling user:', err);
    }
}

const email = process.argv[2];
if (!email) {
    console.error('Please provide the user email as the first argument.');
    process.exit(1);
}

reenableByEmail(email).then(() => process.exit());
