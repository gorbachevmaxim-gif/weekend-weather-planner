import React from "react";

interface CenterIconProps extends React.SVGProps<SVGSVGElement> {
    isDark?: boolean;
}

const CenterIcon: React.FC<CenterIconProps> = ({ isDark, className, ...props }) => {
    if (isDark) {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
                <g clipPath="url(#clip0_302_1074)">
                    <path d="M20.5137 12C20.5137 16.6944 16.7081 20.5 12.0137 20.5C7.31925 20.5 3.51367 16.6944 3.51367 12C3.51367 7.30558 7.31925 3.5 12.0137 3.5C16.7081 3.5 20.5137 7.30558 20.5137 12Z" fill="#130D07" stroke="#CCCCCC" strokeWidth="1.5"/>
                    <path d="M22.5 12H20.5" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.5 12H1.5" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 1.5V3.5" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20.5V22.5" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12C15 13.6569 13.6568 15 12 15C10.3431 15 8.99995 13.6569 8.99995 12C8.99995 10.3431 10.3431 9 12 9C13.6568 9 15 10.3431 15 12Z" stroke="#CCCCCC" strokeWidth="1.5"/>
                </g>
                <defs>
                    <clipPath id="clip0_302_1074">
                        <rect width="24" height="24" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        );
    }
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
            <g clipPath="url(#clip0_302_1032)">
                <path d="M20.5137 12C20.5137 16.6944 16.7081 20.5 12.0137 20.5C7.31925 20.5 3.51367 16.6944 3.51367 12C3.51367 7.30558 7.31925 3.5 12.0137 3.5C16.7081 3.5 20.5137 7.30558 20.5137 12Z" fill="#F5F5F5" stroke="black" strokeWidth="1.5"/>
                <path d="M22.5 12H20.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.5 12H1.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 1.5V3.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20.5V22.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12C15 13.6569 13.6568 15 12 15C10.3431 15 8.99995 13.6569 8.99995 12C8.99995 10.3431 10.3431 9 12 9C13.6568 9 15 10.3431 15 12Z" stroke="black" strokeWidth="1.5"/>
            </g>
            <defs>
                <clipPath id="clip0_302_1032">
                    <rect width="24" height="24" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
};

export default CenterIcon;
