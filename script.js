
const itemsBox = document.getElementById('items');
const STORAGE_KEY = 'household-orders';

/* =========================
   إنشاء صفوف الطلبات
========================= */

function addRow() {
  if (!itemsBox) return;

  const row = document.createElement('div');
  row.className = 'row';

  row.innerHTML =
    '<span class="number"></span>' +
    '<input class="item-name" type="text" placeholder="اكتبي الطلب هنا">' +
    '<input class="item-quantity" type="number" min="0" step="1" placeholder="الكمية">' +
    '<input class="item-price" type="number" min="0" step="0.01" placeholder="سعر الوحدة">';

  itemsBox.appendChild(row);
  renumber();

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      ensureLastRow();
      saveItems();
    });
  });
}

function renumber() {
  if (!itemsBox) return;

  [...itemsBox.querySelectorAll('.row')].forEach((row, index) => {
    const number = row.querySelector('.number');
    if (number) number.textContent = index + 1;
  });
}

function ensureLastRow() {
  if (!itemsBox) return;

  const rows = [...itemsBox.querySelectorAll('.row')];
  const last = rows[rows.length - 1];

  if (!last) return;

  const name = last.querySelector('.item-name').value.trim();
  const quantity = last.querySelector('.item-quantity').value.trim();
  const price = last.querySelector('.item-price').value.trim();

  if (name || quantity || price) {
    addRow();
  }
}

/* =========================
   حفظ الطلبات
========================= */

function saveItems() {
  if (!itemsBox) return;

  const savedRows = [...itemsBox.querySelectorAll('.row')]
    .map(row => ({
      name: row.querySelector('.item-name').value,
      quantity: row.querySelector('.item-quantity').value,
      price: row.querySelector('.item-price').value
    }))
    .filter(item =>
      item.name.trim() ||
      item.quantity.trim() ||
      item.price.trim()
    );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRows));
  } catch (error) {
    console.error('تعذر حفظ القائمة:', error);
  }
}

/* =========================
   تحميل الطلبات المحفوظة
========================= */

function loadItems() {
  if (!itemsBox) return;

  let savedRows = [];

  try {
    savedRows = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    if (!Array.isArray(savedRows)) {
      savedRows = [];
    }
  } catch (error) {
    console.error('تعذر قراءة الطلبات المحفوظة:', error);
    savedRows = [];
  }

  if (savedRows.length > 0) {
    savedRows.forEach(item => {
      addRow();

      const row = itemsBox.lastElementChild;

      row.querySelector('.item-name').value = item.name || '';
      row.querySelector('.item-quantity').value = item.quantity || '';
      row.querySelector('.item-price').value = item.price || '';
    });

    addRow();

    while (itemsBox.querySelectorAll('.row').length < 5) {
      addRow();
    }
  } else {
    for (let i = 0; i < 5; i++) {
      addRow();
    }
  }

  renumber();
}

/* =========================
   تجهيز بيانات القائمة
========================= */

function getItems() {
  if (!itemsBox) return [];

  return [...itemsBox.querySelectorAll('.row')]
    .map(row => {
      const quantityText =
        row.querySelector('.item-quantity').value.trim();

      const priceText =
        row.querySelector('.item-price').value.trim();

      return {
        name: row.querySelector('.item-name').value.trim(),
        quantity: quantityText === '' ? 1 : Number(quantityText),
        quantityText,
        price: priceText === '' ? 0 : Number(priceText),
        priceText
      };
    })
    .filter(item =>
      item.name || item.quantityText || item.priceText
    );
}

/* =========================
   حماية النصوص داخل HTML
========================= */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

/* =========================
   حساب الإجمالي
========================= */

function calculateTotal(items) {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
}

/* =========================
   إنشاء صفوف جدول التقرير
========================= */

function makeTableRows(items) {
  return items.map((item, index) => {
    const itemTotal = item.quantity * item.price;

    return (
      '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + (item.name ? escapeHtml(item.name) : '—') + '</td>' +
        '<td>' + (item.quantityText ? item.quantity : '—') + '</td>' +
        '<td>' + (item.priceText ? item.price.toFixed(2) : '—') + '</td>' +
        '<td>' + (item.priceText ? itemTotal.toFixed(2) : '—') + '</td>' +
      '</tr>'
    );
  }).join('');
}

/* =========================
   بناء تقرير PDF
========================= */

