<template>
  <div class="cursor-sidekick-wrapper">
    <the-sidekick
      v-bind="sidekickProp"
      :style="sidekickStyle"
    />

    <sidekick-tooltip v-bind="tooltipProp" />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ContentProvider } from './use-content-provider'
import {
  throttleFilter,
  useActiveElement,
  useElementBounding,
  useElementByPoint,
  useMouse,
  useRafFn,
  useTextSelection,
} from '@vueuse/core'
import { isNullish, pipe } from 'remeda'
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import { getVectorLength } from '../../common/utils'
import SidekickTooltip from './sidekick-tooltip.vue'
import TheSidekick from './the-sidekick.vue'
import { useContentProvider } from './use-content-provider'

type SidekickProp = InstanceType<typeof TheSidekick>['$props']
type TooltipProp = InstanceType<typeof SidekickTooltip>['$props']

/**
 * 此元件負責控制人物移動與目標檢測，情緒和互動交給 the-sidekick 處理
 */

// #region Props
interface Props {
  /** 單位 px */
  size?: number;
  /** \# 前綴之 HEX 格式
   * @default '#515151'
   */
  color?: string;
  /** 最大速度。越慢小跟班越悠哉。單位 px/ms
   * @default 1
   */
  maxVelocity?: number;
  /**  @default 100 */
  zIndex?: number;

  /** 匹配 active element 的 provider。
   *
   * 通常用於可點擊或 focus 的元素。
   */
  activeProviders?: ContentProvider[];

  /** 匹配 hover element 的 provider
   *
   * 只要 hover 到符合條件的元素，即會觸發。
   */
  hoverProviders?: ContentProvider[];

  /** 匹配選取文字的 provider  */
  selectProviders?: ContentProvider[];
}
// #endregion Props
const props = withDefaults(defineProps<Props>(), {
  size: 48,
  color: '#515151',
  maxVelocity: 2,
  zIndex: 100,

  activeProviders: () => [],
  hoverProviders: () => [],
  selectProviders: () => [],
})

const {
  activeContentProviders,
  hoverContentProviders,
} = useContentProvider({
  activeList: props.activeProviders,
  hoverList: props.hoverProviders,
  selectList: props.selectProviders,
})

const mouseInfo = useMouse({
  eventFilter: throttleFilter(30),
  type: 'client',
})

// 有效的 active element
const activeElement = shallowRef<HTMLElement | null>()
const activeElementBounding = useElementBounding(activeElement, {
  reset: false,
})

const activeElementRef = useActiveElement()
watch(activeElementRef, (el) => {
  if (!isNullish(el?.getAttribute('data-sidekick-ignore'))) {
    return
  }

  // body 例外
  if (el instanceof HTMLBodyElement) {
    activeElement.value = undefined
    return
  }

  if (el) {
    const result = activeContentProviders.value.some(({ match }) => match(el))
    if (!result)
      return
  }

  // console.log(`🚀 ~ activeElement:`, el);
  activeElement.value = el
})

// 有效的 hover element
const hoverElement = shallowRef<HTMLElement | null>()
const hoverElementBounding = useElementBounding(hoverElement, {
  reset: false,
})

const { element } = useElementByPoint(mouseInfo)
watch(element, (el) => {
  if (!isNullish(el?.getAttribute('data-sidekick-ignore'))) {
    return
  }

  if (el) {
    const result = hoverContentProviders.value.some(({ match }) => match(el))
    if (!result) {
      hoverElement.value = undefined
      return
    }
  }

  // console.log(`🚀 ~ hoverElement:`, el);
  hoverElement.value = el
})

const selectionState = useTextSelection()

/** 目標 element，active element 優先 */
const targetElement = computed(() => {
  return activeElement.value ?? hoverElement.value ?? undefined
})
const targetElementBounding = useElementBounding(targetElement, {
  reset: false,
})

// watchEffect(() => {
//   console.log('targetElement: ', targetElement.value);
// })

// --- 人物基礎參數

