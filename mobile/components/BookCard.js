import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function BookCard({ book, onPress }) {
  const conditionColors = {
    'New': '#166534',
    'Like New': '#065f46',
    'Good': '#1e40af',
    'Fair': '#92400e',
    'Poor': '#991b1b',
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {book.image ? (
          <Image source={{ uri: book.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="book-outline" size={32} color="#93c5fd" />
          </View>
        )}
        <View style={[styles.conditionBadge, { backgroundColor: conditionColors[book.condition] || '#374151' }]}>
          <Text style={styles.conditionText}>{book.condition}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{book.category}</Text>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        {book.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="#9ca3af" />
            <Text style={styles.location} numberOfLines={1}>{book.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  imageWrap: { height: 160, backgroundColor: '#dbeafe', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' },
  conditionBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  conditionText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  info: { padding: 10 },
  category: { fontSize: 10, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  title: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, marginBottom: 3 },
  author: { fontSize: 11, color: '#6b7280', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 10, color: '#9ca3af', flex: 1 },
})
