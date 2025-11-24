"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Upload, Loader2, Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { VoxelConfig, VoxelResolution, VoxelStyle, VoxelPalette } from "@/lib/types";
import { VOXEL_RESOLUTIONS, VOXEL_STYLES, VOXEL_PALETTES, DEFAULT_VOXEL_CONFIG } from "@/lib/types";

const VoxelGenerator: React.FC = () => {
  const [config, setConfig] = useState<VoxelConfig>(DEFAULT_VOXEL_CONFIG);
  const [voxelData, setVoxelData] = useState<string | null>(null); // JSON string of voxel data
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -30, y: 45 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle source image drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setConfig((prev) => ({
          ...prev,
          sourceImage: file,
          sourceImageUrl: reader.result as string,
        }));
        setVoxelData(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  // Generate voxels
  const handleGenerate = async () => {
    if (!config.sourceImage) return;

    setIsGenerating(true);
    setError(null);
    setVoxelData(null);

    try {
      const formData = new FormData();
      formData.append("sourceImage", config.sourceImage);
      formData.append("resolution", config.resolution.toString());
      formData.append("style", config.style);
      formData.append("colorPalette", config.colorPalette);

      const response = await fetch("/api/voxel/generate", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (json.voxelData) {
        setVoxelData(JSON.stringify(json.voxelData));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Simple 3D voxel rendering on canvas
  useEffect(() => {
    if (!voxelData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = JSON.parse(voxelData);
    const voxels = data.voxels || [];
    const [dimX, dimY, dimZ] = data.dimensions || [32, 32, 32];

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple isometric projection
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = (Math.min(canvas.width, canvas.height) / Math.max(dimX, dimY, dimZ)) * 0.4 * zoom;

    // Rotation matrices
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    // Project and sort voxels by depth
    const projectedVoxels = voxels.map((voxel: { position: number[]; color: number[] }) => {
      const [x, y, z] = voxel.position;
      const cx = x - dimX / 2;
      const cy = y - dimY / 2;
      const cz = z - dimZ / 2;

      // Rotate around Y axis
      const x1 = cx * cosY - cz * sinY;
      const z1 = cx * sinY + cz * cosY;

      // Rotate around X axis
      const y2 = cy * cosX - z1 * sinX;
      const z2 = cy * sinX + z1 * cosX;

      return {
        x: x1 * scale + centerX,
        y: -y2 * scale + centerY,
        z: z2,
        color: voxel.color,
        size: scale,
      };
    });

    // Sort by depth (back to front)
    projectedVoxels.sort((a: { z: number }, b: { z: number }) => a.z - b.z);

    // Draw voxels
    projectedVoxels.forEach((v: { x: number; y: number; color: number[]; size: number }) => {
      const [r, g, b] = v.color;
      const size = v.size * 0.9;

      // Top face (lighter)
      ctx.fillStyle = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y - size * 0.5);
      ctx.lineTo(v.x + size * 0.5, v.y - size * 0.25);
      ctx.lineTo(v.x, v.y);
      ctx.lineTo(v.x - size * 0.5, v.y - size * 0.25);
      ctx.closePath();
      ctx.fill();

      // Left face (darker)
      ctx.fillStyle = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
      ctx.beginPath();
      ctx.moveTo(v.x - size * 0.5, v.y - size * 0.25);
      ctx.lineTo(v.x, v.y);
      ctx.lineTo(v.x, v.y + size * 0.5);
      ctx.lineTo(v.x - size * 0.5, v.y + size * 0.25);
      ctx.closePath();
      ctx.fill();

      // Right face (medium)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.moveTo(v.x + size * 0.5, v.y - size * 0.25);
      ctx.lineTo(v.x + size * 0.5, v.y + size * 0.25);
      ctx.lineTo(v.x, v.y + size * 0.5);
      ctx.lineTo(v.x, v.y);
      ctx.closePath();
      ctx.fill();
    });
  }, [voxelData, rotation, zoom]);

  // Handle rotation drag
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) {
      setRotation((prev) => ({
        x: Math.max(-90, Math.min(90, prev.x - e.movementY * 0.5)),
        y: prev.y + e.movementX * 0.5,
      }));
    }
  }, []);

  const downloadOBJ = () => {
    if (!voxelData) return;

    const data = JSON.parse(voxelData);
    const voxels = data.voxels || [];
    let obj = "# Voxel Model generated by Story Composer\n";
    let vertexIndex = 1;

    voxels.forEach((voxel: { position: number[]; color: number[] }) => {
      const [x, y, z] = voxel.position;
      const [r, g, b] = voxel.color;

      // Add vertices for a unit cube at this position
      const vertices = [
        [x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z],
        [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1],
      ];

      vertices.forEach((v) => {
        obj += `v ${v[0]} ${v[1]} ${v[2]} ${r / 255} ${g / 255} ${b / 255}\n`;
      });

      // Add faces (6 faces per cube)
      const base = vertexIndex;
      obj += `f ${base} ${base + 3} ${base + 2} ${base + 1}\n`; // bottom
      obj += `f ${base + 4} ${base + 5} ${base + 6} ${base + 7}\n`; // top
      obj += `f ${base} ${base + 1} ${base + 5} ${base + 4}\n`; // front
      obj += `f ${base + 2} ${base + 3} ${base + 7} ${base + 6}\n`; // back
      obj += `f ${base} ${base + 4} ${base + 7} ${base + 3}\n`; // left
      obj += `f ${base + 1} ${base + 2} ${base + 6} ${base + 5}\n`; // right

      vertexIndex += 8;
    });

    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voxel-${Date.now()}.obj`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="md-headline-small flex items-center gap-2">
            <Box className="w-6 h-6" style={{ color: "var(--md-sys-color-primary)" }} />
            3D Voxel Generator
          </h2>
          <p className="md-body-medium mt-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            Convert images to 3D voxel models
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Source Image Upload */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <label className="md-label-large block mb-3">Source Image</label>
              {config.sourceImageUrl ? (
                <div className="relative">
                  <img
                    src={config.sourceImageUrl}
                    alt="Source"
                    className="w-full h-48 object-contain rounded-lg bg-[var(--md-sys-color-surface-container-low)]"
                  />
                  <button
                    onClick={() => setConfig({ ...config, sourceImage: null, sourceImageUrl: undefined })}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
                  <p className="md-body-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
                  </p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <label className="md-label-large block mb-3">Settings</label>
              <div className="space-y-4">
                <div>
                  <label className="md-label-medium block mb-1">Resolution</label>
                  <select
                    value={config.resolution}
                    onChange={(e) => setConfig({ ...config, resolution: parseInt(e.target.value) as VoxelResolution })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  >
                    {VOXEL_RESOLUTIONS.map((res) => (
                      <option key={res.value} value={res.value}>
                        {res.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="md-label-medium block mb-1">Style</label>
                  <select
                    value={config.style}
                    onChange={(e) => setConfig({ ...config, style: e.target.value as VoxelStyle })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  >
                    {VOXEL_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label} - {style.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="md-label-medium block mb-1">Color Palette</label>
                  <select
                    value={config.colorPalette}
                    onChange={(e) => setConfig({ ...config, colorPalette: e.target.value as VoxelPalette })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  >
                    {VOXEL_PALETTES.map((palette) => (
                      <option key={palette.value} value={palette.value}>
                        {palette.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!config.sourceImage || isGenerating}
              className="w-full py-4 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-large flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Voxels...
                </>
              ) : (
                <>
                  <Box className="w-5 h-5" />
                  Generate 3D Model
                </>
              )}
            </button>
          </div>

          {/* Right Column - 3D Preview */}
          <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)] min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="md-label-large">3D Preview</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                  className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                {voxelData && (
                  <button
                    onClick={downloadOBJ}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90"
                  >
                    <Download className="w-4 h-4" />
                    OBJ
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-[var(--md-sys-color-surface-container-low)] rounded-lg overflow-hidden">
              {error ? (
                <div className="text-center p-4">
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-error)" }}>
                    {error}
                  </p>
                </div>
              ) : voxelData ? (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={500}
                  onMouseMove={handleMouseMove}
                  className="cursor-move"
                />
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "var(--md-sys-color-primary)" }} />
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Generating voxel model...
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Box className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Upload an image and generate to see 3D preview
                  </p>
                  <p className="md-body-small mt-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Drag to rotate, buttons to zoom
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoxelGenerator;
