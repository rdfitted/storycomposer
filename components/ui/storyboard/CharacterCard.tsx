"use client";

import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import NextImage from "next/image";
import type { StoryboardCharacter } from "@/lib/types/storyboard-characters";

interface CharacterCardProps {
  character: StoryboardCharacter;
  onEdit: (character: StoryboardCharacter) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const avatar = character.images[0]?.url;
  const initials = character.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(character.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] transition-colors group">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          {avatar ? (
            <NextImage
              src={avatar}
              alt={character.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: "var(--md-sys-color-primary-container)" }}
            >
              <span
                className="md-label-small"
                style={{ color: "var(--md-sys-color-on-primary-container)" }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <span
          className="md-body-medium flex-1 truncate"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          {character.name}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(character)}
            className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3 h-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 rounded-full transition-colors ${
              showDeleteConfirm
                ? "bg-[var(--md-sys-color-error-container)]"
                : "hover:bg-[var(--md-sys-color-surface-container-high)]"
            }`}
            title={showDeleteConfirm ? "Click again to confirm" : "Delete"}
          >
            <Trash2
              className="w-3 h-3"
              style={{
                color: showDeleteConfirm
                  ? "var(--md-sys-color-on-error-container)"
                  : "var(--md-sys-color-on-surface-variant)",
              }}
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md-surface-container rounded-xl p-3 border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] transition-colors group">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {avatar ? (
            <NextImage
              src={avatar}
              alt={character.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: "var(--md-sys-color-primary-container)" }}
            >
              <span
                className="md-title-medium"
                style={{ color: "var(--md-sys-color-on-primary-container)" }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className="md-title-small truncate"
              style={{ color: "var(--md-sys-color-on-surface)" }}
            >
              {character.name}
            </span>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(character)}
                className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
              </button>
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-full transition-colors ${
                  showDeleteConfirm
                    ? "bg-[var(--md-sys-color-error-container)]"
                    : "hover:bg-[var(--md-sys-color-surface-container-high)]"
                }`}
                title={showDeleteConfirm ? "Click again to confirm" : "Delete"}
              >
                <Trash2
                  className="w-4 h-4"
                  style={{
                    color: showDeleteConfirm
                      ? "var(--md-sys-color-on-error-container)"
                      : "var(--md-sys-color-on-surface-variant)",
                  }}
                />
              </button>
            </div>
          </div>

          {character.description && (
            <p
              className="md-body-small mt-1 line-clamp-2"
              style={{ color: "var(--md-sys-color-on-surface-variant)" }}
            >
              {character.description}
            </p>
          )}

          {/* Image count indicator */}
          <div className="flex items-center gap-1 mt-2">
            {character.images.slice(0, 5).map((img, i) => (
              <div
                key={img.id}
                className="w-6 h-6 rounded overflow-hidden border border-[var(--md-sys-color-outline-variant)]"
              >
                <NextImage
                  src={img.url}
                  alt={`Ref ${i + 1}`}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
