// Products Management JavaScript
class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentEditId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
    }

    setupEventListeners() {
        // Add product button
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductModal();
        });

        // Product form submission
        document.getElementById('product-form').addEventListener('submit', (e) => {
            this.handleProductSubmit(e);
        });

        // Modal close buttons
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteProduct();
        });

        // Search and filters
        document.getElementById('search-input').addEventListener('input', 
            Utils.debounce(() => this.filterProducts(), 300)
        );

        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('unit-filter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.signOut();
        });

        // Close modals when clicking outside
        document.getElementById('product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-modal') {
                this.hideProductModal();
            }
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.hideDeleteModal();
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
            } else {
                Utils.showToast('خطأ في تحميل الأصناف', 'error');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            Utils.showToast('خطأ في تحميل الأصناف', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderProducts() {
        const tbody = document.getElementById('products-tbody');
        const noProductsMessage = document.getElementById('no-products-message');

        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = '';
            noProductsMessage.style.display = 'block';
            return;
        }

        noProductsMessage.style.display = 'none';
        
        tbody.innerHTML = this.filteredProducts.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.unit_type}</td>
                <td>${Utils.formatCurrency(product.unit_price_sale)}</td>
                <td>${Utils.formatCurrency(product.unit_price_purchase)}</td>
                <td>${product.stock_quantity} ${product.unit_type}</td>
                <td>${product.min_quantity_alert}</td>
                <td>
                    <span class="status-badge ${this.getStockStatus(product)}">
                        ${this.getStockStatusText(product)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="productsManager.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="productsManager.showDeleteModal('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add status badge styles if not already added
        if (!document.getElementById('status-badge-styles')) {
            const styles = document.createElement('style');
            styles.id = 'status-badge-styles';
            styles.textContent = `
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-badge.in-stock {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.low-stock {
                    background: #fff3cd;
                    color: #856404;
                }
                .status-badge.out-of-stock {
                    background: #f8d7da;
                    color: #721c24;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    getStockStatus(product) {
        if (product.stock_quantity === 0) return 'out-of-stock';
        if (product.stock_quantity <= product.min_quantity_alert) return 'low-stock';
        return 'in-stock';
    }

    getStockStatusText(product) {
        if (product.stock_quantity === 0) return 'نفد المخزون';
        if (product.stock_quantity <= product.min_quantity_alert) return 'مخزون منخفض';
        return 'متوفر';
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const unitFilter = document.getElementById('unit-filter').value;

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.category.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesUnit = !unitFilter || product.unit_type === unitFilter;

            return matchesSearch && matchesCategory && matchesUnit;
        });

        this.renderProducts();
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('unit-filter').value = '';
        this.filteredProducts = [...this.products];
        this.renderProducts();
    }

    showProductModal(productId = null) {
        const modal = document.getElementById('product-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('product-form');

        this.currentEditId = productId;

        if (productId) {
            // Edit mode
            modalTitle.textContent = 'تعديل الصنف';
            const product = this.products.find(p => p.id === productId);
            if (product) {
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-category').value = product.category;
                document.getElementById('unit-type').value = product.unit_type;
                document.getElementById('sale-price').value = product.unit_price_sale;
                document.getElementById('purchase-price').value = product.unit_price_purchase;
                document.getElementById('stock-quantity').value = product.stock_quantity;
                document.getElementById('min-quantity').value = product.min_quantity_alert;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'إضافة صنف جديد';
            form.reset();
        }

        modal.classList.add('show');
    }

    hideProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.remove('show');
        this.currentEditId = null;
        document.getElementById('product-form').reset();
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const saveText = document.getElementById('save-text');
        const saveLoading = document.getElementById('save-loading');
        
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            const productData = {
                name: document.getElementById('product-name').value.trim(),
                category: document.getElementById('product-category').value,
                unit_type: document.getElementById('unit-type').value,
                unit_price_sale: parseFloat(document.getElementById('sale-price').value),
                unit_price_purchase: parseFloat(document.getElementById('purchase-price').value),
                stock_quantity: parseInt(document.getElementById('stock-quantity').value) || 0,
                min_quantity_alert: parseInt(document.getElementById('min-quantity').value) || 10
            };

            // Validation
            if (productData.unit_price_sale <= 0 || productData.unit_price_purchase <= 0) {
                Utils.showToast('يجب أن تكون الأسعار أكبر من صفر', 'error');
                return;
            }

            if (productData.unit_price_purchase >= productData.unit_price_sale) {
                Utils.showToast('سعر البيع يجب أن يكون أكبر من سعر الشراء', 'warning');
            }

            let result;
            if (this.currentEditId) {
                // Update existing product
                result = await DatabaseHelper.updateDocument('products', this.currentEditId, productData);
            } else {
                // Add new product
                result = await DatabaseHelper.addDocument('products', productData);
            }

            if (result.success) {
                Utils.showToast(
                    this.currentEditId ? 'تم تحديث الصنف بنجاح' : 'تم إضافة الصنف بنجاح',
                    'success'
                );
                this.hideProductModal();
                await this.loadProducts();
            } else {
                Utils.showToast('خطأ في حفظ الصنف', 'error');
            }

        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showToast('خطأ في حفظ الصنف', 'error');
        } finally {
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    showDeleteModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('delete-product-name').textContent = product.name;
        document.getElementById('delete-modal').classList.add('show');
        this.currentEditId = productId;
    }

    hideDeleteModal() {
        document.getElementById('delete-modal').classList.remove('show');
        this.currentEditId = null;
    }

    async deleteProduct() {
        if (!this.currentEditId) return;

        const deleteText = document.getElementById('delete-text');
        const deleteLoading = document.getElementById('delete-loading');
        
        deleteText.classList.add('hidden');
        deleteLoading.classList.remove('hidden');

        try {
            const result = await DatabaseHelper.deleteDocument('products', this.currentEditId);

            if (result.success) {
                Utils.showToast('تم حذف الصنف بنجاح', 'success');
                this.hideDeleteModal();
                await this.loadProducts();
            } else {
                Utils.showToast('خطأ في حذف الصنف', 'error');
            }

        } catch (error) {
            console.error('Error deleting product:', error);
            Utils.showToast('خطأ في حذف الصنف', 'error');
        } finally {
            deleteText.classList.remove('hidden');
            deleteLoading.classList.add('hidden');
        }
    }

    showLoading() {
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('products-table').style.display = 'none';
        document.getElementById('no-products-message').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('products-table').style.display = 'table';
    }
}

// Initialize products manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            window.productsManager = new ProductsManager();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

