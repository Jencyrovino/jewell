import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Trash2, Printer, CheckCircle, UserPlus, FileText, X, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../contexts/SettingsContext';

const defaultCustomers = [
    { id: 1, name: 'Hari', phone: '8965432012', paymentMode: 'Cash', gstin: '27AAAAP0267H2ZN', transactions: 5 },
    { id: 2, name: 'David', phone: '7965435010', paymentMode: 'UPI', gstin: '29AAAAP0267H1ZK', transactions: 2 },
    { id: 3, name: 'Jessica', phone: '9969432082', paymentMode: 'Cash', gstin: '30AAAAP0267H1Z1', transactions: 1 },
    { id: 4, name: 'Taylor', phone: '4965432019', paymentMode: 'Gold', gstin: '07AAACC1206D1Z1', transactions: 8 },
];

export default function Billing() {
    const location = useLocation();
    const { settings } = useSettings();

    // Master Data
    const [customers, setCustomers] = useState([]);
    const [stockItems, setStockItems] = useState([]);

    useEffect(() => {
        const loadData = () => {
            const savedCustomers = localStorage.getItem('jw_customers');
            const savedStock = localStorage.getItem('jw_stock');

            if (savedCustomers) {
                setCustomers(JSON.parse(savedCustomers));
            } else {
                setCustomers(defaultCustomers);
                localStorage.setItem('jw_customers', JSON.stringify(defaultCustomers));
            }

            if (savedStock) setStockItems(JSON.parse(savedStock));
        };

        loadData();

        window.addEventListener('jw_customers_updated', loadData);
        window.addEventListener('jw_stock_updated', loadData);

        return () => {
            window.removeEventListener('jw_customers_updated', loadData);
            window.removeEventListener('jw_stock_updated', loadData);
        };
    }, []);

    // Billing State
    const [cartItems, setCartItems] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState([]);

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [isEstimation, setIsEstimation] = useState(false);

    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [linkedOrderId, setLinkedOrderId] = useState(null);

    // Handle incoming order conversion
    useEffect(() => {
        if (location.state && location.state.convertFromOrder && location.state.orderData) {
            const orderData = location.state.orderData;
            setLinkedOrderId(orderData.id);
            setSelectedCustomer(orderData.customerId);
            setAdvanceAmount(Number(orderData.advanceAmount) || 0);

            // Populate cart with custom order as a placeholder item
            if (cartItems.length === 0) {
                setCartItems([{
                    id: Date.now(),
                    stockId: `ORD-${orderData.id}`,
                    product: orderData.productType,
                    grossWt: Number(orderData.weight) || 0,
                    netWt: Number(orderData.weight) || 0,
                    purity: '22K',
                    touch: 91.6,
                    wastage: 0,
                    makingCharge: 0,
                    makingChargeType: 'per_gram',
                    paymentMode: 'Cash',
                    baseValue: 0,
                    isCustomOrder: true
                }]);
            }

            // Clear state so refresh doesn't trigger again
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // New Customer Modal
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', paymentMode: 'Cash', gstin: '' });

    const handleSaveNewCustomer = (e) => {
        e.preventDefault();
        const customerToSave = {
            ...newCustomer,
            id: Date.now(),
            transactions: 0
        };
        const updatedCustomers = [...customers, customerToSave];
        setCustomers(updatedCustomers);
        localStorage.setItem('jw_customers', JSON.stringify(updatedCustomers));
        window.dispatchEvent(new CustomEvent('jw_customers_updated'));
        setSelectedCustomer(customerToSave.id.toString());
        setIsCustomerModalOpen(false);
        setNewCustomer({ name: '', phone: '', paymentMode: 'Cash', gstin: '' });
    };

    // Search Stock
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResult([]);
            return;
        }
        const term = searchQuery.toLowerCase();
        const results = stockItems.filter(item =>
            item.product.toLowerCase().includes(term) ||
            (item.huid && item.huid.toLowerCase().includes(term))
        );
        setSearchResult(results);
    }, [searchQuery, stockItems]);

    // Handle Add Item to Cart
    const handleAddToCart = (item) => {
        // Prevent double adding
        if (cartItems.some(cItem => cItem.stockId === item.id)) {
            alert("Item already in cart.");
            return;
        }

        const newCartItem = {
            id: Date.now(),
            stockId: item.id,
            product: item.product,
            grossWt: Number(item.grossWt) || 0,
            netWt: Number(item.netWt) || 0,
            purity: item.purity,
            touch: item.touch,
            // Billing editable fields
            wastage: Number(item.supplierWastage) || 0,
            makingCharge: Number(item.makingCharge) || 0,
            makingChargeType: item.makingChargeType || 'per_gram',
            paymentMode: 'Cash', // Default
            baseValue: Number(item.value) || 0,
        };
        setCartItems([...cartItems, newCartItem]);
        setSearchQuery(''); // Clear search after adding
    };

    // Update Cart Item
    const updateCartItem = (id, field, value) => {
        setCartItems(cartItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Remove Cart Item
    const removeCartItem = (id) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    // Calculations
    const calculateRowAmount = (item) => {
        // Simple logic combining base value, wastage impact, and making charges
        // (In a real app, this formula might be more complex linking actual daily gold rates)
        let amount = item.baseValue;

        // Add making charge
        if (item.makingChargeType === 'per_gram') {
            amount += (item.makingCharge * item.netWt);
        } else {
            amount += item.makingCharge;
        }

        // Add wastage equivalent (rough representation, assuming baseValue includes base purity price)
        const wastageValue = (item.baseValue * (Number(item.wastage) / 100));
        amount += wastageValue;

        return amount;
    };

    const subtotal = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + calculateRowAmount(item), 0);
    }, [cartItems]);

    const gstPercent = (Number(settings.taxSettings.cgst) || 0) + (Number(settings.taxSettings.sgst) || 0);
    const gst = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gst;
    const finalPayable = Math.max(0, grandTotal - advanceAmount);

    // Formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Actions
    const handleGenerateEstimation = () => {
        if (cartItems.length === 0) return alert("Cart is empty.");

        const customerData = selectedCustomer ? customers.find(c => c.id.toString() === selectedCustomer.toString()) : { name: 'Walk-in Customer', phone: 'N/A' };

        setReceiptData({
            type: "Estimation",
            customer: customerData || { name: 'Walk-in Customer', phone: 'N/A' },
            invoiceNo: "EST-" + Date.now().toString().slice(-6),
            date: new Date().toLocaleDateString('en-IN'),
            items: [...cartItems],
            subtotal,
            gst,
            advanceAmount,
            grandTotal,
            finalPayable
        });
        setShowReceipt(true);
    };

    const handleGenerateFinalBill = () => {
        if (cartItems.length === 0) return alert("Cart is empty.");
        if (!selectedCustomer) return alert("Please select a customer before billing.");

        if (window.confirm("Generate Final Bill? This will deduct items from your stock.")) {
            // Deduct stock (ignoring custom orders)
            const stockIdsToRemove = cartItems.filter(item => !item.isCustomOrder).map(item => item.stockId);
            const remainingStock = stockItems.filter(item => !stockIdsToRemove.includes(item.id));

            localStorage.setItem('jw_stock', JSON.stringify(remainingStock));
            setStockItems(remainingStock);

            // Update customer transactions
            const currentInvoiceNo = "INV-" + Date.now().toString().slice(-6);
            const currentDate = new Date().toLocaleDateString('en-IN');

            const updatedCustomers = customers.map(c => {
                if (c.id.toString() === selectedCustomer.toString()) {
                    const newTxn = {
                        id: Date.now(),
                        date: currentDate,
                        invoiceNo: currentInvoiceNo,
                        items: cartItems.length,
                        total: grandTotal
                    };
                    const existingList = c.transactionList || [];
                    return {
                        ...c,
                        transactions: (c.transactions || 0) + 1,
                        transactionList: [...existingList, newTxn]
                    };
                }
                return c;
            });
            localStorage.setItem('jw_customers', JSON.stringify(updatedCustomers));
            window.dispatchEvent(new CustomEvent('jw_customers_updated'));
            setCustomers(updatedCustomers);

            const customerData = updatedCustomers.find(c => c.id.toString() === selectedCustomer.toString());

            // Update order status or create a new completed order record
            if (linkedOrderId) {
                const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                const updatedOrders = storedOrders.map(order =>
                    order.id === linkedOrderId ? { ...order, status: 'Delivered' } : order
                );
                localStorage.setItem('orders', JSON.stringify(updatedOrders));
                window.dispatchEvent(new CustomEvent('jw_orders_updated'));
            } else {
                // Auto-create a completed order for record keeping in the Orders tab
                const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                const isoDate = new Date().toISOString().split('T')[0];

                const newOrders = cartItems.map((item, index) => ({
                    id: Date.now().toString() + index,
                    orderId: `ORD-BILL-${currentInvoiceNo}-${index}`,
                    customerId: customerData?.id || '',
                    customerName: customerData?.name || 'Walk-in Customer',
                    productType: item.product,
                    weight: item.netWt,
                    remarks: `Auto-generated from Bill ${currentInvoiceNo}`,
                    orderDate: isoDate,
                    dueDate: finalPayable > 0 ? dueDate : isoDate,
                    advanceAmount: advanceAmount,
                    status: finalPayable > 0 ? 'Pending' : 'Completed',
                    createdAt: new Date().toISOString()
                }));
                localStorage.setItem('orders', JSON.stringify([...storedOrders, ...newOrders]));
                window.dispatchEvent(new CustomEvent('jw_orders_updated'));
            }

            // Ledger updates
            // 1. Cash Inflow
            const cashAmount = parseFloat(finalPayable);
            if (cashAmount > 0) {
                const storedCash = JSON.parse(localStorage.getItem('jw_cash_ledger') || '[]');
                const cashTxn = {
                    id: Date.now().toString() + '-billing-cash',
                    transactionId: `CASH-IN-${currentInvoiceNo}`,
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    type: 'Inflow',
                    description: `Bill Payment from ${customerData?.name || 'Customer'} (Inv: ${currentInvoiceNo})`,
                    amount: cashAmount,
                    source: 'Billing'
                };
                localStorage.setItem('jw_cash_ledger', JSON.stringify([...storedCash, cashTxn]));
            }

            // 2. Gold Outflow for stock items sold
            const stockItemsSold = cartItems.filter(item => !item.isCustomOrder);
            if (stockItemsSold.length > 0) {
                const storedGold = JSON.parse(localStorage.getItem('jw_gold_ledger') || '[]');
                const goldOutflows = stockItemsSold.map((item, idx) => ({
                    id: Date.now().toString() + '-billing-gold-' + idx,
                    transactionId: `GOLD-OUT-${currentInvoiceNo}-${idx}`,
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    type: 'Outflow',
                    description: `Item Sold: ${item.product} (Inv: ${currentInvoiceNo})`,
                    purity: item.purity,
                    weight: parseFloat(item.netWt) || 0,
                    source: 'Billing'
                }));
                localStorage.setItem('jw_gold_ledger', JSON.stringify([...storedGold, ...goldOutflows]));
            }


            setReceiptData({
                type: "Tax Invoice",
                customer: customerData,
                invoiceNo: currentInvoiceNo,
                date: currentDate,
                items: [...cartItems],
                subtotal,
                gst,
                advanceAmount,
                grandTotal,
                finalPayable
            });
            setShowReceipt(true);

            setCartItems([]);
            setSelectedCustomer('');
            setAdvanceAmount(0);
            setDueDate(new Date().toISOString().split('T')[0]);
            setLinkedOrderId(null);
        }
    };

    const handleDownloadPDF = () => {
        try {
            console.log("Starting PDF generation...");
            if (!receiptData) {
                console.log("No receipt data found");
                return;
            }
            console.log("Creating new jsPDF instance...");
            const doc = new jsPDF();

            console.log("Formatting currency values...");
            const rsCurrency = (amt) => {
                if (amt === undefined || amt === null || isNaN(amt)) return 'Rs. 0.00';
                return 'Rs. ' + Number(amt).toFixed(2);
            };

            doc.setFontSize(20);
            doc.setTextColor(26, 56, 38);
            doc.text(settings.storeInfo.storeName || "JEWELLERY SHOP", 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(settings.storeInfo.address || "123 Gold Market Road, Jewelry District, City - 400001", 105, 28, { align: 'center' });
            doc.text(`Ph: ${settings.storeInfo.phoneNumber || "+91 98765 43210"} | GSTIN: ${settings.storeInfo.gstin || "27AAAAA0000A1Z5"}`, 105, 34, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            const customerName = receiptData.customer && receiptData.customer.name ? receiptData.customer.name : 'Walk-in';
            const customerPhone = receiptData.customer && receiptData.customer.phone ? receiptData.customer.phone : 'N/A';

            doc.text(`Bill To: ${customerName}`, 14, 50);
            doc.setFontSize(10);
            doc.text(`Ph: ${customerPhone}`, 14, 56);

            doc.setFontSize(14);
            doc.setTextColor(26, 56, 38);
            doc.text(receiptData.type || 'Invoice', 196, 50, { align: 'right' });
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`No: ${receiptData.invoiceNo || 'N/A'}`, 196, 56, { align: 'right' });
            doc.text(`Date: ${receiptData.date || new Date().toLocaleDateString('en-IN')}`, 196, 62, { align: 'right' });

            const tableColumn = ["Item", "Mode", "Net Wt (g)", "Amount"];
            const tableRows = [];

            if (receiptData.items && Array.isArray(receiptData.items)) {
                receiptData.items.forEach(item => {
                    tableRows.push([
                        String(item.product || 'Unknown'),
                        String(item.paymentMode || 'Cash'),
                        String(Number(item.netWt || 0).toFixed(2)),
                        String(rsCurrency(calculateRowAmount(item)))
                    ]);
                });
            }

            console.log("Generating autoTable...", tableRows);
            autoTable(doc, {
                startY: 70,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [26, 56, 38] },
            });

            console.log("Adding totals...", doc.lastAutoTable?.finalY);
            const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 70;
            doc.setFontSize(10);
            doc.text(`Subtotal: ${rsCurrency(receiptData.subtotal)}`, 196, finalY + 10, { align: 'right' });
            doc.text(`GST (${gstPercent}%): ${rsCurrency(receiptData.gst)}`, 196, finalY + 16, { align: 'right' });
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Total: ${rsCurrency(receiptData.grandTotal)}`, 196, finalY + 24, { align: 'right' });

            if (receiptData.advanceAmount > 0) {
                doc.setTextColor(230, 115, 0); // Orange-ish
                doc.text(`Advance: - ${rsCurrency(receiptData.advanceAmount)}`, 196, finalY + 30, { align: 'right' });
            }

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Final Payable: ${rsCurrency(receiptData.finalPayable)}`, 196, finalY + 38, { align: 'right' });

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text("Thank you for shopping with us!", 105, finalY + 40, { align: 'center' });
            doc.text("This is a computer generated document.", 105, finalY + 46, { align: 'center' });

            console.log("Saving PDF...");
            doc.save(`${receiptData.invoiceNo || 'receipt'}.pdf`);
            console.log("PDF Saved successfully.");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert(`Error generating PDF: ${error.message}\n\nPlease check console for details.`);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-jw-gold-dark">Billing</h1>
            </div>

            {/* Top Grid: Search & Customer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Search and Add Items */}
                <div className="lg:col-span-2 bg-jw-green/5 border border-jw-gold/30 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-jw-green mb-4">Search and Add Items</h2>

                    <div className="relative w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Scan Barcode/HUID or Enter Product Name..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold text-sm shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Search Dropdown */}
                        {searchResult.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResult.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleAddToCart(item)}
                                        className="flex justify-between items-center p-3 hover:bg-jw-green/5 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.product}</p>
                                            <p className="text-xs text-gray-500 font-mono">HUID: {item.huid || 'N/A'} | WT: {Number(item.netWt).toFixed(2)}g</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-jw-green">{formatCurrency(item.value)}</p>
                                            <button className="text-xs bg-jw-gold/20 text-jw-gold-dark px-2 py-1 rounded mt-1 font-bold">Add to Bill</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Details */}
                <div className="lg:col-span-1 bg-jw-green/5 border border-jw-gold/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-jw-green mb-4">Customer Details</h2>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                        <select
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold bg-white cursor-pointer"
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">Select or Add New</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={() => setIsCustomerModalOpen(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green py-2.5 rounded-lg font-bold transition-colors shadow-sm">
                        <UserPlus size={18} /> Add New Customer
                    </button>
                </div>
            </div>

            {/* Bottom Grid: Cart & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-full min-h-0">

                {/* Cart Items */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden h-full">
                    <div className="px-6 py-4 border-b border-jw-gold/30 bg-jw-green/5">
                        <h2 className="text-lg font-bold text-jw-green">Cart Items</h2>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-gray-200">
                                <tr className="text-gray-600">
                                    <th className="py-3 px-4 font-semibold text-sm">Item Details</th>
                                    <th className="py-3 px-4 font-semibold text-sm">Weights</th>
                                    <th className="py-3 px-4 font-semibold text-sm">Charges</th>
                                    <th className="py-3 px-4 font-semibold text-sm">Payment</th>
                                    <th className="py-3 px-4 font-semibold text-sm text-right">Amount (₹)</th>
                                    <th className="py-3 px-4 font-semibold text-sm text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-gray-800 text-sm">{item.product}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs font-mono text-gray-600">
                                            <p>Gross: {Number(item.grossWt).toFixed(2)}g</p>
                                            <p>Net: <span className="text-jw-green font-bold">{Number(item.netWt).toFixed(2)}g</span></p>
                                            <p>Purity: {item.touch ? `${item.touch}%` : item.purity}</p>
                                        </td>
                                        <td className="py-3 px-4 space-y-2">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-16 text-gray-500">Wastage%</span>
                                                <input
                                                    type="number" className="w-16 border rounded px-1 py-0.5 text-right bg-white"
                                                    value={item.wastage} onChange={(e) => updateCartItem(item.id, 'wastage', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-16 text-gray-500">Making</span>
                                                <input
                                                    type="number" className="w-16 border rounded px-1 py-0.5 text-right bg-white"
                                                    value={item.makingCharge} onChange={(e) => updateCartItem(item.id, 'makingCharge', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                className="border border-gray-300 rounded text-xs px-2 py-1 bg-white"
                                                value={item.paymentMode} onChange={(e) => updateCartItem(item.id, 'paymentMode', e.target.value)}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Gold">Gold</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-800">
                                            {formatCurrency(calculateRowAmount(item)).replace('₹', '')}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => removeCartItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cartItems.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-400">
                                            Cart is empty. Scan barcode or search to add items.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                    <div className="bg-jw-green/5 border border-jw-gold/30 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b border-jw-gold/30">
                            <h2 className="text-lg font-bold text-jw-green">Bill Summary</h2>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-gray-700 font-medium">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-700 font-medium">
                                    <span>GST ({gstPercent}%)</span>
                                    <span>{formatCurrency(gst)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                                    <span className="font-bold text-gray-800">Total</span>
                                    <span className="font-bold text-gray-800">{formatCurrency(grandTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 text-orange-600">
                                    <span className="font-medium">Advance Paid</span>
                                    <div className="flex items-center gap-2">
                                        <span>- ₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-24 border rounded px-2 py-1 text-right bg-white text-orange-700"
                                            value={advanceAmount || ''}
                                            onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {finalPayable > 0 && (
                                    <div className="flex justify-between items-center pt-2 text-gray-600">
                                        <span className="font-medium text-sm">Due Date (Balance)</span>
                                        <input
                                            type="date"
                                            className="w-32 border rounded px-2 py-1 text-right bg-white text-sm"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-4 mt-2 border-t border-jw-gold/30">
                                    <span className="text-xl font-bold text-jw-green">Final Payable</span>
                                    <span className="text-2xl font-bold text-jw-gold-dark">{formatCurrency(finalPayable)}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-8">
                                <button
                                    onClick={handleGenerateEstimation}
                                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-jw-gold text-jw-green rounded-lg py-3 font-bold hover:bg-jw-gold/10 transition-colors"
                                >
                                    <FileText size={18} /> Generate Estimation
                                </button>
                                <button
                                    onClick={handleGenerateFinalBill}
                                    className="w-full flex items-center justify-center gap-2 bg-jw-green hover:bg-[#1a3826] text-jw-gold rounded-lg py-3 font-bold shadow-md transition-colors"
                                >
                                    <CheckCircle size={18} /> Generate Final Bill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Add New Customer Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-green/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-jw-green">Add New Customer</h2>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSaveNewCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel" required pattern="[0-9]{10}" title="10 digit phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Mode</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold bg-white"
                                    value={newCustomer.paymentMode} onChange={(e) => setNewCustomer({ ...newCustomer, paymentMode: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={newCustomer.gstin} onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-jw-green/5">
                            <h2 className="text-xl font-bold text-jw-green">{receiptData.type} Preview</h2>
                            <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Receipt Content - Scrollable */}
                        <div className="p-8 flex-1 overflow-y-auto bg-gray-50">
                            <div className="bg-white p-8 rounded border border-gray-200 shadow-sm mx-auto max-w-xl">
                                {/* Header */}
                                <div className="text-center mb-8 border-b border-gray-200 pb-6">
                                    <h1 className="text-3xl font-bold text-jw-green mb-2">{settings.storeInfo.storeName || "JEWELLERY SHOP"}</h1>
                                    <p className="text-gray-500 text-sm">{settings.storeInfo.address || "123 Gold Market Road, Jewelry District, City - 400001"}</p>
                                    <p className="text-gray-500 text-sm">Ph: {settings.storeInfo.phoneNumber || "+91 98765 43210"} | GSTIN: {settings.storeInfo.gstin || "27AAAAA0000A1Z5"}</p>
                                </div>

                                {/* Bill Info */}
                                <div className="flex justify-between mb-8 pb-6 border-b border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">Bill To:</p>
                                        <p className="text-lg font-bold text-gray-900">{receiptData.customer.name}</p>
                                        <p className="text-sm text-gray-600">Ph: {receiptData.customer.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-xl font-bold text-jw-green mb-1">{receiptData.type}</h3>
                                        <p className="text-sm font-bold text-gray-700">No: {receiptData.invoiceNo}</p>
                                        <p className="text-sm text-gray-600">Date: {receiptData.date}</p>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <table className="w-full text-left border-collapse mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-jw-green/20 text-jw-green">
                                            <th className="py-2 text-sm font-bold">Item</th>
                                            <th className="py-2 text-sm font-bold text-right">Net Wt</th>
                                            <th className="py-2 text-sm font-bold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receiptData.items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-100">
                                                <td className="py-3">
                                                    <p className="font-bold text-gray-800">{item.product}</p>
                                                    <p className="text-xs text-gray-500">Mode: {item.paymentMode}</p>
                                                </td>
                                                <td className="py-3 text-right text-gray-700">{Number(item.netWt).toFixed(2)}g</td>
                                                <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(calculateRowAmount(item))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="space-y-2 text-right border-t-2 border-gray-100 pt-4">
                                    <div className="flex justify-end gap-8 text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="w-32 font-medium">{formatCurrency(receiptData.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-end gap-8 text-gray-600">
                                        <span>GST ({gstPercent}%):</span>
                                        <span className="w-32 font-medium">{formatCurrency(receiptData.gst)}</span>
                                    </div>
                                    <div className="flex justify-end gap-8 pt-4 mt-2 border-t-2 border-gray-100">
                                        <span className="font-bold text-gray-800">Total:</span>
                                        <span className="w-32 font-bold text-gray-800">{formatCurrency(receiptData.grandTotal)}</span>
                                    </div>
                                    {receiptData.advanceAmount > 0 && (
                                        <div className="flex justify-end gap-8 text-orange-600 mt-2">
                                            <span>Advance Paid:</span>
                                            <span className="w-32 font-medium">- {formatCurrency(receiptData.advanceAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-8 pt-4 mt-2 border-t-2 border-gray-200">
                                        <span className="text-lg font-bold text-jw-green">Final Payable:</span>
                                        <span className="w-32 text-xl font-bold text-jw-gold-dark">{formatCurrency(receiptData.finalPayable)}</span>
                                    </div>
                                </div>

                                <div className="mt-12 text-center text-sm text-gray-400">
                                    <p>Thank you for shopping with us!</p>
                                    <p>This is a computer generated document.</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-4">
                            <button onClick={() => setShowReceipt(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                                Close
                            </button>
                            {receiptData.type !== 'Estimation' && (
                                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-jw-green hover:bg-[#1a3826] text-white rounded-lg font-bold shadow-md transition-colors">
                                    <Download size={18} /> Download PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
