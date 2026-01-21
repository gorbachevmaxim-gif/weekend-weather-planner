import * as React from 'react';

interface LogoProps {
  percent?: number;
  className?: string;
}

const GastrodinamikaLogo: React.FC<LogoProps> = ({ percent = 0, className = "" }) => {
  const startAngle = 286;

  // Inline SVG markup from gastrodinamika_ronde_novo.svg
  const svgMarkup = `
<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 842 842">
  <title>gastrodinamika_ronde_novo</title>
  <style>
    .s0 { fill: none;stroke: #1E1E1E;stroke-linecap: round;stroke-linejoin: round;stroke-width: 20 }
  </style>
  <g id="Graphics 2 copy 2">
    <path id="Г" fill-rule="evenodd" class="s0" d="m137 200.9c0 0-8.9 10.7-21.3 30.5-12.5 19.7-18.9 32.6-18.9 32.6l250.9 124.3"/>
    <g id="--A cut">
      <path id="Shape 41" fill-rule="evenodd" class="s0" d="m348.1 387.7l-158.2-239.6 6.4-5.9 163.7 161.8"/>
      <path id="Shape 42" fill-rule="evenodd" class="s0" d="m237.5 296l59.4-54.3"/>
    </g>
    <path id="С" fill-rule="evenodd" class="s0" d="m400 277.7c5.3 37.7 12.7 68.3-4.3 70.2-20.6 2.2-64.6-104-88.2-177.5-23.6-73.5-7.6-85 2.7-88.4 12.1-4 38.3 8.9 61.9 82.4"/>
    <g id="T">
      <path id="Т copy 2" fill-rule="evenodd" class="s0" d="m381.8 67.2h99.8"/>
      <path id="Shape 60" fill-rule="evenodd" class="s0" d="m433.7 343.6c0 0-3-277.2-3-276.4"/>
    </g>
    <path id="P" fill-rule="evenodd" class="s0" d="m435.7 344.1l84.8-265.8c0 0 63.9 3.3 39.5 73.1-32.6 93.7-73.5 83.7-88.5 81"/>
    <path id="О" fill-rule="evenodd" class="s0" d="m473.7 360.5c-16.2-14.3 42.5-84.8 96.2-138.1 51.3-51.1 80.3-80.1 102.7-57.8 19.8 19.6 0.2 50.2-54.2 98-56.2 49.4-130.5 110.4-144.7 97.9z"/>
    <g id="Д">
      <path id="Shape 58" fill-rule="evenodd" class="s0" d="m458.8 402.9l288.2-136.3c0 0 8.3 16.7 15.3 34.7 7.1 17.9 14.5 47.4 14.5 47.4l-309.6 74.6"/>
      <path id="Shape 37 copy 2" fill-rule="evenodd" class="s0" d="m428.5 384.3c24.8 3.5 42.1 26.4 38.6 51.3-3.5 24.8-26.4 42.1-51.3 38.5-24.8-3.6-42-26.4-38.5-51.2"/>
    </g>
    <g id="И">
      <path id="Shape 52" fill-rule="evenodd" class="s0" d="m505.6 439.6l278.4-17.7"/>
      <path id="Shape 54" fill-rule="evenodd" class="s0" d="m622.9 432.6l150 81.7"/>
      <path id="Shape 53" fill-rule="evenodd" class="s0" d="m774.2 514.8l-274.5-46"/>
    </g>
    <g id="Н">
      <path id="Shape 52" fill-rule="evenodd" class="s0" d="m499.8 469.2l240 133.8"/>
      <path id="Shape 53" fill-rule="evenodd" class="s0" d="m688.3 675.2l-206-186.6"/>
      <path id="Shape 62" fill-rule="evenodd" class="s0" d="m618.3 535.7l-49.2 63.8"/>
    </g>
    <g id="-A-">
      <path id="Shape 41 copy 2" fill-rule="evenodd" class="s0" d="m482 488.4l100.9 265.8-17 8.3-132.6-249.4"/>
      <path id="Shape 42" fill-rule="evenodd" class="s0" d="m533.1 622.7l-33.3 15.5"/>
    </g>
    <path id="М" fill-rule="evenodd" class="s0" d="m432.9 512.4l24.2 277.9-8.2 0.7-49.8-163.5-85.2 148.4-6.7-2.2 78.4-267.4"/>
    <g id="И">
      <path id="Shape 52" fill-rule="evenodd" class="s0" d="m384.9 506.2l-159 229.8"/>
      <path id="Shape 54" fill-rule="evenodd" class="s0" d="m318.5 601.1l-170 66.6"/>
      <path id="Shape 53" fill-rule="evenodd" class="s0" d="m149.5 666.8l205.3-185.9"/>
    </g>
    <g id="К">
      <path id="Shape 55" fill-rule="evenodd" class="s0" d="m110.4 617.4l244.7-137.2"/>
      <path id="Shape 56" fill-rule="evenodd" class="s0" d="m76.7 543.9l144.5-14.5 66.2-70.4"/>
      <path id="Shape 57" fill-rule="evenodd" class="s0" d="m221.3 529.6l11.4 19.3"/>
    </g>
    <g id="--A">
      <path id="Shape 41 copy" fill-rule="evenodd" class="s0" d="m344.4 461.1l-285.9-13.5-0.9-8.6 283.1-33.5"/>
      <path id="Shape 42" fill-rule="evenodd" class="s0" d="m204.6 484.8l-6.9-62.1"/>
    </g>
  </g>
</svg>
`;

  // Wrapper divs: background (faded) + active (masked with conic-gradient)
  const maskStyle: React.CSSProperties = {
    maskImage: `conic-gradient(from ${startAngle}deg, #1E1E1E ${percent}%, transparent ${percent}%)`,
    WebkitMaskImage: `conic-gradient(from ${startAngle}deg, #1E1E1E ${percent}%, transparent ${percent}%)`
  };

  return (
    <div className={`relative ${className}`}>
      {/* Background faded layer */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none grayscale opacity-20 mix-blend-multiply"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />

      {/* Active masked layer */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
        style={maskStyle}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </div>
  );
};

export default GastrodinamikaLogo;
