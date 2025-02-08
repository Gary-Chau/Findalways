<template>
  <div class="h-[50vh] w-full flex flex-col items-center justify-center gap-16 border border-gray-300">
    <wrapper-cat-ear
      :action="action"
      main-color="#999"
    >
      <div class="border-2 border-[#999] rounded">
        <select
          v-model="action"
          class="p-2"
        >
          <option
            v-for="option in options"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>
    </wrapper-cat-ear>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ActionName } from '..'
import WrapperCatEar from '../wrapper-cat-ear.vue'

const action = ref<`${ActionName}`>('relaxed')
const options = Object.values(ActionName)
</script>
