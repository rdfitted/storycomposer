"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import NextImage from "next/image";
import type { StoryboardCharacter, CharacterImage } from "@/lib/types/storyboard-characters";
import { MAX_CHARACTER_IMAGES } from "@/lib/types/storyboard-characters";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Omit<StoryboardCharacter, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate?: (id: string, updates: Partial<Omit<StoryboardCharacter, "id" | "createdAt">>) => void;
  character?: StoryboardCharacter; // For edit mode
}

const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  character,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<CharacterImage[]>([]);
  const [error, setError] = useState("");

  const isEditMode = !!character;

  // Reset form when modal opens/closes or character changes
  useEffect(() => {
    if (isOpen && character) {
      setName(character.name);
      setDescription(character.description);
      setImages(character.images);
    } else if (isOpen) {
      setName("");
      setDescription("");
      setImages([]);
    }
    setError("");
  }, [isOpen, character]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (images.length >= MAX_CHARACTER_IMAGES) {
        setError(`Maximum ${MAX_CHARACTER_IMAGES} images allowed`);
        return;
      }

      const remaining = MAX_CHARACTER_IMAGES - images.length;
      const filesToAdd = acceptedFiles.slice(0, remaining);

      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setImages((prev) => {
            if (prev.length >= MAX_CHARACTER_IMAGES) return prev;
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                url: dataUrl,
                file,
                createdAt: Date.now(),
              },
            ];
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [images.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: MAX_CHARACTER_IMAGES - images.length,
    disabled: images.length >= MAX_CHARACTER_IMAGES,
  });

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Character name is required");
      return;
    }

    if (isEditMode && onUpdate && character) {
      onUpdate(character.id, {
        name: name.trim(),
        description: description.trim(),
        images,
      });
    } else {
      onSave({
        name: name.trim(),
        description: description.trim(),
        images,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 md-surface-container-highest rounded-3xl md-elevation-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <h2 className="md-title-large" style={{ color: "var(--md-sys-color-on-surface)" }}>
            {isEditMode ? "Edit Character" : "New Character"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          >
            <X className="w-5 h-5" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)]">
              <span className="md-body-medium" style={{ color: "var(--md-sys-color-on-error-container)" }}>
                {error}
              </span>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block md-label-large mb-2" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              className="w-full rounded-xl md-surface-container border border-[var(--md-sys-color-outline-variant)] px-4 py-3 md-body-large placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container)",
                color: "var(--md-sys-color-on-surface)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block md-label-large mb-2" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the character's appearance, personality, etc."
              rows={3}
              className="w-full rounded-xl md-surface-container border border-[var(--md-sys-color-outline-variant)] px-4 py-3 md-body-large placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container)",
                color: "var(--md-sys-color-on-surface)",
              }}
            />
          </div>

          {/* Reference Images */}
          <div>
            <label className="block md-label-large mb-2" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Reference Images ({images.length}/{MAX_CHARACTER_IMAGES})
            </label>

            {/* Image Grid */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                  <NextImage
                    src={img.url}
                    alt="Reference"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: MAX_CHARACTER_IMAGES - images.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-lg border-2 border-dashed border-[var(--md-sys-color-outline-variant)] flex items-center justify-center"
                >
                  <span
                    className="md-body-small"
                    style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                  >
                    +
                  </span>
                </div>
              ))}
            </div>

            {/* Drop Zone */}
            {images.length < MAX_CHARACTER_IMAGES && (
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                    : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload
                    className="w-6 h-6"
                    style={{ color: "var(--md-sys-color-primary)" }}
                  />
                  <span className="md-body-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
                    {isDragActive ? "Drop images here" : "Drag & drop or click to upload"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl md-label-large transition-colors hover:bg-[var(--md-sys-color-surface-container)]"
            style={{ color: "var(--md-sys-color-on-surface)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`px-6 py-2 rounded-xl md-label-large transition-colors ${
              !name.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
            style={{
              backgroundColor: "var(--md-sys-color-primary)",
              color: "var(--md-sys-color-on-primary)",
            }}
          >
            {isEditMode ? "Save Changes" : "Create Character"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterModal;
