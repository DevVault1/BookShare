import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Book } from '../../types/domain';
import { Stars } from '../ui/Stars';

interface BookListItemProps {
  book: Book;
  onPress: () => void;
}

export const BookListItem = ({ book, onPress }: BookListItemProps) => (
  <Pressable style={styles.card} onPress={onPress}>
    {book.image ? (
      <Image source={{ uri: book.image }} style={styles.image} />
    ) : (
      <View style={[styles.image, styles.imageFallback]}>
        <Text style={styles.imageFallbackText}>No Image</Text>
      </View>
    )}

    <View style={styles.body}>
      <Text numberOfLines={2} style={styles.title}>
        {book.title}
      </Text>
      <Text style={styles.meta}>by {book.author}</Text>
      <Text style={styles.meta}>{book.category} • {book.condition}</Text>
      <View style={styles.footer}>
        <Stars value={book.ratingsAverage || 0} size={14} showNumeric />
        <Text style={styles.status}>{book.status}</Text>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    color: '#2463eb',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
