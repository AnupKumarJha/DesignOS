import React from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Printer, X, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { downloadJson } from '../../lib/persistence';
import { downloadHandoffJson, downloadScheduleCsv } from '../../lib/outputs';
import { QuotationModal } from './QuotationModal';

interface OutputsCenterProps {
  open: boolean;
  onClose: () => void;
}

export const OutputsCenter: React.FC<OutputsCenterProps> = ({ open, onClose }) => {
  const getSnapshot = useStore((state) => state.getSnapshot);
  const [quoteOpen, setQuoteOpen] = React.useState(false);

  if (!open) return null;

  const csvItems = [
    ['rooms', 'Room Schedule', 'Room list, hierarchy, area, and counts'],
    ['walls', 'Wall Schedule', 'Lengths, heights, finishes, cornice, skirting'],
    ['openings', 'Door / Window Schedule', 'Door and window sizes and offsets'],
    ['furniture', 'Furniture Schedule', 'SKU, dimensions, position, finish'],
    ['materials', 'Material Schedule', 'All finishes used in the design'],
  ] as const;

  return (
    <div className="fixed inset-0 z-[240] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-8">
      <QuotationModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      <div className="w-full max-w-5xl max-h-[86vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900">Outputs Center</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quotation, schedules, print sheets, and designer handoff package</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Primary Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OutputCard
                icon={FileText}
                title="Pricing Quotation"
                subtitle="BOQ grouped by room with GST and discount controls"
                action="Open"
                onClick={() => setQuoteOpen(true)}
              />
              <OutputCard
                icon={FileJson}
                title="Designer Handoff JSON"
                subtitle="Project metadata, schedules, BOQ, and source snapshot"
                action="Download"
                onClick={() => downloadHandoffJson(getSnapshot())}
              />
              <OutputCard
                icon={FileJson}
                title="Editable Project JSON"
                subtitle="Native local file for backup and re-import"
                action="Download"
                onClick={() => downloadJson(getSnapshot())}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">CSV Schedules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {csvItems.map(([key, title, subtitle]) => (
                <button
                  key={key}
                  onClick={() => downloadScheduleCsv(getSnapshot(), key)}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-800">{title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
                  </div>
                  <Download size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Print Sheets</h3>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-slate-800">Plan / Elevation Sheet Set</div>
                <div className="text-xs text-slate-500 mt-1">Print the current browser view or save it as PDF after switching to presentation mode.</div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const OutputCard: React.FC<{
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action: string;
  onClick: () => void;
}> = ({ icon: Icon, title, subtitle, action, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-blue-300 hover:shadow-md transition-all flex flex-col min-h-44"
  >
    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4">
      <Icon size={20} />
    </div>
    <div className="font-black text-slate-900">{title}</div>
    <div className="text-xs text-slate-500 mt-2 leading-relaxed flex-1">{subtitle}</div>
    <div className="mt-4 text-xs font-black text-blue-700">{action}</div>
  </button>
);
