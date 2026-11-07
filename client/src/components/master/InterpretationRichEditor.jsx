import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  RemoveFormatting,
  Undo2,
  Redo2,
  Code,
  Eye,
  Edit3,
  Palette,
  Highlighter,
  Type,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'System Sans', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: 'Medical Serif', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Clinical Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
];

const FONT_SIZES = [
  { label: 'Small (11px)', command: 'fontSize', value: '1', style: '11px' },
  { label: 'Normal (13px)', command: 'fontSize', value: '2', style: '13px' },
  { label: 'Medium (15px)', command: 'fontSize', value: '3', style: '15px' },
  { label: 'Large (18px)', command: 'fontSize', value: '4', style: '18px' },
  { label: 'Extra Large (24px)', command: 'fontSize', value: '5', style: '24px' },
];

const CLINICAL_COLORS = [
  { name: 'Black', value: '#0f172a' },
  { name: 'Slate Gray', value: '#475569' },
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Medical Green', value: '#047857' },
  { name: 'Alert Crimson', value: '#dc2626' },
  { name: 'Amber Caution', value: '#d97706' },
  { name: 'Purple Diagnostic', value: '#7e22ce' },
  { name: 'Deep Indigo', value: '#4338ca' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Light Green', value: '#bbf7d0' },
  { name: 'Light Blue', value: '#bfdbfe' },
  { name: 'Light Rose', value: '#fecdd3' },
  { name: 'Light Purple', value: '#e9d5ff' },
];

export default function InterpretationRichEditor({
  value = '',
  onChange,
  placeholder = 'Write a detailed clinical interpretation here with styling, formatting, clinical ranges, and notes...',
  minHeight = '240px',
}) {
  const editorRef = useRef(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [currentFamily, setCurrentFamily] = useState(FONT_FAMILIES[0].value);
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  // Sync initial content from value
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
        updateStats(value || '');
      }
    }
  }, [value, isSourceMode]);

  const updateStats = (html) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    setStats({ words, chars });
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      updateStats(html);
      onChange && onChange(html);
    }
  };

  const executeCommand = (command, val = null) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
  };

  const applyCustomStyle = (styleProp, styleVal) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const span = document.createElement('span');
      span.style[styleProp] = styleVal;
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      handleInput();
    } else {
      executeCommand(styleProp === 'color' ? 'foreColor' : 'hiliteColor', styleVal);
    }
  };

  const handleFontFamilyChange = (fontVal) => {
    setCurrentFamily(fontVal);
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontFamily = fontVal;
      span.textContent = selection.toString();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
      handleInput();
    } else {
      document.execCommand('fontName', false, fontVal);
      handleInput();
    }
  };

  return (
    <div className="border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      {/* Top Bar: Tabs & View Mode */}
      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Editor vs Preview Mode */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Writing Panel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Report Preview</span>
          </button>
        </div>

        {/* Source Code Toggle & Word Counter */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-slate-500">
            {stats.words} words • {stats.chars} chars
          </span>
          <button
            type="button"
            onClick={() => {
              if (isSourceMode && editorRef.current) {
                editorRef.current.innerHTML = value || '';
              }
              setIsSourceMode(!isSourceMode);
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              isSourceMode
                ? 'bg-purple-100 border-purple-300 text-purple-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Raw HTML Source Code"
          >
            <Code className="w-3 h-3" />
            <span>{isSourceMode ? 'Visual Mode' : 'HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Only in Editor Mode) */}
      {activeTab === 'editor' && !isSourceMode && (
        <div className="bg-slate-50/70 p-2 border-b border-slate-200 flex flex-wrap items-center gap-1 select-none text-xs">
          {/* 1. Font Family Dropdown */}
          <select
            value={currentFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer shadow-2xs"
            title="Font Family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.name} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>

          {/* 2. Font Size Dropdown */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val) executeCommand('fontSize', val);
            }}
            defaultValue="3"
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer shadow-2xs"
            title="Font Size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 3. Basic Formatting: Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer font-bold"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 4. Heading Quick Tags */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="px-1.5 py-1 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer font-bold text-[11px]"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="px-1.5 py-1 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer font-bold text-[11px]"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="px-1.5 py-1 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer font-semibold text-[11px]"
            title="Standard Paragraph"
          >
            ¶ Normal
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 5. Font Color Picker Tool */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setColorMenuOpen(!colorMenuOpen);
                setHighlightMenuOpen(false);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                colorMenuOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'hover:bg-white text-slate-700 border-transparent hover:border-slate-200'
              }`}
              title="Font Color"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold">Color</span>
            </button>

            {colorMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 w-52 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Font Color
                </span>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {CLINICAL_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        applyCustomStyle('color', c.value);
                        setColorMenuOpen(false);
                      }}
                      className="w-full h-7 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-2xs"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600 font-medium">Custom:</span>
                  <input
                    type="color"
                    onChange={(e) => {
                      applyCustomStyle('color', e.target.value);
                      setColorMenuOpen(false);
                    }}
                    className="w-8 h-6 rounded cursor-pointer border border-slate-200"
                    title="Custom color picker"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Highlight / Background Color Tool */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setHighlightMenuOpen(!highlightMenuOpen);
                setColorMenuOpen(false);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                highlightMenuOpen
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'hover:bg-white text-slate-700 border-transparent hover:border-slate-200'
              }`}
              title="Text Highlight Color"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold">Highlight</span>
            </button>

            {highlightMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 w-48 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Text Highlight
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => {
                        applyCustomStyle('backgroundColor', h.value);
                        setHighlightMenuOpen(false);
                      }}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-800 text-center cursor-pointer hover:border-slate-400 shadow-2xs"
                      style={{ backgroundColor: h.value === 'transparent' ? '#ffffff' : h.value }}
                      title={h.name}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 7. Alignment Buttons */}
          <button
            type="button"
            onClick={() => executeCommand('justifyLeft')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyCenter')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyRight')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyFull')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 8. Lists & Structure */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Blockquote Note"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertHorizontalRule')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Divider Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* 9. Utility: Clear Format, Undo, Redo */}
          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5 text-rose-500" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="p-3 bg-white min-h-[200px]">
        {activeTab === 'editor' ? (
          isSourceMode ? (
            /* HTML Raw Source Editor */
            <textarea
              value={value || ''}
              onChange={(e) => {
                const newHtml = e.target.value;
                updateStats(newHtml);
                onChange && onChange(newHtml);
              }}
              placeholder="<p>Enter raw HTML interpretation...</p>"
              className="w-full h-full font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 p-3 rounded-lg focus:outline-none"
              style={{ minHeight }}
            />
          ) : (
            /* WYSIWYG ContentEditable Area */
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              data-placeholder={placeholder}
              className="prose prose-sm max-w-none focus:outline-none min-h-[200px] text-slate-800 text-xs sm:text-sm leading-relaxed"
              style={{
                minHeight,
                fontFamily: currentFamily,
              }}
            />
          )
        ) : (
          /* Live Clinical Report Preview */
          <div className="space-y-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wide">
                <span>📋 Clinical Interpretation (Live Report Preview)</span>
              </div>
              <div
                className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No clinical interpretation text entered yet.</p>' }}
              />
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: This interpretation will appear at the bottom of official diagnostic reports when ordered for this test/profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

