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
  const rows = [...itemsBox.querySelectorAll('.row')]
    .map(row => ({
      name: row.querySelector('.item-name').value,
      quantity: row.querySelector('.item-quantity').value,
      price: row.querySelector('.item-price').value
    }))
    .filter(item =>
      item.name.trim() || item.quantity.trim() || item.price.trim()
    );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.error('تعذر حفظ القائمة:', error);
  }
}

function loadItems() {
  let savedRows = [];

  try {
    savedRows = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(savedRows)) savedRows = [];
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
  }

  // إضافة سطر فارغ، وإظهار خمسة أسطر على الأقل
  addRow();

  while (itemsBox.querySelectorAll('.row').length < 5) {
    addRow();
  }

  renumber();
}

function getItems() {
  return [...itemsBox.querySelectorAll('.row')]
    .map(row => {
      const quantityText = row.querySelector('.item-quantity').value.trim();
      const priceText = row.querySelector('.item-price').value.trim();

      return {
        name: row.querySelector('.item-name').value.trim(),
        quantity: quantityText === '' ? 1 : Number(quantityText),
        quantityText,
        price: Number(priceText) || 0,
        priceText
      };
    })
    .filter(item => item.name || item.quantityText || item.priceText);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
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

// إنشاء القائمة وفتح نافذة الطباعة أو الحفظ PDF
document.getElementById('createButton').addEventListener('click', () => {
  const items = getItems();

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل.');
    return;
  }

  const total = calculateTotal(items);
  const tableRows = makeTableRows(items);
  const win = window.open('', '_blank');

  if (!win) {
    alert('اسمحي بالنوافذ المنبثقة لهذا الموقع ثم اضغطي مرة أخرى.');
    return;
  }

  win.document.open();
  win.document.write(
    '<!doctype html>' +
    '<html lang="ar" dir="rtl">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<title>طلبات البيت</title>' +
      '<style>' +
        'body{font-family:Tahoma,Arial,sans-serif;padding:30px;color:#222}' +
        'h1{text-align:center}' +
        'table{width:100%;border-collapse:collapse}' +
        'th,td{border:1px solid #999;padding:12px;text-align:right}' +
        'th{background:#f2f2f2}' +
        '.total{margin-top:20px;padding:12px;border:1px solid #999;font-size:20px;font-weight:bold}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<h1>قائمة طلبات البيت</h1>' +
      '<p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
      '<table>' +
        '<thead><tr>' +
          '<th>رقم</th><th>الطلب</th><th>الكمية</th>' +
          '<th>سعر الوحدة</th><th>إجمالي الطلب</th>' +
        '</tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>' +
      '<div class="total">الإجمالي الكلي: ' + total.toFixed(2) + '</div>' +
    '</body>' +
    '</html>'
  );

  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
});

// إنشاء ملف PDF ومشاركته أو تنزيله
document.getElementById('shareButton').addEventListener('click', async () => {
  const items = getItems();

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل قبل المشاركة.');
    return;
  }

  if (typeof html2pdf === 'undefined') {
    alert('مكتبة PDF لم تحمل. تأكدي من اتصال الإنترنت.');
    return;
  }

  const total = calculateTotal(items);
  const tableRows = makeTableRows(items);
  const pdfElement = document.createElement('div');

  pdfElement.dir = 'rtl';
  pdfElement.style.cssText =
    'display:block;box-sizing:border-box;width:794px;margin:20px auto;' +
    'padding:40px;background:#fff;color:#222;' +
    'font-family:Tahoma,Arial,sans-serif;direction:rtl;';

  pdfElement.innerHTML =
    '<h1 style="text-align:center">قائمة طلبات البيت</h1>' +
    '<p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
    '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr>' +
        '<th>رقم</th><th>الطلب</th><th>الكمية</th>' +
        '<th>سعر الوحدة</th><th>إجمالي الطلب</th>' +
      '</tr></thead>' +
      '<tbody>' + tableRows + '</tbody>' +
    '</table>' +
    '<h3>الإجمالي الكلي: ' + total.toFixed(2) + '</h3>';

  pdfElement.querySelectorAll('th, td').forEach(cell => {
    cell.style.border = '1px solid #999';
    cell.style.padding = '12px';
    cell.style.textAlign = 'right';
  });

  document.body.appendChild(pdfElement);

  let pdfBlob;

  try {
    pdfBlob = await html2pdf()
      .set({
        margin: 10,
        filename: 'طلبات-البيت.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      })
      .from(pdfElement)
      .toContainer()
      .toCanvas()
      .toPdf()
      .outputPdf('blob');
  } catch (error) {
    console.error(error);
    alert('حصلت مشكلة أثناء إنشاء ملف PDF. حاولي مرة أخرى.');
    return;
  } finally {
    pdfElement.remove();
  }

  const pdfFile = new File(
    [pdfBlob],
    'طلبات-البيت.pdf',
    { type: 'application/pdf' }
  );

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: 'قائمة طلبات البيت'
      });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }

  const downloadUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');

  downloadLink.href = downloadUrl;
  downloadLink.download = 'طلبات-البيت.pdf';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  alert('تم تنزيل PDF. افتحي واتساب وأرفقي الملف من التنزيلات.');
});

// زر مسح القائمة إذا كان موجودًا في index.html
const clearButton =
  document.getElementById('clearButton') ||
  document.getElementById('clearAllButton');

if (clearButton) {
  clearButton.addEventListener('click', () => {
    if (!confirm('هل تريدين مسح كل الطلبات المحفوظة؟')) return;

    localStorage.removeItem(STORAGE_KEY);
    itemsBox.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      addRow();
    }

    renumber();
  });
}

// استرجاع القائمة عند فتح الموقع
loadItems();
