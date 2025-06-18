// Reports Management JavaScript
class ReportsManager {
    constructor() {
        this.currentReportType = null;
        this.reportData = [];
        this.chart = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setDefaultDateRange();
    }

    setupEventListeners() {
        // Report generation
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            this.generateReport();
        });

        // Export buttons
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('export-excel-btn').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('print-report-btn').addEventListener('click', () => {
            this.printReport();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.signOut();
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('date-from').value = Utils.formatDateForInput(firstDayOfMonth);
        document.getElementById('date-to').value = Utils.formatDateForInput(today);
    }

    showSalesReport() {
        this.currentReportType = 'sales';
        this.showReportContent('تقرير المبيعات');
        this.showCustomerFilter();
        this.hideSupplierFilter();
    }

    showPurchasesReport() {
        this.currentReportType = 'purchases';
        this.showReportContent('تقرير المشتريات');
        this.hideCustomerFilter();
        this.showSupplierFilter();
    }

    showStockReport() {
        this.currentReportType = 'stock';
        this.showReportContent('تقرير المخزون');
        this.hideCustomerFilter();
        this.hideSupplierFilter();
    }

    showProfitReport() {
        this.currentReportType = 'profit';
        this.showReportContent('تقرير الأرباح');
        this.hideCustomerFilter();
        this.hideSupplierFilter();
    }

    showReportContent(title) {
        document.getElementById('report-title').textContent = title;
        document.getElementById('report-content').style.display = 'block';
        this.hideAllReportSections();
    }

    showCustomerFilter() {
        document.getElementById('customer-filter-group').style.display = 'block';
        this.loadCustomers();
    }

    hideCustomerFilter() {
        document.getElementById('customer-filter-group').style.display = 'none';
    }

    showSupplierFilter() {
        document.getElementById('supplier-filter-group').style.display = 'block';
        this.loadSuppliers();
    }

    hideSupplierFilter() {
        document.getElementById('supplier-filter-group').style.display = 'none';
    }

    async loadCustomers() {
        try {
            const salesSnapshot = await db.collection('sales_invoices').get();
            const customers = new Set();
            
            salesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.customer_name) {
                    customers.add(data.customer_name);
                }
            });

            const select = document.getElementById('customer-filter');
            select.innerHTML = '<option value="">جميع العملاء</option>';
            
            Array.from(customers).sort().forEach(customer => {
                const option = document.createElement('option');
                option.value = customer;
                option.textContent = customer;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    async loadSuppliers() {
        try {
            const purchasesSnapshot = await db.collection('purchase_invoices').get();
            const suppliers = new Set();
            
            purchasesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.supplier_name) {
                    suppliers.add(data.supplier_name);
                }
            });

            const select = document.getElementById('supplier-filter');
            select.innerHTML = '<option value="">جميع الموردين</option>';
            
            Array.from(suppliers).sort().forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier;
                option.textContent = supplier;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    }

    async generateReport() {
        this.showLoading();
        
        try {
            const dateFrom = new Date(document.getElementById('date-from').value);
            const dateTo = new Date(document.getElementById('date-to').value);
            dateTo.setHours(23, 59, 59, 999);

            switch (this.currentReportType) {
                case 'sales':
                    await this.generateSalesReport(dateFrom, dateTo);
                    break;
                case 'purchases':
                    await this.generatePurchasesReport(dateFrom, dateTo);
                    break;
                case 'stock':
                    await this.generateStockReport();
                    break;
                case 'profit':
                    await this.generateProfitReport(dateFrom, dateTo);
                    break;
            }

        } catch (error) {
            console.error('Error generating report:', error);
            Utils.showToast('خطأ في إنشاء التقرير', 'error');
            this.showNoData();
        } finally {
            this.hideLoading();
        }
    }

    async generateSalesReport(dateFrom, dateTo) {
        const customerFilter = document.getElementById('customer-filter').value;
        
        let query = db.collection('sales_invoices')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo);

        if (customerFilter) {
            query = query.where('customer_name', '==', customerFilter);
        }

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            this.showNoData();
            return;
        }

        const salesData = [];
        let totalSales = 0;
        let totalDiscount = 0;
        let totalInvoices = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            salesData.push({
                id: doc.id,
                customer_name: data.customer_name,
                date: data.date.toDate(),
                total_amount: data.total_amount,
                discount: data.discount || 0,
                net_amount: data.net_amount,
                items_count: data.items ? data.items.length : 0
            });

            totalSales += data.total_amount;
            totalDiscount += data.discount || 0;
            totalInvoices++;
        });

        this.reportData = salesData;

        // Show summary
        this.showSummary([
            { title: 'إجمالي المبيعات', value: Utils.formatCurrency(totalSales) },
            { title: 'إجمالي الخصومات', value: Utils.formatCurrency(totalDiscount) },
            { title: 'صافي المبيعات', value: Utils.formatCurrency(totalSales - totalDiscount) },
            { title: 'عدد الفواتير', value: totalInvoices }
        ]);

        // Show chart
        this.showSalesChart(salesData);

        // Show table
        this.showSalesTable(salesData);
    }

    async generatePurchasesReport(dateFrom, dateTo) {
        const supplierFilter = document.getElementById('supplier-filter').value;
        
        let query = db.collection('purchase_invoices')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo);

        if (supplierFilter) {
            query = query.where('supplier_name', '==', supplierFilter);
        }

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            this.showNoData();
            return;
        }

        const purchasesData = [];
        let totalPurchases = 0;
        let totalInvoices = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            purchasesData.push({
                id: doc.id,
                supplier_name: data.supplier_name,
                date: data.date.toDate(),
                total_amount: data.total_amount,
                items_count: data.items ? data.items.length : 0
            });

            totalPurchases += data.total_amount;
            totalInvoices++;
        });

        this.reportData = purchasesData;

        // Show summary
        this.showSummary([
            { title: 'إجمالي المشتريات', value: Utils.formatCurrency(totalPurchases) },
            { title: 'عدد الفواتير', value: totalInvoices },
            { title: 'متوسط قيمة الفاتورة', value: Utils.formatCurrency(totalPurchases / totalInvoices) }
        ]);

        // Show chart
        this.showPurchasesChart(purchasesData);

        // Show table
        this.showPurchasesTable(purchasesData);
    }

    async generateStockReport() {
        const snapshot = await db.collection('products').get();
        
        if (snapshot.empty) {
            this.showNoData();
            return;
        }

        const stockData = [];
        let totalProducts = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const stockValue = data.stock_quantity * data.unit_price_purchase;
            
            stockData.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                stock_quantity: data.stock_quantity,
                unit_type: data.unit_type,
                min_quantity_alert: data.min_quantity_alert,
                unit_price_purchase: data.unit_price_purchase,
                stock_value: stockValue,
                status: this.getStockStatus(data)
            });

            totalProducts++;
            totalValue += stockValue;
            
            if (data.stock_quantity === 0) outOfStockCount++;
            else if (data.stock_quantity <= data.min_quantity_alert) lowStockCount++;
        });

        this.reportData = stockData;

        // Show summary
        this.showSummary([
            { title: 'إجمالي الأصناف', value: totalProducts },
            { title: 'قيمة المخزون', value: Utils.formatCurrency(totalValue) },
            { title: 'أصناف منخفضة', value: lowStockCount },
            { title: 'أصناف نافدة', value: outOfStockCount }
        ]);

        // Show chart
        this.showStockChart(stockData);

        // Show table
        this.showStockTable(stockData);
    }

    async generateProfitReport(dateFrom, dateTo) {
        // Get sales data
        const salesSnapshot = await db.collection('sales_invoices')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();

        // Get purchases data
        const purchasesSnapshot = await db.collection('purchase_invoices')
            .where('date', '>=', dateFrom)
            .where('date', '<=', dateTo)
            .get();

        let totalSales = 0;
        let totalPurchases = 0;
        let salesCount = 0;
        let purchasesCount = 0;

        salesSnapshot.forEach(doc => {
            const data = doc.data();
            totalSales += data.net_amount || data.total_amount;
            salesCount++;
        });

        purchasesSnapshot.forEach(doc => {
            const data = doc.data();
            totalPurchases += data.total_amount;
            purchasesCount++;
        });

        const grossProfit = totalSales - totalPurchases;
        const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        this.reportData = {
            totalSales,
            totalPurchases,
            grossProfit,
            profitMargin,
            salesCount,
            purchasesCount
        };

        // Show summary
        this.showSummary([
            { title: 'إجمالي المبيعات', value: Utils.formatCurrency(totalSales) },
            { title: 'إجمالي المشتريات', value: Utils.formatCurrency(totalPurchases) },
            { title: 'إجمالي الربح', value: Utils.formatCurrency(grossProfit) },
            { title: 'هامش الربح', value: `${profitMargin.toFixed(2)}%` }
        ]);

        // Show chart
        this.showProfitChart({ totalSales, totalPurchases, grossProfit });

        // Hide table for profit report
        this.hideTable();
    }

    getStockStatus(product) {
        if (product.stock_quantity === 0) return 'نافد';
        if (product.stock_quantity <= product.min_quantity_alert) return 'منخفض';
        return 'متوفر';
    }

    showSummary(summaryItems) {
        const summaryContainer = document.getElementById('report-summary');
        summaryContainer.innerHTML = summaryItems.map(item => `
            <div class="summary-item">
                <h4>${item.value}</h4>
                <p>${item.title}</p>
            </div>
        `).join('');
        summaryContainer.style.display = 'grid';
    }

    showSalesChart(data) {
        const ctx = document.getElementById('report-chart').getContext('2d');
        
        // Group sales by date
        const salesByDate = {};
        data.forEach(sale => {
            const dateKey = Utils.formatDate(sale.date);
            if (!salesByDate[dateKey]) {
                salesByDate[dateKey] = 0;
            }
            salesByDate[dateKey] += sale.net_amount;
        });

        const labels = Object.keys(salesByDate).sort();
        const values = labels.map(label => salesByDate[label]);

        this.destroyChart();
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'المبيعات اليومية',
                    data: values,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('report-chart-container').style.display = 'block';
    }

    showPurchasesChart(data) {
        const ctx = document.getElementById('report-chart').getContext('2d');
        
        // Group purchases by supplier
        const purchasesBySupplier = {};
        data.forEach(purchase => {
            if (!purchasesBySupplier[purchase.supplier_name]) {
                purchasesBySupplier[purchase.supplier_name] = 0;
            }
            purchasesBySupplier[purchase.supplier_name] += purchase.total_amount;
        });

        const labels = Object.keys(purchasesBySupplier);
        const values = Object.values(purchasesBySupplier);

        this.destroyChart();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
                        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('report-chart-container').style.display = 'block';
    }

    showStockChart(data) {
        const ctx = document.getElementById('report-chart').getContext('2d');
        
        // Group by category
        const stockByCategory = {};
        data.forEach(product => {
            if (!stockByCategory[product.category]) {
                stockByCategory[product.category] = 0;
            }
            stockByCategory[product.category] += product.stock_value;
        });

        const labels = Object.keys(stockByCategory);
        const values = Object.values(stockByCategory);

        this.destroyChart();
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'قيمة المخزون',
                    data: values,
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('report-chart-container').style.display = 'block';
    }

    showProfitChart(data) {
        const ctx = document.getElementById('report-chart').getContext('2d');

        this.destroyChart();
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['المبيعات', 'المشتريات', 'الربح'],
                datasets: [{
                    data: [data.totalSales, data.totalPurchases, data.grossProfit],
                    backgroundColor: ['#2ecc71', '#e74c3c', '#3498db']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('report-chart-container').style.display = 'block';
    }

    showSalesTable(data) {
        const thead = document.getElementById('report-table-head');
        const tbody = document.getElementById('report-table-body');

        thead.innerHTML = `
            <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>المبلغ الإجمالي</th>
                <th>الخصم</th>
                <th>صافي المبلغ</th>
                <th>عدد الأصناف</th>
            </tr>
        `;

        tbody.innerHTML = data.map(sale => `
            <tr>
                <td>${sale.id.substring(0, 8)}...</td>
                <td>${sale.customer_name}</td>
                <td>${Utils.formatDate(sale.date)}</td>
                <td>${Utils.formatCurrency(sale.total_amount)}</td>
                <td>${Utils.formatCurrency(sale.discount)}</td>
                <td>${Utils.formatCurrency(sale.net_amount)}</td>
                <td>${sale.items_count}</td>
            </tr>
        `).join('');

        document.getElementById('report-table-container').style.display = 'block';
    }

    showPurchasesTable(data) {
        const thead = document.getElementById('report-table-head');
        const tbody = document.getElementById('report-table-body');

        thead.innerHTML = `
            <tr>
                <th>رقم الفاتورة</th>
                <th>المورد</th>
                <th>التاريخ</th>
                <th>المبلغ الإجمالي</th>
                <th>عدد الأصناف</th>
            </tr>
        `;

        tbody.innerHTML = data.map(purchase => `
            <tr>
                <td>${purchase.id.substring(0, 8)}...</td>
                <td>${purchase.supplier_name}</td>
                <td>${Utils.formatDate(purchase.date)}</td>
                <td>${Utils.formatCurrency(purchase.total_amount)}</td>
                <td>${purchase.items_count}</td>
            </tr>
        `).join('');

        document.getElementById('report-table-container').style.display = 'block';
    }

    showStockTable(data) {
        const thead = document.getElementById('report-table-head');
        const tbody = document.getElementById('report-table-body');

        thead.innerHTML = `
            <tr>
                <th>اسم الصنف</th>
                <th>الفئة</th>
                <th>الكمية</th>
                <th>الوحدة</th>
                <th>الحالة</th>
                <th>قيمة المخزون</th>
            </tr>
        `;

        tbody.innerHTML = data.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.stock_quantity}</td>
                <td>${product.unit_type}</td>
                <td><span class="status-badge">${product.status}</span></td>
                <td>${Utils.formatCurrency(product.stock_value)}</td>
            </tr>
        `).join('');

        document.getElementById('report-table-container').style.display = 'block';
    }

    hideTable() {
        document.getElementById('report-table-container').style.display = 'none';
    }

    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    hideAllReportSections() {
        document.getElementById('report-summary').style.display = 'none';
        document.getElementById('report-chart-container').style.display = 'none';
        document.getElementById('report-table-container').style.display = 'none';
        document.getElementById('report-loading').style.display = 'none';
        document.getElementById('no-data-message').style.display = 'none';
    }

    showLoading() {
        this.hideAllReportSections();
        document.getElementById('report-loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('report-loading').style.display = 'none';
    }

    showNoData() {
        this.hideAllReportSections();
        document.getElementById('no-data-message').style.display = 'block';
    }

    exportToPDF() {
        // Simple PDF export using browser print
        const printContent = this.generatePrintContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    exportToExcel() {
        if (!this.reportData || this.reportData.length === 0) {
            Utils.showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        let csvContent = '';
        let headers = [];
        let rows = [];

        switch (this.currentReportType) {
            case 'sales':
                headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'المبلغ الإجمالي', 'الخصم', 'صافي المبلغ'];
                rows = this.reportData.map(sale => [
                    sale.id.substring(0, 8),
                    sale.customer_name,
                    Utils.formatDate(sale.date),
                    sale.total_amount,
                    sale.discount,
                    sale.net_amount
                ]);
                break;
            case 'purchases':
                headers = ['رقم الفاتورة', 'المورد', 'التاريخ', 'المبلغ الإجمالي'];
                rows = this.reportData.map(purchase => [
                    purchase.id.substring(0, 8),
                    purchase.supplier_name,
                    Utils.formatDate(purchase.date),
                    purchase.total_amount
                ]);
                break;
            case 'stock':
                headers = ['اسم الصنف', 'الفئة', 'الكمية', 'الوحدة', 'الحالة', 'قيمة المخزون'];
                rows = this.reportData.map(product => [
                    product.name,
                    product.category,
                    product.stock_quantity,
                    product.unit_type,
                    product.status,
                    product.stock_value
                ]);
                break;
        }

        csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.currentReportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Utils.showToast('تم تصدير التقرير بنجاح', 'success');
    }

    printReport() {
        const printContent = this.generatePrintContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintContent() {
        const reportTitle = document.getElementById('report-title').textContent;
        const summaryHTML = document.getElementById('report-summary').innerHTML;
        const tableHTML = document.getElementById('report-table-container').innerHTML;

        return `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${reportTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .summary-item { text-align: center; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportTitle}</h1>
                    <p>تاريخ الطباعة: ${Utils.formatDate(new Date())}</p>
                </div>
                <div class="summary">${summaryHTML}</div>
                ${tableHTML}
            </body>
            </html>
        `;
    }
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be ready
    const checkAuth = () => {
        if (window.authManager && authManager.isAuthenticated()) {
            window.reportsManager = new ReportsManager();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});

