// ============================================================
// Secure Bank Account Management System
// Core Application Logic (app.js)
// Technology: JavaScript + Firebase (Auth + Firestore)
// ============================================================

// ==========================================
// UTILITY MODULE
// ==========================================
const Utils = {
    generateAccountNumber() {
        const timestamp = Date.now().toString().slice(-10);
        return 'ACC' + timestamp.padStart(10, '0');
    },

    formatCurrency(amount) {
        return '₹' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatDate(date) {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    formatDateShort(date) {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    },

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.innerHTML = `
            <i class="fas ${icons[type]} notif-icon"></i>
            <div class="notif-content">
                <div class="notif-title">${title}</div>
                <div class="notif-message">${message}</div>
            </div>
            <button class="notif-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notif);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notif.parentElement) {
                notif.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => notif.remove(), 400);
            }
        }, 5000);
    },

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('active');
    },

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
    },

    // Show confirmation modal and return a Promise
    showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirmModal');
            if (!overlay) { resolve(false); return; }
            
            overlay.querySelector('.modal-header h3').textContent = title;
            overlay.querySelector('.modal-body').innerHTML = message;
            overlay.classList.add('active');

            const confirmBtn = overlay.querySelector('.btn-confirm');
            const cancelBtn = overlay.querySelector('.btn-cancel');
            const closeBtn = overlay.querySelector('.modal-close');

            const cleanup = (result) => {
                overlay.classList.remove('active');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
                resolve(result);
            };

            const onConfirm = () => cleanup(true);
            const onCancel = () => cleanup(false);

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
        });
    }
};

// ==========================================
// AUDIT LOG MODULE
// ==========================================
const AuditLog = {
    async log(customerId, email, action, details) {
        try {
            await db.collection('audit_logs').add({
                customerId: customerId || 'unknown',
                email: email || 'unknown',
                action: action,
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('Audit log error:', err);
        }
    },

    async getAll() {
        const snapshot = await db.collection('audit_logs').get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return results.sort((a, b) => {
            const dateA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date(0);
            const dateB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date(0);
            return dateB - dateA;
        });
    },

    async getByCustomer(customerId) {
        const snapshot = await db.collection('audit_logs')
            .where('customerId', '==', customerId)
            .get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return results.sort((a, b) => {
            const dateA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date(0);
            const dateB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date(0);
            return dateB - dateA;
        });
    }
};

// ==========================================
// AUTH MODULE
// ==========================================
const Auth = {
    async register(name, email, phone, password) {
        // Create Firebase Auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Determine role: admin@securebank.com gets admin role
        const role = email.toLowerCase() === 'admin@securebank.com' || email.toLowerCase() === 'kushwahkalpna82@gmail.com' ? 'admin' : 'customer';

        // Create customer document in Firestore
        await db.collection('customers').doc(uid).set({
            name: name,
            email: email,
            phone: phone,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Auto-create a savings account for the customer
        const accountNumber = Utils.generateAccountNumber();
        await db.collection('accounts').add({
            customerId: uid,
            accountNumber: accountNumber,
            accountType: 'Savings',
            balance: 0,
            status: 'Active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Log the registration
        await AuditLog.log(uid, email, 'REGISTER', 'New account created: ' + accountNumber);

        // Sign out after registration (user must login)
        await auth.signOut();

        return { uid, accountNumber, role };
    },

    async login(email, password) {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Get customer data
        const customerDoc = await db.collection('customers').doc(uid).get();
        if (!customerDoc.exists) {
            throw new Error('Customer record not found');
        }

        const customer = customerDoc.data();

        // Auto-upgrade to admin if email matches admin list
        const adminEmails = ['admin@securebank.com', 'kushwahkalpna82@gmail.com'];
        if (adminEmails.includes(email.toLowerCase()) && customer.role !== 'admin') {
            await db.collection('customers').doc(uid).update({ role: 'admin' });
            customer.role = 'admin';
        }

        // Store user info in sessionStorage (for page-level access)
        sessionStorage.setItem('userId', uid);
        sessionStorage.setItem('userName', customer.name);
        sessionStorage.setItem('userEmail', customer.email);
        sessionStorage.setItem('userRole', customer.role);
        sessionStorage.setItem('mfaVerified', 'false');

        // Log login attempt
        await AuditLog.log(uid, email, 'LOGIN_ATTEMPT', 'Credentials verified, MFA pending');

        return { uid, ...customer };
    },

    async logout() {
        const uid = sessionStorage.getItem('userId');
        const email = sessionStorage.getItem('userEmail');
        
        if (uid) {
            await AuditLog.log(uid, email, 'LOGOUT', 'User session terminated');
        }

        await auth.signOut();
        sessionStorage.clear();
        window.location.href = 'index.html';
    },

    getCurrentUser() {
        const uid = sessionStorage.getItem('userId');
        if (!uid || sessionStorage.getItem('mfaVerified') !== 'true') return null;
        return {
            uid: uid,
            name: sessionStorage.getItem('userName'),
            email: sessionStorage.getItem('userEmail'),
            role: sessionStorage.getItem('userRole')
        };
    },

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    },

    requireAdmin() {
        const user = this.requireAuth();
        if (user && user.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return null;
        }
        return user;
    },

    isAdmin() {
        return sessionStorage.getItem('userRole') === 'admin';
    }
};

// ==========================================
// MFA MODULE (OTP-based)
// ==========================================
const MFA = {
    generateOTP() {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem('mfaOTP', otp);
        sessionStorage.setItem('mfaTimestamp', Date.now().toString());
        return otp;
    },

    // Send OTP to user's email via EmailJS
    async sendOTPEmail(toEmail, toName, otp) {
        try {
            const response = await emailjs.send(
                emailjsConfig.serviceId,
                emailjsConfig.templateId,
                {
                    to_email: toEmail,
                    to_name: toName,
                    otp_code: otp,
                    message: `Your One-Time Password (OTP) for Secure Bank login is: ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`
                },
                emailjsConfig.publicKey
            );
            console.log('✅ OTP email sent:', response.status);
            return true;
        } catch (err) {
            console.error('❌ Failed to send OTP email:', err);
            return false;
        }
    },

    verifyOTP(inputOTP) {
        const storedOTP = sessionStorage.getItem('mfaOTP');
        const timestamp = parseInt(sessionStorage.getItem('mfaTimestamp') || '0');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Check expiry
        if (now - timestamp > fiveMinutes) {
            this.clearOTP();
            return { success: false, message: 'OTP has expired. Please login again.' };
        }

        // Check OTP match
        if (inputOTP === storedOTP) {
            this.clearOTP();
            sessionStorage.setItem('mfaVerified', 'true');
            return { success: true, message: 'OTP verified successfully!' };
        }

        return { success: false, message: 'Invalid OTP. Please try again.' };
    },

    clearOTP() {
        sessionStorage.removeItem('mfaOTP');
        sessionStorage.removeItem('mfaTimestamp');
    },

    getTimeRemaining() {
        const timestamp = parseInt(sessionStorage.getItem('mfaTimestamp') || '0');
        const elapsed = Date.now() - timestamp;
        const remaining = Math.max(0, 300 - Math.floor(elapsed / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// ==========================================
// ACCOUNT OPERATIONS MODULE
// ==========================================
const AccountOps = {
    async getByCustomer(customerId) {
        const snapshot = await db.collection('accounts')
            .where('customerId', '==', customerId)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async getByAccountNumber(accountNumber) {
        const snapshot = await db.collection('accounts')
            .where('accountNumber', '==', accountNumber)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async getById(accountId) {
        const doc = await db.collection('accounts').doc(accountId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async deposit(accountId, amount, description = '') {
        const account = await this.getById(accountId);
        if (!account) throw new Error('Account not found');

        const newBalance = account.balance + amount;

        // Update balance
        await db.collection('accounts').doc(accountId).update({
            balance: newBalance
        });

        // Create transaction record
        await TxnOps.create({
            accountId: accountId,
            type: 'Deposit',
            amount: amount,
            balanceAfter: newBalance,
            description: description || 'Cash Deposit',
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Completed'
        });

        // Audit log
        const user = Auth.getCurrentUser();
        await AuditLog.log(user.uid, user.email, 'DEPOSIT',
            `Deposited ${Utils.formatCurrency(amount)} | New Balance: ${Utils.formatCurrency(newBalance)}`);

        return newBalance;
    },

    async withdraw(accountId, amount, description = '') {
        const account = await this.getById(accountId);
        if (!account) throw new Error('Account not found');
        if (account.balance < amount) throw new Error('Insufficient balance');

        const newBalance = account.balance - amount;

        // Update balance
        await db.collection('accounts').doc(accountId).update({
            balance: newBalance
        });

        // Create transaction record
        await TxnOps.create({
            accountId: accountId,
            type: 'Withdrawal',
            amount: amount,
            balanceAfter: newBalance,
            description: description || 'Cash Withdrawal',
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Completed'
        });

        // Audit log
        const user = Auth.getCurrentUser();
        await AuditLog.log(user.uid, user.email, 'WITHDRAWAL',
            `Withdrew ${Utils.formatCurrency(amount)} | New Balance: ${Utils.formatCurrency(newBalance)}`);

        return newBalance;
    },

    async transfer(fromAccountId, toAccountNumber, amount, description = '') {
        const fromAccount = await this.getById(fromAccountId);
        if (!fromAccount) throw new Error('Sender account not found');

        const toAccount = await this.getByAccountNumber(toAccountNumber);
        if (!toAccount) throw new Error('Recipient account not found');

        if (fromAccount.id === toAccount.id) throw new Error('Cannot transfer to your own account');
        if (fromAccount.balance < amount) throw new Error('Insufficient balance');

        const fromNewBalance = fromAccount.balance - amount;
        const toNewBalance = toAccount.balance + amount;

        // Get recipient customer name
        const recipientDoc = await db.collection('customers').doc(toAccount.customerId).get();
        const recipientName = recipientDoc.exists ? recipientDoc.data().name : 'Unknown';

        // Update sender balance
        await db.collection('accounts').doc(fromAccountId).update({
            balance: fromNewBalance
        });

        // Update recipient balance
        await db.collection('accounts').doc(toAccount.id).update({
            balance: toNewBalance
        });

        // Create sender transaction
        await TxnOps.create({
            accountId: fromAccountId,
            type: 'Transfer',
            amount: amount,
            balanceAfter: fromNewBalance,
            description: description || `Transfer to ${recipientName} (${toAccountNumber})`,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Completed'
        });

        // Create recipient transaction
        await TxnOps.create({
            accountId: toAccount.id,
            type: 'Deposit',
            amount: amount,
            balanceAfter: toNewBalance,
            description: `Transfer received from ${Auth.getCurrentUser().name}`,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Completed'
        });

        // Audit log
        const user = Auth.getCurrentUser();
        await AuditLog.log(user.uid, user.email, 'TRANSFER',
            `Transferred ${Utils.formatCurrency(amount)} to ${recipientName} (${toAccountNumber})`);

        return { fromNewBalance, recipientName };
    },

    async getAll() {
        const snapshot = await db.collection('accounts').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// ==========================================
// TRANSACTION OPERATIONS MODULE
// ==========================================
const TxnOps = {
    async create(txnData) {
        await db.collection('transactions').add(txnData);
    },

    async getByAccount(accountId) {
        const snapshot = await db.collection('transactions')
            .where('accountId', '==', accountId)
            .get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return results.sort((a, b) => {
            const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
            const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
            return dateB - dateA;
        });
    },

    async getAll() {
        const snapshot = await db.collection('transactions').get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return results.sort((a, b) => {
            const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
            const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
            return dateB - dateA;
        });
    }
};

// ==========================================
// CUSTOMER OPERATIONS MODULE
// ==========================================
const CustomerOps = {
    async getById(customerId) {
        const doc = await db.collection('customers').doc(customerId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async getByEmail(email) {
        const snapshot = await db.collection('customers')
            .where('email', '==', email)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async getAll() {
        const snapshot = await db.collection('customers').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// ==========================================
// UI HELPER MODULE
// ==========================================
const UI = {
    initSidebar(activePage) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Set user info
        const avatarEl = document.getElementById('sidebarAvatar');
        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');

        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Customer';

        // Set active nav item
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            if (link.dataset.page === activePage) {
                link.classList.add('active');
            }
        });

        // Show admin nav if admin
        if (user.role === 'admin') {
            document.querySelectorAll('.admin-nav-item').forEach(el => {
                el.classList.add('visible');
            });
        }

        // Mobile menu toggle
        const menuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }
    },

    getTransactionBadge(type) {
        const badges = {
            'Deposit': '<span class="badge badge-deposit"><i class="fas fa-arrow-down"></i> Deposit</span>',
            'Withdrawal': '<span class="badge badge-withdrawal"><i class="fas fa-arrow-up"></i> Withdrawal</span>',
            'Transfer': '<span class="badge badge-transfer"><i class="fas fa-exchange-alt"></i> Transfer</span>'
        };
        return badges[type] || `<span class="badge">${type}</span>`;
    },

    getAuditBadge(action) {
        const badges = {
            'REGISTER': 'badge-register',
            'LOGIN_ATTEMPT': 'badge-login',
            'MFA_VERIFY': 'badge-mfa',
            'LOGIN': 'badge-login',
            'DEPOSIT': 'badge-deposit',
            'WITHDRAWAL': 'badge-withdrawal',
            'TRANSFER': 'badge-transfer',
            'ADMIN_ACCESS': 'badge-admin',
            'LOGOUT': 'badge-logout'
        };
        return badges[action] || '';
    }
};

console.log("✅ App modules loaded successfully");
