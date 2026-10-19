
const itemsBox = document.getElementById('items');
const STORAGE_KEY = 'household-orders';

/* =========================
   إدارة صفوف الطلبات
========================= */

function addRow() {
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
  [...itemsBox.querySelectorAll('.row')].forEach((row, index) => {
    row.querySelector('.number').textContent = index + 1;
  });
}

function ensureLastRow() {
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
   الحفظ والاسترجاع
========================= */

function saveItems() {
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
    console.error('تعذر حفظ القائمة على الجهاز:', error);
  }
}

function loadItems() {
  let savedRows = [];

  try {
    savedRows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (!Array.isArray(savedRows)) {
      savedRows = [];
    }
  } catch (error) {
    savedRows = [];
  }

  if (savedRows.length) {
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);
}

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
   إنشاء تقرير HTML للطباعة
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
    'opacity:1'
  ].join(';');

  report.innerHTML =
    '<h1 style="text-align:center;color:#e76f51;font-size:26px">' +
      'قائمة طلبات البيت' +
    '</h1>' +
    '<p style="margin:20px 0;color:#333">' +
      'التاريخ: ' +
      escapeHtml(new Date().toLocaleDateString('ar-EG')) +
    '</p>' +
    '<table style="width:100%;border-collapse:collapse;color:#222;font-size:13px">' +
      '<thead><tr>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2">رقم</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2">الطلب</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2">الكمية</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2">سعر الوحدة</th>' +
        '<th style="border:1px solid #999;padding:10px;background:#f2f2f2">إجمالي الطلب</th>' +
      '</tr></thead>' +
      '<tbody>' + makeTableRows(items) + '</tbody>' +
    '</table>' +
    '<div style="margin-top:20px;padding:14px;border:1px solid #999;font-size:19px;font-weight:bold;color:#222">' +
      'الإجمالي الكلي: ' + total.toFixed(2) + ' جنيه' +
    '</div>';

  report.querySelectorAll('td').forEach(cell => {
    cell.style.border = '1px solid #999';
    cell.style.padding = '10px';
    cell.style.textAlign = 'right';
    cell.style.verticalAlign = 'top';
    cell.style.overflowWrap = 'anywhere';
  });

  report.querySelectorAll('th').forEach(cell => {
    cell.style.textAlign = 'right';
    cell.style.verticalAlign = 'top';
    cell.style.overflowWrap = 'anywhere';
  });

  return report;
}

/* =========================
   إنشاء PDF
========================= */

async function generateOrdersPdf(items) {
  if (typeof html2pdf === 'undefined') {
    throw new Error(
      'مكتبة html2pdf غير محملة. راجع ملف HTML.'
    );
  }

  const report = createReportElement(items);

  Object.assign(report.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    zIndex: '9999',
    pointerEvents: 'none'
  });

  document.body.appendChild(report);

  try {
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const worker = html2pdf()
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
          logging: false,
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

    if (!blob || blob.size < 100) {
      throw new Error('ملف PDF فارغ.');
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

/* منع الضغط المتكرر على الأزرار */
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
    console.error('خطأ أثناء تجهيز PDF:', error);

    alert(
      'تعذر تجهيز ملف PDF. تأكدي من اتصال الإنترنت وتحميل مكتبة PDF، ثم حاولي مرة أخرى.'
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
   زر مشاركة PDF
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
            if (error.name === 'AbortError') {
              return;
            }

            console.warn(
              'تعذرت المشاركة المباشرة:',
              error
            );
          }
        }

        downloadPdfBlob(blob);

        alert(
          'تم تنزيل ملف PDF. افتحي واتساب وأرفقي الملف من مجلد التنزيلات.'
        );
      },
      'جارٍ تجهيز PDF...'
    );
  });
}

/* =========================
   مسح الطلبات
========================= */

const clearButton =
  document.getElementById('clearButton') ||
  document.getElementById('clearAllButton');

if (clearButton) {
  clearButton.addEventListener('click', () => {
    if (!confirm('هل تريدين مسح كل الطلبات المحفوظة؟')) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('تعذر مسح القائمة المحفوظة:', error);
    }

    itemsBox.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      addRow();
    }

    saveItems();
    renumber();
  });
}

/* =========================
   بدء تشغيل القائمة
========================= */

if (itemsBox) {
  loadItems();
} else {
  console.error('لم يتم العثور على العنصر #items في HTML.');
}
