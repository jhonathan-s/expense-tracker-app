import { colors } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import { At, Lock } from 'phosphor-react-native'
import React, { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ScreenWrapper from '../../components/ScreenWrapper'
import Typo from '../../components/Typo'
import { spacingX, spacingY } from '../../constants/theme'

const Login = () => {
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login: loginUser } = useAuth()

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert('Entrar', 'Por favor, preencha todos os campos')
      return
    }
    setIsLoading(true)
    const response = await loginUser(emailRef.current, passwordRef.current)
    setIsLoading(false)
    if (!response.success) {
      Alert.alert('Login', response.msg)
      return
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={'800'}>
            Olá,
          </Typo>
          <Typo size={30} fontWeight={'800'}>
            Bem-vindo de volta
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Faça login para rastrear todas as suas despesas
          </Typo>
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

          <Typo size={14} color={colors.text} style={{ alignSelf: 'flex-end' }}>
            Esqueceu a senha?
          </Typo>

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={'700'} color={colors.black} size={21}>
              Entrar
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo size={15}>Não tem uma conta?</Typo>
          <Pressable onPress={() => router.navigate('/(auth)/register')}>
            <Typo size={15} fontWeight='700' color={colors.primary}>
              Inscrever-se
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Login

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
