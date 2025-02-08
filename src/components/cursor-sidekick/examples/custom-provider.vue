<template>
  <div class="w-full flex flex-col gap-4 border border-gray-300 p-6">
    <cursor-sidekick
      v-if="enable"
      color="#35abf0"
      :hover-providers="hoverProviders"
      :select-providers="selectProviders"
    />

    <base-checkbox
      v-model="enable"
      label="啟用小跟班"
      class="border rounded p-4"
    />

    <div class="flex flex-col gap-2">
      <div class="">
        嘗試反白這段文字中有鱈魚的部分和沒有鱈魚的部分，看看有甚麼差別。
      </div>

      <hr>

      <base-btn
        disabled
        label="不可以色色 ('◉◞⊖◟◉` )"
      />

      <hr>

      <img
        src="/photography-ears-of-rice.jpg"
        url="https://www.flickr.com/photos/coodfish/albums/"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentProvider } from '../use-content-provider'
import { ref } from 'vue'
import BaseBtn from '../../base-btn.vue'
import BaseCheckbox from '../../base-checkbox.vue'
import CursorSidekick from '../cursor-sidekick.vue'

const enable = ref(false)

const hoverProviders: ContentProvider[] = [
  // hover 含有色色文字的按鈕時，提供色色傳送門
  {
    match(data) {
      if ('rect' in data)
        return false

      if (
        !(data instanceof HTMLButtonElement)
        && data?.getAttribute('role') !== 'button'
      ) {
        return false
      }

      return data.innerHTML.includes('色色')
    },
    getContent: () => ({
      btnList: [
        {
          label: '色色傳送門 (´,,•ω•,,)',
          onClick() {
            window.open(
              'https://raw.githubusercontent.com/tpai/dogedeck/main/cards/%E6%8A%97%E8%89%B2%E8%89%B2%E8%97%A5.png',
              '_blank',
            )
          },
        },
      ],
    }),
  },

  // 當圖片含有 url attr 時，提供開啟連結按鈕
  {
    match(data) {
      if ('rect' in data)
        return false

      if (data instanceof HTMLImageElement) {
        return true
      }

      return false
    },
    getContent(param) {
      const { element } = param
      const target = element?.value

      if (!(target instanceof HTMLImageElement))
        return

      const url = target.getAttribute('url')
      if (!url)
        return

      return {
        btnList: [
          {
            label: '📷 查看更多精彩照片',
            onClick() {
              window.open(url ?? '', '_blank')
            },
          },
        ],
      }
    },
  },
]

const selectProviders: ContentProvider[] = [
  // 選取文字包含鱈魚時，提供額外選單
  {
    match(data) {
      if (!('rect' in data))
        return false

      return data.text.includes('鱈魚')
    },
    getContent: () => ({
      text: '被你發現惹 ᕕ( ﾟ ∀。)ᕗ<br>歡迎來以下連結逛逛',
      class: ' text-nowrap ',
      btnList: [
        {
          label: '🎬 Youtube',
          onClick() {
            window.open('https://www.youtube.com/@codfish2140', '_blank')
          },
        },
        {
          label: '💡 CodePen',
          onClick() {
            window.open('https://codepen.io/Codfish2140', '_blank')
          },
        },
        {
          label: '✏️ 鱈魚的魚缸',
          onClick() {
            window.open('https://codlin.me/', '_blank')
          },
        },
      ],
    }),
  },
]
</script>
