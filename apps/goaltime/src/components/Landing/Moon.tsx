import React from 'react';

interface MoonProps {
  top: number;
  right: number;
}

const Moon = React.forwardRef<SVGSVGElement, MoonProps>(({ top, right }, ref) => {
  return (
    <svg
      ref={ref}
      viewBox="-100 -100 200 200"
      width="13vw"
      height="13vw"
      style={{ position: 'fixed', top, right }}
    >
      <defs>
        <mask id="moonMask">
          <rect x="-60" y="-60" width="120" height="120" fill="white" />
          <circle cx="15" cy="-15" r="55" fill="black" />
        </mask>
      </defs>
      <circle cx="0" cy="0" r="60" fill="white" mask="url(#moonMask)" />
    </svg>
  );
});

Moon.displayName = 'Moon'

export default Moon
