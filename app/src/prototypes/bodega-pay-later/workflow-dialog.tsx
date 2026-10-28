/* THE WORKFLOW DIALOG — Cedar's, re-exported, because a copy would be a second drawing of one
 * control with nothing of its own to say.
 *
 * ═══ WHY A RE-EXPORT AND NOT A COPY (DESIGN-SPEC.md §7 item 13) ══════════════════════════════
 * The build plan copies a Cedar module when the copy has to hold its own STATE — a ledger, a bearer,
 * a browser key — because one origin serves `/cedar/` and `/bodega-pay-later/` and a shared key
 * means one prototype editing the other's record. `cedar/workflow-dialog.tsx` holds none. Its whole
 * import list is:
 *
 *   react · baseui · baseui/button · lucide-react · rocoto/overlay-card · ./shell/viewport
 *
 * Base Web, the shared kit, and the viewport's two read-only constants (`PHONE_MAX`, `usePhone`).
 * Nothing there reads `localStorage`, Cedar's config, its grants, its cast or its day. So the sheet
 * and the panels in this prototype stand on Cedar's own dialog — the SAME 800×600 ceiling, the same
 * auto-dock to a bottom sheet under 559 px, the same head, back and close — and a person who has
 * used one dialog in this app has used every one of them.
 *
 * ⚠ IF IT EVER GROWS STATE, COPY IT. The day `workflow-dialog.tsx` reaches for a store, a key or
 * Cedar's config, this file becomes the copy the build plan describes and renames that key
 * `rocoto-bodega-*`. Until then the re-export is the honest record: one control, one source.
 */
export {
  WORKFLOW_WIDTH,
  WORKFLOW_HEIGHT,
  WorkflowDialog,
  WorkflowContent,
  workflowCardOverrides,
  useWorkflowPlacement,
  useWorkflowViewport,
} from '../cedar/workflow-dialog';
export type { WorkflowDialogProps } from '../cedar/workflow-dialog';
