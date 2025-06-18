// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.stats = {
            totalSales: 0,
            totalPurchases: 0,
            totalProducts: 0,
            lowStockItems: 0
        };
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadRecentActivities();
        await this.loadLowStockAlerts();
        this.setupEventListeners();
    }

    async loadStats() {
        try {
            // Get today's date range
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            // Load sales stats
            const salesSnapshot = await db.collection('sales_invoices')
                .where('date', '>=', startOfDay)
                .where('date', '<', endOfDay)
                .get();

            let totalSales = 0;
            salesSnapshot.forEach(doc => {
                totalSales += doc.data().net_amount || 0;
            });

            // Load purchases stats
            const purchasesSnapshot = await db.collection('purchase_invoices')
                .where('date', '>=', startOfDay)
                .where('date', '<', endOfDay)
                .get();

            let totalPurchases = 0;
            purchasesSnapshot.forEach(doc => {
                totalPurchases += doc.data().total_amount || 0;
            });

            // Load products count
            const productsSnapshot = await db.collection('products').get();
            const totalProducts = productsSnapshot.size;

            // Load low stock items
            const lowStockSnapshot = await db.collection('products')
                .where('stock_quantity', '<=', 10)
                .get();
            const lowStockItems = lowStockSnapshot.size;

            // Update stats
            this.stats = {
                totalSales,
                totalPurchases,
                totalProducts,
                lowStockItems
            };

            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay() {
        document.getElementById('total-sales').textContent = this.formatCurrency(this.stats.totalSales);
        document.getElementById('total-purchases').textContent = this.formatCurrency(this.stats.totalPurchases);
        document.getElementById('total-products').textContent = this.stats.totalProducts;
        document.getElementById('low-stock-items').textContent = this.stats.lowStockItems;
    }

    async loadRecentActivities() {
        try {
            const activitiesList = document.getElementById('activity-list');
            activitiesList.innerHTML = '';

            // Get recent sales
            const salesSnapshot = await db.collection('sales_invoices')
                .orderBy('date', 'desc')
                .limit(5)
                .get();

            // Get recent purchases
            const purchasesSnapshot = await db.collection('purchase_invoices')
                .orderBy('date', 'desc')
                .limit(5)
                .get();

            const activities = [];

            // Add sales activities
            salesSnapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    type: 'sale',
                    title: `فاتورة مبيعات - ${data.customer_name}`,
                    description: `المبلغ: ${this.formatCurrency(data.net_amount)}`,
                    time: data.date.toDate(),
                    icon: 'fas fa-shopping-cart'
                });
            });

            // Add purchases activities
            purchasesSnapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    type: 'purchase',
                    title: `فاتورة مشتريات - ${data.supplier_name}`,
                    description: `المبلغ: ${this.formatCurrency(data.total_amount)}`,
                    time: data.date.toDate(),
                    icon: 'fas fa-truck'
                });
            });

            // Sort by time and take latest 10
            activities.sort((a, b) => b.time - a.time);
            activities.slice(0, 10).forEach(activity => {
                activitiesList.appendChild(this.createActivityElement(activity));
            });

            if (activities.length === 0) {
                activitiesList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">لا توجد أنشطة حديثة</p>';
            }

        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    createActivityElement(activity) {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        
        activityElement.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">
                ${this.formatTime(activity.time)}
            </div>
        `;

        return activityElement;
    }

    async loadLowStockAlerts() {
        try {
            const alertsList = document.getElementById('alerts-list');
            alertsList.innerHTML = '';

            const lowStockSnapshot = await db.collection('products')
                .where('stock_quantity', '<=', 10)
                .get();

            if (lowStockSnapshot.empty) {
                alertsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">لا توجد تنبيهات مخزون</p>';
                return;
            }

            lowStockSnapshot.forEach(doc => {
                const data = doc.data();
                const alertElement = this.createAlertElement({
                    title: `نفاد مخزون: ${data.name}`,
                    description: `الكمية المتبقية: ${data.stock_quantity} ${data.unit_type}`,
                    level: data.stock_quantity === 0 ? 'critical' : 'warning'
                });
                alertsList.appendChild(alertElement);
            });

        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    createAlertElement(alert) {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert-item';
        
        alertElement.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.description}</p>
            </div>
        `;

        return alertElement;
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.signOut();
            });
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all nav items
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked item
                e.target.closest('.nav-item').classList.add('active');
            });
        });

        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadStats();
            this.loadRecentActivities();
            this.loadLowStockAlerts();
        }, 5 * 60 * 1000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            new Dashboard();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

