import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Stars } from '../../components/ui/Stars';
import type { RootStackParamList } from '../../navigation/types';
import type { Book, PublicReviewCollection } from '../../types/domain';
import {
  booksApi,
  messagesApi,
  reportsApi,
  requestsApi,
  reviewsApi,
} from '../../api/services';
import { extractApiError } from '../../api/client';
import { formatDate } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BookDetail'>;

const emptyReviews: PublicReviewCollection = {
  reviews: [],
  summary: { bookRatingAverage: 0, reviewsCount: 0 },
  myReview: null,
  total: 0,
  page: 1,
  pages: 1,
};

export const BookDetailScreen = ({ route, navigation }: Props) => {
  const { bookId } = route.params;
  const { user, token } = useAuthStore();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<PublicReviewCollection>(emptyReviews);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const loadedBook = await booksApi.getBook(bookId);
      setBook(loadedBook);
      if (token) {
        const reviewData = await reviewsApi.getPublicBookReviews(bookId);
        setReviews(reviewData);
        setRating(reviewData.myReview?.bookRating || 5);
        setReviewText(reviewData.myReview?.reviewText || '');
      }
    } catch (loadError: unknown) {
      setError(extractApiError(loadError, 'Failed to load book details'));
    } finally {
      setLoading(false);
    }
  }, [bookId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in before requesting a book.');
      return;
    }
    setBusy(true);
    try {
      await requestsApi.create({ bookId, message: requestMessage.trim() });
      Alert.alert('Success', 'Request sent successfully.');
      setRequestMessage('');
      await load();
    } catch (requestError: unknown) {
      Alert.alert('Request failed', extractApiError(requestError, 'Failed to send request'));
    } finally {
      setBusy(false);
    }
  };

  const handleMessageDonor = async () => {
    if (!book?.donorId?._id) return;
    setBusy(true);
    try {
      const conversation = await messagesApi.startConversation({
        receiverId: book.donorId._id,
        bookId: book._id,
      });
      navigation.navigate('ChatRoom', {
        conversationId: conversation._id,
        title: book.donorId.name,
      });
    } catch (chatError: unknown) {
      Alert.alert('Chat unavailable', extractApiError(chatError, 'Failed to start conversation'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveReview = async () => {
    if (!token) {
      Alert.alert('Login required', 'Sign in to post public reviews.');
      return;
    }

    setBusy(true);
    try {
      if (reviews.myReview?._id) {
        await reviewsApi.updateReview(reviews.myReview._id, {
          bookRating: rating,
          reviewText: reviewText.trim(),
        });
      } else {
        await reviewsApi.createPublicReview(bookId, {
          bookRating: rating,
          reviewText: reviewText.trim(),
        });
      }
      await load();
      Alert.alert('Saved', 'Your public review has been saved.');
    } catch (reviewError: unknown) {
      Alert.alert('Review error', extractApiError(reviewError, 'Failed to save review'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviews.myReview?._id) return;
    setBusy(true);
    try {
      await reviewsApi.deleteReview(reviews.myReview._id);
      await load();
      Alert.alert('Deleted', 'Your public review was deleted.');
    } catch (reviewError: unknown) {
      Alert.alert('Delete failed', extractApiError(reviewError, 'Failed to delete review'));
    } finally {
      setBusy(false);
    }
  };

  const handleReport = async () => {
    if (!book) return;
    if (!token) {
      Alert.alert('Login required', 'Please sign in to report this listing.');
      return;
    }

    setBusy(true);
    try {
      await reportsApi.createReport({
        targetType: 'book',
        targetId: book._id,
        category: 'fake_listing',
        description: `Report from mobile app for book: ${book.title}`,
        priority: 'medium',
      });
      Alert.alert('Report submitted', 'Thanks. Admins were notified.');
    } catch (reportError: unknown) {
      Alert.alert('Failed', extractApiError(reportError, 'Could not submit report'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppScreen title="Book Details" subtitle="Loading..." scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2463eb" />
        </View>
      </AppScreen>
    );
  }

  if (!book) {
    return (
      <AppScreen title="Book Details" subtitle="Not found" scroll={false}>
        <Text style={styles.error}>{error || 'Book not found'}</Text>
      </AppScreen>
    );
  }

  const isOwner = user?._id && user._id === book.donorId?._id;

  return (
    <AppScreen title={book.title} subtitle={`by ${book.author}`}>
      {book.image ? <Image source={{ uri: book.image }} style={styles.cover} /> : null}

      <View style={styles.card}>
        <Text style={styles.line}>Category: {book.category}</Text>
        <Text style={styles.line}>Condition: {book.condition}</Text>
        <Text style={styles.line}>Status: {book.status}</Text>
        <Text style={styles.line}>Location: {book.location || 'N/A'}</Text>
        <Text style={styles.line}>Language: {book.language || 'N/A'}</Text>
        <Text style={styles.line}>Published: {book.publishedYear || 'N/A'}</Text>
        <Text style={styles.line}>Listed: {formatDate(book.createdAt)}</Text>
        {book.description ? <Text style={styles.description}>{book.description}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Donor</Text>
        <Text style={styles.line}>{book.donorId?.name || 'Unknown donor'}</Text>
        <Text style={styles.line}>{book.donorId?.email || ''}</Text>
        <Text style={styles.line}>Reputation: {book.donorId?.donorReputation?.overallScore?.toFixed(1) || 'New'}</Text>

        {!isOwner ? (
          <View style={styles.actionGroup}>
            <PrimaryButton
              label="Message Donor"
              onPress={handleMessageDonor}
              loading={busy}
            />
            <View style={styles.spacer} />
            <PrimaryButton
              label="Report Listing"
              onPress={handleReport}
              variant="ghost"
              disabled={busy}
            />
          </View>
        ) : null}
      </View>

      {!isOwner ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request this Book</Text>
          <TextInput
            style={styles.textArea}
            value={requestMessage}
            onChangeText={setRequestMessage}
            placeholder="Add a message for the donor"
            placeholderTextColor="#5e6778"
            multiline
          />
          <PrimaryButton
            label="Send Request"
            onPress={handleRequest}
            loading={busy}
            disabled={book.status !== 'available'}
          />
        </View>
      ) : null}

      {token ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Public Review</Text>
          <Stars value={rating} editable onChange={setRating} />
          <TextInput
            style={styles.textArea}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience with this listing"
            placeholderTextColor="#5e6778"
            multiline
          />
          <PrimaryButton
            label={reviews.myReview ? 'Update Review' : 'Post Review'}
            onPress={handleSaveReview}
            loading={busy}
          />
          {reviews.myReview ? (
            <View style={styles.spacer}>
              <PrimaryButton
                label="Delete Review"
                onPress={handleDeleteReview}
                variant="danger"
                disabled={busy}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Community Reviews ({reviews.total})</Text>
        {reviews.reviews.length === 0 ? (
          <Text style={styles.muted}>No public reviews yet.</Text>
        ) : (
          reviews.reviews.map((item) => (
            <View key={item._id} style={styles.reviewItem}>
              <Text style={styles.reviewAuthor}>{item.userId?.name || 'Reader'}</Text>
              <Stars value={item.bookRating} size={14} />
              <Text style={styles.reviewText}>{item.reviewText}</Text>
              <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
            </View>
          ))
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  line: {
    color: '#374151',
    marginBottom: 5,
    fontSize: 13,
  },
  description: {
    color: '#374151',
    marginTop: 8,
    lineHeight: 20,
  },
  actionGroup: {
    marginTop: 8,
  },
  spacer: {
    marginTop: 8,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 8,
    color: '#111827',
    textAlignVertical: 'top',
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 10,
  },
  reviewAuthor: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewText: {
    color: '#374151',
    marginTop: 4,
    lineHeight: 18,
  },
  reviewDate: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
  },
  muted: {
    color: '#6b7280',
  },
  error: {
    color: '#dc2828',
    marginBottom: 14,
  },
});
