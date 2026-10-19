
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
    savedRows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (!Array.isArray(savedRows)) {
      savedRows = [];
    }
  } catch (error) {
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
  return items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);
}

/* =========================
   صفوف جدول التقرير
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
   بناء التقرير
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
    'line-height:1.7'
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

  report.querySelectorAll('td, th').forEach(cell => {
    cell.style.border = '1px solid #999';
    cell.style.padding = '10px';
    cell.style.textAlign = 'right';
    cell.style.verticalAlign = 'top';
    cell.style.overflowWrap = 'anywhere';
  });

  return report;
}

/* =========================
   إنشاء ملف PDF
========================= */


async function generateOrdersPdf(items) {
  if (typeof html2pdf !== 'function') {
    throw new Error('مكتبة PDF غير محملة.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('لا توجد طلبات لإنشاء التقرير.');
  }

  const report = createReportElement(items);

  // وضع التقرير داخل الصفحة بدون إخفائه أو وضعه خلف العناصر.
  Object.assign(report.style, {
    position: 'relative',
    left: 'auto',
    top: 'auto',
    zIndex: 'auto',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    width: '720px',
    minHeight: '100px',
    margin: '0',
    background: '#ffffff',
    color: '#222222',
    pointerEvents: 'auto'
  });

  // حاوية مؤقتة خارج مساحة العرض، لكنها قابلة للتصوير.
  const holder = document.createElement('div');
  Object.assign(holder.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '740px',
    background: '#ffffff',
    overflow: 'visible',
    zIndex: '-1'
  });

  holder.appendChild(report);
  document.body.appendChild(holder);

  try {
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const canvas = await html2canvas(report, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: true,
      useCORS: true,
      width: report.scrollWidth,
      height: report.scrollHeight,
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('فشل تصوير التقرير.');
    }

    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(
      0, 0,
      Math.min(canvas.width, 20),
      Math.min(canvas.height, 20)
    ).data;

    if (!pixels || pixels.length === 0) {
      throw new Error('تعذر قراءة صورة التقرير.');
    }

    const { jsPDF } = window.jspdf || {};

    if (typeof jsPDF !== 'function') {
      throw new Error('مكتبة jsPDF غير متاحة.');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const image = canvas.toDataURL('image/jpeg', 0.98);
    const pageWidth = 190;
    const pageHeight = canvas.height * pageWidth / canvas.width;
    const printableHeight = 277;

    let remaining = pageHeight;
    let position = 10;

    pdf.addImage(
      image, 'JPEG',
      10, position,
      pageWidth, pageHeight
    );

    remaining -= printableHeight;

    while (remaining > 0) {
      pdf.addPage();
      position = 10 - (pageHeight - remaining);
      pdf.addImage(
        image, 'JPEG',
        10, position,
        pageWidth, pageHeight
      );
      remaining -= printableHeight;
    }

    const blob = pdf.output('blob');

    if (!blob || blob.size < 1000) {
      throw new Error('ملف PDF الناتج فارغ أو صغير بشكل غير متوقع.');
    }

    return blob;
  } finally {
    holder.remove();
  }
}

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
   تنزيل ملف PDF
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

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}

/* =========================
   تشغيل أزرار PDF والمشاركة
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
    console.error('خطأ PDF:', error);

    alert(
      'تعذر إنشاء ملف PDF. حدّثي الصفحة وحاولي مرة أخرى، وإذا استمرت المشكلة راجعي Console.'
    );
  } finally {
    button.disabled = false;
    button.dataset.busy = 'false';
    button.textContent = originalText;
  }
}

/* =========================
   زر إنشاء وطباعة PDF
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
            if (error.name === 'AbortError') {
              return;
            }

            console.warn('تعذرت المشاركة المباشرة:', error);
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
   زر مسح الطلبات
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
      console.error('تعذر مسح القائمة:', error);
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
   تشغيل الصفحة
========================= */

if (itemsBox) {
  loadItems();
} else {
  console.error('لم يتم العثور على العنصر #items.');
}
