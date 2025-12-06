/**
 * This file is the entry point for your Firebase Cloud Functions.
 *
 * You can define your functions here and they will be deployed to Firebase.
 *
 * To learn more about writing Cloud Functions, see the documentation:
 * https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

// Example "Hello World" function
export const helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});
