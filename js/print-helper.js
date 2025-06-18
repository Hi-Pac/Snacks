// Print Helper for Invoice Printing
class PrintHelper {
    static printInvoice(invoiceData, type = 'sales') {
        const printContent = this.generateInvoiceHTML(invoiceData, type);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    static generateInvoiceHTML(invoiceData, type) {
        const isArabic = true;
        const title = type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات';
        const clientLabel = type === 'sales' ? 'العميل' : 'المورد';
        const clientName = type === 'sales' ? invoiceData.customer_name : invoiceData.supplier_name;

        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        background: white;
                        color: #333;
                        line-height: 1.6;
                    }
                    
                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background: white;
                    }
                    
                    .invoice-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #3498db;
                        padding-bottom: 20px;
                    }
                    
                    .company-name {
                        font-size: 28px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-bottom: 10px;
                    }
                    
                    .invoice-title {
                        font-size: 24px;
                        color: #3498db;
                        margin-bottom: 10px;
                    }
                    
                    .invoice-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                    }
                    
                    .invoice-details, .client-details {
                        flex: 1;
                        min-width: 250px;
                        margin: 10px;
                    }
                    
                    .invoice-details h3, .client-details h3 {
                        color: #2c3e50;
                        margin-bottom: 15px;
                        font-size: 18px;
                        border-bottom: 2px solid #ecf0f1;
                        padding-bottom: 5px;
                    }
                    
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        padding: 5px 0;
                    }
                    
                    .detail-label {
                        font-weight: bold;
                        color: #7f8c8d;
                    }
                    
                    .detail-value {
                        color: #2c3e50;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .items-table th {
                        background: #3498db;
                        color: white;
                        padding: 15px 10px;
                        text-align: center;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                    }
                    
                    .items-table td {
                        padding: 12px 10px;
                        text-align: center;
                        border: 1px solid #ecf0f1;
                        background: #fff;
                    }
                    
                    .items-table tbody tr:nth-child(even) {
                        background: #f8f9fa;
                    }
                    
                    .items-table tbody tr:hover {
                        background: #e3f2fd;
                    }
                    
                    .invoice-summary {
                        margin-top: 30px;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border: 2px solid #ecf0f1;
                    }
                    
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding: 8px 0;
                        border-bottom: 1px solid #ecf0f1;
                    }
                    
                    .summary-row:last-child {
                        border-bottom: none;
                        margin-bottom: 0;
                    }
                    
                    .summary-label {
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    
                    .summary-value {
                        font-weight: bold;
                        color: #27ae60;
                    }
                    
                    .final-total {
                        font-size: 18px;
                        background: #3498db;
                        color: white;
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }
                    
                    .invoice-footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #7f8c8d;
                        font-size: 14px;
                        border-top: 2px solid #ecf0f1;
                        padding-top: 20px;
                    }
                    
                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                        padding-top: 30px;
                    }
                    
                    .signature-box {
                        text-align: center;
                        flex: 1;
                        margin: 0 20px;
                    }
                    
                    .signature-line {
                        border-top: 2px solid #2c3e50;
                        margin-top: 40px;
                        padding-top: 10px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    
                    @media print {
                        body {
                            background: white;
                        }
                        
                        .invoice-container {
                            box-shadow: none;
                            margin: 0;
                            padding: 0;
                        }
                        
                        .items-table {
                            box-shadow: none;
                        }
                    }
                    
                    @media (max-width: 600px) {
                        .invoice-info {
                            flex-direction: column;
                        }
                        
                        .invoice-details, .client-details {
                            margin: 10px 0;
                        }
                        
                        .signature-section {
                            flex-direction: column;
                        }
                        
                        .signature-box {
                            margin: 20px 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <!-- Invoice Header -->
                    <div class="invoice-header">
                        <div class="company-name">نظام إدارة المبيعات</div>
                        <div class="invoice-title">${title}</div>
                    </div>
                    
                    <!-- Invoice Info -->
                    <div class="invoice-info">
                        <div class="invoice-details">
                            <h3>تفاصيل الفاتورة</h3>
                            <div class="detail-row">
                                <span class="detail-label">رقم الفاتورة:</span>
                                <span class="detail-value">${invoiceData.id ? invoiceData.id.substring(0, 8) : 'جديد'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">التاريخ:</span>
                                <span class="detail-value">${this.formatDate(invoiceData.date)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">الوقت:</span>
                                <span class="detail-value">${this.formatTime(invoiceData.date)}</span>
                            </div>
                        </div>
                        
                        <div class="client-details">
                            <h3>بيانات ${clientLabel}</h3>
                            <div class="detail-row">
                                <span class="detail-label">${clientLabel}:</span>
                                <span class="detail-value">${clientName}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Items Table -->
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>الصنف</th>
                                <th>الكمية</th>
                                <th>الوحدة</th>
                                <th>سعر الوحدة</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.unit_type}</td>
                                    <td>${this.formatCurrency(item.unit_price)}</td>
                                    <td>${this.formatCurrency(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <!-- Invoice Summary -->
                    <div class="invoice-summary">
                        <div class="summary-row">
                            <span class="summary-label">المجموع الفرعي:</span>
                            <span class="summary-value">${this.formatCurrency(invoiceData.total_amount)}</span>
                        </div>
                        ${type === 'sales' && invoiceData.discount ? `
                            <div class="summary-row">
                                <span class="summary-label">الخصم:</span>
                                <span class="summary-value">${this.formatCurrency(invoiceData.discount)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row final-total">
                            <span class="summary-label">الإجمالي النهائي:</span>
                            <span class="summary-value">${this.formatCurrency(type === 'sales' ? invoiceData.net_amount : invoiceData.total_amount)}</span>
                        </div>
                    </div>
                    
                    <!-- Signature Section -->
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line">توقيع المسؤول</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">توقيع ${clientLabel}</div>
                        </div>
                    </div>
                    
                    <!-- Invoice Footer -->
                    <div class="invoice-footer">
                        <p>شكراً لتعاملكم معنا</p>
                        <p>تم إنشاء هذه الفاتورة بواسطة نظام إدارة المبيعات</p>
                        <p>تاريخ الطباعة: ${this.formatDate(new Date())} - ${this.formatTime(new Date())}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    static formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatCurrency(amount) {
        if (typeof amount !== 'number') return '0.00 جنيه';
        return `${amount.toFixed(2)} جنيه`;
    }
}

// Make PrintHelper available globally
window.PrintHelper = PrintHelper;

