import React, { useState, useEffect } from 'react';
import { Edit2, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Dashboard() {
    const { settings, updateGoldRate } = useSettings();
    const currentGoldRate = settings.goldRate.rate22k;

    const [isEditingRate, setIsEditingRate] = useState(false);
    const [tempRate, setTempRate] = useState(currentGoldRate);

    // Sync tempRate when global rate changes
    useEffect(() => {
        setTempRate(settings.goldRate.rate22k);
    }, [settings.goldRate.rate22k]);

    // Dynamic Date Formatting
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const handleSaveRate = () => {
        const numericValue = tempRate.toString().replace(/,/g, '');
        if (!isNaN(numericValue) && numericValue !== '') {
            updateGoldRate({ rate22k: parseFloat(numericValue) });
        }
        setIsEditingRate(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveRate();
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>

                <div className="flex gap-4">
                    <div className="bg-white shadow-sm px-4 py-2 rounded-lg border border-gray-100 flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium tracking-wide">Date:</span>
                        <span className="text-sm font-semibold text-gray-800">{formattedDate}</span>
                    </div>
                    <div className="bg-white shadow-sm px-4 py-2 rounded-lg border border-jw-gold/30 flex items-center gap-2 group">
                        <span className="text-sm text-jw-gold-dark font-medium tracking-wide">Gold Rate (22K):</span>

                        {isEditingRate ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-jw-green">₹</span>
                                <input
                                    type="text"
                                    className="w-20 text-sm font-bold text-jw-green border-b border-jw-green focus:outline-none bg-transparent"
                                    value={tempRate}
                                    onChange={(e) => setTempRate(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                                <button onClick={handleSaveRate} className="text-jw-green hover:text-jw-green-light ml-1">
                                    <Check size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-jw-green">₹ {new Intl.NumberFormat('en-IN').format(currentGoldRate)}/gm</span>
                                <button
                                    onClick={() => {
                                        setTempRate(currentGoldRate);
                                        setIsEditingRate(true);
                                    }}
                                    className="text-gray-400 hover:text-jw-gold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Today's sale" value="₹ 4,50,000" />
                <StatCard title="Total stock value" value="₹ 1.2 Cr" />
                <StatCard title="Pending Orders" value="12" />
                <StatCard title="Total customers" value="845" />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Sales Overview</h3>
                    <div className="flex-1 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                        <p className="text-gray-400 font-medium">Chart Area</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Stock Distribution</h3>
                    <div className="flex-1 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                        <p className="text-gray-400 font-medium">Chart Area</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-jw-gold/10 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 truncate">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}
