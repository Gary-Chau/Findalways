<template>
  <svg
    ref="earRef"
    viewBox="0 0 350 540"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="ear"
  >
    <circle
      cx="175"
      cy="363.497"
      r="175"
      :fill="props.mainColor"
    />
    <path
      ref="outsideRef"
      d="M182.5 0C350 112.5 350 363.497 350 363.497C350 363.497 91.5 390 0 363.497C-4.92036e-05 253 50 108 182.5 0Z"
      :fill="props.mainColor"
    />
    <path
      ref="insideRef"
      d="M184.5 28.5C330.5 155.5 330.5 335 330.5 363.497C313 368.5 182.5 390.5 127.5 363.497C127.5 287.5 122.5 183.5 184.5 28.5Z"
      :fill="props.innerColor"
    />
  </svg>
</template>

<script lang="ts">
</script>

<script setup lang="ts">
import type { ActionName } from '.'
import { onMounted, ref, watch } from 'vue'

export interface AnimateInstance {
  stop: () => void;
}
export type AnimateMap = Record<ActionName, () => AnimateInstance>

export interface Props {
  action?: `${ActionName}`;
  mainColor?: string;
  innerColor?: string;
  initAnimate: (param: {
    earEl: SVGElement;
    insideEl: SVGPathElement;
    outsideEl: SVGPathElement;
  }) => AnimateMap;
}

const props = withDefaults(defineProps<Props>(), {
  action: 'relaxed',
  mainColor: '#CECECE',
  innerColor: '#E7E7E7',
})

const earRef = ref<SVGElement>()
const insideRef = ref<SVGPathElement>()
const outsideRef = ref<SVGPathElement>()

let animateMap: AnimateMap | undefined
let prevAnimate: AnimateInstance | undefined
watch(() => props.action, (value) => {
  if (!animateMap)
    return

  prevAnimate?.stop()

  prevAnimate = animateMap?.[value]?.()
})

onMounted(() => {
  if (
    !earRef.value || !insideRef.value || !outsideRef.value
  ) {
    console.error('Missing ref')
    return
  }

  animateMap = props.initAnimate({
    earEl: earRef.value!,
    insideEl: insideRef.value!,
    outsideEl: outsideRef.value!,
  })

  prevAnimate = animateMap?.[props.action]?.()
})

// #region Methods
defineExpose({})
// #endregion Methods
</script>

<style scoped lang="sass">
.ear
  transform-origin: 50% 80%
</style>
