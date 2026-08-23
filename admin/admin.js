import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ⚠️ نفس مفاتيح المشروع الرئيسي
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE", // استبدلها
    authDomain: "entersoft-af465.firebaseapp.com",
    projectId: "entersoft-af465",
    storageBucket: "entersoft-af465.appspot.com",
    messagingSenderId: "853322224437",
    appId: "YOUR_APP_ID_HERE" // استبدلها
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// عناصر الواجهة
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('admin-dashboard');

// 1. التحقق من حالة الدخول والصلاحيات
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // التحقق مما إذا كان المستخدم يحمل دور "admin" في Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            loginScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            loadDashboardData();
        } else {
            alert("هذا الحساب لا يملك صلاحيات إدارية.");
            signOut(auth);
        }
    } else {
        loginScreen.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
});

window.loginAdmin = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Error:", error);
        alert("فشل تسجيل الدخول.");
    }
};

window.logout = () => signOut(auth);

// 2. تحميل بيانات لوحة التحكم
async function loadDashboardData() {
    try {
        // جلب الطلبات
        const ordersSnap = await getDocs(collection(db, "orders"));
        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        document.getElementById('stat-orders').textContent = orders.length;
        
        let totalRevenue = 0;
        const ordersBody = document.getElementById('orders-table-body');
        ordersBody.innerHTML = '';
        
        orders.forEach(order => {
            totalRevenue += order.totalAmount || 0;
            const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد';
            const itemsList = order.items.map(i => i.name).join('، ');
            
            ordersBody.innerHTML += `
                <tr>
                    <td>#${order.id.substring(0, 5)}</td>
                    <td>${order.userId || 'زائر'}</td>
                    <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemsList}</td>
                    <td>${order.totalAmount?.toLocaleString() || 0} ج.م</td>
                    <td><span class="status-badge status-pending">قيد المراجعة</span></td>
                    <td>${date}</td>
                </tr>
            `;
        });
        document.getElementById('stat-revenue').textContent = totalRevenue.toLocaleString() + ' ج.م';

        // جلب المستخدمين
        const usersSnap = await getDocs(collection(db, "users"));
        document.getElementById('stat-users').textContent = usersSnap.size;
        
        const usersBody = document.getElementById('users-table-body');
        usersBody.innerHTML = '';
        usersSnap.forEach(userDoc => {
            const u = userDoc.data();
            const date = u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد';
            usersBody.innerHTML += `
                <tr>
                    <td>${u.fullName || 'غير مكتمل'}</td>
                    <td>${u.email || '-'}</td>
                    <td>${u.phoneNumber || '-'}</td>
                    <td>${u.jobTitle || '-'}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        // جلب التتبع (آخر 50 سجل)
        const trackingQuery = query(collection(db, "tracking"), orderBy("timestamp", "desc"), limit(50));
        const trackingSnap = await getDocs(trackingQuery);
        
        const trackingBody = document.getElementById('tracking-table-body');
        trackingBody.innerHTML = '';
        trackingSnap.forEach(doc => {
            const t = doc.data();
            const time = t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleString('ar-EG') : 'الآن';
            trackingBody.innerHTML += `
                <tr>
                    <td>${t.userId || 'زائر مجهول'}</td>
                    <td>${t.pageName || t.event || '-'}</td>
                    <td>${t.durationSeconds ? t.durationSeconds + ' ثانية' : (t.element_text || '-')}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error loading dashboard:", error);
        // إذا كان الخطأ بسبب قواعد الأمان، تأكد من تعديلها في Firebase
    }
}

// 3. التبديل بين التبويبات
window.showTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    event.target.classList.add('active');
};