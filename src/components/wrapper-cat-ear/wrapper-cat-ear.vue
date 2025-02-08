<template>
  <div
    ref="wrapperRef"
    class="wrapper-container"
  >
    <div class="ears-container">
      <ear-left
        class="ear ear-left"
        :style="leftEarStyle"
        v-bind="props"
      />
      <ear-right
        class="ear ear-right"
        :style="rightEarStyle"
        v-bind="props"
      />
    </div>
    <div class="content-container">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
// #region ActionName
// #endregion ActionName
</script>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { ActionName } from '.'
import { throttleFilter, useMouseInElement, useElementSize } from '@vueuse/core'
import { computed, ref, onMounted } from 'vue'
import EarLeft from './cat-ear-left.vue'
import EarRight from './cat-ear-right.vue'

// #region Props
interface Props {
  /** 目前動作 */
  action?: `${ActionName}`;
  /** 主要毛色 */
  mainColor?: string;
  /** 耳朵內部的顏色 */
  innerColor?: string;
}
// #endregion Props
const props = withDefaults(defineProps<Props>(), {
  action: 'relaxed',
  mainColor: '#E7E7E7',
  innerColor: '#fcfcfc',
})

// #region Emits
const emit = defineEmits<{
  'update:action': [value: Props['action']];
}>()
// #endregion Emits

const wrapperRef = ref<HTMLDivElement>()
const { width } = useElementSize(wrapperRef)

const earWidth = computed(() => Math.min(width.value / 4, 100))

const leftEarStyle = computed<CSSProperties>(() => ({
  width: `${earWidth.value}px`,
  transform: `translateY(${-earWidth.value / 2}px)`,
}))
const rightEarStyle = computed<CSSProperties>(() => ({
  width: `${earWidth.value}px`,
  transform: `translateY(${-earWidth.value / 2}px)`,
}))

// #region Methods
defineExpose({})
// #endregion Methods
</script>

<style scoped lang="sass">
.wrapper-container
  position: relative
  width: 100%
  min-height: 100vh
  overflow: visible

.ears-container
  position: absolute
  top: 0
  left: 0
  right: 0
  pointer-events: none
  z-index: 10

.ear
  position: absolute
  top: 0
  pointer-events: all
  z-index: 10

.ear-left
  right: 20%

.ear-right
  left: 20%

.content-container
  position: relative
  z-index: 20
  padding-top: 60px
</style>
