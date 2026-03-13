import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const defaultCategories = [
    { id: 1, name: 'Rings' },
    { id: 2, name: 'Chains' },
    { id: 3, name: 'Bangles' },
    { id: 4, name: 'Earrings' },
];

const defaultSubCategories = [
    { id: 101, categoryId: 1, name: 'Gents Ring' },
    { id: 102, categoryId: 1, name: 'Ladies Ring' },
    { id: 103, categoryId: 1, name: 'Baby Ring' },
    { id: 104, categoryId: 1, name: 'Couple Ring' },
    { id: 201, categoryId: 2, name: 'Rope Chain' },
    { id: 202, categoryId: 2, name: 'Box Chain' },
];

export default function ProductMaster() {
    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('jw_categories');
        return saved ? JSON.parse(saved) : defaultCategories;
    });

    const [subCategories, setSubCategories] = useState(() => {
        const saved = localStorage.getItem('jw_subCategories');
        return saved ? JSON.parse(saved) : defaultSubCategories;
    });

    const [selectedCategoryId, setSelectedCategoryId] = useState(categories.length > 0 ? categories[0].id : null);
    const [categorySearch, setCategorySearch] = useState('');
    const [subCategorySearch, setSubCategorySearch] = useState('');

    // Modals state
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });
    const [currentSubCategory, setCurrentSubCategory] = useState({ id: null, name: '' });

    useEffect(() => { localStorage.setItem('jw_categories', JSON.stringify(categories)); }, [categories]);
    useEffect(() => { localStorage.setItem('jw_subCategories', JSON.stringify(subCategories)); }, [subCategories]);

    // Save Category
    const handleSaveCategory = (e) => {
        e.preventDefault();
        if (currentCategory.id) {
            setCategories(categories.map(c => c.id === currentCategory.id ? currentCategory : c));
        } else {
            const newId = Date.now();
            setCategories([...categories, { ...currentCategory, id: newId }]);
            if (!selectedCategoryId) setSelectedCategoryId(newId);
        }
        setIsCategoryModalOpen(false);
    };

    // Delete Category
    const handleDeleteCategory = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this category? All its sub-categories will be lost.")) {
            setCategories(categories.filter(c => c.id !== id));
            setSubCategories(subCategories.filter(sc => sc.categoryId !== id));
            if (selectedCategoryId === id) {
                const remaining = categories.filter(c => c.id !== id);
                setSelectedCategoryId(remaining.length > 0 ? remaining[0].id : null);
            }
        }
    };

    // Save SubCategory
    const handleSaveSubCategory = (e) => {
        e.preventDefault();
        if (currentSubCategory.id) {
            setSubCategories(subCategories.map(sc => sc.id === currentSubCategory.id ? { ...sc, name: currentSubCategory.name } : sc));
        } else {
            setSubCategories([...subCategories, { ...currentSubCategory, id: Date.now(), categoryId: selectedCategoryId }]);
        }
        setIsSubCategoryModalOpen(false);
    };

    // Delete SubCategory
    const handleDeleteSubCategory = (id) => {
        if (window.confirm("Delete this sub-category?")) {
            setSubCategories(subCategories.filter(sc => sc.id !== id));
        }
    };

    const processedCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
    const filteredSubCategories = subCategories.filter(sc => sc.categoryId === selectedCategoryId && sc.name.toLowerCase().includes(subCategorySearch.toLowerCase()));
    const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || '';

    // Handle Export
   
    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text("Jewellery Management System", 14, 10);

        doc.setFontSize(14);
        doc.text("Product Master Report", 14, 18);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

        const body = [];

        categories.forEach(cat => {
            const subs = subCategories.filter(sc => sc.categoryId === cat.id);

            if (subs.length === 0) {
                body.push([cat.name, "-"]);
            } else {
                subs.forEach(sub => {
                    body.push([cat.name, sub.name]);
                });
            }
        });

        autoTable(doc, {
            head: [['Category', 'Sub-Category']],
            body: body,
            startY: 32
        });

        doc.save("products_report.pdf");
    };
    const handleExportExcel = () => {
        const dataToExport = [];
        categories.forEach(cat => {
            const subs = subCategories.filter(sc => sc.categoryId === cat.id);
            if (subs.length === 0) dataToExport.push({ 'Category': cat.name, 'Sub-Category': '-' });
            subs.forEach(sub => dataToExport.push({ 'Category': cat.name, 'Sub-Category': sub.name }));
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, "products_report.xlsx");
    };

    return (
        <div className="h-full flex flex-col gap-6">

            {/* Header Actions */}
            <div className="flex justify-between items-center gap-3">
                <div className="relative group/export z-20">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                        <Download size={16} /> Export Hierarchy
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-100 shadow-lg rounded-lg opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green first:rounded-t-lg">As PDF</button>
                        <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green last:rounded-b-lg border-t border-gray-50">As Excel</button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setCurrentCategory({ id: null, name: '' }); setIsCategoryModalOpen(true); }}
                        className="flex items-center gap-2 bg-white border border-jw-gold text-jw-green hover:bg-jw-gold/10 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm"
                    >
                        <Folder size={16} /> Add Category
                    </button>
                    <button
                        onClick={() => {
                            if (!selectedCategoryId) return alert("Select a Category first!");
                            setCurrentSubCategory({ id: null, name: '' });
                            setIsSubCategoryModalOpen(true);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm ${selectedCategoryId ? 'bg-jw-gold hover:bg-jw-gold-dark text-jw-green' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                        <Plus size={16} /> Add Sub-Category
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">

                {/* Categories Panel */}
                <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
                    <div className="bg-jw-green/5 border-b border-jw-gold/30 px-4 py-3 flex justify-between items-center gap-2">
                        <h2 className="text-md font-bold text-jw-green whitespace-nowrap">Categories</h2>
                        <div className="relative flex-1 max-w-[150px]">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" placeholder="Search..." className="w-full pl-8 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-jw-gold transition-all" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {processedCategories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedCategoryId === cat.id
                                    ? 'bg-jw-green-light/10 border-jw-green text-jw-green shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-jw-gold hover:bg-jw-gold/5'
                                    }`}
                            >
                                <span className="font-medium">{cat.name}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setCurrentCategory(cat); setIsCategoryModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={(e) => handleDeleteCategory(e, cat.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {processedCategories.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">No categories found.</p>}
                    </div>
                </div>

                {/* Sub-Categories Panel */}
                <div className="w-full md:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
                    <div className="bg-jw-green/5 border-b border-jw-gold/30 px-4 py-3 flex justify-between items-center gap-4">
                        <h2 className="text-md font-bold text-jw-green truncate">
                            Sub-Categories {selectedCategoryName && <span className="text-gray-500 font-normal">for {selectedCategoryName}</span>}
                        </h2>
                        {selectedCategoryId && (
                            <div className="relative w-48 shrink-0">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="text" placeholder="Search sub-categories..." className="w-full pl-8 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-jw-gold transition-all" value={subCategorySearch} onChange={e => setSubCategorySearch(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 xl:p-6 custom-scrollbar">
                        {selectedCategoryId ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredSubCategories.map((subCat) => (
                                    <div key={subCat.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-white hover:border-jw-gold/50 transition-colors shadow-sm">
                                        <span className="text-gray-800 font-medium">{subCat.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setCurrentSubCategory(subCat); setIsSubCategoryModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteSubCategory(subCat.id)} className="text-red-500 hover:text-red-700 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredSubCategories.length === 0 && (
                                    <div className="col-span-full text-center text-gray-500 py-8">
                                        No sub-categories linked to this category. Click "Add Sub-Category" to create one.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Please select a Category from the list on the left to view and manage Sub-Categories.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals for Add/Edit Category & SubCategory */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-bg">
                            <h2 className="text-xl font-bold text-jw-green">{currentCategory.id ? 'Edit Category' : 'Add Category'}</h2>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text" required autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentCategory.name} onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors cursor-pointer">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSubCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-bg">
                            <h2 className="text-xl font-bold text-jw-green">{currentSubCategory.id ? 'Edit Sub-Category' : 'Add Sub-Category'}</h2>
                            <p className="text-xs text-gray-500 mt-1">Linking to: <strong>{selectedCategoryName}</strong></p>
                        </div>
                        <form onSubmit={handleSaveSubCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category Name</label>
                                <input
                                    type="text" required autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentSubCategory.name} onChange={(e) => setCurrentSubCategory({ ...currentSubCategory, name: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsSubCategoryModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors cursor-pointer">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
