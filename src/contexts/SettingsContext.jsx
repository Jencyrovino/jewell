import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext(null);

const defaultSettings = {
    storeInfo: {
        storeName: '',
        gstin: '',
        phoneNumber: '',
        email: '',
        address: ''
    },
    taxSettings: {
        cgst: 1.5,
        sgst: 1.5
    },
    goldRate: {
        rate22k: 6250,
        rate18k: 5100,
        silverRate: 75
    }
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('jw_settings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('jw_settings', JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('jw_settings_updated'));
    }, [settings]);

    const updateStoreInfo = (info) => {
        setSettings(prev => ({ ...prev, storeInfo: { ...prev.storeInfo, ...info } }));
    };

    const updateTaxSettings = (taxes) => {
        setSettings(prev => ({ ...prev, taxSettings: { ...prev.taxSettings, ...taxes } }));
    };

    const updateGoldRate = (rates) => {
        setSettings(prev => ({ ...prev, goldRate: { ...prev.goldRate, ...rates } }));
    };

    const clearData = () => {
        // Assuming a function to clear all local storage data, or specific keys
        if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            localStorage.removeItem('jw_customers');
            localStorage.removeItem('jw_stock');
            localStorage.removeItem('jw_settings');
            localStorage.removeItem('orders');
            localStorage.removeItem('jw_cash_ledger');
            localStorage.removeItem('jw_gold_ledger');

            setSettings(defaultSettings);
            window.dispatchEvent(new Event('storage')); // Trigger other components if they listen to 'storage'
            alert("All data cleared successfully.");
            window.location.reload();
        }
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateStoreInfo,
            updateTaxSettings,
            updateGoldRate,
            clearData
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
