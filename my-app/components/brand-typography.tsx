import React from "react";

export default function BrandTypography() {
  return (
    <div className="p-4 border rounded-lg bg-accent/10">
      <h3 className="text-lg font-semibold mb-4">Brand Typography</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Montserrat (Display Font)</h4>
          <div className="space-y-2">
            <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-montserrat)" }}>
              Montserrat Bold
            </p>
            <p className="text-4xl" style={{ fontFamily: "var(--font-montserrat)" }}>
              Montserrat Regular
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Playfair Display (Heading Font)</h4>
          <div className="space-y-2">
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
              Playfair Display Bold
            </p>
            <p className="text-3xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Playfair Display Regular
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Inter (Body Font)</h4>
          <div className="space-y-2">
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-inter)" }}>
              Inter Bold
            </p>
            <p className="text-base" style={{ fontFamily: "var(--font-inter)" }}>
              Inter Regular
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Typography Scale</h4>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Display</span>
              <p className="text-5xl font-bold" style={{ fontFamily: "var(--font-montserrat)" }}>
                Display Text 5XL
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Heading 1</span>
              <h1 className="text-4xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                Heading 1 (4XL)
              </h1>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Heading 2</span>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                Heading 2 (3XL)
              </h2>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Heading 3</span>
              <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                Heading 3 (2XL)
              </h3>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Body</span>
              <p className="text-base" style={{ fontFamily: "var(--font-inter)" }}>
                Body text is set in Inter at 16px (base). This is an example of a paragraph that may appear on the website. The typeface should be clean and highly readable at all sizes.
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Small</span>
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                Small text is set in Inter at 14px (sm).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 