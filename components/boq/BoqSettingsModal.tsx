"use client";

import { Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BOQ_LOOKUP_CATEGORIES,
  BOQ_LOOKUP_PRESET_CUSTOM_HEX,
  BOQ_LOOKUP_TONES,
  getBoqSettingsAddButtonLabel,
  getBoqSettingsFirstColumnLabel,
  getBoqSettingsTabLabel,
  type BoqLookupCategory,
  type BoqLookupOptionDto,
  type BoqLookupTone,
} from "@/application/dto/boq/boqLookupOptionDto";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotifications } from "@/components/ui/notifications-provider";
import {
  createBoqLookupOption,
  deleteBoqLookupOption,
  reorderBoqLookupOptions,
  updateBoqLookupOption,
  useBoqLookupOptions,
} from "@/hooks/use-boq-lookup-options";
import { useStretchTabsIndicator } from "@/hooks/use-stretch-tabs-indicator";
import {
  getBoqLookupPillStyle,
  getToneDotClassName,
  getTonePreviewColor,
  hasBoqLookupPillTone,
} from "@/lib/boq-settings/pill-style";
import { findBoqSettingsConflict } from "@/lib/boq-settings/validation";

import "@/styles/abrd-boq-settings.css";

type BoqSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

type ToneMode = "preset" | "custom";

function normalizeLabel(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function BoqSettingsToolbarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="boq-settings-toolbar-btn"
      aria-label="BOQ Settings"
      onClick={onClick}
    >
      <SlidersHorizontal size={16} aria-hidden />
      <span>BOQ Settings</span>
    </button>
  );
}

