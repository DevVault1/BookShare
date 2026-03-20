'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { BookOpen, MessageCircle, Send, User } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate } from '@/lib/utils'

type ChatUser = {
  _id: string
  name: string
  profileImage?: string
  role?: string
  location?: string
}

type ConversationBook = {
  _id: string
  title: string
  author?: string
  image?: string
  status?: string
}

type ConversationSummary = {
  _id: string
  conversationKey: string
  user: ChatUser
  book?: ConversationBook | null
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}

type ChatMessage = {
  _id: string
  conversationId: string
  senderId: ChatUser | string
  receiverId: ChatUser | string
  message: string
  createdAt: string
  bookId?: ConversationBook | null
  isRead?: boolean
}

function upsertConversation(list: ConversationSummary[], incoming: ConversationSummary) {
  const next = [...list]
  const index = next.findIndex((conversation) => conversation._id === incoming._id)
  if (index >= 0) {
    next[index] = { ...next[index], ...incoming }
  } else {
    next.unshift(incoming)
  }

  return next.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })
}

function appendMessage(list: ChatMessage[], incoming: ChatMessage) {
  if (list.some((message) => message._id === incoming._id)) {
    return list
  }
  return [...list, incoming]
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuthStore()

  const requestedConversationId = searchParams.get('conversationId')
  const requestedUserId = searchParams.get('userId')
  const requestedBookId = searchParams.get('bookId')

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const socketRef = useRef<Socket | null>(null)
  const activeConversationRef = useRef<ConversationSummary | null>(null)
  const initializedTargetRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001'

  const activeConversationTitle = useMemo(() => {
    if (!activeConversation) return ''
    if (activeConversation.book?.title) {
      return `${activeConversation.user.name} · ${activeConversation.book.title}`
    }
    return activeConversation.user.name
  }, [activeConversation])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40)
  }, [])

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true)
    try {
      const { data } = await api.get('/messages/conversations')
      setConversations(data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations.')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const openConversation = useCallback(async (conversation: ConversationSummary) => {
    if (!conversation?._id) return

    const previousConversationId = activeConversationRef.current?._id
    if (previousConversationId && previousConversationId !== conversation._id) {
      socketRef.current?.emit('conversation:leave', previousConversationId)
    }

    activeConversationRef.current = conversation
    setActiveConversation(conversation)
    setLoadingMessages(true)
    setError('')
    socketRef.current?.emit('conversation:join', conversation._id)

    try {
      const { data } = await api.get(`/messages/conversations/${conversation._id}/messages`)
      setMessages(data.messages || [])
      setActiveConversation(data.conversation)
      activeConversationRef.current = data.conversation
      setConversations((current) => upsertConversation(current, data.conversation))
      scrollToBottom()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open conversation.')
    } finally {
      setLoadingMessages(false)
    }
  }, [scrollToBottom])

  const ensureRequestedConversation = useCallback(async () => {
    if (initializedTargetRef.current || !user) return

    if (requestedConversationId) {
      const existingConversation = conversations.find((conversation) => conversation._id === requestedConversationId)
      if (existingConversation) {
        initializedTargetRef.current = true
        await openConversation(existingConversation)
        return
      }
    }

    if (requestedUserId) {
      try {
        const { data } = await api.post('/messages/conversations/start', {
          receiverId: requestedUserId,
          bookId: requestedBookId || undefined,
        })
        initializedTargetRef.current = true
        setConversations((current) => upsertConversation(current, data))
        await openConversation(data)
        return
      } catch (err: any) {
        initializedTargetRef.current = true
        setError(err.response?.data?.message || 'Failed to start this conversation.')
        return
      }
    }

    if (conversations.length > 0) {
      initializedTargetRef.current = true
      await openConversation(conversations[0])
    }
  }, [conversations, openConversation, requestedBookId, requestedConversationId, requestedUserId, user])

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchConversations()
  }, [fetchConversations, router, user])

  useEffect(() => {
    if (!user || !token) return

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('conversation:updated', (incoming: ConversationSummary) => {
      setConversations((current) => upsertConversation(current, incoming))

      if (activeConversationRef.current?._id === incoming._id) {
        const normalizedConversation = {
          ...incoming,
          unreadCount: 0,
        }
        activeConversationRef.current = normalizedConversation
        setActiveConversation(normalizedConversation)
      }
    })

    socket.on('message:new', (incoming: ChatMessage) => {
      if (activeConversationRef.current?._id !== incoming.conversationId) return
      setMessages((current) => appendMessage(current, incoming))

      const senderId = typeof incoming.senderId === 'string' ? incoming.senderId : incoming.senderId?._id
      if (senderId && senderId !== user?._id) {
        api.put(`/messages/conversations/${incoming.conversationId}/read`).catch(() => null)
      }

      scrollToBottom()
    })

    socket.on('connect_error', () => {
      setError('Live chat connection failed. Messages will still load when refreshed.')
    })

    return () => {
      if (activeConversationRef.current?._id) {
        socket.emit('conversation:leave', activeConversationRef.current._id)
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [scrollToBottom, socketUrl, token, user])

  useEffect(() => {
    if (!loadingConversations) {
      ensureRequestedConversation()
    }
  }, [ensureRequestedConversation, loadingConversations])

  const handleSendMessage = async () => {
    if (!activeConversation || !input.trim() || sending) return

    const messageText = input.trim()
    setInput('')
    setSending(true)
    setError('')

    try {
      const { data } = await api.post('/messages', {
        conversationId: activeConversation._id,
        receiverId: activeConversation.user._id,
        bookId: activeConversation.book?._id,
        message: messageText,
      })

      setMessages((current) => appendMessage(current, data))
      setConversations((current) => upsertConversation(current, {
        ...activeConversation,
        lastMessage: data.message,
        lastMessageAt: data.createdAt,
        unreadCount: 0,
      }))
      scrollToBottom()
    } catch (err: any) {
      setInput(messageText)
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">Chat directly with donors and students in real time.</p>
          </div>
          <Link href="/books" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Browse more books
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[320px,1fr] gap-4 min-h-[72vh]">
          <aside className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
              <p className="text-xs text-gray-400 mt-1">Unread badges clear when you open a thread.</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-5 space-y-3 animate-pulse">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium text-gray-500">No conversations yet</p>
                  <p className="text-sm mt-1">Use “Message Donor” from any book page to start chatting.</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = activeConversation?._id === conversation._id
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => openConversation(conversation)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800/70 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors',
                        isActive && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center overflow-hidden shrink-0">
                          {conversation.user?.profileImage ? (
                            <img src={conversation.user.profileImage} alt={conversation.user.name} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <span className="font-semibold text-sm">{conversation.user?.name?.[0] || '?'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{conversation.user?.name}</p>
                              {conversation.book?.title ? (
                                <p className="text-xs text-blue-600 truncate mt-0.5">About: {conversation.book.title}</p>
                              ) : null}
                            </div>
                            {conversation.unreadCount ? (
                              <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">
                                {conversation.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">{conversation.lastMessage || 'No messages yet'}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'Start the conversation'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col min-h-[72vh]">
            {activeConversation ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center overflow-hidden shrink-0">
                      {activeConversation.user?.profileImage ? (
                        <img src={activeConversation.user.profileImage} alt={activeConversation.user.name} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <span className="font-semibold text-sm">{activeConversation.user?.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{activeConversationTitle}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {activeConversation.book?.author ? `Book by ${activeConversation.book.author}` : `Message ${activeConversation.user?.role === 'donor' ? 'donor' : 'student'} directly`}
                      </p>
                    </div>
                  </div>

                  {activeConversation.book ? (
                    <div className="mt-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 p-3 flex items-center gap-3">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                        {activeConversation.book.image ? (
                          <img src={activeConversation.book.image} alt={activeConversation.book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-500">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeConversation.book.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activeConversation.book.author || 'Book discussion'}</p>
                        <Link href={`/books/${activeConversation.book._id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex mt-1">
                          View book details
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-950/50">
                  {loadingMessages ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className={cn('h-14 rounded-2xl bg-gray-200/70 dark:bg-gray-800', item % 2 === 0 ? 'ml-auto w-2/3' : 'w-3/4')} />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center text-gray-400 px-6">
                      <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="font-medium text-gray-500">Start the conversation</p>
                      <p className="text-sm mt-1">Ask about pickup, delivery, or book condition.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id
                      const isMe = senderId === user?._id
                      return (
                        <div key={message._id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm',
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                          )}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                            <p className={cn('text-[11px] mt-2', isMe ? 'text-blue-100' : 'text-gray-400')}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      rows={2}
                      placeholder="Type a message…"
                      className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || sending}
                      className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-400">
                <User className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium text-gray-500">Choose a conversation</p>
                <p className="text-sm mt-1">Or open a book and tap “Message Donor” to start chatting.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
