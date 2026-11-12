import { ref } from "vue";
import type { PracticeConfig } from "../../../shared/session";
import { clampEdge, normalize } from "../lib/range";
import type { Range } from "../lib/range";
export function usePractice() {
  const config = ref<PracticeConfig>({
    enabled: false,
    speed: 0.75,
    start: 0,
    end: 64,
  });
  const draft = ref<Range | null>(null);
  function update(patch: Partial<PracticeConfig>, beats: number) {
    config.value = normalize({ ...config.value, ...patch }, beats);
    draft.value = null;
  }
  function reset(beats: number) {
    config.value = { ...config.value, start: 0, end: beats };
    draft.value = null;
  }
  function beginDraft() {
    draft.value = { start: config.value.start, end: config.value.end };
  }
  function dragDraft(edge: "start" | "end", beat: number, beats: number) {
    const d = draft.value;
    if (!d) return;
    draft.value =
      edge === "start"
        ? { start: clampEdge(edge, beat, d.end, beats), end: d.end }
        : { start: d.start, end: clampEdge(edge, beat, d.start, beats) };
  }
  function commitDraft(beats: number) {
    if (!draft.value) return;
    config.value = normalize({ ...config.value, ...draft.value }, beats);
    draft.value = null;
  }
  function cancelDraft() {
    draft.value = null;
  }
  return {
    config,
    draft,
    update,
    reset,
    beginDraft,
    dragDraft,
    commitDraft,
    cancelDraft,
  };
}
