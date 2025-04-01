import React from "react";

interface ColorSampleProps {
  color: string;
  name: string;
  hex: string;
}

function ColorSample({ color, name, hex }: ColorSampleProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="h-16 w-16 rounded-full mb-2"
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{hex}</div>
      </div>
    </div>
  );
}

export default function BrandPalette() {
  const colors = [
    { color: "#0f1819", name: "Dark", hex: "#0f1819" },
    { color: "#600000", name: "Maroon", hex: "#600000" },
    { color: "#ed1f1f", name: "Red", hex: "#ed1f1f" },
    { color: "#2d29dd", name: "Blue", hex: "#2d29dd" },
    { color: "#29dd6c", name: "Green", hex: "#29dd6c" },
    { color: "#bbdcf7", name: "Light Blue", hex: "#bbdcf7" },
  ];

  return (
    <div className="p-4 border rounded-lg bg-accent/10">
      <h3 className="text-lg font-semibold mb-4">Brand Color Palette</h3>
      <div className="flex flex-wrap gap-6 justify-center">
        {colors.map((color) => (
          <ColorSample key={color.hex} {...color} />
        ))}
      </div>
    </div>
  );
} 