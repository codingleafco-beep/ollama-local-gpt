"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  MessageSquarePlus,
  Search,
  BookOpen,
  Send,
  Mic,
  Paperclip,
  User,
  Bot,
  ChevronUp,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  Plus,
  Clock,
  Globe,
  PaintBucket,
  MoreHorizontal,
  Share,
  Edit,
  Archive,
  Trash2,
  ExternalLink,
  Github,
  FileText,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bug, Download, Keyboard, Shield } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface UserCustomization {
  name: string
  occupation: string
  personality: string
  traits: string
  additionalInfo: string
  enableForNewChats: boolean
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className={`max-w-[70%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && <span className="animate-pulse">▋</span>}
          </p>
        </div>
        <div className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("llama3.2")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [openChatMenu, setOpenChatMenu] = useState<string | null>(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState("general")
  const [userCustomization, setUserCustomization] = useState<UserCustomization>({
    name: "",
    occupation: "",
    personality: "Default",
    traits: "",
    additionalInfo: "",
    enableForNewChats: true,
  })
  const [showIntegrationModal, setShowIntegrationModal] = useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showToolsDropdown, setShowToolsDropdown] = useState(false)
  const [showMoreSubmenu, setShowMoreSubmenu] = useState(false)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const [showPreferences, setShowPreferences] = useState(false)
  const [theme, setTheme] = useState<"light" | "auto" | "dark">("dark")
  const [language, setLanguage] = useState("English")
  const [chatPosition, setChatPosition] = useState("Left")

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const messages = currentChat?.messages || []

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const createNewChat = () => {
    const newChatId = Date.now().toString()
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChatId)
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    let chatId = currentChatId

    if (!chatId) {
      chatId = Date.now().toString()
      const newChat: Chat = {
        id: chatId,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        messages: [],
      }
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(chatId)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat)),
    )

    const currentMessage = message
    setMessage("")
    setIsLoading(true)

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }

    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat)),
    )

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.token) {
                accumulatedContent += data.token

                setChats((prev) =>
                  prev.map((chat) =>
                    chat.id === chatId
                      ? {
                          ...chat,
                          messages: chat.messages.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: accumulatedContent, isStreaming: !data.done }
                              : msg,
                          ),
                        }
                      : chat,
                  ),
                )
              }

              if (data.done) {
                setChats((prev) =>
                  prev.map((chat) =>
                    chat.id === chatId
                      ? {
                          ...chat,
                          messages: chat.messages.map((msg) =>
                            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg,
                          ),
                        }
                      : chat,
                  ),
                )
                break
              }
            } catch (parseError) {
              console.error("Error parsing streaming data:", parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to connect to Ollama"}. Make sure Ollama is running on localhost:11434 and you have a model installed (e.g., 'ollama pull llama3.2').`,
        timestamp: new Date(),
        isStreaming: false,
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg)),
              }
            : chat,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const saveCustomization = () => {
    // In a real app, this would save to backend/localStorage
    setShowCustomize(false)
  }

  const shareChat = (chatId: string) => {
    // In a real app, this would generate a shareable link
    console.log("Sharing chat:", chatId)
    setOpenChatMenu(null)
  }

  const renameChat = (chatId: string) => {
    const newTitle = prompt("Enter new chat title:")
    if (newTitle && newTitle.trim()) {
      setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat)))
    }
    setOpenChatMenu(null)
  }

  const archiveChat = (chatId: string) => {
    // In a real app, this would move to archived chats
    console.log("Archiving chat:", chatId)
    setOpenChatMenu(null)
  }

  const deleteChat = (chatId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }
    }
    setOpenChatMenu(null)
  }

  const handleFileAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      // Accept all files except images
      return !file.type.startsWith("image/")
    })
    setAttachedFiles((prev) => [...prev, ...validFiles])
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80"
            onClick={createNewChat}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Navigation */}
        <div className="px-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Search className="h-4 w-4" />
            Search chats
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <BookOpen className="h-4 w-4" />
            Library
          </Button>
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        {/* Model Selection Dropdown */}
        <div className="px-4 mb-4">
          <label className="text-xs text-sidebar-foreground mb-2 block">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-sidebar-accent text-sidebar-foreground rounded-md px-3 py-2 text-sm border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          >
            <option value="llama3.2">Llama 3.2</option>
            <option value="llama3.1">Llama 3.1</option>
            <option value="llama3">Llama 3</option>
            <option value="codellama">Code Llama</option>
            <option value="mistral">Mistral</option>
            <option value="phi3">Phi-3</option>
          </select>
        </div>

        {/* Chat History */}
        <div className="flex-1 px-4">
          {chats.length > 0 && (
            <>
              <div className="text-xs font-medium text-sidebar-foreground mb-3 px-2">Chats</div>
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div key={chat.id} className="relative group">
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-left text-sidebar-foreground hover:bg-sidebar-accent truncate px-2 py-2 h-auto min-h-[2.5rem] pr-8 ${
                          currentChatId === chat.id ? "bg-sidebar-accent" : ""
                        }`}
                        onClick={() => setCurrentChatId(chat.id)}
                      >
                        <span className="truncate text-sm leading-relaxed">{chat.title}</span>
                      </Button>

                      {/* Three-dot menu button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenChatMenu(openChatMenu === chat.id ? null : chat.id)
                        }}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>

                      {/* Context menu dropdown */}
                      {openChatMenu === chat.id && (
                        <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 w-40 z-50">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => shareChat(chat.id)}
                          >
                            <Share className="h-4 w-4" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => renameChat(chat.id)}
                          >
                            <Edit className="h-4 w-4" />
                            Rename
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => archiveChat(chat.id)}
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive hover:text-destructive"
                            onClick={() => deleteChat(chat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-sidebar-border relative">
          <Button
            variant="ghost"
            className="w-full justify-between text-left p-2 h-auto hover:bg-sidebar-accent"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground text-xs font-semibold">
                O
              </div>
              <div>
                <div className="text-sm text-sidebar-foreground">Ollama GPT</div>
                <div className="text-xs text-muted-foreground">Local AI</div>
              </div>
            </div>
            <ChevronUp className={`h-4 w-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
          </Button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-lg shadow-lg py-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  setShowCustomize(true)
                  setShowUserMenu(false)
                }}
              >
                <Sparkles className="h-4 w-4" />
                Customize ChatGPT
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => {
                  setShowSettings(true)
                  setShowUserMenu(false)
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <DropdownMenu open={showPreferences} onOpenChange={setShowPreferences}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent">
                    <Settings className="h-4 w-4" />
                    Preferences
                    <span className="ml-auto">→</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-64 p-3">
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-foreground mb-3">Preferences</div>

                    {/* Theme Selection */}
                    <div className="space-y-2">
                      <div className="text-sm text-foreground">Theme</div>
                      <div className="flex gap-1">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => setTheme("light")}
                        >
                          <Sun className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={theme === "auto" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => setTheme("auto")}
                        >
                          <Monitor className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => setTheme("dark")}
                        >
                          <Moon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-2">
                      <div className="text-sm text-foreground">Language</div>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chat Position */}
                    <div className="space-y-2">
                      <div className="text-sm text-foreground">Chat Position</div>
                      <Select value={chatPosition} onValueChange={setChatPosition}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Left">Left</SelectItem>
                          <SelectItem value="Center">Center</SelectItem>
                          <SelectItem value="Right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Sign Out */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 px-0 py-2 text-sm hover:bg-accent"
                      onClick={() => {
                        setShowPreferences(false)
                        setShowUserMenu(false)
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu open={showHelpMenu} onOpenChange={setShowHelpMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent">
                    <HelpCircle className="h-4 w-4" />
                    Help
                    <span className="ml-auto">→</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help center
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Release notes
                    <span className="ml-auto">→</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    Terms & policies
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bug className="mr-2 h-4 w-4" />
                    Report Bug
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download apps
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Keyboard className="mr-2 h-4 w-4" />
                    Keyboard shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator className="my-1" />
              <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2 text-sm hover:bg-accent">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef} onClick={() => setOpenChatMenu(null)}>
          <div className="max-w-3xl mx-auto">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
                  <div className="flex gap-4 mb-6">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-2xl font-medium text-foreground mb-8">What are you working on?</h1>
                <p className="text-muted-foreground text-sm">Connected to Ollama • Model: {selectedModel}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="truncate max-w-32">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-accent-foreground/10"
                      onClick={() => removeAttachedFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                <DropdownMenu open={showToolsDropdown} onOpenChange={setShowToolsDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Tools</div>
                    <DropdownMenuItem onClick={() => setSelectedTool("study")}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study and learn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedTool("think")}>
                      <Clock className="mr-2 h-4 w-4" />
                      Think longer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedTool("research")}>
                      <Search className="mr-2 h-4 w-4" />
                      Deep research
                    </DropdownMenuItem>
                    <DropdownMenuSub open={showMoreSubmenu} onOpenChange={setShowMoreSubmenu}>
                      <DropdownMenuSubTrigger>
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        More
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setSelectedTool("web-search")}>
                          <Globe className="mr-2 h-4 w-4" />
                          Web search
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedTool("canvas")}>
                          <PaintBucket className="mr-2 h-4 w-4" />
                          Canvas
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={handleFileAttachment}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything"
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                  <Mic className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={sendMessage}
                  disabled={isLoading || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.md,.yaml,.yml,.toml,.ini,.cfg,.log"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground text-center mt-2">
              Ollama can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Customize ChatGPT Modal */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">Customize ChatGPT</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce yourself to get better, more personalized responses
            </p>

            <div className="space-y-2">
              <Label htmlFor="name">What should ChatGPT call you?</Label>
              <Input
                id="name"
                placeholder="Nickname"
                value={userCustomization.name}
                onChange={(e) => setUserCustomization((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">What do you do?</Label>
              <Textarea
                id="occupation"
                placeholder="Engineering student at University of Waterloo"
                value={userCustomization.occupation}
                onChange={(e) => setUserCustomization((prev) => ({ ...prev, occupation: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>What personality should ChatGPT have?</Label>
              <Select
                value={userCustomization.personality}
                onValueChange={(value) => setUserCustomization((prev) => ({ ...prev, personality: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="traits">What traits should ChatGPT have?</Label>
              <Textarea
                id="traits"
                placeholder="Describe desired traits"
                value={userCustomization.traits}
                onChange={(e) => setUserCustomization((prev) => ({ ...prev, traits: e.target.value }))}
                rows={2}
              />

              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Chatty",
                  "Witty",
                  "Straight shooting",
                  "Encouraging",
                  "Gen Z",
                  "Traditional",
                  "Forward thinking",
                ].map((trait) => (
                  <Button
                    key={trait}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-transparent"
                    onClick={() => {
                      const currentTraits = userCustomization.traits
                      const newTraits = currentTraits ? `${currentTraits}, ${trait}` : trait
                      setUserCustomization((prev) => ({ ...prev, traits: newTraits }))
                    }}
                  >
                    + {trait}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">Anything else ChatGPT should know about you?</Label>
              <Textarea
                id="additional"
                placeholder="Interests, values, or preferences to keep in mind"
                value={userCustomization.additionalInfo}
                onChange={(e) => setUserCustomization((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-new-chats"
                checked={userCustomization.enableForNewChats}
                onCheckedChange={(checked) => setUserCustomization((prev) => ({ ...prev, enableForNewChats: checked }))}
              />
              <Label htmlFor="enable-new-chats" className="text-sm">
                Enable for new chats
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCustomize(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveCustomization} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">Settings</DialogTitle>
          </DialogHeader>

          <div className="flex gap-6">
            {/* Settings Sidebar */}
            <div className="w-48 space-y-1">
              <Button
                variant={activeSettingsTab === "general" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("general")}
              >
                <Settings className="h-4 w-4" />
                General
              </Button>
              <Button
                variant={activeSettingsTab === "notifications" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("notifications")}
              >
                <span className="w-4 h-4 flex items-center justify-center">🔔</span>
                Notifications
              </Button>
              <Button
                variant={activeSettingsTab === "personalization" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("personalization")}
              >
                <User className="h-4 w-4" />
                Personalization
              </Button>
              <Button
                variant={activeSettingsTab === "connected-apps" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("connected-apps")}
              >
                <span className="w-4 h-4 flex items-center justify-center">🔗</span>
                Connected apps
              </Button>
              <Button
                variant={activeSettingsTab === "data-controls" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("data-controls")}
              >
                <span className="w-4 h-4 flex items-center justify-center">🛡️</span>
                Data controls
              </Button>
              <Button
                variant={activeSettingsTab === "security" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("security")}
              >
                <span className="w-4 h-4 flex items-center justify-center">🔒</span>
                Security
              </Button>
              <Button
                variant={activeSettingsTab === "account" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => setActiveSettingsTab("account")}
              >
                <User className="h-4 w-4" />
                Account
              </Button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              {activeSettingsTab === "general" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">General</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Theme</div>
                      <Select defaultValue="system">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Accent color</div>
                      <Select defaultValue="default">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Language</div>
                      <Select defaultValue="auto">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Spoken language</div>
                        <div className="text-sm text-muted-foreground">
                          For best results, select the language you mainly speak. If it's not listed, it may still be
                          supported via auto-detection.
                        </div>
                      </div>
                      <Select defaultValue="auto">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Voice</div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          ▶ Play
                        </Button>
                        <Select defaultValue="juniper">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="juniper">Juniper</SelectItem>
                            <SelectItem value="sky">Sky</SelectItem>
                            <SelectItem value="cove">Cove</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Show follow up suggestions in chats</div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "notifications" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Responses</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when ChatGPT responds to requests that take time, like research or image
                          generation.
                        </div>
                      </div>
                      <Select defaultValue="push">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="push">Push</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Tasks</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when tasks you've created have updates.
                        </div>
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-500">
                          Manage tasks
                        </Button>
                      </div>
                      <Select defaultValue="push-email">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="push-email">Push, Email</SelectItem>
                          <SelectItem value="push">Push</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "personalization" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Personalization</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Custom instructions</div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Memory</h4>
                        <span className="text-sm text-muted-foreground">ℹ️</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">Reference saved memories</div>
                          <div className="text-sm text-muted-foreground">
                            Let ChatGPT save and use memories when responding.
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div className="font-medium">Manage memories</div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "connected-apps" && (
                <div className="space-y-8">
                  {/* Supabase Integration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Supabase</h3>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Docs
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Integrate user authentication, data storage, and backend capabilities.
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Organizations</span>
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">Admin</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Connected Supabase organizations will be accessible to all members in this workspace.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowIntegrationModal("supabase")}>
                          Manage Connected Organizations
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* GitHub Integration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">GitHub</h3>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Docs
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sync your project 2-way with GitHub to collaborate at source.
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Connected Account</span>
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">Admin</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Add your GitHub account to manage connected organizations.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowIntegrationModal("github")}>
                          <Github className="h-4 w-4 mr-2" />
                          Connect GitHub
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stripe Integration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Stripe</h3>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Docs
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Accept payments and manage subscriptions with secure payment processing.
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Payment Gateway</span>
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">Admin</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Connect your Stripe account to enable payment processing.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowIntegrationModal("stripe")}>
                          Connect Stripe
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "data-controls" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Data controls</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Improve the model for everyone</div>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Shared links</div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Archived chats</div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Archive all chats</div>
                      <Button variant="outline" size="sm">
                        Archive all
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Delete all chats</div>
                      <Button variant="destructive" size="sm">
                        Delete all
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Export data</div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "security" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Multi-factor authentication</div>
                        <div className="text-sm text-muted-foreground">
                          Require an extra security challenge when logging in. If you are unable to pass this challenge,
                          you will have the option to recover your account via email.
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Log out of this device</div>
                      <Button variant="outline" size="sm">
                        Log out
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">Log out of all devices</div>
                        <div className="text-sm text-muted-foreground">
                          Log out of all active sessions across all devices, including your current session. It may take
                          up to 30 minutes for other devices to be logged out.
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        Log out all
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Secure sign in with ChatGPT</h4>
                        <p className="text-sm text-muted-foreground">
                          Sign in to websites and apps across the internet with the trusted security of ChatGPT.
                        </p>
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-500">
                          Learn more
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          You haven't used ChatGPT to sign into any websites or apps yet. Once you do, they'll show up
                          here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === "account" && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Account</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Get ChatGPT Plus</div>
                      <Button>Upgrade</Button>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-3">Get everything in Free, and more.</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Extended limits on GPT-5, our flagship model</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Standard and advanced voice mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>
                            Access to deep research, multiple reasoning models (o4-mini, o4-mini-high, and o3), and a
                            research preview of GPT-4.5
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Create and use tasks, projects, and custom GPTs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Limited access to Sora video generation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Opportunities to test new features</span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="font-medium">Delete account</div>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium">GPT builder profile</h4>
                      <p className="text-sm text-muted-foreground">
                        Personalize your builder profile to connect with users of your GPTs. These settings apply to
                        publicly shared GPTs.
                      </p>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="font-medium">PlaceholderGPT</div>
                        <div className="text-sm text-muted-foreground">By community builder 🏗️</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Management Modal */}
      <Dialog open={!!showIntegrationModal} onOpenChange={() => setShowIntegrationModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {showIntegrationModal === "supabase" && "Linked Supabase Organizations"}
              {showIntegrationModal === "github" && "GitHub Integration"}
              {showIntegrationModal === "stripe" && "Stripe Integration"}
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">Admin</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {showIntegrationModal === "supabase" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Anyone in your Lovable workspace can view and link Supabase projects.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium mb-2">Workspace</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          M
                        </div>
                        <span className="font-medium">My Lovable</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Supabase Organizations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">dustinwloring1988's Org</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Reconnect
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">free-plans</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent">
                    Add More Organizations
                  </Button>
                </div>
              </>
            )}

            {showIntegrationModal === "github" && (
              <div className="text-center py-8">
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Connect your GitHub account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Authorize access to sync your repositories and collaborate on projects.
                </p>
                <Button>
                  <Github className="h-4 w-4 mr-2" />
                  Authorize GitHub
                </Button>
              </div>
            )}

            {showIntegrationModal === "stripe" && (
              <div className="text-center py-8">
                <div className="h-12 w-12 mx-auto mb-4 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <h3 className="font-medium mb-2">Connect your Stripe account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link your Stripe account to enable secure payment processing.
                </p>
                <Button>Connect Stripe Account</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
