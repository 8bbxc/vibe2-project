import React from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  FileSpreadsheet
} from 'lucide-react';

export default function FinancialReports({
  stats,
  transactions,
  categories,
  currencySymbol
}) {
  const formatAmount = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const totalIncome = stats?.totalIncome || 0;
  const totalExpense = stats?.totalExpense || 0;
  const netProfit = stats?.netProfit || 0;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  // Category breakdown calculation from transactions
  const categoryTotals = categories.map(cat => {
    const total = transactions
      .filter(t => t.category_id === cat.id)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return {
      ...cat,
      total
    };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const totalTracked = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">التقارير والتحليلات المالية</h2>
          <p className="text-xs text-gray-400 mt-1">
            بيانات الأداء المالي، هوامش الربحية، وتوزيع الإيرادات والمصروفات حسب الفئات.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-all border border-gray-700"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>تصدير وطباعة التقرير</span>
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800">
          <span className="text-xs text-gray-400 font-medium">هامش الربح التشغيلي</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {profitMargin}%
          </div>
          <p className="text-[11px] text-gray-500 mt-1">نسبة الفائض الصافي من إجمالي المبيعات</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800">
          <span className="text-xs text-gray-400 font-medium">نسبة تغطية المصروفات</span>
          <div className="text-2xl font-bold font-mono text-teal-300 mt-2">
            {totalExpense > 0 ? (totalIncome / totalExpense).toFixed(2) + 'x' : '100%'}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">قدرة الإيرادات على تغطية التكاليف</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800">
          <span className="text-xs text-gray-400 font-medium">حالة التوازن المالي</span>
          <div className="text-lg font-bold text-white mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{netProfit >= 0 ? 'مستقر وآمن' : 'يحتاج ترشيد إنفاق'}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">تقييم مبني على قيود Neon Postgres</p>
        </div>

      </div>

      {/* Income vs Expenses Progress Visualizer */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          مقارنة الإيرادات مقابل المصروفات
        </h3>

        {/* Comparison Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              إيرادات ({formatAmount(totalIncome)} {currencySymbol})
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              مصروفات ({formatAmount(totalExpense)} {currencySymbol})
            </span>
          </div>

          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${(totalIncome + totalExpense) > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 50}%` }}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
            ></div>
            <div 
              style={{ width: `${(totalIncome + totalExpense) > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 50}%` }}
              className="bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          توزيع المبالغ حسب الفئات المحاسبية
        </h3>

        <div className="space-y-3">
          {categoryTotals.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">لا توجد حركات مسجلة بالفئات حتى الآن</p>
          ) : (
            categoryTotals.map(c => {
              const percentage = totalTracked > 0 ? ((c.total / totalTracked) * 100).toFixed(1) : 0;
              return (
                <div key={c.id} className="space-y-1.5 bg-gray-950/60 p-3.5 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: c.color || '#3b82f6' }}
                      ></span>
                      <span className="font-semibold text-gray-200">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        c.type === 'income' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {c.type === 'income' ? 'إيراد' : 'مصروف'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-gray-400">{percentage}%</span>
                      <span className="font-bold text-white">{formatAmount(c.total)} {currencySymbol}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: c.color || '#10b981'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
