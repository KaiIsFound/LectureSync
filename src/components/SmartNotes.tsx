'use client';

interface SmartNotesProps {
  notes: string;
}

export default function SmartNotes({ notes }: SmartNotesProps) {
  if (!notes) {
    return <p className="text-text-muted italic text-sm">No notes generated yet.</p>;
  }

  // Simple markdown renderer
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-lg font-display font-bold gradient-text mt-6 mb-2 first:mt-0">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-base font-display font-semibold text-electric mt-4 mb-1.5">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-electric mt-1.5 shrink-0">•</span>
            <span className="text-text-secondary text-sm leading-relaxed">{line.slice(2)}</span>
          </div>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={i} className="font-semibold text-text-primary text-sm mt-2 mb-1">
            {line.slice(2, -2)}
          </p>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-text-secondary text-sm leading-relaxed">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return <div className="space-y-0.5">{renderMarkdown(notes)}</div>;
}
