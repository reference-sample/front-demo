import SparkMD5 from 'spark-md5'
import MD5Worker from './md5.worker.js?worker';

// utils/fileHash.js
import { createMD5 } from 'hash-wasm'

const DEFAULT_THRESHOLD = 10 * 1024 * 1024 // 10MB

/**
 * 生成文件的 hash（小文件全量，大文件只取前2M+后2M）
 * @param {File} file - 要处理的文件对象
 * @param {Object} options - 可选项
 * @param {number} options.threshold - 文件大小阈值（默认10MB）
 * @param {string} [options.userName] - 可加用户名参与 hash
 */
export async function generateFileSmartHash(file, options = {}) {
  const { threshold = DEFAULT_THRESHOLD, userName = '' } = options
  const md5 = await createMD5()

  if (file.size <= threshold) {
    // 小文件，直接全量读取
    const buffer = await file.arrayBuffer()
    md5.update(new Uint8Array(buffer))
  } else {
    // 大文件，只取前后片段
    const front = file.slice(0, 2 * 1024 * 1024)
    const end = file.slice(file.size - 2 * 1024 * 1024)
    const frontBuffer = await front.arrayBuffer()
    const endBuffer = await end.arrayBuffer()

    md5.update(new Uint8Array(frontBuffer))
    md5.update(new Uint8Array(endBuffer))
  }

  // 加上其他辅助信息（可选）
  const meta = `${file.name}-${file.size}-${file.lastModified}-${userName}`
  md5.update(meta)

  return md5.digest()
}


export async function computeFastMD5(file) {
  const hasher = await createMD5();
  const chunkSize = 4 * 1024 * 1024; // 4MB
  const total = file.size;
  let offset = 0;

  while (offset < total) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buf = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buf));
    offset += chunkSize;
  }

  return hasher.digest();
}

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

export function webWorkerComputeMD5(file) {
  return new Promise((resolve, reject) => {
    const worker = new MD5Worker();
    const start = performance.now();

    worker.postMessage(file);

    worker.onmessage = (e) => {
      if (e.data.error) {
        reject(e.data.error);
      } else {
        const duration = (performance.now() - start) / 1000;
        console.log(`✅ 文件MD5：${e.data.md5}`);
        console.log(`⏱️ 计算耗时：${duration.toFixed(3)}s`);
        resolve(e.data.md5);
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      console.error('❌ Worker 错误:', err);
      reject(err);
      worker.terminate();
    };
  });
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
