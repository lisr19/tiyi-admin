import { fetch, post, patch, del } from '@/libs/http.js'

// 添加菜谱类型
export function doMenuTypeAdd(params) {
  return post('menu-type', params)
}
// 删除菜谱类型
export function doMenuTypeDel(params) {
  return del('menu-type', params)
}
// 修改菜谱类型
export function doMenuTypeEdit(params) {
  return patch('menu-type', params)
}

// 批量删除菜谱类型
export function doMenuTypeDelMany(params) {
  return del('menu-type/delete-many', params)
}

// 查询菜谱类型
export function findMenuTypeInfo(params) {
  return fetch('menu-type/list', params)
}
