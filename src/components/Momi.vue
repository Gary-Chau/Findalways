<template>
  <div :class="['container', { 'dark-mode': darkMode }]">
    <wrapper-cat-ear
      :action="catEarAction"
      :main-color="catEarMainColor"
      :inner-color="catEarInnerColor"
    >
      <div class="content-wrapper">
        <div class="cursor-sidekick-container">
          <cursor-sidekick
            :size="48"
            color="#4299e1"
            :max-velocity="2"
            :z-index="100"
            :active-providers="activeProviders"
            :hover-providers="hoverProviders"
            :select-providers="selectProviders"
          />
        </div>

        <transition name="rotate">
          <div 
            class="theme-toggle" 
            @click="darkMode = !darkMode"
          >
            {{ darkMode ? '🌞' : '🌙' }}
          </div>
        </transition>

        <div v-if="showPreview" class="preview-modal">
          <div class="preview-content">
            <h3>檔案預覽 <i class="fas fa-table"></i></h3>
            <table>
              <tbody>
                <tr v-for="(row, i) in previewData" :key="i">
                  <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
            <button 
              class="close-preview"
              @click="showPreview = false"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <button
          class="preview-btn"
          @click="handlePreview"
          :disabled="!fileInput?.files?.length"
        >
          <i class="fas fa-eye"></i>
          預覽檔案
        </button>

        <div 
          :class="['drop-zone', { active: dragActive }]"
          @dragenter="handleDrag"
          @dragleave="handleDrag"
          @dragover="handleDrag"
          @drop="handleDrop"
        >
          <div class="input-group">
            <label>
              <i class="fas fa-file-excel button-icon"></i>
              選擇 Excel 檔案
            </label>
            <input 
              type="file" 
              ref="fileInput"
              accept=".xlsx, .xls"
              @change="clearFileError"
            />
            <div v-if="errors.file" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.file }}
            </div>
          </div>
        </div>

        <div class="input-group">
          <label>
            <i class="fas fa-sort-numeric-down button-icon"></i>
            起始數字
          </label>
          <input
            type="number"
            v-model="startNumber"
            @input="clearStartNumberError"
            placeholder="請輸入起始數字"
          />
          <div v-if="errors.startNumber" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.startNumber }}
          </div>
        </div>

        <div class="input-group">
          <label>
            <i class="fas fa-arrows-alt-v button-icon"></i>
            偏移值
          </label>
          <input
            type="number"
            v-model="offset"
            @input="clearOffsetError"
            placeholder="請輸入偏移值"
          />
          <div v-if="errors.offset" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.offset }}
          </div>
        </div>

        <button 
          class="process-btn" 
          @click="handleProcess" 
          :disabled="loading"
        >
          <i :class="['fas', loading ? 'fa-spinner fa-spin' : 'fa-file-import', 'button-icon']"></i>
          {{ loading ? '處理中...' : '處理檔案' }}
        </button>

        <div v-if="loading" class="progress-bar">
          <div 
            class="progress-bar-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div v-if="successMessage" class="success-message">
          <i class="fas fa-party-horn"></i>
          {{ successMessage }}
          <span class="celebrate-emoji">🎉</span>
        </div>

        <div v-if="formattedData.length > 0" ref="output">
          <div class="output-header">
            <h3>
              <i class="fas fa-file-alt button-icon"></i>
              處理結果
            </h3>
            <button 
              class="copy-btn"
              @click="handleCopyToClipboard"
              title="複製到剪貼板"
            >
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="output">
            <div v-for="(entry, index) in formattedData" :key="index" class="output-entry">
              <pre>{{ entry.text }}</pre>
              <div v-if="entry.photoLink" class="photo-indicator">
                <span class="photo-indicator-text">
                  照片連結: 
                  <a :href="entry.photoLink" target="_blank" rel="noopener noreferrer">
                    {{ entry.photoLink }}
                  </a>
                </span>
              </div>
            </div>
          </div>
          <button class="download-btn" @click="handleDownload">
            <i class="fas fa-download button-icon"></i>
            下載檔案
          </button>
        </div>

        <div 
          class="virtual-pet"
          :style="{
            left: `${petPosition.x}px`,
            top: `${petPosition.y}px`,
          }"
          @click="handlePetInteraction"
        >
          <span role="img" aria-label="pet">
            {{ getPetEmoji }}
          </span>
          <div class="pet-message">Click me!</div>
        </div>
      </div>
    </wrapper-cat-ear>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import confetti from 'canvas-confetti'
