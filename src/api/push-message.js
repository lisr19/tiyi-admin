// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 推送消息查询
export function findPushMessageInfo(params) {
  return fetch('push-message/page', params)
}
// 推送消息添加
export function doPushMessageAdd(params) {
  return post('push-message/send', params)
}
// 推送消息编辑
export function doPushMessageEdit(params) {
  return patch('push-message', params)
}
// 推送消息删除
export function doPushMessageDel(params) {
  return del('push-message/delete-many', params)
}
// 推送消息批量删除
export function doPushMessageDelMany(params) {
  return del('push-message/deleteMany', params)
}
