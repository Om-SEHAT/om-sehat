import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href = "#main-content", 
  children = "Langsung ke konten utama" 
}) => (
  <a 
    href={href}
    className="skip-link sr-only focus:not-sr-only"
  >
    {children}
  </a>
);

export default SkipLink;
