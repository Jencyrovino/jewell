import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Wallet,
    CircleDollarSign,
    Calendar,
    Filter,
    X,
    Edit2
} from 'lucide-react';

export default function Expenses() {
    const [activeTab, setActiveTab] = useState('expenses');

    // State for data
    const [expenses, setExpenses] = useState([]);
    const [cashLedger, setCashLedger] = useState([]);
    const [goldLedger, setGoldLedger] = useState([]);

    // UI State
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAddCashEntryModalOpen, setIsAddCashEntryModalOpen] = useState(false);
    const [isAddGoldEntryModalOpen, setIsAddGoldEntryModalOpen] = useState(false);

    // Form States
    const [expenseForm, setExpenseForm] = useState({
        type: 'Rent',
        description: '',
        paymentMode: 'Cash',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [cashEntryForm, setCashEntryForm] = useState({
        type: 'Inflow',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [goldEntryForm, setGoldEntryForm] = useState({
        type: 'Inflow',
        description: '',
        purity: '22K',
        weight: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Load Data
    useEffect(() => {
        const storedExpenses = JSON.parse(localStorage.getItem('jw_expenses') || '[]');
        const storedCash = JSON.parse(localStorage.getItem('jw_cash_ledger') || '[]');
        const storedGold = JSON.parse(localStorage.getItem('jw_gold_ledger') || '[]');

        setExpenses(storedExpenses);
        setCashLedger(storedCash);
        setGoldLedger(storedGold);
    }, []);

    const saveExpenses = (data) => {
        setExpenses(data);
        localStorage.setItem('jw_expenses', JSON.stringify(data));
    };

    const saveCashLedger = (data) => {
        setCashLedger(data);
        localStorage.setItem('jw_cash_ledger', JSON.stringify(data));
    };

    const saveGoldLedger = (data) => {
        setGoldLedger(data);
        localStorage.setItem('jw_gold_ledger', JSON.stringify(data));
    };

    // Derived State (KPIs)
    const currentCashBalance = useMemo(() => {
        return cashLedger.reduce((acc, txn) =>
            acc + (txn.type === 'Inflow' ? txn.amount : -txn.amount)
            , 0);
    }, [cashLedger]);

    const totalCashInflow = useMemo(() => {
        return cashLedger.filter(t => t.type === 'Inflow').reduce((acc, t) => acc + t.amount, 0);
    }, [cashLedger]);

    const totalCashOutflow = useMemo(() => {
        return cashLedger.filter(t => t.type === 'Outflow').reduce((acc, t) => acc + t.amount, 0);
    }, [cashLedger]);

    const currentGoldStock = useMemo(() => {
        // Simplified stock logic: assumes total weight regardless of purity for the top level KPI
        return goldLedger.reduce((acc, txn) =>
            acc + (txn.type === 'Inflow' ? txn.weight : -txn.weight)
            , 0);
    }, [goldLedger]);

    const totalGoldInflow = useMemo(() => {
        return goldLedger.filter(t => t.type === 'Inflow').reduce((acc, t) => acc + t.weight, 0);
    }, [goldLedger]);

    const totalGoldOutflow = useMemo(() => {
        return goldLedger.filter(t => t.type === 'Outflow').reduce((acc, t) => acc + t.weight, 0);
    }, [goldLedger]);

    const netCashFlow = totalCashInflow - totalCashOutflow;

    // formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Action Handlers
    const handleAddExpense = (e) => {
        e.preventDefault();
        const newExpense = {
            id: Date.now().toString(),
            expenseId: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            ...expenseForm,
            amount: parseFloat(expenseForm.amount) || 0,
            timestamp: new Date().toISOString()
        };

        saveExpenses([...expenses, newExpense]);

        // Auto update relevant ledgers
        if (newExpense.paymentMode === 'Cash') {
            const newCashTxn = {
                id: Date.now().toString() + '-cash',
                transactionId: `CASH-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
                date: newExpense.date,
                timestamp: newExpense.timestamp,
                type: 'Outflow',
                description: `Expense: ${newExpense.type} - ${newExpense.description}`,
                amount: newExpense.amount,
                source: 'Expense'
            };
            saveCashLedger([...cashLedger, newCashTxn]);
        } else if (newExpense.paymentMode === 'Gold') {
            // If paying by gold, we need a generic equivalent or ask for weight.
            // For this design, let's assume the user enters the INR equivalent in the amount field,
            // but we might need weight for the gold ledger. 
            // In a real system, you'd calculate gold weight based on current rate.
            // Here we'll add a simplified prompt or assume an equivalent weight.
            const estimatedWeight = newExpense.amount / 6000; // rough placeholder logic
            alert(`Paying expense by Gold. Deducting approx ${estimatedWeight.toFixed(2)}g from Gold Ledger based on placeholder rate.`);

            const newGoldTxn = {
                id: Date.now().toString() + '-gold',
                transactionId: `GOLD-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
                date: newExpense.date,
                timestamp: newExpense.timestamp,
                type: 'Outflow',
                description: `Expense Payment: ${newExpense.type}`,
                purity: '22K', // Default assumed
                weight: estimatedWeight,
                source: 'Expense'
            };
            saveGoldLedger([...goldLedger, newGoldTxn]);
        }

        setIsAddExpenseModalOpen(false);
        setExpenseForm({ type: 'Rent', description: '', paymentMode: 'Cash', amount: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleAddCashEntry = (e) => {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(),
            transactionId: `CASH-${cashEntryForm.type === 'Inflow' ? 'IN' : 'OUT'}-${Math.floor(1000 + Math.random() * 9000)}`,
            ...cashEntryForm,
            amount: parseFloat(cashEntryForm.amount) || 0,
            source: 'Manual',
            timestamp: new Date().toISOString()
        };
        saveCashLedger([...cashLedger, newEntry]);
        setIsAddCashEntryModalOpen(false);
        setCashEntryForm({ type: 'Inflow', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleAddGoldEntry = (e) => {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(),
            transactionId: `GOLD-${goldEntryForm.type === 'Inflow' ? 'IN' : 'OUT'}-${Math.floor(1000 + Math.random() * 9000)}`,
            ...goldEntryForm,
            weight: parseFloat(goldEntryForm.weight) || 0,
            source: 'Manual',
            timestamp: new Date().toISOString()
        };
        saveGoldLedger([...goldLedger, newEntry]);
        setIsAddGoldEntryModalOpen(false);
        setGoldEntryForm({ type: 'Inflow', description: '', purity: '22K', weight: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteExpense = (id) => {
        if (window.confirm("Are you sure you want to delete this expense? Ledger entries will not be automatically reversed.")) {
            saveExpenses(expenses.filter(e => e.id !== id));
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-jw-gold-dark mb-6">Expense and Stock Management</h1>

            {/* Top Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        <CircleDollarSign className="text-jw-green" size={24} />
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">Gold Stock</p>
                        <h3 className="text-2xl font-bold text-gray-800">{currentGoldStock.toFixed(2)} <span className="text-gray-600 text-sm font-medium">g</span></h3>
                    </div>
                </div>

                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        <Wallet className="text-jw-green" size={24} />
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">Cash Balance</p>
                        <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(currentCashBalance)}</h3>
                    </div>
                </div>

                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        {netCashFlow >= 0 ? <TrendingUp className="text-jw-green" size={24} /> : <TrendingDown className="text-red-500" size={24} />}
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">Net Flow</p>
                        <h3 className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-jw-green' : 'text-red-600'}`}>
                            {netCashFlow >= 0 ? '+' : '-'} {formatCurrency(Math.abs(netCashFlow))}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-jw-gold/20 p-2 rounded-t-lg flex gap-2">
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-6 py-2.5 font-semibold text-lg transition-all border-b-2 ${activeTab === 'expenses' ? 'border-jw-gold-dark text-jw-gold-dark' : 'border-transparent text-gray-600 hover:text-jw-gold-dark'}`}
                >
                    Expense Entries
                </button>
                <button
                    onClick={() => setActiveTab('cash')}
                    className={`px-6 py-2.5 font-semibold text-lg transition-all border-b-2 ${activeTab === 'cash' ? 'border-jw-gold-dark text-jw-gold-dark' : 'border-transparent text-gray-600 hover:text-jw-gold-dark'}`}
                >
                    Cash Ledger
                </button>
                <button
                    onClick={() => setActiveTab('gold')}
                    className={`px-6 py-2.5 font-semibold text-lg transition-all border-b-2 ${activeTab === 'gold' ? 'border-jw-gold-dark text-jw-gold-dark' : 'border-transparent text-gray-600 hover:text-jw-gold-dark'}`}
                >
                    Gold Ledger
                </button>
            </div>

            {/* Tab content area */}
            <div className="bg-[#fadmb0] p-6 -mt-6 pt-8 rounded-b-lg border-x border-b border-jw-gold/20" style={{ backgroundColor: '#faebd7' }}>

                {/* --- EXPENSES TAB --- */}
                {activeTab === 'expenses' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex gap-4">
                                <select className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none">
                                    <option>All Expenses Type</option>
                                    <option>Rent</option>
                                    <option>Salary</option>
                                    <option>Maintenance</option>
                                </select>
                                <select className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none">
                                    <option>All Payment Modes</option>
                                    <option>Cash</option>
                                    <option>Bank</option>
                                    <option>Gold</option>
                                </select>
                                <div className="relative">
                                    <input type="date" className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none pr-10" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search Expenses..."
                                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-jw-gold w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsAddExpenseModalOpen(true)}
                                    className="bg-jw-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                                >
                                    <Plus size={18} /> Add Expense
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm">Date & Time</th>
                                        <th className="p-4 font-semibold text-sm">Expense ID</th>
                                        <th className="p-4 font-semibold text-sm">Expense Type</th>
                                        <th className="p-4 font-semibold text-sm">Payment Mode</th>
                                        <th className="p-4 font-semibold text-sm">Amount (Rs)</th>
                                        <th className="p-4 font-semibold text-sm text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((expense) => (
                                        <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="p-4 text-sm">
                                                <div>{new Date(expense.date).toLocaleDateString()}</div>
                                                <div className="text-gray-500 text-xs">{new Date(expense.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-gray-700">{expense.expenseId}</td>
                                            <td className="p-4 text-sm">{expense.type}</td>
                                            <td className="p-4 text-sm">{expense.paymentMode}</td>
                                            <td className="p-4 text-sm font-medium">{formatCurrency(expense.amount)}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-3 text-jw-green">
                                                    <button className="hover:text-jw-gold"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteExpense(expense.id)} className="hover:text-red-600 text-red-400"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No expenses recorded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- CASH LEDGER TAB --- */}
                {activeTab === 'cash' && (
                    <div className="space-y-6">
                        {/* Cash KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-green-50 p-6 rounded-lg border border-green-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="text-green-700 font-medium mb-1">Total Cash Inflow</p>
                                    <p className="text-3xl font-bold text-green-800">{formatCurrency(totalCashInflow).replace('₹', '')}</p>
                                </div>
                                <TrendingDown size={32} className="text-green-400 transform rotate-180" />
                            </div>
                            <div className="bg-red-50 p-6 rounded-lg border border-red-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="text-red-700 font-medium mb-1">Total Cash Outflow</p>
                                    <p className="text-3xl font-bold text-red-800">{formatCurrency(totalCashOutflow).replace('₹', '')}</p>
                                </div>
                                <TrendingUp size={32} className="text-red-400" />
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="text-blue-700 font-medium mb-1">Current Balance</p>
                                    <p className="text-3xl font-bold text-blue-800">{formatCurrency(currentCashBalance)}</p>
                                </div>
                                <Wallet size={32} className="text-blue-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 flex justify-between items-center border-b">
                                <h3 className="font-bold text-gray-700">Cash Transactions</h3>
                                <button
                                    onClick={() => setIsAddCashEntryModalOpen(true)}
                                    className="bg-jw-green hover:bg-[#1a3826] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Plus size={16} /> Manual Entry
                                </button>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm">Date & Time</th>
                                        <th className="p-4 font-semibold text-sm">Transaction ID</th>
                                        <th className="p-4 font-semibold text-sm">Type</th>
                                        <th className="p-4 font-semibold text-sm">Description</th>
                                        <th className="p-4 font-semibold text-sm text-right">Inflow (Rs)</th>
                                        <th className="p-4 font-semibold text-sm text-right">Outflow (Rs)</th>
                                        <th className="p-4 font-semibold text-sm text-right">Balance (Rs)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Calculating running balance requires chronological order */}
                                    {cashLedger.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).reduce((acc, txn, index) => {
                                        const prevBalance = index === 0 ? 0 : acc.rows[index - 1].runningBalance;
                                        const runningBalance = prevBalance + (txn.type === 'Inflow' ? txn.amount : -txn.amount);
                                        acc.rows.push({ ...txn, runningBalance });
                                        return acc;
                                    }, { rows: [] }).rows.reverse().map((txn) => (
                                        <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="p-4 text-sm">
                                                <div>{new Date(txn.date).toLocaleDateString()}</div>
                                                <div className="text-gray-500 text-xs">{new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-600">{txn.transactionId}</td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${txn.source === 'Manual' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {txn.source || 'Sale'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700">{txn.description}</td>
                                            <td className="p-4 text-sm text-right text-green-700 font-medium">
                                                {txn.type === 'Inflow' ? formatCurrency(txn.amount).replace('₹', '') : '--'}
                                            </td>
                                            <td className="p-4 text-sm text-right text-red-700 font-medium">
                                                {txn.type === 'Outflow' ? formatCurrency(txn.amount).replace('₹', '') : '--'}
                                            </td>
                                            <td className="p-4 text-sm text-right font-bold text-gray-800">
                                                {formatCurrency(txn.runningBalance).replace('₹', '')}
                                            </td>
                                        </tr>
                                    ))}
                                    {cashLedger.length === 0 && (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No cash transactions recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- GOLD LEDGER TAB --- */}
                {activeTab === 'gold' && (
                    <div className="space-y-6">
                        {/* Gold KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-green-50 p-6 rounded-lg border border-green-200 flex justify-between items-center shadow-sm relative overflow-hidden">
                                <div>
                                    <p className="text-green-700 font-medium mb-1">Total Gold Inflow</p>
                                    <p className="text-3xl font-bold text-green-800">{totalGoldInflow.toFixed(2)} g</p>
                                </div>
                                <TrendingDown size={28} className="text-green-500 transform rotate-180 absolute top-4 right-4 opacity-50" />
                            </div>
                            <div className="bg-red-50 p-6 rounded-lg border border-red-200 flex justify-between items-center shadow-sm relative overflow-hidden">
                                <div>
                                    <p className="text-red-700 font-medium mb-1">Total Gold Outflow</p>
                                    <p className="text-3xl font-bold text-red-800">{totalGoldOutflow.toFixed(2)} g</p>
                                </div>
                                <TrendingUp size={28} className="text-red-500 absolute top-4 right-4 opacity-50" />
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-300 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="text-yellow-800 font-medium mb-1">Current Stock</p>
                                    <p className="text-3xl font-bold text-yellow-900">{currentGoldStock.toFixed(2)} g</p>
                                </div>
                                <div className="bg-yellow-400 text-yellow-800 p-2 rounded-full">
                                    <CircleDollarSign size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <div className="p-4 flex justify-between items-center border-b bg-gray-50">
                                <h3 className="font-bold text-gray-700">Gold Transactions</h3>
                                <button
                                    onClick={() => setIsAddGoldEntryModalOpen(true)}
                                    className="bg-jw-gold hover:bg-[#b38b36] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Plus size={16} /> Manual Metal Entry
                                </button>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm">Date & Time</th>
                                        <th className="p-4 font-semibold text-sm">Transaction ID</th>
                                        <th className="p-4 font-semibold text-sm">Type</th>
                                        <th className="p-4 font-semibold text-sm">Purity</th>
                                        <th className="p-4 font-semibold text-sm text-right">Inflow (g)</th>
                                        <th className="p-4 font-semibold text-sm text-right">Outflow (g)</th>
                                        <th className="p-4 font-semibold text-sm text-right">Balance (g)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {goldLedger.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).reduce((acc, txn, index) => {
                                        const prevBalance = index === 0 ? 0 : acc.rows[index - 1].runningBalance;
                                        const runningBalance = prevBalance + (txn.type === 'Inflow' ? txn.weight : -txn.weight);
                                        acc.rows.push({ ...txn, runningBalance });
                                        return acc;
                                    }, { rows: [] }).rows.reverse().map((txn) => (
                                        <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="p-4 text-sm">
                                                <div>{new Date(txn.date).toLocaleDateString()}</div>
                                                <div className="text-gray-500 text-xs">{new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-600">{txn.transactionId}</td>
                                            <td className="p-4 text-sm">
                                                {txn.source === 'Manual' ? 'Manual Entry' : (txn.type === 'Inflow' ? 'Purchase/Return' : 'Sale')}
                                            </td>
                                            <td className="p-4 text-sm">{txn.purity}</td>
                                            <td className="p-4 text-sm text-right text-green-700 font-medium">
                                                {txn.type === 'Inflow' ? `${txn.weight.toFixed(2)}g` : '--'}
                                            </td>
                                            <td className="p-4 text-sm text-right text-red-700 font-medium">
                                                {txn.type === 'Outflow' ? `${txn.weight.toFixed(2)}g` : '--'}
                                            </td>
                                            <td className="p-4 text-sm text-right font-bold text-gray-800">
                                                {txn.runningBalance.toFixed(2)}g
                                            </td>
                                        </tr>
                                    ))}
                                    {goldLedger.length === 0 && (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No gold transactions recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}

            {/* 1. Add Expense Modal */}
            {isAddExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Record Expense</h2>
                            <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold outline-none"
                                    value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                                >
                                    <option value="Rent">Rent</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <div className="flex gap-4">
                                    {['Cash', 'Bank', 'Gold'].map(mode => (
                                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMode"
                                                value={mode}
                                                checked={expenseForm.paymentMode === mode}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                                                className="text-jw-gold focus:ring-jw-gold"
                                            />
                                            <span className="text-sm">{mode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number" required min="0" step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold outline-none text-lg font-medium"
                                    value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold outline-none"
                                    value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    placeholder="e.g. November office rent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold outline-none"
                                    value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                                <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-jw-gold hover:bg-yellow-600 text-white font-medium rounded-lg">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Add Cash Entry Modal */}
            {isAddCashEntryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
                            <h2 className="text-xl font-bold text-green-800">Manual Cash Entry</h2>
                            <button onClick={() => setIsAddCashEntryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCashEntry} className="p-6 space-y-4">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${cashEntryForm.type === 'Inflow' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setCashEntryForm({ ...cashEntryForm, type: 'Inflow' })}
                                >
                                    Cash Inflow
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${cashEntryForm.type === 'Outflow' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setCashEntryForm({ ...cashEntryForm, type: 'Outflow' })}
                                >
                                    Cash Outflow
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number" required min="0" step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-medium"
                                    value={cashEntryForm.amount} onChange={(e) => setCashEntryForm({ ...cashEntryForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    value={cashEntryForm.description} onChange={(e) => setCashEntryForm({ ...cashEntryForm, description: e.target.value })}
                                    placeholder={cashEntryForm.type === 'Inflow' ? 'e.g. Owner Capital Added' : 'e.g. Cash withdrawn for bank'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    value={cashEntryForm.date} onChange={(e) => setCashEntryForm({ ...cashEntryForm, date: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                                <button type="button" onClick={() => setIsAddCashEntryModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-jw-green hover:bg-[#1a3826] text-white font-medium rounded-lg">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Add Gold Entry Modal */}
            {isAddGoldEntryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
                            <h2 className="text-xl font-bold text-yellow-800">Manual Metal Entry</h2>
                            <button onClick={() => setIsAddGoldEntryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddGoldEntry} className="p-6 space-y-4">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${goldEntryForm.type === 'Inflow' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setGoldEntryForm({ ...goldEntryForm, type: 'Inflow' })}
                                >
                                    Gold Inflow (+)
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-shadow ${goldEntryForm.type === 'Outflow' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setGoldEntryForm({ ...goldEntryForm, type: 'Outflow' })}
                                >
                                    Gold Outflow (-)
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                                    <input
                                        type="number" required min="0" step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-lg"
                                        value={goldEntryForm.weight} onChange={(e) => setGoldEntryForm({ ...goldEntryForm, weight: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                        value={goldEntryForm.purity} onChange={(e) => setGoldEntryForm({ ...goldEntryForm, purity: e.target.value })}
                                    >
                                        <option value="24K">24K (99.9%)</option>
                                        <option value="22K">22K (91.6%)</option>
                                        <option value="18K">18K (75.0%)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Source</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                    value={goldEntryForm.description} onChange={(e) => setGoldEntryForm({ ...goldEntryForm, description: e.target.value })}
                                    placeholder={goldEntryForm.type === 'Inflow' ? 'e.g. Scraps received' : 'e.g. Sent to refinery'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                    value={goldEntryForm.date} onChange={(e) => setGoldEntryForm({ ...goldEntryForm, date: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                                <button type="button" onClick={() => setIsAddGoldEntryModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-jw-gold hover:bg-[#b38b36] text-white font-medium rounded-lg">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

