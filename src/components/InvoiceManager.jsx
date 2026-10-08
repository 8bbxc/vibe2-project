import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  Printer, 
  Trash2, 
  X, 
  Download, 
  Building,
  User,
  Calendar,
  DollarSign,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

export default function InvoiceManager({
  invoices,
  clients,
  currencySymbol,
  onCreateInvoice,
  onUpdateStatus,
  onDeleteInvoice,
  isModalOpen,
  setIsModalOpen
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null); // For preview/print modal
  
  // New invoice form
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    tax_rate: 15,
    discount: 0,
    notes: 'شكراً لتعاملكم معنا. الدفع مستحق خلال 14 يوماً من تاريخ الإصدار.',
    items: [
      { description: 'تطوير حلول برمجية وقواعد بيانات سحابية', quantity: 1, unit_price: 2500 }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAmount = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Calculate live preview totals
  const subtotal = formData.items.reduce((sum, it) => sum + (parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0)), 0);
  const taxAmount = (subtotal * parseFloat(formData.tax_rate || 0)) / 100;
  const totalAmount = subtotal + taxAmount - parseFloat(formData.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || formData.items.length === 0) {
      alert("يرجى اختيار العميل وإضافة بند واحد على الأقل");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateInvoice(formData);
      setIsModalOpen(false);
      setFormData({
        client_id: '',
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        tax_rate: 15,
        discount: 0,
        notes: 'شكراً لتعاملكم معنا. الدفع مستحق خلال 14 يوماً من تاريخ الإصدار.',
        items: [
          { description: 'تطوير حلول برمجية وقواعد بيانات سحابية', quantity: 1, unit_price: 2500 }
        ]
      });
    } catch (err) {
      alert("خطأ أثناء إصدار الفاتورة: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة الفواتير والمطالبات</h2>
          <p className="text-xs text-gray-400 mt-1">
            إصدار فواتير ضريبية رسمية، تتبع حالات السداد، وطباعة مستندات الفوترة.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-600/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار فاتورة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-2xl border border-gray-800 w-fit">
        {[
          { id: 'all', label: 'جميع الفواتير' },
          { id: 'pending', label: 'معلقة للتحصيل' },
          { id: 'paid', label: 'مدفوعة ومسددة' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-gray-800 text-white shadow-sm border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-gray-900/40 rounded-2xl border border-gray-800/80">
            <FileText className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm">لا توجد فواتير مطابقة لهذا التصنيف</p>
          </div>
        ) : (
          filteredInvoices.map(inv => (
            <div
              key={inv.id}
              className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                {/* Top Number & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <span className="font-mono text-base font-bold text-white tracking-wider">
                    {inv.invoice_number}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    inv.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : inv.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {inv.status === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {inv.status === 'paid' ? 'مدفوعة' : 'بانتظار السداد'}
                  </span>
                </div>

                {/* Client & Date Info */}
                <div className="py-3.5 space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">العميل:</span>
                    <span className="text-gray-200 font-semibold">{inv.client_name || 'عميل'}</span>
                  </div>
                  {inv.client_company && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">الشركة:</span>
                      <span className="text-gray-300">{inv.client_company}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">تاريخ الإصدار:</span>
                    <span className="font-mono text-gray-300">
                      {new Date(inv.issue_date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">تاريخ الاستحقاق:</span>
                    <span className="font-mono text-amber-400/90 font-medium">
                      {new Date(inv.due_date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                {/* Amount Preview */}
                <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800/80 mt-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>المبلغ الإجمالي شامل الضريبة:</span>
                    <span className="font-mono text-base font-bold text-teal-300">
                      {formatAmount(inv.total_amount)} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>معاينة وطباعة</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => onUpdateStatus(inv.id, 'paid')}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/30"
                      title="تسجيل كسداد فوري وإيداع في سجل المعاملات"
                    >
                      تسجيل كسداد
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("هل تريد حذف هذه الفاتورة؟")) {
                        onDeleteInvoice(inv.id);
                      }
                    }}
                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal: Create New Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                إصدار فاتورة ضريبية رسمية جديدة
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">العميل والمستفيد *</label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">اختر العميل...</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name} {cl.company ? `(${cl.company})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">رقم الفاتورة</label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">تاريخ الإصدار</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">بنود وخدمات الفاتورة</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    إضافة بند جديد
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-950/70 p-2.5 rounded-xl border border-gray-800">
                      <input
                        type="text"
                        required
                        placeholder="وصف الخدمة أو المنتج..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="السعر"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-xs text-teal-300 font-mono w-20 text-left">
                        {formatAmount(item.quantity * item.unit_price)}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-gray-500 hover:text-rose-400"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">قيمة الخصم ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Calculated Totals Box */}
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع الجزئي:</span>
                  <span className="font-mono">{formatAmount(subtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>الضريبة ({formData.tax_rate}%):</span>
                  <span className="font-mono">{formatAmount(taxAmount)} {currencySymbol}</span>
                </div>
                {parseFloat(formData.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>الخصم المطبق:</span>
                    <span className="font-mono">-{formatAmount(formData.discount)} {currencySymbol}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-gray-800">
                  <span>الإجمالي النهائي المستحق:</span>
                  <span className="font-mono text-teal-400">{formatAmount(totalAmount)} {currencySymbol}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الاعتماد...' : 'إصدار وحفظ الفاتورة'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Printable Invoice Modal Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl p-8 shadow-2xl space-y-6 my-6 print:m-0 print:p-0">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b pb-6 border-gray-200">
              <div>
                <h1 className="text-2xl font-black text-gray-900">فاتورة ضريبية رسمية</h1>
                <p className="text-xs text-gray-500 font-mono mt-1">Tax Invoice &bull; {selectedInvoice.invoice_number}</p>
              </div>
              <div className="text-left font-mono">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg mb-1 ml-auto">
                  م
                </div>
                <p className="text-xs font-bold text-gray-700">ميزان الذكي</p>
                <p className="text-[11px] text-gray-500">سجل تجاري / ترخيص ضريبي</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-1">بيانات العميل:</h4>
                <p className="font-bold text-sm text-teal-800">{selectedInvoice.client_name}</p>
                {selectedInvoice.client_company && <p className="text-gray-600">{selectedInvoice.client_company}</p>}
                {selectedInvoice.client_email && <p className="text-gray-500">{selectedInvoice.client_email}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                <h4 className="font-bold text-gray-700 mb-1">تفاصيل الفاتورة:</h4>
                <p><span className="text-gray-500">تاريخ الإصدار: </span>{new Date(selectedInvoice.issue_date).toLocaleDateString('ar-EG')}</p>
                <p><span className="text-gray-500">تاريخ الاستحقاق: </span>{new Date(selectedInvoice.due_date).toLocaleDateString('ar-EG')}</p>
                <p><span className="text-gray-500">الحالة: </span>
                  <span className={`font-bold ${selectedInvoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedInvoice.status === 'paid' ? 'مسددة بالكامل' : 'قيد السداد'}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-right text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">البند / البيان</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-left">سعر الوحدة</th>
                  <th className="p-3 text-left">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedInvoice.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-medium text-gray-800">{it.description}</td>
                    <td className="p-3 text-center font-mono">{it.quantity}</td>
                    <td className="p-3 text-left font-mono">{formatAmount(it.unit_price)}</td>
                    <td className="p-3 text-left font-mono font-bold">{formatAmount(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-64 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الجزئي:</span>
                  <span className="font-mono">{formatAmount(selectedInvoice.subtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة القيمة المضافة ({selectedInvoice.tax_rate}%):</span>
                  <span className="font-mono">{formatAmount(selectedInvoice.tax_amount)} {currencySymbol}</span>
                </div>
                {parseFloat(selectedInvoice.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم:</span>
                    <span className="font-mono">-{formatAmount(selectedInvoice.discount)} {currencySymbol}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-300">
                  <span>الإجمالي النهائي:</span>
                  <span className="font-mono text-teal-700">{formatAmount(selectedInvoice.total_amount)} {currencySymbol}</span>
                </div>
              </div>
            </div>

            {/* Notes & Actions */}
            {selectedInvoice.notes && (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                {selectedInvoice.notes}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
