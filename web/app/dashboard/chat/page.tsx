'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { BookOpen, Flag, MessageCircle, Search, Send, User } from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn, formatDate } from '@/lib/utils'
import ReportDialog from '@/components/safety/ReportDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportSuccess, setReportSuccess] = useState('')
  const [search, setSearch] = useState('')

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

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((conversation) => {
      return [conversation.user?.name, conversation.book?.title, conversation.lastMessage]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [conversations, search])

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

  if (!user) return null

  return (
    <div className="page-shell">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-3 pb-10 pt-6 sm:px-6">
        <section className="surface-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Messaging workspace</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Real-time conversations with a cleaner, more premium layout.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Talk to donors and readers, keep book context visible, and handle reports without leaving the chat surface.</p>
            </div>
            {activeConversation ? (
              <Button variant="outline" onClick={() => setShowReportDialog(true)} className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
                <Flag className="mr-2 h-4 w-4" /> Report user
              </Button>
            ) : null}
          </div>
          {reportSuccess ? (
            <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {reportSuccess}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
          <Card className="rounded-[1.75rem] xl:sticky xl:top-28 h-fit">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Search by reader, donor, book, or latest message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="pl-10" />
              </div>

              <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1 hide-scrollbar">
                {loadingConversations ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-[1.5rem] bg-muted p-4 h-24" />
                  ))
                ) : filteredConversations.length === 0 ? (
                  <EmptyState icon={MessageCircle} title="No conversations found" description="Start from a book page by tapping “Message donor” to open a new thread." className="border-0 shadow-none" />
                ) : (
                  filteredConversations.map((conversation) => {
                    const isActive = activeConversation?._id === conversation._id
                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => openConversation(conversation)}
                        className={cn('w-full rounded-[1.5rem] border p-4 text-left transition', isActive ? 'border-primary/20 bg-primary/5' : 'border-border/70 hover:bg-accent/60')}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={conversation.user?.profileImage} alt={conversation.user?.name} />
                            <AvatarFallback>{conversation.user?.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{conversation.user?.name}</p>
                                {conversation.book?.title ? <p className="mt-0.5 truncate text-xs text-primary">About: {conversation.book.title}</p> : null}
                              </div>
                              {conversation.unreadCount ? <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">{conversation.unreadCount}</span> : null}
                            </div>
                            <p className="mt-2 truncate text-sm text-muted-foreground">{conversation.lastMessage || 'No messages yet'}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'Start the conversation'}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem]">
            {activeConversation ? (
              <>
                <CardHeader className="border-b border-border/70 bg-muted/30">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={activeConversation.user?.profileImage} alt={activeConversation.user?.name} />
                        <AvatarFallback>{activeConversation.user?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{activeConversationTitle}</CardTitle>
                        <CardDescription>{activeConversation.book?.author ? `Book by ${activeConversation.book.author}` : `Message ${activeConversation.user?.role === 'donor' ? 'donor' : 'student'} directly`}</CardDescription>
                      </div>
                    </div>
                    {activeConversation.book ? (
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={`/books/${activeConversation.book._id}`}>
                          <BookOpen className="mr-2 h-4 w-4" /> View book
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>

                {activeConversation.book ? (
                  <div className="border-b border-border/70 bg-primary/5 px-6 py-4">
                    <div className="flex items-center gap-3 rounded-[1.5rem] border border-primary/15 bg-background/80 p-3">
                      <div className="h-16 w-12 overflow-hidden rounded-xl bg-muted">
                        {activeConversation.book.image ? (
                          <img src={activeConversation.book.image} alt={activeConversation.book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-primary"><BookOpen className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{activeConversation.book.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{activeConversation.book.author || 'Book discussion'}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="max-h-[58vh] min-h-[420px] overflow-y-auto bg-background/60 px-6 py-5 hide-scrollbar">
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className={cn('h-16 rounded-[1.5rem] bg-muted', item % 2 === 0 ? 'ml-auto w-2/3' : 'w-3/4')} />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptyState icon={MessageCircle} title="Start the conversation" description="Ask about pickup timing, delivery, condition, or reading suitability." className="border-0 shadow-none min-h-[320px]" />
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id
                        const isMe = senderId === user?._id
                        return (
                          <div key={message._id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm md:max-w-[70%]', isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'border border-border/70 bg-card rounded-bl-md')}>
                              <p className="whitespace-pre-wrap text-sm leading-7">{message.message}</p>
                              <p className={cn('mt-2 text-[11px]', isMe ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-border/70 bg-card px-6 py-4">
                  <div className="flex items-end gap-3">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      rows={2}
                      placeholder="Type a message..."
                      className="min-h-[88px] flex-1 resize-none"
                    />
                    <Button onClick={handleSendMessage} disabled={!input.trim() || sending} className="h-12 rounded-2xl px-5">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex min-h-[560px] items-center justify-center p-8">
                <EmptyState icon={User} title="Choose a conversation" description="Select an existing thread, or open a book and tap “Message donor” to create a new chat." className="border-0 shadow-none" />
              </CardContent>
            )}
          </Card>
        </section>
      </main>

      {activeConversation ? (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          targetType="user"
          targetId={activeConversation.user?._id}
          targetLabel={`user: ${activeConversation.user?.name || 'Unknown user'}`}
          initialCategory="suspicious_user"
          onSubmitted={(message) => setReportSuccess(message)}
        />
      ) : null}
    </div>
  )
}
