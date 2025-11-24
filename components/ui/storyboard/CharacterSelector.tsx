"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Users } from "lucide-react";
import NextImage from "next/image";
import type { StoryboardCharacter } from "@/lib/types/storyboard-characters";
import { MAX_CHARACTERS_PER_SCENE } from "@/lib/types/storyboard-characters";

interface CharacterSelectorProps {
  characters: StoryboardCharacter[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  selectedIds,
  onChange,
  maxSelections = MAX_CHARACTERS_PER_SCENE,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCharacters = characters.filter((c) => selectedIds.includes(c.id));

  const toggleCharacter = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((cid) => cid !== id));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, id]);
    }
  };

  const removeCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((cid) => cid !== id));
  };

  if (characters.length === 0) {
    return null; // Don't show selector if no characters exist
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Characters Pills */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 flex-wrap p-2 rounded-lg border cursor-pointer transition-colors ${
          isOpen
            ? "border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]"
            : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)]"
        }`}
        style={{ backgroundColor: "var(--md-sys-color-surface-container)" }}
      >
        {selectedCharacters.length === 0 ? (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
            <span className="md-body-small" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              Add characters ({selectedIds.length}/{maxSelections})
            </span>
          </div>
        ) : (
          selectedCharacters.map((char) => (
            <div
              key={char.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ backgroundColor: "var(--md-sys-color-primary-container)" }}
            >
              {/* Mini avatar */}
              <div className="w-5 h-5 rounded-full overflow-hidden">
                {char.images[0]?.url ? (
                  <NextImage
                    src={char.images[0].url}
                    alt={char.name}
                    width={20}
                    height={20}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--md-sys-color-primary)" }}
                  >
                    <span className="text-[8px] text-white">
                      {char.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <span
                className="md-label-small"
                style={{ color: "var(--md-sys-color-on-primary-container)" }}
              >
                {char.name}
              </span>
              <button
                onClick={(e) => removeCharacter(char.id, e)}
                className="hover:opacity-70"
              >
                <X
                  className="w-3 h-3"
                  style={{ color: "var(--md-sys-color-on-primary-container)" }}
                />
              </button>
            </div>
          ))
        )}

        {/* Expand indicator */}
        <ChevronDown
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--md-sys-color-on-surface-variant)" }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-20 w-full mt-1 rounded-xl md-surface-container-high border border-[var(--md-sys-color-outline-variant)] shadow-lg overflow-hidden"
          style={{ maxHeight: "200px", overflowY: "auto" }}
        >
          {characters.map((char) => {
            const isSelected = selectedIds.includes(char.id);
            const isDisabled = !isSelected && selectedIds.length >= maxSelections;

            return (
              <div
                key={char.id}
                onClick={() => !isDisabled && toggleCharacter(char.id)}
                className={`flex items-center gap-3 p-3 transition-colors ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-[var(--md-sys-color-surface-container)]"
                } ${isSelected ? "bg-[var(--md-sys-color-primary-container)]" : ""}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {char.images[0]?.url ? (
                    <NextImage
                      src={char.images[0].url}
                      alt={char.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--md-sys-color-primary)" }}
                    >
                      <span className="text-sm text-white">
                        {char.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span
                    className="md-body-medium block truncate"
                    style={{
                      color: isSelected
                        ? "var(--md-sys-color-on-primary-container)"
                        : "var(--md-sys-color-on-surface)",
                    }}
                  >
                    {char.name}
                  </span>
                  {char.description && (
                    <span
                      className="md-body-small block truncate"
                      style={{
                        color: isSelected
                          ? "var(--md-sys-color-on-primary-container)"
                          : "var(--md-sys-color-on-surface-variant)",
                      }}
                    >
                      {char.description}
                    </span>
                  )}
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]"
                      : "border-[var(--md-sys-color-outline)]"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CharacterSelector;
