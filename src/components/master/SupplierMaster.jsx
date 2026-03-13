import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const defaultSuppliers = [
    { id: 1, name: 'Hari', phone: '8965432012', address: 'Karur', gstin: '27AAAAP0267H2ZN' },
    { id: 2, name: 'David', phone: '7965435010', address: 'Erode', gstin: '29AAAAP0267H1ZK' },
    { id: 3, name: 'Jessica', phone: '9969432082', address: 'Coimbatore', gstin: '30AAAAP0267H1Z1' },
];

export default function SupplierMaster() {
    const [suppliers, setSuppliers] = useState(() => {
        const saved = localStorage.getItem('jw_suppliers');
        return saved ? JSON.parse(saved) : defaultSuppliers;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentSupplier, setCurrentSupplier] = useState({ name: '', phone: '', address: '', gstin: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);

    useEffect(() => {
        localStorage.setItem('jw_suppliers', JSON.stringify(suppliers));
    }, [suppliers]);

    // Handle Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSuppliers(processedSuppliers.map(s => s.id));
        } else {
            setSelectedSuppliers([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            setSelectedSuppliers([...selectedSuppliers, id]);
        } else {
            setSelectedSuppliers(selectedSuppliers.filter(sId => sId !== id));
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
    const processedSuppliers = useMemo(() => {
        let filteredData = suppliers.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            return s.name.toLowerCase().includes(searchLower) ||
                s.phone.includes(searchTerm) ||
                s.address.toLowerCase().includes(searchLower);
        });

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [suppliers, searchTerm, sortConfig]);

    // Handle Export
   
    const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("Jewellery Management System", 14, 10);

    doc.setFontSize(14);
    doc.text("Supplier Master Report", 14, 18);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

    autoTable(doc, {
        head: [['Supplier Name', 'Phone No.', 'Address', 'GSTIN']],
        body: processedSuppliers.map(s => [
            s.name,
            s.phone,
            s.address,
            s.gstin || '-'
        ]),
        startY: 32
    });

    doc.save("suppliers_report.pdf");
};
    const handleExportExcel = () => {
        const dataToExport = processedSuppliers.map(s => ({
            'Supplier Name': s.name,
            'Phone No.': s.phone,
            'Address': s.address,
            GSTIN: s.gstin || '-'
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
        XLSX.writeFile(workbook, "suppliers_report.xlsx");
    };

    const openAddModal = () => {
        setModalMode('add');
        setCurrentSupplier({ name: '', phone: '', address: '', gstin: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setModalMode('edit');
        setCurrentSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    const handleSaveModal = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            setSuppliers([...suppliers, { ...currentSupplier, id: Date.now() }]);
        } else {
            setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? currentSupplier : s));
        }
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-jw-gold/30 bg-jw-green/5 gap-4">
                <h2 className="text-lg font-bold text-jw-green hidden md:block">Supplier List</h2>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
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
                        <Plus size={16} /> Add Supplier
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
                                    checked={selectedSuppliers.length === processedSuppliers.length && processedSuppliers.length > 0}
                                />
                            </th>
                            <SortableHeader label="Supplier Name" columnKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Phone No." columnKey="phone" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="Address" columnKey="address" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader label="GSTIN" columnKey="gstin" sortConfig={sortConfig} requestSort={requestSort} />
                            <th className="py-3 px-6 font-semibold text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedSuppliers.map((supplier) => (
                            <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-jw-green focus:ring-jw-gold cursor-pointer"
                                        checked={selectedSuppliers.includes(supplier.id)}
                                        onChange={(e) => handleSelectOne(e, supplier.id)}
                                    />
                                </td>
                                <td className="py-3 px-6 text-gray-800 font-medium">{supplier.name}</td>
                                <td className="py-3 px-6 text-gray-600">{supplier.phone}</td>
                                <td className="py-3 px-6 text-gray-600">{supplier.address}</td>
                                <td className="py-3 px-6 text-gray-500 text-sm font-mono">{supplier.gstin || '-'}</td>
                                <td className="py-3 px-6">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => openEditModal(supplier)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {processedSuppliers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">No suppliers found.</td>
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
                            <h2 className="text-xl font-bold text-jw-green">{modalMode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}</h2>
                        </div>
                        <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentSupplier.name} onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel" required pattern="[0-9]{10}" title="10 digit phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentSupplier.phone} onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentSupplier.address} onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentSupplier.gstin} onChange={(e) => setCurrentSupplier({ ...currentSupplier, gstin: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors">Save Supplier</button>
                            </div>
                        </form>
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
