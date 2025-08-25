'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  MessageSquare, 
  Search, 
  Library, 
  Send, 
  Mic, 
  MoreHorizontal,
  Share,
  Bug,
  FileText
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-oss-20b')
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState<any>(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('ollama-chats')
    const savedModel = localStorage.getItem('ollama-selected-model')
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setChats(parsedChats)
      } catch (error) {
        console.error('Error loading chats from localStorage:', error)
      }
    }
    
    if (savedModel) {
      setSelectedModel(savedModel)
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('ollama-chats', JSON.stringify(chats))
    }
  }, [chats])

  // Save selected model to localStorage
  useEffect(() => {
    localStorage.setItem('ollama-selected-model', selectedModel)
  }, [selectedModel])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChatId, chats])

  const currentChat = chats.find(chat => chat.id === currentChatId)

  const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a short, concise title (max 5 words) for a chat that starts with: "${firstMessage}". Only respond with the title, nothing else.`,
          model: 'qwen2:0.5b'
        })
      })

      if (!response.ok) throw new Error('Failed to generate title')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let title = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.token) {
                  title += data.token
                }
                if (data.done) {
                  return title.trim() || 'New Chat'
                }
              } catch (e) {
                continue
              }
            }
          }
        }
      }

      return title.trim() || 'New Chat'
    } catch (error) {
      console.error('Error generating title:', error)
      return 'New Chat'
    }
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
  }

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    let chatId = currentChatId
    let isNewChat = false

    // Create new chat if none exists
    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date()
      }
      setChats(prev => [newChat, ...prev])
      chatId = newChat.id
      setCurrentChatId(chatId)
      isNewChat = true
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    }

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ))

    const currentMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          model: selectedModel
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }

      // Add empty assistant message
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ))

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.token) {
                  assistantContent += data.token
                  // Update assistant message content
                  setChats(prev => prev.map(chat => 
                    chat.id === chatId 
                      ? {
                          ...chat,
                          messages: chat.messages.map(msg => 
                            msg.id === assistantMessage.id 
                              ? { ...msg, content: assistantContent }
                              : msg
                          )
                        }
                      : chat
                  ))
                }
              } catch (e) {
                continue
              }
            }
          }
        }
      }

      // Generate title for new chat
      if (isNewChat && assistantContent) {
        const title = await generateChatTitle(currentMessage)
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title }
            : chat
        ))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your request. Please make sure Ollama is running.',
        role: 'assistant',
        timestamp: new Date()
      }

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchReleaseNotes = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/codingleafco-beep/ollama-local-gpt/releases/latest')
      if (response.ok) {
        const release = await response.json()
        setReleaseNotes(release)
      } else {
        setReleaseNotes({
          tag_name: 'v1.0.0',
          name: 'Initial Release',
          body: 'This is the initial release of Ollama Local GPT.',
          published_at: new Date().toISOString()
        })
      }
    } catch (error) {
      setReleaseNotes({
        tag_name: 'v1.0.0',
        name: 'Initial Release',
        body: 'This is the initial release of Ollama Local GPT.',
        published_at: new Date().toISOString()
      })
    }
  }

  const openReleaseNotes = () => {
    fetchReleaseNotes()
    setReleaseNotesOpen(true)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button 
            onClick={createNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4" />
            New chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Chats</div>
            {filteredChats.map((chat) => (
              <Button
                key={chat.id}
                variant={currentChatId === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 h-auto p-3"
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="text-left truncate">
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {chat.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Library className="w-4 h-4" />
            Library
          </Button>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="w-4 h-4" />
                Preferences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full h-[600px] max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Preferences</DialogTitle>
              </DialogHeader>
              <div className="flex h-full">
                <div className="w-48 border-r border-border pr-4">
                  <div className="space-y-1">
                    <Button
                      variant={activeSettingsTab === 'general' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveSettingsTab('general')}
                    >
                      General
                    </Button>
                    <Button
                      variant={activeSettingsTab === 'models' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveSettingsTab('models')}
                    >
                      Models
                    </Button>
                    <Button
                      variant={activeSettingsTab === 'about' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveSettingsTab('about')}
                    >
                      About
                    </Button>
                  </div>
                </div>
                <div className="flex-1 pl-6">
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">General Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode">Dark Mode</Label>
                            <Switch id="dark-mode" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sound">Sound Effects</Label>
                            <Switch id="sound" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === 'models' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Model Settings</h3>
                        <div className="space-y-4">
                          <div>
                            <Label>Default Model</Label>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gpt-oss-20b">GPT-OSS 20B</SelectItem>
                                <SelectItem value="gpt-oss-120b">GPT-OSS 120B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === 'about' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">About</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Ollama Local GPT - A local ChatGPT clone using Ollama models
                            </p>
                            <div className="space-y-2">
                              <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2"
                                onClick={openReleaseNotes}
                              >
                                <FileText className="w-4 h-4" />
                                Release Notes
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2"
                                onClick={() => window.open('https://github.com/codingleafco-beep/ollama-local-gpt', '_blank')}
                              >
                                <Bug className="w-4 h-4" />
                                Report a Bug
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={releaseNotesOpen} onOpenChange={setReleaseNotesOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Release Notes</DialogTitle>
              </DialogHeader>
              {releaseNotes && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{releaseNotes.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Version {releaseNotes.tag_name} • {new Date(releaseNotes.published_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Separator />
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{releaseNotes.body}</pre>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {currentChat?.title || 'Ollama Local GPT'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {currentChat ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Hey, Open. Ready to dive in?</h2>
                <p className="text-muted-foreground">Start a conversation to get started</p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-muted rounded-lg p-2">
              <div className="flex-1 flex items-end gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-40 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-oss-20b">GPT-OSS 20B</SelectItem>
                    <SelectItem value="gpt-oss-120b">GPT-OSS 120B</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ask anything"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || isLoading}
                  size="icon"
                  className="h-8 w-8"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Ollama can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}