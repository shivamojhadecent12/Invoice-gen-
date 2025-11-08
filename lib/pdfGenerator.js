import jsPDF from 'jspdf';

export async function generateInvoicePDF(invoice, settings, client) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header - Company Logo (if available)
  let yPos = 20;
  
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', 15, yPos, 40, 40);
    } catch (e) {
      console.log('Logo not added');
    }
  }
  
  // Company Details (Right side)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'Your Company', 200, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (settings.companyAddress) {
    const addressLines = settings.companyAddress.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 200, yPos, { align: 'right' });
      yPos += 4;
    });
  }
  
  if (settings.email) {
    doc.text(`Email: ${settings.email}`, 200, yPos, { align: 'right' });
    yPos += 4;
  }
  
  if (settings.phone) {
    doc.text(`Phone: ${settings.phone}`, 200, yPos, { align: 'right' });
    yPos += 4;
  }
  
  if (settings.vatNumber) {
    doc.text(`VAT: ${settings.vatNumber}`, 200, yPos, { align: 'right' });
    yPos += 4;
  }
  
  // Invoice Title
  yPos = 80;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 15, yPos);
  
  // Invoice Details
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNo}`, 15, yPos);
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}`, 15, yPos + 6);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}`, 15, yPos + 12);
  }
  
  // Client Details
  yPos += 25;
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(client.name || '', 15, yPos);
  if (client.company) {
    yPos += 5;
    doc.text(client.company, 15, yPos);
  }
  if (client.address) {
    const clientAddressLines = client.address.split('\n');
    clientAddressLines.forEach(line => {
      yPos += 5;
      doc.text(line, 15, yPos);
    });
  }
  if (client.email) {
    yPos += 5;
    doc.text(client.email, 15, yPos);
  }
  if (client.vatNumber) {
    yPos += 5;
    doc.text(`VAT: ${client.vatNumber}`, 15, yPos);
  }
  
  // Line Items Table
  yPos += 15;
  
  // Table Headers
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', 17, yPos + 5);
  doc.text('Qty', 120, yPos + 5);
  doc.text('Price', 140, yPos + 5);
  doc.text('VAT%', 160, yPos + 5);
  doc.text('Total', 180, yPos + 5, { align: 'right' });
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  
  // Line Items
  invoice.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    const itemTotal = item.quantity * item.unitPrice * (1 + item.vatRate / 100) * (1 - (item.discount || 0) / 100);
    
    doc.text(item.description, 17, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`£${item.unitPrice.toFixed(2)}`, 140, yPos);
    doc.text(`${item.vatRate}%`, 160, yPos);
    doc.text(`£${itemTotal.toFixed(2)}`, 193, yPos, { align: 'right' });
    
    yPos += 8;
  });
  
  // Totals
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.line(130, yPos, 195, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 150, yPos);
  doc.text(`£${invoice.subtotal.toFixed(2)}`, 193, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('VAT Total:', 150, yPos);
  doc.text(`£${invoice.vatTotal.toFixed(2)}`, 193, yPos, { align: 'right' });
  yPos += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 150, yPos);
  doc.text(`£${invoice.total.toFixed(2)}`, 193, yPos, { align: 'right' });
  
  // Footer - Payment Terms
  yPos += 20;
  if (settings.paymentTerms) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const terms = settings.paymentTerms.split('\n');
    terms.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });
  }
  
  if (settings.bankDetails) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const bankDetails = settings.bankDetails.split('\n');
    bankDetails.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });
  }
  
  // Signature (if available)
  if (settings.signature && yPos < 260) {
    try {
      doc.addImage(settings.signature, 'PNG', 15, yPos + 5, 40, 20);
    } catch (e) {
      console.log('Signature not added');
    }
  }
  
  return doc;
}
