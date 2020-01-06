import { fetch, post, patch, del } from '@/libs/http.js'

// 添加管理员
export function doManagerAdd(params) {
  return post('manager', params)
}
// 删除管理员
export function doManagerDel(params) {
  return del('manager', params)
}
// 修改管理员
export function doManagerEdit(params) {
  return patch('manager', params)
}

// 批量删除管理员
export function doManagerDelMany(params) {
  return del('manager/delete-many', params)
}

// 管理员登陆
export function doManagerLogin(params) {
  return del('manager/login', params)
}

// 查询管理员
export function findManagerInfo(params) {
  return fetch('manager/page', params)
}

// 查询登陆的
export function findManagerLogin(params) {
  return fetch('manager-login-info/page', params)
}
