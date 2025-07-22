import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000000,
  withCredentials: true,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem('userinfo'))?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果是 FormData，自动设置 Content-Type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 如果是文件流（Blob），直接返回原始 response
    if (response.config.responseType === 'blob') {
      return response
    }

    const data = response.data
    if (data.code !== 0) {
      ElMessage.error(data.message || '接口异常')
      return Promise.reject(data)
    }

    return data.data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status

      switch (status) {
        case 401:
          ElMessage.warning('认证失效，请重新登录')
          localStorage.removeItem(TOKEN_KEY)
          router.replace('/login')
          break
        case 403:
          ElMessage.warning('没有权限')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求异常')
          break
      }
    } else {
      ElMessage.error('网络连接失败')
    }

    return Promise.reject(error)
  },
)

// 通用请求方法封装
const request = {
  get(url, params = {}, config = {}) {
    const query = new URLSearchParams(params).toString()
    const fullUrl = query ? `${url}?${query}` : url
    return instance.get(fullUrl, config)
  },

  post(url, data = {}, config = {}) {
    return instance.post(url, data, config)
  },

  put(url, data = {}, config = {}) {
    return instance.put(url, data, config)
  },

  delete(url, params = {}, config = {}) {
    return instance.delete(url, { params, ...config })
  },

  upload(url, formData, config = {}) {
    return instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    })
  },

  download(url, fileName, config = {}) {
    return instance
      .get(url + `?fileName=${fileName}`, {
         responseType: 'blob',
        ...config,
      })
      .then((res) => {
        const blob = new Blob([res.data])
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = fileName
        a.click()
        URL.revokeObjectURL(a.href)
      }).catch((error) => {
        // 此处捕获到异常
        console.error("下载 error");
        console.error(error);
      })
  },
}

export default request
