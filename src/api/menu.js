import { fetch, post, patch, del } from '@/libs/http.js'

// 添加菜谱
export function doMenuAdd(params) {
  return post('menu', params)
}
// 删除菜谱
export function doMenuDel(params) {
  return del('menu', params)
}
// 修改菜谱
export function doMenuEdit(params) {
  return patch('menu', params)
}

// 批量删除菜谱
export function doMenuDelMany(params) {
  return del('menu/delete-many', params)
}

// 查询菜谱
export function findMenuInfo(params) {
  return fetch('menu/page', params)
}
