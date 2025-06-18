// Main JavaScript - Shared utilities and functions
class Utils {
    // Format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // Format date
    static formatDate(date) {
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Format date for input
    static formatDateForInput(date) {
        return date.toISOString().slice(0, 16);
    }

    // Generate unique ID
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`;
    }

    // Show loading state
    static showLoading(element, text = 'جاري التحميل...') {
        element.innerHTML = `<div class="loading"></div> ${text}`;
        element.disabled = true;
    }

    // Hide loading state
    static hideLoading(element, originalText) {
        element.innerHTML = originalText;
        element.disabled = false;
    }

    // Show toast notification
    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add toast styles if not already added
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    z-index: 9999;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    max-width: 300px;
                }
                .toast.show {
                    transform: translateX(0);
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .toast-success { border-left: 4px solid #27ae60; }
                .toast-error { border-left: 4px solid #e74c3c; }
                .toast-warning { border-left: 4px solid #f39c12; }
                .toast-info { border-left: 4px solid #3498db; }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    static getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
}

// Database helper class
class DatabaseHelper {
    // Add document to collection
    static async addDocument(collection, data) {
        try {
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error(`Error adding document to ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Update document
    static async updateDocument(collection, id, data) {
        try {
            await db.collection(collection).doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error(`Error updating document in ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Delete document
    static async deleteDocument(collection, id) {
        try {
            await db.collection(collection).doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error(`Error deleting document from ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get document by ID
    static async getDocument(collection, id) {
        try {
            const doc = await db.collection(collection).doc(id).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error(`Error getting document from ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get all documents from collection
    static async getCollection(collection, orderBy = null, limit = null) {
        try {
            let query = db.collection(collection);
            
            if (orderBy) {
                query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
            }
            
            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const documents = [];
            
            snapshot.forEach(doc => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: documents };
        } catch (error) {
            console.error(`Error getting collection ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Search documents
    static async searchDocuments(collection, field, value) {
        try {
            const snapshot = await db.collection(collection)
                .where(field, '>=', value)
                .where(field, '<=', value + '\uf8ff')
                .get();

            const documents = [];
            snapshot.forEach(doc => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: documents };
        } catch (error) {
            console.error(`Error searching in ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }
}

// Print helper
class PrintHelper {
    static printInvoice(invoiceData, type = 'sales') {
        const printWindow = window.open('', '_blank');
        const printContent = this.generateInvoiceHTML(invoiceData, type);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    static generateInvoiceHTML(invoiceData, type) {
        const isArabic = true;
        const direction = isArabic ? 'rtl' : 'ltr';
        const align = isArabic ? 'right' : 'left';

        return `
            <!DOCTYPE html>
            <html dir="${direction}">
            <head>
                <meta charset="UTF-8">
                <title>فاتورة ${type === 'sales' ? 'مبيعات' : 'مشتريات'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; direction: ${direction}; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-info { margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: ${align}; }
                    .table th { background-color: #f2f2f2; }
                    .total { text-align: ${align}; font-weight: bold; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>نظام إدارة المبيعات</h1>
                    <h2>فاتورة ${type === 'sales' ? 'مبيعات' : 'مشتريات'}</h2>
                </div>
                
                <div class="invoice-info">
                    <p><strong>رقم الفاتورة:</strong> ${invoiceData.id}</p>
                    <p><strong>التاريخ:</strong> ${Utils.formatDate(invoiceData.date)}</p>
                    <p><strong>${type === 'sales' ? 'العميل' : 'المورد'}:</strong> ${type === 'sales' ? invoiceData.customer_name : invoiceData.supplier_name}</p>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>الوحدة</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceData.items.map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.unit_type}</td>
                                <td>${Utils.formatCurrency(item.unit_price)}</td>
                                <td>${Utils.formatCurrency(item.total_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total">
                    ${type === 'sales' && invoiceData.discount > 0 ? `
                        <p>المجموع الفرعي: ${Utils.formatCurrency(invoiceData.total_amount)}</p>
                        <p>الخصم: ${Utils.formatCurrency(invoiceData.discount)}</p>
                        <p>الإجمالي النهائي: ${Utils.formatCurrency(invoiceData.net_amount)}</p>
                    ` : `
                        <p>الإجمالي: ${Utils.formatCurrency(invoiceData.total_amount)}</p>
                    `}
                </div>
            </body>
            </html>
        `;
    }
}

// Export utilities globally
window.Utils = Utils;
window.DatabaseHelper = DatabaseHelper;
window.PrintHelper = PrintHelper;

