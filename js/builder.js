// حالة الباني الحالية
const builderState = {
    legalEntity: null,
    virtualOffice: null,
    addons: []
};

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // تعيين القيم الافتراضية بناءً على الـ HTML (checked)
    updateStateFromDOM();
    renderSummary();
    
    // إضافة مستمعي الأحداث لجميع المدخلات
    document.querySelectorAll('input[name="legal_entity"], input[name="virtual_office"], input[name="addons"]').forEach(input => {
        input.addEventListener('change', () => {
            updateStateFromDOM();
            renderSummary();
        });
    });
});

// تحديث الحالة من عناصر DOM
function updateStateFromDOM() {
    // الكيان القانوني (Radio)
    const selectedLegal = document.querySelector('input[name="legal_entity"]:checked');
    builderState.legalEntity = selectedLegal ? {
        name: selectedLegal.dataset.name,
        price: parseInt(selectedLegal.dataset.price)
    } : null;

    // المكتب الافتراضي (Radio)
    const selectedOffice = document.querySelector('input[name="virtual_office"]:checked');
    builderState.virtualOffice = selectedOffice ? {
        name: selectedOffice.dataset.name,
        price: parseInt(selectedOffice.dataset.price)
    } : null;

    // الإضافات (Checkboxes)
    builderState.addons = [];
    document.querySelectorAll('input[name="addons"]:checked').forEach(checkbox => {
        builderState.addons.push({
            name: checkbox.dataset.name,
            price: parseInt(checkbox.dataset.price)
        });
    });
}

// عرض الملخص وتحديث السعر الإجمالي
function renderSummary() {
    const summaryContainer = document.getElementById('summary-items');
    const totalElement = document.getElementById('summary-total');
    
    let html = '';
    let total = 0;

    if (builderState.legalEntity) {
        html += createSummaryItemHTML(builderState.legalEntity);
        total += builderState.legalEntity.price;
    }
    
    if (builderState.virtualOffice) {
        html += createSummaryItemHTML(builderState.virtualOffice);
        total += builderState.virtualOffice.price;
    }
    
    builderState.addons.forEach(addon => {
        html += createSummaryItemHTML(addon);
        total += addon.price;
    });

    if (html === '') {
        html = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">لم يتم اختيار أي خدمات بعد.</p>';
    }

    summaryContainer.innerHTML = html;
    totalElement.textContent = total.toLocaleString() + ' ج.م';
}

function createSummaryItemHTML(item) {
    return `
        <div class="summary-item">
            <span class="summary-item-name">${item.name}</span>
            <span class="summary-item-price">${item.price.toLocaleString()} ج.م</span>
        </div>
    `;
}

// التنقل بين الخطوات
window.nextStep = (stepNumber) => {
    // إخفاء جميع الخطوات
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
    
    // إظهار الخطوة المطلوبة
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // تحديث شريط التقدم
    for (let i = 1; i <= stepNumber; i++) {
        document.querySelector(`.progress-step[data-step="${i}"]`).classList.add('active');
    }
    
    // التمرير لأعلى النموذج بسلاسة
    document.querySelector('.builder-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.prevStep = (stepNumber) => {
    window.nextStep(stepNumber); // نفس المنطق تماماً
};

// إضافة التكوين النهائي للسلة
window.addConfigurationToCart = () => {
    if (!builderState.legalEntity && !builderState.virtualOffice && builderState.addons.length === 0) {
        alert("يرجى اختيار خدمة واحدة على الأقل.");
        return;
    }

    // إنشاء معرف فريد لهذه الحزمة المخصصة
    const packageId = 'custom_' + Date.now();
    const packageName = "باقة مخصصة (ENTERSOFT)";
    
    // حساب السعر الإجمالي
    const totalPrice = (builderState.legalEntity?.price || 0) + 
                       (builderState.virtualOffice?.price || 0) + 
                       builderState.addons.reduce((sum, item) => sum + item.price, 0);

    // تجميع التفاصيل في ملاحظة واحدة داخل السلة
    const details = [
        builderState.legalEntity?.name,
        builderState.virtualOffice?.name,
        ...builderState.addons.map(a => a.name)
    ].filter(Boolean).join(' + ');

    // استدعاء الدالة العامة من core.js
    if (typeof window.addToCart === 'function') {
        window.addToCart(packageId, `${packageName}: ${details}`, totalPrice);
        
        // إعادة تعيين النموذج أو توجيه المستخدم
        alert("تمت إضافة باقتك المخصصة إلى السلة بنجاح!");
        window.nextStep(1); // العودة للبداية
    } else {
        console.error("core.js لم يتم تحميله بشكل صحيح.");
    }
};