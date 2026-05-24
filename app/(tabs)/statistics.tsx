import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import TransactionList from '@/components/TransactionList'
import { spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import { TransactionType } from '@/types'
import { verticalScale } from '@/utils/styling'
import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { orderBy, where, Timestamp } from 'firebase/firestore'

const Statistics = () => {
  const { user } = useAuth()

  const constraints = useMemo(
    () => (user?.uid ? [where('uid', '==', user.uid), orderBy('date', 'desc')] : []),
    [user?.uid]
  )

  const { data: allTransactions, loading: transactionLoading } =
    useFetchData<TransactionType>('transactions', constraints)

  const transactions = useMemo(() => {
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    return allTransactions.filter((transaction) => {
      const transactionDate = (transaction.date as Timestamp).toDate()
      return transactionDate >= startOfYear && transactionDate <= today
    })
  }, [allTransactions])


  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header title='Todas as Transações' />
        </View>

        <ScrollView
          contentContainerStyle={{
            gap: spacingY._20,
            paddingTop: spacingY._5,
            paddingBottom: verticalScale(100)
          }}>
          <View>
            <TransactionList
              title='Transações'
              emptyListMessage='Nenhuma transação encontrada'
              data={transactions}
              loading={transactionLoading}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default Statistics

const styles = StyleSheet.create({
  header: {},
  container: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    gap: spacingY._10
  }
})
