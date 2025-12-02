import React, { useRef, useEffect, useState } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string | null) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ((event as TouchEvent).touches) {
       clientX = (event as TouchEvent).touches[0].clientX;
       clientY = (event as TouchEvent).touches[0].clientY;
    } else {
       clientX = (event as MouseEvent).clientX;
       clientY = (event as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    const { x, y } = getCoordinates(e.nativeEvent as any);
    ctx.moveTo(x, y);
    e.preventDefault(); // Prevent scrolling on touch
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e.nativeEvent as any);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
    e.preventDefault();
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        save();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave(null);
  };

  const save = () => {
      if (canvasRef.current && hasSignature) {
          onSave(canvasRef.current.toDataURL());
      }
  }

  // Adjust canvas size for high DPI
  useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
          // Standard size for the logical CSS pixels
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
      }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button 
            type="button" 
            onClick={clear} 
            className="text-xs text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors"
        >
            <Eraser size={14} /> Limpar
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded bg-white touch-none">
        <canvas
            ref={canvasRef}
            className="w-full h-32 cursor-crosshair block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-gray-400">Assine acima utilizando o mouse ou o dedo.</p>
    </div>
  );
};

export default SignaturePad;
