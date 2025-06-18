// Firebase Configuration
// يجب استبدال هذه القيم بقيم مشروعك الفعلي من Firebase Console
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
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

