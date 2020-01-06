
<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">{{title}}</p>
      <Row>
        <Col span="3">
          <Button :type="buttonType1" style="width: 110px;" @click="changeUserModal">{{buttonText1}}</Button>
        </Col>

        <Col span="3">
          <Button
            :type="buttonType2"
            style="width: 110px;"
            @click="confirmSeletedObject"
          >{{buttonText2}}</Button>
        </Col>
        <Col span="8" offset="10" v-show="isAddingUser">
          <Row v-if="false">
            <Col span="11">
              <Select v-model="searchKey">
                <Option
                  v-for="item in searchOption"
                  :value="item.key"
                  :key="item.key"
                >{{ item.value }}</Option>
              </Select>
            </Col>
            <Col span="11" offset="2">
              <Input
                placeholder="没有查询接口，不要碰"
                class="search-input"
                v-model="searchValue"
                clearable
                @on-change="handleSearch() "
                icon="search"
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <Table
          :columns="columns"
          :data="showData"
          border
          @on-selection-change="batchSelect"
          disabled-hover
        ></Table>
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
import { findUserInfoByGroupId, getUserNotInGroupp, deleteUserFromGroup, addUserToGroup } from '@/api/user'

export default {
  props: {
    group: {},
    showModal: false
  },
  data: function() {
    return {
      debug: false,
      // groupId: this.groupId,
      seletedObjectId: [], // 被选中的对象
      columns: [], // 表格的表头
      page: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      pageAdd: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      pageDel: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      searchOption: [{ value: '姓名', key: 'name' }, { value: '手机', key: 'phone' }, { value: '学号', key: 'studentNumber' }],
      searchValue: '',
      searchKey: '',
      showData: [], // 当前显示的数据
      errorMes: '网络异常,请联系管理员',
      action: '删除',
      buttonType1: 'primary',
      buttonType2: 'error',
      buttonText1: '添加',
      buttonText2: '批量删除',
      title: '添加新成员',
      isAddingUser: false
    }
  },
  watch: {
    group: function(newValue, oldValue) {
      this.dataUpdate()
    },
    showModal: function(val) {
      this.seletedObjectId = []
      if (val) {
        this.dataUpdate()
      } else {
        this.isAddingUser = false
        this.updataShow()
      }
    }
  },
  methods: {
    async dataUpdate() {
      this.searchValue = ''
      await this.findUserInfoByGroupId({ userGroupId: this.group.id })
      await this.getUserNotInGroupp({})
      this.updataShow()
    },
    columnsInit() {
      this.columns = []
      this.columns.push({ type: 'selection', width: 60, align: 'center' })
      this.columns.push({ title: '姓名', align: 'center', key: 'name' })
      this.columns.push({ title: '手机', align: 'center', key: 'phone' })
      this.columns.push({ title: '学号', align: 'center', key: 'studentNumber' })
      this.columns.push({
        title: '操作',
        align: 'center',
        key: 'handle',
        width: 300,
        render: (h, params) => {
          return h('div', [
            h(
              'Button',
              {
                props: {
                  type: this.buttonType2
                },
                on: {
                  click: () => {
                    this.editGroupUser([params.row.id])
                  }
                }
              },
              this.action
            )
          ])
        }
      })
    },
    // 页面翻页
    // pageIndex 翻到第pageIndex页
    handlePageTurn(pageIndex) {
      if (pageIndex < 1) {
        pageIndex = 1
      }
      if (this.isAddingUser) {
        this.getUserNotInGroupp({ page: pageIndex })
      } else {
        this.findUserInfoByGroupId({ page: pageIndex, userGroupId: this.group.id })
      }
    },
    // 处理查询
    handleSearch() {
      if (this.debug) console.log('搜索：', this.searchValue)
      let searchObj = {}
      searchObj[this.searchKey] = this.searchValue
      this.page.pageNum = 1
      this.getUserNotInGroupp(searchObj)
    },
    // 存储所有的勾选的对象的id
    batchSelect(selection) {
      this.seletedObjectId = []
      if (this.debug) console.log(selection)
      selection.forEach((row) => {
        this.seletedObjectId.push(row.id)
      })
    },

    // 确认批量操作
    confirmSeletedObject() {
      if (this.seletedObjectId.length === 0) {
        this.$Message.info('请选择批量操作的对象')
        return
      }
      let obj = { ids: '' }
      obj.ids = this.seletedObjectId.join(',')

      this.$Modal.confirm({
        title: this.isAddingUser ? '请确认批量添加用户' : '请确认从用户组中移除用户',
        okText: '确认',
        onOk: () => {
          this.editGroupUser(this.seletedObjectId)
        },
        onCancel: () => {
          this.$Message.info('取消')
        }
      })
    },
    // 打开成员添加modal
    changeUserModal() {
      this.seletedObjectId = []
      this.isAddingUser = !this.isAddingUser
      this.updataShow()
    },
    updataShow() {
      let add = this.isAddingUser
      this.title = add ? this.group.name + '添加新成员' : this.group.name + '成员列表'
      this.action = add ? '添加' : '删除'
      this.buttonText1 = add ? '返回' : '添加'
      this.buttonText2 = add ? '批量添加' : '批量删除'
      this.buttonType1 = add ? 'error' : 'primary'
      this.buttonType2 = add ? 'primary' : 'error'
      this.page = add ? this.pageAdd : this.pageDel
      this.showData = add ? this.userNotInGroup : this.userInGroup
      this.columnsInit()
    },
    // 从用户组中添加/删除用户 by ids
    async editGroupUser(ids) {
      if (this.debug) {
        console.log('editGroupUser')
        console.log('ids:', ids)
      }
      if (this.isAddingUser) {
        for (let j = 0; j < ids.length; j++) {
          await this.addUserToGroup({ userId: ids[j], userGroupId: this.group.id })
        }
      } else {
        for (let j = 0; j < ids.length; j++) {
          await this.deleteUserFromGroup({ userId: ids[j], userGroupId: this.group.id })
        }
      }
      this.dataUpdate()
    },
    // 查询
    async getUserNotInGroupp(obj) {
      let res = await getUserNotInGroupp(obj)
      if (this.debug) console.log('查询结果：', res)
      if (res.code === 200) {
        // 查询成功,更新页面
        this.userNotInGroup = res.data.list
        this.pageAdd = {
          total: res.data.total,
          pageNum: res.data.pageNum,
          pageSize: res.data.pageSize
        }
      } else {
        this.$Message.error(res.data)
      }
      this.updataShow()
    },
    async findUserInfoByGroupId(obj) {
      let res = await findUserInfoByGroupId(obj)
      if (this.debug) console.log('查询结果：', res)
      if (res.code === 200) {
        // 查询成功,更新页面
        this.userInGroup = res.data.list
        this.pageDel = {
          total: res.data.total,
          pageNum: res.data.pageNum,
          pageSize: res.data.pageSize
        }
      } else {
        this.$Message.error(res.data)
      }
      this.updataShow()
    },

    async addUserToGroup(obj) {
      let res = await addUserToGroup(obj)
      if (this.debug) {
        console.log('添加用户obj', obj)
        console.log('添加用户res', res)
      }
      if (res.code === 200) {
        // 成功
        if (this.showData.length === 1) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 删除
    async deleteUserFromGroup(obj) {
      let res = await deleteUserFromGroup(obj)
      if (this.debug) {
        console.log('移除用户obj', obj)
        console.log('移除用户res', res)
      }
      if (res.code === 200) {
        // 删除成功

        if (this.showData.length === 1) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    }
  }
}
</script>
