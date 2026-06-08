import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { firestore } from '@/config/firebase'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import { fetchAllUsers, AdminUser } from '@/services/adminService'
import { verticalScale } from '@/utils/styling'
import { useFocusEffect } from '@react-navigation/native'
import { Lock, Trash, WarningCircle, X } from 'phosphor-react-native'
import React, { useCallback, useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore'

const Admin = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<AdminUser | null>(null)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  )
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)

  const isAdmin = user?.email === 'admin@admin.com'

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await fetchAllUsers()
    if (result.success && result.data) {
      setUsers(result.data)
    } else {
      setMessage({
        type: 'error',
        text: result.message || 'Erro ao carregar usuários.'
      })
    }
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        loadUsers()
      }
    }, [isAdmin, loadUsers])
  )

  const handleDeleteAccountPress = (userItem: AdminUser) => {
    setSelectedUserForDelete(userItem)
    setDeleteAccountModalVisible(true)
  }

  const handleDeleteAccountConfirm = async () => {
    if (!selectedUserForDelete) return

    setDeleteAccountLoading(true)
    setDeleteError('')

    try {
      // Delete as admin (without password requirement)
      await deleteUserTransactions(selectedUserForDelete.uid)
      await deleteUserWallets(selectedUserForDelete.uid)

      // Delete user document
      const userRef = doc(firestore, 'users', selectedUserForDelete.uid)
      await deleteDoc(userRef)

      setDeleteAccountModalVisible(false)
      setMessage({
        type: 'success',
        text: 'Conta e todos os dados associados foram deletados com sucesso.'
      })
      setUsers((prevUsers) =>
        prevUsers.filter((u) => u.uid !== selectedUserForDelete.uid)
      )
      setSelectedUserForDelete(null)

      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      setDeleteError(error?.message || 'Ocorreu um erro ao deletar a conta.')
    } finally {
      setDeleteAccountLoading(false)
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
      }
    } catch (error: any) {
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
      }
    } catch (error: any) {
      throw error
    }
  }

  if (!isAdmin) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Header
            title='Admin'
            style={{ marginVertical: spacingY._10 }}
            leftIcon={
              <Lock size={24} color={colors.primary} weight='fill' />
            }
          />

          <View style={styles.restrictedContainer}>
            <WarningCircle
              size={verticalScale(64)}
              color={colors.rose}
              weight='fill'
            />
            <Typo size={18} fontWeight='700' style={styles.restrictedTitle}>
              Acesso Restrito
            </Typo>
            <Typo
              size={15}
              color={colors.neutral400}
              style={styles.restrictedMessage}>
              Esta página é apenas para administradores
            </Typo>
          </View>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header
          title='Gerenciar Usuários'
          style={{ marginVertical: spacingY._10 }}
        />

        {message && (
          <Animated.View
            entering={FadeInDown}
            style={[
              styles.messageBox,
              {
                backgroundColor:
                  message.type === 'success'
                    ? colors.green
                    : colors.rose
              }
            ]}>
            <Typo size={14} fontWeight='600' color={colors.white}>
              {message.text}
            </Typo>
          </Animated.View>
        )}

        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size='large' color={colors.primary} />
          </View>
        )}

        {!loading && users.length === 0 && (
          <View style={styles.centerContent}>
            <Typo size={16} color={colors.neutral400}>
              Nenhum usuário encontrado
            </Typo>
          </View>
        )}

        {!loading && users.length > 0 && (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 50)
                  .springify()
                  .damping(14)}>
                <View style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameContainer}>
                      <Typo
                        size={16}
                        fontWeight='600'
                        color={colors.neutral100}>
                        {item.name || 'Sem nome'}
                      </Typo>
                      <Typo
                        size={13}
                        color={colors.neutral400}
                        style={styles.email}>
                        {item.email}
                      </Typo>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.deleteAccountButton]}
                    onPress={() => handleDeleteAccountPress(item)}
                    disabled={item.uid === user?.uid}>
                    <Trash size={18} color={colors.white} weight='fill' />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
        )}
      </View>

      <Modal
        transparent
        animationType='fade'
        visible={deleteAccountModalVisible}
        onRequestClose={() => !deleteAccountLoading && setDeleteAccountModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalCloseIcon}
              onPress={() => !deleteAccountLoading && setDeleteAccountModalVisible(false)}
              disabled={deleteAccountLoading}>
              <X size={20} color={colors.neutral300} weight='bold' />
            </Pressable>

            <WarningCircle
              size={verticalScale(48)}
              color={'#dc2626'}
              weight='fill'
            />

            <Typo size={18} fontWeight='700' style={styles.modalTitle}>
              Deletar Conta Completamente
            </Typo>

            <Typo size={15} color={colors.textLighter} style={styles.modalMessage}>
              Esta ação é irreversível. Todos os dados de{' '}
              <Typo size={15} fontWeight='700' color={'#dc2626'}>
                {selectedUserForDelete?.name}
              </Typo>
              {' '}(carteiras, transações, recibos) serão deletados permanentemente.
            </Typo>

            <Typo
              size={13}
              color={colors.neutral400}
              style={styles.modalSubMessage}>
              Esta ação irá deletar o usuário de Firestore e Firebase
              Authentication permanentemente.
            </Typo>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteAccountModalVisible(false)}
                disabled={deleteAccountLoading}>
                <Typo size={15} fontWeight='700' color={colors.text}>
                  Cancelar
                </Typo>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.deleteAccountButtonModal]}
                onPress={handleDeleteAccountConfirm}
                disabled={deleteAccountLoading}>
                {deleteAccountLoading ? (
                  <ActivityIndicator size='small' color={colors.white} />
                ) : (
                  <Typo size={15} fontWeight='700' color={colors.white}>
                    Deletar
                  </Typo>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default Admin

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingY._15
  },
  restrictedTitle: {
    marginTop: spacingY._15
  },
  restrictedMessage: {
    textAlign: 'center',
    maxWidth: '80%'
  },
  messageBox: {
    marginTop: spacingY._15,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._10,
    marginBottom: spacingY._15
  },
  list: {
    marginTop: spacingY._15
  },
  listContent: {
    paddingBottom: verticalScale(120)
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.neutral700
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._12
  },
  userNameContainer: {
    flex: 1,
    gap: spacingY._5
  },
  email: {
    // marginTop: spacingY._30
  },
  deleteAccountButton: {
    width: verticalScale(44),
    height: verticalScale(44),
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dc2626'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingX._20
  },
  modalContainer: {
    width: '100%',
    backgroundColor: colors.neutral800,
    borderRadius: 20,
    paddingVertical: spacingY._30,
    paddingHorizontal: spacingX._20,
    alignItems: 'center',
    gap: spacingY._10
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4
  },
  modalTitle: {
    marginTop: spacingY._10
  },
  modalMessage: {
    textAlign: 'center',
    lineHeight: 22
  },
  modalSubMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacingY._5
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacingX._10,
    marginTop: spacingY._15,
    width: '100%'
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: colors.neutral600
  },
  deleteAccountButtonModal: {
    backgroundColor: '#dc2626'
  },
  errorText: {
    textAlign: 'center'
  }
})
