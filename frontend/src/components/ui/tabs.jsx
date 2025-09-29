import React, { useState } from "react";

// Tabs container
export function Tabs({ defaultValue, children, className }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  // Pass state + setter down to children
  return (
    <div className={`w-full ${className || ""}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

// Tab buttons row
export function TabsList({ children, className }) {
  return (
    <div className={`flex border-b mb-2 ${className || ""}`}>
      {children}
    </div>
  );
}

// Single tab button
export function TabsTrigger({ value, children, activeTab, setActiveTab, className }) {
  const isActive = activeTab === value;
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
        ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-600"}
        ${className || ""}
      `}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

// Tab content (only shows if active)
export function TabsContent({ value, children, activeTab, className }) {
  if (activeTab !== value) return null;
  return <div className={`p-2 ${className || ""}`}>{children}</div>;
}
