import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Store, Percent, Coins, Users, UserPlus, Database, Download, Upload, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { settings, updateStoreInfo, updateTaxSettings, updateGoldRate, clearData } = useSettings();
    const navigate = useNavigate();

    // Local state for form inputs before saving
    const [localStoreInfo, setLocalStoreInfo] = useState(settings.storeInfo);
    const [localTaxSettings, setLocalTaxSettings] = useState(settings.taxSettings);
    const [localGoldRate, setLocalGoldRate] = useState(settings.goldRate);

    // Update local state if global settings change (e.g. on load)
    useEffect(() => {
        setLocalStoreInfo(settings.storeInfo);
        setLocalTaxSettings(settings.taxSettings);
        setLocalGoldRate(settings.goldRate);
    }, [settings]);

    const handleSave = () => {
        updateStoreInfo(localStoreInfo);
        updateTaxSettings(localTaxSettings);
        updateGoldRate(localGoldRate);
        alert('Settings saved successfully!');
    };

    const handleCancel = () => {
        // Reset to global settings
        setLocalStoreInfo(settings.storeInfo);
        setLocalTaxSettings(settings.taxSettings);
        setLocalGoldRate(settings.goldRate);
    };

    const inputClassName = "w-full px-3 py-2 border border-jw-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-jw-gold focus:border-transparent bg-white shadow-sm mt-1";
    const labelClassName = "block text-sm font-bold text-jw-gold-dark mb-1";
    const sectionTitleClassName = "text-lg font-bold text-jw-gold-dark flex items-center gap-2 mb-4 border-b border-jw-gold/20 pb-2";
    const containerClassName = "bg-[#fdeedc] border border-jw-gold/30 rounded-xl p-6 shadow-sm"; // matches mockup base color roughly

    return (
        <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-jw-gold-dark">Settings</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Store Information */}
                    <div className={containerClassName}>
                        <h2 className={sectionTitleClassName}>
                            <Store size={20} className="text-jw-gold-dark" /> Store Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClassName}>Store Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter Store Name"
                                    className={inputClassName}
                                    value={localStoreInfo.storeName}
                                    onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, storeName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>GSTIN</label>
                                <input
                                    type="text"
                                    placeholder="Enter GSTIN"
                                    className={inputClassName}
                                    value={localStoreInfo.gstin}
                                    onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, gstin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter Phone number"
                                    className={inputClassName}
                                    value={localStoreInfo.phoneNumber}
                                    onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, phoneNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter Email"
                                    className={inputClassName}
                                    value={localStoreInfo.email}
                                    onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, email: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClassName}>Address</label>
                                <input
                                    type="text"
                                    placeholder="Enter Address"
                                    className={inputClassName}
                                    value={localStoreInfo.address}
                                    onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* % GST & Tax Setting */}
                    <div className={containerClassName}>
                        <h2 className={sectionTitleClassName}>
                            <Percent size={20} className="text-jw-gold-dark" /> % GST & Tax Setting
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClassName}>CGST%</label>
                                <input
                                    type="number" step="0.1"
                                    placeholder="1.5"
                                    className={inputClassName}
                                    value={localTaxSettings.cgst}
                                    onChange={(e) => setLocalTaxSettings({ ...localTaxSettings, cgst: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>SGST%</label>
                                <input
                                    type="number" step="0.1"
                                    placeholder="1.5"
                                    className={inputClassName}
                                    value={localTaxSettings.sgst}
                                    onChange={(e) => setLocalTaxSettings({ ...localTaxSettings, sgst: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gold Rate Configuration */}
                    <div className={containerClassName}>
                        <h2 className={sectionTitleClassName}>
                            <Coins size={20} className="text-jw-gold-dark" /> Gold Rate Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClassName}>22K Gold Rate</label>
                                <input
                                    type="number"
                                    placeholder="6250"
                                    className={inputClassName}
                                    value={localGoldRate.rate22k}
                                    onChange={(e) => setLocalGoldRate({ ...localGoldRate, rate22k: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>18K Gold Rate</label>
                                <input
                                    type="number"
                                    placeholder="5100"
                                    className={inputClassName}
                                    value={localGoldRate.rate18k}
                                    onChange={(e) => setLocalGoldRate({ ...localGoldRate, rate18k: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>Silver Rate</label>
                                <input
                                    type="number"
                                    placeholder="75"
                                    className={inputClassName}
                                    value={localGoldRate.silverRate}
                                    onChange={(e) => setLocalGoldRate({ ...localGoldRate, silverRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column - Management & Actions */}
                <div className="space-y-6">

                    {/* User Management */}
                    <div className={containerClassName}>
                        <h2 className={sectionTitleClassName}>
                            User Management
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/user-management')}
                                className="w-full flex items-center justify-center gap-2 bg-jw-gold-dark hover:bg-[#8e7323] text-white py-2.5 rounded-lg font-bold shadow-sm transition-colors"
                            >
                                <UserPlus size={18} /> Add New User
                            </button>
                            <button
                                onClick={() => navigate('/user-management')}
                                className="w-full flex items-center justify-center gap-2 bg-jw-gold-dark hover:bg-[#8e7323] text-white py-2.5 rounded-lg font-bold shadow-sm transition-colors"
                            >
                                <Users size={18} /> Manage Users
                            </button>
                            <button
                                onClick={() => navigate('/user-management')}
                                className="w-full flex items-center justify-center gap-2 bg-jw-gold-dark hover:bg-[#8e7323] text-white py-2.5 rounded-lg font-bold shadow-sm transition-colors"
                            >
                                <Users size={18} /> Role Permissions
                            </button>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className={containerClassName}>
                        <h2 className={sectionTitleClassName}>
                            Data Management
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => alert("Backup functionality to be implemented.")}
                                className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2.5 rounded-lg font-bold border border-blue-300 shadow-sm transition-colors"
                            >
                                <Download size={18} /> Backup Data
                            </button>
                            <button
                                onClick={() => alert("Restore functionality to be implemented.")}
                                className="w-full flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2.5 rounded-lg font-bold border border-green-300 shadow-sm transition-colors"
                            >
                                <Upload size={18} /> Restore Data
                            </button>
                            <button
                                onClick={clearData}
                                className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 py-2.5 rounded-lg font-bold border border-red-300 shadow-sm transition-colors"
                            >
                                <Trash2 size={18} /> Clear Data
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 flex items-center justify-center gap-2 bg-jw-gold-dark hover:bg-[#8e7323] text-white py-3 rounded-lg font-bold shadow-md transition-colors"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
