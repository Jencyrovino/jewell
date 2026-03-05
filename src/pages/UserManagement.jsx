import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Filter, Download, Plus, Edit2, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const initialUsers = [
    { id: 1, name: 'Hari', phone: '8965432012', role: 'User', joined: '2025-01-15' },
    { id: 2, name: 'David', phone: '7965435010', role: 'Admin', joined: '2024-06-06' },
    { id: 3, name: 'Jessica', phone: '9969432082', role: 'Manager', joined: '2025-07-20' },
    { id: 4, name: 'Taylor', phone: '4965432019', role: 'Admin', joined: '2023-03-15' },
    { id: 5, name: 'James', phone: '8988832012', role: 'User', joined: '2024-12-09' },
    { id: 6, name: 'Robert', phone: '8967732077', role: 'User', joined: '2023-09-19' },
];

export default function UserManagement() {
    const [users, setUsers] = useState(() => {
        const savedUsers = localStorage.getItem('jw_users');
        if (savedUsers) {
            return JSON.parse(savedUsers);
        }
        return initialUsers;
    });

    useEffect(() => {
        localStorage.setItem('jw_users', JSON.stringify(users));
    }, [users]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentUser, setCurrentUser] = useState({ name: '', phone: '', role: 'User', joined: format(new Date(), 'yyyy-MM-dd') });

    // Handle Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            setSelectedUsers([...selectedUsers, id]);
        } else {
            setSelectedUsers(selectedUsers.filter(uId => uId !== id));
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
    const processedUsers = useMemo(() => {
        let filteredData = users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone.includes(searchTerm) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRoleFilter === 'All' || user.role === selectedRoleFilter;
            return matchesSearch && matchesRole;
        });

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [users, searchTerm, selectedRoleFilter, sortConfig]);

    // Handle Export
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("User Management Report", 14, 15);
        doc.autoTable({
            head: [['Name', 'Phone No.', 'Role', 'Joined Date']],
            body: processedUsers.map(u => [u.name, u.phone, u.role, format(new Date(u.joined), 'dd MMM yyyy')]),
            startY: 20,
        });
        doc.save('users_report.pdf');
    };

    const handleExportExcel = () => {
        const dataToExport = processedUsers.map(u => ({
            Name: u.name,
            'Phone No.': u.phone,
            Role: u.role,
            'Joined Date': format(new Date(u.joined), 'dd MMM yyyy')
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, "users_report.xlsx");
    };

    // Handle CRUD
    const openAddModal = () => {
        setModalMode('add');
        setCurrentUser({ name: '', phone: '', role: 'User', joined: format(new Date(), 'yyyy-MM-dd') });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(users.filter(u => u.id !== id));
            setSelectedUsers(selectedUsers.filter(uId => uId !== id));
        }
    };

    const handleSaveModal = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            const newUser = { ...currentUser, id: Date.now() };
            setUsers([...users, newUser]);
        } else {
            setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
        }
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full relative">
            <h1 className="text-2xl font-bold text-jw-green mb-6 tracking-tight">User Management</h1>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone number, role"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    {/* Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <Filter size={16} />
                            Filter
                            {selectedRoleFilter !== 'All' && <span className="ml-1 text-jw-green font-bold bg-jw-green/10 px-2 py-0.5 rounded-full text-xs">{selectedRoleFilter}</span>}
                        </button>
                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-100 shadow-lg rounded-lg transition-all z-20 overflow-hidden">
                                    {['All', 'Admin', 'Manager', 'Supervisor', 'Billing Staff', 'Stock Manager', 'User'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => {
                                                setSelectedRoleFilter(role);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedRoleFilter === role ? 'font-bold text-jw-green bg-jw-green/10' : 'text-gray-700 hover:bg-jw-green/5 hover:text-jw-green'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                            <Download size={16} /> Export
                        </button>
                        {/* Simple dropdown map for export */}
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-100 shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green first:rounded-t-lg">As PDF</button>
                            <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-jw-green/10 hover:text-jw-green last:rounded-b-lg border-t border-gray-50">As Excel</button>
                        </div>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-jw-green hover:bg-jw-green-light text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Plus size={16} /> Add User
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                <th className="py-3 px-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-jw-green focus:ring-jw-gold cursor-pointer"
                                        onChange={handleSelectAll}
                                        checked={selectedUsers.length === processedUsers.length && processedUsers.length > 0}
                                    />
                                </th>
                                <SortableHeader label="User" columnKey="name" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader label="Phone No." columnKey="phone" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader label="Role" columnKey="role" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader label="Joined date" columnKey="joined" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="py-3 px-4 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-jw-green focus:ring-jw-gold cursor-pointer"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={(e) => handleSelectOne(e, user.id)}
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-gray-800 font-medium">{user.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-700' :
                                            user.role === 'Manager' ? 'bg-jw-gold-light/50 text-jw-gold-dark' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{format(new Date(user.joined), 'dd MMM yyyy')}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openEditModal(user)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {processedUsers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit User */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-jw-bg">
                            <h2 className="text-xl font-bold text-jw-green">{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h2>
                        </div>

                        <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentUser.name} onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel" required pattern="[0-9]{10}" title="10 digit phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentUser.phone} onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentUser.role} onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Supervisor">Supervisor</option>
                                    <option value="Billing Staff">Billing Staff</option>
                                    <option value="Stock Manager">Stock Manager</option>
                                    <option value="User">User</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                                <input
                                    type="date" required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-jw-gold"
                                    value={currentUser.joined} onChange={(e) => setCurrentUser({ ...currentUser, joined: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold rounded transition-colors"
                                >
                                    Save User
                                </button>
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
            className="py-3 px-4 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors select-none"
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
