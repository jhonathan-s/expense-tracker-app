import { firestore } from '@/config/firebase'
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

const useFetchData = <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!collectionName || !constraints || constraints.length === 0) return

    const collectionRef = collection(firestore, collectionName)
    const q = query(collectionRef, ...constraints)

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as T[]
        setData(fetchedData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.log('Error fetching data: ', err.message)
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [collectionName, JSON.stringify(constraints)])
  return { data, loading, error }
}

export default useFetchData

const styles = StyleSheet.create({})
