import React from 'react';
import {
  Box,
  Brush,
  Camera,
  DoorOpen,
  FileText,
  Grid2X2,
  Home,
  Image,
  Lightbulb,
  Maximize2,
  MessageSquare,
  MousePointer2,
  PenLine,
  Ruler,
  Search,
  Share2,
  Sparkles,
  Square,
  TableProperties,
  Undo2,
  Redo2,
  Trash2,
  Wallpaper,
  ZoomIn,
} from 'lucide-react';
import { useStore, RibbonTab, Tool } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface InfurniaRibbonProps {
  onOpenOutputs: () => void;
  onOpenCatalogAdmin: () => void;
}

const tabs: RibbonTab[] = ['Home', 'View', 'Insert', 'Draw', 'Architecture', 'Annotate', 'Render', 'Outputs'];

export const InfurniaRibbon: React.FC<InfurniaRibbonProps> = ({
  onOpenOutputs,
  onOpenCatalogAdmin,
}) => {
  const {
    activeTool,
    setActiveTool,
    setActiveCategory,
    setCatalogOpen,
    setMaterialDrawerOpen,
    setMaterialDrawerCategory,
    ribbonTab,
    setRibbonTab,
    setViewMode,
    setCameraPreset,
    presentationMode,
    setPresentationMode,
    setRenderQuality,
    setRenderCameraPreset,
    setActiveRenderRoomType,
    setShowCeiling,
    setShowDecor,
    setShowLights,
    deleteSelection,
  } = useStore();

  const setTool = (tool: Tool, category?: Parameters<typeof setActiveCategory>[0]) => {
    setActiveTool(tool);
    if (category) setActiveCategory(category);
    setCatalogOpen(true);
  };

  const openRealisticRender = () => {
    setViewMode('3D');
    setCameraPreset('FREE');
    setRenderQuality('High');
    setRenderCameraPreset('Wide Interior');
    setActiveRenderRoomType('Auto');
    setShowCeiling(true);
    setShowDecor(true);
    setShowLights(true);
    setPresentationMode(true);
  };

  const groupedTools = [
    {
      title: 'Core',
      tools: [
        { label: 'Pref.', icon: Home, onClick: () => setRibbonTab('Home') },
        { label: 'Undo', icon: Undo2, onClick: () => window.dispatchEvent(new CustomEvent('design-os:undo')) },
        { label: 'Redo', icon: Redo2, onClick: () => window.dispatchEvent(new CustomEvent('design-os:redo')) },
        { label: 'Select', icon: MousePointer2, active: activeTool === 'SELECT', onClick: () => setActiveTool('SELECT') },
        { label: 'Delete', icon: Trash2, active: activeTool === 'DELETE', onClick: () => {
          deleteSelection();
          setActiveTool('SELECT');
        } },
      ],
    },
    {
      title: 'Draw',
      tools: [
        { label: 'Line', icon: PenLine, disabled: true },
        { label: 'Poly.', icon: PenLine, disabled: true },
        { label: 'Grid', icon: Grid2X2, disabled: true },
        { label: 'Hatch', icon: Wallpaper, disabled: true },
      ],
    },
    {
      title: 'Architecture',
      tools: [
        { label: 'Wall', icon: Square, active: activeTool === 'WALL', onClick: () => setTool('WALL', 'ARCHITECTURE') },
        { label: 'Door', icon: DoorOpen, active: activeTool === 'DOOR', onClick: () => setTool('DOOR', 'ARCHITECTURE') },
        { label: 'Window', icon: Grid2X2, active: activeTool === 'WINDOW', onClick: () => setTool('WINDOW', 'ARCHITECTURE') },
        { label: 'Ceil.', icon: Box, disabled: true },
        { label: 'Tiling', icon: TableProperties, onClick: () => {
          setMaterialDrawerCategory('Flooring');
          window.dispatchEvent(new CustomEvent('design-os:open-floor-tiling'));
        } },
      ],
    },
    {
      title: 'Interior',
      tools: [
        { label: 'Furnish', icon: Box, active: activeTool === 'FURNITURE', onClick: () => setTool('FURNITURE', 'FURNITURE') },
        { label: 'Light', icon: Lightbulb, disabled: true },
        { label: 'Strip', icon: Brush, disabled: true },
        { label: 'Finish', icon: Sparkles, active: activeTool === 'APPLY_FINISH', onClick: () => setTool('APPLY_FINISH', 'FINISHES') },
      ],
    },
    {
      title: 'Render',
      tools: [
        { label: 'Real', icon: Camera, active: presentationMode, onClick: openRealisticRender },
        { label: 'Light', icon: Lightbulb, onClick: openRealisticRender },
        { label: 'Finish', icon: Sparkles, onClick: () => setTool('APPLY_FINISH', 'FINISHES') },
      ],
    },
    {
      title: 'Annotate',
      tools: [
        { label: 'Dim.', icon: Ruler, disabled: true },
        { label: 'Measu.', icon: Ruler, disabled: true },
        { label: 'Zoom', icon: ZoomIn, onClick: () => window.dispatchEvent(new CustomEvent('design-os:fit-all')) },
      ],
    },
    {
      title: 'Outputs',
      tools: [
        { label: 'Pres.', icon: Maximize2, active: presentationMode, onClick: () => {
          if (presentationMode) setPresentationMode(false);
          else openRealisticRender();
        } },
        { label: '+Pres.', icon: FileText, onClick: onOpenOutputs },
        { label: 'Catalog', icon: TableProperties, onClick: onOpenCatalogAdmin },
        { label: 'Share', icon: Share2, disabled: true },
        { label: 'Comment', icon: MessageSquare, disabled: true },
        { label: 'Search', icon: Search, disabled: true },
      ],
    },
  ];

  return (
    <div className="h-[124px] bg-white border-b border-slate-200 shadow-sm z-[95] shrink-0">
      <div className="h-10 flex items-center px-4 gap-2 border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setRibbonTab(tab);
              if (tab === 'Outputs') onOpenOutputs();
            }}
            className={cn(
              'h-9 px-3 text-[12px] font-bold border-b-2 transition-all',
              ribbonTab === tab
                ? 'text-blue-700 border-blue-600 bg-blue-50/60'
                : 'text-slate-600 border-transparent hover:text-blue-600',
            )}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('design-os:open-reference-plan'))}
            className="px-3 py-1.5 rounded-md text-[11px] font-black text-slate-600 hover:bg-white flex items-center gap-1.5"
            title="Open reference plan tools"
          >
            <Image size={12} />
            Ref Plan
          </button>
          <button
            onClick={() => {
              setCatalogOpen(true);
              setActiveCategory('FURNITURE');
              onOpenCatalogAdmin();
            }}
            className="px-3 py-1.5 rounded-md text-[11px] font-black text-slate-600 hover:bg-white flex items-center gap-1.5"
            title="Open catalogue admin"
          >
            <TableProperties size={12} />
            Catalogue
          </button>
          <button data-testid="ribbon-view-mode-2d" onClick={() => setViewMode('2D')} className="px-3 py-1.5 rounded-md bg-white text-[11px] font-black text-slate-700">2D</button>
          <button data-testid="ribbon-view-mode-3d" onClick={() => { setViewMode('3D'); setCameraPreset('FREE'); }} className="px-3 py-1.5 rounded-md text-[11px] font-black text-slate-600 hover:bg-white">3D</button>
          <button data-testid="ribbon-view-mode-split" onClick={() => setViewMode('SPLIT')} className="px-3 py-1.5 rounded-md text-[11px] font-black text-slate-600 hover:bg-white">Split</button>
        </div>
      </div>
      <div className="h-[84px] flex items-stretch overflow-x-auto no-scrollbar">
        {groupedTools.map((group) => (
          <div key={group.title} className="flex items-center gap-1 px-3 border-r border-slate-100">
            {group.tools.map((tool) => (
              <button
                key={tool.label}
                data-testid={`ribbon-tool-${tool.label.toLowerCase().replaceAll('.', '').replaceAll(' ', '-')}`}
                onClick={tool.disabled ? undefined : tool.onClick}
                disabled={tool.disabled}
                title={tool.disabled ? `${tool.label} coming next` : tool.label}
                className={cn(
                  'w-[54px] h-[68px] rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all border border-transparent',
                  tool.active && 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
                  !tool.active && !tool.disabled && 'text-slate-600 hover:bg-slate-50 hover:border-slate-200',
                  tool.disabled && 'text-slate-300 cursor-not-allowed',
                )}
              >
                <tool.icon size={20} strokeWidth={2} />
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
