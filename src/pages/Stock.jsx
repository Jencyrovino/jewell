import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, AlertCircle, Package, Scale, IndianRupee, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Default dummy stock if empty
const defaultStock = [
    { id: 1, product: 'Gold Chain 22K', category: 'Chains', subCategory: 'Rope Chain', quantity: 10, touch: 91.6, stoneWt: 0.70, grossWt: 25.50, netWt: 24.80, purity: '22K', supplierWastage: 2, profitPercentage: 10, huid: '123ABC89', hallmarkCharge: 200, value: 155250, supplier: 'Hari' },
    { id: 2, product: 'Gold Bracelet 22K', category: 'Bracelets', subCategory: 'Ladies Bracelet', quantity: 10, touch: 91.6, stoneWt: 0.00, grossWt: 15.20, netWt: 15.20, purity: '22K', supplierWastage: 2, profitPercentage: 12, huid: 'BRC45612', hallmarkCharge: 200, value: 92450, supplier: 'David' },
    { id: 3, product: 'Diamond Ring 18K', category: 'Rings', subCategory: 'Ladies Ring', quantity: 5, touch: 75.0, stoneWt: 0.70, grossWt: 8.20, netWt: 7.50, purity: '18K', supplierWastage: 1, profitPercentage: 15, huid: 'XYZ78945', hallmarkCharge: 200, value: 85500, supplier: 'David' },
    { id: 4, product: 'Gold Bangle Set', category: 'Bangles', subCategory: '', quantity: 4, touch: 91.6, stoneWt: 1.20, grossWt: 45.30, netWt: 44.10, purity: '22K', supplierWastage: 2.5, profitPercentage: 8, huid: 'BGL99901', hallmarkCharge: 200, value: 275800, supplier: 'Jessica' },
    { id: 5, product: 'Gold Stud Earrings', category: 'Earrings', subCategory: '', quantity: 8, touch: 91.6, stoneWt: 0.00, grossWt: 4.50, netWt: 4.50, purity: '22K', supplierWastage: 1.5, profitPercentage: 10, huid: 'EAR11122', hallmarkCharge: 200, value: 31000, supplier: 'Hari' },
];

