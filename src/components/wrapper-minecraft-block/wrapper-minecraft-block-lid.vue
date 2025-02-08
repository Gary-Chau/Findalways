<template>
  <div class="lid object-cover">
    <!-- 預下載紋理，以免切換時閃爍 -->
    <div class="hidden">
      <img
        v-for="img in imgs"
        :key="img"
        :src="img"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { map, pipe, range } from 'remeda'
import { computed } from 'vue'

interface Props {
  /** -1 ~ 9，-1 表示沒有裂痕 */
  stage: number;
}
const props = withDefaults(defineProps<Props>(), {})

const imgs = pipe(
  range(0, 10),
  map((stage) => `/minecraft/textures/block/destroy_stage_${stage}.png`),
)

const image = computed(() => {
  if (props.stage < 0)
    return ''
  return `url('/minecraft/textures/block/destroy_stage_${props.stage}.png')`
})
</script>

<style scoped lang="sass">
.lid
  image-rendering: pixelated
  background-image: v-bind(image)
  background-position: center
  background-size: 100%
</style>
