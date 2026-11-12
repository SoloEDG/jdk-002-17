<script setup lang="ts">
import { computed, ref } from "vue";
import type { Track } from "../../../shared/chart";
const props = defineProps<{
  track: Track;
  start: number;
  end: number;
  disabled: boolean;
}>();
const emit = defineEmits<{
  begin: [];
  drag: [edge: "start" | "end", beat: number];
}>();
const el = ref<HTMLElement | null>(null);
const dragging = ref<"start" | "end" | null>(null);
const bars = computed(() =>
  Array.from({ length: Math.ceil(props.track.beats / 4) }, (_, i) => ({
    outside: i * 4 < props.start || i * 4 >= props.end,
    height:
      12 +
      props.track.notes.filter((n) => n.beat >= i * 4 && n.beat < i * 4 + 4)
        .length *
        4,
  })),
);
function beatAt(event: PointerEvent) {
  const rect = el.value!.getBoundingClientRect();
  return ((event.clientX - rect.left) / rect.width) * props.track.beats;
}
function down(edge: "start" | "end", event: PointerEvent) {
  if (props.disabled) return;
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  dragging.value = edge;
  emit("begin");
}
function move(event: PointerEvent) {
  if (!dragging.value) return;
  emit("drag", dragging.value, beatAt(event));
}
function up() {
  dragging.value = null;
}
</script>
<template>
  <div ref="el" class="beat-timeline" aria-label="谱面密度预览">
    <span
      v-for="(bar, i) in bars"
      :key="i"
      :class="{ outside: bar.outside }"
      :style="{ height: bar.height + 'px' }"
    ></span>
    <div
      v-if="!disabled"
      class="range-selection"
      :class="{ dragging: !!dragging }"
      :style="{
        left: (start / track.beats) * 100 + '%',
        width: ((end - start) / track.beats) * 100 + '%',
      }"
    >
      <button
        type="button"
        class="range-handle start"
        aria-label="拖动调整起始拍"
        @pointerdown="down('start', $event)"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
      ></button>
      <button
        type="button"
        class="range-handle end"
        aria-label="拖动调整结束拍"
        @pointerdown="down('end', $event)"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
      ></button>
    </div>
  </div>
</template>
