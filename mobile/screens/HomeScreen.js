import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator, RefreshControl
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import BookCard from '../components/BookCard'

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore()
  const [featured, setFeatured] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [featRes, recRes] = await Promise.all([
        api.get('/books', { params: { limit: 6 } }),
        api.get('/books/recommendations'),
      ])
      setFeatured(featRes.data.books)
      setRecommended(recRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const onRefresh = () => { setRefreshing(true); fetchData() }

  const CATEGORIES = ['Fiction', 'Science', 'Math', 'History', 'Tech', 'Arts']

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient colors={['#1d4ed8', '#2563eb']} style={styles.hero}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}! 👋</Text>
        <Text style={styles.heroTitle}>Find your next{'\n'}favourite book</Text>
        <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Browse')}>
          <Text style={styles.heroBtnText}>Browse Books</Text>
          <Ionicons name="arrow-forward" size={16} color="#2563eb" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={styles.catChip}
              onPress={() => navigation.navigate('Browse', { category: cat })}>
              <Text style={styles.catText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Books</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item._id })} />
            )}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          />
        )}
      </View>

      {/* Recommendations */}
      {recommended.length > 0 && (
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>✨ Recommended for You</Text>
          <FlatList
            data={recommended}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item._id })} />
            )}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: { padding: 24, paddingTop: 32, paddingBottom: 36 },
  greeting: { color: '#bfdbfe', fontSize: 14, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 36, marginBottom: 20 },
  heroBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  heroBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
  section: { padding: 20, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  seeAll: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  catScroll: { marginBottom: 4 },
  catChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  catText: { color: '#374151', fontWeight: '600', fontSize: 13 },
})
