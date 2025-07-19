import SparkMD5 from 'spark-md5'

export async function calculateFileMD5(file) {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024 // 每块2MB
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    fileReader.onload = function (e) {
      if (e.target?.result) {
        spark.append(e.target.result)
      }
      currentChunk++
      if (currentChunk < chunks) {
        loadNext()
      } else {
        const md5 = spark.end()
        resolve(md5)
      }
    }

    fileReader.onerror = function () {
      reject(new Error('文件读取失败'))
    }

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const blobSlice = file.slice(start, end)
      fileReader.readAsArrayBuffer(blobSlice)
    }

    loadNext()
  })
}

// 50MB分块大小
const CHUNK_SIZE = 50 * 1024 * 1024

/**
 * 处理文件分块
 */
export function processFile(file) {
  const chunkCount = Math.ceil(file.size / CHUNK_SIZE)
  const chunks = []

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(file.size, start + CHUNK_SIZE)
    chunks.push(file.slice(start, end))
  }
  return chunks
}
