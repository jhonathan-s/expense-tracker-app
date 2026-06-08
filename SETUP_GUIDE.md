# User Deletion with Firebase Auth Sync - Implementation Guide

## Overview

This implementation adds a feature to delete users from both Firebase Firestore and Firebase Authentication when an admin deletes a user from the admin page. Previously, users were only deleted from Firestore, requiring manual deletion from the Firebase Console.

## What Changed

### 1. **Firebase Cloud Functions Setup** (`functions/` directory)
   - Created a new `deleteUserAccount` Cloud Function using Firebase Functions
   - The function uses the Admin SDK to delete users from Firebase Authentication
   - Also deletes the user document from Firestore
   - Includes admin verification to ensure only admins can delete users

### 2. **Admin Service Update** (`services/adminService.ts`)
   - Modified `deleteUser()` function to call the Cloud Function
   - Removed the old Firestore-only deletion logic
   - Added error handling for Cloud Function errors
   - Provides user-friendly error messages in Portuguese

### 3. **Firebase Config Update** (`config/firebase.ts`)
   - Added Cloud Functions initialization with the `us-east1` region
   - Exported the `functions` instance for use in services

### 4. **Admin UI Update** (`app/(tabs)/admin.tsx`)
   - Updated the confirmation modal message from:
     > "Esta ação irá deletar o usuário de Firestore. Para deletar a autenticação, acesse o Firebase Console."
   - To:
     > "Esta ação irá deletar o usuário de Firestore e Firebase Authentication permanentemente."

### 5. **Firebase Configuration** (`firebase.json`)
   - Created Firebase configuration file for deployments

## Architecture

```
User Admin Page
      ↓
Delete User Button
      ↓
Admin Service (deleteUser)
      ↓
Cloud Function (deleteUserAccount)
      ↓
┌─────────────────────────────┐
│ Firebase Admin SDK          │
├─────────────────────────────┤
│ 1. Delete from Auth         │
│ 2. Delete from Firestore    │
└─────────────────────────────┘
```

## Deployment Steps

### Step 1: Install Firebase CLI

If you haven't already, install the Firebase CLI:

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

Follow the browser prompt to authenticate with your Google account.

### Step 3: Deploy Cloud Functions

From the project root directory:

```bash
firebase deploy --only functions
```

This will:
- Compile the TypeScript code from `functions/src/index.ts`
- Deploy the `deleteUserAccount` Cloud Function
- Show the function URL and endpoint

**Expected output:**
```
✔ functions[deleteUserAccount]: Successful HTTP 200 response
```

### Step 4: Verify Deployment

You can verify the deployment in the Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select your project
3. Go to Functions → Functions
4. You should see `deleteUserAccount` listed

## Testing the Feature

### Method 1: Test in Your App (Recommended)

1. Open your app on the admin page
2. Try deleting a test user
3. Check the console for any errors
4. Verify in Firebase Console that the user is deleted from both:
   - Authentication → Users
   - Firestore → users collection

### Method 2: Test via Firebase Console

1. Go to Firebase Console → Functions → deleteUserAccount
2. Click "Testing" tab
3. Click "Create a test event"
4. Use this payload:
   ```json
   {
     "data": {
       "uid": "test-user-uid-to-delete"
     }
   }
   ```
5. Click "Create event" and check the logs

### Method 3: Test via emulator (Local Development)

From the `functions` directory:

```bash
firebase emulators:start --only functions
```

Then test the function locally before deploying.

## Troubleshooting

### Error: "Functions deployed to region us-east1 but app uses us-central1"

**Solution:** Update the region in your app or Cloud Functions to match. Currently, the function is deployed to `us-east1`. If your app expects a different region, update:

- `config/firebase.ts`: Change `getFunctions(app, 'us-east1')` to your preferred region
- `functions/src/index.ts`: Change `region: 'us-east1'` to match

### Error: "Only admins can delete user accounts"

**Possible causes:**
1. The logged-in user is not an admin
2. The admin user's email is not `admin@admin.com`

**Solution:** Verify the admin user in your app. You can customize the admin check in `functions/src/index.ts`:

```typescript
// Current logic
const isAdmin = request.auth.token.email === 'admin@admin.com' || callerData?.isAdmin === true
```

### Error: "User not found in Firebase Authentication"

**Cause:** The UID doesn't exist in Firebase Authentication (already deleted or incorrect UID)

**Solution:** Verify the UID is correct and the user exists in Firebase Console → Authentication

### Error: "Cloud Function not found"

**Causes:**
1. Cloud Functions not deployed yet
2. Region mismatch between app and deployed function
3. Function name mismatch

**Solution:**
1. Run `firebase deploy --only functions`
2. Check Firebase Console to see deployed functions
3. Verify region matches in both `config/firebase.ts` and `functions/src/index.ts`

## Security Considerations

1. **Admin Verification**: The Cloud Function verifies that only admins can delete users
2. **Authentication Required**: Users must be authenticated to call the function
3. **No Client-Side Deletion**: The Firebase Admin SDK is used server-side, not client-side
4. **Error Messages**: Detailed errors for debugging but without exposing sensitive data

## Monitoring and Logging

To view Cloud Function logs:

```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to Functions → Functions
2. Click `deleteUserAccount`
3. View logs tab

## Next Steps

1. **Deploy the Cloud Functions** using the steps above
2. **Test the deletion feature** with a test user
3. **Verify both Firebase Auth and Firestore** are updated
4. **Monitor logs** for any errors
5. **Inform your team** that manual Firebase Console deletion is no longer needed

## File Structure

```
.
├── functions/                    # Cloud Functions
│   ├── src/
│   │   └── index.ts             # Cloud Function implementation
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md               # Detailed function documentation
├── services/
│   └── adminService.ts         # Updated to call Cloud Function
├── config/
│   └── firebase.ts             # Updated with Cloud Functions config
├── app/(tabs)/
│   └── admin.tsx               # Updated UI message
└── firebase.json               # Firebase configuration
```

## Support

For issues or questions:
1. Check the `functions/README.md` for more detailed function documentation
2. Review Firebase Cloud Functions documentation: https://firebase.google.com/docs/functions
3. Check Firebase Authentication documentation: https://firebase.google.com/docs/auth/admin

## Rollback

If you need to rollback to the previous behavior:

```bash
firebase functions:delete deleteUserAccount
```

And revert the code changes in `services/adminService.ts` and `config/firebase.ts`.

---

**Status**: ✅ Implementation complete
**Testing**: Pending deployment and user testing
**Next**: Deploy Cloud Functions to production
