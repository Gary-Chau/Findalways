import type { useElementBounding } from '@vueuse/core'
import { useClipboard } from '@vueuse/core'
import { pipe } from 'remeda'
import { computed } from 'vue'

/** 選取狀態 */
interface SelectionState {
  rect: DOMRect;
  text: string;
}

interface TargetParam {
  /** 目標元素 */
  element?: {
    value: HTMLElement;
    bounding: ReturnType<typeof useElementBounding>;
  };
  selectionState?: SelectionState;
}

// #region ContentProvider
interface BtnOption {
  label: string;
  onClick: (event?: Event) => void;
}

interface Content {
  /** 用於調整內容樣式 */
  class?: string;
  text?: string;
  /** 按鈕清單 */
  btnList?: BtnOption[];
  /** 預覽連結內容 */
  preview?: {
    src: string;
    class: string;
  };
}

export interface ContentProvider {
  /** 判斷目前元素或文字是否符合 */
  match: (
    data: HTMLElement | SelectionState
  ) => boolean;
  /** 取得小跟班顯示用內容 */
  getContent: (
    param: TargetParam
  ) => Content | undefined;
}
// #endregion ContentProvider

function isContentEditable(el?: HTMLElement | null) {
  return ['true', 'plaintext-only'].includes(
    el?.contentEditable ?? '',
  )
}

export function useContentProvider(param?: {
  activeList?: ContentProvider[];
  hoverList?: ContentProvider[];
  selectList?: ContentProvider[];
}) {
  const clipboard = useClipboard()

  /** 用於 active element */
  const activeContentProviders = computed<ContentProvider[]>(() => {
    return [
      ...param?.activeList ?? [],
      // 文字編輯類型
      {
        match(data) {
          if ('rect' in data)
            return false

          if (data instanceof HTMLInputElement) {
            const inputTypes = [
              'text',
              'number',
              'email',
              'password',
              'search',
              'tel',
              'url',
            ]
            return inputTypes.includes(data.type)
          }

          if (data instanceof HTMLTextAreaElement) {
            return true
          }

          if (isContentEditable(data)) {
            return true
          }

          return false
        },
        getContent(param) {
          const btnList: BtnOption[] = []

          if (clipboard.isSupported.value) {
            btnList.push({
              label: '📋 複製',
              onClick() {
                const { element } = param
                const target = element?.value

                if (
                  target instanceof HTMLInputElement
                  || target instanceof HTMLTextAreaElement
                ) {
                  clipboard.copy(target.value)
                }

                if (isContentEditable(target) && target?.innerHTML) {
                  clipboard.copy(target.innerHTML)
                }

                target?.focus()
              },
            })
          }

          btnList.push({
            label: '🧹 清空',
            onClick() {
              const { element } = param
              const target = element?.value

              if (
                target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
              ) {
                target.value = ''
                // 觸發 input 事件
                const event = new Event('input', {
                  bubbles: true,
                  cancelable: false,
                })
                target.dispatchEvent(event)
              }

              if (isContentEditable(target) && target) {
                target.innerHTML = ''
              }

              target?.focus()
            },
          })

          return { btnList }
        },
      },
    ]
  })

  /** 用於 hover element */
  const hoverContentProviders = computed<ContentProvider[]>(() => {
    return [
      ...param?.hoverList ?? [],
      // 文字編輯類型
      {
        match(data) {
          if ('rect' in data)
            return false

          if (data instanceof HTMLInputElement) {
            const inputTypes = [
              'text',
              'number',
              'email',
              'password',
              'search',
              'tel',
              'url',
            ]
            return inputTypes.includes(data.type)
          }

          if (data instanceof HTMLTextAreaElement) {
            return true
          }

          if (isContentEditable(data)) {
            return true
          }

          return false
        },
        getContent(param) {
          const btnList: BtnOption[] = []

          if (clipboard.isSupported.value) {
            btnList.push({
              label: '📋 複製',
              onClick() {
                const { element } = param
                const target = element?.value

                const text = pipe(
                  target,
                  () => {
                    if (
                      target instanceof HTMLInputElement
                      || target instanceof HTMLTextAreaElement
                    ) {
                      return target.value
                    }

                    if (isContentEditable(target) && target?.innerHTML) {
                      return target.innerHTML
                    }
                  },
                )

                if (!text)
                  return
                clipboard.copy(text)
              },
            })
          }

          return { btnList }
        },
      },

      // 按鈕。button 或 role 為 button 的元素
      {
        match(data) {
          if ('rect' in data)
            return false

          return data instanceof HTMLButtonElement
            || data?.getAttribute('role') === 'button'
        },
        getContent(param) {
          const { element } = param
          const target = element?.value

          if (
            target instanceof HTMLButtonElement
            && (target.disabled || target.ariaDisabled === 'true')
          ) {
            return {
              text: '哭哭不能按 ( ´•̥̥̥ ω •̥̥̥` )',
              class: 'text-nowrap',
            }
          }

          return undefined
        },
      },
      // checkbox 或內有 checkbox 的 label
      {
        match(data) {
          if ('rect' in data)
            return false

          if (
            data instanceof HTMLInputElement
            && data.type === 'checkbox'
          ) {
            return true
          }

          if (
            data instanceof HTMLLabelElement
            && data.querySelector('input[type="checkbox"]')
          ) {
            return true
          }

          return false
        },
        getContent(param) {
          const { element } = param

          const input = pipe(element?.value, (target) => {
            if (target instanceof HTMLInputElement) {
              return target
            }

            if (target instanceof HTMLLabelElement) {
              const input = target.querySelector('input[type="checkbox"]')
              if (input instanceof HTMLInputElement) {
                return input
              }
            }
          })
          if (!input)
            return

          return {
            text: input?.checked ? '✅→⬜' : '⬜→✅',
          }
        },
      },

      // 連結
      {
        match(data) {
          if ('rect' in data)
            return false

          if (data instanceof HTMLAnchorElement) {
            return true
          }

          return false
        },
        getContent(param) {
          const { element } = param
          const target = element?.value

          if (!(target instanceof HTMLAnchorElement))
            return

          const btnList: BtnOption[] = [
            {
              label: '📑 新分頁開啟連結',
              onClick() {
                window.open(target.href, '_blank')
              },
            },
          ]

          if (clipboard.isSupported.value) {
            btnList.push({
              label: '🔗 複製連結',
              onClick() {
                clipboard.copy(target.href)
              },
            })
          }

          return {
            text: decodeURIComponent(target.href),
            btnList,
            preview: {
              src: target.href,
              class: 'w-[500px] h-[600px]',
            },
          }
        },
      },

      // 圖片
      {
        match(data) {
          if ('rect' in data)
            return false

          return data instanceof HTMLImageElement
        },
        getContent(param) {
          const { element } = param
          const target = element?.value

          if (!(target instanceof HTMLImageElement))
            return

          return target.alt
            ? { text: target.alt }
            : undefined
        },
      },
    ]
  })

  /** 用於選取文字 */
  const selectContentProviders = computed<ContentProvider[]>(() => {
    return [
      ...param?.selectList ?? [],
      // 通用
      {
        match(data) {
          return 'rect' in data
        },
        getContent(param) {
          const btnList: BtnOption[] = []

          if (clipboard.isSupported.value) {
            btnList.push({
              label: '📋 複製',
              onClick() {
                const { selectionState } = param

                if (selectionState?.text) {
                  clipboard.copy(selectionState.text)
                }
              },
            })
          }

          return { btnList }
        },
      },
    ]
  })

  return {
    activeContentProviders,
    hoverContentProviders,
    selectContentProviders,
  }
}
