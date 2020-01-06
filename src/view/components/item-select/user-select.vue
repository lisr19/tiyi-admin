<template>
  <div>
    <Select
        style="width: 250px"
        v-model="userId"
        filterable
        remote
        @on-change="changeValue"
        :on-query-change="getUsers"
        :remote-method="getUsers"
        :placeholder="userType === 'manager' ? '请输入管理员帐号': '请输入用户姓名'"
        :loading="loading">
        <Option v-for="(option, index) in options" :value="option.value" :label="option.name" :key="index">
        <span> {{option.name}} </span>
        <span style="float:right;color:#ccc"> {{option.phone}} </span>
        </Option>
    </Select>
  </div>
</template>
<script>
import { findUserInfo } from '@/api/user'
import { findManagerInfo } from '@/api/manager'
export default {
  name: 'userSelect',
  props: ['userType'],
  data () {
    return {
      userId: '',
      options: [],
      loading: false
    }
  },
  methods: {
    // 返回选中id
    changeValue (value) {
      // console.log(value)
      this.$emit('on-change', value)
    },
    // 远程搜索用户选项
    async getUsers(query) {
      // 用户使用姓名
      if (this.userType === 'user') {
        let params = {
          name: query
        }
        this.loading = true
        let res = await findUserInfo(params)
        this.loading = false
        if (res.code === 200) {
          this.options = res.data.list.map(item => {
            return {
              name: item.name,
              phone: item.phone,
              value: item.id
            }
          })
        }
      }
      // 管理员使用帐号
      else if (this.userType === 'manager') {
        let params = {
          username: query
        }
        let res = await findManagerInfo(params)
        if (res.code === 200) {
          this.options = res.data.list.map(item => {
            return {
              name: item.username,
              phone: item.phone,
              value: item.id
            }
          })
        }
      }
    }
  },
  mounted () {

  },
  created() {

  }
}
</script>
