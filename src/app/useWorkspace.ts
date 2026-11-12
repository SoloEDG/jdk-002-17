import { computed, onMounted, onUnmounted, ref } from "vue";
import { useLibrary } from "../features/library";
import { usePerformance } from "../features/performance";
import { useJudgment, bindInput } from "../features/judgment";
import { usePractice } from "../features/practice";
import { useRecords, makeResult } from "../features/records";
import { makeRun } from "../shared/session";
import { secondsAt } from "../shared/chart";
import type { PracticeConfig, Run } from "../shared/session";
import type { Lane } from "../shared/chart";

export function useWorkspace() {
  const library = useLibrary(),
    practice = usePractice(),
    judgment = useJudgment(),
    records = useRecords(),
    error = ref("");
  const performance = usePerformance(
    (t) => judgment.tick(t),
    () => {
      if (performance.run.value)
        records.commit(
          makeResult(
            performance.run.value,
            judgment.hits.value,
            judgment.stats.value,
          ),
        );
    },
  );
  const locked = computed(
    () =>
      performance.phase.value === "playing" ||
      performance.phase.value === "paused",
  );
  async function start() {
    practice.cancelDraft();
    const run = makeRun(library.selected.value, practice.config.value);
    judgment.reset(run);
    error.value = "";
    try {
      await performance.start(run);
    } catch {
      error.value = "音频未能启动，请再次点击开始";
      performance.reset();
    }
  }
  function select(id: string) {
    if (locked.value) return;
    library.select(id);
    practice.reset(library.selected.value.beats);
    performance.reset();
    judgment.reset(makeRun(library.selected.value, practice.config.value));
  }
  function down(lane: Lane) {
    if (performance.phase.value === "playing")
      judgment.down(lane, performance.time.value);
  }
  function up(lane: Lane) {
    if (performance.phase.value === "playing")
      judgment.up(lane, performance.time.value);
  }
  function pause() {
    performance.pause();
    judgment.clearHeld();
  }
  function toggle() {
    if (performance.phase.value === "playing") pause();
    else if (performance.phase.value === "paused") void performance.resume();
  }
  function updatePractice(patch: Partial<PracticeConfig>) {
    if (!locked.value) practice.update(patch, library.selected.value.beats);
  }
  function beginDrag() {
    if (!locked.value && practice.config.value.enabled) practice.beginDraft();
  }
  function dragRange(edge: "start" | "end", beat: number) {
    if (!locked.value) practice.dragDraft(edge, beat, library.selected.value.beats);
  }
  function commitRange() {
    if (!locked.value) practice.commitDraft(library.selected.value.beats);
  }
  function cancelRange() {
    practice.cancelDraft();
  }
  const stageRun = computed<Run | null>(() => {
    if (performance.run.value) return performance.run.value;
    const c = practice.config.value;
    if (!c.enabled) return null;
    const d = practice.draft.value;
    return makeRun(
      library.selected.value,
      d ? { ...c, start: d.start, end: d.end } : c,
    );
  });
  const stageTime = computed(() => {
    if (performance.run.value) return performance.time.value;
    const r = stageRun.value;
    return r ? secondsAt(r.start, r.track.bpm) : 0;
  });
  let cleanup = () => {};
  const blur = () => {
    if (performance.phase.value === "playing") pause();
  };
  onMounted(() => {
    cleanup = bindInput(down, up, toggle);
    window.addEventListener("blur", blur);
  });
  onUnmounted(() => {
    cleanup();
    window.removeEventListener("blur", blur);
    performance.reset();
  });
  return {
    library,
    practice,
    judgment,
    records,
    performance,
    locked,
    error,
    stageRun,
    stageTime,
    start,
    select,
    down,
    up,
    pause,
    updatePractice,
    beginDrag,
    dragRange,
    commitRange,
    cancelRange,
  };
}
