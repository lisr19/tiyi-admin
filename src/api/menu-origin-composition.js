import { fetch, post, del } from '@/libs/http.js'
// 添加菜谱原始成分
export function doOriginCompositionAdd(params) {
  return post('menu-origin-composition', params)
}
// 批量添加菜谱原始成分
export function doOriginCompositionAddMany(params) {
  return post('menu-origin-composition/add-many', params)
}
// 删除菜谱原始成分
export function doOriginCompositionDel(params) {
  return del('menu-origin-composition', params)
}

// 批量删除菜谱原始成分
export function doOriginCompositionDelMany(params) {
  return del('menu-origin-composition/delete-many', params)
}

// 查询菜谱原始成分
export function findOriginCompositionInfo(params) {
  return fetch('menu-origin-composition/list-by-menu-code', params)
}
