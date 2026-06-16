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

// Inicializa o app Firebase com as configurações do projeto (apiKey, authDomain, etc.)
const app = initializeApp(firebaseConfig)

// Configura o serviço de autenticação com persistência adaptada à plataforma:
// - No navegador web, usa IndexedDB (padrão do Firebase para web)
// - No iOS/Android, usa AsyncStorage (solução de armazenamento local do React Native)
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? indexedDBLocalPersistence          // mantém sessão no navegador
    : getReactNativePersistence(AsyncStorage)  // mantém sessão no dispositivo móvel
})

// Instância do Firestore — banco de dados NoSQL em tempo real do projeto
export const firestore = getFirestore(app)

// Instância do Cloud Functions apontando para a região us-east1
export const functions = getFunctions(app, 'us-east1')