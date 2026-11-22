"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Copy, RotateCcw, Share2, Edit2, Paperclip, Code, Bot, User, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  createdAt: string
  toolName?: string
  toolArgs?: string
  toolResult?: string
}

interface ChatPageProps {
  conversationId: string | null
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string) => Promise<void>
  onNewChat: () => void
}

const WELCOME_PROMPTS = [
  { label: "Design a REST API", prompt: "Help me design a clean REST API for a task management app with proper status codes and error handling." },
  { label: "React Server Components", prompt: "Explain React Server Components vs Client Components with practical examples and when to use each." },
  { label: "Advanced TypeScript", prompt: "Write a comprehensive TypeScript utility type that transforms a union of strings into an object with those strings as keys and boolean values." },
  { label: "Code Review", prompt: "Review this code for performance issues and suggest optimizations: [paste code]" },
  { label: "Docker Best Practices", prompt: "Create a minimal Docker setup for a Node.js app with multi-stage builds and proper caching." },
  { label: "Technical Spec", prompt: "Write a clear, concise technical specification for a real-time collaboration feature." },
]

export function ChatPage({
  conversationId,
  messages,
  isLoading,
  onSendMessage,
  onNewChat,
}: ChatPageProps) {
  const [input, setInput] = useState("")
  const [textareaHeight, setTextareaHeight] = useState(48)
  const [showWelcome, setShowWelcome] = useState(!conversationId || messages.length === 0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    setShowWelcome(!conversationId || messages.length === 0)
  }, [conversationId, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 180)
      setTextareaHeight(newHeight)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false)
    handleInputChange(e.currentTarget as unknown as React.ChangeEvent<HTMLTextAreaElement>)
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput("")
    setTextareaHeight(48)
    await onSendMessage(trimmed)
  }

  const handlePromptClick = async (prompt: string) => {
    setInput(prompt)
    await onSendMessage(prompt)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (showWelcome) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg">Nova Assistant</h1>
              <p className="text-xs text-muted-foreground">GPT-4 Turbo • 128k context</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-border mb-8">
            <Bot className="h-9 w-9 text-violet-500" />
          </div>
          <h2 className="font-display font-semibold text-3xl mb-4">How can I help you today?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mb-10">
            Ask me anything — from code reviews and debugging to writing, analysis, and creative tasks.
          </p>
          <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
            {WELCOME_PROMPTS.map(({ label, prompt }) => (
              <Button
                key={label}
                variant="outline"
                className="h-auto px-4 py-3 text-left gap-3"
                onClick={() => handlePromptClick(prompt)}
              >
                <span className="text-base">{label}</span>
              </Button>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground/60">
            Nova can make mistakes. Verify important information.
          </p>
        </div>

        <footer className="border-t border-border bg-card/50 backdrop-blur-xl p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Message Nova… (Shift+Enter for new line)"
                className="w-full min-h-[48px] max-h-[180px] px-4 py-3 pr-14 bg-background border border-border rounded-xl text-base resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                rows={1}
                style={{ height: textareaHeight }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add code snippet</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                <span>Send</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Shift</kbd>
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">+</kbd>
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                <span>New line</span>
              </div>
              <Button
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                variant="premium"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-border">
            <Bot className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg">Nova Assistant</h1>
            <p className="text-xs text-muted-foreground">GPT-4 Turbo • 128k context</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share conversation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <ScrollArea className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => copyToClipboard(message.content)}
              onRegenerate={() => {}}
              onEdit={() => {}}
            />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 animate-in">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="border-t border-border bg-card/50 backdrop-blur-xl p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Message Nova… (Shift+Enter for new line)"
              className="w-full min-h-[48px] max-h-[180px] px-4 py-3 pr-14 bg-background border border-border rounded-xl text-base resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              rows={1}
              style={{ height: textareaHeight }}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add code snippet</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
              <span>Send</span>
              <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Shift</kbd>
              <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">+</kbd>
              <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
              <span>New line</span>
            </div>
            <Button
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="premium"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  onEdit,
}: {
  message: Message
  onCopy: () => void
  onRegenerate: () => void
  onEdit: () => void
}) {
  const isUser = message.role === "user"
  const isTool = message.role === "tool"

  if (isTool) {
    return (
      <div className="flex items-start gap-3 animate-in" data-tool={message.toolName}>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
          <span className="text-xs font-mono text-amber-500">fn</span>
        </div>
        <div className="flex-1">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm font-mono text-amber-400">
            Tool: {message.toolName} • Result: {message.toolResult}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3 animate-in", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={cn("flex-1 max-w-[85%]", isUser && "text-right")}>
        <div
          className={cn(
            "relative rounded-2xl px-5 py-3.5 shadow-sm",
            isUser
              ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-sm"
              : "bg-card border border-border text-foreground rounded-bl-sm"
          )}
        >
          <div className="prose prose-invert max-w-none dark:prose-invert text-base">
            {message.content.split("\n").map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">{line}</p>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-current/10">
            <span className="text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {!isUser && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRegenerate}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
              </>
            )}
            {isUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}