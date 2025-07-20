<template>
  <main>
    <h4>Large File Upload</h4>
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
        :text-inside="true"
        :stroke-width="26"
        :percentage="progress"
      />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import UploadComponent from '@/components/Upload.vue'
import { calculateFileMD5, generateFileSmartHash, computeFastMD5, webWorkerComputeMD5, processFile } from '@/utils/index'
import { uploadChunk, mergeChunks } from '@/api'

const fileList = ref([])
const progress = ref(0)

const handleFileChange = async (files) => {
  const start = new Date().getTime()
  fileList.value = files
  const file = files[0].raw
  console.info(file)
  console.info(`文件名：${file.name}, 文件大小：${(file.size / 1024 / 1024).toFixed(2)} MB`)
}

const removeFile = (fileName) => {
  fileList.value = fileList.value.filter((file) => file.name !== fileName)
}

const uploadFile = async (fileName) => {
  console.info('开始上传...')
  const start = new Date().getTime()

  const file = fileList.value.find((file) => file.name === fileName)
  if (!file) return
  const raw = file.raw

  console.info('开始计算文件MD5...')
  // 1. 计算文件MD5
  const fileMd5 = await generateFileSmartHash(raw)
  // const fileMd5 = await webWorkerComputeMD5(raw)
  console.info(`文件MD5：${fileMd5}`)

  let now = new Date().getTime()
  let time = (now - start) / 1000
  console.info(`计算文件MD5耗时：${time}s`)

  return;
  // 2. 上传分块
  console.info('开始文件分块...')
  const start2 = new Date().getTime()
  const chunks = processFile(raw)
  const total = chunks.length
  let uploaded = 0
  await Promise.all(
    chunks.map(async (chunk, index) => {
      const { data: res } = await uploadChunk(chunk, index, fileMd5)
      // console.info(`分块${index + 1}上传成功`)
      uploaded++
      progress.value = ((uploaded * 100) / total).toFixed(0)
    }),
  )
  now = new Date().getTime()
  time = (now - start2) / 1000
  console.info(`上传耗时：${time}s`)
  // 3. 合并分块
  console.info('开始合并...')
  const start3 = new Date().getTime()

  const { data: res } = await mergeChunks(fileName, total, fileMd5)
  console.info(`合并分块成功`)

  now = new Date().getTime()
  time = (now - start3) / 1000
  console.info(`合并耗时：${time}s`)

  // 计算总耗时
  now = new Date().getTime()
  time = (now - start) / 1000
  console.info(`总耗时：${time}s`)

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
