import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { auth } from '@/config/firebase'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import { getProfileImage } from '@/services/imageService'
import { accountOptionType } from '@/types'
import { verticalScale } from '@/utils/styling'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { signOut } from 'firebase/auth'
import { CaretRight, Power, User, WarningCircle, X } from 'phosphor-react-native'
import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

const Profile = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)

  const accountOptions: accountOptionType[] = [
    {
      title: 'Editar Perfil',
      icon: <User size={26} color={colors.white} weight='fill' />,
      routeName: '/(modals)/profileModal',
      bgColor: '#6366f1'
    },
    {
      title: 'Sair',
      icon: <Power size={26} color={colors.white} weight='fill' />,
      bgColor: '#e11d48'
    }
  ]

  const handleLogout = async () => {
    setLogoutModalVisible(false)
    await signOut(auth)
  }

  const handlePress = (item: accountOptionType) => {
    if (item.title == 'Sair') {
      setLogoutModalVisible(true)
      return
    }
    if (item.routeName) {
      router.push(item.routeName)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title='Perfil' style={{ marginVertical: spacingY._10 }} />

        <View style={styles.userInfo}>
          <View style={styles.avaterContainer}>
            <Image
              style={styles.avatar}
              source={getProfileImage(user?.image)}
              contentFit='cover'
              transition={100}
            />
          </View>

          <View style={styles.nameContainer}>
            <Typo size={24} fontWeight={'600'} color={colors.neutral100}>
              {user?.name}
            </Typo>
            <Typo size={15} color={colors.neutral400}>
              {user?.email}
            </Typo>
          </View>
        </View>

        <View style={styles.accountOptions}>
          {accountOptions.map((option, index) => {
            return (
              <Animated.View
                key={index.toString()}
                entering={FadeInDown.delay(index * 50)
                  .springify()
                  .damping(14)}
                style={styles.listItem}>
                <TouchableOpacity
                  style={styles.flexRow}
                  onPress={() => handlePress(option)}>
                  <View
                    style={[
                      styles.listIcon,
                      { backgroundColor: option.bgColor }
                    ]}>
                    {option.icon && option.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight={'500'}>
                    {option.title}
                  </Typo>
                  <CaretRight
                    size={verticalScale(20)}
                    weight='bold'
                    color={colors.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        animationType='fade'
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalCloseIcon}
              onPress={() => setLogoutModalVisible(false)}
            >
              <X size={20} color={colors.neutral300} weight='bold' />
            </Pressable>

            <WarningCircle
              size={verticalScale(48)}
              color={'#e11d48'}
              weight='fill'
            />

            <Typo size={18} fontWeight='700' style={styles.modalTitle}>
              Sair
            </Typo>

            <Typo size={15} color={colors.textLighter} style={styles.modalMessage}>
              Tem certeza que deseja sair?
            </Typo>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Typo size={15} fontWeight='700' color={colors.text}>
                  Cancelar
                </Typo>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Typo size={15} fontWeight='700' color={colors.white}>
                  Sair
                </Typo>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20
  },
  userInfo: {
    marginTop: verticalScale(30),
    alignItems: 'center',
    gap: spacingY._15
  },
  avaterContainer: {
    position: 'relative',
    alignSelf: 'center'
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: 5
  },
  nameContainer: {
    gap: verticalScale(4),
    alignItems: 'center'
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._15,
    borderCurve: 'continuous'
  },
  listItem: {
    marginBottom: verticalScale(17)
  },
  accountOptions: {
    marginTop: spacingY._35,
    paddingBottom: verticalScale(110)
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10
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
  modalActions: {
    flexDirection: 'row',
    gap: spacingX._10,
    marginTop: spacingY._10,
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
  logoutButton: {
    backgroundColor: '#e11d48'
  }
})