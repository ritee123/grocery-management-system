'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, MessageSquare, AlertCircle, BookOpen, Send, Mail, Phone, MessageCircle, Clock } from 'lucide-react'

export default function Support() {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium',
  })

  const [tickets, setTickets] = useState([
    {
      id: '#TK-001',
      subject: 'Dashboard not loading',
      status: 'open',
      priority: 'high',
      date: '2024-01-10',
      lastUpdate: '2024-01-12',
    },
    {
      id: '#TK-002',
      subject: 'Password reset issue',
      status: 'resolved',
      priority: 'medium',
      date: '2024-01-08',
      lastUpdate: '2024-01-09',
    },
    {
      id: '#TK-003',
      subject: 'Export functionality request',
      status: 'in-progress',
      priority: 'low',
      date: '2024-01-05',
      lastUpdate: '2024-01-11',
    },
  ])

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security > Change Password. Enter your current password and your new password twice. Click Save to confirm the change.',
    },
    {
      question: 'How can I export my sales data?',
      answer: 'Navigate to Analytics section, select the date range, and click the Export button. You can choose between CSV or PDF formats.',
    },
    {
      question: 'What is the session timeout duration?',
      answer: 'By default, your session will timeout after 30 minutes of inactivity. You can change this in Settings > Security.',
    },
    {
      question: 'How do I manage user permissions?',
      answer: 'Only administrators can manage user permissions. Go to Settings > User Management to add or modify user roles and permissions.',
    },
    {
      question: 'Is my data backed up automatically?',
      answer: 'Yes, your data is automatically backed up daily. You can access backup logs in Settings > Database.',
    },
    {
      question: 'How do I contact technical support?',
      answer: 'You can create a support ticket using the form on this page, email support@sanustore.com, or call our support team at +92-300-1234567.',
    },
  ]

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle ticket submission
    console.log('Ticket submitted:', ticketForm)
    setTicketForm({ subject: '', category: '', message: '', priority: 'medium' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
      case 'resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-orange-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
        <p className="text-muted-foreground mt-1">Get help and manage your support tickets</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-2">Send us an email</p>
                <a href="mailto:support@sanustore.com" className="text-primary hover:underline text-sm font-medium">
                  support@sanustore.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-2">Call us directly</p>
                <a href="tel:+923001234567" className="text-primary hover:underline text-sm font-medium">
                  +92-300-1234567
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Support Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Mon - Fri: 9:00 AM - 6:00 PM PKT
                </p>
                <p className="text-sm text-muted-foreground">
                  Sat - Sun: 10:00 AM - 4:00 PM PKT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">My Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="new-ticket" className="gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
        </TabsList>

        {/* My Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage and track your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 text-sm font-medium">{ticket.id}</td>
                          <td className="py-4 px-4 text-sm">{ticket.subject}</td>
                          <td className="py-4 px-4 text-sm">
                            <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">{ticket.lastUpdate}</td>
                          <td className="py-4 px-4 text-center">
                            <Button variant="outline" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No support tickets yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Ticket Tab */}
        <TabsContent value="new-ticket" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Create a New Support Ticket</CardTitle>
              <CardDescription>Describe your issue and we&apos;ll get back to you soon</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <FieldGroup>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <select 
                    id="category"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="subject">Subject</FieldLabel>
                  <Input 
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="priority">Priority</FieldLabel>
                  <select 
                    id="priority"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                  >
                    <option value="low">Low - Can wait</option>
                    <option value="medium">Medium - Normal</option>
                    <option value="high">High - Urgent</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="message">Message</FieldLabel>
                  <textarea 
                    id="message"
                    placeholder="Provide detailed information about your issue..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-32 resize-none"
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                    required
                  />
                </FieldGroup>

                <div className="pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Didn&apos;t find your answer?</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Create a new support ticket or contact our team directly. We&apos;re here to help!
                  </p>
                  <Button className="mt-3 bg-blue-600 hover:bg-blue-700">Contact Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
