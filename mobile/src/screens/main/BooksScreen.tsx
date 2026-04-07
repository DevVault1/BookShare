import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TagChip } from '../../components/ui/TagChip';
import { BookListItem } from '../../components/books/BookListItem';
import { booksApi } from '../../api/services';
import { extractApiError } from '../../api/client';
import type { Book } from '../../types/domain';
import type { RootStackParamList } from '../../navigation/types';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../../utils/constants';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const BooksScreen = () => {
  const navigation = useNavigation<RootNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [condition, setCondition] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBooks = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const payload = await booksApi.getBooks({
        page: nextPage,
        limit: 12,
        search: search.trim() || undefined,
        category: category === 'All' ? undefined : category,
        condition: condition === 'All' ? undefined : condition,
        status: 'available',
      });

      setBooks(payload.books || []);
      setPage(payload.page || nextPage);
      setTotalPages(payload.pages || 1);
    } catch (fetchError: unknown) {
      setError(extractApiError(fetchError, 'Failed to load books'));
    } finally {
      setLoading(false);
    }
  }, [category, condition, search]);

  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  return (
    <AppScreen
      title="Discover Books"
      subtitle="Browse listings, filter quickly, and open full book details with trust and review context."
    >
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title or author"
          placeholderTextColor="#5e6778"
          style={styles.searchInput}
        />
        <PrimaryButton label="Search" onPress={() => fetchBooks(1)} style={styles.searchButton} />
      </View>

      <Text style={styles.filterLabel}>Category</Text>
      <View style={styles.chipWrap}>
        <TagChip label="All" selected={category === 'All'} onPress={() => setCategory('All')} />
        {BOOK_CATEGORIES.map((item) => (
          <TagChip
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </View>

      <Text style={styles.filterLabel}>Condition</Text>
      <View style={styles.chipWrap}>
        <TagChip label="All" selected={condition === 'All'} onPress={() => setCondition('All')} />
        {BOOK_CONDITIONS.map((item) => (
          <TagChip
            key={item}
            label={item}
            selected={condition === item}
            onPress={() => setCondition(item)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#2463eb" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <BookListItem
              book={item}
              onPress={() => navigation.navigate('BookDetail', { bookId: item._id })}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No books found for current filters.</Text>}
        />
      )}

      {totalPages > 1 ? (
        <View style={styles.paginationRow}>
          <PrimaryButton
            label="Prev"
            variant="ghost"
            disabled={page <= 1 || loading}
            onPress={() => fetchBooks(page - 1)}
            style={styles.pageButton}
          />
          <Text style={styles.pageText}>{page} / {totalPages}</Text>
          <PrimaryButton
            label="Next"
            variant="ghost"
            disabled={page >= totalPages || loading}
            onPress={() => fetchBooks(page + 1)}
            style={styles.pageButton}
          />
        </View>
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    paddingHorizontal: 12,
  },
  searchButton: {
    width: 92,
  },
  filterLabel: {
    color: '#374151',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  error: {
    color: '#dc2828',
    marginBottom: 8,
  },
  loaderWrap: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 28,
    marginBottom: 22,
  },
  paginationRow: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageText: {
    color: '#374151',
    fontWeight: '700',
  },
  pageButton: {
    minWidth: 90,
  },
});
