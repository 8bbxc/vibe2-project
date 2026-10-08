import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  X, 
  FileText 
} from 'lucide-react';

export default function ClientsList({
  clients,
  currencySymbol,
  onAddClient,
  onOpenNewInvoiceWithClient,
  isModalOpen,
  setIsModalOpen
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    balance: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAmount = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onAddClient(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        balance: '0'
      });
    } catch (err) {
      alert("خطأ أثناء حفظ العميل: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">دليل العملاء والشركاء</h2>
          <p className="text-xs text-gray-400 mt-1">
            إدارة بيانات العملاء، حساباتهم، وتاريخ الفواتير الصادرة باسمهم.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-gray-900/40 rounded-2xl border border-gray-800/80">
            <Users className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm">لا يوجد عملاء مسجلون بعد</p>
          </div>
        ) : (
          clients.map(cl => (
            <div
              key={cl.id}
              className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300">
                    {cl.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{cl.name}</h3>
                    {cl.company && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-teal-400" />
                        {cl.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="py-3.5 space-y-2 text-xs text-gray-400">
                  {cl.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-300 font-mono">{cl.email}</span>
                    </div>
                  )}
                  {cl.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-300 font-mono">{cl.phone}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800/80 mt-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block">الفواتير المسجلة</span>
                    <span className="font-bold text-gray-200 mt-0.5 block">{cl.total_invoices || 0} فاتورة</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-gray-500 block">إجمالي التعاملات</span>
                    <span className="font-bold text-teal-300 text-sm mt-0.5 block">
                      {formatAmount(cl.total_invoiced)} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-800 flex items-center justify-end">
                <button
                  onClick={() => onOpenNewInvoiceWithClient(cl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-teal-400 hover:text-teal-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>إصدار فاتورة للعميل</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal: Add Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                إضافة عميل أو شريك جديد
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">اسم العميل / المسؤول *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة التطوير، أحمد العلي..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">اسم المؤسسة أو الشركة</label>
                <input
                  type="text"
                  placeholder="مثال: حلول الويب المتقدمة"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="+966 ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

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
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ العميل في Neon'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
