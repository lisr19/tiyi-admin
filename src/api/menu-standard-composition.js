import { fetch, post, del } from '@/libs/http.js'

// 添加菜谱标准成分
export function doStandardCompositionAdd(params) {
  return post('menu-standard-composition', params)
}
// 批量添加菜谱标准成分
export function doStandardCompositionAddMany(params) {
  return post('menu-standard-composition/add-many', params)
}
// 删除菜谱标准成分
export function doStandardCompositionDel(params) {
  return del('menu-standard-composition', params)
}

// 批量删除菜谱标准成分
export function doStandardCompositionDelMany(params) {
  return del('menu-standard-composition/delete-many', params)
}

// 查询菜谱标准成分
export function findStandardCompositionInfo(params) {
  return fetch('menu-standard-composition/list-by-menu-code', params)
}