import CursorSidekick from './cursor-sidekick/cursor-sidekick.vue'
import WrapperCatEar from './wrapper-cat-ear/wrapper-cat-ear.vue'
import { ActionName } from './wrapper-cat-ear'

export default {
  name: 'Momi',
  components: {
    CursorSidekick,
    WrapperCatEar
  },
  setup() {
    // State
    const formattedData = ref([])
    const startNumber = ref('')
    const offset = ref('')
    const loading = ref(false)
    const errors = ref({})
    const successMessage = ref('')
    const dragActive = ref(false)
    const progress = ref(0)
    const fileInput = ref(null)
    const output = ref(null)
    const darkMode = ref(false)
    const showPreview = ref(false)
    const previewData = ref([])
    const petPosition = ref({ x: window.innerWidth - 100, y: 100 })
    const petMood = ref('happy')
    const bounce = ref(false)
    const catEarMainColor = ref('#4299e1')  // Tailwind blue-500
    const catEarInnerColor = ref('#63b3ed')  // Tailwind blue-400
    const catEarAction = ref(ActionName.RELAXED)

    // Update the providers with more specific interactions
    const activeProviders = [
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('process-btn') && !el.disabled
        },
        getContent: () => ({
          text: '點擊處理檔案',
          class: 'bg-white'
        })
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('download-btn')
        },
        getContent: () => ({
          text: '點擊下載檔案',
          class: 'bg-white'
        })
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('preview-btn') && !el.disabled
        },
        getContent: () => ({
          text: '預覽 Excel 內容',
          class: 'bg-white'
        })
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('copy-btn')
        },
        getContent: () => ({
          text: '複製到剪貼板',
          class: 'bg-white'
        })
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('theme-toggle')
        },
        getContent: () => ({
          text: '切換深色模式',
          class: 'bg-white'
        })
      }
    ]

    const hoverProviders = [
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('drop-zone')
        },
        getContent: () => {
          if (!dragActive.value) {
            return {
              btnList: [
                {
                  label: '點擊選擇檔案',
                  onClick: () => {
                    fileInput.value?.click()
                  }
                }
              ],
              class: 'bg-white'
            }
          }
          return {
            text: '拖放 Excel 檔案到這裡',
            class: 'bg-white'
          }
        }
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('input-group') && 
                 el.querySelector('input[type="number"]')
        },
        getContent: ({ element }) => {
          if (!element?.value) return
          const isStartNumber = element.value.querySelector('input')?.placeholder.includes('起始')
          return {
            text: isStartNumber ? 
              '輸入要開始的編號' : 
              '輸入要偏移的行數',
            class: 'bg-white'
          }
        }
      },
      {
        match: (el) => {
          if (!(el instanceof HTMLElement)) return false
          return el.classList.contains('output-entry')
        },
        getContent: () => ({
          text: '處理結果預覽',
          class: 'bg-white'
        })
      }
    ]

    const selectProviders = [
      {
        match: ({ text }) => Boolean(text?.length),
        getContent: ({ selectionState }) => ({
          text: `已選取 ${selectionState?.text?.length || 0} 個字元`,
          btnList: [
            {
              label: '複製選取文字',
              onClick: async () => {
                try {
                  if (!selectionState?.text) return
                  await navigator.clipboard.writeText(selectionState.text)
                  successMessage.value = '已複製選取的文字！'
                  setTimeout(() => successMessage.value = '', 3000)
                } catch (err) {
                  errors.value = { clipboard: '複製失敗，請手動複製。' }
                }
              }
            }
          ],
          class: 'bg-white'
        })
      }
    ]

    // Computed properties
    const getPetEmoji = computed(() => {
      switch (petMood.value) {
        case 'happy': return '🐶'
        case 'surprised': return '😲'
        case 'excited': return '🐾'
        default: return '🐶'
      }
    })

    // Methods
    const validateInputs = () => {
      const newErrors = {}
      if (!fileInput.value?.files?.length) {
        newErrors.file = '請選擇一個 Excel 檔案。'
      }
      if (!startNumber.value || isNaN(startNumber.value)) {
        newErrors.startNumber = '請輸入有效的起始數字。'
      }
      if (!offset.value || isNaN(offset.value)) {
        newErrors.offset = '請輸入有效的偏移值。'
      }
      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    const handleDrag = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        dragActive.value = true
      } else if (e.type === "dragleave") {
        dragActive.value = false
      }
    }

    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragActive.value = false
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          fileInput.value.files = e.dataTransfer.files
          errors.value = { ...errors.value, file: '' }
        } else {
          errors.value = { ...errors.value, file: '請上傳 Excel 檔案 (.xlsx 或 .xls)' }
        }
      }
    }

    const readFile = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (error) => reject(error)
        reader.readAsArrayBuffer(file)
      })
    }

    const handleProcess = async () => {
      if (!validateInputs()) return

      loading.value = true
      successMessage.value = ''
      progress.value = 0
      
      // Change ear color and action when processing starts
      catEarMainColor.value = '#f56565' // Tailwind red-500
      catEarInnerColor.value = '#fc8181' // Tailwind red-400
      catEarAction.value = ActionName.DISPLEASED

      try {
        const file = fileInput.value.files[0]
        const data = await readFile(file)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        const startRowIndex = parseInt(startNumber.value) + parseInt(offset.value) - 1
        if (startRowIndex >= jsonData.length) {
          errors.value = { file: `起始數字加偏移值指向的行（第 ${startRowIndex + 1} 行）超出範圍。` }
          return
        }

        const newFormattedData = []
        for (let i = 0; i < jsonData.length - startRowIndex; i++) {
          const row = jsonData[i + startRowIndex]
          if (!row) continue

          const currentNumber = parseInt(startNumber.value) + i
          let entry = `第${currentNumber}位投稿人嚟啦～\n\n`
          entry += `名字：${row[1] || 'N/A'}\n`
          entry += `年齡：${row[2] || 'N/A'}\n`
          entry += `身高：${row[3] || 'N/A'}\n\n`
          entry += `描述自已：${row[4] || 'N/A'}\n\n`
          entry += `要求：${row[5] || 'N/A'}\n\n`
          entry += `聯絡方式：${row[6] || 'N/A'}\n\n`

          if (row[7]) {
            entry += `照片連結：${row[7]}\n\n`
          }

          entry += '如果有緣人想認識無留tg既投稿人，可以dm平台的！🙊🙊🙊🙊🙊\n'
          entry += '投稿link係主頁🧨大家隨意投稿🎐\n\n'

          newFormattedData.push({ text: entry, hasPhoto: !!row[7], photoLink: row[7] || null })
        }

        formattedData.value = newFormattedData
        successMessage.value = '處理完成！您現在可以下載檔案。'
        
        // Change ear color and action on success
        catEarMainColor.value = '#48bb78' // Tailwind green-500
        catEarInnerColor.value = '#68d391' // Tailwind green-400
        catEarAction.value = ActionName.PEEKABOO
        
        setTimeout(() => {
          // Reset ear color and action after success
          catEarMainColor.value = '#4299e1'
          catEarInnerColor.value = '#63b3ed'
          catEarAction.value = ActionName.RELAXED
        }, 2000)

        runFireworks()
        
        if (output.value) {
          output.value.scrollIntoView({ behavior: 'smooth' })
        }
      } catch (error) {
        errors.value = { file: '處理過程中出現錯誤，請檢查您的 Excel 檔案格式。' }
        
        // Change ear color and action on error
        catEarMainColor.value = '#f56565'
        catEarInnerColor.value = '#fc8181'
        catEarAction.value = ActionName.FEAR
        
        setTimeout(() => {
          // Reset ear color and action after error
          catEarMainColor.value = '#4299e1'
          catEarInnerColor.value = '#63b3ed'
          catEarAction.value = ActionName.RELAXED
        }, 2000)
      } finally {
        loading.value = false
      }
    }

    const handleDownload = () => {
      const text = formattedData.value.map(entry => entry.text).join('\n\n------------------------\n\n')
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'formatted_data.txt'
      link.click()
      URL.revokeObjectURL(link.href)

      successMessage.value = '檔案已成功下載！'
      setTimeout(() => successMessage.value = '', 3000)
      runFireworks()
    }

    const handleCopyToClipboard = async () => {
      const text = formattedData.value.map(entry => entry.text).join('\n\n------------------------\n\n')
      try {
        await navigator.clipboard.writeText(text)
        successMessage.value = '已複製到剪貼板！'
        setTimeout(() => successMessage.value = '', 3000)
      } catch (err) {
        errors.value = { clipboard: '複製失敗，請手動複製。' }
      }
    }

    const handlePreview = async () => {
      if (!fileInput.value?.files?.length) return
      const file = fileInput.value.files[0]
      const data = await readFile(file)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      previewData.value = jsonData.slice(0, 5)
      showPreview.value = true
    }

    const runFireworks = () => {
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#4299e1', '#48bb78', '#f6e05e', '#f56565'],
        particleCount: 50,
        spread: 100
      }

      confetti({ ...defaults, angle: 60 })
      confetti({ ...defaults, angle: 120 })
      
      for (let i = 0; i < count; i++) {
        confetti({
          ...defaults,
          particleCount: 1,
          startVelocity: 0,
          gravity: 0.3 - (Math.random() * 0.1),
          ticks: 200 + (Math.random() * 50)
        })
      }
    }

    const handlePetInteraction = () => {
      bounce.value = true
      setTimeout(() => bounce.value = false, 1000)
      runFireworks()
      petMood.value = ['happy', 'surprised', 'excited'][Math.floor(Math.random() * 3)]
      catEarAction.value = ActionName.SHAKE
      setTimeout(() => {
        catEarAction.value = ActionName.RELAXED
      }, 2000)
    }

    const clearFileError = () => {
      errors.value = { ...errors.value, file: '' }
    }

    const clearStartNumberError = () => {
      errors.value = { ...errors.value, startNumber: '' }
    }

    const clearOffsetError = () => {
      errors.value = { ...errors.value, offset: '' }
    }

    // Progress bar effect
    watch(loading, (newValue) => {
      if (newValue) {
        const interval = setInterval(() => {
          progress.value = Math.min(progress.value + 10, 90)
        }, 200)
        return () => clearInterval(interval)
      } else {
        progress.value = 100
      }
    })

    // Update cat ear action based on different states
    watch(dragActive, (isDragging) => {
      if (isDragging) {
        catEarMainColor.value = '#ecc94b' // Tailwind yellow-500
        catEarInnerColor.value = '#f6e05e' // Tailwind yellow-400
        catEarAction.value = ActionName.FEAR
      } else {
        catEarMainColor.value = '#4299e1'
        catEarInnerColor.value = '#63b3ed'
        catEarAction.value = ActionName.RELAXED
      }
    })

    watch(successMessage, (message) => {
      if (message) {
        catEarAction.value = ActionName.PEEKABOO
        setTimeout(() => {
          catEarAction.value = ActionName.RELAXED
        }, 2000)
      }
    })

    return {
      formattedData,
      startNumber,
      offset,
      loading,
      errors,
      successMessage,
      dragActive,
      progress,
      fileInput,
      output,
      darkMode,
      showPreview,
      previewData,
      petPosition,
      petMood,
      bounce,
      getPetEmoji,
      handleDrag,
      handleDrop,
      handleProcess,
      handleDownload,
      handleCopyToClipboard,
      handlePreview,
      handlePetInteraction,
      clearFileError,
      clearStartNumberError,
      clearOffsetError,
      activeProviders,
      hoverProviders,
      selectProviders,
      catEarAction,
      catEarMainColor,
      catEarInnerColor,
    }
  }
}
</script>

<style src="./Momi.css"></style>
<style scoped>
.rotate-enter-active,
.rotate-leave-active {
  transition: transform 0.3s ease;
}

.rotate-enter-from,
.rotate-leave-to {
  transform: rotate(360deg);
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 30; /* Higher than content and ears */
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.theme-toggle:hover {
  transform: rotate(360deg);
}

.virtual-pet {
  transition: transform 0.3s ease;
}

.virtual-pet:hover {
  transform: translateY(-20px);
}

.process-btn,
.download-btn {
  transition: transform 0.3s ease;
}

.process-btn:hover,
.download-btn:hover {
  transform: translateY(-2px);
}

.cursor-sidekick-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1000;
}

:deep(.sidekick) {
  pointer-events: none;
}

:deep(.tooltip) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  pointer-events: all;
  z-index: 1001;
}

:deep(.tooltip-btn) {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
  width: 100%;
}

:deep(.tooltip-btn:hover) {
  background: #3182ce;
}

/* Add styles for cat ears */
:deep(.ear) {
  transition: transform 0.3s ease;
  pointer-events: all;
}

:deep(.ear:hover) {
  transform: scale(1.1) translateY(-50%) !important;
}

.content-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
}
</style> 