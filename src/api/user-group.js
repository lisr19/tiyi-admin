import { fetch, post, patch, del } from '@/libs/http.js'
// 添加用户组
export function doUserGroupAdd(params) {
  return post('user-group', params)
}
// 删除用户组
export function doUserGroupDel(params) {
  return del('user-group', params)
}
// 修改用户组
export function doUserGroupEdit(params) {
  return patch('user-group', params)
}

// 批量删除用户组
export function doUserGroupDelMany(params) {
  return del('user-group/delete-many', params)
}
// 查询用户组
export function findUserGroupInfo(params) {
  return fetch('user-group/page', params)
}
// 根据用户ID查询用户组
export function findUserGroupInfoById(params) {
  return fetch('user-group/page-by-user-id', params)
}
