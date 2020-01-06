import { fetch, post, del, post4JSON } from '@/libs/http.js'

// 添加氨基酸
export function doAminoAdd(params) {
  return post('amino', params)
}
// 批量添加氨基酸
export function doAminoAddMany(params) {
  return post4JSON('amino/add-many', params)
}
// 删除氨基酸
export function doAminoDel(params) {
  return del('amino', params)
}

// 批量删除氨基酸
export function doAminoDelMany(params) {
  return del('amino/delete-many', params)
}

// 查询氨基酸
export function findAminoInfo(params) {
  return fetch('amino/page', params)
}
