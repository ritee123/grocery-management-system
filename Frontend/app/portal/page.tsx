'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { fetchMySales, authLogout } from '@/lib/api'
import { clearAuthSession, getAuthRole, isAuthenticated, getAuthUser } from '@/lib/auth'
import { Sale } from '@/lib/store'
import { format } from 'date-fns'
import { User, ShoppingBag, Home, MessageSquare, LogOut, Menu, X, Phone, Mail, MapPin, Clock, TrendingUp, Package, CheckCircle, AlertCircle, FileText, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CustomerPortalPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({
    subject: '',
    message: '',
    type: 'general'
  })
  const [inquiries, setInquiries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    if (getAuthRole() === 'admin') {
      router.push('/')
      return
    }
    fetchMySales()
      .then(setSales)
      .finally(() => setLoading(false))
  }, [router])

  const totals = useMemo(() => {
    const total = sales.reduce((s, x) => s + (x.totalAmount || 0), 0)
    const paid = sales.reduce((s, x) => s + (x.paidAmount || 0), 0)
    return { total, paid, due: total - paid }
  }, [sales])

  const recentSales = useMemo(() => {
    return sales.slice(0, 5)
  }, [sales])

  const onLogout = async () => {
    try {
      await authLogout()
    } catch {
      // ignore
    } finally {
      clearAuthSession()
      router.push('/login')
    }
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInquiryLoading(true)
    try {
      const newInquiry = {
        id: Date.now().toString(),
        ...inquiryForm,
        status: 'pending',
        createdAt: new Date(),
        user: getAuthUser()
      }
      setInquiries([newInquiry, ...inquiries])
      setInquiryForm({ subject: '', message: '', type: 'general' })
      alert('Inquiry submitted successfully!')
    } catch (error) {
      alert('Failed to submit inquiry. Please try again.')
    } finally {
      setInquiryLoading(false)
    }
  }

  const currentUser = getAuthUser()

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar - Matching Admin Design */}
      <div className={`w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col border-r border-sidebar-border fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo - Matching Admin */}
        <div className="p-6">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-xl text-foreground">Sanu Store</div>
            </div>
          </div>
        </div>

        {/* Customer Info Section */}
        <div className="px-4 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-sidebar-foreground truncate">{currentUser?.name || 'Customer'}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{currentUser?.email || 'customer@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Main Menu - Matching Admin Style */}
        <nav className="flex-1 px-4 space-y-1 pt-4">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'purchases', icon: ShoppingBag, label: 'Purchases' },
            { id: 'inquiries', icon: MessageSquare, label: 'Inquiries' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left',
                  isActive
                    ? 'bg-sidebar-accent text-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom Menu - Matching Admin Style */}
        <div className="p-4 space-y-1 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Matching Admin Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.name || 'Customer'}!</h2>
                      <p className="text-green-100">Here's an overview of your account activity</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                        <p className="text-2xl font-bold text-gray-900">Rs {totals.total.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                        <p className="text-2xl font-bold text-green-600">Rs {totals.paid.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Due Amount</p>
                        <p className="text-2xl font-bold text-orange-600">Rs {totals.due.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Recent Purchases</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSales.map((sale) => {
                        const due = (sale.totalAmount || 0) - (sale.paidAmount || 0)
                        return (
                          <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {format(new Date(sale.date), 'dd MMM yyyy')}
                              </p>
                              <p className="text-sm text-gray-600">
                                {(sale.items || []).slice(0, 2).map((i) => i.productName).join(', ')}
                                {(sale.items || []).length > 2 ? ` +${(sale.items || []).length - 2} more` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Rs {sale.totalAmount.toLocaleString()}</p>
                              <Badge variant={due > 0 ? 'destructive' : 'default'} className="text-xs">
                                {due > 0 ? 'Due' : 'Paid'}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                      {recentSales.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No recent purchases</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Quick Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average Order Value</span>
                        <span className="font-semibold">
                          Rs {sales.length > 0 ? Math.round(totals.total / sales.length).toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Completion Rate</span>
                        <span className="font-semibold">
                          {sales.length > 0 ? Math.round((totals.paid / totals.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Purchase</span>
                        <span className="font-semibold">
                          {sales.length > 0 ? format(new Date(sales[0].date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Account Status</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Purchases Tab Content */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>All Purchases</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-4 text-sm font-medium text-gray-700">Date</th>
                          <th className="text-left p-4 text-sm font-medium text-gray-700">Items</th>
                          <th className="text-right p-4 text-sm font-medium text-gray-700">Total</th>
                          <th className="text-right p-4 text-sm font-medium text-gray-700">Paid</th>
                          <th className="text-right p-4 text-sm font-medium text-gray-700">Due</th>
                          <th className="text-center p-4 text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => {
                          const due = (sale.totalAmount || 0) - (sale.paidAmount || 0)
                          return (
                            <tr key={sale.id} className="border-b hover:bg-gray-50">
                              <td className="p-4 text-sm text-gray-900">
                                {format(new Date(sale.date), 'dd MMM yyyy')}
                              </td>
                              <td className="p-4 text-sm text-gray-900">
                                <div className="max-w-xs">
                                  {(sale.items || []).slice(0, 3).map((i) => i.productName).join(', ')}
                                  {(sale.items || []).length > 3 ? '...' : ''}
                                </div>
                              </td>
                              <td className="p-4 text-right font-semibold text-gray-900">Rs {sale.totalAmount.toLocaleString()}</td>
                              <td className="p-4 text-right text-gray-900">Rs {(sale.paidAmount || 0).toLocaleString()}</td>
                              <td className={`p-4 text-right font-semibold ${due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                Rs {due.toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <Badge variant={due > 0 ? 'destructive' : 'default'} className="text-xs">
                                  {due > 0 ? 'Due' : 'Paid'}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!loading && sales.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No purchases yet</p>
                      <p className="text-sm text-gray-500 mt-2">Start shopping to see your purchase history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Inquiries Tab Content */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inquiry Form */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Submit Inquiry</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Inquiry Type
                        </label>
                        <select
                          value={inquiryForm.type}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        >
                          <option value="general">General Inquiry</option>
                          <option value="product">Product Related</option>
                          <option value="payment">Payment Issue</option>
                          <option value="account">Account Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </label>
                        <Input
                          placeholder="Enter inquiry subject"
                          value={inquiryForm.subject}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <Textarea
                          placeholder="Describe your inquiry in detail..."
                          value={inquiryForm.message}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                          rows={4}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {inquiryLoading ? 'Submitting...' : 'Submit Inquiry'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Inquiry History */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Inquiry History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inquiries.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No inquiries yet</p>
                          <p className="text-sm text-gray-500 mt-2">Submit your first inquiry to get started</p>
                        </div>
                      ) : (
                        inquiries.map((inquiry) => (
                          <div key={inquiry.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{inquiry.subject}</h4>
                              <Badge variant="outline" className="text-xs">
                                {inquiry.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{inquiry.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {format(new Date(inquiry.createdAt), 'dd MMM yyyy, HH:mm')}
                              </span>
                              <Badge variant={inquiry.status === 'pending' ? 'secondary' : 'default'} className="text-xs">
                                {inquiry.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{currentUser?.name || 'Customer'}</h3>
                        <p className="text-gray-600">{currentUser?.email || 'customer@example.com'}</p>
                        <Badge variant="default" className="bg-green-100 text-green-800 mt-2">
                          Active Account
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Contact Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{currentUser?.email || 'customer@example.com'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium">{currentUser?.phone || '+1 234 567 8900'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium">{currentUser?.address || '123 Main St, City, State'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Account Statistics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Orders</span>
                            <span className="font-medium">{sales.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Spent</span>
                            <span className="font-medium">Rs {totals.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Member Since</span>
                            <span className="font-medium">
                              {currentUser?.createdAt ? format(new Date(currentUser.createdAt), 'dd MMM yyyy') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Account Status</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Account Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Download Invoice History</span>
                        </Button>
                        <Button variant="outline" className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Contact Support</span>
                        </Button>
                        <Button variant="outline" className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
