import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  qrCode: string;
  guardName: string;
  guardId: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCode, guardName, guardId }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const downloadQR = async () => {
    try {
      setIsDownloading(true);
      
      // Create a temporary canvas to generate the QR code image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      
      // Set canvas size for high-quality print (300 DPI equivalent)
      const printSize = 600; // 2 inches at 300 DPI
      const padding = 60;
      canvas.width = printSize;
      canvas.height = printSize + 120; // Extra space for text
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create QR code SVG data
      const qrElement = qrRef.current?.querySelector('svg');
      if (!qrElement) throw new Error('QR code not found');
      
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        // Draw QR code centered
        const qrSize = printSize - (padding * 2);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);
        
        // Add guard info text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        // Guard name
        ctx.fillText(guardName, canvas.width / 2, printSize + 40);
        
        // Guard ID
        ctx.font = '18px Arial';
        ctx.fillText(`ID: ${guardId}`, canvas.width / 2, printSize + 70);
        
        // Nogada branding
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('Nogada Car Guard', canvas.width / 2, printSize + 100);
        
        // Download the image
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${guardId}-${guardName.replace(/\s+/g, '-')}-QR.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            toast.success('QR code downloaded successfully!');
          }
        }, 'image/png');
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold text-nogada-dark">Your QR Code</h3>
        <p className="text-sm text-gray-500">Show this to customers for tips</p>
        <p className="text-xs text-gray-400 mt-1">This is your permanent QR code</p>
      </div>
      
      {/* QR Code Container */}
      <div ref={qrRef} className="w-52 h-52 bg-white p-3 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-4 shadow-sm">
        <QRCode 
          value={`nogada://tip/${guardId}`} // Using a proper deep link format
          size={184} // Optimized for mobile viewing and printing
          style={{ maxWidth: "100%", height: "auto" }}
          level="H" // High error correction for damaged/dirty prints
          includeMargin={false}
        />
      </div>
      
      {/* Guard Information */}
      <div className="text-center mb-4">
        <div className="font-bold text-lg text-nogada-dark">{guardName}</div>
        <div className="text-sm text-gray-500 font-mono">ID: {guardId}</div>
        <div className="text-xs text-gray-400 mt-1">Scan to leave a tip</div>
      </div>
      
      {/* Download Button */}
      <div className="w-full">
        <Button 
          variant="default" 
          size="sm" 
          onClick={downloadQR}
          disabled={isDownloading}
          className="w-full bg-nogada-primary hover:bg-nogada-primary/90"
        >
          {isDownloading ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download for Printing
            </>
          )}
        </Button>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
        <div className="text-xs text-gray-600 text-center">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Printer className="h-3 w-3" />
              <span>Print for badge</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              <span>Display on phone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;