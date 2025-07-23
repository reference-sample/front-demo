<template>
  <main>
    <h4>File Upload</h4>
    <UploadComponent class="upload" @fileSelectedChange="handleFileChange" />
    <div class="file-list">
      <div class="file-item" v-for="(file, index) in fileList" :key="index">
        <span class="file-icon"></span>
        <span class="file-name">{{ file.name }}</span>
        <el-button link class="file-remove" @click="uploadFile(file.name)">
          <el-icon><Upload /></el-icon>
        </el-button>
        <el-button link class="file-remove" @click="removeFile(file.name)">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="demo-progress">
      <el-progress
        v-show="progress > 0"
        :percentage="progress"
      />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import UploadComponent from '@/components/Upload.vue'
import {upload} from "@/api"

const fileList = ref([])
const progress = ref(0)

const handleFileChange = async (files) => {
  console.info('开始处理...')
  const start = new Date().getTime()
  fileList.value = files
  const file = files[0].raw
  console.info(file)
  console.info(`文件名：${file.name}, 文件大小：${(file.size / 1024 / 1024).toFixed(2)} MB`)
}

const removeFile = (fileName) => {
  fileList.value = fileList.value.filter((file) => file.name !== fileName)
}

const uploadFile = async(fileName) => {
  const file = fileList.value.find((file) => file.name === fileName)
  if (!file) return
  await upload(file.raw)
  progress.value = 0
  ElMessage.success('上传成功')
}

</script>

<style lang="scss" scoped>
main {
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
h4 {
  font-size: 20px;
  color: #303030;
  margin-bottom: 60px;
}
.upload {
  margin-top: 100px;
  width: 60%;
  height: 198px;
}
.file-list {
  height: calc(100% - 42px);
  width: 60%;
  margin-top: 12px;
  padding-right: 4px;
  overflow: auto;
  .file-item {
    height: 52px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    margin-bottom: 10px;
    .file-icon {
      width: 24px;
      height: 24px;
      background: url('@/assets/file.svg') no-repeat center;
      background-size: 100% 100%;
    }
    .file-name {
      font-size: 14px;
      color: #333333;
      flex: 1;
      margin-left: 10px;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
.demo-progress {
  margin-top: 12px;
  height: 24px;
  width: 60%;
}
</style>
