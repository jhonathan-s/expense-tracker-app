import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

admin.initializeApp()

/**
 * Delete a user from both Firebase Authentication and Firestore
 * Can only be called by admin users
 */
export const deleteUserAccount = onCall(
  {
    region: 'us-east1',
    enforceAppCheck: false,
    cors: true
  },
  async (request) => {
    const uid = request.data.uid as string

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'User UID is required'
      )
    }

    // Verify the request is from an authenticated user
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be authenticated to call this function'
      )
    }

    try {
      // Check if the caller is an admin
      const callerDoc = await admin.firestore().collection('users').doc(request.auth.uid).get()
      const callerData = callerDoc.data()

      // You can customize this check based on your app's admin logic
      const isAdmin = request.auth.token.email === 'admin@admin.com' || callerData?.isAdmin === true

      if (!isAdmin) {
        throw new HttpsError(
          'permission-denied',
          'Only admins can delete user accounts'
        )
      }

      // Delete the user from Firebase Authentication
      await admin.auth().deleteUser(uid)

      // Delete the user document from Firestore
      await admin.firestore().collection('users').doc(uid).delete()

      return {
        success: true,
        message: `User ${uid} has been successfully deleted from Authentication and Firestore.`
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)

      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError(
          'not-found',
          'User not found in Firebase Authentication'
        )
      }

      throw new HttpsError(
        'internal',
        error.message || 'Error deleting user account'
      )
    }
  }
)
