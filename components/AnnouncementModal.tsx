import React from "react";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isDark?: boolean;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, content, isDark = false }) => {
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Текст скопирован в буфер обмена!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: content
        });
      } catch (error) {
        // User cancelled or error - try copying to clipboard
        if ((error as Error).name !== "AbortError") {
          try {
            await navigator.clipboard.writeText(content);
            alert("Текст скопирован в буфер обмена!");
          } catch (clipError) {
            console.error("Error copying to clipboard:", clipError);
          }
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(content);
        alert("Текст скопирован в буфер обмена!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${
          isDark ? "bg-[#222222] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${
          isDark ? "[&_a]:text-[#6B9AFF] [&_a]:underline" : "[&_a:text-blue-600]"
        }`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {content}
          </pre>
        </div>

        {/* Actions */}
        <div className={`flex justify-center px-6 py-4 border-t ${
          isDark ? "border-[#444444]" : "border-[#E5E5E5]"
        }`}>
          <button
            onClick={handleShare}
            className={`py-3 px-6 rounded-full font-medium text-[15px] tracking-tighter transition-colors duration-100 ${
              isDark 
                ? "bg-[#383838] hover:bg-[#444444] text-[#D9D9D9]" 
                : "bg-white hover:bg-pill-hover text-black"
            }`}
          >
            Поделиться
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
