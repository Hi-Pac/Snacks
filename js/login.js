// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerModal = document.getElementById('register-modal');
    const registerLink = document.getElementById('register-link');
    const closeRegisterModal = document.getElementById('close-register-modal');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Show/Hide loading states
    function showLoading(type) {
        if (type === 'login') {
            document.getElementById('login-text').classList.add('hidden');
            document.getElementById('login-loading').classList.remove('hidden');
        } else if (type === 'register') {
            document.getElementById('register-text').classList.add('hidden');
            document.getElementById('register-loading').classList.remove('hidden');
        }
    }

    function hideLoading(type) {
        if (type === 'login') {
            document.getElementById('login-text').classList.remove('hidden');
            document.getElementById('login-loading').classList.add('hidden');
        } else if (type === 'register') {
            document.getElementById('register-text').classList.remove('hidden');
            document.getElementById('register-loading').classList.add('hidden');
        }
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    // Show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    // Hide messages
    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();
        showLoading('login');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const result = await authManager.signIn(email, password);
            
            if (result.success) {
                showSuccess('تم تسجيل الدخول بنجاح');
                // Redirect will be handled by auth state change
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('حدث خطأ غير متوقع');
        } finally {
            hideLoading('login');
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();
        showLoading('register');

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('كلمات المرور غير متطابقة');
            hideLoading('register');
            return;
        }

        try {
            const result = await authManager.signUp(email, password, name);
            
            if (result.success) {
                showSuccess('تم إنشاء الحساب بنجاح');
                registerModal.classList.remove('show');
                registerForm.reset();
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('حدث خطأ غير متوقع');
        } finally {
            hideLoading('register');
        }
    });

    // Show register modal
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.classList.add('show');
        hideMessages();
    });

    // Close register modal
    closeRegisterModal.addEventListener('click', function() {
        registerModal.classList.remove('show');
        registerForm.reset();
        hideMessages();
    });

    // Close modal when clicking outside
    registerModal.addEventListener('click', function(e) {
        if (e.target === registerModal) {
            registerModal.classList.remove('show');
            registerForm.reset();
            hideMessages();
        }
    });

    // Forgot password functionality
    document.querySelector('.forgot-password').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        if (!email) {
            showError('يرجى إدخال البريد الإلكتروني أولاً');
            return;
        }

        try {
            const result = await authManager.resetPassword(email);
            if (result.success) {
                showSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('حدث خطأ غير متوقع');
        }
    });

    // Clear messages when typing
    document.getElementById('email').addEventListener('input', hideMessages);
    document.getElementById('password').addEventListener('input', hideMessages);
});

