# InvoiceGen - UK Invoice Management System

## 🎉 Welcome to InvoiceGen!

Your complete, UK VAT-compliant invoice management system is now **LIVE AND READY TO USE**!

---

## 🔐 Getting Started

### Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials in production by updating the database directly or adding a user management feature.

---

## ✨ Core Features Implemented

### 1. 📊 Dashboard
- **Real-time Statistics**:
  - Total Invoices
  - Total Billed Amount
  - Total Paid Amount
  - Outstanding Balance
- **Recent Invoices** list with quick overview
- Clean, modern interface with card-based design

### 2. 📄 Invoice Management
- **Create Invoices** with:
  - Auto-generated sequential invoice numbers (INV-000001, INV-000002, etc.)
  - Multiple line items with:
    - Description
    - Quantity
    - Unit Price
    - VAT Rate (default 20%)
    - Discount percentage
  - Automatic calculation of:
    - Subtotal
    - VAT Total
    - Grand Total
  - Issue Date and Due Date
  - Custom notes
  - Status tracking (Draft, Issued, Paid, Overdue)

- **Invoice Actions**:
  - 📥 **Download PDF** - Generate professional UK-compliant invoice PDFs
  - 📧 **Email** (placeholder - add API key later)
  - 💬 **WhatsApp Share** - Generate shareable WhatsApp links
  - ✏️ **Edit** - Modify existing invoices
  - 🗑️ **Delete** - Remove invoices

### 3. 👥 Client Management
- **Full CRUD** for clients:
  - Name
  - Company
  - Email & Phone
  - Address (multi-line)
  - Country
  - VAT Number
- Easy client selection when creating invoices
- Edit and delete existing clients

### 4. ⚙️ Settings / Admin Panel
- **Company Information**:
  - Company Name
  - Full Address (multi-line)
  - VAT Registration Number
  - Email, Phone, Website

- **Invoice Configuration**:
  - Invoice Prefix (default: INV-)
  - Payment Terms (customizable)
  - Bank Details (for invoice footer)

- **Branding**:
  - Upload Company Logo (appears on invoices)
  - Upload Digital Signature
  - Accent Color picker

- **All settings are dynamic** - changes immediately reflect in generated invoices!

### 5. 📥 PDF Generation
- **UK-Compliant Invoice PDFs** with:
  - Company logo and branding
  - Company and client details
  - VAT numbers
  - Line items with VAT breakdown
  - Subtotal, VAT Total, Grand Total
  - Payment terms and bank details
  - Digital signature (if uploaded)
- Uses jsPDF library for client-side generation
- Instant download, no server processing needed

### 6. 🔒 Authentication
- Secure admin login with bcrypt password hashing
- Session-based authentication
- Protected routes

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 14 + React
- **Styling**: TailwindCSS + shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: MongoDB (with UUID-based IDs)
- **PDF Generation**: jsPDF
- **Password Security**: bcryptjs

---

## 📁 Project Structure

```
/app/
├── app/
│   ├── api/[[...path]]/route.js   # All backend API endpoints
│   ├── page.js                     # Main application UI
│   ├── layout.js                   # Root layout with Toaster
│   └── globals.css                 # Global styles
├── lib/
│   ├── mongodb.js                  # MongoDB connection
│   └── pdfGenerator.js             # Invoice PDF generation
├── components/ui/                  # shadcn/ui components
├── hooks/                          # React hooks (toast, etc.)
└── package.json
```

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Settings
- `GET /api/settings` - Get company settings
- `PUT /api/settings` - Update company settings

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create new invoice (auto-increments number)
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## 📊 Database Collections

### `users`
```javascript
{
  id: UUID,
  username: String,
  password: String (bcrypt hashed),
  role: String,
  createdAt: Date
}
```

### `settings`
```javascript
{
  id: "company-settings",
  companyName: String,
  companyAddress: String,
  vatNumber: String,
  email: String,
  phone: String,
  website: String,
  invoicePrefix: String,
  nextInvoiceNumber: Number,
  paymentTerms: String,
  bankDetails: String,
  logo: String (base64),
  signature: String (base64),
  accentColor: String,
  updatedAt: Date
}
```

