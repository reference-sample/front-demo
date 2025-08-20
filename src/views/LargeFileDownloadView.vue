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

  const fileMd5 = await downloadFile('39.zip')

  let now = new Date().getTime()
  let time = (now - start) / 1000
  console.info(`计算文件耗时：${time}s`)

  ElMessage.success('下载成功')
}

const downloadFileChunkClick = async () => {
  console.info('开始分块下载...')
  const start = new Date().getTime()
  const fileName = '39.zip'
  const chunkSize = 8 * 1024 * 1024 // 8MB
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
  // 1. 获取文件信息与分片
  const infoRes = await getFileInfo(fileName);
  const fileSize = infoRes.size;
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const chunks = Array.from({ length: totalChunks }, (_, i) => {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize - 1, fileSize - 1);
    return { index: i, start, end };
  });

  // 2. 初始化流式存储（优先用文件系统API，降级用Blob）
  let writeStream;
  let fileHandle;
  try {
    // 浏览器支持文件系统API时，直接写入本地文件（需用户授权）
    fileHandle = await window.showSaveFilePicker({ suggestedName: fileName });
    writeStream = await fileHandle.createWritable();
    console.info(1);
  } catch (e) {
    console.info(2);
    // 不支持时用Blob数组增量合并（内存友好版）
    console.info("不支持文件系统API，使用Blob数组增量合并", e);

    writeStream = {
      blobs: [],
      write: async (chunk) => { writeStream.blobs[chunk.index] = chunk.data; },
      close: async () => {
        const finalBlob = new Blob(writeStream.blobs)

        const link = document.createElement('a');
        link.href = URL.createObjectURL(finalBlob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        return finalBlob;
      }
    };
  }

  // 3. 并发下载+流式写入
  let completed = 0;
  const results = new Array(totalChunks); // 仅存状态，不存完整数据

  async function downloadChunk(chunk) {
    const { index, start, end } = chunk;
    const res = await downloadChunkApi(fileName, start, end);
    // 按索引写入，保证顺序正确
    await writeStream.write({type: 'write', index, data: res.data, position: start});
    results[index] = true;
    completed++;
    console.log(`进度：${Math.floor(completed / totalChunks * 100)}%`);
  }

  // 并发池逻辑（复用原有控制，仅修改任务内容）
  let index = 0;
  async function runPool() {
    const pool = [];
    while (index < chunks.length) {
      while (pool.length < concurrency && index < chunks.length) {
        const chunk = chunks[index++];
        const p = downloadChunk(chunk);
        pool.push(p);
        p.finally(() => pool.splice(pool.indexOf(p), 1));
      }
      await Promise.race(pool);
    }
    await Promise.all(pool);
  }

  await runPool();
  const finalBlob = await writeStream.close();
}

async function downloadFileChunkedMemory({ fileName, chunkSize = 2 * 1024 * 1024, concurrency = 5 }) {
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
