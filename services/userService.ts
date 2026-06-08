import { auth, firestore } from '@/config/firebase'
import { ResponseType, UserDataType } from '@/types'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { uploadFileToCloudinary } from './imageService'

export const updateUser = async (uid: string, updatedData: UserDataType) => {
  try {
    if (updatedData.image && updatedData?.image?.uri) {
      const imageUploadRes = await uploadFileToCloudinary(
        updatedData.image,
        'users'
      )
      if (!imageUploadRes.success) {
        return {
          success: false,
          message: imageUploadRes.message || 'Failed to upload image'
        }
      }
      updatedData.image = imageUploadRes.data
    }
    const userRef = doc(firestore, 'users', uid)
    await updateDoc(userRef, updatedData)

    return { success: true, message: 'User updated successfully' }
  } catch (error: any) {
    console.log('Error updating user:', error)
    return { success: false, message: error?.message }
  }
}

export const deleteAccount = async (
  uid: string,
  email: string,
  password: string
): Promise<ResponseType> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return {
        success: false,
        message: 'No user is currently logged in'
      }
    }

    // Reauthenticate to ensure user confirmed their password
    const credential = EmailAuthProvider.credential(email, password)
    await reauthenticateWithCredential(currentUser, credential)

    // Delete all transactions for this user
    await deleteUserTransactions(uid)

    // Delete all wallets for this user
    await deleteUserWallets(uid)

    // Delete user document from Firestore
    const userRef = doc(firestore, 'users', uid)
    await deleteDoc(userRef)

    // Delete Firebase Auth user account
    await deleteUser(currentUser)

    return {
      success: true,
      message: 'Account and all associated data deleted successfully'
    }
  } catch (error: any) {
    console.log('Error deleting account:', error)
    let message = error?.message || 'Failed to delete account'

    if (error.code === 'auth/wrong-password') {
      message = 'Invalid password'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email'
    } else if (error.code === 'auth/requires-recent-login') {
      message = 'Please logout and login again before deleting your account'
    }

    return { success: false, message }
  }
}

const deleteUserTransactions = async (uid: string): Promise<void> => {
  try {
    let hasMoreTransactions = true

    while (hasMoreTransactions) {
      const transactionQuery = query(
        collection(firestore, 'transactions'),
        where('uid', '==', uid)
      )

      const transactionSnapshot = await getDocs(transactionQuery)
      if (transactionSnapshot.size === 0) {
        hasMoreTransactions = false
        break
      }

      const batch = writeBatch(firestore)
      transactionSnapshot.forEach((transactionDoc) => {
        batch.delete(transactionDoc.ref)
      })

      await batch.commit()
      console.log(`${transactionSnapshot.size} transactions deleted for user ${uid}`)
    }
  } catch (error: any) {
    console.log('Error deleting user transactions:', error)
    throw error
  }
}

const deleteUserWallets = async (uid: string): Promise<void> => {
  try {
    let hasMoreWallets = true

    while (hasMoreWallets) {
      const walletQuery = query(
        collection(firestore, 'wallets'),
        where('uid', '==', uid)
      )

      const walletSnapshot = await getDocs(walletQuery)
      if (walletSnapshot.size === 0) {
        hasMoreWallets = false
        break
      }

      const batch = writeBatch(firestore)
      walletSnapshot.forEach((walletDoc) => {
        batch.delete(walletDoc.ref)
      })

      await batch.commit()
      console.log(`${walletSnapshot.size} wallets deleted for user ${uid}`)
    }
  } catch (error: any) {
    console.log('Error deleting user wallets:', error)
    throw error
  }
}
