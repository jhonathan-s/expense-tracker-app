import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import TransactionList from '@/components/TransactionList'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import { TransactionType } from '@/types'
import { scale, verticalScale } from '@/utils/styling'
import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { orderBy, where, Timestamp } from 'firebase/firestore'
import { getLast12Months } from '@/utils/common'
import { colors as themeColors } from '@/constants/theme'

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

  const chartData = useMemo(() => {
    const monthlyData = getLast12Months()
    const currentYear = new Date().getFullYear()

    transactions.forEach((transaction) => {
      if (!transaction.date || !transaction.amount || !transaction.type) return

      const transactionDate = (transaction.date as Timestamp).toDate()
      const transactionMonth = transactionDate.getMonth()
      const transactionYear = transactionDate.getFullYear()

      const monthData = monthlyData.find((month) => {
        const [monthName] = month.month.split(' ')
        const monthIndex = [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez'
        ].indexOf(monthName)
        const yearFromMonth = parseInt(month.month.split(' ')[1], 10) + 2000

        return monthIndex === transactionMonth && yearFromMonth === transactionYear
      })

      if (monthData) {
        const amount = Number(transaction.amount)
        if (transaction.type === 'income') {
          monthData.income += amount
        } else if (transaction.type === 'expense') {
          monthData.expense += amount
        }
      }
    })

    return monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: themeColors.primary
      },
      { value: month.expense, frontColor: themeColors.rose }
    ])
  }, [transactions])

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header title='Estatísticas' />
        </View>

        <ScrollView
          contentContainerStyle={{
            gap: spacingY._20,
            paddingTop: spacingY._5,
            paddingBottom: verticalScale(100)
          }}>
          <View style={styles.chartContainer}>
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                barWidth={scale(12)}
                spacing={scale(25)}
                roundedBottom
                roundedTop
                hideRules
                yAxisLabelPrefix='R$'
                yAxisThickness={0}
                xAxisThickness={0}
                yAxisLabelWidth={scale(38)}
                yAxisTextStyle={{ color: colors.neutral350 }}
                xAxisLabelTextStyle={{
                  color: colors.neutral350,
                  fontSize: verticalScale(12)
                }}
                noOfSections={3}
                minHeight={5}
                isAnimated={true}
                animationDuration={1000}
              />
            ) : (
              <View style={styles.noChart} />
            )}
          </View>

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
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {},
  noChart: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    height: verticalScale(210)
  },
  container: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    gap: spacingY._10
  }
})
