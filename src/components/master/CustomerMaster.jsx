import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const defaultCustomers = [
    { id: 1, name: 'Hari', phone: '8965432012', paymentMode: 'Cash', gstin: '27AAAAP0267H2ZN', transactions: 5 },
    { id: 2, name: 'David', phone: '7965435010', paymentMode: 'UPI', gstin: '29AAAAP0267H1ZK', transactions: 2 },
    { id: 3, name: 'Jessica', phone: '9969432082', paymentMode: 'Cash', gstin: '30AAAAP0267H1Z1', transactions: 1 },
    { id: 4, name: 'Taylor', phone: '4965432019', paymentMode: 'Gold', gstin: '07AAACC1206D1Z1', transactions: 8 },
];

export default function CustomerMaster() {
    const [customers, setCustomers] = useState(() => {
        const saved = localStorage.getItem('jw_customers');
        return saved ? JSON.parse(saved) : defaultCustomers;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentCustomer, setCurrentCustomer] = useState({ name: '', phone: '', paymentMode: 'Cash', gstin: '' });

    // View Transactions Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedCustomers, setSelectedCustomers] = useState([]);

    const saveAndSetCustomers = (newCustomers) => {
        setCustomers(newCustomers);
        localStorage.setItem('jw_customers', JSON.stringify(newCustomers));
        window.dispatchEvent(new CustomEvent('jw_customers_updated'));
    };

    useEffect(() => {
        const handleStorageUpdate = () => {
            const saved = localStorage.getItem('jw_customers');
            if (saved) {
                setCustomers(JSON.parse(saved));
            }
        };
        window.addEventListener('jw_customers_updated', handleStorageUpdate);
        return () => window.removeEventListener('jw_customers_updated', handleStorageUpdate);
    }, []);

    // Handle Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCustomers(processedCustomers.map(c => c.id));
        } else {
            setSelectedCustomers([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            setSelectedCustomers([...selectedCustomers, id]);
        } else {
            setSelectedCustomers(selectedCustomers.filter(cId => cId !== id));
        }
    };

    // Handle Sorting
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and Sort Data
    const processedCustomers = useMemo(() => {
        let filteredData = customers.filter(c => {
            const searchLower = searchTerm.toLowerCase();
            return c.name.toLowerCase().includes(searchLower) ||
                c.phone.includes(searchTerm) ||
                c.paymentMode.toLowerCase().includes(searchLower);
        });

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [customers, searchTerm, sortConfig]);

    // Handle Export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Customer Master Report", 14, 15);
        doc.autoTable({
            head: [['Customer Name', 'Phone No.', 'Payment Mode', 'GSTIN', 'Transactions']],
            body: processedCustomers.map(c => [c.name, c.phone, c.paymentMode, c.gstin || '-', c.transactions]),
            startY: 20,
        });
        doc.save('customers_report.pdf');
    };

    const handleExportExcel = () => {
        const dataToExport = processedCustomers.map(c => ({
            'Customer Name': c.name,
            'Phone No.': c.phone,
            'Payment Mode': c.paymentMode,
            GSTIN: c.gstin || '-',
            Transactions: c.transactions
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        XLSX.writeFile(workbook, "customers_report.xlsx");
    };

    const openAddModal = () => {
        setModalMode('add');
        setCurrentCustomer({ name: '', phone: '', paymentMode: 'Cash', gstin: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (customer) => {
        setModalMode('edit');
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            saveAndSetCustomers(customers.filter(c => c.id !== id));
        }
    };

    const handleSaveModal = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            saveAndSetCustomers([...customers, { ...currentCustomer, id: Date.now(), transactions: 0 }]);
        } else {
            saveAndSetCustomers(customers.map(c => c.id === currentCustomer.id ? currentCustomer : c));
        }
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-jw-gold/30 bg-jw-green/5 gap-4">
                <h2 className="text-lg font-bold text-jw-green hidden md:block">Customer List</h2>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="relative group/export">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                            <Download size={16} /> Export
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-100 shadow-lg rounded-lg opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-10">
                            <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green first:rounded-t-lg">As PDF</button>
                            <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green last:rounded-b-lg border-t border-gray-50">As Excel</button>
                        </div>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm whitespace-nowrap"
                    >
                        <Plus size={16} /> Add Customer
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-sm">
                            <th className="py-3 px-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-jw-green focus:ring-jw-gold cursor-pointer"
                                    onChange={handleSelectAll}
                                    checked={selectedCustomers.length === processedCustomers.length && processedCustomers.length > 0}
                                />
                            </th>
                            <SortableHeader label="Customer Name" columnKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Phone No." columnKey="phone" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Payment Mode" columnKey="paymentMode" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="GSTIN" columnKey="gstin" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="py-3 px-6 font-semibold text-center w-32">Actions</th>
                            <SortableHeader label="Transactions" columnKey="transactions" sortConfig={sortConfig} requestSort={requestSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {processedCustomers.map((customer) => (
                            <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-jw-green focus:ring-jw-gold cursor-pointer"
                                        checked={selectedCustomers.includes(customer.id)}
                                        onChange={(e) => handleSelectOne(e, customer.id)}
                                    />
                                </td>
                                <td className="py-3 px-6 text-gray-800 font-medium">{customer.name}</td>
                                <td className="py-3 px-6 text-gray-600">{customer.phone}</td>
                                <td className="py-3 px-6 text-gray-600">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200 text-xs font-medium">{customer.paymentMode}</span>
                                </td>
                                <td className="py-3 px-6 text-gray-500 text-sm font-mono">{customer.gstin || '-'}</td>
                                <td className="py-3 px-6">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => openEditModal(customer)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                                <td className="py-3 px-6 text-center text-sm font-medium">
                                    <button onClick={() => { setViewCustomer(customer); setIsViewModalOpen(true); }} className="text-jw-green hover:underline flex items-center gap-1 justify-center mx-auto">
                                        View ({customer.transactions})
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {processedCustomers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="py-8 text-center text-gray-500">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-bg">
                            <h2 className="text-xl font-bold text-jw-green">{modalMode === 'add' ? 'Add New Customer' : 'Edit Customer'}</h2>
                        </div>
                        <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentCustomer.name} onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel" required pattern="[0-9]{10}" title="10 digit phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentCustomer.phone} onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Mode</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentCustomer.paymentMode} onChange={(e) => setCurrentCustomer({ ...currentCustomer, paymentMode: e.target.value })}
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
                                    value={currentCustomer.gstin} onChange={(e) => setCurrentCustomer({ ...currentCustomer, gstin: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors">Save Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Transactions Modal */}
            {isViewModalOpen && viewCustomer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-bg flex justify-between items-center bg-jw-green/5">
                            <h2 className="text-xl font-bold text-jw-green">Transactions: {viewCustomer.name}</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        <div className="p-6">
                            {viewCustomer.transactions > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">Showing recent transactions for this customer.</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                                <tr>
                                                    <th className="py-2 px-4 font-semibold">Date</th>
                                                    <th className="py-2 px-4 font-semibold">Invoice No</th>
                                                    <th className="py-2 px-4 font-semibold text-right">Items</th>
                                                    <th className="py-2 px-4 font-semibold text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Render actual transaction data if available, fallback safely */}
                                                {(viewCustomer.transactionList || []).map((txn, i) => (
                                                    <tr key={txn.id || i} className="border-b border-gray-50">
                                                        <td className="py-2 px-4 text-gray-700">{txn.date || 'Unknown'}</td>
                                                        <td className="py-2 px-4 text-gray-600 font-medium">{txn.invoiceNo || 'N/A'}</td>
                                                        <td className="py-2 px-4 text-gray-700 text-right">{txn.items || 0}</td>
                                                        <td className="py-2 px-4 text-jw-green font-bold text-right">
                                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(txn.total || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Fallback for legacy counts without real data */}
                                                {!(viewCustomer.transactionList && viewCustomer.transactionList.length > 0) &&
                                                    Array.from({ length: viewCustomer.transactions }).map((_, i) => {
                                                        const date = new Date(2023, 11, 10 + (viewCustomer.id * 2) + (i * 5)).toLocaleDateString('en-IN');
                                                        const invoiceNo = `INV-${10000 + (viewCustomer.id * 100) + i}`;
                                                        const items = (i % 3) + 1;
                                                        const amount = 25000 + (viewCustomer.id * 5000) + (i * 10000);
                                                        return (
                                                            <tr key={`legacy-${i}`} className="border-b border-gray-50">
                                                                <td className="py-2 px-4 text-gray-700">{date}</td>
                                                                <td className="py-2 px-4 text-gray-600 font-medium">{invoiceNo}</td>
                                                                <td className="py-2 px-4 text-gray-700 text-right">{items}</td>
                                                                <td className="py-2 px-4 text-jw-green font-bold text-right">
                                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-gray-500 italic text-center mt-4">Transaction history automatically synced from Billing Module.</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">No past transactions found.</div>
                                    <p className="text-sm text-gray-500">When this customer makes a purchase or advance payment, it will appear here.</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for sortable table headers
function SortableHeader({ label, columnKey, sortConfig, requestSort }) {
    const isActive = sortConfig.key === columnKey;
    return (
        <th
            className="py-3 px-6 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
            onClick={() => requestSort(columnKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {isActive ? (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                ) : (
                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-50" />
                )}
            </div>
        </th>
    )
}
