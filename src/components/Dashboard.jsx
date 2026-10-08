import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  PlusCircle, 
  FileText, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft
} from 'lucide-react';

export default function Dashboard({ 
  stats, 
  transactions, 
  invoices, 
  currencySymbol, 
  setActiveTab,
  onOpenNewTransaction,
  onOpenNewInvoice,
  onOpenNewClient 
}) {
  const formatAmount = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const isProfitable = (stats?.netProfit || 0) >= 0;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-900/90 to-emerald-950/40 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white">نظرة عامة على الأداء المالي</h2>
          <p className="text-sm text-gray-400 mt-1">
            متابعة فورية للتدفقات النقدية، الإيرادات، والمصروفات المسجلة في قاعدة بيانات Neon Postgres.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل قيد مالي</span>
          </button>
          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700/80 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-700/20 active:scale-95 border border-teal-500/30"
          >
            <FileText className="w-4 h-4" />
            <span>إصدار فاتورة</span>
          </button>
          <button
            onClick={onOpenNewClient}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-sm font-medium transition-all border border-gray-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عميل</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800/80 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">إجمالي الإيرادات</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatAmount(stats?.totalIncome)} <span className="text-sm font-sans text-emerald-400">{currencySymbol}</span>
            </div>
            <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              مقبوضات وإيرادات نشطة
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800/80 hover:border-rose-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">إجمالي المصروفات</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatAmount(stats?.totalExpense)} <span className="text-sm font-sans text-rose-400">{currencySymbol}</span>
            </div>
            <p className="text-xs text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              تكاليف ورواتب ومصروفات
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800/80 hover:border-teal-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">صافي الأرباح</span>
            <div className={`p-2.5 rounded-xl border ${
              isProfitable 
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold font-mono tracking-tight ${isProfitable ? 'text-teal-300' : 'text-amber-400'}`}>
              {formatAmount(stats?.netProfit)} <span className="text-sm font-sans">{currencySymbol}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              {isProfitable ? (
                <span className="text-teal-400 font-medium">فائض أرباح تشغيلي إيجابي</span>
              ) : (
                <span className="text-amber-400 font-medium">عجز مالي مؤقت</span>
              )}
            </p>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800/80 hover:border-amber-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">فواتير قيد التحصيل</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatAmount(stats?.pendingAmount)} <span className="text-sm font-sans text-amber-400">{currencySymbol}</span>
            </div>
            <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1 font-medium">
              <span>{stats?.pendingCount || 0} فاتورة بانتظار السداد</span>
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions & Pending Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions Table Card */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="font-bold text-white text-base">أحدث القيود والمعاملات</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {transactions?.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">لا توجد معاملات مسجلة بعد</p>
            ) : (
              transactions?.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      t.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{t.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.category_name || 'عام'} &bull; {new Date(t.transaction_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className={`text-sm font-bold ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)} {currencySymbol}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices Card */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
              <h3 className="font-bold text-white text-base">الفواتير وحالة السداد</h3>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition-colors"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {invoices?.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">لا توجد فواتير صادرة</p>
            ) : (
              invoices?.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-gray-800/80 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800 text-teal-400 border border-gray-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200 font-mono">{inv.invoice_number}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : inv.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}>
                          {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'معلقة' : inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {inv.client_name || 'عميل'} &bull; استحقاق: {new Date(inv.due_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-sm font-bold text-white">
                      {formatAmount(inv.total_amount)} {currencySymbol}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
