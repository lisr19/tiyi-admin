// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 运动记录查询
export function findSportHistoryInfo(params) {
  return fetch('sport-history/page', params)
}
// 运动记录添加
export function doSportHistoryAdd(params) {
  return post('sport-history', params)
}
// 运动记录编辑
export function doSportHistoryEdit(params) {
  return patch('sport-history', params)
}
// 运动记录删除
export function doSportHistoryDel(params) {
  return del('sport-history/delete-many', params)
}
// 运动记录批量删除
export function doSportHistoryDelMany(params) {
  return del('sport-history/deleteMany', params)
}
