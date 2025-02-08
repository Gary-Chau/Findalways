<template>
  <div class="w-full flex flex-col items-center justify-center gap-16 border border-gray-300 py-16">
    <wrapper-cat-ear main-color="#AAA">
      <base-btn
        class=""
        label="按鈕"
      />
    </wrapper-cat-ear>

    <wrapper-cat-ear main-color="#AAA">
      <div class="">
        <img
          class="w-80 rounded"
          src="/codfish.webp"
        >
      </div>
    </wrapper-cat-ear>

    <wrapper-cat-ear main-color="#AAA">
      <div class="border border-[#AAA] rounded">
        <select class="px-10 py-2">
          <option
            disabled
            selected
            label="請選擇貓貓"
          />
          <option label="(>'-'<)ノ" />
          <option label="~(=^‥^)" />
          <option label="/ᐠ｡ꞈ｡ᐟ\" />
          <option label="(^._.^)ﾉ" />
          <option label="(^・ω・^ )" />
        </select>
      </div>
    </wrapper-cat-ear>
  </div>
</template>

<script setup lang="ts">
import BaseBtn from '../../base-btn.vue'
import WrapperCatEar from '../wrapper-cat-ear.vue'
</script>
