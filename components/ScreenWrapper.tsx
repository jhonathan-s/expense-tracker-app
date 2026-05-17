import { ScreenWrapperProps } from '@/types'
import React from 'react'
import { StatusBar, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/theme'

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: colors.neutral900
        },
        style
      ]}>
      <StatusBar barStyle='light-content' backgroundColor={colors.neutral900} />
      {children}
    </SafeAreaView>
  )
}

export default ScreenWrapper

const styles = StyleSheet.create({})
