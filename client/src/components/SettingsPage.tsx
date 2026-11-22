"use client"

import { useState, useEffect } from "react"
import {
  Moon,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Globe,
  Shield,
  Bell,
  Wrench,
  Zap,
  Save,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SettingsPageProps {
  onBack: () => void
  apiKey: string
  setApiKey: (key: string) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

export function SettingsPage({
  onBack,
  apiKey,
  setApiKey,
  theme,
  setTheme,
}: SettingsPageProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [language, setLanguage] = useState("en-US")
  const [timezone, setTimezone] = useState("America/Los_Angeles")
  const [keyStatus, setKeyStatus] = useState<"active" | "revoked" | "rotating" | "revoking">("active")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const savedKey = localStorage.getItem("freellm_api_key")
    if (savedKey && savedKey !== apiKey) {
      setApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
  }

  const handleSaveSettings = async () => {
    try {
      localStorage.setItem("freellm_api_key", apiKey)
      localStorage.setItem("theme", theme)
      showToast("Settings saved successfully")
    } catch (error) {
      showToast("Failed to save settings", "error")
    }
  }

  const handleRotateKey = async () => {
    setKeyStatus("rotating")
    try {
      const response = await fetch("/api/keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentKey: apiKey }),
      })
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.newKey)
        localStorage.setItem("freellm_api_key", data.newKey)
        showToast("API key rotated successfully")
      } else {
        showToast("Failed to rotate key", "error")
      }
    } catch (error) {
      showToast("Failed to rotate key", "error")
    } finally {
      setKeyStatus("active")
    }
  }

  const handleRevokeKey = async () => {
    if (!confirm("Revoke the current API key? This will immediately invalidate it.")) return
    setKeyStatus("revoking")
    try {
      const response = await fetch("/api/keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey }),
      })
      if (response.ok) {
        setApiKey("")
        localStorage.removeItem("freellm_api_key")
        setKeyStatus("revoked")
        showToast("API key revoked")
      } else {
        showToast("Failed to revoke key", "error")
        setKeyStatus("active")
      }
    } catch (error) {
      showToast("Failed to revoke key", "error")
      setKeyStatus("active")
    }
  }

  const handleDeleteAccount = async () => {
    const confirm1 = confirm("This will permanently delete your account and all data. This cannot be undone. Continue?")
    if (!confirm1) return
    const confirm2 = prompt('Type "DELETE" to confirm:')
    if (confirm2 !== "DELETE") {
      alert("Confirmation text does not match.")
      return
    }
    try {
      await fetch("/api/account/delete", { method: "DELETE" })
      localStorage.clear()
      showToast("Account deleted")
      onBack()
    } catch (error) {
      showToast("Failed to delete account", "error")
    }
  }

  const maskedKey = apiKey
    ? apiKey.replace(/sk_live_[A-Za-z0-9]{4}/, "sk_live_••••••••••••••••")
    : "sk_live_••••••••••••••••"

  return (
    <div className="flex h-full bg-background">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105"
        onClick={onBack}
        aria-label="Back to chat"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex lg:w-72 flex-col bg-card border-r border-border h-full">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-semibold text-lg">Nova</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem
            icon={<Globe className="h-4 w-4" />}
            label="General"
            active
          />
          <NavItem
            icon={<Key className="h-4 w-4" />}
            label="API Key"
          />
          <NavItem
            icon={<Shield className="h-4 w-4" />}
            label="Security"
          />
          <NavItem
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
          />
          <NavItem
            icon={<Wrench className="h-4 w-4" />}
            label="Developer"
          />

          <Separator className="my-4" />

          <NavItem
            icon={<Moon className="h-4 w-4" />}
            label="Appearance"
          />
          <NavItem
            icon={<Zap className="h-4 w-4" />}
            label="Billing"
          />
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-3" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">Back to Chat</p>
              <p className="text-xs text-muted-foreground">Return to conversation</p>
            </div>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-semibold text-2xl">Settings</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your account, preferences, and developer settings.</p>
            </div>
            <Button onClick={handleSaveSettings} className="h-10 px-6 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25" variant="premium">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8 animate-in">
            {/* General Section */}
            <section className="space-y-6" aria-labelledby="general-title">
              <div>
                <h2 className="font-display font-semibold text-lg" id="general-title">General</h2>
                <p className="text-muted-foreground text-sm mt-1">Basic account preferences and display options.</p>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <SettingRow>
                    <SettingInfo>
                      <SettingLabel>Dark mode</SettingLabel>
                      <SettingDesc>Switch between light and dark theme.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
                        aria-label="Dark mode"
                      />
                    </SettingAction>
                  </SettingRow>

                  <Separator className="mx-6" />

                  <SettingRow>
                    <SettingInfo>
                      <SettingLabel>Language</SettingLabel>
                      <SettingDesc>Choose your preferred language.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="h-10 px-3 py-2 bg-background border border-border rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-[200px]"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </SettingAction>
                  </SettingRow>

                  <Separator className="mx-6" />

                  <SettingRow>
                    <SettingInfo>
                      <SettingLabel>Timezone</SettingLabel>
                      <SettingDesc>Used for timestamps and scheduling.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="h-10 px-3 py-2 bg-background border border-border rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-[240px]"
                      >
                        <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                        <option value="America/New_York">America/New_York (UTC-5)</option>
                        <option value="Europe/London">Europe/London (UTC+0)</option>
                        <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                        <option value="Australia/Sydney">Australia/Sydney (UTC+10)</option>
                      </select>
                    </SettingAction>
                  </SettingRow>
                </CardContent>
              </Card>
            </section>

            {/* API Key Section */}
            <section className="space-y-6" aria-labelledby="api-title">
              <div>
                <h2 className="font-display font-semibold text-lg" id="api-title">API Key</h2>
                <p className="text-muted-foreground text-sm mt-1">Manage your API credentials for programmatic access.</p>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <SettingRow>
                    <SettingInfo>
                      <SettingLabel>Secret API Key</SettingLabel>
                      <SettingDesc>Keep this key secure. It will not be shown again after creation.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <div className="relative max-w-[480px]">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey || maskedKey}
                          placeholder="sk_live_••••••••••••••••"
                          readOnly
                          className="pr-12"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-accent transition-colors flex items-center justify-center"
                              aria-label={showApiKey ? "Hide API key" : "Reveal API key"}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{showApiKey ? "Hide" : "Reveal"} API key</TooltipContent>
                        </Tooltip>
                      </div>
                    </SettingAction>
                  </SettingRow>

                  <Separator className="mx-6" />

                  <SettingRow>
                    <SettingInfo>
                      <SettingLabel>Key permissions</SettingLabel>
                      <SettingDesc>Current key has full read/write access.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <span className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono text-muted-foreground">
                        {keyStatus === "revoked" ? "Revoked" : "Full access"}
                      </span>
                    </SettingAction>
                  </SettingRow>

                  <Separator className="mx-6" />

                  <SettingRow className="pb-6">
                    <SettingInfo>
                      <SettingLabel>Actions</SettingLabel>
                      <SettingDesc>Rotate or revoke your current key.</SettingDesc>
                    </SettingInfo>
                    <SettingAction className="gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRotateKey}
                        disabled={keyStatus !== "active" || !apiKey}
                        className="h-9 px-4"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        {keyStatus === "rotating" ? "Rotating…" : "Rotate key"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRevokeKey}
                        disabled={keyStatus !== "active" || !apiKey}
                        className="h-9 px-4 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {keyStatus === "revoking" ? "Revoking…" : "Revoke key"}
                      </Button>
                    </SettingAction>
                  </SettingRow>
                </CardContent>
              </Card>
            </section>

            {/* Danger Zone */}
            <section className="space-y-6" aria-labelledby="danger-title">
              <div>
                <h2 className="font-display font-semibold text-lg" id="danger-title">Danger Zone</h2>
                <p className="text-muted-foreground text-sm mt-1">Irreversible and destructive actions.</p>
              </div>

              <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
                <CardContent className="p-0">
                  <SettingRow className="pb-6">
                    <SettingInfo>
                      <SettingLabel className="text-destructive">Delete Account</SettingLabel>
                      <SettingDesc className="text-destructive/80">Permanently delete your account and all associated data. This action cannot be undone.</SettingDesc>
                    </SettingInfo>
                    <SettingAction>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete account
                      </Button>
                    </SettingAction>
                  </SettingRow>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4",
            "bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px]"
          )}
        >
          <div className={cn("h-2 w-2 rounded-full", toast.type === "success" ? "bg-green-500" : "bg-destructive")} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary/20 text-primary border border-primary/30"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function SettingRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50", className)}>
      {children}
    </div>
  )
}

function SettingInfo({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-w-0">{children}</div>
}

function SettingLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-medium text-sm", className)}>{children}</p>
}

function SettingDesc({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-muted-foreground text-sm mt-1", className)}>{children}</p>
}

function SettingAction({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2 flex-shrink-0", className)}>{children}</div>
}