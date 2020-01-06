
<template>
  <div>
    <!--按钮部分-->

    <Card>
      <p slot="title">管理员登陆信息</p>
      <Row>
        <Col span="3">
          <Input
            @on-change="handleSearch"
            v-model="searchValue.managerPhone"
            clearable
            icon="search"
            placeholder="输入手机查询"
          />
        </Col>
        <Col span="3" offset="1">
          <Input
            @on-change="handleSearch"
            v-model="searchValue.managerName"
            clearable
            icon="search"
            placeholder="输入姓名查询"
          />
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <Table :columns="columns" :data="showData" border disabled-hover></Table>
      </div>

      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <!--页码部分-->
          <Page
            show-total
            :page-size="page.pageSize"
            show-elevator
            :total="page.total"
            :current="page.pageNum"
            @on-change="handlePageTurn"
          ></Page>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import { findManagerLogin } from '@/api/manager'

export default {
  name: 'manager-login',
  data() {
    return {
      debug: false,
      columns: [], // 表格的表头
      page: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      searchValue: {},
      showData: [], // 当前显示的数据
      errorMes: '网络异常,请联系管理员'
    }
  },

  created() {
    this.columnsInit() // 初始化表格表头
    this.handlePageTurn(1)
  },
  methods: {
    // 初始化表头
    columnsInit() {
      this.columns = []
      let title = ['登录时间', '姓管理员名称', '管理员手机号']
      let key = ['loginTime', 'managerName', 'managerPhone']
      for (let i = 0; i < title.length; i++) {
        this.columns.push({ title: title[i], align: 'center', key: key[i] })
      }
    },

    // 页面翻页
    // pageIndex 翻到第pageIndex页
    async handlePageTurn(pageIndex) {
      // pageIndex不能小于一
      pageIndex = pageIndex < 1 ? 1 : pageIndex
      this.searchValue.page = pageIndex
      let res = await findManagerLogin(this.searchValue)
      if (this.debug) console.log('查询结果：', res)
      if (res.code !== 200) {
        this.$Message.error(res.data)
      } else {
        let data = res.data
        // 查询成功
        // 如果当前页面没有数据
        if (data.list.length === 0 && this.page.pageNum !== 1) {
          this.handlePageTurn(1)
          return
        }
        // 更新页面
        this.showData = data.list
        this.page = {
          total: data.total,
          pageNum: data.pageNum,
          pageSize: data.pageSize
        }
      }
    },

    // 处理查询
    handleSearch() {
      this.handlePageTurn(1)
    }
  }
}
</script>

<style scoped>
</style>
