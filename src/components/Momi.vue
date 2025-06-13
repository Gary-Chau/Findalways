<template>
  <div :class="['app-container', { 'dark-mode': darkMode }]">
    <wrapper-cat-ear
      :action="catEarAction"
      :main-color="catEarMainColor"
      :inner-color="catEarInnerColor"
    >
      <!-- Cursor Sidekick -->
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

      <!-- Theme Toggle -->
      <transition name="rotate">
        <div class="theme-toggle" @click="darkMode = !darkMode">
          {{ darkMode ? '🌞' : '🌙' }}
        </div>
      </transition>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-content">
            <h1 class="main-title">
              <span class="title-icon">💝</span>
              Excel 處理小精靈
              <span class="title-icon">✨</span>
            </h1>
                         <p class="subtitle">
               Momi Excel Processor
             </p>
          </div>
        </div>

        <!-- Upload Section -->
        <div class="section-card upload-section">
          <div class="section-header">
            <h2>
              <span class="section-icon">📁</span>
              上傳檔案
            </h2>
            <p class="section-desc">選擇你的Excel檔案開始處理吧～</p>
          </div>
          
          <div 
            :class="['drop-zone', { 'drop-active': dragActive }]"
            @dragenter="handleDrag"
            @dragleave="handleDrag"
            @dragover="handleDrag"
            @drop="handleDrop"
          >
            <div class="drop-zone-content">
              <div class="drop-icon">📤</div>
              <div class="drop-text">
                <span v-if="dragActive" class="drag-active-text">
                  放開來上傳檔案 🎯
                </span>
                <span v-else>
                  拖拽Excel檔案到這裡<br>
                  或者點擊選擇檔案
                </span>
              </div>
              <input 
                type="file" 
                ref="fileInput"
                accept=".xlsx,.xls"
                @change="handleFileChange"
                class="file-input"
              />
              <button class="browse-btn" @click="fileInput?.click()">
                <i class="fas fa-file-excel"></i>
                選擇檔案
              </button>
            </div>
            <div v-if="errors.file" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.file }}
            </div>
            
            <div v-if="selectedFileName" class="file-selected-indicator">
              <i class="fas fa-check-circle"></i>
              已選擇: {{ selectedFileName }}
            </div>
          </div>

          <button
            class="preview-btn"
            @click="handlePreview"
            :disabled="!fileInput?.files?.length"
          >
            <i class="fas fa-eye"></i>
            預覽檔案內容
          </button>
        </div>

        <!-- Settings Section -->
        <div class="section-card settings-section">
          <div class="section-header">
            <h2>
              <span class="section-icon">⚙️</span>
              處理設定
            </h2>
            <p class="section-desc">設定你的處理參數</p>
          </div>
          
          <div class="settings-grid">
            <div class="input-card">
              <label class="input-label">
                <span class="label-icon">🔢</span>
                起始數字
              </label>
              <input
                type="number"
                v-model="startNumber"
                @input="clearStartNumberError"
                placeholder="請輸入起始數字"
                class="cute-input"
              />
              <div v-if="errors.startNumber" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.startNumber }}
              </div>
            </div>
            
            <div class="input-card">
              <label class="input-label">
                <span class="label-icon">📏</span>
                偏移值
              </label>
              <input
                type="number"
                v-model="offset"
                @input="clearOffsetError"
                placeholder="請輸入偏移值"
                class="cute-input"
              />
              <div v-if="errors.offset" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.offset }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Section -->
        <div class="section-card action-section">
          <button 
            class="process-btn" 
            @click="handleProcess" 
            :disabled="loading"
          >
            <span class="btn-content">
              <i :class="['btn-icon', loading ? 'fas fa-spinner fa-spin' : 'fas fa-magic']"></i>
              <span class="btn-text">{{ loading ? '處理中...' : '開始處理' }}</span>
            </span>
          </button>

          <div v-if="loading" class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ progress }}%</div>
          </div>
        </div>

        <!-- Success Message -->
        <transition name="bounce">
          <div v-if="successMessage" class="success-card">
            <div class="success-content">
              <i class="fas fa-check-circle success-icon"></i>
              <span class="success-text">{{ successMessage }}</span>
              <span class="success-emoji">🎉</span>
            </div>
          </div>
        </transition>

        <!-- Results Section -->
        <transition name="slide-up">
          <div v-if="formattedData.length > 0" class="section-card results-section" ref="output">
            <div class="section-header">
              <h2>
                <span class="section-icon">📋</span>
                處理結果
              </h2>
              <div class="result-actions">
                <button class="action-btn copy-btn" @click="handleCopyToClipboard">
                  <i class="fas fa-copy"></i>
                  複製全部
                </button>
                <button class="action-btn download-btn" @click="handleDownload">
                  <i class="fas fa-download"></i>
                  下載檔案
                </button>
              </div>
            </div>
            
            <div class="results-container">
              <div v-for="(entry, index) in formattedData" :key="index" class="result-card">
                <div class="result-header">
                  <span class="result-number">第{{ parseInt(startNumber) + index }}位</span>
                  <div class="result-badges">
                    <span v-if="entry.hasPhoto" class="badge photo-badge">
                      <i class="fas fa-camera"></i>
                      有照片
                    </span>
                  </div>
                </div>
                
                <div class="result-content">
                  <pre class="result-text">{{ entry.text }}</pre>
                </div>
                
                <!-- Contact Type Indicator -->
                <div v-if="entry.hasTG || entry.hasIG || entry.hasUnidentifiedContact" class="indicator-card contact-indicator">
                  <div class="indicator-header">
                    <i class="fas fa-address-book"></i>
                    聯絡類型
                  </div>
                  <div class="indicator-content">
                    <span v-if="entry.hasTG && entry.hasIG" class="contact-badge both">
                      <i class="fas fa-check-circle"></i>
                      TG + IG
                    </span>
                    <span v-else-if="entry.hasTG" class="contact-badge telegram">
                      <i class="fab fa-telegram"></i>
                      Telegram
                    </span>
                    <span v-else-if="entry.hasIG" class="contact-badge instagram">
                      <i class="fab fa-instagram"></i>
                      Instagram
                    </span>
                    <span v-if="entry.hasUnidentifiedContact" class="contact-badge unidentified">
                      <i class="fas fa-question-circle"></i>
                      待確認
                    </span>
                  </div>
                </div>
                
                <!-- Post Threads Indicator -->
                <div v-if="entry.needPostThreads !== undefined" class="indicator-card threads-indicator">
                  <div class="indicator-header">
                    <i class="fas fa-layer-group"></i>
                    Threads發布
                  </div>
                  <div class="indicator-content">
                    <span :class="['post-badge', entry.needPostThreads ? 'need' : 'dont-need']">
                      <i :class="['fas', entry.needPostThreads ? 'fa-check' : 'fa-times']"></i>
                      {{ entry.needPostThreads ? '需要' : '不需要' }}
                    </span>
                  </div>
                </div>
                
                <!-- Post IG Indicator -->
                <div v-if="entry.needPostIG !== undefined" class="indicator-card ig-indicator">
                  <div class="indicator-header">
                    <i class="fab fa-instagram"></i>
                    IG發布
                  </div>
                  <div class="indicator-content">
                    <span :class="['post-badge', entry.needPostIG ? 'need' : 'dont-need']">
                      <i :class="['fas', entry.needPostIG ? 'fa-check' : 'fa-times']"></i>
                      {{ entry.needPostIG ? '需要' : '不需要' }}
                    </span>
                  </div>
                </div>
                
                <!-- Photo Link -->
                <div v-if="entry.photoLink" class="indicator-card photo-indicator">
                  <div class="indicator-header">
                    <i class="fas fa-image"></i>
                    照片連結
                  </div>
                  <div class="indicator-content">
                    <a :href="entry.photoLink" target="_blank" rel="noopener noreferrer" class="photo-link">
                      <i class="fas fa-external-link-alt"></i>
                      查看照片
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Preview Modal -->
        <transition name="modal">
          <div v-if="showPreview" class="modal-overlay" @click="showPreview = false">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h3>
                  <i class="fas fa-table"></i>
                  檔案預覽
                </h3>
                <button class="modal-close" @click="showPreview = false">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div class="preview-table-container">
                  <table class="preview-table">
                    <tbody>
                      <tr v-for="(row, i) in previewData" :key="i">
                        <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Virtual Pet -->
        <div 
          class="virtual-pet"
          :style="{
            left: `${petPosition.x}px`,
            top: `${petPosition.y}px`,
          }"
          @click="handlePetInteraction"
        >
          <div class="pet-container">
            <span class="pet-emoji">{{ getPetEmoji }}</span>
            <div class="pet-message">點我！</div>
          </div>
        </div>

        <!-- Minecraft Section -->
        <div class="footer-section">
          <button class="minecraft-btn" @click="handleMinecraftClick">
            <i class="fas fa-cube"></i>
            <span>Play Minecraft</span>
          </button>
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
import { MC_SERVER_URL } from '../config'

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
    const selectedFileName = ref('')

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
      
      const startNum = parseInt(startNumber.value)
      // Allow empty offset, default to 0
      const offsetNum = offset.value === '' ? 0 : parseInt(offset.value)
      
      if (!startNumber.value || isNaN(startNum) || startNum < 1) {
        newErrors.startNumber = '請輸入有效的起始數字（必須大於0）。'
      }
      if (offset.value !== '' && (isNaN(offsetNum) || offsetNum < 0)) {
        newErrors.offset = '請輸入有效的偏移值（必須大於等於0）。'
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
          selectedFileName.value = file.name
          errors.value = { ...errors.value, file: '' }
        } else {
          errors.value = { ...errors.value, file: '請上傳 Excel 檔案 (.xlsx 或 .xls)' }
          selectedFileName.value = ''
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

        const startNum = parseInt(startNumber.value)
        // Allow empty offset, default to 0
        const offsetNum = offset.value === '' ? 0 : parseInt(offset.value)
        // Skip header row (row 0) and add offset
        const startRowIndex = 1 + offsetNum
        
        console.log('Debug:', { startNum, offsetNum, startRowIndex, totalRows: jsonData.length })
        
        if (isNaN(startRowIndex) || startRowIndex < 0) {
          errors.value = { file: '起始數字和偏移值計算錯誤，請檢查輸入值。' }
          return
        }
        if (startRowIndex >= jsonData.length) {
          errors.value = { file: `起始數字加偏移值指向的行（第 ${startRowIndex + 1} 行）超出範圍。檔案總共有 ${jsonData.length} 行數據。` }
          return
        }

        const newFormattedData = []
        for (let i = 0; i < jsonData.length - startRowIndex; i++) {
          const row = jsonData[i + startRowIndex]
          if (!row) continue

          const currentNumber = parseInt(startNumber.value) + i
          let entry = `第${currentNumber}位投稿人嚟啦～\n\n`
          entry += `名字：${row[1] || 'N/A'}\n`
          entry += `性別：${row[2] || 'N/A'}\n`
          entry += `年齡：${row[3] || 'N/A'}\n`
          entry += `身高：${row[4] || 'N/A'}\n\n`
          entry += `描述自已：${row[5] || 'N/A'}\n\n`
          entry += `要求：${row[6] || 'N/A'}\n\n`
          
          // Process contact information
          const contactInfo = row[7] || 'N/A'
          let hasTG = false
          let hasIG = false
          let hasUnidentifiedContact = false
          
          // Check for TG/Telegram references
          if (/tg|telegram|@/i.test(contactInfo)) {
            hasTG = true
          }
          
          // Check for IG/Instagram references
          if (/ig|instagram|https:\/\/www\.instagram\.com/i.test(contactInfo)) {
            hasIG = true
          }
          
          // Check if there's contact info but not recognized as TG or IG
          if (contactInfo !== 'N/A' && !hasTG && !hasIG) {
            hasUnidentifiedContact = true
          }
          
          entry += `聯絡方式：${contactInfo}\n\n`
          
          // Get actual photo link data (not header)
          const photoLink = row[8] && row[8] !== '照片連結' ? row[8] : null
          
          // Add photo link if available and not a header
          if (photoLink) {
            entry += `照片連結：${photoLink}\n\n`
          }
          
          // Check row 9: Need to post Threads?
          const needPostThreads = row[9] === '需要' ? true : false
          
          // Check row 10: Need to post IG?
          const needPostIG = row[10] === '需要' ? true : false
          
          entry += '如果有緣人想認識無留tg既投稿人，可以dm平台的！🙊🙊🙊🙊🙊\n'
          entry += '若想投稿歡迎填form💕 有任何問題、無聊都歡迎搵平台詢問傾計呀～！🥰✨\n'
          entry += '投稿link係主頁🧨大家隨意投稿🎐\n\n'

          newFormattedData.push({ 
            text: entry, 
            hasPhoto: !!photoLink, 
            photoLink: photoLink,
            hasTG: hasTG,
            hasIG: hasIG,
            hasUnidentifiedContact: hasUnidentifiedContact,
            contactInfo: contactInfo,
            needPostThreads: needPostThreads,
            needPostIG: needPostIG
          })
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

    const handleFileChange = (e) => {
      const file = e.target.files[0]
      if (file) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          errors.value = { ...errors.value, file: '' }
          selectedFileName.value = file.name
          console.log('File selected:', file.name)
        } else {
          errors.value = { ...errors.value, file: '請上傳 Excel 檔案 (.xlsx 或 .xls)' }
          selectedFileName.value = ''
        }
      } else {
        selectedFileName.value = ''
      }
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

    const handleMinecraftClick = () => {
      window.open('https://gary-chau.github.io/Findalways-MC', '_blank')
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
      handleFileChange,
      clearFileError,
      clearStartNumberError,
      clearOffsetError,
      activeProviders,
      hoverProviders,
      selectProviders,
      catEarAction,
      catEarMainColor,
      catEarInnerColor,
      handleMinecraftClick,
      selectedFileName
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

.minecraft-btn {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.minecraft-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.post-threads-indicator, .post-ig-indicator, .photo-indicator {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.post-threads-indicator {
  background: linear-gradient(135deg, rgba(247, 235, 255, 0.9), rgba(237, 224, 250, 0.9));
  border-left-color: #9f7aea; /* Purple for threads */
}

.post-ig-indicator {
  background: linear-gradient(135deg, rgba(237, 242, 247, 0.9), rgba(226, 232, 240, 0.9));
  border-left-color: #805ad5; /* Purple */
}

.photo-indicator {
  background: linear-gradient(135deg, rgba(240, 255, 244, 0.9), rgba(226, 245, 232, 0.9));
  border-left-color: #48bb78; /* Green */
}

.post-threads-indicator:hover, .post-ig-indicator:hover, .photo-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.post-threads-indicator-text::before {
  content: "🧵 ";
  margin-right: 3px;
}

.post-indicator-text::before {
  content: "📱 ";
  margin-right: 3px;
}

.photo-indicator-text::before {
  content: "📷 ";
  margin-right: 3px;
}

.post-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 8px;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.post-badge:hover {
  transform: scale(1.05);
}

.post-badge.need {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.post-badge.dont-need {
  background: linear-gradient(135deg, #fc8181, #f56565);
  color: white;
}

.photo-indicator a {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #38b2ac, #319795);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  white-space: nowrap;
}

.photo-indicator a:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

/* Dark mode adjustments */
.dark-mode .post-threads-indicator {
  background: linear-gradient(135deg, rgba(53, 44, 72, 0.9), rgba(30, 26, 44, 0.9));
  color: #e2e8f0;
}

.dark-mode .post-ig-indicator {
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.9), rgba(26, 32, 44, 0.9));
  color: #e2e8f0;
}

.dark-mode .photo-indicator {
  background: linear-gradient(135deg, rgba(40, 54, 47, 0.9), rgba(25, 34, 30, 0.9));
  color: #e2e8f0;
}

.dark-mode .photo-indicator a {
  background: linear-gradient(135deg, #2c7a7b, #285e61);
  color: white;
}

/* Make contact indicators match the new style */
.contact-indicator {
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(255, 244, 230, 0.9), rgba(254, 235, 200, 0.9));
  border-radius: 10px;
  font-size: 0.95rem;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #ed8936; /* Orange */
}

.contact-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.contact-indicator-text::before {
  content: "📲 ";
  margin-right: 3px;
}

.dark-mode .contact-indicator {
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.9), rgba(26, 32, 44, 0.9));
  color: #e2e8f0;
}

.contact-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 8px;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.contact-badge:hover {
  transform: scale(1.05);
}

.contact-badge.both {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.contact-badge.telegram {
  background: linear-gradient(135deg, #0088cc, #0099ff);
  color: white;
}

.contact-badge.instagram {
  background: linear-gradient(135deg, #fd5949, #d6249f, #285AEB);
  color: white;
}

.contact-badge.unidentified {
  background: linear-gradient(135deg, #f6ad55, #ed8936);
  color: white;
}

.app-container {
  background-color: #f0f4f8;
}

.dark-mode .app-container {
  background-color: #1a202c;
}

.main-content {
  max-height: 100vh;
  overflow-y: auto;
}

.header-section {
  background-color: #4299e1;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.header-content {
  max-height: 100%;
  overflow: hidden;
}

.main-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  font-weight: normal;
}

.section-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 20px;
  margin-right: 10px;
}

.section-desc {
  font-size: 14px;
  color: #6b7280;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.input-card {
  display: flex;
  flex-direction: column;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
}

.cute-input {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.drop-zone {
  border: 2px dashed #4299e1;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}

.drop-active {
  border-color: #48bb78;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.drop-text {
  font-size: 16px;
  color: #6b7280;
}

.drag-active-text {
  font-size: 18px;
  font-weight: bold;
}

.browse-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
}

.browse-btn:hover {
  background-color: #3182ce;
}

.preview-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
}

.preview-btn:hover {
  background-color: #3182ce;
}

.progress-container {
  margin-top: 10px;
  height: 20px;
  background-color: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4299e1;
  transition: width 0.3s ease;
}

.progress-fill {
  height: 100%;
  background-color: #48bb78;
}

.progress-text {
  text-align: center;
  font-weight: bold;
}

.success-card {
  background-color: #f0fdf4;
  padding: 20px;
  border-radius: 8px;
  margin-top: 10px;
}

.success-icon {
  font-size: 24px;
  color: #48bb78;
  margin-right: 10px;
}

.success-text {
  font-size: 18px;
  font-weight: bold;
}

.success-emoji {
  font-size: 24px;
  margin-left: 10px;
}

.results-container {
  margin-top: 20px;
}

.result-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.result-number {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.result-badges {
  display: flex;
  align-items: center;
}

.badge {
  background-color: #4299e1;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 4px;
}

.result-content {
  margin-top: 10px;
}

.result-text {
  white-space: pre-wrap;
}

.indicator-card {
  background-color: #f3f4f6;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.indicator-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.indicator-content {
  display: flex;
  align-items: center;
}

.post-badge {
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 4px;
}

.photo-indicator a {
  color: #4299e1;
  text-decoration: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  max-height: calc(100% - 100px);
  overflow-y: auto;
}

.preview-table-container {
  max-height: 100%;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  text-align: left;
}

.preview-table th {
  background-color: #f3f4f6;
}

.footer-section {
  background-color: #4299e1;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
}

.minecraft-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.minecraft-btn:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}
</style> 