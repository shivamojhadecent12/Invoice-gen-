'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, Settings, LayoutDashboard, Plus, Trash2, Edit, Download, Mail, Share2, Upload, Moon, Sun, Key, User as UserIcon } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdfGenerator';

export default function InvoiceGenApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [settings, setSettings] = useState(null);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ totalInvoices: 0, totalBilled: 0, totalPaid: 0, outstanding: 0 });
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  
  // Form states
  const [clientForm, setClientForm] = useState({
    name: '', company: '', email: '', phone: '', address: '', country: 'UK', vatNumber: ''
  });
  
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'draft',
    items: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 20, discount: 0 }],
    notes: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
    password: ''
  });
  
  // Mount effect for theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Fetch data
  useEffect(() => {
    if (isLoggedIn) {
      fetchSettings();
      fetchClients();
      fetchInvoices();
      fetchStats();
    }
  }, [isLoggedIn]);
  
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };
  
  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };
  
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        toast({ title: 'Success', description: 'Logged in successfully' });
      } else {
        toast({ title: 'Error', description: 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
    }
  };
  
  // Change Password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsPasswordDialogOpen(false);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to change password', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    }
  };
  
  // Change Username
  const handleChangeUsername = async () => {
    if (!usernameForm.newUsername) {
      toast({ title: 'Error', description: 'Please enter a new username', variant: 'destructive' });
      return;
    }
    
    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername: currentUser.username,
          newUsername: usernameForm.newUsername,
          password: usernameForm.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Username changed successfully. Please login again.' });
        setUsernameForm({ newUsername: '', password: '' });
        setIsUsernameDialogOpen(false);
        setIsLoggedIn(false);
        setCurrentUser(null);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to change username', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change username', variant: 'destructive' });
    }
  };
  
  // Client CRUD
  const handleSaveClient = async () => {
    try {
      const url = selectedClient ? `/api/clients/${selectedClient.id}` : '/api/clients';
      const method = selectedClient ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      });
      
      if (res.ok) {
        toast({ title: 'Success', description: `Client ${selectedClient ? 'updated' : 'created'} successfully` });
        fetchClients();
        setIsClientDialogOpen(false);
        resetClientForm();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save client', variant: 'destructive' });
    }
  };
  
  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Client deleted' });
      fetchClients();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete client', variant: 'destructive' });
    }
  };
  
  const resetClientForm = () => {
    setClientForm({ name: '', company: '', email: '', phone: '', address: '', country: 'UK', vatNumber: '' });
    setSelectedClient(null);
  };
  
  // Invoice CRUD
  const handleSaveInvoice = async () => {
    try {
      const url = selectedInvoice ? `/api/invoices/${selectedInvoice.id}` : '/api/invoices';
      const method = selectedInvoice ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm)
      });
      
      if (res.ok) {
        toast({ title: 'Success', description: `Invoice ${selectedInvoice ? 'updated' : 'created'} successfully` });
        fetchInvoices();
        fetchStats();
        setIsInvoiceDialogOpen(false);
        resetInvoiceForm();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save invoice', variant: 'destructive' });
    }
  };
  
  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Invoice deleted' });
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    }
  };
  
  const resetInvoiceForm = () => {
    setInvoiceForm({
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'draft',
      items: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 20, discount: 0 }],
      notes: ''
    });
    setSelectedInvoice(null);
  };
  
  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unitPrice: 0, vatRate: 20, discount: 0 }]
    });
  };
  
  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };
  
  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };
  
  // Download PDF
  const handleDownloadPDF = async (invoice) => {
    try {
      const client = clients.find(c => c.id === invoice.clientId);
      if (!client || !settings) {
        toast({ title: 'Error', description: 'Missing client or settings data', variant: 'destructive' });
        return;
      }
      
      const pdf = await generateInvoicePDF(invoice, settings, client);
      pdf.save(`${invoice.invoiceNo}.pdf`);
      toast({ title: 'Success', description: 'Invoice PDF downloaded' });
    } catch (error) {
      console.error('PDF Error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };
  
  // Settings
  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      toast({ title: 'Success', description: 'Settings saved' });
      setIsSettingsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };
  
  const handleFileUpload = (field, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSettings({ ...settings, [field]: e.target.result });
    };
    reader.readAsDataURL(file);
  };
  
  // Share via WhatsApp
  const handleWhatsAppShare = (invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const message = `Hi ${client?.name || 'there'}! Your invoice ${invoice.invoiceNo} for £${invoice.total.toFixed(2)} is ready. Please check your email or contact us for details.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50 dark:from-gray-900 dark:via-background dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">InvoiceGen</CardTitle>
            <CardDescription>Generate, Manage & Send Invoices Effortlessly</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="admin123"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
              <p className="text-xs text-center text-muted-foreground">Default: admin / admin123</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main App
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">InvoiceGen</h1>
                <p className="text-xs text-muted-foreground">Invoice Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              {mounted && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              
              {/* Account Settings */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {currentUser?.username || 'Account'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Current Username</Label>
                      <Input value={currentUser?.username || ''} disabled />
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Change Username
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Username</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>New Username</Label>
                              <Input
                                value={usernameForm.newUsername}
                                onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                                placeholder="Enter new username"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Current Password (to confirm)</Label>
                              <Input
                                type="password"
                                value={usernameForm.password}
                                onChange={(e) => setUsernameForm({ ...usernameForm, password: e.target.value })}
                                placeholder="Enter your password"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsUsernameDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleChangeUsername}>Change Username</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Current Password</Label>
                              <Input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>New Password</Label>
                              <Input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="Enter new password"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Confirm New Password</Label>
                              <Input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                placeholder="Confirm new password"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleChangePassword}>Change Password</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 py-3">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">£{stats.totalBilled.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">£{stats.totalPaid.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">£{stats.outstanding.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your latest invoice activity</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No invoices yet</p>
                    <Button onClick={() => { setCurrentTab('invoices'); setIsInvoiceDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" /> Create First Invoice
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 5).map(invoice => {
                        const client = clients.find(c => c.id === invoice.clientId);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                            <TableCell>{client?.name || 'Unknown'}</TableCell>
                            <TableCell>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell>£{invoice.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'issued' ? 'secondary' : 'outline'}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Invoices</h2>
              <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetInvoiceForm}>
                    <Plus className="h-4 w-4 mr-2" /> New Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                          value={invoiceForm.clientId}
                          onValueChange={(value) => setInvoiceForm({ ...invoiceForm, clientId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={invoiceForm.status}
                          onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="issued">Issued</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input
                          type="date"
                          value={invoiceForm.issueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={invoiceForm.dueDate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Line Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                          <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                      </div>
                      {invoiceForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                          <div className="col-span-4">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">VAT %</Label>
                            <Input
                              type="number"
                              value={item.vatRate}
                              onChange={(e) => updateInvoiceItem(index, 'vatRate', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-1">
                            <Label className="text-xs">Disc %</Label>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateInvoiceItem(index, 'discount', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInvoiceItem(index)}
                              disabled={invoiceForm.items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes..."
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveInvoice}>Save Invoice</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No invoices created yet</p>
                    <Button onClick={() => setIsInvoiceDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Create First Invoice
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(invoice => {
                        const client = clients.find(c => c.id === invoice.clientId);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                            <TableCell>{client?.name || 'Unknown'}</TableCell>
                            <TableCell>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '-'}</TableCell>
                            <TableCell className="font-medium">£{invoice.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'issued' ? 'secondary' : 'outline'}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(invoice)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleWhatsAppShare(invoice)}>
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setInvoiceForm({
                                      clientId: invoice.clientId,
                                      issueDate: invoice.issueDate.split('T')[0],
                                      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
                                      status: invoice.status,
                                      items: invoice.items,
                                      notes: invoice.notes || ''
                                    });
                                    setIsInvoiceDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Clients */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clients</h2>
              <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetClientForm}>
                    <Plus className="h-4 w-4 mr-2" /> New Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={clientForm.name}
                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={clientForm.company}
                        onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                        placeholder="Acme Ltd"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          placeholder="client@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                          placeholder="+44 20 1234 5678"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={clientForm.address}
                        onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                        placeholder="123 Street Name\nCity\nPostcode"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={clientForm.country}
                          onChange={(e) => setClientForm({ ...clientForm, country: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>VAT Number</Label>
                        <Input
                          value={clientForm.vatNumber}
                          onChange={(e) => setClientForm({ ...clientForm, vatNumber: e.target.value })}
                          placeholder="GB123456789"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveClient}>Save Client</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No clients added yet</p>
                    <Button onClick={() => setIsClientDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add First Client
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map(client => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.company || '-'}</TableCell>
                          <TableCell>{client.email || '-'}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>{client.country}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setClientForm(client);
                                  setIsClientDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            
            {settings && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Update your company details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={settings.companyName || ''}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={settings.companyAddress || ''}
                        onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>VAT Number</Label>
                        <Input
                          value={settings.vatNumber || ''}
                          onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={settings.phone || ''}
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={settings.email || ''}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={settings.website || ''}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                    <CardDescription>Configure invoice defaults</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Invoice Prefix</Label>
                      <Input
                        value={settings.invoicePrefix || ''}
                        onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                        placeholder="INV-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Textarea
                        value={settings.paymentTerms || ''}
                        onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Details</Label>
                      <Textarea
                        value={settings.bankDetails || ''}
                        onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Upload logo and signature</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                        />
                      </div>
                      {settings.logo && (
                        <div className="mt-2">
                          <img src={settings.logo} alt="Logo" className="h-20 w-auto border rounded" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Digital Signature</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])}
                        />
                      </div>
                      {settings.signature && (
                        <div className="mt-2">
                          <img src={settings.signature} alt="Signature" className="h-16 w-auto border rounded" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={settings.accentColor || '#1e40af'}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={settings.accentColor || '#1e40af'}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} size="lg">
                <Settings className="h-4 w-4 mr-2" /> Save All Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
