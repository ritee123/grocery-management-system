'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { User, Mail, Phone, MapPin, Calendar, Shield, LogOut, Camera, Lock } from 'lucide-react'

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [adminData, setAdminData] = useState({
    fullName: 'Sanu Store',
    email: 'oliviara53@gmail.com',
    phone: '+977 9840412788',
    location: 'Sitapaila, KTM',
    joinDate: 'January 15, 2023',
    role: 'Store Manager',
    storeId: 'SANU-001',
    department: 'Management',
    bio: 'Experienced store manager with 5+ years in retail operations. Passionate about team leadership and customer satisfaction.',
  })
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const [editFormData, setEditFormData] = useState(adminData)

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveChanges = () => {
    setAdminData(editFormData)
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and information</p>
        </div>
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-4xl relative mb-4">
                S
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 border-4 border-background hover:bg-gray-100 transition-colors">
                  <Camera className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{adminData.fullName}</h2>
              <p className="text-primary font-medium">{adminData.role}</p>
              <p className="text-sm text-muted-foreground mt-2">ID: {adminData.storeId}</p>
              
              <div className="w-full mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{adminData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{adminData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{adminData.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {adminData.joinDate}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View and update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <FieldGroup>
                    <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={editFormData.fullName}
                      onChange={handleEditChange}
                      placeholder="Full Name"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel htmlFor="email">Email Address</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      placeholder="Email"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                      placeholder="Phone"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel htmlFor="location">Location</FieldLabel>
                    <Input
                      id="location"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      placeholder="Location"
                    />
                  </FieldGroup>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleSaveChanges}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false)
                        setEditFormData(adminData)
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="font-medium">{adminData.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">{adminData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{adminData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium">{adminData.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
              <CardDescription>Your role and department details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">{adminData.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{adminData.department}</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Store ID</p>
                    <p className="font-medium">{adminData.storeId}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Logout */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-2"
                onClick={() => setIsLogoutDialogOpen(true)}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
