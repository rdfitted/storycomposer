"use client";

import React, { useState } from "react";
import { Plus, Users, ChevronDown, ChevronUp } from "lucide-react";
import CharacterCard from "./CharacterCard";
import CharacterModal from "./CharacterModal";
import { useStoryboardCharacters } from "@/stores/useCreativeStore";
import type { StoryboardCharacter } from "@/lib/types/storyboard-characters";
import { MAX_STORYBOARD_CHARACTERS } from "@/lib/types/storyboard-characters";

interface CharacterBankProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CharacterBank: React.FC<CharacterBankProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<StoryboardCharacter | undefined>();

  const {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    canAddMore,
  } = useStoryboardCharacters();

  const handleAddClick = () => {
    setEditingCharacter(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (character: StoryboardCharacter) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleSave = (char: Omit<StoryboardCharacter, "id" | "createdAt" | "updatedAt">) => {
    addCharacter(char);
  };

  const handleUpdate = (id: string, updates: Partial<Omit<StoryboardCharacter, "id" | "createdAt">>) => {
    updateCharacter(id, updates);
  };

  return (
    <>
      <div className="md-surface-container-high border border-[var(--md-sys-color-outline-variant)] rounded-xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          onClick={onToggleCollapse}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "var(--md-sys-color-primary)" }} />
            <span className="md-label-large" style={{ color: "var(--md-sys-color-on-surface)" }}>
              Characters
            </span>
            <span
              className="md-label-small px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container-highest)",
                color: "var(--md-sys-color-on-surface-variant)",
              }}
            >
              {characters.length}/{MAX_STORYBOARD_CHARACTERS}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canAddMore && !collapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--md-sys-color-primary-container)] transition-colors"
                style={{ color: "var(--md-sys-color-primary)" }}
              >
                <Plus className="w-4 h-4" />
                <span className="md-label-small">Add</span>
              </button>
            )}
            {onToggleCollapse && (
              collapsed ? (
                <ChevronDown className="w-4 h-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
              ) : (
                <ChevronUp className="w-4 h-4" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
              )
            )}
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-3 pt-0 max-h-64 overflow-y-auto">
            {characters.length === 0 ? (
              <div className="text-center py-6">
                <Users
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                />
                <p
                  className="md-body-medium mb-3"
                  style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                >
                  No characters yet
                </p>
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl transition-colors"
                  style={{
                    backgroundColor: "var(--md-sys-color-primary-container)",
                    color: "var(--md-sys-color-on-primary-container)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="md-label-medium">Create Character</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onEdit={handleEditClick}
                    onDelete={deleteCharacter}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <CharacterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCharacter(undefined);
        }}
        onSave={handleSave}
        onUpdate={handleUpdate}
        character={editingCharacter}
      />
    </>
  );
};

export default CharacterBank;
