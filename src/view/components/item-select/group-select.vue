<template>
  <div>
    <Select
      style="width: 250px"
      v-model="groupId"
      filterable
      remote
      @on-change="changeValue"
      :on-query-change="getGroups"
      :remote-method="getGroups"
      :placeholder="'请输入用户分组'"
      :loading="loading"
    >
      <Option
        v-for="(option, index) in options"
        :value="option.value"
        :label="option.name"
        :key="index"
      >
        <span>{{option.name}}</span>
        <span style="float:right;color:#ccc">{{option.phone}}</span>
      </Option>
    </Select>
  </div>
</template>
<script>
import { findUserGroupInfo } from '@/api/user-group'
export default {
  name: 'groupSelect',
  data() {
    return {
      groupId: '',
      options: [],
      loading: false
    }
  },
  methods: {
    // 返回选中id
    changeValue(value) {
      // console.log(value)
      this.$emit('on-change', value)
    },
    // 远程搜索用户选项
    async getGroups(query) {
      // 用户使用姓名
      let params = {
        name: query
      }
      this.loading = true
      let res = await findUserGroupInfo(params)
      this.loading = false
      if (res.code === 200) {
        this.options = res.data.list.map((item) => {
          return {
            name: item.name,
            value: item.id
          }
        })
      }
    }
  }
}
</script>
