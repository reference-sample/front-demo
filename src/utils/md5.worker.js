// src/workers/md5.worker.js
import SparkMD5 from 'spark-md5';

self.onmessage = async function (e) {
  const file = e.data;
  const chunkSize = 2 * 1024 * 1024; // 每片2MB
  const chunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    spark.append(e.target.result);
    currentChunk++;
    if (currentChunk < chunks) {
      loadNext();
    } else {
      self.postMessage({ md5: spark.end() });
    }
  };

  fileReader.onerror = function () {
    self.postMessage({ error: '读取文件失败' });
  };

  function loadNext() {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    fileReader.readAsArrayBuffer(file.slice(start, end));
  }

  loadNext();
};