function createReportElement(items) {
  const total = calculateTotal(items);
  const report = document.createElement('div');

  report.dir = 'rtl';
  report.lang = 'ar';

  report.style.cssText = [
    'box-sizing:border-box',
    'width:720px',
    'padding:24px',
    'background:#ffffff',
    'color:#222222',
    'font-family:Tahoma,Arial,sans-serif',
    'direction:rtl',
    'display:block',
    'visibility:visible',
    'opacity:1',
    'line-height:1.7',
    'margin:0'
  ].join(';');

  report.innerHTML =
    '<h1 style="text-align:center;color:#e76f51;font-size:26px;margin:0 0 20px">' +
      'قائمة طلبات البيت' +
    '</h1>' +

    '<p style="margin:20px 0;color:#333">' +
      'التاريخ: ' +
      escapeHtml(new Date().toLocaleDateString('ar-EG')) +
    '</p>' +

    '<table style="width:100%;border-collapse:collapse;table-layout:fixed;color:#222;font-size:13px">' +
      '<thead><tr>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2;width:8%">رقم</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2;width:34%">الطلب</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2;width:15%">الكمية</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2;width:20%">سعر الوحدة</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2;width:23%">إجمالي الطلب</th>' +
      '</tr></thead>' +
      '<tbody>' + makeTableRows(items) + '</tbody>' +
    '</table>' +

    '<div style="margin-top:20px;padding:14px;border:1px solid #999;font-size:19px;font-weight:bold;color:#222">' +
      'الإجمالي الكلي: ' + total.toFixed(2) + ' جنيه' +
    '</div>';

  return report;
}

/* =========================
   إنشاء PDF بالطريقة الصحيحة
========================= */

async function generateOrdersPdf(items) {
  if (typeof window.html2pdf !== 'function') {
    throw new Error(
      'مكتبة PDF غير محملة. تأكد من تحميل html2pdf.bundle.min.js قبل script.js.'
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('لا توجد طلبات لإنشاء التقرير.');
  }

  const report = createReportElement(items);

  // نضع التقرير في مساحة مرئية حتى تستطيع المكتبة تصويره.
  // تتم إزالة التقرير بعد انتهاء التصدير.
  Object.assign(report.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '2147483647',
    width: '720px',
    maxWidth: 'none',
    height: 'auto',
    overflow: 'visible',
    pointerEvents: 'none'
  });

  document.body.appendChild(report);

  try {
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const worker = window.html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: 'طلبات-البيت.pdf',

        image: {
          type: 'jpeg',
          quality: 0.98
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794
        },

        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },

        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['tr']
        }
      })
      .from(report)
      .toPdf();

    const pdf = await worker.get('pdf');
    const blob = pdf.output('blob');

    if (!blob || blob.size < 1000) {
      throw new Error('ملف PDF فارغ أو لم يتم إنشاؤه بصورة صحيحة.');
    }

    return blob;
  } finally {
    report.remove();
  }
}

/* =========================
   تنزيل PDF
========================= */

function downloadPdfBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'طلبات-البيت.pdf';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* =========================
   تشغيل إجراءات PDF
========================= */

async function runPdfAction(button, action, loadingText) {
  if (!button || button.dataset.busy === 'true') return;

  const items = getItems();

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل.');
    return;
  }

  const originalText = button.textContent;

  button.dataset.busy = 'true';
  button.disabled = true;
  button.textContent = loadingText;

  try {
    const blob = await generateOrdersPdf(items);
    await action(blob);
  } catch (error) {
    console.error('خطأ إنشاء PDF:', error);

    alert(
      'تعذر إنشاء PDF. افتح Console باستخدام F12 وأرسل لي الخطأ الأحمر.'
    );
  } finally {
    button.disabled = false;
    button.dataset.busy = 'false';
    button.textContent = originalText;
  }
}

/* =========================
   زر إنشاء PDF
========================= */

const createButton = document.getElementById('createButton');

if (createButton) {
  createButton.addEventListener('click', () => {
    runPdfAction(
      createButton,
      async blob => {
        downloadPdfBlob(blob);
      },
      'جارٍ إنشاء PDF...'
    );
  });
}

/* =========================
   زر المشاركة
========================= */

const shareButton = document.getElementById('shareButton');

if (shareButton) {
  shareButton.addEventListener('click', () => {
    runPdfAction(
      shareButton,
      async blob => {
        const file = new File(
          [blob],
          'طلبات-البيت.pdf',
          { type: 'application/pdf' }
        );

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: 'قائمة طلبات البيت',
              text: 'قائمة طلبات البيت كاملة بصيغة PDF'
            });

            return;
          } catch (error) {
            if (error.name === 'AbortError') return;

            console.warn('تعذرت المشاركة المباشرة:', error);
          }
        }

        downloadPdfBlob(blob);

        alert(
          'تم تنزيل ملف PDF. افتح واتساب وأرفق الملف من مجلد التنزيلات.'
        );
      },
      'جارٍ تجهيز PDF...'
    );
  });
}

/* =========================
   زر مسح الطلبات
========================= */

const clearButton =
  document.getElementById('clearButton') ||
  document.getElementById('clearAllButton');

if (clearButton) {
  clearButton.addEventListener('click', () => {
    if (!confirm('هل تريد مسح كل الطلبات المحفوظة؟')) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('تعذر مسح القائمة:', error);
    }

    if (itemsBox) {
      itemsBox.innerHTML = '';

      for (let i = 0; i < 5; i++) {
        addRow();
      }

      saveItems();
      renumber();
    }
  });
}

/* =========================
   تشغيل الصفحة
========================= */

if (itemsBox) {
  loadItems();
} else {
  console.error('لم يتم العثور على العنصر #items.');
}
