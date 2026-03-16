import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function DonationHistoryScreen() {
  const { user } = useAuthStore()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/donations')
      .then(({ data }) => setDonations(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusColor = { pending: '#f59e0b', delivered: '#3b82f6', confirmed: '#10b981' }

  if (loading) return <ActivityIndicator color="#2563eb" style={{ flex: 1, marginTop: 60 }} />

  return (
    <View style={styles.container}>
      {donations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="gift-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No donations yet</Text>
          <Text style={styles.emptySubtitle}>Your donation history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isGiver = item.donorId?._id === user?._id
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  {item.bookId?.image ? (
                    <Image source={{ uri: item.bookId.image }} style={styles.bookImg} />
                  ) : (
                    <View style={styles.bookImgPlaceholder}>
                      <Ionicons name="book-outline" size={22} color="#93c5fd" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.bookId?.title}</Text>
                    <Text style={styles.bookAuthor}>{item.bookId?.author}</Text>
                    <Text style={styles.relation}>
                      {isGiver ? `Given to ${item.receiverId?.name}` : `Received from ${item.donorId?.name}`}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.donationDate).toLocaleDateString()} · {item.deliveryMethod}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor[item.status] }]}>{item.status}</Text>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: { color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  bookImg: { width: 56, height: 72, borderRadius: 8, resizeMode: 'cover' },
  bookImgPlaceholder: { width: 56, height: 72, borderRadius: 8, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },
  bookAuthor: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  relation: { fontSize: 12, color: '#2563eb', marginTop: 6, fontWeight: '600' },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
})
