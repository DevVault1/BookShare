import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { io } from 'socket.io-client'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function ChatScreen() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const socketRef = useRef(null)
  const flatListRef = useRef(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:5000')
    fetchConversations()
    return () => socketRef.current?.disconnect()
  }, [])

  useEffect(() => {
    if (activeConv) {
      const room = [user._id, activeConv.user._id].sort().join('_')
      socketRef.current?.emit('join_room', room)
      socketRef.current?.on('receive_message', msg => {
        setMessages(prev => [...prev, msg])
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)
      })
      fetchMessages(activeConv.user._id)
    }
  }, [activeConv])

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages')
      setConversations(data)
    } catch {}
  }

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/messages/${userId}`)
      setMessages(data)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)
    } catch {}
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return
    const text = input
    setInput('')
    try {
      const { data } = await api.post('/messages', { receiverId: activeConv.user._id, message: text })
      const room = [user._id, activeConv.user._id].sort().join('_')
      socketRef.current?.emit('send_message', { ...data, room })
      setMessages(prev => [...prev, data])
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)
    } catch {}
  }

  if (activeConv) {
    return (
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConv(null)} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.convAvatar}>
            <Text style={styles.convInitial}>{activeConv.user.name[0]}</Text>
          </View>
          <Text style={styles.chatHeaderName}>{activeConv.user.name}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMe = item.senderId?._id === user._id || item.senderId === user._id
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.message}
                  </Text>
                </View>
              </View>
            )
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            style={styles.chatInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>Chat with donors from book pages</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.user._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convItem} onPress={() => setActiveConv(item)}>
              <View style={styles.convAvatar}>
                <Text style={styles.convInitial}>{item.user.name[0]}</Text>
              </View>
              <View style={styles.convInfo}>
                <Text style={styles.convName}>{item.user.name}</Text>
                <Text style={styles.convLastMsg} numberOfLines={1}>{item.lastMessage?.message}</Text>
              </View>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: { color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', gap: 12 },
  convAvatar: { width: 46, height: 46, backgroundColor: '#dbeafe', borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  convInitial: { color: '#2563eb', fontSize: 18, fontWeight: '700' },
  convInfo: { flex: 1 },
  convName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  convLastMsg: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  unreadBadge: { width: 22, height: 22, backgroundColor: '#2563eb', borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#f3f4f6' },
  chatContainer: { flex: 1, backgroundColor: '#f9fafb' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  messagesList: { padding: 16, gap: 8 },
  msgRow: { flexDirection: 'row' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#111827' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  chatInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827' },
  sendBtn: { width: 44, height: 44, backgroundColor: '#2563eb', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
})
