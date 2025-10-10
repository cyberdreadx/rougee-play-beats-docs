import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropModalProps {
  imageUrl: string;
  onComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to desired output size (512x512 for avatar)
  canvas.width = 512;
  canvas.height = 512;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    512,
    512
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.95);
  });
}

export const AvatarCropModal = ({ imageUrl, onComplete, onCancel }: AvatarCropModalProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    try {
      setProcessing(true);
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      onComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => !processing && onCancel()}>
      <DialogContent className="max-w-full md:max-w-2xl h-[90vh] md:h-auto flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <DialogTitle className="font-mono text-base md:text-lg">Crop Image</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Pinch to zoom, drag to reposition</p>
        </DialogHeader>
        
        <div className="relative flex-1 w-full bg-background rounded overflow-hidden min-h-[300px] md:min-h-[400px] touch-none">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: {
                height: '100%',
                width: '100%',
              },
              mediaStyle: {
                height: '100%',
                width: '100%',
              },
              cropAreaStyle: {
                border: '2px solid hsl(var(--primary))',
                boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
              }
            }}
          />
        </div>

        <div className="space-y-4 p-4 md:p-6 pt-4">
          {/* Zoom Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Zoom
              </label>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            {/* Mobile: Larger touch targets */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 flex-shrink-0"
                onClick={() => setZoom(Math.max(1, zoom - 0.2))}
                disabled={zoom <= 1}
              >
                <ZoomOut className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
                className="flex-1 cursor-pointer touch-none"
              />
              
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 flex-shrink-0"
                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Zoom Presets */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 md:h-9 text-xs"
              onClick={() => setZoom(1)}
            >
              Fit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 md:h-9 text-xs"
              onClick={() => setZoom(1.5)}
            >
              1.5x
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 md:h-9 text-xs"
              onClick={() => setZoom(2)}
            >
              2x
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 md:p-6 pt-0 flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 h-11 md:h-10 font-mono"
          >
            Cancel
          </Button>
          <Button
            variant="neon"
            onClick={handleCrop}
            disabled={processing}
            className="flex-1 h-11 md:h-10 font-mono"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Apply Crop'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