/** 目前位置 */
const position = ref({ x: -50, y: -50 })
/** 一般狀態為 cursor 位置，目標存在則為目標位置 */
const targetPosition = computed(() => {
  if (targetElement.value) {
    // 移動至目標元素中心
    return {
      x: targetElementBounding.x.value + targetElementBounding.width.value / 2 - props.size / 2,
      y: targetElementBounding.y.value + targetElementBounding.height.value / 2 - props.size / 2,
    }
  }

  if (selectionState.text.value) {
    const rect = selectionState.rects.value[0]
    if (!rect) {
      return {
        x: mouseInfo.x.value,
        y: mouseInfo.y.value,
      }
    }

    return {
      x: rect.left + rect.width / 2 - props.size / 2,
      y: rect.top + rect.height / 2 - props.size / 2,
    }
  }

  return {
    x: mouseInfo.x.value,
    y: mouseInfo.y.value,
  }
})
watchEffect(() => {
  // console.log('targetPosition: ', targetPosition.value);
})

/** 位移 */
const displacement = ref(0)
/** 速率。px/ms */
const velocity = ref(0)
/** 最大速率。一般狀態下等於 props.maxVelocity，特殊事件則無限制 */
const maxVelocity = computed(() => {
  if (targetElement.value || selectionState.text.value) {
    return 100
  }

  return props.maxVelocity
})
/** 阻力，讓移動有加速度效果，特殊事件則無限制 */
const resistance = computed(() => {
  if (targetElement.value || selectionState.text.value) {
    return 8
  }

  return 20
})

// 更新位移與速率
useRafFn(({ delta: deltaTime }) => {
  const delta = {
    x: targetPosition.value.x - position.value.x,
    y: targetPosition.value.y - position.value.y,
  }

  const deltaPosition = {
    x: delta.x / resistance.value,
    y: delta.y / resistance.value,
  }
  if (Math.abs(deltaPosition.x) < 0.1 && Math.abs(deltaPosition.y) < 0.1) {
    displacement.value = 0
    velocity.value = 0
    return
  }

  displacement.value = getVectorLength(deltaPosition)
  velocity.value = displacement.value / deltaTime

  if (velocity.value > maxVelocity.value) {
    deltaPosition.x /= velocity.value / maxVelocity.value
    deltaPosition.y /= velocity.value / maxVelocity.value
  }

  position.value.x += deltaPosition.x
  position.value.y += deltaPosition.y
})

const sidekickStyle = computed<CSSProperties>(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
}))

const sidekickProp = computed(() => {
  const result: SidekickProp = {
    size: props.size,
    color: props.color,
    velocity: velocity.value,
    position: {
      x: position.value.x,
      y: position.value.y,
    },
    cursorPosition: {
      x: mouseInfo.x.value,
      y: mouseInfo.y.value,
    },
    targetElement: pipe(null, () => {
      if (!targetElement.value)
        return

      return {
        value: targetElement.value,
        bounding: targetElementBounding,
      }
    }),
    activeElement: pipe(null, () => {
      if (!activeElement.value)
        return

      return {
        value: activeElement.value,
        bounding: activeElementBounding,
      }
    }),
    hoverElement: pipe(null, () => {
      if (!hoverElement.value)
        return

      return {
        value: hoverElement.value,
        bounding: hoverElementBounding,
      }
    }),
    selectionState: selectionState.rects.value[0]
      ? {
          text: selectionState.text.value,
          rect: selectionState.rects.value[0],
        }
      : undefined,
  }

  return result
})

const tooltipProp = computed(() => {
  const result: TooltipProp = {
    targetElement: pipe(null, () => {
      if (!targetElement.value)
        return

      return {
        value: targetElement.value,
        bounding: targetElementBounding,
      }
    }),
    activeElement: pipe(null, () => {
      if (!activeElement.value)
        return

      return {
        value: activeElement.value,
        bounding: activeElementBounding,
      }
    }),
    hoverElement: pipe(null, () => {
      if (!hoverElement.value)
        return

      return {
        value: hoverElement.value,
        bounding: hoverElementBounding,
      }
    }),
    selectionState: selectionState.rects.value[0]
      ? {
          text: selectionState.text.value,
          rect: selectionState.rects.value[0],
        }
      : undefined,

    activeProviders: props.activeProviders,
    hoverProviders: props.hoverProviders,
    selectProviders: props.selectProviders,
  }

  return result
})

// #region Methods
defineExpose({})
// #endregion Methods
</script>

<style scoped lang="sass">
.cursor-sidekick-wrapper
  position: absolute
  left: 0
  top: 0
  width: 100%
  height: 100%
  pointer-events: none
  z-index: v-bind('props.zIndex')
</style>
