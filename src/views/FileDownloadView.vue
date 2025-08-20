<template>
  <main>
    <h4>File Download</h4>
    <div class="download">
      <el-input v-model="fileName" placeholder="请输入文件名"></el-input>
      <el-button type="primary" @click="downloadFileHanlder">下载</el-button>
    </div>
  </main>
</template>

<script setup>
import { downloadFile } from '@/api'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const fileName = ref('')

const downloadFileHanlder = async () => {
  if (!fileName.value) return

  const url = `${import.meta.env.VITE_API_BASE_URL}/file/download?fileName=${fileName.value}`;
  // 1.方法一，短暂显示新窗口，无法指定下载文件名
  // window.open(url);

  // 2.方法二，下载文件
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.value;
  a.click();
  ElMessage.success('下载成功');
  document.body.removeChild(a);

  // 3.方法三，下载文件
  // await downloadFile(fileName.value)
  // ElMessage.success('下载成功')
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
.download {
  margin-top: 40px;
  width: 60%;
  height: 198px;
  text-align: center;
  .el-input {
    width: 280px;
    margin-right: 16px;
  }
}
</style>
