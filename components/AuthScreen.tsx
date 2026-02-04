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
        <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E] px-8 py-8">
            <div className="flex flex-col items-center max-w-[540px] w-full">
                <h2 className="text-[19px] md:text-[30px] font-unbounded font-medium text-white mb-2 text-center whitespace-normal md:whitespace-nowrap px-4 md:px-0 leading-tight">Rain Free. Ride Unbound.</h2>
                <p className="text-[13px] md:text-[15px] font-sans text-neutral-400 mb-8 md:mb-12 text-center">Ищем сухие дороги для тебя</p>
                
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <div className="text-white font-sans text-[13px] md:text-[15px] leading-relaxed text-left opacity-80">
                        Free – это всегда про освобождение. Дождь – это всегда тяжесть в экипировке. Rainfree – это возвращение к легкости. Это свобода ехать в джерси, чувствуя ветер кожей. Это тактильная свобода. Обычно прогноз погоды работает как тюремщик. Сегодня дождь, сидим дома. И ты становишься заложником станка или дивана. Rainfree — это план побега. Приложение дает тебе ключ
                        <span className="inline-block mx-2 align-middle relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-[120px] md:w-[140px] pl-0 pr-7 py-0 bg-[#1E1E1E] border-none rounded-md focus:outline-none focus:ring-0 focus:ring-white text-white text-left text-[12px] md:text-[13px]"
                                placeholder=" "
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </span>
                        Оно говорит: смотри, везде льет, а вот здесь есть окошко. Ты катаешься под солнцем, когда другие боятся нос высунуть. Это бунтарство, как и во фрирайде. Это способ обмануть систему и найти сухой асфальт там, где другие видят только тучи. Мы не просто строим маршрут по карте, мы серфим между циклонами. Если freeride – это катание вне трасс, то Rainfree – это катание сквозь погоду. Твой маршрут диктует не чей-то план, а небо. Это новый вид навигации.
                    </div>

                    {error && (
                        <div className="text-red-500 text-[11px] text-center mt-6">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-8 bg-[#B8B8BA] text-[#2C2C2C] text-[13px] tracking-tighter rounded-full px-4 py-1 hover:bg-[#FFFFFF] focus:outline-none disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? '...' : 'Поехали'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthScreen;
