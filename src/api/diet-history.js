// import axios from '@/libs/api.request'
import { fetch, post4JSON, patch, del } from '@/libs/http.js'

// 饮食记录查询
export function findDietHistoryInfo(params) {
  return fetch('diet-history/page', params)
}
// 饮食记录添加
export function doDietHistoryAdd(params) {
  return post4JSON('diet-history', params)
}
// 饮食记录编辑
export function doDietHistoryEdit(params) {
  return patch('diet-history', params)
}
// 饮食记录删除
export function doDietHistoryDel(params) {
  return del('diet-history/delete-many', params)
}
// 饮食记录批量删除
export function doDietHistoryDelMany(params) {
  return del('diet-history/deleteMany', params)
}
