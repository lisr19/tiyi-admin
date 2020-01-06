import { fetch, post, del, post4JSON } from '@/libs/http.js'
// 添加一般营养素
export function doNutriAdd(params) {
  return post('nutri', params)
}
// 批量添加一般营养素
export function doNutriAddMany(params) {
  return post4JSON('nutri/add-many', params)
}
// 删除一般营养素
export function doNutriDel(params) {
  return del('nutri', params)
}

// 批量删除一般营养素
export function doNutriDelMany(params) {
  return del('nutri/delete-many', params)
}

// 查询一般营养素
export function findNutriInfo(params) {
  return fetch('nutri/page', params)
}
