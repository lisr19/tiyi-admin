// import axios from '@/libs/api.request'
import { fetch, post, patch, del } from '@/libs/http.js'

// 用户基本信息查询
export function findUserInfo(params) {
  return fetch('user/page', params)
}
// 用户基本信息添加
export function doUserAdd(params) {
  return post('user', params)
}
// 用户基本信息编辑
export function doUserEdit(params) {
  return patch('user', params)
}
// 用户基本信息删除
export function doUserDel(params) {
  return del('user/delete-many', params)
}
// 用户基本信息批量删除
export function doUserDelMany(params) {
  return del('user/deleteMany', params)
}
// 根据用户组ID查询用户分页列表
export function findUserInfoByGroupId(params) {
  return fetch('user/page-by-user-group-id', params)
}
// 不再可用用户组中的用户
export function getUserNotInGroupp(params) {
  return fetch('user/page-not-in-enable-group', params)
}
//  用户组添加用户
export function addUserToGroup(params) {
  return post('user/add-to-user-group', params)
}
// 用户组删除用户
export function deleteUserFromGroup(params) {
  return post('user/delete-user-from-user-group', params)
}

// export const login = ({ userName, password }) => {
//   const data = {
//     userName,
//     password
//   }
//   return axios.request({
//     url: 'login',
//     data,
//     method: 'post'
//   })
// }
//
// export const getUserInfo = (token) => {
//   return axios.request({
//     url: 'get_info',
//     params: {
//       token
//     },
//     method: 'get'
//   })
// }
//
// export const logout = (token) => {
//   return axios.request({
//     url: 'logout',
//     method: 'post'
//   })
// }
//
// export const getUnreadCount = () => {
//   return axios.request({
//     url: 'message/count',
//     method: 'get'
//   })
// }
//
// export const getMessage = () => {
//   return axios.request({
//     url: 'message/init',
//     method: 'get'
//   })
// }
//
// export const getContentByMsgId = msg_id => {
//   return axios.request({
//     url: 'message/content',
//     method: 'get',
//     params: {
//       msg_id
//     }
//   })
// }
//
// export const hasRead = msg_id => {
//   return axios.request({
//     url: 'message/has_read',
//     method: 'post',
//     data: {
//       msg_id
//     }
//   })
// }
//
// export const removeReaded = msg_id => {
//   return axios.request({
//     url: 'message/remove_readed',
//     method: 'post',
//     data: {
//       msg_id
//     }
//   })
// }
//
// export const restoreTrash = msg_id => {
//   return axios.request({
//     url: 'message/restore',
//     method: 'post',
//     data: {
//       msg_id
//     }
//   })
// }
