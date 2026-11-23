"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatPage } from "@/components/ChatPage"
import { SettingsPage } from "@/components/SettingsPage"
import { DebugPanel } from "@/components/DebugPanel"
import { MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logApi, logChat, logState, logError } from "@/lib/debugger"

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  createdAt: string
  toolName?: string
  toolArgs?: string
  toolResult?: string
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<"chat" | "settings">("chat")
  const [apiKey, setApiKey] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    document.documentElement.setAttribute("data-theme", initialTheme)
  }, [])

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("freellm_api_key")
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    logApi('debug', 'Fetching conversations')
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        const convs = data.conversations || []
        setConversations(convs)
        logApi('info', `Loaded ${convs.length} conversations`, { conversations: convs })
      } else {
        logApi('error', `Failed to fetch conversations: ${response.status}`, { status: response.status })
      }
    } catch (error) {
      logError('API', 'Failed to fetch conversations', error)
    }
  }

  const loadConversation = useCallback(async (id: string) => {
    logChat('info', 'Loading conversation', { conversationId: id })
    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const data = await response.json()
        const msgs = data.messages || []
        setMessages(msgs)
        setCurrentConversationId(id)
        setSidebarOpen(false)
        logChat('info', `Loaded conversation with ${msgs.length} messages`, { messageCount: msgs.length })
      } else {
        logChat('error', `Failed to load conversation: ${response.status}`, { status: response.status })
      }
    } catch (error) {
      logError('CHAT', 'Failed to load conversation', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    logChat('info', 'Starting new chat')
    setCurrentConversationId(null)
    setMessages([])
    setSidebarOpen(false)
    logState('debug', 'State reset for new chat')
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    logChat('info', 'Sending message', { content, conversationId: currentConversationId, hasApiKey: !!apiKey })

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // If no current conversation, create one
    let conversationId = currentConversationId
    if (!conversationId) {
      try {
        logApi('debug', 'Creating new conversation')
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 50) }),
        })
        if (response.ok) {
          const data = await response.json()
          conversationId = data.conversation.id
          setCurrentConversationId(conversationId)
          logApi('info', 'Created new conversation', { conversationId })
          await fetchConversations()
        } else {
          logApi('error', `Failed to create conversation: ${response.status}`)
        }
      } catch (error) {
        logError('API', 'Failed to create conversation', error)
      }
    }

    // Send to chat API
    try {
      logApi('debug', 'Calling chat API', { message: content, conversationId, apiKey: apiKey ? '***' : 'none' })
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId,
          apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const data = await response.json()
      logApi('info', 'Received chat response', { response: data.response?.slice(0, 100), conversationId: data.conversationId })

      // Add assistant message (backend does all agentic loop internally)
      if (data.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        logChat('info', 'Added assistant message to UI', { messageLength: data.response.length })
      }

      await fetchConversations()
    } catch (error) {
      logError('CHAT', 'Failed to send message', error)
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      logState('debug', 'Loading state reset')
    }
  }

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" })
      await fetchConversations()
      if (currentConversationId === id) {
        handleNewChat()
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  if (view === "settings") {
    return (
      <SettingsPage
        onBack={() => setView("chat")}
        apiKey={apiKey}
        setApiKey={setApiKey}
        theme={theme}
        setTheme={setTheme}
      />
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 rounded-xl bg-card border border-border p-2 shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">Night AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setView("settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleNewChat}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <ChatPage
          conversationId={currentConversationId}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onNewChat={handleNewChat}
        />
      </main>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  )
}