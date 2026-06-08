# Firebase Cloud Functions Setup

This directory contains the Firebase Cloud Functions for the Expense Tracker app.

## Overview

The `deleteUserAccount` function handles secure user deletion from both Firebase Authentication and Firestore. This function:

- Requires admin authentication
- Verifies the caller is an admin user
- Deletes the user from Firebase Authentication (using Admin SDK)
- Deletes the user document from Firestore
- Returns detailed error messages for debugging

## Setup Instructions

### 1. Install Firebase CLI

If you haven't already, install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate. Make sure you use the Google account associated with your Firebase project.

### 3. Initialize Firebase (if not done yet)

```bash
firebase init
```

During initialization, select:
- Functions
- Firestore
- Your existing Firebase project (expense-tracker-ee165)
- TypeScript
- ESLint (optional)
- Install dependencies (yes)

### 4. Install Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

### 5. Deploy Cloud Functions

From the root directory, run:

```bash
firebase deploy --only functions
```

This will compile the TypeScript code and deploy the `deleteUserAccount` function to your Firebase project.

## Testing the Function

You can test the function using the Firebase Emulator or Firebase Console:

### Using Emulator (Local Testing)

```bash
firebase emulators:start --only functions
```

Then use the Firebase Console locally to test the function.

### Using Firebase Console (Production)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Functions
4. Click on `deleteUserAccount`
5. Go to the Testing tab
6. Create a test payload:
   ```json
   {
     "uid": "user-id-to-delete"
   }
   ```

## Cloud Function Details

### Function Name
`deleteUserAccount`

### Trigger Type
Callable HTTPS function

### Parameters
- `uid` (string, required): The Firebase User ID to delete

### Authentication
- User must be authenticated
- User must be an admin (email = 'admin@admin.com' or isAdmin = true in Firestore)

### Return Value
```typescript
{
  success: boolean
  message: string
}
```

### Error Codes
- `invalid-argument`: UID not provided
- `unauthenticated`: User not authenticated
- `permission-denied`: User is not an admin
- `not-found`: User not found in Firebase Authentication
- `internal`: Other errors

## Usage in App

The app calls this function through the `deleteUser` function in `services/adminService.ts`:

```typescript
const result = await deleteUser(userUid)
if (result.success) {
  // User deleted successfully
} else {
  // Handle error
}
```

## Important Notes

1. **Admin Verification**: The function checks if the caller is admin by:
   - Email check: `admin@admin.com`
   - Firestore check: `isAdmin = true` in users collection

   Customize this logic if needed.

2. **Region**: The function is deployed to `us-east1`. Change the region in `src/index.ts` if needed.

3. **Permissions**: Make sure your Firebase project has:
   - Cloud Functions API enabled
   - Firestore API enabled
   - Firebase Authentication enabled

4. **Billing**: Cloud Functions has a free tier that covers most development use cases.

## Troubleshooting

### Function Not Found Error
- Make sure you've deployed the functions: `firebase deploy --only functions`
- Check that the region matches in your app

### Permission Denied Error
- Verify the user is authenticated
- Check that the user is marked as admin in Firestore or uses the admin email

### User Not Found Error
- The UID is incorrect
- The user has already been deleted

## Environment Variables

If you need to set environment variables:

1. Create a `.env` file in the `functions` directory (it's gitignored)
2. Set your variables:
   ```
   ADMIN_EMAIL=admin@admin.com
   ```
3. Deploy with config:
   ```bash
   firebase functions:config:set admin.email="admin@admin.com"
   ```

## Next Steps

After deploying the Cloud Functions:
1. Test the function with a test user
2. Verify that users are deleted from both Firebase Auth and Firestore
3. Monitor the function logs in Firebase Console
4. Update your team on the deployment
