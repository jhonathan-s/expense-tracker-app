import BackButton from '@/components/BackButton'
import Header from '@/components/Header'
import Input from '@/components/Input'
import ModalWrapper from '@/components/ModalWrapper'
import TransactionList from '@/components/TransactionList'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import { TransactionType } from '@/types'
import { useRouter } from 'expo-router'
import { orderBy, where } from 'firebase/firestore'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const SearchModal = () => {
  const { user, updateUserData } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<boolean>(false)

  const constraints = [where('uid', '==', user?.uid), orderBy('date', 'desc')]

  const {
    data: allTransactions,
    error,
    loading: transactionLoading
  } = useFetchData<TransactionType>('transactions', constraints)

  const filteredTransactions = allTransactions?.filter((item) => {
    if (search?.length > 1) {
      if (
        item.category?.toLowerCase()?.includes(search?.toLowerCase()) ||
        item?.type?.toLowerCase()?.includes(search?.toLowerCase()) ||
        item?.description?.toLowerCase()?.includes(search?.toLowerCase())
      ) {
        return true
      }
      return false
    }
    return true
  })
  return (
    <ModalWrapper style={{ backgroundColor: colors.neutral900 }}>
      <View style={styles.container}>
        <Header
          title={'Pesquisar'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Input
              placeholder='Sapatos...'
              value={search}
              placeholderTextColor={colors.neutral400}
              containerStyle={{ backgroundColor: colors.neutral800 }}
              onChangeText={(value) => setSearch(value)}
            />
          </View>

          <View>
            <TransactionList
              loading={transactionLoading}
              data={filteredTransactions}
              emptyListMessage='Nenhuma transação corresponde às suas palavras-chave de pesquisa'
            />
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  )
}

export default SearchModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center'
  },
  inputContainer: {
    gap: spacingY._10
  }
})
