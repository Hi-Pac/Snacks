// Stock Management JavaScript
class StockManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.stockHistory = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        this.updateSummaryCards();
    }

    setupEventListeners() {
        // Stock adjustment button
        document.getElementById('adjust-stock-btn').addEventListener('click', () => {
            this.showStockAdjustmentModal();
        });

        // Export stock button
        document.getElementById('export-stock-btn').addEventListener('click', () => {
            this.exportStock();
        });

        // Stock adjustment form
        document.getElementById('stock-adjustment-form').addEventListener('submit', (e) => {
            this.handleStockAdjustment(e);
        });

        document.getElementById('adjustment-product').addEventListener('change', () => {
            this.onAdjustmentProductSelect();
        });

        // Search and filters
        document.getElementById('search-input').addEventListener('input', 
            Utils.debounce(() => this.filterProducts(), 300)
        );

        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('stock-status-filter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal close buttons
        document.getElementById('close-adjustment-modal').addEventListener('click', () => {
            this.hideStockAdjustmentModal();
        });

        document.getElementById('close-history-modal').addEventListener('click', () => {
            this.hideStockHistoryModal();
        });

        document.getElementById('close-history-btn').addEventListener('click', () => {
            this.hideStockHistoryModal();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.signOut();
        });

        // Close modals when clicking outside
        document.getElementById('stock-adjustment-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stock-adjustment-modal') {
                this.hideStockAdjustmentModal();
            }
        });

        document.getElementById('stock-history-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stock-history-modal') {
                this.hideStockHistoryModal();
            }
        });
    }

    async loadProducts() {
        try {
            this.showLoading();
            
            const result = await DatabaseHelper.getCollection('products', 
                { field: 'name', direction: 'asc' }
            );

            if (result.success) {
                this.products = result.data;
                this.filteredProducts = [...this.products];
                this.renderProducts();
                this.populateAdjustmentProductSelect();
            } else {
                Utils.showToast('خطأ في تحميل المخزون', 'error');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            Utils.showToast('خطأ في تحميل المخزون', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderProducts() {
        const tbody = document.getElementById('stock-tbody');
        const noStockMessage = document.getElementById('no-stock-message');
        const table = document.getElementById('stock-table');

        if (this.filteredProducts.length === 0) {
            table.style.display = 'none';
            noStockMessage.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noStockMessage.style.display = 'none';
        
        tbody.innerHTML = this.filteredProducts.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.stock_quantity}</td>
                <td>${product.unit_type}</td>
                <td>${product.min_quantity_alert}</td>
                <td>
                    <span class="status-badge ${this.getStockStatus(product)}">
                        ${this.getStockStatusText(product)}
                    </span>
                </td>
                <td class="stock-value">
                    ${Utils.formatCurrency(product.stock_quantity * product.unit_price_purchase)}
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="stockManager.viewStockHistory('${product.id}')">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="stockManager.quickAdjustStock('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStockStatus(product) {
        if (product.stock_quantity === 0) return 'out-of-stock';
        if (product.stock_quantity <= product.min_quantity_alert) return 'low-stock';
        return 'in-stock';
    }

    getStockStatusText(product) {
        if (product.stock_quantity === 0) return 'نافد';
        if (product.stock_quantity <= product.min_quantity_alert) return 'منخفض';
        return 'متوفر';
    }

    updateSummaryCards() {
        const totalProducts = this.products.length;
        const inStockProducts = this.products.filter(p => p.stock_quantity > p.min_quantity_alert).length;
        const lowStockProducts = this.products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_quantity_alert).length;
        const outOfStockProducts = this.products.filter(p => p.stock_quantity === 0).length;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('in-stock-products').textContent = inStockProducts;
        document.getElementById('low-stock-products').textContent = lowStockProducts;
        document.getElementById('out-of-stock-products').textContent = outOfStockProducts;
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const statusFilter = document.getElementById('stock-status-filter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.category.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesStatus = !statusFilter || this.getStockStatus(product) === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderProducts();
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('stock-status-filter').value = '';
        this.filteredProducts = [...this.products];
        this.renderProducts();
    }

    populateAdjustmentProductSelect() {
        const select = document.getElementById('adjustment-product');
        select.innerHTML = '<option value="">اختر الصنف</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.stock_quantity} ${product.unit_type}`;
            option.dataset.product = JSON.stringify(product);
            select.appendChild(option);
        });
    }

    onAdjustmentProductSelect() {
        const select = document.getElementById('adjustment-product');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const product = JSON.parse(selectedOption.dataset.product);
            document.getElementById('current-quantity').value = product.stock_quantity;
        } else {
            document.getElementById('current-quantity').value = '';
        }
    }

    showStockAdjustmentModal() {
        document.getElementById('stock-adjustment-modal').classList.add('show');
        document.getElementById('stock-adjustment-form').reset();
    }

    hideStockAdjustmentModal() {
        document.getElementById('stock-adjustment-modal').classList.remove('show');
    }

    quickAdjustStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('adjustment-product').value = productId;
        document.getElementById('current-quantity').value = product.stock_quantity;
        this.showStockAdjustmentModal();
    }

    async handleStockAdjustment(e) {
        e.preventDefault();

        const saveText = document.getElementById('save-adjustment-text');
        const saveLoading = document.getElementById('save-adjustment-loading');
        
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            const productId = document.getElementById('adjustment-product').value;
            const adjustmentType = document.getElementById('adjustment-type').value;
            const adjustmentQuantity = parseFloat(document.getElementById('adjustment-quantity').value);
            const adjustmentReason = document.getElementById('adjustment-reason').value.trim();

            const product = this.products.find(p => p.id === productId);
            if (!product) {
                Utils.showToast('الصنف غير موجود', 'error');
                return;
            }

            let newQuantity;
            switch (adjustmentType) {
                case 'add':
                    newQuantity = product.stock_quantity + adjustmentQuantity;
                    break;
                case 'subtract':
                    newQuantity = Math.max(0, product.stock_quantity - adjustmentQuantity);
                    break;
                case 'set':
                    newQuantity = adjustmentQuantity;
                    break;
                default:
                    Utils.showToast('نوع التعديل غير صحيح', 'error');
                    return;
            }

            // Update product stock
            const result = await DatabaseHelper.updateDocument('products', productId, {
                stock_quantity: newQuantity
            });

            if (result.success) {
                // Record stock adjustment history
                await this.recordStockAdjustment(productId, product.stock_quantity, newQuantity, adjustmentType, adjustmentReason);
                
                Utils.showToast('تم تعديل المخزون بنجاح', 'success');
                this.hideStockAdjustmentModal();
                await this.loadProducts();
                this.updateSummaryCards();
            } else {
                Utils.showToast('خطأ في تعديل المخزون', 'error');
            }

        } catch (error) {
            console.error('Error adjusting stock:', error);
            Utils.showToast('خطأ في تعديل المخزون', 'error');
        } finally {
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }

    async recordStockAdjustment(productId, oldQuantity, newQuantity, adjustmentType, reason) {
        try {
            const adjustmentData = {
                product_id: productId,
                old_quantity: oldQuantity,
                new_quantity: newQuantity,
                adjustment_type: adjustmentType,
                adjustment_amount: Math.abs(newQuantity - oldQuantity),
                reason: reason || 'تعديل يدوي',
                user_id: authManager.getCurrentUser().uid,
                date: firebase.firestore.FieldValue.serverTimestamp()
            };

            await DatabaseHelper.addDocument('stock_adjustments', adjustmentData);
        } catch (error) {
            console.error('Error recording stock adjustment:', error);
        }
    }

    async viewStockHistory(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            // Get stock adjustments
            const adjustmentsSnapshot = await db.collection('stock_adjustments')
                .where('product_id', '==', productId)
                .orderBy('date', 'desc')
                .limit(50)
                .get();

            // Get sales history
            const salesSnapshot = await db.collection('sales_invoices')
                .where('items', 'array-contains-any', [{ product_id: productId }])
                .orderBy('date', 'desc')
                .limit(20)
                .get();

            // Get purchases history
            const purchasesSnapshot = await db.collection('purchase_invoices')
                .where('items', 'array-contains-any', [{ product_id: productId }])
                .orderBy('date', 'desc')
                .limit(20)
                .get();

            const history = [];

            // Add adjustments
            adjustmentsSnapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    type: 'adjustment',
                    date: data.date.toDate(),
                    description: `تعديل ${data.adjustment_type === 'add' ? 'إضافة' : data.adjustment_type === 'subtract' ? 'خصم' : 'تحديد'}: ${data.adjustment_amount}`,
                    oldQuantity: data.old_quantity,
                    newQuantity: data.new_quantity,
                    reason: data.reason
                });
            });

            // Add sales (simplified - would need to parse items array properly)
            salesSnapshot.forEach(doc => {
                const data = doc.data();
                const item = data.items.find(item => item.product_id === productId);
                if (item) {
                    history.push({
                        type: 'sale',
                        date: data.date.toDate(),
                        description: `مبيعات: ${item.quantity} ${item.unit_type}`,
                        customer: data.customer_name,
                        quantity: item.quantity
                    });
                }
            });

            // Add purchases (simplified - would need to parse items array properly)
            purchasesSnapshot.forEach(doc => {
                const data = doc.data();
                const item = data.items.find(item => item.product_id === productId);
                if (item) {
                    history.push({
                        type: 'purchase',
                        date: data.date.toDate(),
                        description: `مشتريات: ${item.quantity} ${item.unit_type}`,
                        supplier: data.supplier_name,
                        quantity: item.quantity
                    });
                }
            });

            // Sort by date
            history.sort((a, b) => b.date - a.date);

            this.renderStockHistory(product, history);

        } catch (error) {
            console.error('Error loading stock history:', error);
            Utils.showToast('خطأ في تحميل تاريخ المخزون', 'error');
        }
    }

    renderStockHistory(product, history) {
        const content = document.getElementById('stock-history-content');
        
        content.innerHTML = `
            <div class="stock-history">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>الكمية الحالية: ${product.stock_quantity} ${product.unit_type}</p>
                </div>
                
                <div class="history-list">
                    ${history.length > 0 ? history.map(entry => `
                        <div class="history-item ${entry.type}">
                            <div class="history-icon">
                                <i class="fas fa-${this.getHistoryIcon(entry.type)}"></i>
                            </div>
                            <div class="history-content">
                                <div class="history-description">${entry.description}</div>
                                <div class="history-details">
                                    ${entry.customer ? `العميل: ${entry.customer}` : ''}
                                    ${entry.supplier ? `المورد: ${entry.supplier}` : ''}
                                    ${entry.reason ? `السبب: ${entry.reason}` : ''}
                                </div>
                                <div class="history-date">${Utils.formatDate(entry.date)}</div>
                            </div>
                        </div>
                    `).join('') : '<p class="text-center">لا يوجد تاريخ حركة لهذا الصنف</p>'}
                </div>
            </div>
        `;

        // Add history styles if not already added
        if (!document.getElementById('history-styles')) {
            const styles = document.createElement('style');
            styles.id = 'history-styles';
            styles.textContent = `
                .history-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .history-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px;
                    border-bottom: 1px solid #ecf0f1;
                }
                .history-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                }
                .history-item.adjustment .history-icon {
                    background: #3498db;
                }
                .history-item.sale .history-icon {
                    background: #e74c3c;
                }
                .history-item.purchase .history-icon {
                    background: #27ae60;
                }
                .history-content {
                    flex: 1;
                }
                .history-description {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                .history-details {
                    font-size: 14px;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }
                .history-date {
                    font-size: 12px;
                    color: #95a5a6;
                }
            `;
            document.head.appendChild(styles);
        }

        document.getElementById('stock-history-modal').classList.add('show');
    }

    getHistoryIcon(type) {
        const icons = {
            adjustment: 'edit',
            sale: 'shopping-cart',
            purchase: 'truck'
        };
        return icons[type] || 'circle';
    }

    hideStockHistoryModal() {
        document.getElementById('stock-history-modal').classList.remove('show');
    }

    exportStock() {
        try {
            // Prepare data for export
            const exportData = this.products.map(product => ({
                'اسم الصنف': product.name,
                'الفئة': product.category,
                'الكمية المتاحة': product.stock_quantity,
                'الوحدة': product.unit_type,
                'الحد الأدنى': product.min_quantity_alert,
                'الحالة': this.getStockStatusText(product),
                'سعر الشراء': product.unit_price_purchase,
                'سعر البيع': product.unit_price_sale,
                'قيمة المخزون': product.stock_quantity * product.unit_price_purchase
            }));

            // Convert to CSV
            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
            ].join('\n');

            // Download file
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            Utils.showToast('تم تصدير المخزون بنجاح', 'success');

        } catch (error) {
            console.error('Error exporting stock:', error);
            Utils.showToast('خطأ في تصدير المخزون', 'error');
        }
    }

    showLoading() {
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('stock-table').style.display = 'none';
        document.getElementById('no-stock-message').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('stock-table').style.display = 'table';
    }
}

// Initialize stock manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            window.stockManager = new StockManager();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

