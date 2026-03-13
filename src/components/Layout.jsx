import React from 'react';
import {
    LayoutDashboard,
    Users,
    Database,
    Boxes,
    Receipt,
    ShoppingCart,
    Wallet,
    PieChart,
    Settings,
    UserCircle
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
    const navigate = useNavigate();

    const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
        sessionStorage.removeItem('isAuthenticated');
        navigate('/login');
    }
};

    const sidebarItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Users size={20} />, label: 'User Management', path: '/user-management' },
        { icon: <Database size={20} />, label: 'Master Data', path: '/master-data' },
        { icon: <Boxes size={20} />, label: 'Stock', path: '/stock' },
        { icon: <Receipt size={20} />, label: 'Billing', path: '/billing' },
        { icon: <ShoppingCart size={20} />, label: 'Orders & Advances', path: '/orders' },
        { icon: <Wallet size={20} />, label: 'Expenses', path: '/expenses' },
        { icon: <PieChart size={20} />, label: 'Reports', path: '/reports' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row font-sans">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-jw-green text-white flex flex-col shadow-xl z-20 transition-all duration-300">
                <div className="p-6 font-serif text-2xl font-bold tracking-wider text-jw-gold border-b border-white/10 flex items-center justify-center">
                    LOGO
                </div>

                <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
                    {sidebarItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) => `flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 ${isActive
                                ? 'bg-jw-green-light border-l-4 border-jw-gold text-jw-gold font-medium'
                                : 'hover:bg-white/5 text-gray-300 hover:text-white border-l-4 border-transparent'
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={isActive ? 'text-jw-gold' : 'text-gray-400'}>{item.icon}</span>
                                    <span className="text-sm tracking-wide">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/10">
                    <div
                        onClick={handleLogout}
                        className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors group"
                        title="Logout"
                    >
                        <UserCircle size={24} className="text-jw-gold group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-sm font-medium text-white">Admin User</p>
                            <p className="text-xs text-red-400 font-medium group-hover:text-red-300">Logout</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
