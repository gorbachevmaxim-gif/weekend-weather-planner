import * as React from 'react';

interface YandexIconProps {
  idSuffix: string;
}

const YandexIcon: React.FC<YandexIconProps> = ({ idSuffix }) => (
  <svg width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.848.807a12 12 0 1 1-12 12 12 12 0 0 1 12-12Z" fill="#FC0"></path>
    <path d="m14.998 18.275-1.326 1.17-2.99 2.834h4.902l5.746-5.744-5.728-5.728H10.7l.056.052 1.256 1.11 2.992 2.838H1.018c.203 1.208.59 2.378 1.15 3.468h12.83Z" fill={`url(#serviceLogo-${idSuffix})`}></path>
    <g filter={`url(#serviceLogoFilter-${idSuffix})`}>
      <path d="M10.1 14.807h4.904l-3-2.834-1.256-1.11-.07-.06h14a11.98 11.98 0 0 0-1.152-3.47H10.7l1.322-1.19 2.964-2.8h-4.902L4.356 9.07l5.744 5.738Z" fill="#fff"></path>
    </g>
    <defs>
      <linearGradient id={`serviceLogo-${idSuffix}`} x1="11.174" y1="22.279" x2="11.174" y2="10.807" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FC3F1D"></stop>
        <stop offset="1" stop-color="#FF2700"></stop>
      </linearGradient>
      <filter id={`serviceLogoFilter-${idSuffix}`} x="3.727" y="2.923" width="21.162" height="12.304" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
        <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
        <feOffset dx="-.21"></feOffset>
        <feGaussianBlur stdDeviation=".21"></feGaussianBlur>
        <feColorMatrix values="0 0 0 0 0.0509804 0 0 0 0 0.137255 0 0 0 0 0.262745 0 0 0 0.05 0"></feColorMatrix>
        <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_15_8407"></feBlend>
        <feBlend in="SourceGraphic" in2="effect1_dropShadow_15_8407" result="shape"></feBlend>
      </filter>
    </defs>
  </svg>
);

export default YandexIcon;
