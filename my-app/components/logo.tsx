import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { height: 24, width: 120 },
    md: { height: 36, width: 180 },
    lg: { height: 48, width: 240 },
  };

  const { height, width } = sizes[size];

  return (
    <div className={`flex items-center ${className}`}>
      <svg width={height} height={height} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blue Ring */}
        <circle cx="60" cy="60" r="25" stroke="#2d29dd" strokeWidth="10" fill="none" />
        {/* Red Ring */}
        <circle cx="40" cy="80" r="25" stroke="#600000" strokeWidth="10" fill="none" />
        {/* Green Ring */}
        <circle cx="80" cy="80" r="25" stroke="#29dd6c" strokeWidth="10" fill="none" />
      </svg>
      <span 
        className="ml-2 text-[#0f1819] font-bold"
        style={{ 
          fontSize: size === "sm" ? "1.2rem" : size === "md" ? "1.5rem" : "2rem",
          fontFamily: "var(--font-montserrat)"
        }}
      >
        Aggie Nexus
      </span>
    </div>
  );
} 