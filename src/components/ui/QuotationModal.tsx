import React, { useMemo, useState } from 'react';
import { Download, FileText, X, Building2, Tag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateBOQByRoom, BOQLine } from '../../lib/pricing';
import { cn } from '../../lib/utils';

interface QuotationModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ open, onClose }) => {
  const { project, walls, furniture, openings, rooms } = useStore();
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [gstPct, setGstPct] = useState<number>(18);
  const [includeTerms, setIncludeTerms] = useState<boolean>(true);

  const report = useMemo(
    () => generateBOQByRoom(rooms, walls, furniture, openings),
    [rooms, walls, furniture, openings],
  );

  const subtotal = report.subtotal;
  const discountAmt = Math.round((subtotal * discountPct) / 100);
  const afterDiscount = subtotal - discountAmt;
  const gstAmt = Math.round((afterDiscount * gstPct) / 100);
  const grandTotal = afterDiscount + gstAmt;

  if (!open) return null;

  const exportPdf = () => {
    const html = buildPrintableHtml({
      project,
      report,
      subtotal,
      discountPct,
      discountAmt,
      gstPct,
      gstAmt,
      grandTotal,
      includeTerms,
    });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Give the new window a tick to layout before opening print dialog.
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-5xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                Project Quotation
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Bill of Quantities · Multi-Room
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <Download size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter / adjustment bar */}
        <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100 flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Discount %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) =>
                setDiscountPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
              className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-bold outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              GST %
            </span>
            <input
              type="number"
              min={0}
              max={50}
              value={gstPct}
              onChange={(e) =>
                setGstPct(Math.max(0, Math.min(50, Number(e.target.value) || 0)))
              }
              className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-bold outline-none focus:border-blue-400"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTerms}
              onChange={(e) => setIncludeTerms(e.target.checked)}
              className="accent-blue-600"
            />
            Include Terms & Conditions in PDF
          </label>
          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            {report.rooms.length} room{report.rooms.length !== 1 ? 's' : ''} ·{' '}
            {report.rooms.reduce((sum, r) => sum + r.lines.length, 0)} line items
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {report.rooms.length === 0 || report.subtotal === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium text-slate-400">
                Add walls, furniture, or finishes to generate a quotation
              </p>
            </div>
          ) : (
            report.rooms
              .filter((block) => block.lines.length > 0)
              .map((block) => (
                <RoomBlock
                  key={block.roomId}
                  roomName={block.roomName}
                  roomType={block.roomType}
                  building={block.building}
                  floor={block.floor}
                  lines={block.lines}
                  subtotal={block.subtotal}
                />
              ))
          )}
        </div>

        {/* Totals */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col items-end gap-1.5 shrink-0">
          <Row label="Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
          {discountPct > 0 && (
            <Row
              label={`Discount (${discountPct}%)`}
              value={`− ₹${discountAmt.toLocaleString('en-IN')}`}
              tone="discount"
            />
          )}
          <Row label={`GST (${gstPct}%)`} value={`₹${gstAmt.toLocaleString('en-IN')}`} />
          <div className="h-px bg-slate-200 w-full lg:w-80 my-2" />
          <div className="flex items-center gap-12 w-full justify-between lg:w-fit">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Grand Total
            </span>
            <span className="text-2xl font-black text-blue-600">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RoomBlockProps {
  roomName: string;
  roomType: string;
  building: string;
  floor: string;
  lines: BOQLine[];
  subtotal: number;
}

const RoomBlock: React.FC<RoomBlockProps> = ({ roomName, roomType, building, floor, lines, subtotal }) => {
  const grouped = lines.reduce<Record<string, BOQLine[]>>((acc, l) => {
    acc[l.category] = [...(acc[l.category] ?? []), l];
    return acc;
  }, {});
  const order: BOQLine['category'][] = ['Civil', 'Finishes', 'Openings', 'Furniture'];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Building2 size={13} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">{roomName}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {roomType} · {building} · {floor}
            </p>
          </div>
        </div>
        <div className="text-sm font-black text-slate-700">
          ₹{subtotal.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {order
          .filter((cat) => grouped[cat]?.length)
          .map((cat) => (
            <div key={cat}>
              <div className="px-5 py-2 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {cat}
              </div>
              <table className="w-full text-left">
                <tbody>
                  {grouped[cat].map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-5 w-[55%]">
                        <div className="text-xs font-bold text-slate-700">{line.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {line.detail}
                        </div>
                        {(line.brand || line.sku) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {line.brand && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                <Tag size={9} />
                                {line.brand}
                              </span>
                            )}
                            {line.sku && (
                              <span className="text-[9px] text-slate-400 font-bold tracking-wider">
                                {line.sku}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 w-[10%]">
                        {line.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-tighter w-[10%]">
                        {line.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-semibold text-slate-600 w-[12%]">
                        ₹{line.rate.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-5 text-right text-xs font-bold text-slate-900 w-[13%]">
                        ₹{line.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; tone?: 'discount' }> = ({ label, value, tone }) => (
  <div className="flex items-center gap-12 w-full justify-between lg:w-fit">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span className={cn('text-sm font-bold', tone === 'discount' ? 'text-emerald-600' : 'text-slate-600')}>
      {value}
    </span>
  </div>
);

// ──────────────────────────────────────────────────────────────────
// Printable PDF (window.print) — branded HTML layout
// ──────────────────────────────────────────────────────────────────
function buildPrintableHtml(args: {
  project: ReturnType<typeof useStore.getState>['project'];
  report: ReturnType<typeof generateBOQByRoom>;
  subtotal: number;
  discountPct: number;
  discountAmt: number;
  gstPct: number;
  gstAmt: number;
  grandTotal: number;
  includeTerms: boolean;
}): string {
  const { project, report, subtotal, discountPct, discountAmt, gstPct, gstAmt, grandTotal, includeTerms } = args;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const validTill = new Date(Date.now() + 30 * 86400_000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const roomBlocks = report.rooms
    .filter((block) => block.lines.length > 0)
    .map((block) => {
      const groups = block.lines.reduce<Record<string, typeof block.lines>>((acc, l) => {
        acc[l.category] = [...(acc[l.category] ?? []), l];
        return acc;
      }, {});
      const order = ['Civil', 'Finishes', 'Openings', 'Furniture'];
      const groupHtml = order
        .filter((cat) => groups[cat]?.length)
        .map((cat) => {
          const rows = groups[cat]
            .map(
              (l) => `
        <tr>
          <td>
            <div class="line-name">${escapeHtml(l.name)}</div>
            ${l.detail ? `<div class="line-detail">${escapeHtml(l.detail)}</div>` : ''}
            ${l.brand || l.sku ? `<div class="line-meta">${l.brand ? `<span class="brand">${escapeHtml(l.brand)}</span>` : ''}${l.sku ? `<span class="sku">${escapeHtml(l.sku)}</span>` : ''}</div>` : ''}
          </td>
          <td class="r">${l.quantity}</td>
          <td class="r">${escapeHtml(l.unit)}</td>
          <td class="r">${fmt(l.rate)}</td>
          <td class="r b">${fmt(l.total)}</td>
        </tr>`,
            )
            .join('');
          return `
      <tr class="cat"><td colspan="5">${cat}</td></tr>
      ${rows}`;
        })
        .join('');

      return `
  <section class="room">
    <div class="room-head">
      <div>
        <h3>${escapeHtml(block.roomName)}</h3>
        <div class="room-loc">${escapeHtml(block.roomType)} · ${escapeHtml(block.building)} · ${escapeHtml(block.floor)}</div>
      </div>
      <div class="room-sub">${fmt(block.subtotal)}</div>
    </div>
    <table class="lines">
      <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Rate</th><th class="r">Total</th></tr></thead>
      <tbody>${groupHtml}</tbody>
    </table>
  </section>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.projectName)} Quotation</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #1e3a8a; margin-bottom: 28px; }
  .brand-block .logo { width: 48px; height: 48px; border-radius: 12px; background: #1d4ed8; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; letter-spacing: 0.05em; margin-bottom: 8px; }
  .brand-block h1 { font-size: 18px; margin: 0; letter-spacing: -0.02em; }
  .brand-block .tagline { font-size: 10px; color: #64748b; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 2px; }
  .quote-meta { text-align: right; font-size: 11px; color: #475569; }
  .quote-meta .quote-id { font-weight: 900; font-size: 14px; color: #0f172a; letter-spacing: 0.08em; }
  .quote-meta .label { color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; font-size: 9px; }

  .client-block { background: #f1f5f9; border-radius: 12px; padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 28px; }
  .client-block .label { font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 4px; }
  .client-block .val { font-size: 13px; font-weight: 800; color: #0f172a; }

  .room { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  .room-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .room-head h3 { margin: 0; font-size: 14px; }
  .room-loc { font-size: 9px; color: #94a3b8; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px; }
  .room-sub { font-size: 14px; font-weight: 900; color: #0f172a; }

  table.lines { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.lines th { text-align: left; color: #64748b; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; padding: 10px 12px; background: #fafafa; border-bottom: 1px solid #e2e8f0; }
  table.lines td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  table.lines tr.cat td { background: #f8fafc; font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.14em; padding: 6px 12px; }
  .line-name { font-weight: 700; color: #0f172a; }
  .line-detail { font-size: 9px; color: #94a3b8; margin-top: 2px; }
  .line-meta { margin-top: 4px; display: flex; gap: 6px; align-items: center; }
  .line-meta .brand { background: #dbeafe; color: #1d4ed8; padding: 1px 8px; border-radius: 999px; font-weight: 800; font-size: 8px; letter-spacing: 0.04em; }
  .line-meta .sku { color: #94a3b8; font-weight: 700; font-size: 8px; letter-spacing: 0.05em; }
  .r { text-align: right; }
  .b { font-weight: 900; }

  .totals { margin-left: auto; margin-top: 16px; width: 280px; font-size: 12px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.discount { color: #047857; }
  .totals .grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 900; }

  .terms { margin-top: 36px; padding: 14px 18px; background: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 4px; font-size: 10px; line-height: 1.6; color: #475569; }
  .terms h4 { margin: 0 0 6px; color: #854d0e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
  .terms ol { padding-left: 16px; margin: 6px 0 0; }
  .terms li { margin-bottom: 4px; }

  .signatures { margin-top: 48px; display: flex; justify-content: space-between; gap: 60px; }
  .signatures .sig { flex: 1; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 11px; color: #64748b; font-weight: 700; }

  .footer { margin-top: 36px; text-align: center; font-size: 9px; color: #94a3b8; padding-top: 16px; border-top: 1px solid #f1f5f9; line-height: 1.6; }
</style>
</head><body>

  <div class="header">
    <div class="brand-block">
      <div class="logo">ND</div>
      <h1>Namaste Design</h1>
      <div class="tagline">Interior Studio · Mumbai</div>
    </div>
    <div class="quote-meta">
      <div class="quote-id">${escapeHtml(project.projectId)}</div>
      <div class="label">Issued</div>
      <div>${today}</div>
      <div class="label" style="margin-top:6px">Valid Till</div>
      <div>${validTill}</div>
    </div>
  </div>

  <div class="client-block">
    <div>
      <div class="label">Project</div>
      <div class="val">${escapeHtml(project.projectName)}</div>
      <div class="label" style="margin-top:8px">Type</div>
      <div class="val">${escapeHtml(project.projectType ?? 'Residential')} · ${escapeHtml(project.status)}</div>
    </div>
    <div>
      <div class="label">Client</div>
      <div class="val">${escapeHtml(project.clientName || '—')}</div>
      ${project.clientDetails ? `<div class="label" style="margin-top:8px">Details</div><div class="val" style="font-weight:600">${escapeHtml(project.clientDetails)}</div>` : ''}
    </div>
  </div>

  ${roomBlocks}

  <div class="totals">
    <div class="row"><span>Subtotal</span><strong>${fmt(subtotal)}</strong></div>
    ${discountPct > 0 ? `<div class="row discount"><span>Discount (${discountPct}%)</span><strong>− ${fmt(discountAmt)}</strong></div>` : ''}
    <div class="row"><span>GST (${gstPct}%)</span><strong>${fmt(gstAmt)}</strong></div>
    <div class="row grand"><span>Grand Total</span><span>${fmt(grandTotal)}</span></div>
  </div>

  ${
    includeTerms
      ? `<div class="terms">
        <h4>Terms & Conditions</h4>
        <ol>
          <li>50% advance payment required to start work; 30% on material delivery; balance 20% on installation completion.</li>
          <li>Quotation valid for 30 days from date of issue. Material rates may revise thereafter.</li>
          <li>Site readiness (electrical, plumbing, civil work) is the client's responsibility prior to interior installation.</li>
          <li>Material samples shown are indicative. Slight variation in shade / texture is natural.</li>
          <li>GST is inclusive at applicable rates. Any change in tax structure will reflect in final billing.</li>
          <li>Project timeline starts only after final design sign-off and advance payment receipt.</li>
        </ol>
      </div>`
      : ''
  }

  <div class="signatures">
    <div class="sig">Authorised Signatory · Namaste Design</div>
    <div class="sig">Client Acceptance · ${escapeHtml(project.clientName || 'Client')}</div>
  </div>

  <div class="footer">
    Namaste Design · GSTIN 27IEAPK2697H1Z4 · Plot 60, Office 301, Shiva Prakash, Goregaon East, Mumbai 400063<br />
    Phone +91 98765 43210 · hello@namastedesign.in · Generated by Design OS
  </div>

</body></html>`;
}

function escapeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
