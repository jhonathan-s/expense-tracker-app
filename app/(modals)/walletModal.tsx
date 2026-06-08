import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import Input from '@/components/Input'
import ModalWrapper from '@/components/ModalWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService'
import { WalletType } from '@/types'
import { scale, verticalScale } from '@/utils/styling'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Trash } from 'phosphor-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'

const WalletModal = () => {
  const { user, updateUserData } = useAuth()
  const [wallet, setWallet] = useState<WalletType>({
    name: '',
    image: null
  })
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)

  const oldWallet: { name: string; image: string; id: string } =
    useLocalSearchParams()

  useEffect(() => {
    if (oldWallet?.id) {
      setWallet({
        name: oldWallet.name,
        image: oldWallet.image
      })
    }
  }, [])

  const onSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado')
      return
    }
    let { name, image } = wallet
    if (!name.trim() || !image) {
      Alert.alert('Carteira', 'Por favor, preencha todos os campos.')
      return
    }
    const data: WalletType = {
      name,
      image,
      uid: user.uid
    }
    if (oldWallet?.id) data.id = oldWallet.id
    setLoading(true)
    const res = await createOrUpdateWallet(data)
    setLoading(false)
    if (res.success) {
      router.back()
    } else Alert.alert('Carteira', res.msg)
  }

  const onDelete = async () => {
    if (!oldWallet?.id) return
    setLoading(true)
    const res = await deleteWallet(oldWallet.id)
    setLoading(false)
    if (res.success) {
      router.back()
    } else Alert.alert('Carteira', res.msg || 'Algo deu errado')
  }

  const showDeleteAlert = () => {
    Alert.alert(
      'Deletar Carteira',
      'Tem certeza que deseja deletar esta carteira?',
      [
        {
          text: 'Cancelar',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel'
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => onDelete()
        }
      ]
    )
  }

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldWallet?.id ? 'Atualizar Carteira' : 'Nova Carteira'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Nome da Carteira</Typo>
            <Input
              placeholder='Salário'
              value={wallet.name}
              onChangeText={(value) => setWallet({ ...wallet, name: value })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Ícone da Carteira</Typo>
            <ImageUpload
              file={wallet.image}
              onClear={() => setWallet({ ...wallet, image: null })}
              onSelect={(file) => setWallet({ ...wallet, image: file })}
              placeholder='Enviar Imagem'
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {/* Delete wallet */}
{/*         {oldWallet?.id && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15
            }}>
            <Trash
              color={colors.white}
              size={verticalScale(24)}
              weight='bold'
            />
          </Button>
        )} */}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={'700'}>
            {oldWallet?.id ? 'Atualizar Carteira' : 'Adicionar Carteira'}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default WalletModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center'
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7
  },
  inputContainer: {
    gap: spacingY._10
  }
})
