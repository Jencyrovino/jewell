import React, { useState } from 'react';
import SupplierMaster from '../components/master/SupplierMaster';
import ProductMaster from '../components/master/ProductMaster';
import CustomerMaster from '../components/master/CustomerMaster';

export default function MasterData() {
    const [activeTab, setActiveTab] = useState('supplier'); // 'supplier', 'product', 'customer'

    return (
        <div className="flex flex-col h-full bg-gray-50 -my-4 -mx-4 md:-my-8 md:-mx-8 p-4 md:p-8">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-jw-green tracking-tight">Master Data</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all your core application configurations securely.</p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex mx-auto md:mx-0">
                    <button
                        onClick={() => setActiveTab('supplier')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'supplier'
                                ? 'bg-jw-green text-jw-gold shadow-md'
                                : 'text-gray-500 hover:text-jw-green hover:bg-jw-green/5'
                            }`}
                    >
                        Supplier Master
                    </button>
                    <button
                        onClick={() => setActiveTab('product')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'product'
                                ? 'bg-jw-green text-jw-gold shadow-md'
                                : 'text-gray-500 hover:text-jw-green hover:bg-jw-green/5'
                            }`}
                    >
                        Product Master
                    </button>
                    <button
                        onClick={() => setActiveTab('customer')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customer'
                                ? 'bg-jw-green text-jw-gold shadow-md'
                                : 'text-gray-500 hover:text-jw-green hover:bg-jw-green/5'
                            }`}
                    >
                        Customer Master
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[500px]">
                {activeTab === 'supplier' && <SupplierMaster />}
                {activeTab === 'product' && <ProductMaster />}
                {activeTab === 'customer' && <CustomerMaster />}
            </div>
        </div>
    );
}
