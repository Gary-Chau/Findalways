<template>
  <div class="h-0 w-0">
    <svg
      ref="sidekickRef"
      v-bind="size"
      :style="sidekickStyle"
      viewBox="0 0 703 703"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="sidekick pointer-events-none"
    >
      <path
        ref="bodyRef"
        d="M584 351.5C584 479.906 485.5 584 351.5 584C217.5 584 119 479.906 119 351.5C119 223.094 223.094 119 351.5 119C479.906 119 584 223.094 584 351.5Z"
        :fill="props.color"
        :style="bodyStyle"
        class="body"
      />

      <g
        :style="faceStyle"
        class="face"
      >
        <ellipse
          cx="289"
          cy="284.5"
          rx="24"
          ry="67.5"
          fill="white"
          class="eye"
        />
        <ellipse
          cx="415"
          cy="284.5"
          rx="24"
          ry="67.5"
          fill="white"
          class="eye"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { useElementBounding } from '@vueuse/core'
import type { CSSProperties } from 'vue'
import anime from 'animejs'
import { pipe } from 'remeda'
import { computed, ref, watch } from 'vue'

import { mapNumber } from '../../common/utils'

interface Position {
  x: number;
  y: number;
}

// #region Props
interface Props {
  size: number;
  color: string;
  /** 目前速度 */
  velocity: number;
  /** 人物目前位置 */
  position: Position;
  /** 游標位置 */
  cursorPosition: Position;

  targetElement?: {
    value: HTMLElement;
    bounding: ReturnType<typeof useElementBounding>;
  };
  activeElement?: {
    value: HTMLElement;
    bounding: ReturnType<typeof useElementBounding>;
  };
  hoverElement?: {
    value: HTMLElement;
    bounding: ReturnType<typeof useElementBounding>;
  };

  /** 已選取文字 */
  selectionState?: {
    rect: DOMRect;
    text: string;
  };
}
// #endregion Props
const props = withDefaults(defineProps<Props>(), {
  targetElement: undefined,
  activeElement: undefined,
  hoverElement: undefined,
  selectionState: undefined,
})

const sidekickRef = ref<SVGElement>()
const bodyRef = ref<SVGPathElement>()
const size = computed(() => ({
  width: props.size,
  height: props.size,
}))

const targetElementBounding = computed(() => props.targetElement?.bounding)

const isRound = ref(true)
watch(
  () => ({
    el: props.targetElement?.value,
    text: props.selectionState?.text,
  }),
  async ({ el, text }) => {
    const bodyEl = bodyRef.value
    if (!bodyEl)
      return

    if ((el || text) && isRound.value) {
      anime.remove(bodyEl)
      anime({
        targets: bodyEl,
        d: 'M691 20.4999C711 40.5 705 681 691 695C677 709 32.0003 714 13 695C-6.00038 676 -13.0001 46.5 12.9999 20.5C38.9999 -5.50002 671 0.499857 691 20.4999Z',
        duration: 1000,
      })

      isRound.value = false
    }

    if (!el && !text && !isRound.value) {
      anime.remove(bodyEl)
      anime({
        targets: bodyEl,
        d: 'M584 351.5C584 479.906 485.5 584 351.5 584C217.5 584 119 479.906 119 351.5C119 223.094 223.094 119 351.5 119C479.906 119 584 223.094 584 351.5Z',
        duration: 800,
      })
      isRound.value = true
    }
  },
)

const hasTarget = computed(() => props.targetElement?.value || props.selectionState?.text)

/** 根據目標位置計算身體旋轉角度，以 +x 為 0 度 */
const bodyAngle = computed(() => {
  if (hasTarget.value)
    return 0

  const size = props.size
  const [x, y] = [
    props.cursorPosition.x - props.position.x - size / 2,
    props.cursorPosition.y - props.position.y - size / 2,
  ]
  return Math.atan2(y, x)
})

const bodyStyle = computed<CSSProperties>(() => {
  // 速度越快身體越扁
  const scaleX = mapNumber(props.velocity, 0, 1, 1, 1.4)

  return {
    transform: `rotate(${bodyAngle.value}rad) scaleX(${scaleX}) `,
  }
})

const FACE_MAX_ANGLE = 30
/** 計算臉部旋轉 */
const faceStyle = computed<CSSProperties>(() => {
  const angle = bodyAngle.value

  // 根據 2D 角度計算 3D 旋轉量
  const rotationX = Math.sin(angle) * FACE_MAX_ANGLE
  const rotationY = -Math.cos(angle) * FACE_MAX_ANGLE

  const opacityDelay = hasTarget.value ? 0 : 0.4
  return {
    transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
    transition: `opacity 0.4s ${opacityDelay}s`,
    opacity: hasTarget.value ? 0 : 1,
  }
})

const faceTransformOrigin = computed(
  () => `50% 50% ${props.size * 3}px`,
)

const SIZE_EXPAND = 10
const sidekickStyle = computed<CSSProperties>(() => {
  if (!hasTarget.value)
    return {}

  const size = props.size

  const [x, y] = pipe(null, () => {
    if (targetElementBounding.value) {
      const { width, height } = targetElementBounding.value

      return [
        (width.value + SIZE_EXPAND) / size,
        (height.value + SIZE_EXPAND) / size,
      ]
    }

    const rect = props.selectionState?.rect
    if (props.selectionState?.text && rect) {
      return [
        (rect.width + SIZE_EXPAND) / size,
        (rect.height + SIZE_EXPAND) / size,
      ]
    }

    return [1, 1]
  })

  return {
    transform: `scale(${x}, ${y})`,
    opacity: hasTarget.value ? 0.1 : 1,
  }
})

// #region Methods
defineExpose({})
// #endregion Methods
</script>

<style scoped lang="sass">
.sidekick
  perspective: 10rem
  transition: transform 0.8s cubic-bezier(0.96, 0, 0.2, 1.15), opacity 0.4s
  transform-origin: 50% 50%

.body
  transform-origin: 50% 50%

.face
  transform-origin: v-bind(faceTransformOrigin)
.eye
  transform-origin: 50% 50%

@keyframes blink
  0%, 98%, 100%
    opacity: 1
  99%
    opacity: 0
</style>
