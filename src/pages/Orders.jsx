import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Eye,
    FileText,
    Filter,
    Clock,
    PlayCircle,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);

    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        productType: '',
        weight: '',
        remarks: '',
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        advanceAmount: ''
    });

    // Load data on mount
    useEffect(() => {
        const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const storedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');

        // Update statuses dynamically based on due date
        const today = new Date().toISOString().split('T')[0];
        const updatedOrders = storedOrders.map(order => {
            if (order.status !== 'Completed' && order.status !== 'Delivered' && order.dueDate < today) {
                return { ...order, status: 'Overdue' };
            }
            // If it was overdue but due date is extended, revert to appropriate status
            // Assuming default to Pending if it's no longer overdue and not completed/delivered
            if (order.status === 'Overdue' && order.dueDate >= today) {
                return { ...order, status: 'Pending' }; // Or keep it whatever it was before, implies we might need a history. For now, just update to overdue, don't revert automatically easily without knowing prior state. Let's just do the overdue check.
            }
            return order;
        });

        setOrders(updatedOrders);
        if (JSON.stringify(storedOrders) !== JSON.stringify(updatedOrders)) {
            localStorage.setItem('orders', JSON.stringify(updatedOrders));
        }

        setCustomers(storedCustomers);
    }, []);

    // KPIs calculation
    const kpis = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (order.status === 'Pending') acc.pending++;
            else if (order.status === 'In Progress') acc.inProgress++;
            else if (order.status === 'Completed') acc.completed++;
            else if (order.status === 'Overdue') acc.overdue++;
            return acc;
        }, { pending: 0, inProgress: 0, completed: 0, overdue: 0 });
    }, [orders]);

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const searchLower = (searchQuery || '').toLowerCase();
            const matchesSearch = !searchLower ||
                (order.orderId && String(order.orderId).toLowerCase().includes(searchLower)) ||
                (order.customerName && String(order.customerName).toLowerCase().includes(searchLower)) ||
                (order.productType && String(order.productType).toLowerCase().includes(searchLower));

            const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)); // Sort by newest first
    }, [orders, searchQuery, statusFilter]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'customerId') {
            const customer = customers.find(c => c.id === value);
            setFormData(prev => ({
                ...prev,
                customerId: value,
                customerName: customer ? customer.name : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleCreateOrder = (e) => {
        e.preventDefault();

        const newOrder = {
            id: Date.now().toString(),
            orderId: `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            ...formData,
            advanceAmount: parseFloat(formData.advanceAmount) || 0,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const updatedOrders = [...orders, newOrder];
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));

        // Close modal and reset form
        setIsCreateModalOpen(false);
        setFormData({
            customerId: '',
            customerName: '',
            productType: '',
            weight: '',
            remarks: '',
            orderDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            advanceAmount: ''
        });
    };

    const handleStatusChange = (orderId, newStatus) => {
        const updatedOrders = orders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));

        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
    };

    const openViewModal = (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    const handleGenerateBill = (order) => {
        // Navigate to billing page and pass order data
        navigate('/billing', {
            state: {
                convertFromOrder: true,
                orderData: order
            }
        });
    };

    // Helper functions for UI
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-orange-500 bg-orange-100 border-orange-200';
            case 'In Progress': return 'text-blue-500 bg-blue-100 border-blue-200';
            case 'Completed': return 'text-green-500 bg-green-100 border-green-200';
            case 'Delivered': return 'text-purple-500 bg-purple-100 border-purple-200';
            case 'Overdue': return 'text-red-500 bg-red-100 border-red-200';
            default: return 'text-gray-500 bg-gray-100 border-gray-200';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-GB', options);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-jw-gold-dark mb-6">Order Management</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        <Clock className="text-jw-green" size={24} />
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">Pending</p>
                        <h3 className="text-2xl font-bold text-gray-800">{kpis.pending}</h3>
                    </div>
                </div>
                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        <PlayCircle className="text-jw-green" size={24} />
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">In Progress</p>
                        <h3 className="text-2xl font-bold text-gray-800">{kpis.inProgress}</h3>
                    </div>
                </div>
                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-white shadow-sm border border-jw-gold/20 p-3 rounded-lg">
                        <CheckCircle className="text-jw-green" size={24} />
                    </div>
                    <div>
                        <p className="text-jw-gold-dark font-semibold text-sm mb-1">Completed</p>
                        <h3 className="text-2xl font-bold text-gray-800">{kpis.completed}</h3>
                    </div>
                </div>
                <div className="bg-[#fdf6e3] rounded-xl shadow-sm border border-jw-gold/40 p-5 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="bg-red-50 shadow-sm border border-red-200 p-3 rounded-lg">
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <div>
                        <p className="text-red-600 font-semibold text-sm mb-1">Overdue</p>
                        <h3 className="text-2xl font-bold text-red-700">{kpis.overdue}</h3>
                    </div>
                </div>
            </div>

            {/* Main Action Bar */}
            <div className="bg-jw-gold/10 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-jw-green">All Orders</h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-jw-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>Create New Order</span>
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search Orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-jw-gold"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                    <div className="relative">
                        <select
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-jw-gold appearance-none bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All Status">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                <th className="p-4 font-medium text-sm">Order ID</th>
                                <th className="p-4 font-medium text-sm">Customer</th>
                                <th className="p-4 font-medium text-sm">Product</th>
                                <th className="p-4 font-medium text-sm">Order Date</th>
                                <th className="p-4 font-medium text-sm">Due Date</th>
                                <th className="p-4 font-medium text-sm">Advance (Rs)</th>
                                <th className="p-4 font-medium text-sm">Status</th>
                                <th className="p-4 font-medium text-sm text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-sm text-jw-green">{order.orderId}</td>
                                        <td className="p-4 text-sm">{order.customerName}</td>
                                        <td className="p-4 text-sm max-w-[150px] truncate" title={order.productType}>{order.productType}</td>
                                        <td className="p-4 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                                        <td className="p-4 text-sm text-gray-600">{formatDate(order.dueDate)}</td>
                                        <td className="p-4 text-sm font-medium">{formatCurrency(order.advanceAmount)}</td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openViewModal(order)}
                                                    className="p-1.5 text-jw-gold hover:bg-jw-gold/10 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {order.status === 'Completed' && (
                                                    <button
                                                        onClick={() => handleGenerateBill(order)}
                                                        className="p-1.5 text-jw-green hover:bg-green-50 rounded flex items-center gap-1"
                                                        title="Generate Bill"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">
                                        No orders found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Order Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-jw-green">Create New Order</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="createOrderForm" onSubmit={handleCreateOrder} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Customer Details */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h3 className="font-semibold text-gray-700 border-b pb-2">Customer Details</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer *</label>
                                            <select
                                                name="customerId"
                                                required
                                                value={formData.customerId}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent bg-white"
                                            >
                                                <option value="">-- Select Customer --</option>
                                                {customers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h3 className="font-semibold text-gray-700 border-b pb-2">Order Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type / Name *</label>
                                                <input
                                                    type="text"
                                                    name="productType"
                                                    required
                                                    value={formData.productType}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. Custom Gold Ring"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Weight (g)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="weight"
                                                    value={formData.weight}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. 10.5"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Specifications</label>
                                            <textarea
                                                name="remarks"
                                                rows="3"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                placeholder="Enter design details, size, etc."
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Dates & Payment */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-700 border-b pb-2">Schedule</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                                            <input
                                                type="date"
                                                name="orderDate"
                                                required
                                                value={formData.orderDate}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                required
                                                value={formData.dueDate}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-700 border-b pb-2">Payment</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (Rs)</label>
                                            <input
                                                type="number"
                                                name="advanceAmount"
                                                value={formData.advanceAmount}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jw-gold focus:border-transparent font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 rounded-b-lg">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="createOrderForm"
                                className="px-6 py-2 bg-jw-green hover:bg-jw-green-light text-white rounded-lg font-medium transition-colors"
                            >
                                Save Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Order Modal */}
            {isViewModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-lg">
                            <div>
                                <h2 className="text-xl font-bold text-jw-green flex items-center gap-3">
                                    Order Details
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-white ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">ID: {selectedOrder.orderId}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Update Status Section */}
                            <div className="bg-jw-green/5 p-4 rounded-lg border border-jw-green/20 flex items-center justify-between">
                                <span className="font-semibold text-jw-green">Update Status:</span>
                                <div className="flex gap-2">
                                    {['Pending', 'In Progress', 'Completed', 'Delivered'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(selectedOrder.id, status)}
                                            disabled={selectedOrder.status === status}
                                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedOrder.status === status
                                                ? 'bg-jw-green text-white cursor-default'
                                                : 'bg-white text-jw-green border border-jw-green/30 hover:bg-jw-green/10'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                                    <p className="font-semibold text-gray-800">{selectedOrder.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Product Details</p>
                                    <p className="font-semibold text-gray-800">{selectedOrder.productType}</p>
                                    {selectedOrder.weight && <p className="text-sm text-gray-600 mt-0.5">Approx. {selectedOrder.weight}g</p>}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Date</p>
                                    <p className="font-semibold text-gray-800">
                                        {formatDate(selectedOrder.orderDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Due Date</p>
                                    <p className={`font-semibold ${selectedOrder.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                                        {formatDate(selectedOrder.dueDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Advance Amount Paid</p>
                                    <p className="font-bold text-green-700 text-lg">{formatCurrency(selectedOrder.advanceAmount)}</p>
                                </div>
                                {selectedOrder.remarks && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500 mb-1">Remarks & Specifications</p>
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-200">
                                            {selectedOrder.remarks}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 rounded-b-lg">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            {selectedOrder.status === 'Completed' && (
                                <button
                                    onClick={() => handleGenerateBill(selectedOrder)}
                                    className="px-6 py-2 bg-jw-gold hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <FileText size={18} />
                                    Generate Bill
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
