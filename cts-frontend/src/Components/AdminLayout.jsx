import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar isOpen={open} toggle={() => setOpen((v) => !v)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setOpen((v) => !v)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
