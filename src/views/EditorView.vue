<template>
    <div style="border: 1px solid #ccc; margin: 48px;">
      <Toolbar
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
        class="toolbar-container"
      />
      <Editor
        style="height: 500px; overflow-y: hidden;"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
        @onChange="handleChange"
        class="editor-container"
      />
    </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { debounce } from 'lodash-es'
import { onBeforeRouteLeave } from 'vue-router'
import SaveMenu from '@/utils/saveMenu'

const editorRef = shallowRef()
const valueHtml = ref('<ul><li>（眼珠一转，继续发挥想象）<u>蓝色的风</u>把紫色的月亮吹到了绿色的银河里，<span style="color: rgb(255, 213, 145);"><strong>金鱼</strong></span>在云朵间游来游去吐着彩虹色的泡泡，钢琴键上长出了一朵朵粉色的小花，蝴蝶落在上面弹出来一个个哆来咪发嗦啦西哆～</li></ul>')
const mode = ref('default')
const toolbarConfig = ref({
  insertKeys: {
    index: 0,
    keys: ['custom-save']
  },
  excludeKeys: ['insertImage','group-video']
})
const editorConfig = ref({ placeholder: '请输入内容...', MENU_CONF: {
  'insertImage': false,
  'customInsertImage': {
    title: '插入网络图片',
    iconSvg: '<svg>...</svg>',
    menuKeys: ['customInsertImage'],
    async exec(editor) {
      const imageUrl = prompt('请输入图片地址:')
      if (imageUrl) {
        const altText = prompt('请输入图片描述:')
        editor.commander.execCommand('insertImage', [{ src: imageUrl, alt: altText }])
      }
    }
  }
} })
editorConfig.value.MENU_CONF['uploadImage'] = {
  async customUpload(file, insertFn) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('http://localhost:9002/api/file/upload', {
      method: 'POST',
      body: formData
    })

    const result = await res.json()
    console.info(result)

    if (result.code === 0) {
      const baseUrl = "http://localhost:9002/api/file/download"
      const url = `${baseUrl}?fileName=${result.data}`
      insertFn(url, "", url)
    }
  }
}

// -------------------- 自动保存 + 提示逻辑 --------------------
let hasUnsaved = false

// 防抖保存
const debouncedSave = debounce((html) => {
  saveHtml(html)
}, 1500)

const handleChange = (editor) => {
  const html = editor.getHtml()
  hasUnsaved = true
  debouncedSave(html)
}

const saveHtml = (html) => {
  // TODO: 替换成你真正的保存接口调用
  console.log('📌 全局保存逻辑:', html.length)
  hasUnsaved = false
}

// 关闭/刷新页面提示
function handleBeforeUnload(e) {
  if (hasUnsaved) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 路由跳转前提示
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsaved) {
    if (confirm('你有未保存的内容，确定要离开吗？')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// -------------------- 保存按钮逻辑 --------------------
const handleSave = (html, text, editor) => {
  console.log('📌 组件内收到保存请求:', html)
  saveHtml(html)
}

const handleCreated = (editor) => {
  editorRef.value = editor
  SaveMenu.setSaveHandler(handleSave)
  console.info(editor)
}
</script>

<style scoped>
.toolbar-container {
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 0;
}
.editor-container {
  min-height: 300px;
  margin-top: 8px;
  padding: 8px;
}
</style>
