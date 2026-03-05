import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        // Simulate login
        if (userId === 'admin' && password === 'admin123') {
            sessionStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
        } else {
            setError('Invalid User ID or Password.');
        }
    };

    return (
        <div className="min-h-screen bg-jw-green flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle background decoration to keep it premium but not distractive */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-jw-gold blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-jw-gold blur-[100px]"></div>
            </div>

            <div className="z-10 w-full max-w-md bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif font-bold text-jw-gold mb-2 tracking-wide">IBT Jewellery</h1>
                    <p className="text-jw-gold-light text-sm tracking-widest uppercase">Store Management System</p>
                </div>

                {error && (
                    <div className="mb-4 p-2 border border-red-500/50 bg-red-500/10 text-red-200 text-sm text-center rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-jw-gold-light text-sm font-semibold mb-2" htmlFor="userId">
                            USER ID
                        </label>
                        <input
                            id="userId"
                            type="text"
                            placeholder="Enter User ID"
                            className="w-full bg-gray-100 text-gray-800 px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-jw-gold transition-all"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-jw-gold-light text-sm font-semibold mb-2" htmlFor="password">
                            PASSWORD
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter Password"
                                className="w-full bg-gray-100 text-gray-800 px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-jw-gold transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-jw-green transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-jw-gold hover:bg-jw-gold-dark text-jw-green font-bold py-3 px-4 rounded transition-colors duration-300 mt-4 uppercase tracking-wider shadow-lg"
                    >
                        Login
                    </button>
                </form>
            </div>

            <div className="absolute bottom-6 text-center text-white/50 text-xs">
                &copy; 2026 IBT Jewellery Store. All rights reserved.
            </div>
        </div>
    );
}
