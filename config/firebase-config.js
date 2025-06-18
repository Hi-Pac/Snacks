// Firebase Configuration
// يجب استبدال هذه القيم بقيم مشروعك الفعلي من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCAUaKXd9bzMUfBAQTa1nSaEbR_VVLIe98",
  authDomain: "colorflow-erp.firebaseapp.com",
  projectId: "colorflow-erp",
  storageBucket: "colorflow-erp.firebasestorage.app",
  messagingSenderId: "40753390221",
  appId: "1:40753390221:web:a032845d5891d2b510b8c4",
  measurementId: "G-RBL9VL7RC0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
    timestampsInSnapshots: true
});

// Export for use in other files
window.auth = auth;
window.db = db;

