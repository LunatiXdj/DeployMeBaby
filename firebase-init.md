Why we lazy-load Firestore

Problem
- Importing `firebase/firestore` at module top-level can cause runtime errors in dev when the bundler/tree-shaking registers Firebase components too early. Symptoms seen in this repo: "Service firestore is not available", "Component firestore has not been registered yet", and "No Firebase App '[DEFAULT]' has been created" — especially when using Turbopack.

Pattern to follow
1. Initialize Auth only at app startup:
   - Use the provided `getFirebaseAuth()` (from `src/client/lib/firebase.ts`) to initialize the Firebase app and Auth service. This should not import Firestore.

2. Lazy-load Firestore where needed:
   - For any module that uses Firestore (services, pages that query collections), don't import `firebase/firestore` at module top-level.
   - Instead, call `getFirebaseDb()` and dynamically import the Firestore helpers when the function runs. Example:

     const { db, collection, getDocs } = await withFirestoreHelpers();
     const supplierCollection = collection(db, 'suppliers');
     const snapshot = await getDocs(supplierCollection);

   - See `src/client/services/supplierService.ts` for a concrete implementation.

3. Defer profile/profile-related reads out of the Auth initialization path
   - The Auth provider should only subscribe to auth state and provide the user object. Any Firestore-backed profile fetch should be done lazily by components that need it.

Why this works
- Dynamic imports ensure Firestore is only registered after the Firebase app exists in runtime and after the module system has resolved the app initialization ordering. It avoids bundler-specific early-registration bugs.

Notes & Future work
- Multiple services still import Firestore at top-level; they should be converted to the same pattern.
- If switching dev bundlers or upgrading Firebase, re-test this pattern; it remains robust across bundlers when Firestore is lazily imported.

Contact
- If you hit regressions, check browser console for Firestore registration errors and trace which module imported `firebase/firestore` at module load time.