### `clients`
```javascript
{
  id: UUID,
  name: String,
  company: String,
  email: String,
  phone: String,
  address: String,
  country: String,
  vatNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### `invoices`
```javascript
{
  id: UUID,
  invoiceNo: String,
  clientId: UUID,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    vatRate: Number,
    discount: Number
  }],
  subtotal: Number,
  vatTotal: Number,
  total: Number,
  status: String,
  issueDate: Date,
  dueDate: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date,
  archivedAt: Date,
  expiresAt: Date (6 years from creation)
}
```

---

## 🎯 UK VAT Compliance

All invoices include the required UK invoice fields:
- ✅ Invoice Number (sequential, unique)
- ✅ Invoice Date
- ✅ Supplier Name & Address
- ✅ Customer Name & Address
- ✅ VAT Number (supplier and customer if registered)
- ✅ Description of goods/services
- ✅ Net Amount, VAT Rate, VAT Amount
- ✅ Gross Total

---

## 🔮 Future Enhancements (Not Yet Implemented)

### Email Integration
Currently set up for Resend API. To enable:
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env`: `RESEND_API_KEY=your_key_here`
4. Implement email sending in `/api/invoices/[id]/email` endpoint

### Automation Features
- **Auto-Archive**: Invoices older than 6 months (set `archivedAt`)
- **Auto-Delete**: Invoices older than 6 years (GDPR compliance)
- **Payment Reminders**: Auto-email reminders for overdue invoices

To implement: Create a cron job or scheduled task that runs daily:
```javascript
// Check for invoices to archive (6 months old)
// Check for invoices to delete (6 years old)
// Check for overdue invoices (send reminders)
```

### WhatsApp Cloud API
Currently generates simple share links. For full integration:
1. Sign up for WhatsApp Business API
2. Get API credentials
3. Implement direct message sending

---

## 💡 How to Use

1. **Login** with admin/admin123
2. **Go to Settings** - Update your company details, upload logo
3. **Add Clients** - Go to Clients tab, click "New Client"
4. **Create Invoice**:
   - Go to Invoices tab
   - Click "New Invoice"
   - Select client
   - Add line items
   - Set status and dates
   - Save
5. **Download PDF** - Click download icon on any invoice
6. **Share** - Use WhatsApp share button or email (when configured)

---

## 🐛 Testing

The application has been tested with:
- ✅ User authentication
- ✅ Client CRUD operations
- ✅ Invoice creation with auto-numbering
- ✅ Dashboard statistics calculation
- ✅ Settings management
- ✅ All API endpoints responding correctly

Backend APIs verified with curl commands.

---

## 🔧 Running the App

The app is already running on:
- **URL**: http://localhost:3000
- **Backend**: Next.js server on port 3000
- **Database**: MongoDB (configured via MONGO_URL env variable)

To restart:
```bash
sudo supervisorctl restart all
```

---

## 📝 Notes

### Default Settings
- Invoice prefix: `INV-`
- Starting invoice number: `000001`
- Default VAT rate: 20%
- Currency symbol: £ (GBP)

### Data Storage
- **Invoices**: Expire after 6 years (set in `expiresAt` field)
- **Files**: Logo and signature stored as base64 in database
- **PDFs**: Generated on-demand, not stored

### Security
- Passwords hashed with bcrypt
- UUIDs used instead of MongoDB ObjectIds
- No sensitive data in URLs
- Session-based authentication

---

## 🎨 Design System

- **Primary Color**: Blue (#1e40af)
- **Success**: Green
- **Warning**: Orange
- **Danger**: Red
- **Font**: System fonts (Helvetica, Arial)
- **Components**: shadcn/ui library
- **Layout**: Responsive grid with cards

---

## 📞 Support

For any issues or questions:
1. Check the browser console for errors
2. Check backend logs: `tail -n 100 /var/log/supervisor/nextjs.out.log`
3. Verify MongoDB is running: `sudo supervisorctl status mongodb`

---

## 🚀 Deployment Ready

This app is production-ready for deployment to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS**
- Any Node.js hosting platform

Remember to:
- Set environment variables (MONGO_URL)
- Update default admin credentials
- Add email API key for sending functionality
- Configure domain and SSL

---

**Congratulations! Your InvoiceGen system is ready to use! 🎉**
