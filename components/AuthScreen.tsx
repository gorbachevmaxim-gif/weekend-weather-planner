import React, { useState, useRef } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerRef.current.style.setProperty('--cursor-x', `${x}px`);
        containerRef.current.style.setProperty('--cursor-y', `${y}px`);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current || e.touches.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        containerRef.current.style.setProperty('--cursor-x', `${x}px`);
        containerRef.current.style.setProperty('--cursor-y', `${y}px`);
    };

    const renderMarqueeRows = (colorClass: string) => (
        <>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex whitespace-nowrap overflow-hidden">
                    <div 
                        className={`flex ${i % 2 === 0 ? 'animate-marquee' : 'animate-marquee-reverse'}`} 
                        style={{ animationDuration: `${320 + i * 60}s` }}
                    >
                        {[...Array(2)].map((_, j) => (
                            <span key={j} className={`text-[20vh] leading-none font-unbounded font-black ${colorClass} px-4`}>
                                RAIN FREE RIDE UNBOUND RAIN FREE RIDE UNBOUND RAIN FREE RIDE UNBOUND
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="min-h-screen flex items-center justify-center bg-[#111111] px-8 py-8 relative overflow-hidden"
        >
            {/* Background Animation - Base Layer */}
            <div className="absolute inset-0 flex flex-col justify-between py-10 pointer-events-none select-none z-0">
                {renderMarqueeRows("text-[#111111]")}
            </div>

            {/* Background Animation - Highlight Layer */}
            <div 
                className="absolute inset-0 flex flex-col justify-between py-10 pointer-events-none select-none z-0"
                style={{
                    maskImage: 'radial-gradient(circle 250px at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle 250px at var(--cursor-x, -100%) var(--cursor-y, -100%), black 0%, transparent 100%)',
                }}
            >
                {renderMarqueeRows("text-[#444444]")}
            </div>

            <div className="flex flex-col items-center max-w-[700px] w-full relative z-10">
                <h2 className="text-[19px] md:text-[30px] font-unbounded font-medium text-white mb-2 text-center whitespace-normal md:whitespace-nowrap px-4 md:px-0 leading-tight">Rain Free. Ride Unbound.</h2>
                <p className="text-[15px] md:text-[18px] font-sans text-neutral-400 mb-8 md:mb-12 text-center">Ищем сухие дороги для тебя</p>
                
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <div className="text-white font-sans text-[15px] md:text-[18px] leading-relaxed text-left opacity-80">
                        Free – это всегда про освобождение. Rainfree – это возвращение к легкости. Это свобода ехать в джерси, чувствуя ветер кожей. Это тактильная свобода. Обычно прогноз погоды работает как тюремщик. Сегодня дождь, сидим дома. И ты становишься заложником станка или дивана. Rainfree — это план побега. Приложение дает тебе ключ
                        <span className="inline-block mx-2 align-middle relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-[120px] md:w-[140px] pl-0 pr-7 py-0 bg-[#111111] border-none rounded-md focus:outline-none focus:ring-0 focus:ring-white text-white text-left text-[15px] md:text-[18px]"
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
                        Оно говорит: смотри, везде льет, а вот здесь есть окошко. Ты катаешься под солнцем, когда другие боятся нос высунуть. Это бунтарство, как и во фрирайде. Это способ обмануть систему и найти сухой асфальт там, где другие видят только тучи. Если freeride – это катание вне трасс, то Rainfree – это катание сквозь погоду. Твой маршрут диктует не чей-то план, а небо. Это новый вид навигации. 
                    </div>

                    {error && (
                        <div className="text-red-500 text-[11px] text-center mt-6">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-8 bg-[#B8B8BA] text-[#2C2C2C] text-[15px] tracking-tighter rounded-full px-4 py-1 hover:bg-[#FFFFFF] focus:outline-none disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? '...' : 'Поехали'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthScreen;
