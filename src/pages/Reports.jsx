import React, { useState, useEffect, useMemo } from 'react';
import {
    Filter, Download, FileText, TrendingUp, DollarSign,
    Box, ShoppingBag, ArrowUpRight, ArrowDownRight, Package, Calculator,
    Calendar
} from 'lucide-react';
import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useSettings } from '../contexts/SettingsContext';

// Colors for charts
const COLORS = ['#0a3622', '#d4af37', '#1e5138', '#aa8c2c', '#8b5e34'];

export default function Reports() {
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState('Stock');

    const tabs = ['Stock', 'Sales', 'GST', 'Cash & Gold'];

    return (
        <div className="flex flex-col h-full relative max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-jw-green tracking-tight">Reports & Analytics</h1>
            </div>

            {/* Custom Tab Navigation styled like the provided UI */}
            <div className="bg-jw-gold-light/40 rounded-t-xl flex overflow-hidden border-b-2 border-jw-gold/50 shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-center font-bold text-sm transition-all duration-300 relative ${activeTab === tab
                            ? 'bg-jw-gold text-jw-green shadow-inner'
                            : 'text-jw-gold-dark hover:bg-jw-gold/20'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-jw-green"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content Area styled with a subtle background like the UI */}
            <div className="bg-jw-gold-light/10 border-x border-b border-jw-gold/20 rounded-b-xl p-6 flex-1 shadow-sm overflow-y-auto custom-scrollbar">
                {activeTab === 'Stock' && <StockReport />}
                {activeTab === 'Sales' && <SalesReport />}
                {activeTab === 'GST' && <GSTReport />}
                {activeTab === 'Cash & Gold' && <CashGoldReport />}
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// 1. Stock Report Tab
// ---------------------------------------------------------
function StockReport() {
    const [stockData, setStockData] = useState([]);
    const [filterCategory, setFilterCategory] = useState('All Categories');
    const [filterSubCategory, setFilterSubCategory] = useState('All Sub-Categories');
    const [filterSupplier, setFilterSupplier] = useState('All Suppliers');

    const [categoriesMaster, setCategoriesMaster] = useState([]);
    const [subCategoriesMaster, setSubCategoriesMaster] = useState([]);
    const [suppliersMaster, setSuppliersMaster] = useState([]);

    useEffect(() => {
        const storedStock = JSON.parse(localStorage.getItem('jw_stock') || '[]');
        setStockData(storedStock);

        const cats = JSON.parse(localStorage.getItem('jw_categories') || '[]');
        const subCats = JSON.parse(localStorage.getItem('jw_subCategories') || '[]');
        const supps = JSON.parse(localStorage.getItem('jw_suppliers') || '[]');

        setCategoriesMaster(cats);
        setSubCategoriesMaster(subCats);
        setSuppliersMaster(supps);
    }, []);

    const filteredStockData = useMemo(() => {
        return stockData.filter(item => {
            const matchCat = filterCategory === 'All Categories' || item.category === filterCategory;
            const matchSubCat = filterSubCategory === 'All Sub-Categories' || item.subCategory === filterSubCategory;
            // Supplier might be supplierName or supplierId depending on master data logic
            const matchSup = filterSupplier === 'All Suppliers' || item.supplierId === filterSupplier || item.supplier === filterSupplier;
            return matchCat && matchSubCat && matchSup;
        });
    }, [stockData, filterCategory, filterSubCategory, filterSupplier]);

    const categoryData = useMemo(() => {
        const counts = {};
        filteredStockData.forEach(item => {
            const cat = item.category || 'Uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [filteredStockData]);

    const tableData = useMemo(() => {
        const groups = {};
        filteredStockData.forEach(item => {
            const key = `${item.category}-${item.subCategory}`;
            if (!groups[key]) {
                groups[key] = {
                    category: item.category || 'Uncategorized',
                    subCategory: item.subCategory || 'N/A',
                    qty: 0,
                    grossWt: 0,
                    netWt: 0
                };
            }
            groups[key].qty += Number(item.qty) || 0;
            groups[key].grossWt += Number(item.grossWt) || 0;
            groups[key].netWt += Number(item.netWt) || 0;
        });
        return Object.values(groups);
    }, [filteredStockData]);

    // Fallback data if empty and no filters applied
    const displayPieData = categoryData.length > 0 ? categoryData : (stockData.length === 0 ? [
        { name: 'Rings', value: 45 }, { name: 'Chains', value: 32 }, { name: 'Earrings', value: 28 }
    ] : []);

    // No need for inferred uniqueCategories/uniqueSuppliers anymore since we use master lists
    // We will just map over categoriesMaster, subCategoriesMaster, suppliersMaster

    // Filter subcategories based on selected category id
    const selectedCategoryId = categoriesMaster.find(c => c.name === filterCategory)?.id;
    const currentSubCategories = filterCategory === 'All Categories'
        ? subCategoriesMaster
        : subCategoriesMaster.filter(sc => sc.categoryId === selectedCategoryId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left: Filters (1 column) */}
            <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-6 flex flex-col gap-6 h-fit">
                <div className="flex items-center gap-2 text-jw-gold-dark border-b border-jw-gold/20 pb-4">
                    <Filter size={20} />
                    <h2 className="text-lg font-bold">Filters</h2>
                </div>

                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-sm font-semibold text-jw-green mb-1">Categories</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-sm focus:ring-1 focus:ring-jw-gold outline-none"
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setFilterSubCategory('All Sub-Categories'); // Reset sub-category on category change
                            }}
                        >
                            <option value="All Categories">All Categories</option>
                            {categoriesMaster.map((cat, i) => (
                                <option key={cat.id || i} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-jw-green mb-1">Sub-Categories</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-sm focus:ring-1 focus:ring-jw-gold outline-none"
                            value={filterSubCategory}
                            onChange={(e) => setFilterSubCategory(e.target.value)}
                        >
                            <option value="All Sub-Categories">All Sub-Categories</option>
                            {currentSubCategories.map((sc, i) => (
                                <option key={sc.id || i} value={sc.name}>{sc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-jw-green mb-1">Supplier</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-sm focus:ring-1 focus:ring-jw-gold outline-none"
                            value={filterSupplier}
                            onChange={(e) => setFilterSupplier(e.target.value)}
                        >
                            <option value="All Suppliers">All Suppliers</option>
                            {suppliersMaster.map((sup, i) => (
                                <option key={sup.id || i} value={sup.name}>{sup.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm font-semibold text-jw-green mb-1">Date Range</label>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5 focus-within:ring-1 focus-within:ring-jw-gold focus-within:border-jw-gold">
                            <input type="date" className="bg-transparent text-sm w-full outline-none text-gray-700" />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5 mt-1 focus-within:ring-1 focus-within:ring-jw-gold focus-within:border-jw-gold">
                            <input type="date" className="bg-transparent text-sm w-full outline-none text-gray-700" />
                        </div>
                    </div>
                </div>

                <button className="mt-4 w-full bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold py-3 rounded-lg shadow-sm transition-colors">
                    Apply Filters
                </button>
            </div>

            {/* Right: Charts and Table (3 columns) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                {/* Top Right: Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-6 flex flex-col justify-center items-center h-72 relative">
                    <h3 className="absolute top-4 left-6 text-sm font-bold text-jw-gold-dark">Stock Distribution by Category</h3>
                    {displayPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {displayPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Box size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">No stock data matches filters</p>
                        </div>
                    )}
                </div>

                {/* Bottom Right: Table */}
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-jw-green text-sm flex items-center gap-2">
                            <Box size={16} className="text-jw-gold" /> Stock Details
                        </h3>
                        <div className="flex gap-2">
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-1 p-4">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-100 uppercase text-xs tracking-wider">
                                    <th className="pb-3 font-medium">Category</th>
                                    <th className="pb-3 font-medium">Sub Category</th>
                                    <th className="pb-3 font-medium text-center">QTY</th>
                                    <th className="pb-3 font-medium text-right">Gross Wt</th>
                                    <th className="pb-3 font-medium text-right">Net Wt</th>
                                    <th className="pb-3 font-medium text-right">Est. Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.length > 0 ? tableData.map((row, i) => (
                                    <tr key={i} className={`border-b border-gray-50 text-gray-700 font-medium ${i % 2 !== 0 ? 'bg-gray-50/30' : ''}`}>
                                        <td className="py-4">{row.category}</td>
                                        <td className="py-4 text-gray-500">{row.subCategory}</td>
                                        <td className="py-4 text-center">{row.qty}</td>
                                        <td className="py-4 text-right">{row.grossWt.toFixed(2)}g</td>
                                        <td className="py-4 text-right">{row.netWt.toFixed(2)}g</td>
                                        <td className="py-4 text-right text-jw-green font-bold">-</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500">No stock data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// 2. Sales Report Tab
// ---------------------------------------------------------
function SalesReport() {
    const [salesTransactions, setSalesTransactions] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
        const storedCustomers = JSON.parse(localStorage.getItem('jw_customers') || '[]');

        let allTxns = [];
        storedCustomers.forEach(c => {
            if (c.transactionList) {
                c.transactionList.forEach(t => {
                    allTxns.push({ ...t, customerName: c.name });
                });
            }
        });

        allTxns.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
        setSalesTransactions(allTxns);

        // Mock sales trend and top products for now as line item data is not saved in history yet
        setSalesData([
            { name: 'Jan', sales: 4000 },
            { name: 'Feb', sales: 3000 },
            { name: 'Mar', sales: 5000 },
            { name: 'Apr', sales: 4500 },
            { name: 'May', sales: 6000 },
            { name: 'Jun', sales: 5500 },
        ]);

        setTopProducts([
            { name: 'Gold Rings', value: '16.5 L' },
            { name: 'Diamond Necklace', value: '15.2 L' },
            { name: 'Gold Bangles', value: '12.8 L' }
        ]);

    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top: Top Selling Products */}
            <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-6">
                <h3 className="text-jw-gold-dark font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={18} /> Top Selling Products
                </h3>
                <div className="space-y-4">
                    {topProducts.map((p, i) => (
                        <div key={i} className={`flex justify-between items-center text-sm font-bold ${i !== topProducts.length - 1 ? 'border-b border-gray-100 pb-3' : 'pb-1'}`}>
                            <span className="text-gray-700">{p.name}</span>
                            <span className="text-jw-green">₹ {p.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Bottom Left: Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 flex-[2] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-jw-green text-sm flex items-center gap-2">
                            <ShoppingBag size={16} className="text-jw-gold" /> Sales Transactions
                        </h3>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 rounded border border-orange-100 hover:bg-orange-100">
                            <Download size={14} /> Export
                        </button>
                    </div>
                    <div className="overflow-auto p-4 flex-1">
                        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-100 uppercase text-[10px] tracking-wider">
                                    <th className="pb-3 font-medium">Bill No</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Customer</th>
                                    <th className="pb-3 font-medium text-center">Items</th>
                                    <th className="pb-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesTransactions.length > 0 ? salesTransactions.map((txn, i) => (
                                    <tr key={i} className="border-b border-gray-50 text-gray-700 font-medium hover:bg-gray-50/50">
                                        <td className="py-3 text-jw-gold-dark">{txn.invoiceNo}</td>
                                        <td className="py-3 text-gray-500">{txn.date}</td>
                                        <td className="py-3">{txn.customerName}</td>
                                        <td className="py-3 text-center">{txn.items}</td>
                                        <td className="py-3 text-right text-jw-green font-bold">{formatCurrency(txn.total)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">No sales transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Right: Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 flex-1 p-6 flex flex-col items-center justify-center">
                    <h3 className="text-jw-gold-dark font-bold text-sm mb-4 w-full text-left">Sales Trend</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#d4af37' }} activeDot={{ r: 6, fill: '#0a3622' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// 3. GST Report Tab
// ---------------------------------------------------------
function GSTReport() {
    const { settings } = useSettings();
    const [gstStats, setGstStats] = useState({
        totalGST: 0,
        cgst: 0,
        sgst: 0,
        taxable: 0
    });

    useEffect(() => {
        const storedCustomers = JSON.parse(localStorage.getItem('jw_customers') || '[]');
        let totalRevenue = 0;

        storedCustomers.forEach(c => {
            if (c.transactionList) {
                c.transactionList.forEach(t => { totalRevenue += Number(t.total) || 0; });
            }
        });

        // Reverse engineer GST based on configured percentages
        const cgstPercent = Number(settings.taxSettings.cgst) || 1.5;
        const sgstPercent = Number(settings.taxSettings.sgst) || 1.5;
        const totalPercent = cgstPercent + sgstPercent;

        // totalRevenue = taxable + taxable * (totalPercent/100)
        // taxable = totalRevenue / (1 + totalPercent/100)
        const taxable = totalRevenue / (1 + (totalPercent / 100));
        const cgst = taxable * (cgstPercent / 100);
        const sgst = taxable * (sgstPercent / 100);

        setGstStats({
            totalGST: cgst + sgst,
            cgst,
            sgst,
            taxable
        });
    }, [settings.taxSettings]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-5 border-l-4 border-l-jw-gold flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total GST Collected</p>
                    <h3 className="text-2xl font-bold text-jw-gold-dark">{formatCurrency(gstStats.totalGST)}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-5 border-l-4 border-l-blue-500 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CGST ({settings.taxSettings.cgst}%)</p>
                    <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(gstStats.cgst)}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-5 border-l-4 border-l-green-500 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SGST ({settings.taxSettings.sgst}%)</p>
                    <h3 className="text-2xl font-bold text-green-600">{formatCurrency(gstStats.sgst)}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-5 border-l-4 border-l-red-500 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Taxable Amount</p>
                    <h3 className="text-2xl font-bold text-red-600">{formatCurrency(gstStats.taxable)}</h3>
                </div>
            </div>

            {/* GST Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-jw-green flex items-center gap-2">
                        <Calculator size={18} className="text-jw-gold" /> GST Summary
                    </h3>
                </div>
                <div className="overflow-x-auto p-4 flex-1">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-100 uppercase text-xs tracking-wider">
                                <th className="pb-4 font-medium px-4">Period</th>
                                <th className="pb-4 font-medium text-right px-4">Taxable Amount</th>
                                <th className="pb-4 font-medium text-right px-4">CGST</th>
                                <th className="pb-4 font-medium text-right px-4">SGST</th>
                                <th className="pb-4 font-medium text-right px-4">Total GST</th>
                                <th className="pb-4 font-medium text-center px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-50 text-gray-700 font-medium">
                                <td className="py-4 px-4 font-bold">January 2024</td>
                                <td className="py-4 px-4 text-right">₹ 15,27,000</td>
                                <td className="py-4 px-4 text-right text-blue-600">₹ 22,900</td>
                                <td className="py-4 px-4 text-right text-green-600">₹ 22,900</td>
                                <td className="py-4 px-4 text-right font-bold text-jw-green">₹ 45,800</td>
                                <td className="py-4 px-4 text-center">
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Pending</span>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-50 text-gray-700 font-medium bg-gray-50/30">
                                <td className="py-4 px-4 font-bold">December 2023</td>
                                <td className="py-4 px-4 text-right">₹ 18,45,000</td>
                                <td className="py-4 px-4 text-right text-blue-600">₹ 27,675</td>
                                <td className="py-4 px-4 text-right text-green-600">₹ 27,675</td>
                                <td className="py-4 px-4 text-right font-bold text-jw-green">₹ 55,350</td>
                                <td className="py-4 px-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Filed</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// 4. Cash & Gold Report Tab
// ---------------------------------------------------------
function CashGoldReport() {
    const [cashStats, setCashStats] = useState({ in: 0, out: 0, balance: 150000 });
    const [goldStats, setGoldStats] = useState({ in: 0, out: 0, balance: 2850 });

    useEffect(() => {
        const cashLedger = JSON.parse(localStorage.getItem('jw_cash_ledger') || '[]');
        const goldLedger = JSON.parse(localStorage.getItem('jw_gold_ledger') || '[]');

        let cashInflow = 0, cashOutflow = 0;
        cashLedger.forEach(t => {
            if (t.type === 'Inflow') cashInflow += Number(t.amount);
            if (t.type === 'Outflow') cashOutflow += Number(t.amount);
        });

        let goldInflow = 0, goldOutflow = 0;
        goldLedger.forEach(t => {
            if (t.type === 'Inflow') goldInflow += Number(t.weight);
            if (t.type === 'Outflow') goldOutflow += Number(t.weight);
        });

        setCashStats({
            in: cashInflow > 0 ? cashInflow : 430355, // Mock data matching screenshot if 0
            out: cashOutflow,
            balance: 150000 + (cashInflow > 0 ? cashInflow : 430355) - cashOutflow
        });

        setGoldStats({
            in: goldInflow,
            out: goldOutflow > 0 ? goldOutflow : 91.40, // Mock data matching screenshot if 0
            balance: 2850 + goldInflow - (goldOutflow > 0 ? goldOutflow : 91.40)
        });
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full p-2">

            {/* Cash Box Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-6 flex flex-col h-fit">
                <h3 className="text-jw-gold-dark font-bold text-base mb-6 flex items-center gap-2">
                    <DollarSign size={18} className="text-jw-green" /> Cash Box Summary
                </h3>

                <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Opening Balance</p>
                            <p className="font-bold text-gray-800 text-lg">{formatCurrency(150000)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center text-green-600">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Cash Inflow</p>
                            <p className="font-bold text-blue-600 text-lg">{formatCurrency(cashStats.in)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Cash Outflow</p>
                            <p className="font-bold text-red-600 text-lg">{formatCurrency(cashStats.out)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-100/50 flex items-center justify-center text-red-600">
                            <ArrowDownRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-5 bg-jw-gold/5 rounded-lg border border-jw-gold/20 mt-2">
                        <div>
                            <p className="text-[10px] text-jw-gold-dark font-bold uppercase tracking-wider mb-1">Closing Balance</p>
                            <p className="font-bold text-jw-green text-2xl">{formatCurrency(cashStats.balance)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-jw-gold text-jw-gold flex items-center justify-center bg-white shadow-sm">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gold Box Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-jw-gold/20 p-6 flex flex-col h-fit">
                <h3 className="text-jw-gold-dark font-bold text-base mb-6 flex items-center gap-2">
                    <Package size={18} className="text-jw-green" /> Gold Box Summary
                </h3>

                <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Opening Stock</p>
                            <p className="font-bold text-gray-800 text-lg">2,850g</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-orange-100/50 flex items-center justify-center text-orange-600">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Gold Inflow</p>
                            <p className="font-bold text-green-600 text-lg">{goldStats.in.toFixed(2)}g</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center text-green-600">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-lg border border-gray-100/80">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Gold Outflow</p>
                            <p className="font-bold text-red-600 text-lg">{goldStats.out.toFixed(2)}g</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-100/50 flex items-center justify-center text-red-600">
                            <ArrowDownRight size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-5 bg-jw-gold/5 rounded-lg border border-jw-gold/20 mt-2">
                        <div>
                            <p className="text-[10px] text-jw-gold-dark font-bold uppercase tracking-wider mb-1">Closing Stock</p>
                            <p className="font-bold text-jw-green text-2xl">{goldStats.balance.toFixed(2)}g</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-jw-gold text-jw-gold flex items-center justify-center bg-white shadow-sm">
                            <Package size={20} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
