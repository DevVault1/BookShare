import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { messagesApi } from '../../api/services';
import type { ConversationSummary } from '../../types/domain';
import { formatDateTime } from '../../utils/format';
import type { RootStackParamList } from '../../navigation/types';
import { extractApiError } from '../../api/client';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const ChatListScreen = () => {
  const navigation = useNavigation<RootNav>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [bookId, setBookId] = useState('');
  const [starting, setStarting] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagesApi.getConversations();
      setConversations(data);
    } catch (loadError: unknown) {
      Alert.alert('Chat', extractApiError(loadError, 'Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((item) => {
      const values = [item.user?.name, item.book?.title, item.lastMessage]
        .filter(Boolean)
        .map((entry) => String(entry).toLowerCase());
      return values.some((entry) => entry.includes(query));
    });
  }, [conversations, search]);

  const startConversation = async () => {
    if (!receiverId.trim()) {
      Alert.alert('Missing value', 'Receiver ID is required.');
      return;
    }

    setStarting(true);
    try {
      const conversation = await messagesApi.startConversation({
        receiverId: receiverId.trim(),
        bookId: bookId.trim() || undefined,
      });

      setReceiverId('');
      setBookId('');
      navigation.navigate('ChatRoom', {
        conversationId: conversation._id,
        title: conversation.user?.name || 'Chat',
      });
      loadConversations();
    } catch (startError: unknown) {
      Alert.alert('Unable to start chat', extractApiError(startError, 'Could not start conversation'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <AppScreen
      title="Chat"
      subtitle="Real-time conversations with unread counts and book context."
    >
      <View style={styles.card}>
        <Text style={styles.label}>Search Conversations</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by user, book, or message"
          placeholderTextColor="#5e6778"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Start Conversation</Text>
        <TextInput
          value={receiverId}
          onChangeText={setReceiverId}
          placeholder="Receiver user ID"
          placeholderTextColor="#5e6778"
          style={styles.input}
        />
        <TextInput
          value={bookId}
          onChangeText={setBookId}
          placeholder="Book ID (optional)"
          placeholderTextColor="#5e6778"
          style={styles.input}
        />
        <PrimaryButton
          label="Start New Chat"
          onPress={startConversation}
          loading={starting}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadConversations} />}
        renderItem={({ item }) => (
          <View style={styles.rowCard}>
            <View style={styles.rowHead}>
              <Text style={styles.rowTitle}>{item.user?.name || 'Unknown user'}</Text>
              {item.unreadCount ? <Text style={styles.unread}>{item.unreadCount}</Text> : null}
            </View>
            {item.book?.title ? <Text style={styles.rowSub}>Book: {item.book.title}</Text> : null}
            <Text style={styles.rowSub}>{item.lastMessage || 'No messages yet'}</Text>
            <Text style={styles.rowMeta}>{formatDateTime(item.lastMessageAt)}</Text>
            <PrimaryButton
              label="Open Chat"
              variant="ghost"
              onPress={() => navigation.navigate('ChatRoom', {
                conversationId: item._id,
                title: item.user?.name || 'Chat',
              })}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No conversations found.</Text>}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 6,
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
  rowCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  unread: {
    minWidth: 24,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#2463eb',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rowSub: {
    color: '#374151',
    marginTop: 4,
    fontSize: 13,
  },
  rowMeta: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 11,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
});
