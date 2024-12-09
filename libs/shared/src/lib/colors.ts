export function getDistinctColor(colors: string[], minDifference = 30) {
  // Convert hex to HSL
  function hexToHSL(hex: string) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Convert to RGB
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // eslint-disable-next-line prefer-const
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  // Convert HSL to hex
  function HSLToHex(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h / 360 + 1/3);
    const g = hue2rgb(p, q, h / 360);
    const b = hue2rgb(p, q, h / 360 - 1/3);

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Calculate color difference in HSL space
  function getColorDifference(hsl1: number[], hsl2: number[]) {
    const [h1, s1, l1] = hsl1;
    const [h2, s2, l2] = hsl2;
    
    // Calculate hue difference considering the circular nature of hue
    const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
    const satDiff = Math.abs(s1 - s2);
    const lightDiff = Math.abs(l1 - l2);
    
    return (hueDiff / 360) + (satDiff / 100) + (lightDiff / 100);
  }

  // Convert input colors to HSL
  const hslColors = colors.map(color => hexToHSL(color));
  
  // Calculate average hue, saturation, and lightness
  const avgHue = hslColors.reduce((sum, color) => sum + color[0], 0) / hslColors.length;
  const avgSaturation = hslColors.reduce((sum, color) => sum + color[1], 0) / hslColors.length;
  const avgLightness = hslColors.reduce((sum, color) => sum + color[2], 0) / hslColors.length;

  // Generate contrasting color
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Add randomness to ensure contrast, avoiding green (90-150) and blue (190-270)
    let hueVariation;
    do {
      hueVariation = (Math.random() - 0.5) * 180; // Larger variation for contrast
    } while ((avgHue + hueVariation >= 90 && avgHue + hueVariation <= 150) ||
             (avgHue + hueVariation >= 190 && avgHue + hueVariation <= 270));

    const saturationVariation = (Math.random() - 0.5) * 50; // Larger variation for contrast
    const lightnessVariation = (Math.random() - 0.5) * 50; // Larger variation for contrast

    let newHue = (avgHue + hueVariation + 360) % 360;
    const newSaturation = Math.min(100, Math.max(0, avgSaturation + saturationVariation));
    const newLightness = Math.min(100, Math.max(0, avgLightness + lightnessVariation));

    // Manual adjustment if the hue still falls within the undesired range
    if ((newHue >= 90 && newHue <= 150) || (newHue >= 190 && newHue <= 270)) {
      newHue = (newHue + 180) % 360; // Shift hue by 180 degrees to move away from undesired range
    }

    const newColor = [newHue, newSaturation, newLightness];

    // Check if color is distinct enough from all existing colors
    const isDistinct = hslColors.every(existingColor => 
      getColorDifference(newColor, existingColor) > minDifference/100
    );

    if (isDistinct) {
      return HSLToHex(newHue, newSaturation, newLightness);
    }

    attempts++;
  }

  // Fallback: return average color if no distinct color found
  return HSLToHex(avgHue, avgSaturation, avgLightness);
}
