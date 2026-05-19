'use client';

import { useEffect, useState, Fragment } from 'react';

// A lightweight Math component that renders math with KaTeX dynamically from CDN
function MathRenderer({ math, block }: { math: string; block?: boolean }) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    // Load KaTeX CSS if not already loaded
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      document.head.appendChild(link);
    }

    const renderMath = async () => {
      try {
        let katex = (window as any).katex;
        if (!katex) {
          // If the script is already loading, wait for it
          const existingScript = document.getElementById('katex-js');
          if (existingScript) {
            await new Promise<void>((resolve) => {
              existingScript.addEventListener('load', () => resolve());
            });
          } else {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.id = 'katex-js';
              script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('KaTeX script load error'));
              document.head.appendChild(script);
            });
          }
          katex = (window as any).katex;
        }

        if (katex) {
          const rendered = katex.renderToString(math, {
            displayMode: block,
            throwOnError: false,
          });
          setHtml(rendered);
        } else {
          setHtml(math);
        }
      } catch (err) {
        console.error(err);
        setHtml(math);
      }
    };

    renderMath();
  }, [math, block]);

  return <span dangerouslySetInnerHTML={{ __html: html || math }} />;
}

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Regex to split content by $$ (block math) and $ (inline math)
  // We match block math first, then inline math
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
  const parts = content.split(mathRegex);

  // Helper to parse markdown inside plain text parts
  const formatTextWithMarkdown = (text: string) => {
    // Split by newlines first
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();
      
      // 1. Heading Check (### Heading)
      if (trimmed.startsWith('###')) {
        const headingText = trimmed.replace('###', '').trim();
        return (
          <h3 key={lineIdx} className="text-base font-bold text-text-primary mt-3 mb-1.5 font-display">
            {formatBoldItalic(headingText)}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        const headingText = trimmed.replace('##', '').trim();
        return (
          <h2 key={lineIdx} className="text-lg font-bold text-text-primary mt-4 mb-2 font-display">
            {formatBoldItalic(headingText)}
          </h2>
        );
      }
      if (trimmed.startsWith('#')) {
        const headingText = trimmed.replace('#', '').trim();
        return (
          <h1 key={lineIdx} className="text-xl font-bold text-text-primary mt-5 mb-2.5 font-display">
            {formatBoldItalic(headingText)}
          </h1>
        );
      }

      // 2. Bullet Point Check (- or * )
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.substring(2).trim();
        return (
          <li key={lineIdx} className="list-disc ml-5 my-0.5 text-text-secondary">
            {formatBoldItalic(bulletText)}
          </li>
        );
      }

      // 3. Regular Paragraph
      return (
        <p key={lineIdx} className="my-1 min-h-[1px]">
          {formatBoldItalic(line)}
        </p>
      );
    });
  };

  // Helper to format bold **text** and italic *text*
  const formatBoldItalic = (text: string) => {
    // Regex for bold (**bold**)
    const boldRegex = /(\*\*[\s\S]+?\*\*)/g;
    const segments = text.split(boldRegex);

    return segments.map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-text-primary">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  };

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {parts.map((part, index) => {
        // Block math $$equation$$
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          return (
            <div key={index} className="my-3 py-2 px-4 bg-black/10 dark:bg-white/5 rounded-xl text-center overflow-x-auto">
              <MathRenderer math={math} block={true} />
            </div>
          );
        }
        
        // Inline math $equation$
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          return <MathRenderer key={index} math={math} block={false} />;
        }

        // Standard Text part, containing markdown headers, bullets, etc.
        return <Fragment key={index}>{formatTextWithMarkdown(part)}</Fragment>;
      })}
    </div>
  );
}
