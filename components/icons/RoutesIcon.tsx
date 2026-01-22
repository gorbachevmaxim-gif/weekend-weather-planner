import * as React from "react";

const RoutesIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ style, ...props }) => (
    <svg style={{ position: 'relative', top: '-5px', transform: 'rotate(45deg)', ...style }} width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <line x1="15" y1="20.5" x2="15" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="7.5 12.5 15 5 22.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default RoutesIcon;
