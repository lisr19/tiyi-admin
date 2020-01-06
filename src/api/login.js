import { fetch, post, patch, del } from '../libs/http'

// 管理员登录
export function login (params) {
  return post('manager/login', params)
}
