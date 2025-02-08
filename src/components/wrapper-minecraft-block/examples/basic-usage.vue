<template>
  <div class="w-full flex flex-col items-center gap-14 border border-gray-300 p-6">
    <wrapper-minecraft-block class="w-1/2">
      <div class="select-none border py-20 text-center">
        其實我是方塊 (´,,•ω•,,)
      </div>
    </wrapper-minecraft-block>

    <!-- 必須放置一個 world 元件 -->
    <wrapper-minecraft-world />
  </div>
</template>

<script setup lang="ts">
import WrapperMinecraftBlock from '../wrapper-minecraft-block.vue'
import WrapperMinecraftWorld from '../wrapper-minecraft-world.vue'
</script>
