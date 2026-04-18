'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Bell, Globe, Lock, Palette, Database, Mail, Clock, Volume2 } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      orderUpdates: true,
      lowStockAlerts: true,
      pushNotifications: false,
    },
    general: {
      language: 'english',
      timezone: 'PKT',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      loginNotifications: true,
      activityLog: true,
    },
  })

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }))
  }

  const handleGeneralChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
    }))
  }

  const handleSecurityChange = (key: keyof typeof settings.security) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key],
      },
    }))
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your preferences and account settings</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your basic preferences and location settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <FieldLabel htmlFor="language">Language</FieldLabel>
                <Select value={settings.general.language} onValueChange={(val) => handleGeneralChange('language', val)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="urdu">Urdu</SelectItem>
                    <SelectItem value="sindhi">Sindhi</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <Select value={settings.general.timezone} onValueChange={(val) => handleGeneralChange('timezone', val)}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKT">Pakistan Standard Time (PKT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="dateFormat">Date Format</FieldLabel>
                <Select value={settings.general.dateFormat} onValueChange={(val) => handleGeneralChange('dateFormat', val)}>
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>

              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your store's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <FieldLabel htmlFor="storeName">Store Name</FieldLabel>
                <Input id="storeName" placeholder="Sanu Groceries Store" defaultValue="Sanu Groceries Store" />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="storeEmail">Store Email</FieldLabel>
                <Input id="storeEmail" type="email" placeholder="store@sanustore.com" defaultValue="store@sanustore.com" />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="storePhone">Store Phone</FieldLabel>
                <Input id="storePhone" placeholder="+92-300-1234567" defaultValue="+92-300-1234567" />
              </FieldGroup>

              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/90">Update Store Info</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Sale updates</p>
                    <p className="text-sm text-muted-foreground">Get notified about new sales</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={() => handleNotificationChange('orderUpdates')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Be alerted when items are running low</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.lowStockAlerts}
                  onCheckedChange={() => handleNotificationChange('lowStockAlerts')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={() => handleNotificationChange('pushNotifications')}
                />
              </div>

              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={() => handleSecurityChange('twoFactorAuth')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                </div>
                <Select value={settings.security.sessionTimeout} onValueChange={(val) => setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, sessionTimeout: val }
                }))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Login Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of login attempts</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.security.loginNotifications}
                  onCheckedChange={() => handleSecurityChange('loginNotifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Activity Log</p>
                    <p className="text-sm text-muted-foreground">Keep track of account activity</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.security.activityLog}
                  onCheckedChange={() => handleSecurityChange('activityLog')}
                />
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full bg-primary hover:bg-primary/90">Change Password</Button>
                <Button variant="outline" className="w-full">View Activity Log</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <FieldLabel htmlFor="theme">Theme</FieldLabel>
                <Select value={settings.general.theme} onValueChange={(val) => handleGeneralChange('theme', val)}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>

              <div>
                <h3 className="font-medium mb-4">Color Scheme</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'Default', color: 'bg-blue-500' },
                    { name: 'Green', color: 'bg-green-500' },
                    { name: 'Orange', color: 'bg-orange-500' },
                    { name: 'Purple', color: 'bg-purple-500' },
                  ].map((scheme) => (
                    <button
                      key={scheme.name}
                      className={`p-4 rounded-lg border-2 transition-all ${scheme.color} text-white font-medium text-sm`}
                    >
                      {scheme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/90">Save Appearance</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
