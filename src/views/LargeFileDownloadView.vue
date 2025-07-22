<template>
  <main>
    <h4>Large File Download</h4>
    <div class="btns">
      <el-button type="primary" @click="downloadFileClick">下载文件</el-button>
      <el-button type="primary" @click="downloadFileChunkClick">分块下载文件</el-button>
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
import { downloadFile, getFileInfo, downloadChunkApi } from '@/api'

const progress = ref(0)

const downloadFileClick = async () => {
  console.info('开始下载...')
  const start = new Date().getTime()

  const fileMd5 = await downloadFile('large.zip')

  let now = new Date().getTime()
  let time = (now - start) / 1000
  console.info(`计算文件耗时：${time}s`)

  ElMessage.success('下载成功')
}

const downloadFileChunkClick = async () => {
  console.info('开始分块下载...')
  const start = new Date().getTime()
  const fileName = 'large.zip'
  const chunkSize = 2 * 1024 * 1024 // 2MB
  const concurrency = 5 // 并发数

  await downloadFileChunked({
    fileName,
    chunkSize,
    concurrency,
  })

  const now = new Date().getTime()
  const time = (now - start) / 1000
  console.info(`下载耗时：${time}s`)

  ElMessage.success('下载成功')
}

async function downloadFileChunked({ fileName, chunkSize = 2 * 1024 * 1024, concurrency = 5 }) {
  // 1. 获取文件大小
  const infoRes = await getFileInfo(fileName)

  console.info(infoRes, infoRes.data)
  const fileSize = infoRes.size
  const chunks = []

  for (let start = 0; start < fileSize; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, fileSize - 1)
    chunks.push({ start, end })
  }

  // 2. 并发下载
  const results = new Array(chunks.length)
  let index = 0

  async function downloadChunk(i) {
    const { start, end } = chunks[i]
    const res = await downloadChunkApi(fileName, start, end)
    results[i] = res.data
  }

  async function runPool() {
    const pool = []
    while (index < chunks.length) {
      while (pool.length < concurrency && index < chunks.length) {
        const i = index++
        const p = downloadChunk(i)
        pool.push(p)
        p.finally(() => {
          pool.splice(pool.indexOf(p), 1)
        })
      }
      await Promise.race(pool)
    }
    await Promise.all(pool)
  }

  await runPool()

  // 3. 合并 Blob 并下载
  const blob = new Blob(results)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
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
