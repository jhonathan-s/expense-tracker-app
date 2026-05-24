import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import Input from '@/components/Input'
import ModalWrapper from '@/components/ModalWrapper'
import Typo from '@/components/Typo'
import { expenseCategories, transactionTypes } from '@/constants/data'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import useFetchData from '@/hooks/useFetchData'
import {
  createOrUpdateTransaction,
  deleteTransaction
} from '@/services/transactionService'
import { TransactionType, WalletType } from '@/types'
import { scale, verticalScale } from '@/utils/styling'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { orderBy, where } from 'firebase/firestore'
import { Trash } from 'phosphor-react-native'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'

const TransactionModal = () => {
  const { user, updateUserData } = useAuth()
  const [transaction, setTransaction] = useState<TransactionType>({
    type: 'expense',
    amount: 0,
    description: '',
    category: '',
    date: new Date(),
    walletId: '',
    image: null
  })
  const router = useRouter()

  const {
    data: wallets,
    error: walletError,
    loading: walletLoading
  } = useFetchData<WalletType>('wallets', [
    where('uid', '==', user?.uid),
    orderBy('created', 'desc')
  ])

  const [loading, setLoading] = useState<boolean>(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  type paramType = {
    id?: string
    type?: string
    amount?: string
    category?: string
    date?: string
    description?: string
    image?: string
    walletId?: string
    uid?: string
  }

  const oldTransaction: paramType = useLocalSearchParams()

  const onDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || transaction.date
    setTransaction({ ...transaction, date: currentDate })
    setShowDatePicker(Platform.OS == 'ios' ? true : false)
  }

  useEffect(() => {
    if (oldTransaction?.id) {
      setTransaction({
        type: oldTransaction.type || 'expense',
        amount: Number(oldTransaction.amount || 0),
        description: oldTransaction.description || '',
        category: oldTransaction.category || '',
        date: new Date(oldTransaction.date || new Date()),
        walletId: oldTransaction.walletId || '',
        image: oldTransaction.image || null
      })
    }
  }, [])

  const onSubmit = async () => {
    const { type, amount, description, category, date, walletId, image } =
      transaction

    if (!walletId || !date || !amount || (type == 'expense' && !category)) {
      Alert.alert('Transação', 'Por favor, preencha todos os campos')
      return
    }

    console.log('Good to go')

    let transactionData: TransactionType = {
      type,
      amount,
      description,
      category,
      date,
      walletId,
      image: image ? image : null,
      uid: user?.uid
    }

    console.log('Transaction Data: ', transactionData)

    if (oldTransaction?.id) {
      transactionData.id = oldTransaction.id
    }
    setLoading(true)
    const res = await createOrUpdateTransaction(transactionData)
    setLoading(false)
    if (res.success) {
      router.back()
    } else {
      Alert.alert('Transação', res.msg || 'Algo deu errado')
    }
  }

  const onDelete = async () => {
    if (!oldTransaction?.id || !oldTransaction?.walletId) return
    setLoading(true)
    const res = await deleteTransaction(
      oldTransaction.id,
      oldTransaction.walletId
    )
    setLoading(false)
    console.log('res', res)
    console.log('res.success', res.success)
    if (res.success) {
      router.back()
    } else Alert.alert('Transação', res.msg || 'Algo deu errado')
  }

  const showDeleteAlert = () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja deletar esta transação?',
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
          title={oldTransaction?.id ? 'Atualizar Transação' : 'Nova Transação'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Tipo
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              iconStyle={styles.dropdownIcon}
              data={transactionTypes}
              maxHeight={300}
              labelField='label'
              valueField='value'
              placeholder={'Selecionar tipo'}
              value={transaction.type}
              onChange={(item) => {
                setTransaction({ ...transaction, type: item.value })
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Carteira
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              iconStyle={styles.dropdownIcon}
              data={wallets.map((wallet) => ({
                label: `${wallet?.name} (R$${wallet?.amount})`,
                value: wallet?.id
              }))}
              maxHeight={300}
              labelField='label'
              valueField='value'
              placeholder={'Selecionar carteira'}
              value={transaction.walletId}
              onChange={(item) => {
                setTransaction({ ...transaction, walletId: item.value || '' })
              }}
            />
          </View>

          {transaction.type == 'expense' && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200} size={16}>
                Categoria de Despesa
              </Typo>
              <Dropdown
                style={styles.dropdownContainer}
                activeColor={colors.neutral700}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropdownListContainer}
                iconStyle={styles.dropdownIcon}
                data={Object.values(expenseCategories)}
                maxHeight={300}
                labelField='label'
                valueField='value'
                placeholder={'Selecionar categoria'}
                value={transaction.category}
                onChange={(item) => {
                  setTransaction({
                    ...transaction,
                    category: item.value || ''
                  })
                }}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Data
            </Typo>

            {Platform.OS === 'web' ? (
              <>
                <style>{`
                  input[type="date"]::-webkit-calendar-picker-indicator { display: none; }
                  input[type="date"] { appearance: none; -webkit-appearance: none; }
                `}</style>
                <input
                  type="date"
                  value={
                    transaction.date instanceof Date && !isNaN((transaction.date as Date).getTime())
                      ? (transaction.date as Date).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => {
                    if (!e.target.value) return
                    const selected = new Date(e.target.value + 'T00:00:00')
                    if (!isNaN(selected.getTime())) {
                      setTransaction({ ...transaction, date: selected })
                    }
                  }}
                  style={{
                    height: verticalScale(54),
                    border: `1px solid ${colors.neutral300}`,
                    borderRadius: radius._17,
                    padding: '0 15px',
                    backgroundColor: 'transparent',
                    color: colors.white,
                    fontSize: verticalScale(14),
                    cursor: 'pointer',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  } as React.CSSProperties}
                />
              </>
            ) : (
              // Native date picker for iOS / Android
              <>
                {!showDatePicker && (
                  <Pressable
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}>
                    <Typo size={14}>
                      {(transaction.date as Date).toLocaleDateString()}
                    </Typo>
                  </Pressable>
                )}
                {showDatePicker && (
                  <View style={Platform.OS == 'ios' && styles.iosDatePicker}>
                    <DateTimePicker
                      themeVariant='dark'
                      value={transaction.date as Date}
                      textColor={colors.white}
                      mode='date'
                      display={Platform.OS == 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                    />
                    {Platform.OS == 'ios' && (
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(false)}>
                        <Typo size={15} fontWeight={'500'}>
                          Ok
                        </Typo>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Valor
            </Typo>
            <Input
              keyboardType='numeric'
              value={transaction?.amount?.toString()}
              onChangeText={(value) =>
                setTransaction({
                  ...transaction,
                  amount: Number(value.replace(/[^0-9]/g, ''))
                })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Descrição
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                (opcional)
              </Typo>
            </View>
            <Input
              value={transaction?.description}
              multiline
              containerStyle={{
                flexDirection: 'row',
                height: verticalScale(100),
                alignItems: 'flex-start',
                paddingVertical: 15
              }}
              onChangeText={(value) =>
                setTransaction({
                  ...transaction,
                  description: value
                })
              }
            />
          </View>

          {/* Receipt's image */}
          {/* <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Recibo
              </Typo>
              <Typo color={colors.neutral500} size={14}>
                (opcional)
              </Typo>
            </View>
            <ImageUpload
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) =>
                setTransaction({ ...transaction, image: file })
              }
              placeholder='Enviar Imagem'
            />
          </View> */}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {/* delete transaction */}
        {/* {oldTransaction?.id && !loading && (
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
            {oldTransaction?.id ? 'Atualizar' : 'Enviar'}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default TransactionModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40
  },
  inputContainer: {
    gap: spacingY._10
  },
  iosDropDown: {
    flexDirection: 'row',
    height: verticalScale(54),
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15
  },
  androidDropDown: {
    height: verticalScale(54),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous'
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5
  },
  dateInput: {
    flexDirection: 'row',
    height: verticalScale(54),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15
  },
  iosDatePicker: {
    // backgroundColor: "red",
  },
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: 'flex-end',
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: 'continuous'
  },
  dropdownItemText: { color: colors.white },
  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14)
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: 'continuous',
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5
  },
  dropdownPlaceholder: {
    color: colors.white
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300
  }
})