<template>
  <div class="w-full flex flex-wrap justify-center gap-4 p-6">
    <div class="flex flex-wrap justify-center gap-4">
      <wrapper-minecraft-block>
        <img
          src="/profile.webp"
          width="200"
          height="200"
          class="pointer-events-none select-none border rounded"
        >
      </wrapper-minecraft-block>

      <wrapper-minecraft-block block-type="sand">
        <img
          src="/profile-2.webp"
          width="200"
          height="200"
          class="pointer-events-none select-none border rounded"
        >
      </wrapper-minecraft-block>
    </div>

    <wrapper-minecraft-block block-type="stone">
      <img
        src="/painting-codfish-bakery.webp"
        width="420"
        height="260"
        class="pointer-events-none select-none border rounded"
      >
    </wrapper-minecraft-block>

    <!-- 必須放置一個 world 元件 -->
    <wrapper-minecraft-world />
  </div>
</template>

<script setup lang="ts">
import WrapperMinecraftBlock from '../wrapper-minecraft-block.vue'
import WrapperMinecraftWorld from '../wrapper-minecraft-world.vue'
</script>
