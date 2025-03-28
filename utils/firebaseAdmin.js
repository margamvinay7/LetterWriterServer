import admin from "firebase-admin";
import dotenv from "dotenv";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url); // Enable CommonJS-style require
// const serviceAccount = require("../firebase-service-account.json"); // Import JSON

dotenv.config(); // Load environment variables

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_CREDENTIALS);
export const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), // Use default to get JSON
});

export default firebaseAdmin;
