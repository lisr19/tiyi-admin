// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 反馈信息查询
export function findFeedbackInfo(params) {
  return fetch('feedback/page', params)
}
// 反馈信息添加
export function doFeedbackAdd(params) {
  return post('feedback', params)
}
// 反馈信息编辑
export function doFeedbackEdit(params) {
  return patch('feedback', params)
}
// 反馈信息删除
export function doFeedbackDel(params) {
  return del('feedback/delete-many', params)
}
// 反馈信息批量删除
export function doFeedbackDelMany(params) {
  return del('feedback/deleteMany', params)
}
