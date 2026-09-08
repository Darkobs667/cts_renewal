// ─────────────────────────────────────────────────────────────
// AdminLayout.jsx
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AdminLayout = ({ children, activePage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activePage={activePage}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;