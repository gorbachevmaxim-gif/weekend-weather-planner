import * as React from "react";

interface ArrowDownProps extends React.SVGProps<SVGSVGElement> {
  isOpen: boolean;
}

const ArrowDown: React.FC<ArrowDownProps> = ({ isOpen, ...props }) => (
    <svg 
        style={{ 
            position: 'relative', 
            top: '-5px', 
            transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease-in-out',
        }} 
        width="25" 
        height="25" 
        viewBox="0 0 30 30" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        {...props}
    >
        <line x1="15" y1="7.5" x2="15" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="7.5 15.5 15 23 22.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default ArrowDown;
