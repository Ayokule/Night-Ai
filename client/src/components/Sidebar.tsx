"use client"

import { useState } from "react"
import {
  MessageSquare,
  Plus,
  Settings,
  X,
  Search,
  MoreHorizontal,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedConversations = filteredConversations.reduce((acc, conv) => {
    const date = new Date(conv.updatedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let group = "Older"
    if (date.toDateString() === today.toDateString()) {
      group = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Yesterday"
    } else if (date > new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)) {
      group = "Previous 7 Days"
    }

    if (!acc[group]) acc[group] = []
    acc[group].push(conv)
    return acc
  }, {} as Record<string, Conversation[]>)

  return (
    <>
      <button
        className={cn(
          "fixed top-4 left-4 z-50 lg:hidden rounded-xl bg-card border border-border p-2 shadow-lg",
          isOpen && "translate-x-0",
          !isOpen && "-translate-x-full"
        )}
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-80 transform transition-transform duration-300 ease-in-out bg-card border-r border-border flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Chat history"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">Night AI</span>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 lg:p-6 border-b border-border">
          <Button
            className="w-full justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25"
            onClick={onNewChat}
            variant="premium"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="p-4 lg:p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto px-4 lg:px-6">
          {Object.keys(groupedConversations).length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedConversations).map(([group, convs]) => (
                <div key={group} className="mb-6 animate-in">
                  <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {convs.map((conv) => (
                      <div
                        key={conv.id}
                        className="relative group"
                      >
                        <button
                          onClick={() => onSelectConversation(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                            currentConversationId === conv.id
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                          </span>
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteConversation(conv.id)
                            }}
                            className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors"
                            aria-label="Delete conversation"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </ScrollArea>

        <div className="p-4 lg:p-6 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-violet-600 to-blue-600">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">John Developer</p>
                  <p className="text-xs text-muted-foreground">Pro • GPT-4 Turbo</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => window.location.href = '/settings'}
                className="flex w-full items-center justify-start cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  )
}