import React from "react";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isDark?: boolean;
}

// Fix AI-generated markdown links where URL contains ) and AI incorrectly placed closing bracket
const fixMarkdownLinks = (text: string): string => {
  return text.replace(/\[([^\]]+)\]\(([^)]+\))\)(\.?)/g, '[$1($2)$3]');
};

// Parse markdown links to HTML for display
const parseMarkdownLinks = (text: string): React.ReactNode[] => {
  const fixedText = fixMarkdownLinks(text);
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(fixedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(fixedText.substring(lastIndex, match.index));
    }
    
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        {linkText}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < fixedText.length) {
    parts.push(fixedText.substring(lastIndex));
  }
  
  return parts;
};

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, content, isDark = false }) => {
  if (!isOpen) return null;

  const parsedContent = parseMarkdownLinks(content);

  const handleCopy = async () => {
    // Use the same approach as manual selection/copy
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Get the content element
    const contentElement = document.querySelector('.announcement-content');
    if (contentElement) {
      range.selectNodeContents(contentElement);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      try {
        document.execCommand('copy');
        selection?.removeAllRanges();
        alert("Текст скопирован!");
      } catch (err) {
        // Fallback
        await navigator.clipboard.writeText(fixMarkdownLinks(content));
      }
    } else {
      // Fallback
      await navigator.clipboard.writeText(fixMarkdownLinks(content));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div 
        className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${
          isDark ? "bg-[#222222] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? "border-[#444444]" : "border-[#E5E5E5]"
        }`}>
          <h2 className="text-lg font-unbounded font-medium">Анонс</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              isDark ? "hover:bg-[#444444]" : "hover:bg-gray-100"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 ${
          isDark ? "text-[#D9D9D9]" : "text-black"
        }`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed announcement-content">
            {parsedContent}
          </pre>
        </div>

        <div className={`flex justify-center px-6 py-4 border-t ${
          isDark ? "border-[#444444]" : "border-[#E5E5E5]"
        }`}>
          <button
            onClick={handleCopy}
            className={`py-3 px-6 rounded-full font-medium text-[15px] tracking-tighter transition-colors duration-100 ${
              isDark 
                ? "bg-[#383838] hover:bg-[#444444] text-[#D9D9D9]" 
                : "bg-white hover:bg-pill-hover text-black"
            }`}
          >
            Копировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
