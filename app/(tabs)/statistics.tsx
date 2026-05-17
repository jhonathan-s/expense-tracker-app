import Header from '@/components/Header'
import Loading from '@/components/Loading'
import ScreenWrapper from '@/components/ScreenWrapper'
import TransactionList from '@/components/TransactionList'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import {
  fetchMonthlyStats
} from '@/services/transactionService'
import { scale, verticalScale } from '@/utils/styling'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'

const Statistics = () => {
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const { user } = useAuth()

  const getMonthlyStats = async () => {
    setChartLoading(true)
    let res = await fetchMonthlyStats(user?.uid as string)
    setChartLoading(false)
    if (res.success) {
      setChartData(res?.data?.stats)
      setTransactions(res?.data?.transactions)
    } else {
      Alert.alert('Error', res?.msg)
    }
  }

  useEffect(() => {
    getMonthlyStats()
  }, [])

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

            {chartLoading && (
              <View style={styles.chartLoadingContainer}>
                <Loading color={colors.white} />
              </View>
            )}
          </View>

          <View>
            <TransactionList
              title='Transações'
              emptyListMessage='Nenhuma transação encontrada'
              data={transactions}
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
  chartLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius._12,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  header: {},
  noChart: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    height: verticalScale(210)
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    height: verticalScale(35),
    width: verticalScale(35),
    borderCurve: 'continuous'
  },
  container: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    gap: spacingY._10
  }
})
