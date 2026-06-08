import { firestore, functions } from '@/config/firebase'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

export interface AdminUser {
  uid: string
  email: string | null
  name: string | null
  image?: any
}

export const fetchAllUsers = async (): Promise<{
  success: boolean
  data?: AdminUser[]
  message?: string
}> => {
  try {
    const usersRef = collection(firestore, 'users')
    const snapshot = await getDocs(usersRef)
    const users: AdminUser[] = []

    snapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        email: doc.data().email,
        name: doc.data().name,
        image: doc.data().image
      })
    })

    return { success: true, data: users }
  } catch (error: any) {
    console.log('Error fetching users:', error)
    return {
      success: false,
      message: error?.message || 'Erro ao buscar usuários.'
    }
  }
}

export const deleteUserFromFirestore = async (uid: string): Promise<{
  success: boolean
  message?: string
}> => {
  try {
    const userRef = doc(firestore, 'users', uid)
    await deleteDoc(userRef)
    return { success: true, message: 'Usuário deletado do Firestore.' }
  } catch (error: any) {
    console.log('Erro ao deletar usuário do Firestore:', error)
    return {
      success: false,
      message: error?.message || 'Erro ao deletar usuário do Firestore.'
    }
  }
}

export const deleteUser = async (uid: string): Promise<{
  success: boolean
  message?: string
}> => {
  try {
    // Call the Cloud Function to delete from both Auth and Firestore
    const deleteUserAccountFn = httpsCallable(functions, 'deleteUserAccount')
    const result = await deleteUserAccountFn({ uid })

    if (result.data.success) {
      return {
        success: true,
        message: 'Usuário deletado com sucesso de Autenticação e Firestore.'
      }
    } else {
      return {
        success: false,
        message: result.data.message || 'Erro ao deletar usuário.'
      }
    }
  } catch (error: any) {
    console.log('Error deleting user:', error)
    
    // Provide user-friendly error messages
    if (error.code === 'functions/permission-denied') {
      return {
        success: false,
        message: 'Apenas administradores podem deletar usuários.'
      }
    } else if (error.code === 'functions/not-found') {
      return {
        success: false,
        message: 'Usuário não encontrado em Autenticação Firebase.'
      }
    } else if (error.code === 'functions/unauthenticated') {
      return {
        success: false,
        message: 'Você deve estar autenticado para deletar um usuário.'
      }
    }

    return {
      success: false,
      message: error?.message || 'Erro ao deletar usuário.'
    }
  }
}
