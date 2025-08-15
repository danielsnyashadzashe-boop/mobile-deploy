
import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  qrCode: string;
  guardName: string;
  guardId: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCode, guardName, guardId }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
      <div className="text-center mb-2">
        <p className="text-sm text-gray-500">Your QR Code</p>
      </div>
      
      {/* Generate actual QR code */}
      <div className="w-48 h-48 bg-white p-2 border border-gray-300 flex items-center justify-center mb-2">
        <QRCode 
          value={qrCode} 
          size={160}
          style={{ maxWidth: "100%", height: "auto" }}
          level="H" // High error correction
        />
      </div>
      
      <div className="text-center mt-2">
        <div className="font-semibold">{guardName}</div>
        <div className="text-sm text-gray-500">ID: {guardId}</div>
      </div>
      
      <button className="mt-4 nogada-btn-secondary text-sm">
        Refresh QR Code
      </button>
    </div>
  );
};

export default QRCodeDisplay;
