import { DialogDelete } from "@/components/router/dialog.delete";
import { GradientButton } from "@/components/ui/gradient-button";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconDeviceFloppy, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "@/components/ui/sonner";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BentoActionsMenu, type BentoActionsMenuItem } from "./bento-actions-menu";
import { BentoBackLink, BentoHero } from "./bento-hero";
import { BentoHeroIconPicker } from "./bento-hero-icon-picker";
import { BentoInlineEdit } from "./bento-inline-edit";
import { BentoStatusMarker } from "./bento-status-marker";
import { useBentoScrollFade } from "./bento-scroll-fade";
import type { BentoTone } from "./bento-tones";

/**
 * The identity fields every Bento entity hero owns: title, description,
 * an optional Iconify icon, and an `enabled` status flag (0/1). These
 * are edited in the hero (inline-edit + icon picker + status pill), not
 * in the form body — the form's own FormFields for these are lifted out.
 */
export interface BentoIdentity {
  title: string;
  description: string;
  icon: string | null;
  /** 0 = idle, 1 = active. Only surfaced as a pill when `hasStatus`. */
  enabled: number;
}

/**
 * The fields `patch` touched, taken back to the values `source` holds.
 *
 * Keyed off the patch rather than replacing the whole identity, so a field
 * edited while a failed save was in flight is not reverted along with it.
 */
function restoredFrom(
  patch: Partial<BentoIdentity>,
  source: BentoIdentity,
): Partial<BentoIdentity> {
  const restored: Partial<BentoIdentity> = {};
  for (const key of Object.keys(patch) as (keyof BentoIdentity)[]) {
    Object.assign(restored, { [key]: source[key] });
  }
  return restored;
}

/** Form state the render-prop child reports up so the hero can mirror it. */
export interface BentoShellFormState {
  isDirty: boolean;
  isSubmitting: boolean;
}

/**
 * Fields the shell reads off the entity to seed the hero identity. `title` /
 * `description` tolerate `null` so entities whose columns are nullable (e.g.
 * Custom Tool) satisfy the constraint without a cast.
 */
type BentoEntityLike = {
  id?: string;
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  enabled?: number;
};

export interface BentoEntityShellRenderArgs {
  /** Latest hero identity — merged into the form's create/update payload. */
  staged: BentoIdentity;
  /** Form reports dirty/submitting so the hero renders Save/Cancel correctly. */
  onStateChange: (state: BentoShellFormState) => void;
}

export interface BentoEntityShellProps<TEntity extends BentoEntityLike> {
  /** The entity being edited. In `isNew` mode pass an empty object. */
  entity: TEntity;
  isNew: boolean;
  /** Placeholder shown in the title inline-edit when empty. */
  headlineFallback: string;
  /** Breadcrumb label above the title — usually the section name. */
  eyebrow: ReactNode;
  /** List route the eyebrow links to and Cancel/Delete navigate back to. */
  listRoute: string;
  /** Default hero icon when no Iconify icon is picked. */
  icon: TablerIcon;
  tone: BentoTone;
  /** DOM id of the `<form>` the hero-anchored Save button submits (`form="…"`). */
  formId: string;
  /** i18n'd feature label used in toasts (e.g. `t("llm.title")`). */
  feature: string;
  /** Render the Active/Idle status pill (driven by `enabled`). */
  hasStatus?: boolean;
  /**
   * Hide the hero icon picker for entities that have no `icon` field
   * (e.g. API Token, Git). A static default-icon chip renders instead and
   * no `icon` patch is ever emitted.
   */
  hideIcon?: boolean;
  /**
   * Read-only mode — used by BYO-infra surfaces for the shared GLOBAL pool
   * (T372) when the caller is not a platform admin. Suppresses inline-edit,
   * the icon picker, the status toggle, the save buttons and destructive
   * actions; identity renders as plain text. Pair with a `notice`.
   */
  readOnly?: boolean;
  /**
   * The page has no submittable body form — identity auto-saves on blur and
   * every other action (sub-lists, generate, import) has its own button, so
   * the hero "Save changes" button would be permanently inert. When true it
   * is hidden on existing entities (Cancel/back stays); the new-entity Save
   * still shows because it is what creates the entity. Use for pages like the
   * Thesaurus KB whose only editable fields live in the hero.
   */
  autosaveOnly?: boolean;
  /** Small chip rendered in the hero trailing slot (e.g. a GLOBAL badge). */
  badge?: ReactNode;
  /** Banner rendered directly under the hero (e.g. a read-only notice). */
  notice?: ReactNode;
  /**
   * Existing-mode immediate save. Receives the entity already merged with
   * the changed identity patch. Omit in new mode (fields stage locally and
   * the form's Save creates the entity).
   *
   * Reject to refuse the edit: the shell shows it optimistically, and puts the
   * fields the patch touched back to the entity's own values when this rejects.
   */
  onUpdate?: (next: TEntity) => Promise<unknown>;
  /** Delete callback; returns whether the delete succeeded. */
  onDelete?: () => Promise<boolean>;
  /** Extra `⋮` menu actions rendered above the built-in Delete. */
  extraActions?: BentoActionsMenuItem[];
  children: (args: BentoEntityShellRenderArgs) => ReactNode;
}

