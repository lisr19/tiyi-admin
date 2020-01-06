import { fetch, post, patch, del } from '@/libs/http.js'

// 添加地址
export function addAddress(params) {
  return post('address', params)
}

// 删除地址
export function delAddress(params) {
  return del('address', params)
}
// 修改地址
export function editAddress(params) {
  return patch('address', params)
}

// 批量删除地址
export function delManyAddress(params) {
  return del('address/delete-many', params)
}

// 查询地址
export function getAddress(params) {
  return fetch('address/list', params)
}
