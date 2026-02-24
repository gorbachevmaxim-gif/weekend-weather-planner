import React, { useState, useEffect } from "react";

interface AccordionContentProps {
    isOpen: boolean;
    children: React.ReactNode;
}

const AccordionContent: React.FC<AccordionContentProps> = ({ isOpen, children }) => {
  const [overflow, setOverflow] = useState("overflow-hidden");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setOverflow("overflow-visible"), 300);
      return () => clearTimeout(timer);
    } else {
      setOverflow("overflow-hidden");
    }
  }, [isOpen]);

  return (
    <div 
        className="grid transition-all duration-300 ease-in-out" 
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
    >
      <div className={overflow}>
        {children}
      </div>
    </div>
  );
};

export default AccordionContent;