/**
 * The reusable Bento detail scaffold — the lever that makes every remaining
 * CRUD screen a thin config instead of a bespoke ~360-line page (T548).
 *
 * Owns everything the LLM/AI-Agent detail pattern settled on:
 *
 *   - **Identity hero** — `BentoInlineEdit` title/description, a
 *     `BentoHeroIconPicker`, and (optionally) a clickable Active/Idle pill.
 *   - **Two modes** — *existing*: each identity field commits immediately
 *     via `onUpdate` (type → blur → saved); *new*: fields stage locally and
 *     the form's Save creates the entity (no mutation until Save).
 *   - **Scroll-linked hero → sticky-save-bar morph** — a single rAF loop
 *     writes `--bento-fade` on `<html>`; the hero's Save/Cancel
 *     (`bento-fade-out`) and the form's fixed `BentoSaveBar` (`bento-fade-in`)
 *     both interpolate off it with zero React re-renders during scroll.
 *   - **Destructive actions** in a `⋮` `BentoActionsMenu`, never the save bar.
 *
 * The form body is a render prop receiving `{ staged, onStateChange }` and
 * wraps the existing react-hook-form fields in `BentoFormSection`s unchanged.
 */
export function BentoEntityShell<TEntity extends BentoEntityLike>({
  entity,
  isNew,
  headlineFallback,
  eyebrow,
  listRoute,
  icon,
  tone,
  formId,
  feature,
  hasStatus = false,
  hideIcon = false,
  readOnly = false,
  autosaveOnly = false,
  badge,
  notice,
  onUpdate,
  onDelete,
  extraActions,
  children,
}: Readonly<BentoEntityShellProps<TEntity>>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formState, setFormState] = useState<BentoShellFormState>({ isDirty: false, isSubmitting: false });

  /*
   * Scroll-linked "hero-to-sticky-bar morph". The shared {@link useBentoScrollFade}
   * hook writes `--bento-fade` (0..1) on `<html>` each scroll frame; CSS
   * inheritance distributes it so the hero buttons (`bento-fade-out`), the
   * form's fixed save bar (`bento-fade-in`) and the layout spacer
   * (`bento-save-bar-spacer`) interpolate without React state. The same hook
   * powers the standalone {@link BentoScrollSaveBar}.
   */
  const heroSentinelRef = useRef<HTMLDivElement>(null);
  useBentoScrollFade(heroSentinelRef);

  const identity: BentoIdentity = {
    title: entity.title ?? "",
    description: entity.description ?? "",
    icon: entity.icon ?? null,
    enabled: entity.enabled ?? 1,
  };

  const [staged, setStaged] = useState<BentoIdentity>(identity);

  // Reabsorb cache changes — e.g. an immediate-save mutation landing — by
  // comparing the four identity fields rather than the entity, which is a new
  // object on every query result.
  //
  // Adjusted during render rather than in an effect: an effect paints the stale
  // identity first and corrects it on a second pass, and the render prop below
  // would see the old title for one frame. React re-runs this component before
  // committing, so the child never does.
  const [lastIdentity, setLastIdentity] = useState(identity);
  if (
    identity.title !== lastIdentity.title ||
    identity.description !== lastIdentity.description ||
    identity.icon !== lastIdentity.icon ||
    identity.enabled !== lastIdentity.enabled
  ) {
    setLastIdentity(identity);
    setStaged(identity);
  }

  async function persistField(patch: Partial<BentoIdentity>) {
    setStaged((prev) => ({ ...prev, ...patch }));
    if (isNew || !onUpdate) return; // staged-only — the form's Save creates it

    // The name it has once this lands. A rename reported under the name it is
    // leaving behind reads as the wrong entity having been saved.
    const savedTitle = patch.title ?? staged.title;

    try {
      // Spreading a generic loses the exact TEntity shape for TS; the patch
      // keys are all BentoIdentity fields that exist on the entity, so the
      // merge is safe to assert back to TEntity.
      await onUpdate({ ...entity, ...patch } as TEntity);
      toast.success(t("forms.common.updated", { name: savedTitle, feature }));
    } catch (err) {
      console.error("Failed to update entity field", err);
      // Undo the optimistic write, or the screen keeps an edit the server
      // refused. Only the fields this patch touched, and back to the entity's
      // own values rather than to a captured copy of `staged`: the save failed,
      // so the entity is the truth, and another field edited while this was in
      // flight must not be reverted with it.
      //
      // The resync-from-props below cannot do this. It fires on `identity`
      // changing, and a save that failed leaves `entity` — and so `identity` —
      // exactly as it was.
      setStaged((prev) => ({ ...prev, ...restoredFrom(patch, identity) }));
      toast.error(
        t("forms.common.notUpdated", { name: identity.title || savedTitle, feature }),
      );
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      if (await onDelete()) {
        toast.success(t("forms.common.deleted", { name: staged.title, feature }));
        navigate(listRoute);
      } else {
        toast.error(t("forms.common.notDeleted", { name: staged.title, feature }));
      }
    } catch (err) {
      console.error("Failed to delete entity", err);
      toast.error(t("forms.common.notDeleted", { name: staged.title, feature }));
    }
    setDeleteOpen(false);
  }

  const enabled = staged.enabled === 1;
  /*
   * Save/Cancel are always present on an editable detail page — parity with
   * the new-entity flow and the pre-redesign sticky header, so an existing
   * entity always shows the header affordance instead of it appearing only
   * after the form goes dirty. Identity fields (title/description/icon/
   * status) auto-save on blur, so for an untouched existing entity there is
   * nothing pending: Save stays disabled until the form body reports dirty.
   */
  const showSaveButtons = !readOnly;
  // On an autosave-only page the existing-entity Save button has nothing to
  // submit (identity auto-saves, sections self-commit) — hide it so it doesn't
  // sit there permanently disabled. New mode still needs it: it creates.
  const showSaveSubmit = !(autosaveOnly && !isNew);
  const titleMissing = !staged.title.trim();
  const nothingToSave = !isNew && !formState.isDirty;
  const saveDisabled = titleMissing || nothingToSave;

  const actions: BentoActionsMenuItem[] = [
    ...(extraActions ?? []),
    ...(onDelete && !readOnly
      ? [{
          label: t("forms.formActions.delete"),
          icon: IconTrash,
          tone: "destructive" as const,
          onSelect: () => setDeleteOpen(true),
        }]
      : []),
  ];

  return (
    <>
      <BentoHero
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {/*
             * A leading back-arrow makes the eyebrow read as a "return to the
             * list" affordance — without it the link is easy to miss. Shared
             * {@link BentoBackLink} renders the canonical arrow+label so this
             * matches every other bento breadcrumb. 
             */}
            <BentoBackLink to={listRoute}>{eyebrow}</BentoBackLink>
            {!readOnly && (
              <BentoStatusMarker titleMissing={titleMissing} dirty={isNew || formState.isDirty} />
            )}
          </span>
        }
        leading={
          <BentoHeroIconPicker
            value={staged.icon}
            onChange={(nextIcon) => persistField({ icon: nextIcon })}
            onClear={() => persistField({ icon: null })}
            defaultIcon={icon}
            tone={tone}
            title={staged.title}
            description={staged.description}
            readOnly={readOnly || hideIcon}
          />
        }
        title={
          <BentoInlineEdit
            value={staged.title}
            onSave={(title) => persistField({ title })}
            placeholder={headlineFallback}
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            ariaLabel={t("forms.common.title")}
            // Open in edit mode when creating so the user immediately sees a
            // focused input — a clear cue this is the first field to fill.
            autoFocus={isNew}
            // In new mode identity stages locally (no mutation), so commit
            // per keystroke — otherwise a user who types the name then clicks
            // the still-disabled Save never commits and Save looks stuck.
            commitOnChange={isNew}
            readOnly={readOnly}
          />
        }
        subtitle={
          <BentoInlineEdit
            value={staged.description}
            onSave={(description) => persistField({ description })}
            multiline
            placeholder={t("forms.common.description")}
            className="max-w-2xl text-sm text-muted-foreground"
            ariaLabel={t("forms.common.description")}
            commitOnChange={isNew}
            readOnly={readOnly}
          />
        }
        trailing={
          <>
            {showSaveButtons && (
              /*
               * Hero-anchored Save/Cancel. `bento-fade-out` reads the
               * inherited `--bento-fade` and applies opacity + translate;
               * pointer-events flip via `bento-fade-half` past the midpoint
               * so these stop catching clicks meant for the fixed save bar.
               * Bind to the form via the `form="…"` attribute.
               */
              <div className="bento-fade-out flex shrink-0 items-center gap-2">
                {showSaveSubmit && (
                  <GradientButton type="submit" form={formId} size="sm" loading={formState.isSubmitting} disabled={saveDisabled}>
                    <IconDeviceFloppy className="size-4" />
                    {t("forms.formActions.saveChanges")}
                  </GradientButton>
                )}
                <GradientButton type="button" size="sm" variant="outline" onClick={() => navigate(listRoute)}>
                  <IconX className="size-4" />
                  {t("forms.formActions.cancel")}
                </GradientButton>
              </div>
            )}
            {badge}
            {hasStatus && (readOnly ? (
              <span
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                  enabled
                    ? "bento-status bento-status-on"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bento-status-dot bento-pulse" : "bg-muted-foreground/60"}`} />
                {enabled ? t("common.active", { defaultValue: "Active" }) : t("common.idle", { defaultValue: "Idle" })}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => persistField({ enabled: enabled ? 0 : 1 })}
                aria-label={t("forms.common.enabled")}
                title={enabled ? t("common.activeToggleHint") : t("common.idleToggleHint")}
                className={`bento-tile-clickable flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                  enabled
                    ? "bento-status bento-status-on"
                    : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bento-status-dot bento-pulse" : "bg-muted-foreground/60"}`} />
                {enabled ? t("common.active", { defaultValue: "Active" }) : t("common.idle", { defaultValue: "Idle" })}
              </button>
            ))}
            {!isNew && actions.length > 0 && <BentoActionsMenu actions={actions} />}
          </>
        }
      />

      {/* Sentinel for the scroll-driven progress — sits between hero and form. */}
      <div ref={heroSentinelRef} aria-hidden className="h-px" />

      {notice}

      {/*
       * Controlled DialogDelete — its built-in trigger is hidden so the
       * actions menu is the only entry point.
       */}
      {!isNew && onDelete && (
        <DialogDelete
          feature={feature}
          name={staged.title}
          onDelete={handleDelete}
          open={deleteOpen}
          setOpen={setDeleteOpen}
          trigger={<span className="hidden" aria-hidden />}
        />
      )}

      {children({ staged, onStateChange: setFormState })}
    </>
  );
}
