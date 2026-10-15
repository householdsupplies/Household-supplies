const itemsBox = document.getElementById('items');

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
    input.addEventListener('input', ensureLastRow);
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

  const name = last.querySelector('.item-name').value.trim();
  const quantity = last.querySelector('.item-quantity').value.trim();
  const price = last.querySelector('.item-price').value.trim();

  if (name || quantity || price) {
    addRow();
  }
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
  return value.replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

// إنشاء القائمة وفتح نافذة الطباعة
document.getElementById('createButton').addEventListener('click', () => {
  const items = getItems();

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل.');
    return;
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  const tableRows = items.map((item, index) => {
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

  const win = window.open('', '_blank');

  if (!win) {
    alert('اسمحي بالنوافذ المنبثقة لهذا الموقع ثم اضغطي إنشاء مرة أخرى.');
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
        'body{font-family:Tahoma,Arial,sans-serif;padding:30px}' +
        'h1{text-align:center}' +
        'table{width:100%;border-collapse:collapse}' +
        'th,td{border:1px solid #999;padding:12px;text-align:right}' +
        '.total{margin-top:20px;padding:12px;border:1px solid #999;font-size:20px;font-weight:bold}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<h1>قائمة طلبات البيت</h1>' +
      '<p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
      '<table>' +
        '<thead><tr>' +
          '<th>رقم</th>' +
          '<th>الطلب</th>' +
          '<th>الكمية</th>' +
          '<th>سعر الوحدة</th>' +
          '<th>إجمالي الطلب</th>' +
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

// إنشاء ملف PDF ومشاركته
document.getElementById('shareButton').addEventListener('click', async () => {
  const items = getItems();

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل قبل المشاركة.');
    return;
  }

  if (typeof html2pdf === 'undefined') {
    alert('مكتبة إنشاء PDF لم تحمل. تأكدي من إضافة سطر المكتبة إلى index.html ووجود اتصال بالإنترنت.');
    return;
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  const tableRows = items.map((item, index) => {
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

  const pdfElement = document.createElement('div');

  pdfElement.dir = 'rtl';
  pdfElement.style.cssText =
    'position:fixed;inset:0;z-index:999999;overflow:auto;' +
    'padding:28px;background:#fff;color:#222;' +
    'font-family:Tahoma,Arial,sans-serif;direction:rtl;';

  pdfElement.innerHTML =
    '<div style="max-width:900px;margin:auto">' +
      '<h1 style="text-align:center">قائمة طلبات البيت</h1>' +
      '<p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
      '<table style="width:100%;border-collapse:collapse">' +
        '<thead><tr>' +
          '<th style="border:1px solid #999;padding:12px;text-align:right">رقم</th>' +
          '<th style="border:1px solid #999;padding:12px;text-align:right">الطلب</th>' +
          '<th style="border:1px solid #999;padding:12px;text-align:right">الكمية</th>' +
          '<th style="border:1px solid #999;padding:12px;text-align:right">سعر الوحدة</th>' +
          '<th style="border:1px solid #999;padding:12px;text-align:right">إجمالي الطلب</th>' +
        '</tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>' +
      '<div style="margin-top:20px;padding:12px;border:1px solid #999;font-size:20px;font-weight:bold">' +
        'الإجمالي الكلي: ' + total.toFixed(2) +
      '</div>' +
    '</div>';

  document.body.appendChild(pdfElement);

  try {
    const pdfBlob = await html2pdf()
      .set({
        margin: 10,
        filename: 'طلبات-البيت.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(pdfElement)
      .outputPdf('blob');

    pdfElement.remove();

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
      await navigator.share({
        files: [pdfFile],
        title: 'قائمة طلبات البيت'
      });
    } else {
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');

      downloadLink.href = downloadUrl;
      downloadLink.download = 'طلبات-البيت.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      alert('تم تنزيل ملف PDF. افتحي واتساب وأرفقي الملف من التنزيلات.');
    }
  } catch (error) {
    pdfElement.remove();

    if (error.name !== 'AbortError') {
      console.error(error);
      alert('حصلت مشكلة أثناء تجهيز ملف PDF. حاولي مرة أخرى.');
    }
  }
});

for (let i = 0; i < 5; i++) {
  addRow();
}
