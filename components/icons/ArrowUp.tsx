import * as React from "react";

const ArrowUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="27"
        height="27"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth="2"
        {...props}
    >
        <line x1="15" y1="23" x2="15" y2="7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="22.5 15.5 15 7.5 7.5 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default ArrowUp;
