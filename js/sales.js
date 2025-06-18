// Sales Management JavaScript
class SalesManager {
    constructor() {
        this.products = [];
        this.invoiceItems = [];
        this.invoices = [];
        this.currentInvoiceId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        this.setCurrentDateTime();
        this.showNewInvoiceSection();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('new-invoice-btn').addEventListener('click', () => {
            this.showNewInvoiceSection();
        });

        document.getElementById('view-invoices-btn').addEventListener('click', () => {
            this.showInvoicesListSection();
        });

        // Product selection and addition
        document.getElementById('product-select').addEventListener('change', () => {
            this.onProductSelect();
        });

        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.addProductToInvoice();
        });

        // Invoice form submission
        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            this.handleInvoiceSubmit(e);
        });

        // Discount calculation
        document.getElementById('discount-input').addEventListener('input', () => {
            this.calculateTotals();
        });

        // Form actions
        document.getElementById('print-invoice-btn').addEventListener('click', () => {
            this.printCurrentInvoice();
        });

        document.getElementById('clear-invoice-btn').addEventListener('click', () => {
            this.clearInvoice();
        });

        // Invoice list filters
        document.getElementById('filter-invoices-btn').addEventListener('click', () => {
            this.filterInvoices();
        });

        document.getElementById('search-invoices').addEventListener('input', 
            Utils.debounce(() => this.filterInvoices(), 300)
        );

        // Modal close buttons
        document.getElementById('close-details-modal').addEventListener('click', () => {
            this.hideInvoiceDetailsModal();
        });

        document.getElementById('close-details-btn').addEventListener('click', () => {
            this.hideInvoiceDetailsModal();
        });

        document.getElementById('print-details-btn').addEventListener('click', () => {
            this.printInvoiceDetails();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.signOut();
        });

        // Close modal when clicking outside
        document.getElementById('invoice-details-modal').addEventListener('click', (e) => {
            if (e.target.id === 'invoice-details-modal') {
                this.hideInvoiceDetailsModal();
            }
        });
    }

    async loadProducts() {
        try {
            const result = await DatabaseHelper.getCollection('products', 
                { field: 'name', direction: 'asc' }
            );

            if (result.success) {
                this.products = result.data.filter(product => product.stock_quantity > 0);
                this.populateProductSelect();
            } else {
                Utils.showToast('خطأ في تحميل الأصناف', 'error');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            Utils.showToast('خطأ في تحميل الأصناف', 'error');
        }
    }

    populateProductSelect() {
        const select = document.getElementById('product-select');
        select.innerHTML = '<option value="">اختر صنف...</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - متوفر: ${product.stock_quantity} ${product.unit_type}`;
            option.dataset.product = JSON.stringify(product);
            select.appendChild(option);
        });
    }

    onProductSelect() {
        const select = document.getElementById('product-select');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const product = JSON.parse(selectedOption.dataset.product);
            document.getElementById('unit-price-input').value = product.unit_price_sale;
            document.getElementById('quantity-input').focus();
        } else {
            document.getElementById('unit-price-input').value = '';
        }
    }

    addProductToInvoice() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity-input');
        const unitPriceInput = document.getElementById('unit-price-input');

        if (!productSelect.value || !quantityInput.value || !unitPriceInput.value) {
            Utils.showToast('يرجى ملء جميع البيانات المطلوبة', 'warning');
            return;
        }

        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const product = JSON.parse(selectedOption.dataset.product);
        const quantity = parseFloat(quantityInput.value);
        const unitPrice = parseFloat(unitPriceInput.value);

        // Check stock availability
        if (quantity > product.stock_quantity) {
            Utils.showToast(`الكمية المطلوبة (${quantity}) أكبر من المتوفر (${product.stock_quantity})`, 'error');
            return;
        }

        // Check if product already exists in invoice
        const existingItemIndex = this.invoiceItems.findIndex(item => item.product_id === product.id);
        
        if (existingItemIndex !== -1) {
            // Update existing item
            const existingItem = this.invoiceItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > product.stock_quantity) {
                Utils.showToast(`إجمالي الكمية (${newQuantity}) أكبر من المتوفر (${product.stock_quantity})`, 'error');
                return;
            }
            
            existingItem.quantity = newQuantity;
            existingItem.total_price = existingItem.quantity * existingItem.unit_price;
        } else {
            // Add new item
            const invoiceItem = {
                product_id: product.id,
                product_name: product.name,
                quantity: quantity,
                unit_type: product.unit_type,
                unit_price: unitPrice,
                total_price: quantity * unitPrice
            };
            
            this.invoiceItems.push(invoiceItem);
        }

        this.renderInvoiceItems();
        this.calculateTotals();
        this.clearProductInputs();
    }

    removeItemFromInvoice(index) {
        this.invoiceItems.splice(index, 1);
        this.renderInvoiceItems();
        this.calculateTotals();
    }

    renderInvoiceItems() {
        const tbody = document.getElementById('invoice-items-tbody');
        const noItemsMessage = document.getElementById('no-items-message');
        const table = document.getElementById('invoice-items-table');

        if (this.invoiceItems.length === 0) {
            table.style.display = 'none';
            noItemsMessage.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noItemsMessage.style.display = 'none';

        tbody.innerHTML = this.invoiceItems.map((item, index) => `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_type}</td>
                <td>${Utils.formatCurrency(item.unit_price)}</td>
                <td>${Utils.formatCurrency(item.total_price)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="salesManager.removeItemFromInvoice(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    calculateTotals() {
        const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
        const discount = parseFloat(document.getElementById('discount-input').value) || 0;
        const finalTotal = subtotal - discount;

        document.getElementById('subtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('discount-amount').textContent = Utils.formatCurrency(discount);
        document.getElementById('final-total').textContent = Utils.formatCurrency(finalTotal);
    }

    clearProductInputs() {
        document.getElementById('product-select').value = '';
        document.getElementById('quantity-input').value = '';
        document.getElementById('unit-price-input').value = '';
    }

    async handleInvoiceSubmit(e) {
        e.preventDefault();

        if (this.invoiceItems.length === 0) {
            Utils.showToast('يجب إضافة صنف واحد على الأقل', 'warning');
            return;
        }

        const saveText = document.getElementById('save-invoice-text');
        const saveLoading = document.getElementById('save-invoice-loading');
        
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            const customerName = document.getElementById('customer-name').value.trim();
            const invoiceDate = new Date(document.getElementById('invoice-date').value);
            const discount = parseFloat(document.getElementById('discount-input').value) || 0;
            const totalAmount = this.invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
            const netAmount = totalAmount - discount;

            // Create invoice data
            const invoiceData = {
                customer_name: customerName,
                date: invoiceDate,
                discount: discount,
                total_amount: totalAmount,
                net_amount: netAmount,
                items: this.invoiceItems
            };

            // Save invoice
            const result = await DatabaseHelper.addDocument('sales_invoices', invoiceData);

            if (result.success) {
                this.currentInvoiceId = result.id;
                
                // Update stock quantities
                await this.updateStockQuantities();
                
                Utils.showToast('تم حفظ الفاتورة بنجاح', 'success');
                document.getElementById('print-invoice-btn').disabled = false;
                
                // Reload products to update stock
                await this.loadProducts();
                
            } else {
                Utils.showToast('خطأ في حفظ الفاتورة', 'error');
            }

        } catch (error) {
            console.error('Error saving invoice:', error);
            Utils.showToast('خطأ في حفظ الفاتورة', 'error');
        } finally {
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }

    async updateStockQuantities() {
        try {
            const batch = db.batch();

            for (const item of this.invoiceItems) {
                const productRef = db.collection('products').doc(item.product_id);
                const productDoc = await productRef.get();
                
                if (productDoc.exists) {
                    const currentStock = productDoc.data().stock_quantity;
                    const newStock = currentStock - item.quantity;
                    
                    batch.update(productRef, {
                        stock_quantity: Math.max(0, newStock),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            await batch.commit();
        } catch (error) {
            console.error('Error updating stock:', error);
            Utils.showToast('تم حفظ الفاتورة ولكن حدث خطأ في تحديث المخزون', 'warning');
        }
    }

    printCurrentInvoice() {
        if (!this.currentInvoiceId) {
            Utils.showToast('يجب حفظ الفاتورة أولاً', 'warning');
            return;
        }

        const invoiceData = {
            id: this.currentInvoiceId,
            customer_name: document.getElementById('customer-name').value,
            date: new Date(document.getElementById('invoice-date').value),
            discount: parseFloat(document.getElementById('discount-input').value) || 0,
            total_amount: this.invoiceItems.reduce((sum, item) => sum + item.total_price, 0),
            net_amount: this.invoiceItems.reduce((sum, item) => sum + item.total_price, 0) - (parseFloat(document.getElementById('discount-input').value) || 0),
            items: this.invoiceItems
        };

        PrintHelper.printInvoice(invoiceData, 'sales');
    }

    clearInvoice() {
        if (confirm('هل أنت متأكد من مسح الفاتورة؟')) {
            document.getElementById('invoice-form').reset();
            this.invoiceItems = [];
            this.currentInvoiceId = null;
            this.renderInvoiceItems();
            this.calculateTotals();
            this.setCurrentDateTime();
            document.getElementById('print-invoice-btn').disabled = true;
            Utils.showToast('تم مسح الفاتورة', 'info');
        }
    }

    setCurrentDateTime() {
        const now = new Date();
        document.getElementById('invoice-date').value = Utils.formatDateForInput(now);
    }

    showNewInvoiceSection() {
        document.getElementById('new-invoice-section').style.display = 'block';
        document.getElementById('invoices-list-section').style.display = 'none';
        document.getElementById('new-invoice-btn').classList.add('btn-primary');
        document.getElementById('new-invoice-btn').classList.remove('btn-secondary');
        document.getElementById('view-invoices-btn').classList.add('btn-secondary');
        document.getElementById('view-invoices-btn').classList.remove('btn-primary');
    }

    async showInvoicesListSection() {
        document.getElementById('new-invoice-section').style.display = 'none';
        document.getElementById('invoices-list-section').style.display = 'block';
        document.getElementById('view-invoices-btn').classList.add('btn-primary');
        document.getElementById('view-invoices-btn').classList.remove('btn-secondary');
        document.getElementById('new-invoice-btn').classList.add('btn-secondary');
        document.getElementById('new-invoice-btn').classList.remove('btn-primary');
        
        await this.loadInvoices();
    }

    async loadInvoices() {
        try {
            const result = await DatabaseHelper.getCollection('sales_invoices', 
                { field: 'date', direction: 'desc' }
            );

            if (result.success) {
                this.invoices = result.data;
                this.renderInvoices();
            } else {
                Utils.showToast('خطأ في تحميل الفواتير', 'error');
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            Utils.showToast('خطأ في تحميل الفواتير', 'error');
        }
    }

    renderInvoices() {
        const tbody = document.getElementById('invoices-tbody');
        const noInvoicesMessage = document.getElementById('no-invoices-message');
        const table = document.getElementById('invoices-table');

        if (this.invoices.length === 0) {
            table.style.display = 'none';
            noInvoicesMessage.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noInvoicesMessage.style.display = 'none';

        tbody.innerHTML = this.invoices.map(invoice => `
            <tr>
                <td>${invoice.id.substring(0, 8)}...</td>
                <td>${invoice.customer_name}</td>
                <td>${Utils.formatDate(invoice.date.toDate())}</td>
                <td>${Utils.formatCurrency(invoice.total_amount)}</td>
                <td>${Utils.formatCurrency(invoice.discount)}</td>
                <td>${Utils.formatCurrency(invoice.net_amount)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="salesManager.viewInvoiceDetails('${invoice.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="salesManager.printInvoice('${invoice.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async viewInvoiceDetails(invoiceId) {
        try {
            const invoice = this.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) return;

            const modalContent = document.getElementById('invoice-details-content');
            modalContent.innerHTML = `
                <div class="invoice-details">
                    <div class="invoice-header">
                        <h4>فاتورة مبيعات رقم: ${invoice.id.substring(0, 8)}</h4>
                        <p><strong>العميل:</strong> ${invoice.customer_name}</p>
                        <p><strong>التاريخ:</strong> ${Utils.formatDate(invoice.date.toDate())}</p>
                    </div>
                    
                    <div class="invoice-items">
                        <h5>الأصناف:</h5>
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
                                ${invoice.items.map(item => `
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
                    </div>
                    
                    <div class="invoice-summary">
                        <div class="total-row">
                            <span>المجموع الفرعي:</span>
                            <span>${Utils.formatCurrency(invoice.total_amount)}</span>
                        </div>
                        <div class="total-row">
                            <span>الخصم:</span>
                            <span>${Utils.formatCurrency(invoice.discount)}</span>
                        </div>
                        <div class="total-row final-total">
                            <span>الإجمالي النهائي:</span>
                            <span>${Utils.formatCurrency(invoice.net_amount)}</span>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('invoice-details-modal').classList.add('show');
            this.currentViewInvoice = invoice;

        } catch (error) {
            console.error('Error viewing invoice details:', error);
            Utils.showToast('خطأ في عرض تفاصيل الفاتورة', 'error');
        }
    }

    hideInvoiceDetailsModal() {
        document.getElementById('invoice-details-modal').classList.remove('show');
        this.currentViewInvoice = null;
    }

    printInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            PrintHelper.printInvoice(invoice, 'sales');
        }
    }

    printInvoiceDetails() {
        if (this.currentViewInvoice) {
            PrintHelper.printInvoice(this.currentViewInvoice, 'sales');
        }
    }

    filterInvoices() {
        // Implementation for filtering invoices
        // This would filter the invoices based on search term and date range
        const searchTerm = document.getElementById('search-invoices').value.toLowerCase();
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        let filteredInvoices = [...this.invoices];

        if (searchTerm) {
            filteredInvoices = filteredInvoices.filter(invoice => 
                invoice.customer_name.toLowerCase().includes(searchTerm) ||
                invoice.id.toLowerCase().includes(searchTerm)
            );
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredInvoices = filteredInvoices.filter(invoice => 
                invoice.date.toDate() >= fromDate
            );
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filteredInvoices = filteredInvoices.filter(invoice => 
                invoice.date.toDate() <= toDate
            );
        }

        // Temporarily replace invoices for rendering
        const originalInvoices = this.invoices;
        this.invoices = filteredInvoices;
        this.renderInvoices();
        this.invoices = originalInvoices;
    }
}

// Initialize sales manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            window.salesManager = new SalesManager();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

