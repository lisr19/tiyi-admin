<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">推送信息</p>
      <Row>
        <Col span="10">
          <Button
            type="primary"
            style="width: 120px; margin:5px"
            @click="openItemAddModal('个人')"
          >推送信息(个人)</Button>
          <Button
            type="primary"
            style="width: 120px; margin:5px"
            @click="openItemAddModal('用户组')"
          >推送信息(用户组)</Button>
          <Button type="error" style="width: 120px;margin: 5px" @click="batchDelClick">批量删除</Button>
        </Col>
        <Col span="4" style="float:right;margin:5px;">
          <Input
            clearable
            icon="search"
            @on-change="searchMessage"
            v-model="searchOption.userName"
            placeholder="输入用户姓名搜索"
          />
        </Col>
        <Col span="4" style="float:right;margin:5px;">
          <Input
            clearable
            icon="search"
            @on-change="searchMessage"
            v-model="searchOption.managerName"
            placeholder="输入管理者名称搜索"
          />
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <Table
          :columns="columnsList"
          :data="itemData"
          border
          @on-selection-change="batchSelect"
          disabled-hover
        ></Table>
      </div>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page
            show-total
            show-elevator
            :total="page.total"
            :current="page.currentPage"
            @on-change="handlePageTurn"
          ></Page>
        </div>
      </div>
    </Card>

    <!--添加用户Modal-->
    <Modal
      v-model="isOpen"
      @on-cancel="cancelItemAddModal"
      :title="isAdd ? '添加推送信息' : '编辑推送信息'"
      width="600"
    >
      <Form :model="itemAddForm" ref="itemAddForm" :rules="rules" :label-width="120">
        <Card>
          <FormItem v-if="isOpen && isAdd && isAddUser" label="用户姓名：" prop="userId">
            <userSelect userType="user" @on-change="changeUserId"></userSelect>
          </FormItem>
          <FormItem v-if="isOpen && isAdd && !isAddUser" label="分组：" prop="groupId">
            <groupSelect @on-change="changeGroupId"></groupSelect>
          </FormItem>
          <FormItem label="消息内容：" prop="content">
            <Input
              type="textarea"
              v-model="itemAddForm.content"
              :rows="5"
              placeholder="请填写推送信息"
              style="width: 300px"
            />
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="text" @click="cancelItemAddModal">取消</Button>
        <Button type="primary" @click="addItem('itemAddForm')">确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { findUserInfoByGroupId } from '@/api/user'
