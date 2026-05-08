import React, { useState } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { useStore } from '../../store/useStore';
import { 
  Home, 
  ChevronRight, 
  Share2, 
  Maximize2, 
  HelpCircle, 
  Settings,
  Grid3X3,
  Box,
  Layout,
  Undo2,
  Redo2,
  FileText,
  X,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateBOQ, BOQItem } from '../../lib/pricing';

export const TopBar: React.FC = () => {
  const { viewMode, setViewMode, walls, furniture, openings } = useStore();
  const { undo, redo, pastStates, futureStates } = useZustandStore(useStore.temporal, (state: any) => state);
  const [showQuotation, setShowQuotation] = useState(false);

  const menuItems = [
    'Home', 'View', 'Insert', 'Draw', 'Architecture', 'Annotate', 'Render', 'Outputs'
  ];

  const boq = generateBOQ(walls, furniture, openings);
  const total = boq.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-[100] select-none">
      {/* Quotation Overlay */}
      {showQuotation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-4xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Project Quotation</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bill of Quantities (BOQ)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={() => setShowQuotation(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Item Description</th>
                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Qty</th>
                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Unit</th>
                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Rate</th>
                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {boq.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 text-xs font-bold text-slate-700">{item.name}</td>
                      <td className="py-3.5 text-xs font-semibold text-slate-500 text-right">{item.quantity}</td>
                      <td className="py-3.5 text-xs font-semibold text-slate-500 text-right uppercase tracking-tighter">{item.unit}</td>
                      <td className="py-3.5 text-xs font-semibold text-slate-600 text-right">₹{item.rate.toLocaleString()}</td>
                      <td className="py-3.5 text-xs font-bold text-slate-900 text-right">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {boq.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Add some items to generate a quote</p>
                </div>
              )}
            </div>

            <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col items-end gap-1">
              <div className="flex items-center gap-12 w-full justify-between lg:w-fit">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-bold text-slate-600">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-12 w-full justify-between lg:w-fit mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax (GST 18%)</span>
                <span className="text-sm font-bold text-slate-600">₹{(total * 0.18).toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-200 w-full lg:w-64 my-2" />
              <div className="flex items-center gap-12 w-full justify-between lg:w-fit">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-black text-blue-600">₹{(total * 1.18).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left: Brand & Breadcrumbs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Layout size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight italic">
            Design <span className="font-normal text-slate-400 not-italic">OS</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
           <button 
             onClick={undo}
             disabled={pastStates.length === 0}
             className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
           >
             <Undo2 size={16} />
           </button>
           <button 
             onClick={redo}
             disabled={futureStates.length === 0}
             className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
           >
             <Redo2 size={16} />
           </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Home size={14} />
          <ChevronRight size={12} className="text-slate-300" />
          <span className="hover:text-blue-600 cursor-pointer transition-colors px-1">Design1</span>
          <ChevronRight size={12} className="text-slate-300" />
          <div className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 group">
            <span>Kitchen</span>
            <ChevronRight size={10} className="rotate-90 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Center: Menu Items */}
      <nav className="hidden lg:flex items-center gap-1">
        {menuItems.map((item) => (
          <button 
            key={item}
            onClick={() => {
              if (item === 'Outputs') setShowQuotation(true);
            }}
            className={cn(
              "px-3 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-all rounded",
              item === 'Outputs' && "text-blue-600 font-bold bg-blue-50"
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right: Mode Toggles & Global Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center p-0.5 bg-slate-100/80 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('2D')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all",
              viewMode === '2D' 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-white"
            )}
          >
            <Layout size={12} />
            <span>Floorplan</span>
          </button>
          <button
            onClick={() => setViewMode('3D')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all",
              viewMode === '3D' 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-white"
            )}
          >
            <Box size={12} />
            <span>3D</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Share">
            <Share2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Full Screen">
            <Maximize2 size={16} />
          </button>
          <button 
            onClick={() => setShowQuotation(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all" title="Quotation"
          >
            <FileText size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Settings">
            <Settings size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shadow-inner">
             AG
           </div>
        </div>
      </div>
    </div>
  );
};
