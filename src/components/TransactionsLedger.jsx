import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Filter, 
  X, 
  CreditCard,
  Calendar,
  Tag,
  Building
} from 'lucide-react';

export default function TransactionsLedger({
  transactions,
  categories,
  clients,
  currencySymbol,
  onAddTransaction,
  onDeleteTransaction,
  isModalOpen,
  setIsModalOpen
}) {
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'income',
    amount: '',
    category_id: '',
    client_id: '',
    payment_method: 'Bank Transfer',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAmount = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category_name && t.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.client_name && t.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        type: 'income',
        amount: '',
        category_id: '',
        client_id: '',
        payment_method: 'Bank Transfer',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      alert("حدث خطأ أثناء حفظ القيد: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">دفتر القيود والمعاملات المالية</h2>
          <p className="text-xs text-gray-400 mt-1">
            سجل التدفقات النقدية اللحظي، المصروفات، والمقبوضات البنكية والنقدية.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قيد مالي جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/60 p-3.5 rounded-2xl border border-gray-800">
        
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-gray-800 text-white border border-gray-700 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            جميع القيود ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              filterType === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow'
                : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            إيرادات فقط
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              filterType === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow'
                : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            مصروفات فقط
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالوصف، العميل، أو الفئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-950/70 text-gray-400 text-xs uppercase font-medium border-b border-gray-800">
              <tr>
                <th className="px-5 py-3.5">البيان / الوصف</th>
                <th className="px-5 py-3.5">النوع</th>
                <th className="px-5 py-3.5">الفئة المحاسبية</th>
                <th className="px-5 py-3.5">الطرف / العميل</th>
                <th className="px-5 py-3.5">طريقة الدفع</th>
                <th className="px-5 py-3.5">التاريخ</th>
                <th className="px-5 py-3.5">المبلغ</th>
                <th className="px-5 py-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-gray-500">
                    لا توجد قيود مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                    
                    {/* Title */}
                    <td className="px-5 py-3.5 font-medium text-gray-200">
                      <div>
                        <span>{t.title}</span>
                        {t.notes && <p className="text-[11px] text-gray-500 font-normal mt-0.5">{t.notes}</p>}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {t.type === 'income' ? 'إيراد' : 'مصروف'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-xs text-gray-300">
                      <span className="px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700/80">
                        {t.category_name || 'عام'}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-3.5 text-xs text-gray-300">
                      {t.client_name ? (
                        <span className="text-teal-400 font-medium">{t.client_name}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {t.payment_method || 'Cash'}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                      {new Date(t.transaction_date).toLocaleDateString('ar-EG')}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-mono text-sm font-bold">
                      <span className={t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)} {currencySymbol}
                      </span>
                    </td>

                    {/* Delete action */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذا القيد المالي؟")) {
                            onDeleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="حذف القيد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                تسجيل قيد مالي جديد في Neon DB
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    formData.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                      : 'bg-gray-900 text-gray-400 border-gray-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  إيراد / مقبوضات (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    formData.type === 'expense'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                      : 'bg-gray-900 text-gray-400 border-gray-800'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  مصروف / مدفوعات (-)
                </button>
              </div>

              {/* Title & Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">بيان المعاملة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دفعة تطوير منصة، إيجار المكتب..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">المبلغ ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Client Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">الفئة المحاسبية</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">اختر الفئة...</option>
                    {categories
                      .filter(c => c.type === formData.type)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">العميل / الطرف</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">اختر العميل (اختياري)...</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">طريقة الدفع</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bank Transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="Cash">نقداً (Cash)</option>
                  <option value="Credit Card">بطاقة ائتمان (Credit Card)</option>
                  <option value="Cheque">شيك مصرفي (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows="2"
                  placeholder="أي تفاصيل أو مستندات مرجعية..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ القيد المحاسبي'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
