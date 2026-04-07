import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Stars } from '../../components/ui/Stars';
import {
  analyticsApi,
  authApi,
  booksApi,
  donationsApi,
  notificationsApi,
  requestsApi,
  reviewsApi,
  type MyAnalyticsResponse,
} from '../../api/services';
import type {
  Book,
  Donation,
  NotificationItem,
  RequestItem,
  TwoFactorStatus,
} from '../../types/domain';
import { extractApiError } from '../../api/client';
import { formatDate, formatDateTime } from '../../utils/format';
import { DELIVERY_METHODS } from '../../utils/constants';
import { TagChip } from '../../components/ui/TagChip';
import { useAuthStore } from '../../store/authStore';

interface PrivateReviewDraft {
  donationId: string;
  bookRating: number;
  donorFeedbackRating: number;
  descriptionAccuracyRating: number;
  reviewText: string;
}

const defaultReviewDraft = {
  donationId: '',
  bookRating: 5,
  donorFeedbackRating: 5,
  descriptionAccuracyRating: 5,
  reviewText: '',
};

export const DashboardScreen = () => {
  const { user, refreshMe } = useAuthStore();

  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RequestItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = useState<MyAnalyticsResponse | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);

  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'sms'>('email');
  const [twoFactorPhone, setTwoFactorPhone] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSetupStarted, setTwoFactorSetupStarted] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'meetup' | 'pickup' | 'mail'>('meetup');

  const [reviewDraft, setReviewDraft] = useState<PrivateReviewDraft>(defaultReviewDraft);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const stats = useMemo(() => ({
    books: myBooks.length,
    incomingRequests: incomingRequests.length,
    outgoingRequests: outgoingRequests.length,
    unreadNotifications: notifications.filter((item) => !item.isRead).length,
    donationsInProgress: donations.filter((item) => item.status !== 'confirmed').length,
  }), [myBooks, incomingRequests, outgoingRequests, notifications, donations]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [books, outgoing, incoming, donationList, notificationList, analyticsData, twoFactorData] = await Promise.all([
        booksApi.getMyBooks(),
        requestsApi.getUserRequests(),
        requestsApi.getDonorRequests(),
        donationsApi.getDonations(),
        notificationsApi.getNotifications(),
        analyticsApi.getMyAnalytics(),
        authApi.getTwoFactorStatus(),
      ]);

      setMyBooks(books);
      setOutgoingRequests(outgoing);
      setIncomingRequests(incoming);
      setDonations(donationList);
      setNotifications(notificationList);
      setAnalytics(analyticsData);
      setTwoFactorStatus(twoFactorData);
      setTwoFactorMethod(twoFactorData.method || 'email');
      setTwoFactorPhone(twoFactorData.phoneNumber || '');
    } catch (loadError: unknown) {
      setError(extractApiError(loadError, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRequestResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      await requestsApi.respond(requestId, {
        status,
        deliveryMethod: status === 'approved' ? deliveryMethod : undefined,
      });
      await loadDashboard();
      Alert.alert('Done', `Request ${status}.`);
    } catch (responseError: unknown) {
      Alert.alert('Action failed', extractApiError(responseError, 'Failed to update request'));
    } finally {
      setBusy(false);
    }
  };

  const handleDonationStatus = async (donationId: string, status: 'delivered' | 'confirmed') => {
    setBusy(true);
    try {
      await donationsApi.updateStatus(donationId, { status });
      await loadDashboard();
      Alert.alert('Updated', `Donation marked as ${status}.`);
    } catch (statusError: unknown) {
      Alert.alert('Action failed', extractApiError(statusError, 'Failed to update donation status'));
    } finally {
      setBusy(false);
    }
  };

  const submitPrivateReview = async () => {
    if (!reviewDraft.donationId) return;
    setBusy(true);
    try {
      await reviewsApi.createPrivateReview(reviewDraft.donationId, {
        bookRating: reviewDraft.bookRating,
        donorFeedbackRating: reviewDraft.donorFeedbackRating,
        descriptionAccuracyRating: reviewDraft.descriptionAccuracyRating,
        reviewText: reviewDraft.reviewText.trim(),
      });
      setReviewDraft(defaultReviewDraft);
      await loadDashboard();
      Alert.alert('Saved', 'Private donation review submitted.');
    } catch (reviewError: unknown) {
      Alert.alert('Review failed', extractApiError(reviewError, 'Could not submit private review'));
    } finally {
      setBusy(false);
    }
  };

  const markNotificationsRead = async () => {
    setBusy(true);
    try {
      await notificationsApi.markRead();
      await loadDashboard();
    } catch (notifError: unknown) {
      Alert.alert('Failed', extractApiError(notifError, 'Could not mark notifications as read'));
    } finally {
      setBusy(false);
    }
  };

  const startTwoFactorSetup = async () => {
    setBusy(true);
    try {
      const result = await authApi.requestTwoFactorSetup({
        method: twoFactorMethod,
        phoneNumber: twoFactorPhone.trim() || undefined,
      });
      setTwoFactorSetupStarted(true);
      Alert.alert('Verification sent', result.message);
    } catch (setupError: unknown) {
      Alert.alert('Failed', extractApiError(setupError, 'Could not start 2FA setup'));
    } finally {
      setBusy(false);
    }
  };

  const verifyTwoFactorSetup = async () => {
    setBusy(true);
    try {
      const result = await authApi.verifyTwoFactorSetup({ method: twoFactorMethod, code: twoFactorCode.trim() });
      Alert.alert('Success', result.message);
      setTwoFactorCode('');
      setTwoFactorSetupStarted(false);
      await refreshMe();
      await loadDashboard();
    } catch (verifyError: unknown) {
      Alert.alert('Failed', extractApiError(verifyError, 'Could not verify 2FA code'));
    } finally {
      setBusy(false);
    }
  };

  const disableTwoFactor = async () => {
    setBusy(true);
    try {
      await authApi.disableTwoFactor();
      await refreshMe();
      await loadDashboard();
      Alert.alert('Disabled', 'Two-factor authentication disabled.');
    } catch (disableError: unknown) {
      Alert.alert('Failed', extractApiError(disableError, 'Could not disable 2FA'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppScreen title="Dashboard" subtitle="Loading your workspace..." scroll={false}>
        <View style={styles.centered}><ActivityIndicator size="large" color="#2463eb" /></View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="Dashboard"
      subtitle={`Welcome ${user?.name?.split(' ')[0] || 'Reader'} - all core web features in one mobile workspace.`}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overview</Text>
        <Text style={styles.metric}>My Books: {stats.books}</Text>
        <Text style={styles.metric}>Incoming Requests: {stats.incomingRequests}</Text>
        <Text style={styles.metric}>Outgoing Requests: {stats.outgoingRequests}</Text>
        <Text style={styles.metric}>In-progress Donations: {stats.donationsInProgress}</Text>
        <Text style={styles.metric}>Unread Notifications: {stats.unreadNotifications}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Listings ({myBooks.length})</Text>
        {myBooks.slice(0, 5).map((book) => (
          <Text key={book._id} style={styles.listLine}>• {book.title} - {book.status}</Text>
        ))}
        {myBooks.length === 0 ? <Text style={styles.muted}>No books donated yet.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Incoming Requests ({incomingRequests.length})</Text>
        <Text style={styles.muted}>Delivery method (used when approving):</Text>
        <View style={styles.chipWrap}>
          {DELIVERY_METHODS.map((method) => (
            <TagChip
              key={method}
              label={method}
              selected={deliveryMethod === method}
              onPress={() => setDeliveryMethod(method)}
            />
          ))}
        </View>

        {incomingRequests.map((request) => (
          <View key={request._id} style={styles.block}>
            <Text style={styles.listTitle}>{request.bookId?.title}</Text>
            <Text style={styles.listLine}>Requester: {request.requesterId?.name}</Text>
            <Text style={styles.listLine}>Status: {request.status}</Text>
            <View style={styles.row}>
              <PrimaryButton
                label="Approve"
                onPress={() => handleRequestResponse(request._id, 'approved')}
                disabled={request.status !== 'pending' || busy}
                style={styles.inlineButton}
              />
              <PrimaryButton
                label="Reject"
                variant="danger"
                onPress={() => handleRequestResponse(request._id, 'rejected')}
                disabled={request.status !== 'pending' || busy}
                style={styles.inlineButton}
              />
            </View>
          </View>
        ))}

        {incomingRequests.length === 0 ? <Text style={styles.muted}>No incoming requests.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outgoing Requests ({outgoingRequests.length})</Text>
        {outgoingRequests.map((request) => (
          <View key={request._id} style={styles.block}>
            <Text style={styles.listTitle}>{request.bookId?.title}</Text>
            <Text style={styles.listLine}>Donor: {request.donorId?.name}</Text>
            <Text style={styles.listLine}>Status: {request.status}</Text>
            <Text style={styles.listLine}>Requested: {formatDate(request.requestDate)}</Text>
          </View>
        ))}
        {outgoingRequests.length === 0 ? <Text style={styles.muted}>No requests sent yet.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Donations ({donations.length})</Text>
        {donations.map((donation) => {
          const isDonor = donation.donorId?._id === user?._id;
          const isReceiver = donation.receiverId?._id === user?._id;
          const canReview = isReceiver && ['delivered', 'confirmed'].includes(donation.status) && !donation.reviewId;

          return (
            <View key={donation._id} style={styles.block}>
              <Text style={styles.listTitle}>{donation.bookId?.title}</Text>
              <Text style={styles.listLine}>Donor: {donation.donorId?.name}</Text>
              <Text style={styles.listLine}>Receiver: {donation.receiverId?.name}</Text>
              <Text style={styles.listLine}>Status: {donation.status}</Text>

              <View style={styles.row}>
                <PrimaryButton
                  label="Mark Delivered"
                  onPress={() => handleDonationStatus(donation._id, 'delivered')}
                  disabled={!isDonor || donation.status !== 'pending' || busy}
                  style={styles.inlineButton}
                />
                <PrimaryButton
                  label="Confirm Receipt"
                  variant="secondary"
                  onPress={() => handleDonationStatus(donation._id, 'confirmed')}
                  disabled={!isReceiver || !['delivered', 'confirmed'].includes(donation.status) || busy}
                  style={styles.inlineButton}
                />
              </View>

              {canReview ? (
                <View style={styles.privateReviewBox}>
                  <Text style={styles.listTitle}>Private Donation Review</Text>
                  <Text style={styles.muted}>Book rating</Text>
                  <Stars
                    value={reviewDraft.donationId === donation._id ? reviewDraft.bookRating : 5}
                    editable
                    onChange={(value) =>
                      setReviewDraft((prev) => ({
                        ...prev,
                        donationId: donation._id,
                        bookRating: value,
                      }))
                    }
                  />

                  <Text style={styles.muted}>Donor feedback</Text>
                  <Stars
                    value={reviewDraft.donationId === donation._id ? reviewDraft.donorFeedbackRating : 5}
                    editable
                    onChange={(value) =>
                      setReviewDraft((prev) => ({
                        ...prev,
                        donationId: donation._id,
                        donorFeedbackRating: value,
                      }))
                    }
                  />

                  <Text style={styles.muted}>Description accuracy</Text>
                  <Stars
                    value={reviewDraft.donationId === donation._id ? reviewDraft.descriptionAccuracyRating : 5}
                    editable
                    onChange={(value) =>
                      setReviewDraft((prev) => ({
                        ...prev,
                        donationId: donation._id,
                        descriptionAccuracyRating: value,
                      }))
                    }
                  />

                  <TextInput
                    value={reviewDraft.donationId === donation._id ? reviewDraft.reviewText : ''}
                    onChangeText={(value) =>
                      setReviewDraft((prev) => ({
                        ...prev,
                        donationId: donation._id,
                        reviewText: value,
                      }))
                    }
                    placeholder="Private feedback for donor"
                    placeholderTextColor="#5e6778"
                    style={styles.textArea}
                    multiline
                  />

                  <PrimaryButton
                    label="Submit Private Review"
                    onPress={submitPrivateReview}
                    disabled={busy || reviewDraft.donationId !== donation._id}
                  />
                </View>
              ) : null}
            </View>
          );
        })}

        {donations.length === 0 ? <Text style={styles.muted}>No donations yet.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications ({notifications.length})</Text>
        <PrimaryButton
          label="Mark All as Read"
          variant="ghost"
          onPress={markNotificationsRead}
          disabled={busy}
        />
        <View style={styles.spacer} />
        {notifications.map((notification) => (
          <View key={notification._id} style={styles.block}>
            <Text style={styles.listLine}>{notification.message}</Text>
            <Text style={styles.smallMuted}>{formatDateTime(notification.createdAt)}</Text>
          </View>
        ))}
        {notifications.length === 0 ? <Text style={styles.muted}>No notifications.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analytics</Text>
        <Text style={styles.listLine}>Books Shared: {analytics?.donorImpactAnalytics?.totalBooksShared || 0}</Text>
        <Text style={styles.listLine}>Students Reached: {analytics?.donorImpactAnalytics?.studentsReached || 0}</Text>
        <Text style={styles.listLine}>Books Adopted: {analytics?.studentReadingAnalytics?.totalAdoptedBooks || 0}</Text>
        <Text style={styles.listLine}>Favorite Category: {analytics?.studentReadingAnalytics?.favouriteCategory || 'N/A'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security and 2FA</Text>
        <Text style={styles.listLine}>Current status: {twoFactorStatus?.enabled ? `Enabled (${twoFactorStatus.method})` : 'Disabled'}</Text>
        <Text style={styles.listLine}>Email: {twoFactorStatus?.email || 'N/A'}</Text>
        <TextInput
          value={twoFactorPhone}
          onChangeText={setTwoFactorPhone}
          placeholder="Phone number for SMS 2FA"
          placeholderTextColor="#5e6778"
          style={styles.input}
        />

        <View style={styles.chipWrap}>
          <TagChip label="email" selected={twoFactorMethod === 'email'} onPress={() => setTwoFactorMethod('email')} />
          <TagChip label="sms" selected={twoFactorMethod === 'sms'} onPress={() => setTwoFactorMethod('sms')} />
        </View>

        <PrimaryButton
          label="Send Setup Code"
          onPress={startTwoFactorSetup}
          disabled={busy}
        />

        {twoFactorSetupStarted ? (
          <View style={styles.spacer}>
            <TextInput
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              placeholder="Enter setup code"
              placeholderTextColor="#5e6778"
              style={styles.input}
            />
            <PrimaryButton
              label="Verify and Enable 2FA"
              onPress={verifyTwoFactorSetup}
              disabled={busy || twoFactorCode.trim().length < 6}
            />
          </View>
        ) : null}

        {twoFactorStatus?.enabled ? (
          <View style={styles.spacer}>
            <PrimaryButton label="Disable 2FA" variant="danger" onPress={disableTwoFactor} disabled={busy} />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  metric: {
    color: '#374151',
    marginBottom: 3,
    fontSize: 13,
  },
  block: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 10,
  },
  listTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 3,
  },
  listLine: {
    color: '#374151',
    fontSize: 13,
    marginBottom: 3,
  },
  muted: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  smallMuted: {
    color: '#6b7280',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  inlineButton: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    color: '#111827',
    marginBottom: 8,
  },
  privateReviewBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
  },
  spacer: {
    marginTop: 8,
  },
  error: {
    color: '#dc2828',
    marginBottom: 8,
  },
});
