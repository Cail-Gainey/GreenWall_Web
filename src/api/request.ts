/**
 * @file Axios 实例封装：统一 baseURL、超时与拦截器。
 */
import axios from 'axios'
import type { ApiResult } from './types'

/**
 * @description 统一请求实例。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * @description 请求拦截器：自动附加 JWT Token。
 */
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * @description 响应拦截器：统一处理业务错误与登录失效。
 */
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResult<unknown>
    if (data.code !== 200) {
      return Promise.reject(new Error(data.msg || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    const msg = error.response?.data?.msg || error.message || '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export default request
