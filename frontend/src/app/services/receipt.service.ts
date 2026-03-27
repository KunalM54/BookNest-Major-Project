import { Injectable } from '@angular/core';

export interface ReceiptData {
  transactionId: string;
  amount: number;
  bookTitle: string;
  bookAuthor: string;
  studentName: string;
  studentEmail: string;
  date: string;
  paymentMethod: string;
  orderId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {

  generateReceipt(receiptData: ReceiptData): void {
    const receiptHTML = this.createReceiptHTML(receiptData);
    this.openPrintWindow(receiptHTML);
  }

  downloadReceipt(receiptData: ReceiptData): void {
    const receiptHTML = this.createReceiptHTML(receiptData);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  private createReceiptHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BookNest Receipt - ${data.transactionId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #fff;
      padding: 40px;
      max-width: 600px;
      margin: 0 auto;
    }
    .receipt {
      border: 2px dashed #000;
      padding: 30px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .logo span {
      color: #667eea;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
    }
    .receipt-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
      text-decoration: underline;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #ccc;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #666;
      font-size: 14px;
    }
    .value {
      font-weight: bold;
      font-size: 14px;
      text-align: right;
    }
    .book-section {
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .book-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .book-author {
      color: #666;
      font-size: 14px;
    }
    .total-section {
      margin: 20px 0;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-align: center;
    }
    .total-label {
      font-size: 14px;
      margin-bottom: 5px;
    }
    .total-amount {
      font-size: 36px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px dashed #000;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    .footer-note {
      font-size: 11px;
      color: #999;
      font-style: italic;
    }
    .collection-notice {
      margin-top: 20px;
      padding: 15px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      text-align: center;
    }
    .collection-notice strong {
      color: #856404;
    }
    .receipt-id {
      text-align: center;
      margin: 15px 0;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
      font-family: monospace;
    }
    @media print {
      body {
        padding: 0;
      }
      .receipt {
        border: none;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">Book<span>Nest</span></div>
      <div class="subtitle">Library Management System</div>
    </div>

    <div class="receipt-title">📜 PURCHASE RECEIPT 📜</div>

    <div class="receipt-id">
      Receipt ID: ${data.transactionId}
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="label">Student Name:</span>
        <span class="value">${data.studentName}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${data.studentEmail}</span>
      </div>
      <div class="info-row">
        <span class="label">Purchase Date:</span>
        <span class="value">${data.date}</span>
      </div>
      <div class="info-row">
        <span class="label">Payment Mode:</span>
        <span class="value">${data.paymentMethod}</span>
      </div>
    </div>

    <div class="book-section">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">BOOK DETAILS</div>
      <div class="book-title">${data.bookTitle}</div>
      <div class="book-author">by ${data.bookAuthor}</div>
    </div>

    <div class="total-section">
      <div class="total-label">TOTAL AMOUNT PAID</div>
      <div class="total-amount">₹${data.amount.toFixed(2)}</div>
    </div>

    <div class="collection-notice">
      <strong>📚 Book Collection Notice</strong><br>
      Please show this receipt at the library counter to collect your book.
    </div>

    <div class="footer">
      <div class="footer-text">Thank you for your purchase!</div>
      <div class="footer-note">This is a computer-generated receipt. No signature required.</div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px;" class="no-print">
    <button onclick="window.print()" style="
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      margin: 5px;
    ">🖨️ Print Receipt</button>
    <button onclick="window.close()" style="
      padding: 12px 30px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      margin: 5px;
    ">Close</button>
  </div>
</body>
</html>`;
  }

  private openPrintWindow(content: string): void {
    const printWindow = window.open('', '_blank', 'width=700,height=900');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
    }
  }
}
