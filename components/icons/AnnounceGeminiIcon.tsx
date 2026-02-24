import React from "react";

interface AnnounceGeminiIconProps {
  width?: number;
  height?: number;
  className?: string;
  isDark?: boolean;
}

const AnnounceGeminiIcon: React.FC<AnnounceGeminiIconProps> = ({ width = 24, height = 24, className = "", isDark = false }) => {
  const strokeColor = isDark ? "#D9D9D9" : "#141B34";
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 11V10C20 6.22876 20 4.34315 18.7595 3.17157C17.519 2 15.5225 2 11.5294 2L10.4706 2C6.47752 2 4.48098 2 3.24049 3.17157C2 4.34315 2 6.22876 2 10L2 14C2 17.7712 2 19.6569 3.24049 20.8284C4.48098 22 6.47751 22 10.4706 22H11"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 7H15"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 12H13"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 14L17.3848 15.7083C17.7112 17.1572 18.8427 18.2888 20.2917 18.6152L22 19L20.2917 19.3848C18.8427 19.7112 17.7112 20.8427 17.3848 22.2917L17 24L16.6152 22.2917C16.2888 20.8427 15.1573 19.7112 13.7083 19.3848L12 19L13.7083 18.6152C15.1572 18.2888 16.2888 17.1573 16.6152 15.7083L17 14Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AnnounceGeminiIcon;
