import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io, Socket } from 'socket.io-client';
import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MessageBubble } from '../../components/chat/MessageBubble';
import type { RootStackParamList } from '../../navigation/types';
import type { ChatMessage, ConversationSummary } from '../../types/domain';
import { messagesApi } from '../../api/services';
import { extractApiError } from '../../api/client';
import { SOCKET_BASE_URL } from '../../api/config';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

export const ChatRoomScreen = ({ route }: Props) => {
  const { conversationId } = route.params;
  const { user, token } = useAuthStore();

  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const receiverId = useMemo(() => {
    if (!conversation?.user?._id) return '';
    return conversation.user._id;
  }, [conversation]);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await messagesApi.getConversationMessages(conversationId);
      setConversation(payload.conversation);
      setMessages(payload.messages || []);
      await messagesApi.markConversationRead(conversationId);
    } catch (loadError: unknown) {
      Alert.alert('Chat', extractApiError(loadError, 'Failed to load conversation'));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;
    socket.emit('conversation:join', conversationId);

    socket.on('message:new', (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => {
        if (current.some((item) => item._id === message._id)) return current;
        return [...current, message];
      });
    });

    socket.on('conversation:updated', (updatedConversation: ConversationSummary) => {
      if (updatedConversation._id === conversationId) {
        setConversation(updatedConversation);
      }
    });

    socket.on('connect_error', () => {
      Alert.alert('Realtime unavailable', 'Socket connection failed. Pull to refresh chat.');
    });

    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, token]);

  const sendMessage = async () => {
    if (!input.trim() || !receiverId) return;
    const body = input.trim();

    setSending(true);
    setInput('');
    try {
      const message = await messagesApi.sendMessage({
        conversationId,
        receiverId,
        message: body,
        bookId: conversation?.book?._id,
      });
      setMessages((current) => {
        if (current.some((item) => item._id === message._id)) return current;
        return [...current, message];
      });
      await messagesApi.markConversationRead(conversationId);
    } catch (sendError: unknown) {
      setInput(body);
      Alert.alert('Send failed', extractApiError(sendError, 'Could not send message'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AppScreen
      title={conversation?.user?.name || route.params.title || 'Conversation'}
      subtitle={conversation?.book?.title ? `Book: ${conversation.book.title}` : 'Direct chat'}
      scroll={false}
      contentContainerStyle={styles.container}
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2463eb" />
        </View>
      ) : (
        <FlatList
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesContent}
          renderItem={({ item }) => {
            const senderId = typeof item.senderId === 'string' ? item.senderId : item.senderId?._id;
            const mine = senderId === user?._id;
            return (
              <MessageBubble
                message={item.message}
                createdAt={item.createdAt}
                mine={mine}
              />
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message"
          placeholderTextColor="#5e6778"
          style={styles.input}
          multiline
        />
        <PrimaryButton
          label="Send"
          onPress={sendMessage}
          loading={sending}
          disabled={!input.trim() || !receiverId}
          style={styles.sendButton}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
    marginBottom: 8,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    backgroundColor: '#f8f9fc',
  },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  sendButton: {
    marginBottom: 2,
  },
});
