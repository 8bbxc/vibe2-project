import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionsLedger from './components/TransactionsLedger';
import InvoiceManager from './components/InvoiceManager';
import ClientsList from './components/ClientsList';
import FinancialReports from './components/FinancialReports';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('USD');
  const [dbHealth, setDbHealth] = useState(null);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal controls
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const currencySymbols = {
    USD: '$',
    SAR: 'ر.س',
    ILS: '₪'
  };
  const currentSymbol = currencySymbols[currency] || '$';

  // Fetch all primary operational data
  const fetchData = async () => {
    try {
      const [healthRes, statsRes, txRes, invRes, clientsRes, catsRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => null),
        fetch('/api/dashboard/stats').then(r => r.json()).catch(() => null),
        fetch('/api/transactions').then(r => r.json()).catch(() => []),
        fetch('/api/invoices').then(r => r.json()).catch(() => []),
        fetch('/api/clients').then(r => r.json()).catch(() => []),
        fetch('/api/categories').then(r => r.json()).catch(() => [])
      ]);

      if (healthRes) setDbHealth(healthRes);
      if (statsRes) setStats(statsRes);
      if (Array.isArray(txRes)) setTransactions(txRes);
      if (Array.isArray(invRes)) setInvoices(invRes);
      if (Array.isArray(clientsRes)) setClients(clientsRes);
      if (Array.isArray(catsRes)) setCategories(catsRes);
    } catch (err) {
      console.error("Failed to fetch accounting data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll db health every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/health')
        .then(r => r.json())
        .then(data => setDbHealth(data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddTransaction = async (formData) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add transaction');
    }
    await fetchData();
  };

  const handleDeleteTransaction = async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleCreateInvoice = async (formData) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create invoice');
    }
    await fetchData();
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update invoice');
    }
    await fetchData();
  };

  const handleDeleteInvoice = async (id) => {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleAddClient = async (formData) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add client');
    }
    await fetchData();
  };

  const handleOpenNewInvoiceWithClient = (clientId) => {
    setActiveTab('invoices');
    setIsInvModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F3F4F6] flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbHealth={dbHealth}
        currency={currency}
        setCurrency={setCurrency}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400">جاري الاتصال بقاعدة بيانات Neon السحابية واسترداد البيانات...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                transactions={transactions}
                invoices={invoices}
                currencySymbol={currentSymbol}
                setActiveTab={setActiveTab}
                onOpenNewTransaction={() => setIsTxModalOpen(true)}
                onOpenNewInvoice={() => setIsInvModalOpen(true)}
                onOpenNewClient={() => setIsClientModalOpen(true)}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsLedger
                transactions={transactions}
                categories={categories}
                clients={clients}
                currencySymbol={currentSymbol}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isModalOpen={isTxModalOpen}
                setIsModalOpen={setIsTxModalOpen}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceManager
                invoices={invoices}
                clients={clients}
                currencySymbol={currentSymbol}
                onCreateInvoice={handleCreateInvoice}
                onUpdateStatus={handleUpdateInvoiceStatus}
                onDeleteInvoice={handleDeleteInvoice}
                isModalOpen={isInvModalOpen}
                setIsModalOpen={setIsInvModalOpen}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsList
                clients={clients}
                currencySymbol={currentSymbol}
                onAddClient={handleAddClient}
                onOpenNewInvoiceWithClient={handleOpenNewInvoiceWithClient}
                isModalOpen={isClientModalOpen}
                setIsModalOpen={setIsClientModalOpen}
              />
            )}

            {activeTab === 'reports' && (
              <FinancialReports
                stats={stats}
                transactions={transactions}
                categories={categories}
                currencySymbol={currentSymbol}
              />
            )}
          </>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950/60 py-4 text-center text-xs text-gray-500 font-mono">
        ميزان الذكي &bull; Neon Serverless PostgreSQL &bull; AWS us-east-2 &bull; SkillSpector & Addy Osmani Standards
      </footer>

    </div>
  );
}
