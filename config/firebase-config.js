// Firebase Configuration
// يجب استبدال هذه القيم بقيم مشروعك الفعلي من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAaork_xymxacwAPaXVgiOkhDlnJ1SQxZE",
  authDomain: "snacks-817d2.firebaseapp.com",
  projectId: "snacks-817d2",
  storageBucket: "snacks-817d2.firebasestorage.app",
  messagingSenderId: "955483967375",
  appId: "1:955483967375:web:7163d62686eb46bd8e05fa",
  measurementId: "G-B52VE1HM4W"
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

