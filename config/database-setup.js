// Database Setup and Initial Data
class DatabaseSetup {
    constructor() {
        this.collections = [
            'products',
            'sales_invoices', 
            'purchase_invoices',
            'users'
        ];
    }

    // Initialize database with sample data
    async initializeDatabase() {
        try {
            console.log('بدء إعداد قاعدة البيانات...');
            
            // Check if data already exists
            const productsSnapshot = await db.collection('products').limit(1).get();
            if (!productsSnapshot.empty) {
                console.log('قاعدة البيانات تحتوي على بيانات بالفعل');
                return { success: true, message: 'قاعدة البيانات جاهزة' };
            }

            // Add sample products
            await this.addSampleProducts();
            
            console.log('تم إعداد قاعدة البيانات بنجاح');
            return { success: true, message: 'تم إعداد قاعدة البيانات بنجاح' };
            
        } catch (error) {
            console.error('خطأ في إعداد قاعدة البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    // Add sample products
    async addSampleProducts() {
        const sampleProducts = [
            {
                name: 'كاندي توت',
                category: 'كاندي',
                unit_type: 'كيلو',
                unit_price_sale: 50,
                unit_price_purchase: 30,
                stock_quantity: 100,
                min_quantity_alert: 10
            },
            {
                name: 'شوكولاتة دارك',
                category: 'شوكولاتة',
                unit_type: 'عبوة',
                unit_price_sale: 25,
                unit_price_purchase: 15,
                stock_quantity: 50,
                min_quantity_alert: 5
            },
            {
                name: 'بسكويت أوريو',
                category: 'بسكويت',
                unit_type: 'وحدة',
                unit_price_sale: 8,
                unit_price_purchase: 5,
                stock_quantity: 200,
                min_quantity_alert: 20
            },
            {
                name: 'علكة نعناع',
                category: 'علكة',
                unit_type: 'عبوة',
                unit_price_sale: 3,
                unit_price_purchase: 2,
                stock_quantity: 150,
                min_quantity_alert: 15
            },
            {
                name: 'حلوى جيلي',
                category: 'حلوى',
                unit_type: 'كيلو',
                unit_price_sale: 35,
                unit_price_purchase: 20,
                stock_quantity: 75,
                min_quantity_alert: 8
            }
        ];

        const batch = db.batch();
        
        sampleProducts.forEach(product => {
            const docRef = db.collection('products').doc();
            batch.set(docRef, {
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log('تم إضافة الأصناف النموذجية');
    }

    // Create indexes for better performance
    async createIndexes() {
        // Note: Indexes are usually created automatically by Firestore
        // or manually through Firebase Console for complex queries
        console.log('سيتم إنشاء الفهارس تلقائياً عند الحاجة');
    }

    // Backup database
    async backupDatabase() {
        try {
            const backup = {};
            
            for (const collection of this.collections) {
                const snapshot = await db.collection(collection).get();
                backup[collection] = [];
                
                snapshot.forEach(doc => {
                    backup[collection].push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }

            // Convert to JSON and download
            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return { success: true, message: 'تم إنشاء نسخة احتياطية بنجاح' };
            
        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            return { success: false, error: error.message };
        }
    }

    // Restore database from backup
    async restoreDatabase(backupData) {
        try {
            const batch = db.batch();
            
            for (const [collectionName, documents] of Object.entries(backupData)) {
                documents.forEach(doc => {
                    const docRef = db.collection(collectionName).doc(doc.id);
                    const { id, ...data } = doc;
                    batch.set(docRef, data);
                });
            }
            
            await batch.commit();
            return { success: true, message: 'تم استعادة قاعدة البيانات بنجاح' };
            
        } catch (error) {
            console.error('خطأ في استعادة قاعدة البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all data (use with caution)
    async clearDatabase() {
        try {
            const batch = db.batch();
            
            for (const collection of this.collections) {
                const snapshot = await db.collection(collection).get();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
            
            await batch.commit();
            return { success: true, message: 'تم مسح قاعدة البيانات' };
            
        } catch (error) {
            console.error('خطأ في مسح قاعدة البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    // Get database statistics
    async getDatabaseStats() {
        try {
            const stats = {};
            
            for (const collection of this.collections) {
                const snapshot = await db.collection(collection).get();
                stats[collection] = snapshot.size;
            }
            
            return { success: true, data: stats };
            
        } catch (error) {
            console.error('خطأ في جلب إحصائيات قاعدة البيانات:', error);
            return { success: false, error: error.message };
        }
    }
}

// Firestore Security Rules (to be applied in Firebase Console)
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Authenticated users can read and write products
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    // Authenticated users can read and write sales invoices
    match /sales_invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }
    
    // Authenticated users can read and write purchase invoices
    match /purchase_invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }
  }
}
`;

// Export for global use
window.DatabaseSetup = DatabaseSetup;
window.firestoreRules = firestoreRules;

