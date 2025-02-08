<template>
  <div
    ref="blockRef"
    class="mc-block relative"
    :class="{ 'opacity-0': isDug }"
    @dblclick.prevent="placeBlock"
  >
    <slot />

    <block-lid
      :stage="destroyStage"
      class="pointer-events-none absolute left-0 top-0 h-full w-full"
    />
  </div>
</template>

<script setup lang="ts">
import type { BlockType, BusData } from './type'
import {
  useElementBounding,
  useEventBus,
  useIntervalFn,
  useMousePressed,
  useVibrate,
} from '@vueuse/core'
import { find, map, pick, pipe, range, sample } from 'remeda'
import { computed, onMounted, reactive, ref, useId, watch } from 'vue'

import { useLongPressTimings } from '../../composables/use-long-press-timings'

import { minecraftResource } from './constant'
import { eventKey } from './type'
import BlockLid from './wrapper-minecraft-block-lid.vue'

// #region Props
interface Props {
  /** 方塊種類。初始化後不可變更 */
  blockType?: BlockType;
  /** 初始化是否為挖掉的狀態 */
  isInitDug?: boolean;
}
// #endregion Props
const props = withDefaults(defineProps<Props>(), {
  blockType: 'dirt',
  isInitDug: false,
})

// #region Emits
const emit = defineEmits<{
  digging: [];
  dug: [];
  place: [];
}>()
// #endregion Emits

// #region Slots
defineSlots<{
  default?: () => unknown;
}>()
// #endregion Slots

const bus = useEventBus(eventKey)

/** 方塊 ID */
const id = useId()

const blockRef = ref<HTMLElement>()
const blockBounding = reactive(useElementBounding(blockRef))

/** 方塊是否被挖掉 */
const isDug = ref(props.isInitDug)
/** -1 ~ 9，-1 表示沒有裂痕 */
const destroyStage = ref(-1)
const { pressed: isPressed } = useMousePressed({ target: blockRef })

const cursorList: Array<{
  types: BlockType[];
  cursor: string;
}> = [{
  types: ['dirt', 'sand'],
  cursor: 'iron_shovel',
}, {
  types: ['stone'],
  cursor: 'iron_pickaxe',
}]
const cursor = computed(() => {
  if (isDug.value)
    return 'auto'

  const cursor = pipe(
    cursorList,
    find(({ types }) => types.includes(props.blockType)),
    (target) => target?.cursor,
  )
  if (!cursor)
    return 'crosshair'

  return `url('/minecraft/textures/item/${cursor}.png'), crosshair`
})

/** 目前方塊對應的資源 */
const resource = minecraftResource[props.blockType]

async function playRandomSound(paths: string[]) {
  const [path] = sample(paths, 1)
  new Audio(path).play()
}

const { vibrate } = useVibrate({ pattern: 100 })

const {
  pause: pauseSound,
  resume: playSound,
} = useIntervalFn(() => {
  if (isDug.value)
    return

  playRandomSound(resource.sound.dig)
}, 200, {
  immediate: false,
  immediateCallback: true,
})

watch(isPressed, (value) => {
  if (value)
    return

  destroyStage.value = -1
  pauseSound()

  bus.emit({
    type: 'dig',
    id,
    isActive: false,
  })
})

useLongPressTimings(blockRef, [
  // 按著 0.1s 才算開始挖
  {
    delay: 100,
    handler(event) {
      if (isDug.value)
        return

      event.preventDefault()

      playSound()
      emit('digging')
      bus.emit({
        type: 'dig',
        id,
        isActive: true,
      })
    },
  },
  /** 產生挖掘裂紋效果 */
  ...pipe(
    range(0, 10),
    map((stage) => ({
      delay: 100 + stage * 140,
      handler() {
        destroyStage.value = stage
      },
    })),
  ),
  // 1.5s 後挖掉方塊
  {
    delay: 1500,
    handler(event) {
      if (isDug.value)
        return

      event.preventDefault()

      emit('dug')
      bus.emit({
        type: 'dig',
        id,
        isActive: false,
      })

      isDug.value = true

      playRandomSound(resource.sound.break)
      vibrate()
    },
  },
], {
  distanceThreshold: 500,
})

function placeBlock() {
  if (!isDug.value)
    return

  emit('place')

  isDug.value = false

  playRandomSound(resource.sound.place)
}

onMounted(() => {
  bus.emit({
    type: 'add',
    id,
    blockType: props.blockType,
    visible: !isDug.value,
    ...pick(blockBounding, ['x', 'y', 'width', 'height']),
  })
})

/** 方塊更新資料 */
const updateData = computed<
  Extract<BusData, { type: 'update' }>
>(() => ({
  type: 'update',
  id,
  visible: !isDug.value,
  ...pick(blockBounding, ['x', 'y', 'width', 'height']),
}))

watch(updateData, (value) => {
  bus.emit(value)
}, { deep: true })
</script>

<style scoped lang="sass">
.mc-block
  cursor: v-bind(cursor)
</style>
