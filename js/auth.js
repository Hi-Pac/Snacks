// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication state
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.handleAuthenticatedUser(user);
            } else {
                this.currentUser = null;
                this.handleUnauthenticatedUser();
            }
        });
    }

    handleAuthenticatedUser(user) {
        // If on login page, redirect to dashboard
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
        
        // Update UI with user info
        this.updateUserInfo(user);
    }

    handleUnauthenticatedUser() {
        // If not on login page, redirect to login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    updateUserInfo(user) {
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = `مرحباً، ${user.displayName || user.email}`;
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with display name
            await userCredential.user.updateProfile({
                displayName: displayName
            });

            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: displayName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            });

            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'المستخدم غير موجود',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
            'auth/weak-password': 'كلمة المرور ضعيفة جداً',
            'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
            'auth/too-many-requests': 'تم تجاوز عدد المحاولات المسموح',
            'auth/network-request-failed': 'خطأ في الاتصال بالشبكة'
        };

        return errorMessages[errorCode] || 'حدث خطأ غير متوقع';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;

