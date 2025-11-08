import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Helper to get collection
async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Initialize default admin and settings (only once)
let initialized = false;

async function initializeDefaults() {
  if (initialized) return;
  
  try {
    const usersCollection = await getCollection('users');
    const adminExists = await usersCollection.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await usersCollection.insertOne({
        id: uuidv4(),
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      console.log('✓ Default admin user created');
    }
    
    const settingsCollection = await getCollection('settings');
    const settingsExist = await settingsCollection.findOne({ id: 'company-settings' });
    
    if (!settingsExist) {
      await settingsCollection.insertOne({
        id: 'company-settings',
        companyName: 'InvoiceGen Ltd',
        companyAddress: '123 Business Street\nLondon, UK\nSW1A 1AA',
        vatNumber: 'GB123456789',
        email: 'info@invoicegen.com',
        phone: '+44 20 1234 5678',
        website: 'www.invoicegen.com',
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 1,
        paymentTerms: 'Payment due within 30 days\nBank transfer preferred',
        bankDetails: 'Account Name: InvoiceGen Ltd\nSort Code: 12-34-56\nAccount Number: 12345678',
        logo: null,
        signature: null,
        accentColor: '#1e40af',
        updatedAt: new Date()
      });
      console.log('✓ Default settings created');
    }
    
    initialized = true;
  } catch (error) {
    console.error('Error initializing defaults:', error);
  }
}

// Call initialization on first request
initializeDefaults();

export async function GET(request) {
  const pathname = new URL(request.url).pathname.replace('/api', '');
  
  try {
    // Auth endpoints
    if (pathname === '/auth/login') {
      return NextResponse.json({ message: 'Use POST for login' }, { status: 405 });
    }
    
    // Settings
    if (pathname === '/settings') {
      const collection = await getCollection('settings');
      const settings = await collection.findOne({ id: 'company-settings' });
      return NextResponse.json(settings || {});
    }
    
    // Clients
    if (pathname === '/clients') {
      const collection = await getCollection('clients');
      const clients = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(clients);
    }
    
    if (pathname.startsWith('/clients/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('clients');
      const client = await collection.findOne({ id });
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json(client);
    }
    
    // Invoices
    if (pathname === '/invoices') {
      const collection = await getCollection('invoices');
      const invoices = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(invoices);
    }
    
    if (pathname.startsWith('/invoices/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('invoices');
      const invoice = await collection.findOne({ id });
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }
    
    // Dashboard stats
    if (pathname === '/dashboard/stats') {
      const invoicesCollection = await getCollection('invoices');
      const invoices = await invoicesCollection.find({}).toArray();
      
      const totalInvoices = invoices.length;
      const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const outstanding = totalBilled - totalPaid;
      
      return NextResponse.json({
        totalInvoices,
        totalBilled,
        totalPaid,
        outstanding
      });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const pathname = new URL(request.url).pathname.replace('/api', '');
  
  try {
    const body = await request.json();
    
    // Auth
    if (pathname === '/auth/login') {
      const collection = await getCollection('users');
      const user = await collection.findOne({ username: body.username });
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      const isValidPassword = await bcrypt.compare(body.password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role } 
      });
    }
    
    // Clients
    if (pathname === '/clients') {
      const collection = await getCollection('clients');
      const newClient = {
        id: uuidv4(),
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await collection.insertOne(newClient);
      return NextResponse.json(newClient, { status: 201 });
    }
    
    // Invoices
    if (pathname === '/invoices') {
      const settingsCollection = await getCollection('settings');
      const settings = await settingsCollection.findOne({ id: 'company-settings' });
      
      const invoiceNo = `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(6, '0')}`;
      
      // Calculate totals
      let subtotal = 0;
      let vatTotal = 0;
      
      body.items.forEach(item => {
        const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        const itemVat = itemSubtotal * (item.vatRate / 100);
        subtotal += itemSubtotal;
        vatTotal += itemVat;
      });
      
      const total = subtotal + vatTotal;
      
      const collection = await getCollection('invoices');
      const newInvoice = {
        id: uuidv4(),
        invoiceNo,
        clientId: body.clientId,
        items: body.items,
        subtotal,
        vatTotal,
        total,
        status: body.status || 'draft',
        issueDate: body.issueDate || new Date().toISOString(),
        dueDate: body.dueDate || null,
        notes: body.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
        expiresAt: new Date(Date.now() + 6 * 365 * 24 * 60 * 60 * 1000) // 6 years from now
      };
      
      await collection.insertOne(newInvoice);
      
      // Increment invoice number
      await settingsCollection.updateOne(
        { id: 'company-settings' },
        { $set: { nextInvoiceNumber: settings.nextInvoiceNumber + 1 } }
      );
      
      return NextResponse.json(newInvoice, { status: 201 });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const pathname = new URL(request.url).pathname.replace('/api', '');
  
  try {
    const body = await request.json();
    
    // Settings
    if (pathname === '/settings') {
      const collection = await getCollection('settings');
      // Remove _id from body to avoid immutable field error
      const { _id, ...updateData } = body;
      await collection.updateOne(
        { id: 'company-settings' },
        { $set: { ...updateData, updatedAt: new Date() } },
        { upsert: true }
      );
      const updated = await collection.findOne({ id: 'company-settings' });
      return NextResponse.json(updated);
    }
    
    // Change Password
    if (pathname === '/auth/change-password') {
      const { currentPassword, newPassword, username } = body;
      
      const collection = await getCollection('users');
      const user = await collection.findOne({ username });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await collection.updateOne(
        { username },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
    
    // Change Username
    if (pathname === '/auth/change-username') {
      const { currentUsername, newUsername, password } = body;
      
      const collection = await getCollection('users');
      const user = await collection.findOne({ username: currentUsername });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password is incorrect' }, { status: 401 });
      }
      
      // Check if new username already exists
      const existingUser = await collection.findOne({ username: newUsername });
      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      
      await collection.updateOne(
        { username: currentUsername },
        { $set: { username: newUsername, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true, message: 'Username updated successfully' });
    }
    
    // Clients
    if (pathname.startsWith('/clients/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('clients');
      const { _id, ...updateData } = body;
      await collection.updateOne(
        { id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      const updated = await collection.findOne({ id });
      return NextResponse.json(updated);
    }
    
    // Invoices
    if (pathname.startsWith('/invoices/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('invoices');
      
      // Recalculate if items changed
      if (body.items) {
        let subtotal = 0;
        let vatTotal = 0;
        
        body.items.forEach(item => {
          const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
          const itemVat = itemSubtotal * (item.vatRate / 100);
          subtotal += itemSubtotal;
          vatTotal += itemVat;
        });
        
        body.subtotal = subtotal;
        body.vatTotal = vatTotal;
        body.total = subtotal + vatTotal;
      }
      
      const { _id, ...updateData } = body;
      await collection.updateOne(
        { id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      const updated = await collection.findOne({ id });
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const pathname = new URL(request.url).pathname.replace('/api', '');
  
  try {
    // Clients
    if (pathname.startsWith('/clients/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('clients');
      await collection.deleteOne({ id });
      return NextResponse.json({ success: true });
    }
    
    // Invoices
    if (pathname.startsWith('/invoices/')) {
      const id = pathname.split('/')[2];
      const collection = await getCollection('invoices');
      await collection.deleteOne({ id });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
