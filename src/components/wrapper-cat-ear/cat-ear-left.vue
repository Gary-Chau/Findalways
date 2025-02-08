<template>
  <div ref="frameRef">
    <cat-ear
      :init-animate="initAnimate"
      v-bind="earProps"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  AnimateInstance,
  AnimateMap,
  Props as EarProps,
} from './base-cat-ear.vue'
import { throttleFilter, useMouseInElement } from '@vueuse/core'
import anime from 'animejs'
import { computed, ref } from 'vue'
import { runTasks } from '../../common/utils'
import CatEar from './base-cat-ear.vue'

interface Props extends Pick<
  EarProps,
  'action' | 'mainColor' | 'innerColor'
> { }
const props = defineProps<Props>()

const frameRef = ref<HTMLDivElement>()
const { isOutside } = useMouseInElement(frameRef, {
  eventFilter: throttleFilter(35),
})

const earProps = computed(() => {
  if (props.action === 'peekaboo') {
    return props
  }

  return {
    ...props,
    action: isOutside.value ? props.action : 'shake',
  }
})

type InitAnimate = InstanceType<typeof CatEar>['$props']['initAnimate']
type GetAnimateParam = Parameters<InitAnimate>[0]

interface ResetAnimateOption {
  duration?: number;
}
/** 回復初始外觀，消除 SVG 變形動畫 */
async function resetEarAnimate(
  { insideEl, outsideEl }: GetAnimateParam,
  option?: ResetAnimateOption,
) {
  const { duration = 500 } = option ?? {}

  anime({
    targets: outsideEl,
    d: 'M182.5 0C350 112.5 350 363.497 350 363.497C350 363.497 91.5 390 0 363.497C-4.92036e-05 253 50 108 182.5 0Z',
    duration,
  })
  await anime({
    targets: insideEl,
    d: 'M184.5 28.5C330.5 155.5 330.5 335 330.5 363.497C313 368.5 182.5 390.5 127.5 363.497C127.5 287.5 122.5 183.5 184.5 28.5Z',
    duration,
  }).finished
}

function startPeekabooAnimate(param: GetAnimateParam): AnimateInstance {
  const { earEl } = param

  anime({
    targets: earEl,
    rotate: 180,
    duration: 1000,
  })

  return {
    stop() {
      anime.remove(earEl)
    },
  }
}
function startRelaxedAnimate(param: GetAnimateParam): AnimateInstance {
  const { earEl, insideEl, outsideEl } = param
  const finalValue = -10

  runTasks([
    () => {
      resetEarAnimate(param)

      return anime({
        targets: earEl,
        rotate: finalValue,
        duration: 1000,
      }).finished
    },
    async () => {
      anime({
        targets: earEl,
        keyframes: [
          { rotate: 10 },
          { rotate: finalValue },
        ],
        duration: 2000,
        loop: true,
      })
    },
  ])

  return {
    stop() {
      anime.remove([earEl, insideEl, outsideEl])
    },
  }
}
function startFearAnimate(param: GetAnimateParam): AnimateInstance {
  const { earEl, insideEl, outsideEl } = param
  const finalValue = 92

  runTasks([
    () => {
      anime({
        targets: outsideEl,
        d: 'M222.768 0C350 187 350 377.497 350 377.497C350 377.497 91.5 404 0 377.497C-4.92036e-05 267 54.2683 68 222.768 0Z',
        duration: 500,
      })
      anime({
        targets: insideEl,
        d: 'M228.268 39C316.768 154.5 340.5 349 340.5 377.497C323 382.5 305 383.5 284 377.497C284 301.5 277.768 144.5 228.268 39Z',
        duration: 500,
      })

      return anime({
        targets: earEl,
        rotate: finalValue,
        duration: 500,
      }).finished
    },
    async () => {
      anime({
        targets: earEl,
        keyframes: [
          { rotate: 90 },
          { rotate: finalValue },
        ],
        duration: 100,
        loop: true,
      })
    },
  ])

  return {
    stop() {
      anime.remove([earEl, insideEl, outsideEl])
    },
  }
}
function startDispleasedAnimate(param: GetAnimateParam): AnimateInstance {
  const { earEl, insideEl, outsideEl } = param
  const finalValue = 70

  runTasks([
    () => {
      anime({
        targets: outsideEl,
        d: 'M43.0001 0C350 138.5 350 399.997 350 399.997C350 399.997 91.5003 426.5 0.000305281 399.997C0.000256077 289.5 15 144.5 43.0001 0Z',
        duration: 500,
      })
      anime({
        targets: insideEl,
        d: 'M58.9999 20.5C307 142 340.5 371.5 340.5 399.997C323 405 305 406 284 399.997C284 324 187 136 58.9999 20.5Z',
        duration: 500,
      })
      return anime({
        targets: earEl,
        rotate: finalValue,
        duration: 500,
      }).finished
    },
    () => anime({
      targets: earEl,
      keyframes: [
        { rotate: 80 },
        { rotate: finalValue },
      ],
      duration: 1000,
      loop: true,
    }).finished,
  ])

  return {
    stop() {
      anime.remove([earEl, insideEl, outsideEl])
    },
  }
}
function startShakeAnimate(param: GetAnimateParam): AnimateInstance {
  const { earEl } = param

  resetEarAnimate(param)
  anime({
    targets: earEl,
    keyframes: [
      { rotate: -10, easing: 'easeOutBack' },
      { rotate: 110, easing: 'easeInBack' },
      { rotate: -10, easing: 'easeOutBack', endDelay: 100 },
      { rotate: 110, easing: 'easeInBack' },
      { rotate: -10, easing: 'easeOutBack', endDelay: 800 },
      { rotate: 110, easing: 'easeInBack' },
      { rotate: -10 },
    ],
    duration: 800,
    loop: true,
  })

  return {
    stop() {
      anime.remove(earEl)
    },
  }
}

const initAnimate: InitAnimate = (param) => {
  const result: AnimateMap = {
    peekaboo: () => startPeekabooAnimate(param),
    relaxed: () => startRelaxedAnimate(param),
    fear: () => startFearAnimate(param),
    displeased: () => startDispleasedAnimate(param),
    shake: () => startShakeAnimate(param),
  }

  return result
}

// #region Methods
defineExpose({})
// #endregion Methods
</script>

<style scoped lang="sass">
</style>
