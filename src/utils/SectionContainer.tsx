import React from "react";

const SectionContainer = ({ children, className = "" }:{children:React.ReactNode, className?:string}) => {
  return (
    <div className={` py-10 ${className}`}>
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
      {children}
    </div>

    </div>
  );
};

export default SectionContainer;
