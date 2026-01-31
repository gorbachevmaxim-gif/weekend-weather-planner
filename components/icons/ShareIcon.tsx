import * as React from "react";

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth="2"
        {...props}
    >
        <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ShareIcon;
