<template>
  <main>
    <Upload class="upload" @fileSelectedChange="handleFileChange" />

    <div class="file-list">
      <div class="file-item" v-for="(file, index) in fileList" :key="index">
        <span class="file-icon"></span>
        <span class="file-name">{{ file.name }}</span>
        <el-button link class="file-remove" @click="removeFile(file.name)"
          ><el-icon><Close /></el-icon
        ></el-button>
      </div>
    </div>
    <div class="demo-progress">
      <el-progress v-show="progress > 0" :text-inside="true" :stroke-width="26" :percentage="progress" />
    </div>
  </main>
</template>

<script setup>
import Upload from '@/components/Upload.vue'
import { calculateFileMD5, processFile } from '@/utils/index'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const baseUrl = 'http://172.16.12.63:9999'
// const baseUrl = 'http://172.16.13.46:9999'

axios.defaults.baseURL = baseUrl

const fileList = ref([])
const progress = ref(0)

const removeFile = (fileName) => {
  fileList.value = fileList.value.filter((file) => file.name !== fileName)
}

const handleFileChange = async (files) => {
  console.info('开始处理...');
  const start = new Date().getTime();
  fileList.value = files
  const file = files[0].raw
  console.info(file);
  console.info(`文件名：${file.name}, 文件大小：${(file.size / 1024 / 1024).toFixed(2)} MB`);

  console.info('开始计算文件MD5...');

  const start1 = new Date().getTime();
  const fileMd5 = await calculateFileMD5(file)

  let now = new Date().getTime()

  let time = (now - start1) / 1000
  console.info(`计算文件MD5耗时：${time}s`);

  // 1. 初始化上传
  console.info('初始化上传...');
  const formData = new FormData()
  formData.append('fileName', file.name)
  formData.append('fileMd5', fileMd5)

  const {data: uploadId} = await axios.post('/upload/init', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  // 2. 分块上传
    console.info('开始文件分块...');
  const start2 = new Date().getTime();
  const chunks = processFile(file)
  const total = ref(chunks.length)

  now = new Date().getTime()
  time = (now - start2) / 1000
  console.info(`分块耗时：${time}s`);

  // let uploaded = 0
console.info('开始上传...');
  const uploaded = ref(0)
  const start3 = new Date().getTime();
  await Promise.all(
    chunks.map((chunk, index) => {
      const formData = new FormData()
      formData.append('chunk', chunk, `chunk_${index}`)
      formData.append('index', index)
      formData.append('uploadId', uploadId)
      formData.append('fileMd5', fileMd5)

      return axios
        .post('/upload/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progress) => {
            // 更新进度条
            progress.value = ((uploaded.value * 100) / total.value).toFixed(1)
          },
        })
        .then(() => {
          uploaded.value++;
          progress.value = ((uploaded.value * 100) / total.value).toFixed(0)
        })
    }),
  )

  now = new Date().getTime()
  time = (now - start3) / 1000
  console.info(`上传耗时：${time}s`);

  // 3. 触发合并
  console.info('开始合并...');
  const formData2 = new FormData()
  formData2.append('fileName', file.name)
  formData2.append('uploadId', uploadId)
  formData2.append('fileMd5', fileMd5)
  const result = await axios.post('/upload/merge', formData2, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  now = new Date().getTime()
  time = (now - start) / 1000
  console.info(`总耗时：${time}s`);

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