export function BoqSettingsModal({ open, onClose, onChanged }: BoqSettingsModalProps) {
  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState<BoqLookupCategory>("discipline");
  const { items, loading, error, reload, setItems } = useBoqLookupOptions(activeTab);
  const { containerRef: tabsRef, indicatorRef } = useStretchTabsIndicator({ activeKey: activeTab });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoqLookupOptionDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editCustomLabel, setEditCustomLabel] = useState("");
  const [editTone, setEditTone] = useState<BoqLookupTone | "">("");
  const [editToneMode, setEditToneMode] = useState<ToneMode>("preset");
  const [editCustomHex, setEditCustomHex] = useState("#84c718");
  const [toneOpen, setToneOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoqLookupOptionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showForm = creating || editing != null;
  const addBtnLabel = getBoqSettingsAddButtonLabel(activeTab);
  const firstColLabel = getBoqSettingsFirstColumnLabel(activeTab);

  const resetForm = useCallback(() => {
    setCreating(false);
    setEditing(null);
    setEditName("");
    setEditCustomLabel("");
    setEditTone("");
    setEditToneMode("preset");
    setEditCustomHex("#84c718");
    setToneOpen(false);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  useEffect(() => {
    if (!toneOpen) return;
    const closeTone = () => setToneOpen(false);
    document.addEventListener("click", closeTone);
    return () => document.removeEventListener("click", closeTone);
  }, [toneOpen]);

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setEditName("");
    setEditCustomLabel("");
    setEditTone("");
    setEditToneMode("preset");
    setEditCustomHex("#84c718");
    setFormError(null);
  };

  const startEdit = (item: BoqLookupOptionDto) => {
    setCreating(false);
    setEditing(item);
    setEditName(item.name);
    setEditCustomLabel(item.customLabel ?? "");
    if (item.customHex) {
      setEditToneMode("custom");
      setEditCustomHex(item.customHex);
      setEditTone("");
    } else {
      setEditToneMode("preset");
      setEditTone(item.tone ?? "");
      setEditCustomHex("#84c718");
    }
    setFormError(null);
  };

  const previewColor = useMemo(
    () => getTonePreviewColor(editTone, editCustomHex, editToneMode),
    [editCustomHex, editTone, editToneMode],
  );

  const toneTriggerLabel = useMemo(() => {
    if (editToneMode === "custom") {
      return editCustomHex.toUpperCase() || "Custom";
    }
    return editTone ? editTone : "None";
  }, [editCustomHex, editTone, editToneMode]);

  const applyEdit = async () => {
    const name = editName.trim();
    const customLabel = normalizeLabel(editCustomLabel);
    const tone = editToneMode === "preset" ? editTone || null : null;
    const customHex =
      editToneMode === "custom" ? editCustomHex.trim().toLowerCase() || null : null;

    if (!name) return;

    const conflict = findBoqSettingsConflict(items, {
      id: editing?.id,
      name,
      customLabel,
    });
    if (conflict) {
      setFormError(conflict.message);
      return;
    }

    setSaving(true);
    try {
      if (creating) {
        const created = await createBoqLookupOption({
          category: activeTab,
          name,
          customLabel,
          tone,
          customHex,
          sortOrder: items.length,
        });
        setItems((current) => [...current, created]);
        notify(`Created ${created.name}`, "success");
      } else if (editing) {
        const updated = await updateBoqLookupOption(editing.id, {
          name,
          customLabel,
          tone,
          customHex,
          sortOrder: editing.sortOrder,
        });
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        notify(`Updated ${updated.name}`, "success");
      }
      resetForm();
      onChanged?.();
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBoqLookupOption(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      notify(`Deleted ${deleteTarget.name}`, "success");
      if (editing?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      onChanged?.();
    } catch (deleteError) {
      notify(deleteError instanceof Error ? deleteError.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex == null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    if (!moved) {
      setDragIndex(null);
      return;
    }
    next.splice(dropIndex, 0, moved);
    setItems(next);
    setDragIndex(null);

    try {
      const reordered = await reorderBoqLookupOptions(
        activeTab,
        next.map((item) => item.id),
      );
      setItems(reordered);
      onChanged?.();
    } catch (reorderError) {
      notify(reorderError instanceof Error ? reorderError.message : "Reorder failed", "error");
      void reload();
    }
  };

  return (
    <>
      <DialogRoot open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent size="xl" className="boq-settings-panel">
          <DialogHeader className="boq-settings-dialog-header">
            <DialogTitle className="dialog-header-title">BOQ Settings</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0">
            <div className="boq-settings-wrap">
              <div className="boq-settings-sticky-top">
                <div
                  ref={tabsRef}
                  className="boq-settings-tabs"
                  role="tablist"
                  aria-label="BOQ settings groups"
                >
                  <div className="boq-settings-tab-list">
                    {BOQ_LOOKUP_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        className={`boq-settings-tab${activeTab === category ? " active" : ""}`}
                        aria-selected={activeTab === category}
                        onClick={() => {
                          setActiveTab(category);
                          resetForm();
                        }}
                      >
                        <span className="boq-settings-tab-label">
                          {getBoqSettingsTabLabel(category)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="boq-settings-quick-links">
                    <button type="button" className="boq-settings-create-btn" onClick={startCreate}>
                      {addBtnLabel}
                    </button>
                  </div>
                  <span ref={indicatorRef} className="boq-settings-stretch-tabs-indicator" />
                </div>

                {showForm ? (
                  <div className="boq-settings-form-card">
                    <div className="boq-settings-form">
                      <label className="boq-settings-field">
                        <span>Name</span>
                        <input
                          type="text"
                          value={editName}
                          placeholder="Enter name..."
                          onChange={(event) => {
                            setEditName(event.target.value);
                            setFormError(null);
                          }}
                        />
                      </label>
                      <label className="boq-settings-field">
                        <span>Custom Label (optional)</span>
                        <input
                          type="text"
                          value={editCustomLabel}
                          placeholder="e.g., Review label..."
                          maxLength={100}
                          onChange={(event) => {
                            setEditCustomLabel(event.target.value);
                            setFormError(null);
                          }}
                        />
                      </label>
                      <div className="boq-settings-field">
                        <span>Tone</span>
                        <div
                          className={`boq-settings-combo${toneOpen ? " open" : ""}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="boq-settings-combo-btn"
                            onClick={() => setToneOpen((open) => !open)}
                          >
                            <span
                              className="boq-settings-tone-dot"
                              style={{ background: previewColor || "transparent" }}
                            />
                            <span className="boq-settings-combo-label">{toneTriggerLabel}</span>
                            <span className="boq-settings-combo-chev" aria-hidden>
                              &#9662;
                            </span>
                          </button>
                          {toneOpen ? (
                            <div className="boq-settings-combo-panel">
                              <div className="boq-settings-mode-row">
                                <button
                                  type="button"
                                  className={`boq-settings-mode${editToneMode === "preset" ? " active" : ""}`}
                                  onClick={() => setEditToneMode("preset")}
                                >
                                  <span className="boq-settings-mode-radio" />
                                  Preset
                                </button>
                                <button
                                  type="button"
                                  className={`boq-settings-mode${editToneMode === "custom" ? " active" : ""}`}
                                  onClick={() => setEditToneMode("custom")}
                                >
                                  <span className="boq-settings-mode-radio" />
                                  Custom
                                </button>
                              </div>
                              {editToneMode === "preset" ? (
                                <div className="boq-settings-tone-section">
                                  <div className="boq-settings-tone-chips">
                                    {BOQ_LOOKUP_TONES.map((tone) => (
                                      <button
                                        key={tone}
                                        type="button"
                                        className={`boq-settings-tone-chip${editTone === tone ? " selected" : ""}`}
                                        onClick={() => {
                                          setEditToneMode("preset");
                                          setEditTone(tone);
                                        }}
                                      >
                                        <span
                                          className={`boq-settings-tone-dot ${getToneDotClassName(tone)}`}
                                        />
                                        {tone}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      className={`boq-settings-tone-chip${!editTone ? " selected" : ""}`}
                                      onClick={() => {
                                        setEditToneMode("preset");
                                        setEditTone("");
                                      }}
                                    >
                                      <span className="boq-settings-tone-dot none" />
                                      None
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="boq-settings-tone-section">
                                  <div className="boq-settings-swatches">
                                    {BOQ_LOOKUP_PRESET_CUSTOM_HEX.map((hex) => (
                                      <button
                                        key={hex}
                                        type="button"
                                        className={`boq-settings-swatch${editCustomHex === hex ? " active" : ""}`}
                                        style={{ background: hex }}
                                        aria-label={hex}
                                        onClick={() => setEditCustomHex(hex)}
                                      />
                                    ))}
                                  </div>
                                  <div className="boq-settings-pick-row">
                                    <input
                                      type="color"
                                      value={editCustomHex}
                                      onChange={(event) => setEditCustomHex(event.target.value)}
                                    />
                                    <span className="boq-settings-hex">
                                      {editCustomHex.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {formError ? (
                        <div className="boq-settings-form-error">{formError}</div>
                      ) : null}
                      <div className="boq-settings-form-actions">
                        <button type="button" onClick={resetForm} disabled={saving}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="primary"
                          disabled={saving || !editName.trim()}
                          onClick={() => void applyEdit()}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="boq-settings-list-card">
                <div className="boq-settings-tbl">
                  <div className="boq-settings-scroll-area">
                    <div className="boq-settings-thead">
                      <div className="boq-settings-th handle-cell" />
                      <div className="boq-settings-th">{firstColLabel}</div>
                      <div className="boq-settings-th label-cell">Custom Label</div>
                      <div className="boq-settings-th actions-head">Actions</div>
                    </div>
                    <div className="boq-settings-tbody">
                      {loading && items.length === 0 ? (
                        <div className="boq-settings-empty">Loading settings…</div>
                      ) : error && items.length === 0 ? (
                        <div className="boq-settings-empty">{error}</div>
                      ) : items.length === 0 ? (
                        <div className="boq-settings-empty">No items yet.</div>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={item.id}
                            className={`boq-settings-row${dragIndex === index ? " dragging" : ""}`}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => void handleDrop(index)}
                            onDragEnd={() => setDragIndex(null)}
                          >
                            <div className="boq-settings-td handle-cell">
                              <span className="boq-settings-drag-handle" aria-label="Drag to reorder">
                                &#8942;&#8942;
                              </span>
                            </div>
                            <div className="boq-settings-td">
                              <span
                                className={`boq-settings-pill${hasBoqLookupPillTone(item.tone, item.customHex) ? " is-toned" : ""}`}
                                style={getBoqLookupPillStyle(item.tone, item.customHex)}
                              >
                                <span className="boq-settings-pill__label">{item.name}</span>
                              </span>
                            </div>
                            <div className="boq-settings-td label-cell">
                              <span className="boq-settings-custom-label">
                                {item.customLabel || "--"}
                              </span>
                            </div>
                            <div className="boq-settings-td actions-cell">
                              <button
                                type="button"
                                className="boq-settings-icon-btn edit"
                                aria-label={`Edit ${item.name}`}
                                onClick={() => startEdit(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="boq-settings-icon-btn danger"
                                aria-label={`Delete ${item.name}`}
                                onClick={() => setDeleteTarget(item)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete lookup option"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Existing imports keep their saved values.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        isSubmitting={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
