import axios from 'axios'

import config from '@/config'
import qs from 'qs'
const baseUrl =
  process.env.NODE_ENV === 'development'
    ? config.baseUrl.dev
    : config.baseUrl.pro
axios.defaults.timeout = 30000
axios.defaults.baseURL = baseUrl

// http request 拦截器
axios.interceptors.request.use(
  (config) => {
    // console.log(baseUrl)
    // 若是有token , 就给头部授权带上token
    // 判断请求方式是否为以下四种种
    // if (config.method === 'post' || 'put' || 'delete' || 'patch') {
    //   // 序列化
    //   config.data = qs.stringify(config.data);
    //   // 设置请求头的content-type
    //   config.headers = {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //     // 'Content-Type': 'multipart/form-data',
    //     // 'Content-Type':'multipart/form-data'
    //   };
    // }
    let url = config.url
    // get参数编码
    // console.log(config.params)
    if (config.method === 'get' && config.params) {
      url += '?'
      let keys = Object.keys(config.params)
      for (let key of keys) {
        if (config.params[key]) {
          url += `${key}=${encodeURIComponent(config.params[key])}&`
        }
      }
      url = url.substring(0, url.length - 1)
      config.params = {}
    }
    config.url = url
    if (localStorage.hmAdminToken) {
      config.headers.authorization = localStorage.hmAdminToken
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// http response 拦截器
axios.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 封装get方法
 * @param url
 * @param data
 * @returns {Promise}
 */

export function fetch(url, data) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, { params: data })
      .then((response) => {
        resolve(response)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

/**
 * 封装delete方法
 * @param url
 * @param data
 * @returns {Promise}
 */

export function del(url, data) {
  return new Promise((resolve, reject) => {
    axios
      .delete(url, { params: data })
      .then((response) => {
        resolve(response)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

/**
 * 封装post请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function post(url, data) {
  console.log(url)
  let formData = new FormData()
  for (let key in data) {
    formData.append(key, data[key])
  }
  return new Promise((resolve, reject) => {
    axios.post(url, formData).then(
      (response) => {
        resolve(response)
      },
      (err) => {
        reject(err)
      }
    )
  })
}
/**
 * 封装post请求(JSON)
 * @param url
 * @param data
 * @returns {Promise}
 */

export function post4JSON(url, data) {
  let config = {
    data: '',
    headers: {}
  }
  // 序列化
  config.data = qs.stringify(data)
  // 设置请求头的content-type
  config.headers = {
    'Content-Type': 'application/json'
  }
  return new Promise((resolve, reject) => {
    axios.post(url, data, config).then(
      (response) => {
        resolve(response)
      },
      (err) => {
        reject(err)
      }
    )
  })
}

/**
 * 封装patch请求
 * @param url
 * @param data
 * @returns {Promise}
 */

export function patch(url, data) {
  let formData = new FormData()
  for (let key in data) {
    formData.append(key, data[key])
  }
  return new Promise((resolve, reject) => {
    axios.patch(url, formData).then(
      (response) => {
        resolve(response)
      },
      (err) => {
        reject(err)
      }
    )
  })
}
