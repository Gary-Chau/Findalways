<template>
  <div class="w-full flex flex-col items-center justify-center gap-16 border border-gray-300 py-20">
    <wrapper-cat-ear
      :action="action"
      main-color="#666"
      class="cat border-2 border-[#666] rounded"
    >
      <div
        ref="catRef"
        class="flex items-center justify-center bg-white px-16 py-8"
      >
        <transition
          name="cat"
          mode="out-in"
        >
          <div
            :key="face"
            class="absolute select-none text-nowrap text-2xl font-bold"
            v-text="face"
          />
        </transition>
      </div>
    </wrapper-cat-ear>
  </div>
</template>

<script setup lang="ts">
import type { ActionName } from '..'
import { throttleFilter, useMouseInElement, useMousePressed } from '@vueuse/core'
import { computed, ref } from 'vue'
import { getVectorLength } from '../../../common/utils'
import WrapperCatEar from '../wrapper-cat-ear.vue'

const faceMap: Record<ActionName, string> = {
  peekaboo: '送出',
  relaxed: '◕ ω ◕',
  fear: '´•̥̥̥ ω •̥̥̥`',
  displeased: '˘･ ω ･˘',
  shake: '≧ X ≦',
}

const catRef = ref()
const {
  elementX,
  elementY,
  elementWidth,
  elementHeight,
  isOutside,
} = useMouseInElement(catRef, {
  eventFilter: throttleFilter(35),
})
const { pressed } = useMousePressed()

/** 滑鼠與貓的距離 */
const distance = computed(() => getVectorLength({
  x: elementX.value - elementWidth.value / 2,
  y: elementY.value - elementHeight.value / 2,
}))
/** 煩躁的距離 */
const displeasedDistance = computed(
  () => Math.max(elementWidth.value, elementHeight.value),
)
/** 變成貓的距離 */
const catDistance = computed(
  () => displeasedDistance.value * 2,
)

const action = computed<`${ActionName}`>(() => {
  if (!isOutside.value) {
    return pressed.value ? 'shake' : 'fear'
  }

  if (distance.value > catDistance.value) {
    return 'peekaboo'
  }

  if (distance.value < displeasedDistance.value) {
    return 'displeased'
  }

  return 'relaxed'
})
const face = computed(() => faceMap[action.value])
</script>

<style lang="sass">
.cat
  transition-duration: 0.4s
  box-shadow: 3px 3px 0px 0px rgba(#AAA, 0.8)
  &:hover
    transition-duration: 0.3s
    scale: 1.02
    box-shadow: 5px 5px 0px 0px rgba(#AAA, 0.5)
  &:active
    transition-duration: 0.1s
    scale: 0.95
    animation: shake 0.3s infinite ease-in-out
    box-shadow: 0px 0px 0px 0px rgba(#AAA, 1)

.cat-enter-active, .cat-leave-active
  transition-duration: 0.2s
.cat-enter-from, .cat-leave-to
  transform: translateY(10px)
  opacity: 0 !important
.cat-leave-to
  transform: translateY(-10px)

@keyframes shake
  35%
    rotate: -3deg
  70%
    rotate: 3deg
</style>
