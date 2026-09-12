import React from 'react';

const renderInlineBold = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(
      <strong key={key++} className="font-semibold text-brand-700">
        {match[1]}
      </strong>
    );
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length ? parts : [text];
};

interface MarkdownRendererProps {
  source: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ source, className = '' }) => {
  const blocks = source.split(/\n\n+/).filter((b) => b.trim().length > 0);
  return (
    <div className={`prose-none text-sm leading-7 text-slate-700 space-y-4 ${className}`}>
      {blocks.map((block, idx) => {
        const lines = block.split('\n').map((l) => l.trimEnd());
        const firstLine = lines[0] ?? '';

        if (/^#\s+/.test(firstLine)) {
          return (
            <h1 key={idx} className="text-xl font-bold text-slate-900 mt-5 mb-3 leading-snug">
              {renderInlineBold(firstLine.replace(/^#\s+/, ''))}
            </h1>
          );
        }
        if (/^##\s+/.test(firstLine)) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2 leading-snug">
              {renderInlineBold(firstLine.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        if (/^###\s+/.test(firstLine)) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-800 mt-3 mb-2 leading-snug">
              {renderInlineBold(firstLine.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        if (/^>\s?/.test(firstLine)) {
          const quoteText = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-brand-300 bg-brand-50 pl-4 pr-3 py-2 my-3 italic text-slate-600 rounded-r-lg"
            >
              {renderInlineBold(quoteText)}
            </blockquote>
          );
        }
        if (/^-\s+/.test(firstLine)) {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-1.5 my-3">
              {lines.map((l, li) => {
                if (!/^-\s+/.test(l)) {
                  return (
                    <li key={li} className="marker:text-brand-400">
                      {renderInlineBold(l)}
                    </li>
                  );
                }
                return (
                  <li key={li} className="marker:text-brand-400">
                    {renderInlineBold(l.replace(/^-\s+/, ''))}
                  </li>
                );
              })}
            </ul>
          );
        }
        if (lines.length >= 2 && firstLine.includes('|') && /---/.test(lines[1] ?? '')) {
          const hdr = firstLine.split('|').map((c) => c.trim()).filter(Boolean);
          const body = lines.slice(2).filter((l) => l.includes('|')).map((l) =>
            l.split('|').map((c) => c.trim()).filter(Boolean)
          );
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {hdr.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-bold text-slate-700 text-left border-b border-slate-200">
                        {renderInlineBold(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-100 last:border-b-0">
                      {hdr.map((_, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-slate-600">
                          {renderInlineBold(row[ci] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const paragraph = lines.join(' ');
        return (
          <p key={idx} className="my-2">
            {renderInlineBold(paragraph)}
          </p>
        );
      })}
    </div>
  );
};
