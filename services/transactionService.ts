import { firestore } from '@/config/firebase'
import { colors } from '@/constants/theme'
import { ResponseType, TransactionType, WalletType } from '@/types'
import { getLast12Months, getLast7Days, getYearsRange } from '@/utils/common'
import { scale } from '@/utils/styling'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { uploadFileToCloudinary } from './imageService'
import { createOrUpdateWallet } from './walletService'

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount, image } = transactionData
    if (!amount || amount <= 0 || !type) {
      return {
        success: false,
        msg: 'Invalid transaction data'
      }
    }

    if (id) {
      // todo: update existing transaction
      const oldTransactionSnapshot = await getDoc(
        doc(firestore, 'transactions', id)
      )

      const oldTransaction = oldTransactionSnapshot.data() as TransactionType

      const shouldRevertOriginal =
        oldTransaction.type != type ||
        oldTransaction.amount != amount ||
        oldTransaction.walletId != walletId

      if (shouldRevertOriginal) {
        let res = await revertAndUpdateWallets(
          oldTransaction,
          Number(amount),
          type,
          walletId
        )
        if (!res.success) {
          return res
        }
      }
    } else {
      let res = await updateWalletForNewTransaction(
        walletId!,
        Number(amount!),
        type
      )
      if (!res.success) {
        return res
      }

      if (image) {
        // todo: upload image
        const imageUploadRes = await uploadFileToCloudinary(
          image,
          'transactions'
        )
        if (!imageUploadRes.success) {
          return {
            success: false,
            msg: "Couldn't upload image"
          }
        }
        transactionData.image = imageUploadRes.data
      }

      const transactionRef = id
        ? doc(firestore, 'transactions', id)
        : doc(collection(firestore, 'transactions'))

      await setDoc(transactionRef, transactionData, { merge: true })
      return {
        success: true,
        data: { ...transactionData, id: transactionRef.id }
      }
    }
  } catch (err: any) {
    console.log('Error creating or updating transaction: ', err)
    return {
      success: false,
      msg: err?.message || "Couldn't create or update transaction"
    }
  }
}

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: 'income' | 'expense'
) => {
  try {
    // todo: update wallet
    const walletRef = doc(firestore, 'wallets', walletId)
    const walletSnapshot = await getDoc(walletRef)
    if (!walletSnapshot.exists()) {
      console.log('Wallet not found')
      return {
        success: false,
        msg: 'Wallet not found'
      }
    }

    const walletData = walletSnapshot.data() as WalletType

    if (type == 'expense' && walletData.amount! - amount < 0) {
      console.log('Insufficient balance')
      return {
        success: false,
        msg: 'Insufficient balance'
      }
    }

    const updateType = type == 'income' ? 'totalIncome' : 'totalExpense'
    const updatedWalletAmount =
      type == 'income'
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount

    const updatedTotals =
      type == 'income'
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpense) + amount

    await updateDoc(walletRef, {
      amount: updatedWalletAmount,
      [updateType]: updatedTotals
    })
    return { success: true }
  } catch (err: any) {
    console.log('Error updating wallet: ', err)
    return {
      success: false,
      msg: err?.message || "Couldn't update wallet"
    }
  }
}

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: 'income' | 'expense',
  newWalletId: string
) => {
  try {
    const originalWalletSnapshot = await getDoc(
      doc(firestore, 'wallets', oldTransaction.walletId)
    )

    const originalWallet = originalWalletSnapshot.data() as WalletType

    let newWalletSnapshot = await getDoc(doc(firestore, 'wallets', newWalletId))

    let newWallet = newWalletSnapshot.data() as WalletType

    const revertType =
      oldTransaction.type == 'income' ? 'totalIncome' : 'totalExpense'

    const revertIncomeExpense: number =
      oldTransaction.type == 'income'
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount)

    const revertedWalletAmount =
      Number(originalWallet.amount) + revertIncomeExpense
    // wallet amount after the trx is removed

    const revertedIncomeExpenseAmount =
      Number(originalWallet[revertType]) - Number(oldTransaction.amount)

    if (newTransactionType == 'expense') {
      // if user tries to convert income to expense on the same wallet
      // or if the user tried to increase the expense amount and dont have anough balance
      if (
        oldTransaction.walletId == newWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: 'Insufficient balance'
        }
      }

      // if user tries  to add expense from a new wallet and the wallet dont have anough balance
      if (newWallet.amount! < newTransactionAmount) {
        return {
          success: false,
          msg: 'Insufficient balance'
        }
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount
    })

    // Refetch the new wallet becasue we just updated it
    newWalletSnapshot = await getDoc(doc(firestore, 'wallets', newWalletId))

    const updateType =
      newTransactionType == 'income' ? 'totalIncome' : 'totalExpense'
    const updatedTransactionAmount: number =
      newTransactionType == 'income'
        ? Number(newTransactionAmount)
        : -Number(newTransactionAmount)

    const newWalletAmount = Number(newWallet.amount) + updatedTransactionAmount

    const newIncomeExpenseAmount = Number(
      newWallet[updateType]! + Number(newTransactionAmount)
    )

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount
    })

    return { success: true }
  } catch (err: any) {
    console.log('Error updating wallet: ', err)
    return {
      success: false,
      msg: err?.message || "Couldn't update wallet"
    }
  }
}

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {
    const transactionRef = doc(firestore, 'transactions', transactionId)
    const transactionSnapshot = await getDoc(transactionRef)
    if (!transactionSnapshot.exists()) {
      console.log('Transaction not found')
      return {
        success: false,
        msg: 'Transaction not found'
      }
    }
    const transactionData = transactionSnapshot.data() as TransactionType
    const transactionType = transactionData.type
    const transactionAmount = Number(transactionData.amount)

    // fetch wallet to update amount, total income or expenses
    const walletSnapshot = await getDoc(doc(firestore, 'wallets', walletId))
    const walletData = walletSnapshot.data() as WalletType

    // check fields to be updated based on transaction type
    const updateType =
      transactionType == 'income' ? 'totalIncome' : 'totalExpense'

    const newWalletAmount =
      walletData?.amount! -
      (transactionType == 'income' ? transactionAmount : -transactionAmount)

    const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount

    // if its expense and the wallet amount can go below zero
    if (transactionType == 'income' && newWalletAmount < 0) {
      return { success: false, msg: 'You cannot delete this transaction' }
    }
    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount
    })

    await deleteDoc(transactionRef)

    return { success: true }
  } catch (err: any) {
    console.log('Error deleting transaction: ', err)
    return {
      success: false,
      msg: err?.message || "Couldn't delete transaction"
    }
  }
}

