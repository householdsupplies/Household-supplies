
const itemsBox = document.getElementById('items');
const STORAGE_KEY = 'household-orders';

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
    savedRows = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

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

/* إنشاء مستند HTML كامل للقائمة */
function createReportElement(items) {
  const total = calculateTotal(items);
  const tableRows = makeTableRows(items);
  const report = document.createElement('div');

  report.dir = 'rtl';
  report.lang = 'ar';

  report.style.cssText = [
    'box-sizing:border-box',
    'width:100%',
    'padding:24px',
    'background:#fff',
    'color:#222',
    'font-family:Tahoma,Arial,sans-serif',
    'direction:rtl'
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
      '<tbody>' + tableRows + '</tbody>' +
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

/* إنشاء ملف PDF فعلي */
async function generateOrdersPdf(items) {
  if (typeof html2pdf === 'undefined') {
    throw new Error('مكتبة PDF غير متاحة');
  }

  const report = createReportElement(items);

 report.style.width = '720px';
report.style.position = 'absolute';
report.style.left = '0';
report.style.top = '0';
report.style.zIndex = '-1';
report.style.pointerEvents = 'none';

document.body.appendChild(report);
  await new Promise(resolve => requestAnimationFrame(() => {
  requestAnimationFrame(resolve);
}));

  try {
    const blob = await html2pdf()
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
      .toPdf()
      .output('blob');

    if (!blob || blob.size === 0) {
      throw new Error('ملف PDF فارغ');
    }

    return blob;
  } finally {
    report.remove();
  }
}

/* إنشاء القائمة للطباعة أو الحفظ كـ PDF */
document.getElementById('createButton')
  .addEventListener('click', async event => {
    const button = event.currentTarget;
    const items = getItems();

    if (!items.length) {
      alert('اكتبي طلبًا واحدًا على الأقل.');
      return;
    }

    if (button.dataset.busy === 'true') return;

    button.dataset.busy = 'true';
    button.disabled = true;

    try {
      const blob = await generateOrdersPdf(items);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');

      if (!win) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'طلبات-البيت.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error);
      alert('تعذر إنشاء PDF. تأكدي من اتصالك بالإنترنت وحاولي مرة أخرى.');
    } finally {
      button.disabled = false;
      button.dataset.busy = 'false';
    }
  });

/* مشاركة ملف PDF كامل */
document.getElementById('shareButton')
  .addEventListener('click', async event => {
    const button = event.currentTarget;
    const items = getItems();

    if (!items.length) {
      alert('اكتبي طلبًا واحدًا على الأقل قبل المشاركة.');
      return;
    }

    if (button.dataset.busy === 'true') return;

    button.dataset.busy = 'true';
    button.disabled = true;

    const originalText = button.textContent;

    try {
      button.textContent = 'جارٍ تجهيز ملف PDF...';

      const blob = await generateOrdersPdf(items);
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
        button.textContent = 'اختاري واتساب من قائمة المشاركة...';

        try {
          await navigator.share({
            files: [file],
            title: 'قائمة طلبات البيت',
            text: 'قائمة طلبات البيت كاملة بصيغة PDF'
          });

          return;
        } catch (shareError) {
          if (shareError.name === 'AbortError') {
            return;
          }

          console.warn(
            'تعذرت المشاركة المباشرة، سيتم تنزيل الملف:',
            shareError
          );
        }
      }

      /* بديل الكمبيوتر والمتصفحات غير الداعمة للمشاركة */
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = 'طلبات-البيت.pdf';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      link.remove();

      /* إبقاء رابط الملف متاحًا مدة كافية للمتصفح */
      setTimeout(() => URL.revokeObjectURL(url), 120000);

      alert(
        'تم تنزيل ملف PDF كامل. افتحي واتساب وأرفقي الملف من مجلد التنزيلات.'
      );
    } catch (error) {
      console.error('خطأ في مشاركة PDF:', error);

      alert(
        'حصلت مشكلة أثناء تجهيز ملف PDF. حدّثي الصفحة وحاولي مرة أخرى.'
      );
    } finally {
      button.disabled = false;
      button.dataset.busy = 'false';
      button.textContent = originalText;
    }
  });

/* زر مسح الطلبات */
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

/* استرجاع الطلبات عند فتح الصفحة */
loadItems();
