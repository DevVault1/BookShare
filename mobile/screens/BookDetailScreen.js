import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params
  const { user } = useAuthStore()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get(`/books/${bookId}`)
      .then(({ data }) => setBook(data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false))
  }, [bookId])

  const handleRequest = async () => {
    setRequesting(true)
    try {
      await api.post('/requests', { bookId, message })
      Alert.alert('Success! 🎉', 'Request sent! The donor will review it soon.')
      setShowForm(false)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request')
    } finally { setRequesting(false) }
  }

  if (loading) return <ActivityIndicator color="#2563eb" style={{ flex: 1, marginTop: 100 }} />
  if (!book) return null

  const isOwner = user?._id === book.donorId?._id
  const canRequest = !isOwner && book.status === 'available'

  const condColors = { New: '#166534', 'Like New': '#065f46', Good: '#1e40af', Fair: '#92400e', Poor: '#991b1b' }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Book cover */}
      <View style={styles.imageWrap}>
        {book.image ? (
          <Image source={{ uri: book.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#dbeafe', '#e0e7ff']} style={styles.imagePlaceholder}>
            <Ionicons name="book-outline" size={64} color="#93c5fd" />
          </LinearGradient>
        )}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: condColors[book.condition] || '#374151' }]}>
            <Text style={styles.badgeText}>{book.condition}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: book.status === 'available' ? '#166534' : '#92400e' }]}>
            <Text style={styles.badgeText}>{book.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{book.category}</Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>by {book.author}</Text>

        {book.description && <Text style={styles.description}>{book.description}</Text>}

        {/* Details grid */}
        <View style={styles.detailsGrid}>
          {[
            ['Language', book.language || 'English'],
            ['Pages', book.pages || 'N/A'],
            ['ISBN', book.isbn || 'N/A'],
            ['Condition', book.condition],
          ].map(([label, val]) => (
            <View key={label} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Donor info */}
        {book.donorId && (
          <View style={styles.donorCard}>
            <View style={styles.donorAvatar}>
              <Text style={styles.donorInitial}>{book.donorId.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.donorLabel}>Donated by</Text>
              <Text style={styles.donorName}>{book.donorId.name}</Text>
              {book.donorId.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={styles.donorLocation}>{book.donorId.location}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Request form */}
        {showForm && (
          <View style={styles.requestForm}>
            <Text style={styles.requestLabel}>Tell the donor why you'd like this book:</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Optional message..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              style={styles.requestInput}
            />
            <View style={styles.requestButtons}>
              <TouchableOpacity style={styles.btnSend} onPress={handleRequest} disabled={requesting}>
                {requesting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSendText}>Send Request</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowForm(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action buttons */}
        {!showForm && canRequest && (
          <TouchableOpacity style={styles.btnRequest} onPress={() => setShowForm(true)}>
            <Ionicons name="heart-outline" size={20} color="#fff" />
            <Text style={styles.btnRequestText}>Request This Book</Text>
          </TouchableOpacity>
        )}

        {!showForm && !isOwner && (
          <TouchableOpacity style={styles.btnMessage} onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
            <Text style={styles.btnMessageText}>Message Donor</Text>
          </TouchableOpacity>
        )}

        {book.status !== 'available' && !isOwner && !showForm && (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableText}>This book is not currently available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  imageWrap: { height: 320, backgroundColor: '#e5e7eb' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badges: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 48 },
  category: { color: '#2563eb', fontWeight: '700', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', lineHeight: 32, marginBottom: 6 },
  author: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 24, marginBottom: 20 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  detailItem: { width: '45%' },
  detailLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  donorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  donorAvatar: { width: 48, height: 48, backgroundColor: '#dbeafe', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  donorInitial: { color: '#2563eb', fontSize: 20, fontWeight: '700' },
  donorLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  donorName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  donorLocation: { fontSize: 12, color: '#9ca3af' },
  requestForm: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  requestLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  requestInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  requestButtons: { flexDirection: 'row', gap: 10 },
  btnSend: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnSendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancel: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
  btnRequest: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
  btnRequestText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnMessage: { borderWidth: 2, borderColor: '#2563eb', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
  btnMessageText: { color: '#2563eb', fontWeight: '700', fontSize: 16 },
  unavailable: { backgroundColor: '#f3f4f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  unavailableText: { color: '#6b7280', fontWeight: '600' },
})
