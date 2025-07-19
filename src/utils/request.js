import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 150000,
  withCredentials: true,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userinfo')?.token
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
    return instance.get(url, { params, ...config })
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

  download(url, data = {}, filename = 'download', config = {}) {
    return instance
      .post(url, data, {
        responseType: 'blob',
        ...config,
      })
      .then((res) => {
        const blob = new Blob([res])
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        URL.revokeObjectURL(link.href)
      })
  },
}

export default request
