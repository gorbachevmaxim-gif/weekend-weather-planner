import React from "react";

interface GeminiIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const GeminiIcon: React.FC<GeminiIconProps> = ({ width = 26, height = 26, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12.65 0.649994L13.5735 4.74984C14.3569 8.22739 17.0726 10.9431 20.5501 11.7265L24.65 12.65L20.5501 13.5735C17.0726 14.3569 14.3569 17.0726 13.5735 20.5501L12.65 24.65L11.7265 20.5501C10.9431 17.0726 8.2274 14.3569 4.74984 13.5735L0.649994 12.65L4.74984 11.7265C8.22739 10.9431 10.9431 8.2274 11.7265 4.74984L12.65 0.649994Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default GeminiIcon;
