'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, User } from 'lucide-react'
import { io } from 'socket.io-client'
import Navbar from '@/components/layout/Navbar'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('userId')
  const [messages, setMessages] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001')
    fetchConversations()
    return () => socketRef.current?.disconnect()
  }, [user])

  useEffect(() => {
    if (activeConv) {
      const roomId = [user?._id, activeConv.user._id].sort().join('_')
      socketRef.current?.emit('join_room', roomId)
      socketRef.current?.on('receive_message', (msg: any) => {
        setMessages(prev => [...prev, msg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      fetchMessages(activeConv.user._id)
    }
  }, [activeConv])

  useEffect(() => {
    if (targetUserId && conversations.length > 0) {
      const conv = conversations.find((c: any) => c.user._id === targetUserId)
      if (conv) setActiveConv(conv)
    }
  }, [targetUserId, conversations])

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages')
      setConversations(data)
    } catch (err) { console.error(err) }
  }

  const fetchMessages = async (userId: string) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/messages/${userId}`)
      setMessages(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return
    const msgData = { receiverId: activeConv.user._id, message: input }
    setInput('')
    try {
      const { data } = await api.post('/messages', msgData)
      const roomId = [user?._id, activeConv.user._id].sort().join('_')
      socketRef.current?.emit('send_message', { ...data, room: roomId })
      setMessages(prev => [...prev, data])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-6 gap-4" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Conversations sidebar */}
        <div className="w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
            ) : (
              conversations.map((conv: any) => (
                <button key={conv.user._id} onClick={() => setActiveConv(conv)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left', activeConv?.user._id === conv.user._id && 'bg-blue-50 dark:bg-blue-900/20')}>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.user.profileImage ? (
                      <img src={conv.user.profileImage} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <span className="text-sm font-bold text-blue-600">{conv.user.name[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{conv.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.message}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{conv.unread}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{activeConv.user.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{activeConv.user.name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : messages.map((msg: any, i) => {
                  const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id
                  return (
                    <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm', isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm')}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                <input
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <User className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">or start chatting with a donor from a book page</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
