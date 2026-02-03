import React, { useState } from 'react';
import { verifyPassword, setAuthenticated } from '../utils/auth';
import { track } from '@vercel/analytics';

interface AuthScreenProps {
    onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const isValid = await verifyPassword(password);
            if (isValid) {
                track('Login', { method: 'code', code: password });
                setAuthenticated();
                onLogin();
            } else {
                setError('Неверный код доступа');
            }
        } catch (err) {
            setError('Ошибка проверки');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E]">
            <div className="flex flex-col items-center w-min">
                <h2 className="text-[30px] font-unbounded font-medium text-white mb-12 text-center whitespace-nowrap">Ветролов</h2>
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-6">
                    <div className="w-full flex flex-col items-center">
                        <label className="block text-xs text-neutral-400 text-center mb-2 uppercase whitespace-nowrap">
                            Код доступа
                        </label>
                        
                        <div className="flex flex-col gap-6 w-full">
                            <div className="relative w-full">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-0 py-2 bg-[#333333] border-none rounded-md focus:outline-none focus:ring-1 focus:ring-white text-white text-center text-[13px]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            
                            {error && (
                                <div className="text-red-500 text-[11px] text-center whitespace-nowrap absolute transform translate-y-[45px]">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-auto self-center whitespace-nowrap bg-[#B8B8BA] text-[#2C2C2C] text-[13px] tracking-tighter rounded-full px-6 py-2 hover:bg-[#FFFFFF] focus:outline-none disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? '...' : 'Войти'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthScreen;
