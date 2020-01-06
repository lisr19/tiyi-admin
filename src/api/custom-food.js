// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 自定义食物查询
export function findCustomFoodInfo(params) {
  return fetch('custom-food/page', params)
}
// 自定义食物添加
export function doCustomFoodAdd(params) {
  return post('custom-food', params)
}
// 自定义食物编辑
export function doCustomFoodEdit(params) {
  return patch('custom-food', params)
}
// 自定义食物删除
export function doCustomFoodDel(params) {
  return del('custom-food/delete-many', params)
}
// 自定义食物批量删除
export function doCustomFoodDelMany(params) {
  return del('scustom-food/deleteMany', params)
}
