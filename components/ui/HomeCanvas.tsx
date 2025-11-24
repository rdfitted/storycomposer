"use client";

import React, { useState, useRef, useCallback } from 'react';
// Upload icon available for future use
import ImageUploader from './ImageUploader';
import ObjectCard from './ObjectCard';

interface Product {
  id: number;
  name: string;
  imageUrl: string;
}

type HomeCanvasProps = Record<string, never>;

const HomeCanvas: React.FC<HomeCanvasProps> = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setGeneratedImage] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{x: number, y: number} | null>(null);
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sceneImageRef = useRef<HTMLImageElement>(null);

  const handleProductImageUpload = useCallback((file: File) => {
    setError(null);
    try {
      const imageUrl = URL.createObjectURL(file);
      const product: Product = {
        id: Date.now(),
        name: file.name,
        imageUrl: imageUrl,
      };
      setProductImageFile(file);
      setSelectedProduct(product);
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load the product image. Details: ${errorMessage}`);
      console.error(err);
    }
  }, []);

  const handleSceneUpload = useCallback((file: File) => {
    setSceneFile(file);
    const imageUrl = URL.createObjectURL(file);
    setSceneImage(imageUrl);
    setGeneratedImage(null);
    setDropPosition(null);
  }, []);

  const generateComposite = useCallback(async (xPercent: number, yPercent: number) => {
    if (!productImageFile || !sceneFile || !selectedProduct) return;

    setIsGenerating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('sceneImage', sceneFile);
      formData.append('productImage', productImageFile);
      formData.append('productName', selectedProduct.name);
      formData.append('xPercent', xPercent.toString());
      formData.append('yPercent', yPercent.toString());

      const response = await fetch('/api/home-canvas/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate composite image');
      }

      const data = await response.json();
      setGeneratedImage(data.finalImageUrl);
      setDebugImage(data.debugImageUrl);
      
      // Update scene image to show the composite
      setSceneImage(data.finalImageUrl);
    } catch (error) {
      console.error('Error generating composite:', error);
      setError('Failed to generate composite image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [productImageFile, sceneFile, selectedProduct]);

  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null;

  if (error) {
    return (
      <div className="flex flex-col h-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] items-center justify-center p-8">
        <div className="text-center bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)] p-8 rounded-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-[var(--md-sys-color-on-error-container)]">An Error Occurred</h2>
          <p className="text-lg text-[var(--md-sys-color-on-error-container)] mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setSelectedProduct(null);
              setProductImageFile(null);
              setSceneImage(null);
              setSceneFile(null);
            }}
            className="bg-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] font-bold py-3 px-8 rounded-lg text-lg transition-colors opacity-90 hover:opacity-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!productImageFile || !sceneFile) {
    return (
      <div className="flex flex-col h-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
        {/* Header */}
        <div className="text-center py-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--md-sys-color-primary)] mb-4">
            Product Placement
          </h1>
          <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] max-w-3xl mx-auto">
            Upload your product and scene images, then click where you want to place the product.
            <br />
            AI will seamlessly integrate your product into the scene with realistic lighting and perspective.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-center mb-5 text-[var(--md-sys-color-on-surface)]">Upload Product</h2>
                <ImageUploader 
                  id="product-uploader"
                  onFileSelect={handleProductImageUpload}
                  imageUrl={productImageUrl}
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-center mb-5 text-[var(--md-sys-color-on-surface)]">Upload Scene</h2>
                <ImageUploader 
                  id="scene-uploader"
                  onFileSelect={handleSceneUpload}
                  imageUrl={sceneImage}
                />
              </div>
            </div>
            <div className="text-center mt-10 min-h-[4rem] flex flex-col justify-center items-center">
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                Upload a product image and a scene image to begin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      {/* Header */}
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--md-sys-color-primary)] mb-4">
          Product Placement
        </h1>
        <p className="text-lg text-[var(--md-sys-color-on-surface-variant)] max-w-3xl mx-auto">
          Upload your product and scene images, then click where you want to place the product.
          <br />
          AI will seamlessly integrate your product into the scene with realistic lighting and perspective.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Product Column */}
            <div className="md:col-span-1 flex flex-col">
              <h2 className="text-2xl font-bold text-center mb-5 text-[var(--md-sys-color-on-surface)]">Product</h2>
              <div className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <ObjectCard product={selectedProduct!} isSelected={true} />
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="h-5 flex items-center justify-center">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setProductImageFile(null);
                      setDropPosition(null);
                      setDebugImage(null);
                    }}
                    className="text-sm text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] font-semibold opacity-80 hover:opacity-100"
                  >
                    Change Product
                  </button>
                </div>
              </div>
            </div>

            {/* Scene Column */}
            <div className="md:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Scene</h2>
                {debugImage && (
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="px-4 py-2 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] rounded-lg border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  >
                    {showDebug ? 'Hide Debug' : 'Show Debug'}
                  </button>
                )}
              </div>
              <div className="flex-grow flex items-center justify-center">
                <ImageUploader 
                  ref={sceneImageRef}
                  id="scene-uploader" 
                  onFileSelect={handleSceneUpload} 
                  imageUrl={showDebug && debugImage ? debugImage : sceneImage}
                  isDropZone={!!sceneFile && !isGenerating}
                  onProductDrop={(position, relativePosition) => {
                    setDropPosition(position);
                    generateComposite(relativePosition.xPercent, relativePosition.yPercent);
                  }}
                  persistedOrbPosition={dropPosition}
                />
              </div>
              <div className="text-center mt-4">
                <div className="h-5 flex items-center justify-center">
                  {sceneFile && !isGenerating && (
                    <button
                      onClick={() => {
                        setSceneImage(null);
                        setSceneFile(null);
                        setDropPosition(null);
                        setDebugImage(null);
                      }}
                      className="text-sm text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] font-semibold opacity-80 hover:opacity-100"
                    >
                      Change Scene
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 min-h-[8rem] flex flex-col justify-center items-center">
            {isGenerating ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--md-sys-color-primary)] mx-auto mb-4"></div>
                <p className="text-xl text-[var(--md-sys-color-on-surface-variant)]">Creating realistic product placement...</p>
              </div>
            ) : (
              <p className="text-[var(--md-sys-color-on-surface-variant)]">
                Click anywhere on the scene to position your product. AI will handle lighting, shadows, and perspective automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCanvas;