// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 用户基本信息查询
export function findUserBodyInfo(params) {
  return fetch('user-physical-signs/page', params)
}
// 用户基本信息添加
export function doUserBodyAdd(params) {
  return post('user-physical-signs', params)
}
// 用户基本信息编辑
export function doUserBodyEdit(params) {
  return patch('user-physical-signs', params)
}
// 用户基本信息删除
export function doUserBodyDel(params) {
  return del('user-physical-signs/delete-many', params)
}
// 用户基本信息批量删除
export function doUserBodyDelMany(params) {
  return del('user-physical-signs/deleteMany', params)
}