export default function Stock() {
    // State management
    const [stockItems, setStockItems] = useState(() => {
        const saved = localStorage.getItem('jw_stock');
        return saved ? JSON.parse(saved) : defaultStock;
    });

    // Reference data from Master Data
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Load master data
    useEffect(() => {
        const savedCats = localStorage.getItem('jw_categories');
        const savedSubCats = localStorage.getItem('jw_subCategories');
        const savedSupps = localStorage.getItem('jw_suppliers');

        if (savedCats) setCategories(JSON.parse(savedCats));
        if (savedSubCats) setSubCategories(JSON.parse(savedSubCats));
        if (savedSupps) setSuppliers(JSON.parse(savedSupps));
    }, []);

    // Persist stock changes
    useEffect(() => {
        localStorage.setItem('jw_stock', JSON.stringify(stockItems));
    }, [stockItems]);



    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    // Initial empty item state
    const initialItemState = {
        product: '', category: '', subCategory: '', purity: '22K', quantity: 1,
        touch: '', stoneWt: '', grossWt: '', netWt: '',
        supplierWastage: '', profitPercentage: '', huid: '', hsnCode: '',
        makingChargeType: 'per_gram', makingCharge: '',
        hallmarkCharge: 200, value: '', supplier: ''
    };
    const [currentItem, setCurrentItem] = useState(initialItemState);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // Metrics Calculation
    const metrics = useMemo(() => {
        let totalItems = stockItems.length;
        let totalWeight = stockItems.reduce((acc, item) => acc + (Number(item.netWt) || 0), 0);
        let stockValue = stockItems.reduce((acc, item) => acc + (Number(item.value) || 0), 0);

        // Low stock threshold is quantity <= 3
        let lowStockCount = stockItems.filter(item => Number(item.quantity) <= 3).length;

        return {
            totalItems,
            totalWeight: totalWeight.toFixed(2),
            stockValue: stockValue.toFixed(2),
            lowStockCount
        };
    }, [stockItems]);

    // Filtered items
    const filteredStock = useMemo(() => {
        return stockItems.filter(item => {
            const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            const matchesLowStock = showLowStockOnly ? Number(item.quantity) <= 3 : true;
            return matchesSearch && matchesCategory && matchesLowStock;
        });
    }, [stockItems, searchTerm, categoryFilter, showLowStockOnly]);

    // Derived sub-categories for modal dropdown based on selected category
    const availableSubCategories = useMemo(() => {
        const selectedCatObj = categories.find(c => c.name === currentItem.category);
        if (!selectedCatObj) return [];
        return subCategories.filter(sc => sc.categoryId === selectedCatObj.id);
    }, [currentItem.category, categories, subCategories]);

    // Handlers
    const handleOpenAddModal = () => {
        setModalMode('add');
        setCurrentItem(initialItemState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        setModalMode('edit');
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this stock item?")) {
            setStockItems(stockItems.filter(item => item.id !== id));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();

        // Basic validation
        if (!currentItem.product || !currentItem.category) {
            alert("Product Name and Category are required.");
            return;
        }

        // Apply formulas
        const grossWtNum = Number(currentItem.grossWt) || 0;
        const stoneWtNum = Number(currentItem.stoneWt) || 0;
        const netWtNum = grossWtNum - stoneWtNum;

        const calculatedPurity = (netWtNum * (Number(currentItem.touch) || 0)) / 100;
        const finalPurity = (netWtNum * (Number(currentItem.supplierWastage) || 0)) / 100;
        const finalBillPurity = (netWtNum * (Number(currentItem.profitPercentage) || 0)) / 100;

        const formattedItem = {
            ...currentItem,
            quantity: Number(currentItem.quantity) || 1,
            grossWt: grossWtNum,
            stoneWt: stoneWtNum,
            netWt: netWtNum,
            calculatedPurity, // Purity = (Net Weight * Product Touch / 100)
            finalPurity,      // Final purity = (Net Weight * Supplier Wastage / 100)
            finalBillPurity,  // Final Bill Purity = (Net Weight * Profit % / 100)
            hallmarkCharge: Number(currentItem.hallmarkCharge) || 0,
            value: Number(currentItem.value) || 0,
            makingCharge: Number(currentItem.makingCharge) || 0,
        };

        if (modalMode === 'add') {
            setStockItems([...stockItems, { ...formattedItem, id: Date.now() }]);
        } else {
            setStockItems(stockItems.map(item => item.id === currentItem.id ? formattedItem : item));
        }
        setIsModalOpen(false);
    };

    // Format Indian Rupee
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-jw-gold-dark">Stock Management</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green px-5 py-2.5 rounded-lg font-bold transition-colors shadow-md"
                >
                    <Plus size={18} /> Add New Stock
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<Package className="text-jw-green" />} title="Total Items" value={metrics.totalItems} suffix="pcs" />
                <MetricCard icon={<Scale className="text-jw-green" />} title="Total Weight" value={metrics.totalWeight} suffix="g" />
                <MetricCard icon={<IndianRupee className="text-jw-green" />} title="Stock Value" value={formatCurrency(metrics.stockValue)} />
                <MetricCard
                    icon={<AlertCircle className="text-red-500" />}
                    title="Low Stock Items"
                    value={metrics.lowStockCount}
                    alert={metrics.lowStockCount > 0 || showLowStockOnly}
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    isActive={showLowStockOnly}
                />
            </div>

            {/* Main Inventory Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex-1 flex flex-col">
                {/* Inventory Header / Controls */}
                <div className="bg-jw-green/5 border-b border-jw-gold/30 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-xl font-bold text-jw-green">Stock Inventory</h2>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter size={16} className="text-gray-500" />
                            <select
                                className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jw-gold cursor-pointer bg-white"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                                <th className="py-3 px-6 font-semibold text-sm">Product</th>
                                <th className="py-3 px-6 font-semibold text-sm">Category</th>
                                <th className="py-3 px-6 font-semibold text-sm text-center">Qty</th>
                                <th className="py-3 px-6 font-semibold text-sm text-center">HUID</th>
                                <th className="py-3 px-6 font-semibold text-sm text-right">Gross WT</th>
                                <th className="py-3 px-6 font-semibold text-sm text-right">Net WT</th>
                                <th className="py-3 px-6 font-semibold text-sm text-center">Touch %</th>
                                <th className="py-3 px-6 font-semibold text-sm text-right">Value (Rs)</th>
                                <th className="py-3 px-6 font-semibold text-sm text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStock.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-jw-gold/5 transition-colors">
                                    <td className="py-3 px-6 text-gray-800 font-medium">{item.product}</td>
                                    <td className="py-3 px-6 text-gray-600">{item.category}</td>
                                    <td className="py-3 px-6 text-gray-600 text-center">{item.quantity}</td>
                                    <td className="py-3 px-6 text-gray-500 text-sm font-mono text-center">{item.huid || '-'}</td>
                                    <td className="py-3 px-6 text-gray-800 text-right font-mono">{Number(item.grossWt).toFixed(2)}g</td>
                                    <td className="py-3 px-6 text-jw-green text-right font-bold font-mono">{Number(item.netWt).toFixed(2)}g</td>
                                    <td className="py-3 px-6 text-center">
                                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-700 border border-gray-200">
                                            {item.touch ? `${item.touch}%` : item.purity}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-gray-800 text-right font-medium">{formatCurrency(item.value).replace('₹', '')}</td>
                                    <td className="py-3 px-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStock.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-500">
                                        No stock items found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] h-[95vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-green/5 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-jw-green">{modalMode === 'add' ? 'Add New Stock / Purchase Entry' : 'Edit Stock Item'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        {/* Form Area and Footer Wrapper */}
                        <form id="stockForm" onSubmit={handleSave} className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
                            {/* Form Details Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-r border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                    {/* Product Info */}
                                    <div className="col-span-full md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                                        <input
                                            type="text" required autoFocus
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.product} onChange={e => setCurrentItem({ ...currentItem, product: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                                        <input
                                            type="number" required min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                        />
                                    </div>

                                    {/* Classification */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                                        <select
                                            required className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.category}
                                            onChange={e => setCurrentItem({ ...currentItem, category: e.target.value, subCategory: '' })}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold disabled:bg-gray-100"
                                            value={currentItem.subCategory}
                                            onChange={e => setCurrentItem({ ...currentItem, subCategory: e.target.value })}
                                            disabled={!currentItem.category || availableSubCategories.length === 0}
                                        >
                                            <option value="">Select Sub-Category</option>
                                            {availableSubCategories.map(subCat => <option key={subCat.id} value={subCat.name}>{subCat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sourced Supplier</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.supplier} onChange={e => setCurrentItem({ ...currentItem, supplier: e.target.value })}
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(sup => <option key={sup.id} value={sup.name}>{sup.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Codes */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">HUID <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="text" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold uppercase font-mono"
                                            value={currentItem.huid} onChange={e => setCurrentItem({ ...currentItem, huid: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="text" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.hsnCode} onChange={e => setCurrentItem({ ...currentItem, hsnCode: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1"></div> {/* Spacer */}

                                    {/* Weights Divider */}
                                    <div className="col-span-full border-t border-gray-100 mt-2 pt-4">
                                        <h3 className="text-sm font-bold text-jw-gold-dark mb-4">Weight Calculation</h3>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (g)*</label>
                                        <input
                                            type="number" step="0.001" min="0" required
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold font-mono"
                                            value={currentItem.grossWt} onChange={e => setCurrentItem({ ...currentItem, grossWt: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stone Weight (g)</label>
                                        <input
                                            type="number" step="0.001" min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold font-mono"
                                            value={currentItem.stoneWt} onChange={e => setCurrentItem({ ...currentItem, stoneWt: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight (auto)</label>
                                        <input
                                            type="number" disabled
                                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded font-mono text-jw-green font-bold shadow-inner"
                                            value={((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)).toFixed(3)}
                                        />
                                    </div>

                                    {/* Purity Divider */}
                                    <div className="col-span-full border-t border-gray-100 mt-2 pt-4">
                                        <h3 className="text-sm font-bold text-jw-gold-dark mb-4">Purity & Touch Details</h3>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Touch (%)*</label>
                                        <input
                                            type="number" step="0.01" min="0" max="100" required
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.touch} onChange={e => setCurrentItem({ ...currentItem, touch: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Wastage (%)</label>
                                        <input
                                            type="number" step="0.01" min="0" max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.supplierWastage} onChange={e => setCurrentItem({ ...currentItem, supplierWastage: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Profit % <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="number" step="0.01" min="0" max="100"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.profitPercentage} onChange={e => setCurrentItem({ ...currentItem, profitPercentage: e.target.value })}
                                        />
                                    </div>

                                    {/* Derived Purity Stats (Read Only) */}
                                    <div className="col-span-full flex flex-wrap gap-4 mt-2 mb-4">
                                        <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded border border-blue-100 flex-1 min-w-0 flex flex-col items-center">
                                            <span className="opacity-70 mb-1 text-center">Calculated Purity</span>
                                            <span className="font-bold font-mono">{(((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)) * (Number(currentItem.touch) || 0) / 100).toFixed(3)}g</span>
                                        </div>
                                        <div className="bg-orange-50 text-orange-800 text-xs px-3 py-2 rounded border border-orange-100 flex-1 min-w-0 flex flex-col items-center">
                                            <span className="opacity-70 mb-1 text-center">Final Purity (Wastage)</span>
                                            <span className="font-bold font-mono">{(((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)) * (Number(currentItem.supplierWastage) || 0) / 100).toFixed(3)}g</span>
                                        </div>
                                        <div className="bg-green-50 text-green-800 text-xs px-3 py-2 rounded border border-green-100 flex-1 min-w-0 flex flex-col items-center">
                                            <span className="opacity-70 mb-1 text-center">Final Bill Purity (Profit)</span>
                                            <span className="font-bold font-mono">{(((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)) * (Number(currentItem.profitPercentage) || 0) / 100).toFixed(3)}g</span>
                                        </div>
                                    </div>

                                    {/* Charges */}
                                    <div className="col-span-full border-t border-gray-100 pt-4">
                                        <h3 className="text-sm font-bold text-jw-gold-dark mb-4">Charges & Valuation</h3>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge Type</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.makingChargeType} onChange={e => setCurrentItem({ ...currentItem, makingChargeType: e.target.value })}
                                        >
                                            <option value="per_gram">Per Gram</option>
                                            <option value="per_piece">Per Piece</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge (₹)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                            value={currentItem.makingCharge} onChange={e => setCurrentItem({ ...currentItem, makingCharge: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Est. Display Value (₹)</label>
                                        <input
                                            type="number" step="1" min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold text-jw-green font-bold"
                                            value={currentItem.value} onChange={e => setCurrentItem({ ...currentItem, value: e.target.value })}
                                        />
                                    </div>

                                </div>

                                {/* Action Buttons inside Form */}
                                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3 md:hidden">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer">Cancel</button>
                                    <button type="submit" form="stockForm" className="px-5 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded-lg transition-colors cursor-pointer shadow-sm">Save Stock</button>
                                </div>
                            </div>

                            {/* Sidebar / QR Code Area */}
                            <div className="w-full lg:w-72 bg-gray-50 flex flex-col items-center justify-start p-6 border-t md:border-t-0 md:border-l border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6 flex items-center gap-2"><QrCode size={16} /> QR Tag Preview</h3>

                                <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-xl mb-6 text-center w-full max-w-[200px]">
                                    <div className="mb-3 bg-white mx-auto flex justify-center">
                                        <QRCodeSVG
                                            value={JSON.stringify({
                                                id: currentItem.id || 'NEW',
                                                name: currentItem.product,
                                                netWt: ((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)).toFixed(2),
                                                huid: currentItem.huid
                                            })}
                                            size={120}
                                        />
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm truncate w-full px-2">{currentItem.product || 'Product Name'}</h4>
                                    <p className="text-xs text-gray-500 font-mono mt-1 mb-2">
                                        WT: {((Number(currentItem.grossWt) || 0) - (Number(currentItem.stoneWt) || 0)).toFixed(2)}g | {currentItem.touch ? `${currentItem.touch}%` : currentItem.purity}
                                    </p>
                                    {currentItem.huid && <p className="text-xs bg-gray-100 rounded px-2 py-1 font-mono">{currentItem.huid}</p>}
                                </div>

                                <button type="button" className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm mb-auto">
                                    <Printer size={16} /> Print QR Tag
                                </button>

                                {/* Action Buttons for Desktop */}
                                <div className="hidden md:flex flex-col w-full gap-3 mt-8 pt-6 border-t border-gray-200">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer">Cancel</button>
                                    <button type="submit" form="stockForm" className="w-full py-2.5 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded-lg transition-colors cursor-pointer shadow-sm">Save Stock Entry</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// Small UI Component for Summary Cards
function MetricCard({ title, value, icon, suffix = '', alert = false, onClick, isActive = false }) {
    return (
        <div
            onClick={onClick}
            className={`bg-[#fdf6e3] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all hover:shadow-md ${alert ? 'border-red-400 bg-red-50' : 'border-jw-gold/40'} ${isActive ? 'ring-2 ring-red-500 bg-red-50' : ''} ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`p-3 rounded-lg ${alert || isActive ? 'bg-red-100' : 'bg-white shadow-sm border border-jw-gold/20'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-semibold mb-1 ${alert ? 'text-red-600' : 'text-jw-gold-dark'}`}>{title}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-800'}`}>{value}</h3>
                    {suffix && <span className="text-gray-600 font-medium text-sm">{suffix}</span>}
                </div>
            </div>
        </div>
    );
}
