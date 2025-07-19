<template>
  <div class="upload center-content" @click="openFileInput">
    <div class="icon"></div>
    <div class="text">点击上传</div>
    <span class="desc">支持格式.zip,.rar,.7z,.tar</span>
    <!-- 隐藏文件选择框 -->
    <input
      type="file"
      ref="hiddenInput"
      multiple="false"
      max="10"
      accept=".zip,.rar,.7z,.tar"
      style="display: none"
      @change="handleFileInput"
    />
  </div>
</template>
<script setup>
import { defineEmits, ref } from 'vue'
const emit = defineEmits(['fileSelectedChange'])

const hiddenInput = ref(null)
const openFileInput = () => {
  hiddenInput.value && hiddenInput.value.click()
}

const handleFileInput = (e) => {
  const files = Array.from(e.target.files || [])
  const fileList = []
  fileList.push(
    ...files.map((file) => ({
      name: file.name,
      raw: file,
    })),
  )
  // 发送文件给父组件
  emit('fileSelectedChange', fileList)
}
</script>
<style lang="scss" scoped>
.upload {
  width: 100%;
  height: 100%;
  background: #f7f9fe;
  border-radius: 8px;
  border: 1px dashed #acc5ff;
  flex-direction: column;

  .content {
    text-align: center;
  }
  .icon {
    height: 64px;
    width: 64px;
    background: url('@/assets/file.svg') no-repeat center;
  }
  .text {
    margin-top: 12px;
    font-weight: 500;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.88);
    line-height: 24px;
  }
  .desc {
    margin-top: 4px;
    font-size: 14px;
    color: #606060;
  }
}

.upload:hover {
  background: #f0f3ff;
  border-color: #758bfb;
  cursor: pointer;
}
</style>
