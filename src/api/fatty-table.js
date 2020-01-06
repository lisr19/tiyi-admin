import { fetch, post, del, post4JSON } from '@/libs/http.js'

// 添加脂肪酸
export function doFattyAdd(params) {
  return post('fatty', params)
}
// 批量添加脂肪酸
export function doFattyAddMany(params) {
  return post4JSON('fatty/add-many', params)
}
// 删除脂肪酸
export function doFattyDel(params) {
  return del('fatty', params)
}

// 批量删除脂肪酸
export function doFattyDelMany(params) {
  return del('fatty/delete-many', params)
}

// 查询脂肪酸
export function findFattyInfo(params) {
  return fetch('fatty/page', params)
}
