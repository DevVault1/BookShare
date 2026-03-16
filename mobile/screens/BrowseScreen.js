import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../lib/api'
import BookCard from '../components/BookCard'

const CATEGORIES = ['All', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']

export default function BrowseScreen({ navigation, route }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(route.params?.category || 'All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchBooks(true) }, [category])

  const fetchBooks = async (reset = false) => {
    setLoading(true)
    try {
      const p = reset ? 1 : page
      const params = { page: p, limit: 20 }
      if (search) params.search = search
      if (category !== 'All') params.category = category

      const { data } = await api.get('/books', { params })
      setBooks(reset ? data.books : prev => [...prev, ...data.books])
      setTotalPages(data.pages)
      if (!reset) setPage(p + 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSearch = () => { setPage(1); fetchBooks(true) }

  const loadMore = () => {
    if (page <= totalPages && !loading) {
      setPage(prev => prev + 1)
      fetchBooks()
    }
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
            style={[styles.catChip, category === cat && styles.catChipActive]}>
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Books grid */}
      {loading && books.length === 0 ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 40 }} />
      ) : books.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No books found</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => item._id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item._id })} />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  catScroll: { maxHeight: 50 },
  catContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  catChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  catChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  catTextActive: { color: '#fff' },
  grid: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 16 },
})
