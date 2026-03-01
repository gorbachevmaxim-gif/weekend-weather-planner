import React, { useState } from 'react';

interface GpxUnboundedProps {
    theme: 'light' | 'dark';
}

const GpxUnbounded: React.FC<GpxUnboundedProps> = ({ theme }) => {
    const [komootUrl, setKomootUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [gpxFile, setGpxFile] = useState<File | null>(null);

    const isDark = theme === 'dark';
    const inputClass = `w-full bg-transparent border-b ${isDark ? 'border-[#333333] text-[#D9D9D9] placeholder-[#555555]' : 'border-[#D9D9D9] text-[#111111] placeholder-[#B2B2B2]'} py-2 focus:outline-none focus:border-[#777777] transition-colors font-sans text-sm`;
    const labelClass = `text-xs font-bold ${isDark ? 'text-[#777777]' : 'text-[#B2B2B2]'} uppercase tracking-wider mb-1`;

    const unescapeJson = (str: string) => {
        try {
            // If it's a JS string literal content, JSON.parse(`"${str}"`) should unescape it
            return JSON.parse(`"${str}"`);
        } catch (e) {
            // Fallback: basic unescape
            return str.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
    };

    const createGpxContent = (trackName: string, coordinates: any[]) => {
        const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="komootgpx-web" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${trackName}</name>
  </metadata>
  <trk>
    <name>${trackName}</name>
    <trkseg>
`;
        const footer = `    </trkseg>
  </trk>
</gpx>`;

        const points = coordinates.map((coord: any) => {
            return `      <trkpt lat="${coord.lat}" lon="${coord.lng}">
        <ele>${coord.alt}</ele>
      </trkpt>`;
        }).join('\n');

        return header + points + '\n' + footer;
    };

    const handleGenerate = async () => {
        if (!komootUrl || !fileName) {
            setStatus('Вставьте ссылку URL и напишите файл латиницей File Name');
            return;
        }

        setIsGenerating(true);
        setStatus('Получаю данные...');
        setGpxFile(null);

        try {
            // Try primary proxy (corsproxy.io)
            let html = '';
            try {
                const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(komootUrl)}`);
                if (!response.ok) throw new Error('Proxy 1 failed');
                html = await response.text();
            } catch (e) {
                console.log('Primary proxy failed, trying fallback...', e);
                // Fallback proxy (allorigins)
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(komootUrl)}`);
                if (!response.ok) throw new Error('Network response was not ok');
                html = await response.text();
            }
            
            setStatus('Парсинг данных...');

            const startMarker = 'kmtBoot.setProps("';
            const endMarker = '");';
            
            const startIndex = html.indexOf(startMarker);
            if (startIndex === -1) throw new Error('Could not find route data in page');
            
            const jsonStart = startIndex + startMarker.length;
            const endIndex = html.indexOf(endMarker, jsonStart);
            if (endIndex === -1) throw new Error('Could not find end of route data');

            const jsonStringEscaped = html.substring(jsonStart, endIndex);
            const jsonString = unescapeJson(jsonStringEscaped);
            const data = JSON.parse(jsonString);

            const tourName = data?.page?._embedded?.tour?.name;
            const coordinates = data?.page?._embedded?.tour?._embedded?.coordinates?.items;

            if (!coordinates || !Array.isArray(coordinates)) {
                throw new Error('No coordinates found in route data');
            }

            const finalFileName = fileName.endsWith('.gpx') ? fileName : `${fileName}.gpx`;
            const gpxContent = createGpxContent(tourName || fileName, coordinates);
            
            const file = new File([gpxContent], finalFileName, { type: 'application/gpx+xml' });
            setGpxFile(file);
            setStatus('GPX файл готов. Нажмите "Send to Telegram" для отправки.');

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || 'Failed to process'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendToTelegram = async () => {
        if (!gpxFile) return;

        // Try native sharing first (works on mobile for files)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [gpxFile] })) {
            try {
                await navigator.share({
                    files: [gpxFile]
                });
                return;
            } catch (error) {
                console.log('Sharing failed or cancelled', error);
            }
        }

        // Fallback: Download the file and prompt user
        const url = URL.createObjectURL(gpxFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = gpxFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('Файл сгенерирован. Откройте Telegram и отправьте файл вручную.');
    };

    return (
        <div className={`mt-4 w-full max-w-[343px] min-[1200px]:max-w-none mx-auto ${isDark ? "text-[#D9D9D9]" : "text-[#333333]"}`}>
            <div className="mb-8">
                <p className="font-sans text-ls leading-tight">
                    Обход ограничений Komoot на скачивание GPX. Актуально для платных регионов: Испания, Турция, Беларусь.
                    Вставьте ссылку на маршрут Komoot и введите имя для сохранения файла. Нажмите кнопку Process Data. Сгенерированный gpx-файл будет готов к экспорту в Telegram или сторонние навигаторы.
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <p className={labelClass}>Komoot Link</p>
                    <input 
                        type="text" 
                        value={komootUrl}
                        onChange={(e) => setKomootUrl(e.target.value)}
                        placeholder="https://www.komoot.com/tour/..."
                        className={inputClass}
                    />
                </div>

                <div>
                    <p className={labelClass}>GPX File Name</p>
                    <input 
                        type="text" 
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Minsk_N_1"
                        className={inputClass}
                    />
                </div>

                <div className="pt-6 flex flex-wrap gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${
                            isDark 
                                ? 'bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]' 
                                : 'bg-white text-black hover:bg-pill-hover'
                        } disabled:opacity-50 font-sans font-medium`}
                    >
                        {isGenerating ? 'Processing...' : 'Process Data'}
                    </button>

                    {gpxFile && (
                        <button
                            onClick={handleSendToTelegram}
                            className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${
                                isDark 
                                    ? 'bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]' 
                                    : 'bg-white text-black hover:bg-pill-hover'
                            } font-sans font-medium`}
                        >
                            Send to Telegram
                        </button>
                    )}
                    
                    {status && (
                        <p className="text-xs w-full mt-2 opacity-70">{status}</p>
                    )}
                </div>
            </div>
            
             <div className="mt-12 opacity-50 text-xs">
                <p>
                    Парсер использует открытый proxy для получения данных Komoot. Если он выдаст ошибку, проверьте соединение с интернет или попробуйте генерацию gpx-файла позже.
                </p>
            </div>
        </div>
    );
};

export default GpxUnbounded;