export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    )

    const querySnapshot = await getDocs(transactionQuery)
    const weeklyData = getLast7Days()
    const transactions: TransactionType[] = []

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType
      transaction.id = doc.id
      transactions.push(transaction)

      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toISOString()
        .split('T')[0]

      const dayData = weeklyData.find((day) => day.date === transactionDate)

      if (dayData) {
        if (transaction.type === 'income') {
          dayData.income += Number(transaction.amount)
        } else if (transaction.type === 'expense') {
          dayData.expense += Number(transaction.amount)
        }
      }
    })

    // takes each day and creates two entried in an array
    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary
      },
      { value: day.expense, frontColor: colors.rose }
    ])

    return {
      success: true,
      data: {
        stats,
        transactions
      }
    }
  } catch (err: any) {
    console.log('Error fetching weekly stats', err)
    return {
      success: false,
      msg: err?.message || 'Error fetching weekly stats'
    }
  }
}

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore
    const today = new Date()
    const twelveMonthsAgo = new Date(today)
    twelveMonthsAgo.setMonth(today.getMonth() - 12)

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(twelveMonthsAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    )

    const querySnapshot = await getDocs(transactionQuery)
    const monthlyData = getLast12Months()
    const transactions: TransactionType[] = []

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType
      transaction.id = doc.id
      transactions.push(transaction)

      const transactionDate = (transaction.date as Timestamp).toDate()
      const monthsOfYear = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ]
      const monthName = monthsOfYear[transactionDate.getMonth()]
      const shortYear = transactionDate.getFullYear().toString().slice(-2)
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      )

      if (monthData) {
        if (transaction.type === 'income') {
          monthData.income += Number(transaction.amount)
        } else if (transaction.type === 'expense') {
          monthData.expense += Number(transaction.amount)
        }
      }
    })

    // reformat monthlyData for the bar chart with income and expense entried for each month
    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary
      },
      { value: month.expense, frontColor: colors.rose }
    ])

    return {
      success: true,
      data: {
        stats,
        transactions
      }
    }
  } catch (err: any) {
    console.log('Error fetching monthly stats', err)
    return {
      success: false,
      msg: err?.message || 'Error fetching monthly stats'
    }
  }
}

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      orderBy('date', 'desc')
    )

    const querySnapshot = await getDocs(transactionQuery)
    const transactions: TransactionType[] = []

    const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = doc.data().date.toDate()
      return transactionDate < earliest ? transactionDate : earliest
    }, new Date())

    const firstYear = firstTransaction.getFullYear()
    const currentYear = new Date().getFullYear()

    const yearlyData = getYearsRange(firstYear, currentYear)

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType
      transaction.id = doc.id
      transactions.push(transaction)

      const transactionYear = (transaction.date as Timestamp)
        .toDate()
        .getFullYear()

      const yearData = yearlyData.find(
        (year) => year.year === transactionYear.toString()
      )

      if (yearData) {
        if (transaction.type === 'income') {
          yearData.income += Number(transaction.amount)
        } else if (transaction.type === 'expense') {
          yearData.expense += Number(transaction.amount)
        }
      }
    })

    // reformat yearlyData for the bar chart with income and expense entried for each year
    const stats = yearlyData.flatMap((year) => [
      {
        value: year.income,
        label: year.year,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary
      },
      { value: year.expense, frontColor: colors.rose }
    ])

    return {
      success: true,
      data: {
        stats,
        transactions
      }
    }
  } catch (err: any) {
    console.log('Error fetching yearly stats', err)
    return {
      success: false,
      msg: err?.message || 'Error fetching yearly stats'
    }
  }
}
