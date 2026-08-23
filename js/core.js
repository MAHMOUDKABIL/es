// استيراد مكتبات Firebase (Modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ⚠️ هام: استبدل هذه القيم ببيانات مشروعك من Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "entersoft-af465.firebaseapp.com",
    projectId: "entersoft-af465",
    storageBucket: "entersoft-af465.appspot.com",
    messagingSenderId: "853322224437",
    appId: "YOUR_APP_ID_HERE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 1. إدارة الحالة العامة (Global State)
// ==========================================
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('entersoft_cart')) || [];

// ==========================================
// 2. التهيئة عند تحميل أي صفحة (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAnimations();
    setupNavigation();
    updateCartUI();
    trackPageView(); // بدء التتبع
    
    // مراقبة حالة المصادقة
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        updateAuthUI(user);
        if (user) {
            await checkProfileCompletion(user);
            await syncCartWithFirestore(user.uid);
        }
    });
});

// ==========================================
// 3. وظائف المصادقة (Authentication)
// ==========================================
async function updateAuthUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (user) {
        if(loginBtn) loginBtn.classList.add('hidden');
        if(userMenu) {
            userMenu.classList.remove('hidden');
            // جلب الاسم من Firestore أو من بيانات جوجل
            const userDoc = await getDoc(doc(db, "users", user.uid));
            userName.textContent = userDoc.exists() ? userDoc.data().fullName : user.email.split('@')[0];
        }
    } else {
        if(loginBtn) loginBtn.classList.remove('hidden');
        if(userMenu) userMenu.classList.add('hidden');
    }
}

window.loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Error:", error);
        alert("فشل تسجيل الدخول. تأكد من إعدادات Firebase.");
    }
};

window.logout = () => signOut(auth);

async function checkProfileCompletion(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // مستخدم جديد تماماً
        await setDoc(userRef, {
            uid: user.uid, email: user.email, fullName: user.displayName || "",
            phoneNumber: "", jobTitle: "", isProfileComplete: false,
            createdAt: serverTimestamp()
        });
        openModal('profile-modal');
    } else if (!userSnap.data().isProfileComplete) {
        // مستخدم موجود لكن بياناته ناقصة
        document.getElementById('modal-fullName').value = userSnap.data().fullName || "";
        document.getElementById('modal-phone').value = userSnap.data().phoneNumber || "";
        document.getElementById('modal-jobTitle').value = userSnap.data().jobTitle || "";
        openModal('profile-modal');
    }
}

window.saveProfile = async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const data = {
        fullName: document.getElementById('modal-fullName').value,
        phoneNumber: document.getElementById('modal-phone').value,
        jobTitle: document.getElementById('modal-jobTitle').value,
        isProfileComplete: true,
        updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", currentUser.uid), data);
    closeModal('profile-modal');
    updateAuthUI(currentUser); // تحديث الاسم في الواجهة
    alert("تم حفظ بياناتك بنجاح!");
};

// ==========================================
// 4. إدارة سلة المشتريات (Cart Management)
// ==========================================
window.addToCart = (id, name, price) => {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart();
    alert(`تمت إضافة "${name}" إلى السلة`);
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
};

function saveCart() {
    localStorage.setItem('entersoft_cart', JSON.stringify(cart));
    updateCartUI();
    if (currentUser) {
        syncCartWithFirestore(currentUser.uid);
    }
}

async function syncCartWithFirestore(uid) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await setDoc(doc(db, "carts", uid), {
        userId: uid, items: cart, totalAmount: total, updatedAt: serverTimestamp()
    }, { merge: true });
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // تحديث واجهة المودال إذا كان مفتوحاً
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-amount');
    if (container && totalEl) {
        if (cart.length === 0) {
            container.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-secondary);">السلة فارغة</p>';
            totalEl.textContent = '0';
        } else {
            let html = '';
            let total = 0;
            cart.forEach(item => {
                total += item.price * item.quantity;
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${item.price} ج.م × ${item.quantity}</div>
                        </div>
                        <button onclick="removeFromCart('${item.id}')" class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">حذف</button>
                    </div>
                `;
            });
            container.innerHTML = html;
            totalEl.textContent = total.toLocaleString();
        }
    }
}

window.checkout = async () => {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولاً لإتمام الطلب.");
        closeModal('cart-modal');
        window.loginWithGoogle();
        return;
    }
    if (cart.length === 0) return;

    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            items: cart,
            totalAmount: total,
            status: "pending_review",
            createdAt: serverTimestamp()
        });
        cart = [];
        saveCart();
        closeModal('cart-modal');
        alert("تم استلام طلبك بنجاح! سيتواصل معك فريقنا عبر واتساب قريباً.");
    } catch (error) {
        console.error("Checkout Error:", error);
        alert("حدث خطأ أثناء إرسال الطلب.");
    }
};

// ==========================================
// 5. أدوات مساعدة (Utilities)
// ==========================================
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    updateLogo(isDark);

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isNowDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
        updateLogo(isNowDark);
    });
}

function updateLogo(isDark) {
    const logoImg = document.querySelector('.logo img');
    if (logoImg) {
        // ملاحظة: قم بإنشاء هذين الملفين في مجلد assets/
        logoImg.src = isDark ? 'assets/logo-dark.svg' : 'assets/logo-light.svg';
        logoImg.alt = 'ENTERSOFT Logo';
    }
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
}

function setupNavigation() {
    // فتح وإغلاق المودال
    window.openModal = (id) => document.getElementById(id)?.classList.add('active');
    window.closeModal = (id) => document.getElementById(id)?.classList.remove('active');
    
    document.querySelectorAll('.close-modal, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el) el.classList.remove('active');
        });
    });

    document.getElementById('cart-btn')?.addEventListener('click', () => openModal('cart-modal'));
}

function trackPageView() {
    // هنا سيتم إضافة كود addDoc لإرسال بيانات التصفح إلى مجموعة 'tracking' في Firebase
    // مثال مبسط للتوضيح:
    console.log(`Tracking: User viewed ${window.location.pathname}`);
}