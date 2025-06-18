// Purchases Management JavaScript
class PurchasesManager {
    constructor() {
        this.products = [];
        this.purchaseItems = [];
        this.purchases = [];
        this.currentPurchaseId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        this.setCurrentDateTime();
        this.showNewPurchaseSection();
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('new-purchase-btn').addEventListener('click', () => {
            this.showNewPurchaseSection();
        });

        document.getElementById('view-purchases-btn').addEventListener('click', () => {
            this.showPurchasesListSection();
        });

        // Product selection and addition
        document.getElementById('product-select').addEventListener('change', () => {
            this.onProductSelect();
        });

        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.addProductToPurchase();
        });

        // Purchase form submission
        document.getElementById('purchase-form').addEventListener('submit', (e) => {
            this.handlePurchaseSubmit(e);
        });

        // Form actions
        document.getElementById('print-purchase-btn').addEventListener('click', () => {
            this.printCurrentPurchase();
        });

        document.getElementById('clear-purchase-btn').addEventListener('click', () => {
            this.clearPurchase();
        });

        // Purchase list filters
        document.getElementById('filter-purchases-btn').addEventListener('click', () => {
            this.filterPurchases();
        });

        document.getElementById('search-purchases').addEventListener('input', 
            Utils.debounce(() => this.filterPurchases(), 300)
        );

        // Modal close buttons
        document.getElementById('close-details-modal').addEventListener('click', () => {
            this.hidePurchaseDetailsModal();
        });

        document.getElementById('close-details-btn').addEventListener('click', () => {
            this.hidePurchaseDetailsModal();
        });

        document.getElementById('print-details-btn').addEventListener('click', () => {
            this.printPurchaseDetails();
        });

        // New product modal
        document.getElementById('close-new-product-modal').addEventListener('click', () => {
            this.hideNewProductModal();
        });

        document.getElementById('new-product-form').addEventListener('submit', (e) => {
            this.handleNewProductSubmit(e);
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.signOut();
        });

        // Close modals when clicking outside
        document.getElementById('purchase-details-modal').addEventListener('click', (e) => {
            if (e.target.id === 'purchase-details-modal') {
                this.hidePurchaseDetailsModal();
            }
        });

        document.getElementById('add-new-product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-new-product-modal') {
                this.hideNewProductModal();
            }
        });
    }

    async loadProducts() {
        try {
            const result = await DatabaseHelper.getCollection('products', 
                { field: 'name', direction: 'asc' }
            );

            if (result.success) {
                this.products = result.data;
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
            option.textContent = `${product.name} - ${product.category}`;
            option.dataset.product = JSON.stringify(product);
            select.appendChild(option);
        });

        // Add option to create new product
        const newProductOption = document.createElement('option');
        newProductOption.value = 'new';
        newProductOption.textContent = '+ إضافة صنف جديد';
        newProductOption.style.color = '#3498db';
        newProductOption.style.fontWeight = 'bold';
        select.appendChild(newProductOption);
    }

    onProductSelect() {
        const select = document.getElementById('product-select');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value === 'new') {
            this.showNewProductModal();
            select.value = '';
            return;
        }
        
        if (selectedOption.value) {
            const product = JSON.parse(selectedOption.dataset.product);
            document.getElementById('unit-price-input').value = product.unit_price_purchase;
            document.getElementById('quantity-input').focus();
        } else {
            document.getElementById('unit-price-input').value = '';
        }
    }

    addProductToPurchase() {
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

        // Check if product already exists in purchase
        const existingItemIndex = this.purchaseItems.findIndex(item => item.product_id === product.id);
        
        if (existingItemIndex !== -1) {
            // Update existing item
            const existingItem = this.purchaseItems[existingItemIndex];
            existingItem.quantity += quantity;
            existingItem.total_price = existingItem.quantity * existingItem.unit_price;
        } else {
            // Add new item
            const purchaseItem = {
                product_id: product.id,
                product_name: product.name,
                quantity: quantity,
                unit_type: product.unit_type,
                unit_price: unitPrice,
                total_price: quantity * unitPrice
            };
            
            this.purchaseItems.push(purchaseItem);
        }

        this.renderPurchaseItems();
        this.calculateTotals();
        this.clearProductInputs();
    }

    removeItemFromPurchase(index) {
        this.purchaseItems.splice(index, 1);
        this.renderPurchaseItems();
        this.calculateTotals();
    }

    renderPurchaseItems() {
        const tbody = document.getElementById('purchase-items-tbody');
        const noItemsMessage = document.getElementById('no-items-message');
        const table = document.getElementById('purchase-items-table');

        if (this.purchaseItems.length === 0) {
            table.style.display = 'none';
            noItemsMessage.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noItemsMessage.style.display = 'none';

        tbody.innerHTML = this.purchaseItems.map((item, index) => `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_type}</td>
                <td>${Utils.formatCurrency(item.unit_price)}</td>
                <td>${Utils.formatCurrency(item.total_price)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="purchasesManager.removeItemFromPurchase(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    calculateTotals() {
        const total = this.purchaseItems.reduce((sum, item) => sum + item.total_price, 0);
        document.getElementById('final-total').textContent = Utils.formatCurrency(total);
    }

    clearProductInputs() {
        document.getElementById('product-select').value = '';
        document.getElementById('quantity-input').value = '';
        document.getElementById('unit-price-input').value = '';
    }

    async handlePurchaseSubmit(e) {
        e.preventDefault();

        if (this.purchaseItems.length === 0) {
            Utils.showToast('يجب إضافة صنف واحد على الأقل', 'warning');
            return;
        }

        const saveText = document.getElementById('save-purchase-text');
        const saveLoading = document.getElementById('save-purchase-loading');
        
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            const supplierName = document.getElementById('supplier-name').value.trim();
            const purchaseDate = new Date(document.getElementById('purchase-date').value);
            const totalAmount = this.purchaseItems.reduce((sum, item) => sum + item.total_price, 0);

            // Create purchase data
            const purchaseData = {
                supplier_name: supplierName,
                date: purchaseDate,
                total_amount: totalAmount,
                items: this.purchaseItems
            };

            // Save purchase
            const result = await DatabaseHelper.addDocument('purchase_invoices', purchaseData);

            if (result.success) {
                this.currentPurchaseId = result.id;
                
                // Update stock quantities
                await this.updateStockQuantities();
                
                Utils.showToast('تم حفظ فاتورة الشراء بنجاح', 'success');
                document.getElementById('print-purchase-btn').disabled = false;
                
                // Reload products to update stock
                await this.loadProducts();
                
            } else {
                Utils.showToast('خطأ في حفظ فاتورة الشراء', 'error');
            }

        } catch (error) {
            console.error('Error saving purchase:', error);
            Utils.showToast('خطأ في حفظ فاتورة الشراء', 'error');
        } finally {
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }

    async updateStockQuantities() {
        try {
            const batch = db.batch();

            for (const item of this.purchaseItems) {
                const productRef = db.collection('products').doc(item.product_id);
                const productDoc = await productRef.get();
                
                if (productDoc.exists) {
                    const currentStock = productDoc.data().stock_quantity;
                    const newStock = currentStock + item.quantity;
                    
                    batch.update(productRef, {
                        stock_quantity: newStock,
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

    printCurrentPurchase() {
        if (!this.currentPurchaseId) {
            Utils.showToast('يجب حفظ الفاتورة أولاً', 'warning');
            return;
        }

        const purchaseData = {
            id: this.currentPurchaseId,
            supplier_name: document.getElementById('supplier-name').value,
            date: new Date(document.getElementById('purchase-date').value),
            total_amount: this.purchaseItems.reduce((sum, item) => sum + item.total_price, 0),
            items: this.purchaseItems
        };

        PrintHelper.printInvoice(purchaseData, 'purchases');
    }

    clearPurchase() {
        if (confirm('هل أنت متأكد من مسح الفاتورة؟')) {
            document.getElementById('purchase-form').reset();
            this.purchaseItems = [];
            this.currentPurchaseId = null;
            this.renderPurchaseItems();
            this.calculateTotals();
            this.setCurrentDateTime();
            document.getElementById('print-purchase-btn').disabled = true;
            Utils.showToast('تم مسح الفاتورة', 'info');
        }
    }

    setCurrentDateTime() {
        const now = new Date();
        document.getElementById('purchase-date').value = Utils.formatDateForInput(now);
    }

    showNewPurchaseSection() {
        document.getElementById('new-purchase-section').style.display = 'block';
        document.getElementById('purchases-list-section').style.display = 'none';
        document.getElementById('new-purchase-btn').classList.add('btn-primary');
        document.getElementById('new-purchase-btn').classList.remove('btn-secondary');
        document.getElementById('view-purchases-btn').classList.add('btn-secondary');
        document.getElementById('view-purchases-btn').classList.remove('btn-primary');
    }

    async showPurchasesListSection() {
        document.getElementById('new-purchase-section').style.display = 'none';
        document.getElementById('purchases-list-section').style.display = 'block';
        document.getElementById('view-purchases-btn').classList.add('btn-primary');
        document.getElementById('view-purchases-btn').classList.remove('btn-secondary');
        document.getElementById('new-purchase-btn').classList.add('btn-secondary');
        document.getElementById('new-purchase-btn').classList.remove('btn-primary');
        
        await this.loadPurchases();
    }

    async loadPurchases() {
        try {
            const result = await DatabaseHelper.getCollection('purchase_invoices', 
                { field: 'date', direction: 'desc' }
            );

            if (result.success) {
                this.purchases = result.data;
                this.renderPurchases();
            } else {
                Utils.showToast('خطأ في تحميل فواتير الشراء', 'error');
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
            Utils.showToast('خطأ في تحميل فواتير الشراء', 'error');
        }
    }

    renderPurchases() {
        const tbody = document.getElementById('purchases-tbody');
        const noPurchasesMessage = document.getElementById('no-purchases-message');
        const table = document.getElementById('purchases-table');

        if (this.purchases.length === 0) {
            table.style.display = 'none';
            noPurchasesMessage.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noPurchasesMessage.style.display = 'none';

        tbody.innerHTML = this.purchases.map(purchase => `
            <tr>
                <td>${purchase.id.substring(0, 8)}...</td>
                <td>${purchase.supplier_name}</td>
                <td>${Utils.formatDate(purchase.date.toDate())}</td>
                <td>${Utils.formatCurrency(purchase.total_amount)}</td>
                <td>${purchase.items.length}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="purchasesManager.viewPurchaseDetails('${purchase.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="purchasesManager.printPurchase('${purchase.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async viewPurchaseDetails(purchaseId) {
        try {
            const purchase = this.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;

            const modalContent = document.getElementById('purchase-details-content');
            modalContent.innerHTML = `
                <div class="purchase-details">
                    <div class="purchase-header">
                        <h4>فاتورة شراء رقم: ${purchase.id.substring(0, 8)}</h4>
                        <p><strong>المورد:</strong> ${purchase.supplier_name}</p>
                        <p><strong>التاريخ:</strong> ${Utils.formatDate(purchase.date.toDate())}</p>
                    </div>
                    
                    <div class="purchase-items">
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
                                ${purchase.items.map(item => `
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
                    
                    <div class="purchase-summary">
                        <div class="total-row final-total">
                            <span>الإجمالي:</span>
                            <span>${Utils.formatCurrency(purchase.total_amount)}</span>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('purchase-details-modal').classList.add('show');
            this.currentViewPurchase = purchase;

        } catch (error) {
            console.error('Error viewing purchase details:', error);
            Utils.showToast('خطأ في عرض تفاصيل الفاتورة', 'error');
        }
    }

    hidePurchaseDetailsModal() {
        document.getElementById('purchase-details-modal').classList.remove('show');
        this.currentViewPurchase = null;
    }

    printPurchase(purchaseId) {
        const purchase = this.purchases.find(p => p.id === purchaseId);
        if (purchase) {
            PrintHelper.printInvoice(purchase, 'purchases');
        }
    }

    printPurchaseDetails() {
        if (this.currentViewPurchase) {
            PrintHelper.printInvoice(this.currentViewPurchase, 'purchases');
        }
    }

    filterPurchases() {
        const searchTerm = document.getElementById('search-purchases').value.toLowerCase();
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        let filteredPurchases = [...this.purchases];

        if (searchTerm) {
            filteredPurchases = filteredPurchases.filter(purchase => 
                purchase.supplier_name.toLowerCase().includes(searchTerm) ||
                purchase.id.toLowerCase().includes(searchTerm)
            );
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredPurchases = filteredPurchases.filter(purchase => 
                purchase.date.toDate() >= fromDate
            );
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filteredPurchases = filteredPurchases.filter(purchase => 
                purchase.date.toDate() <= toDate
            );
        }

        // Temporarily replace purchases for rendering
        const originalPurchases = this.purchases;
        this.purchases = filteredPurchases;
        this.renderPurchases();
        this.purchases = originalPurchases;
    }

    showNewProductModal() {
        document.getElementById('add-new-product-modal').classList.add('show');
    }

    hideNewProductModal() {
        document.getElementById('add-new-product-modal').classList.remove('show');
        document.getElementById('new-product-form').reset();
    }

    async handleNewProductSubmit(e) {
        e.preventDefault();

        const saveText = document.getElementById('save-new-product-text');
        const saveLoading = document.getElementById('save-new-product-loading');
        
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            const productData = {
                name: document.getElementById('new-product-name').value.trim(),
                category: document.getElementById('new-product-category').value,
                unit_type: document.getElementById('new-unit-type').value,
                unit_price_sale: parseFloat(document.getElementById('new-sale-price').value),
                unit_price_purchase: parseFloat(document.getElementById('new-purchase-price').value),
                stock_quantity: 0,
                min_quantity_alert: 10
            };

            // Validation
            if (productData.unit_price_sale <= 0 || productData.unit_price_purchase <= 0) {
                Utils.showToast('يجب أن تكون الأسعار أكبر من صفر', 'error');
                return;
            }

            if (productData.unit_price_purchase >= productData.unit_price_sale) {
                Utils.showToast('سعر البيع يجب أن يكون أكبر من سعر الشراء', 'warning');
            }

            const result = await DatabaseHelper.addDocument('products', productData);

            if (result.success) {
                Utils.showToast('تم إضافة الصنف بنجاح', 'success');
                this.hideNewProductModal();
                await this.loadProducts();
                
                // Select the new product
                document.getElementById('product-select').value = result.id;
                this.onProductSelect();
            } else {
                Utils.showToast('خطأ في إضافة الصنف', 'error');
            }

        } catch (error) {
            console.error('Error adding new product:', error);
            Utils.showToast('خطأ في إضافة الصنف', 'error');
        } finally {
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }
}

// Initialize purchases manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            window.purchasesManager = new PurchasesManager();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

