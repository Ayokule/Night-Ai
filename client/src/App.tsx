"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatPage } from "@/components/ChatPage"
import { SettingsPage } from "@/components/SettingsPage"
import { MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    }
  }

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setCurrentConversationId(id)
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error("Failed to load conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null)
    setMessages([])
    setSidebarOpen(false)
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

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
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 50) }),
        })
        if (response.ok) {
          const data = await response.json()
          conversationId = data.conversation.id
          setCurrentConversationId(conversationId)
          await fetchConversations()
        }
      } catch (error) {
        console.error("Failed to create conversation:", error)
      }
    }

    // Send to chat API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
            tool_name: m.toolName,
            tool_args: m.toolArgs,
            tool_result: m.toolResult,
          })),
          apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      // Add assistant message
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }

      // If there are tool calls, execute them in a loop
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const toolCall of data.toolCalls) {
          // Add tool call message
          const toolCallMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Calling ${toolCall.name}...`,
            createdAt: new Date().toISOString(),
            toolName: toolCall.name,
            toolArgs: JSON.stringify(toolCall.arguments),
          }
          setMessages((prev) => [...prev, toolCallMsg])

          // Execute tool
          const toolResponse = await fetch("/api/tools/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: toolCall.name,
              arguments: toolCall.arguments,
            }),
          })

          if (toolResponse.ok) {
            const toolResult = await toolResponse.json()

            // Add tool result message
            const toolResultMsg: Message = {
              id: crypto.randomUUID(),
              role: "tool",
              content: "",
              createdAt: new Date().toISOString(),
              toolName: toolCall.name,
              toolResult: JSON.stringify(toolResult.result),
            }
            setMessages((prev) => [...prev, toolResultMsg])

            // Continue the conversation with tool result
            const continueResponse = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId,
                messages: [
                  ...messages,
                  userMessage,
                  ...(data.message ? [data.message] : []),
                  toolCallMsg,
                  toolResultMsg,
                ].map((m) => ({
                  role: m.role,
                  content: m.content,
                  tool_name: m.toolName,
                  tool_args: m.toolArgs,
                  tool_result: m.toolResult,
                })),
                apiKey,
              }),
            })

            if (continueResponse.ok) {
              const continueData = await continueResponse.json()
              if (continueData.message) {
                setMessages((prev) => [...prev, continueData.message])
              }
            }
          }
        }
      }

      await fetchConversations()
    } catch (error) {
      console.error("Failed to send message:", error)
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
    </div>
  )
}