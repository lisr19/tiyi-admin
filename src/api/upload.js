import { post } from '../libs/http'

export function uploadImg(params) {
  return post('upload/img', params)
}
