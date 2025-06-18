# نظام إدارة المبيعات والمشتريات والمخزون

نظام شامل لإدارة المبيعات والمشتريات والمخزون باللغة العربية مع ربطه بقاعدة بيانات Firebase.

## المميزات

- ✅ إنشاء فواتير مبيعات مرنة تدعم البيع بـ (الوزن – العبوة – الوحدة)
- ✅ إنشاء فواتير مشتريات لتغذية المخزون تلقائياً
- ✅ إدارة وتكويد الأصناف حسب نوع البيع
- ✅ تحديث المخزون تلقائياً مع كل عملية بيع أو شراء
- ✅ حفظ البيانات على Firebase (Firestore)
- ✅ واجهة مستخدم احترافية وسهلة الاستخدام
- ✅ دعم التصفية والطباعة وتصدير الفواتير والمخزون
- ✅ تنبيهات نفاد المخزون
- ✅ تقارير مفصلة للمبيعات والمشتريات

## هيكل قاعدة البيانات

### 1. مجموعة products (الأصناف)
```javascript
{
  "name": "كاندي توت",
  "category": "كاندي",
  "unit_type": "كيلو",  // أو "عبوة"، "وحدة"
  "unit_price_sale": 50,
  "unit_price_purchase": 30,
  "stock_quantity": 100,
  "min_quantity_alert": 10,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 2. مجموعة sales_invoices (فواتير المبيعات)
```javascript
{
  "customer_name": "أحمد علي",
  "date": "2025-05-26T10:00:00Z",
  "discount": 5,
  "total_amount": 250,
  "net_amount": 237.5,
  "items": [
    {
      "product_id": "candy01",
      "product_name": "كاندي توت",
      "quantity": 2,
      "unit_type": "عبوة",
      "unit_price": 40,
      "total_price": 80
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 3. مجموعة purchase_invoices (فواتير المشتريات)
```javascript
{
  "supplier_name": "حلواني الشرق",
  "date": "2025-05-24T15:00:00Z",
  "total_amount": 500,
  "items": [
    {
      "product_id": "candy01",
      "product_name": "كاندي توت",
      "quantity": 10,
      "unit_price": 30,
      "total_price": 300
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4. مجموعة users (المستخدمين)
```javascript
{
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "timestamp"
}
```

## إعداد Firebase

### الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "إنشاء مشروع" أو "Create a project"
3. أدخل اسم المشروع (مثل: sales-management-system)
4. اختر إعدادات Google Analytics (اختياري)
5. انقر على "إنشاء المشروع"

### الخطوة 2: إعداد Authentication

1. في لوحة تحكم Firebase، اذهب إلى "Authentication"
2. انقر على "البدء" أو "Get started"
3. اذهب إلى تبويب "Sign-in method"
4. فعّل "Email/Password" كطريقة تسجيل دخول
5. احفظ الإعدادات

### الخطوة 3: إعداد Firestore Database

1. في لوحة تحكم Firebase، اذهب إلى "Firestore Database"
2. انقر على "إنشاء قاعدة بيانات" أو "Create database"
3. اختر "Start in test mode" للبداية
4. اختر موقع قاعدة البيانات (اختر الأقرب لك)
5. انقر على "تم" أو "Done"

### الخطوة 4: إعداد قواعد الأمان

في Firestore، اذهب إلى تبويب "Rules" وأدخل القواعد التالية:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### الخطوة 5: الحصول على إعدادات المشروع

1. اذهب إلى إعدادات المشروع (أيقونة الترس)
2. انتقل إلى تبويب "عام" أو "General"
3. انزل إلى قسم "تطبيقاتك" أو "Your apps"
4. انقر على "إضافة تطبيق" واختر "Web" (أيقونة </>)
5. أدخل اسم التطبيق وانقر على "تسجيل التطبيق"
6. انسخ إعدادات Firebase config

### الخطوة 6: تحديث إعدادات Firebase في المشروع

افتح ملف `config/firebase-config.js` وحدث الإعدادات:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## تشغيل النظام

### الطريقة 1: تشغيل محلي بسيط

1. افتح ملف `index.html` في المتصفح مباشرة
2. أو استخدم خادم محلي بسيط:

```bash
# إذا كان لديك Python مثبت
python -m http.server 8000

# أو إذا كان لديك Node.js مثبت
npx http-server
```

### الطريقة 2: استخدام Live Server (VS Code)

1. ثبت إضافة "Live Server" في VS Code
2. انقر بالزر الأيمن على `index.html`
3. اختر "Open with Live Server"

## استخدام النظام

### 1. تسجيل الدخول

- افتح `login.html` في المتصفح
- أنشئ حساب جديد أو سجل دخول بحساب موجود
- سيتم توجيهك تلقائياً إلى لوحة التحكم

### 2. إدارة الأصناف

- اذهب إلى صفحة "الأصناف"
- أضف أصناف جديدة مع تحديد نوع البيع (كيلو/عبوة/وحدة)
- حدد أسعار البيع والشراء
- اضبط الحد الأدنى للتنبيه

### 3. فواتير المبيعات

- اذهب إلى صفحة "فواتير المبيعات"
- أنشئ فاتورة جديدة
- أضف الأصناف والكميات
- سيتم خصم الكميات من المخزون تلقائياً

### 4. فواتير المشتريات

- اذهب إلى صفحة "فواتير المشتريات"
- أنشئ فاتورة شراء جديدة
- أضف الأصناف والكميات
- سيتم إضافة الكميات للمخزون تلقائياً

### 5. مراقبة المخزون

- اذهب إلى صفحة "المخزون"
- راقب الكميات المتاحة
- احصل على تنبيهات عند نفاد الأصناف

### 6. التقارير

- اذهب إلى صفحة "التقارير"
- اطبع أو صدّر التقارير بصيغة PDF أو Excel

## الملفات والمجلدات

```
sales-system/
├── index.html              # الصفحة الرئيسية (لوحة التحكم)
├── login.html              # صفحة تسجيل الدخول
├── css/
│   └── style.css           # ملف التصميم الرئيسي
├── js/
│   ├── main.js             # الوظائف المشتركة
│   ├── auth.js             # إدارة التوثيق
│   ├── dashboard.js        # لوحة التحكم
│   └── login.js            # صفحة تسجيل الدخول
├── config/
│   └── firebase-config.js  # إعدادات Firebase
├── pages/
│   ├── products.html       # إدارة الأصناف
│   ├── sales.html          # فواتير المبيعات
│   ├── purchases.html      # فواتير المشتريات
│   ├── stock.html          # إدارة المخزون
│   └── reports.html        # التقارير
└── assets/                 # الصور والملفات الثابتة
```

## المتطلبات

- متصفح ويب حديث يدعم JavaScript ES6+
- اتصال بالإنترنت لـ Firebase
- حساب Firebase مجاني

## الدعم والمساعدة

إذا واجهت أي مشاكل في الإعداد أو الاستخدام:

1. تأكد من صحة إعدادات Firebase
2. تحقق من وجود اتصال بالإنترنت
3. افتح أدوات المطور في المتصفح للتحقق من الأخطاء
4. تأكد من تفعيل Authentication و Firestore في Firebase Console

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.



## 🚀 نشر النظام

### نشر على Firebase Hosting (مجاني ومُوصى به)

1. **تثبيت Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **تسجيل الدخول إلى Firebase:**
   ```bash
   firebase login
   ```

3. **ربط المشروع:**
   ```bash
   cd sales-system
   firebase init hosting
   ```
   - اختر مشروع Firebase الخاص بك
   - اختر المجلد الحالي (.) كـ public directory
   - اختر "No" لـ single-page app
   - اختر "No" لـ overwrite index.html

4. **نشر المشروع:**
   ```bash
   firebase deploy
   ```

5. **الحصول على الرابط:**
   - بعد النشر الناجح، ستحصل على رابط مثل: `https://your-project-id.web.app`

### نشر على Netlify (مجاني)

1. **إنشاء حساب على [Netlify](https://netlify.com)**
2. **سحب وإفلات المجلد** على لوحة تحكم Netlify
3. **أو ربط مع Git repository** للنشر التلقائي

### نشر على Vercel (مجاني)

1. **إنشاء حساب على [Vercel](https://vercel.com)**
2. **ربط مع Git repository**
3. **النشر التلقائي مع كل تحديث**

### نشر على خادم ويب عادي

1. **رفع الملفات:**
   - ارفع جميع ملفات المشروع إلى مجلد الويب في الخادم
   - تأكد من أن ملف index.html في المجلد الجذر

2. **إعداد الخادم:**
   - تأكد من دعم HTTPS (مطلوب لـ Firebase)
   - قم بإعداد إعادة توجيه للصفحات غير الموجودة إلى index.html

### متطلبات النشر

- **HTTPS مطلوب:** Firebase يتطلب HTTPS للعمل بشكل صحيح
- **CORS:** تأكد من إعداد CORS بشكل صحيح إذا كنت تستخدم خادم مخصص
- **إعدادات Firebase:** تأكد من تحديث إعدادات Firebase في ملف التكوين

### نصائح للنشر

1. **اختبر محلياً أولاً:** تأكد من عمل النظام محلياً قبل النشر
2. **احفظ نسخة احتياطية:** احتفظ بنسخة من إعدادات Firebase
3. **راقب الاستخدام:** تابع استخدام Firebase لتجنب تجاوز الحدود المجانية
4. **أمان البيانات:** راجع قواعد الأمان في Firestore بانتظام


