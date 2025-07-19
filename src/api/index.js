import request from '@/utils/request'

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 获取列表
export function fetchUserList(params) {
  return request.get('/users', params)
}

// 上传文件
export function upload(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.upload('/file/upload', formData)
}

// 分片上传文件
export function uploadChunk(blob, index, md5) {
  const formData = new FormData()
  formData.append('file', blob)
  formData.append('chunkIndex', index)
  formData.append('md5', md5)
  return request.upload('/file/uploadChunk', formData)
}
// 分片上传文件
export function mergeChunks(fileName, totalChunks, md5) {
  const formData = new FormData()
  formData.append('fileName', fileName)
  formData.append('totalChunks', totalChunks)
  formData.append('md5', md5)
  return request.post('/file/mergeChunks', formData)
}

// 下载文件
export function downloadExcel() {
  return request.download('/report/export', {}, '报表.xlsx')
}
