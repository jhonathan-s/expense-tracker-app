import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence, indexedDBLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyD2naJiPXRKfmV__kncQag7sUFqNz1gSZI",
  authDomain: "expense-tracker-ee165.firebaseapp.com",
  projectId: "expense-tracker-ee165",
  storageBucket: "expense-tracker-ee165.firebasestorage.app",
  messagingSenderId: "313985431681",
  appId: "1:313985431681:web:57332403865b76d6d73580"
}

const app = initializeApp(firebaseConfig)

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? indexedDBLocalPersistence          // web browser
    : getReactNativePersistence(AsyncStorage)  // iOS / Android
})

export const firestore = getFirestore(app)

export const functions = getFunctions(app, 'us-east1')