import groupSelect from '../components/item-select/group-select'
import userSelect from '../components/item-select/user-select'
import { findPushMessageInfo, doPushMessageAdd, doPushMessageEdit, doPushMessageDel } from '@/api/push-message'
export default {
  name: 'message',
  components: {
    groupSelect,
    userSelect
  },
  computed: {
    managerId() {
      // 当前登陆的管理员id
      return this.$store.state.user.userId
    }
  },
  data() {
    return {
      isOpen: false,
      isAdd: false,
      isAddUser: false, // 为单个用户推送消息
      itemData: [],
      rules: {
        groupId: [{ required: true, message: '必须选择用户分组' }],
        content: [{ required: true, message: '消息内容不能为空' }],
        userId: [{ required: true, message: '用户姓名不能为空' }]
      }, // 校验对象
      // 用户列表表头数组
      columnsList: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: '用户姓名',
          align: 'center',
          key: 'userName',
          width: 100
        },
        {
          title: '管理员姓名',
          align: 'center',
          key: 'managerName',
          width: 100
        },
        {
          title: '记录时间',
          align: 'center',
          key: 'createTime',
          width: 150
        },

        {
          title: '内容',
          align: 'center',
          key: 'content'
        },

        {
          title: '是否已读',
          align: 'center',
          width: 100,
          render: (h, params) => {
            return h('div', params.row.read === 1 ? '是' : '否')
          }
        },

        {
          title: '操作',
          align: 'center',
          key: 'handle',
          width: 250,
          render: (h, params) => {
            return h('div', [
              // h('Button', {
              //   props: {
              //     type: 'primary'
              //   },
              //   style: {
              //     marginRight: '5px'
              //   },
              //   on: {
              //     click: async () => {
              //       let p = params.row
              //       if (params.row.read === 0) {
              //         p.read = 1
              //       } else if (params.row.read === 1) {
              //         p.read = 0
              //       }
              //       let res = await doPushMessageEdit(p)
              //     }
              //   }
              // }, params.row.read ? '标记已读' : '标记未读'),
              h(
                'Button',
                {
                  props: {
                    type: 'primary'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.openItemEditModel(params.row)
                    }
                  }
                },
                '编辑'
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'error'
                  },
                  style: {},
                  on: {
                    click: () => {
                      this.$Modal.confirm({
                        title: '请确认删除',
                        content: `<p>删除记录后无法恢复,确认删除?</p>`,
                        okText: '确认',
                        onOk: () => {
                          let id = params.row.id
                          this.deleteItemById(id)
                        },
                        // 取消删除
                        onCancel: () => {
                          this.$Message.info('取消删除！')
                        }
                      })
                    }
                  }
                },
                '删除'
              )
            ])
          }
        }
      ],
      page: {
        // 页面翻页对象
        total: 1, // 数据总数
        currentPage: 1 // 当前页面
      },
      itemAddForm: {},
      // 批量选择删除的记录
      selectedItem: [],

      searchOption: {} // 查询用参数
    }
  },

  mounted() {
    this.findPushMessageInfo()
  },
  methods: {
    // 获取用户列表
    async findPushMessageInfo() {
      let params = {
        userId: this.searchOption.userId,
        userName: this.searchOption.userName,
        managerName: this.searchOption.managerName,
        page: this.page.pageNum
      }
      let res = await findPushMessageInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = res.data.list
        this.page = {
          total: res.data.total,
          pageNum: res.data.pageNum
        }

        // 数据同步
        // 别的管理员可能删除了数据
        if (res.data.list.length === 0 && res.data.total > 0) {
          this.page.pageNum = Math.ceil(res.data.total / res.data.pageSize)
          this.findPushMessageInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
    },
    // 批量选择
    batchSelect(selection) {
      this.selectedItem = []
      selection.forEach((row) => {
        this.selectedItem.push(row.id)
      })
    },

    async deleteItemById(id) {
      let params = {
        ids: id
      }
      let res = await doPushMessageDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findPushMessageInfo()
      } else {
        this.$Message.error(res.data)
      }
    },

    // 用户添加modal打开
    openItemAddModal(type) {
      this.itemAddForm = {}
      this.$refs.itemAddForm.resetFields()
      this.isAdd = true
      if (type === '个人') this.isAddUser = true
      else this.isAddUser = false
      this.isOpen = true
    },

    openItemEditModel(itemInfo) {
      // 后面的属性会覆盖前面的属性
      this.itemAddForm = {}
      Object.assign(this.itemAddForm, itemInfo)
      this.isAdd = false
      this.isOpen = true
    },

    // 用户添加modal关闭
    cancelItemAddModal() {
      // 重置用户添加表单对象
      this.isOpen = false
    },
    async doPushMessageAddToAGroup(itemAddForm) {
      let res = await findUserInfoByGroupId({ userGroupId: itemAddForm.groupId })
      let total = res.data.total
      res = await findUserInfoByGroupId({ userGroupId: itemAddForm.groupId, size: total })
      let data = res.data.list
      for (let i = 0; i < data.length; i++) {
        await doPushMessageAdd({ content: itemAddForm.content, managerId: itemAddForm.managerId, userId: data[i].id })
      }
      // 刷新
      await this.findPushMessageInfo()
    },
    addItem(itemAddForm) {
      this.$refs[itemAddForm].validate(async (valid) => {
        if (valid) {
          if (this.isAdd) {
            this.itemAddForm.managerId = this.managerId
            if (!this.isAddUser) {
              await this.doPushMessageAddToAGroup(this.itemAddForm)
              this.$refs.itemAddForm.resetFields()
              this.itemAddForm = {}
              this.isOpen = false
              return
            }
            let res = await doPushMessageAdd(this.itemAddForm)
            if (res.code === 200) {
              // 刷新
              await this.findPushMessageInfo()
              this.$Message.success('添加成功')
            } else {
              this.$Message.error(res.message)
            }
          } else {
            // 编辑
            let params = {
              id: this.itemAddForm.id,
              content: this.itemAddForm.content
            }
            await doPushMessageEdit(params)
            await this.findPushMessageInfo()
          }
          this.$refs.itemAddForm.resetFields()
          this.itemAddForm = {}
          this.isOpen = false
        } else {
          return false
        }
      })
    },

    // 记录选择的用户id
    changeUserId: function(e) {
      this.$set(this.itemAddForm, 'userId', e)
    },
    // 记录选择的用户组id
    changeGroupId: function(e) {
      this.$set(this.itemAddForm, 'groupId', e)
    },

    searchMessage() {
      this.page.pageNum = 1
      this.findPushMessageInfo()
    },

    batchDelClick() {
      if (this.selectedItem.length === 0) {
        this.$Message.info('请选择删除的纪录')
        return
      }
      this.$Modal.confirm({
        title: '请确认删除',
        content: `<p>删除所选记录后无法恢复,确认删除?</p>`,
        okText: '确认',
        onOk: () => {
          this.deleteSelectedItem()
        },
        // 取消删除
        onCancel: () => {
          this.$Message.info('取消删除！')
        }
      })
    },
    async deleteSelectedItem() {
      let params = {
        ids: this.selectedItem.join(',')
      }
      let res = await doPushMessageDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findPushMessageInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedId = []
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findPushMessageInfo()
    }
  }
}
</script>

<style scoped>
</style>
