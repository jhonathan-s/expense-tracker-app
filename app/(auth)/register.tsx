import { StyleSheet, Text, View, Pressable, Alert } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Typo from '../../components/Typo'
import { spacingY, spacingX } from '../../constants/theme'
import { verticalScale } from '@/utils/styling'
import BackButton from '../../components/BackButton'
import { colors } from '@/constants/theme'
import Input from '../../components/Input'
import { At, Lock, User } from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import Button from '../../components/Button'
import { useAuth } from '@/contexts/authContext'

const Register = () => {
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const nameRef = useRef('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const { register: registerUser } = useAuth()

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current || !nameRef.current) {
      Alert.alert('Inscrição', 'Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)
    const res = await registerUser(
      emailRef.current,
      passwordRef.current,
      nameRef.current
    )
    setIsLoading(false)
    console.log('Register res', res)
    if (!res.success) {
      Alert.alert('Sign up', res.msg)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={'800'}>
            Vamos
          </Typo>
          <Typo size={30} fontWeight={'800'}>
            Começar
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Crie uma conta para rastrear todas as suas despesas
          </Typo>
          <Input
            placeholder={'Digite seu nome'}
            onChangeText={(value) => (nameRef.current = value)}
            icon={
              <User
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />
          <Input
            placeholder={'Digite seu email'}
            onChangeText={(value) => (emailRef.current = value)}
            icon={
              <At
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />
          <Input
            placeholder={'Digite sua senha'}
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
            icon={
              <Lock
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={'700'} color={colors.black} size={21}>
              Inscrever-se
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo size={15}>Já tem uma conta?</Typo>
          <Pressable onPress={() => router.navigate('/(auth)/login')}>
            <Typo size={15} fontWeight='700' color={colors.primary}>
              Entrar
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: 'bold',
    color: colors.text
  },
  form: {
    gap: spacingY._20
  },
  forgotPassword: {
    textAlign: 'right',
    fontWeight: '500',
    color: colors.text
  },
  footer: {
    flowDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  footerText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: verticalScale(15)
  }
})
