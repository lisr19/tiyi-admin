<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户列表</p>
      <Row>
        <Col span="10">
          <Button type="primary" style="width: 80px; margin:5px" @click="openUserAddModal">添加</Button>
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
          <Button type="primary" style="width: 80px;margin: 5px" @click="updateUserInfo">刷新</Button>
        </Col>

        <Col span="4" style="width:180px;margin:5px;"></Col>

        <Col span="4" style="float:right;margin:5px">
          <Input
            clearable
            icon="ios-search"
            v-model="searchOption.searchName"
            @on-change="searchUserByName"
            placeholder="输入姓名搜索"
          ></Input>
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <Table
          :columns="columnsList"
          :data="userData"
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
    <Modal v-model="isOpen" @on-cancel="cancelUserAddModal" :title="isAdd ? '添加用户' : '编辑用户'" width="600">
      <Form :model="userAddForm" ref="userAddForm" :rules="rules" :label-width="100">
        <Card>
          <FormItem v-if="isOpen && isAdd" label="头像：" prop="picture">
            <imgUpload @imgUpload="addUrl"></imgUpload>
          </FormItem>
          <FormItem v-if="isOpen && !isAdd" label="头像：" prop="picture">
            <imgUpload :defaultUrl="userAddForm.imgUrl" @imgUpload="addUrl"></imgUpload>
          </FormItem>
          <FormItem v-if="isOpen && isAdd" label="帐号/手机：" prop="phone">
            <Input clearable v-model="userAddForm.phone" placeholder="请填写手机号" style="width: 250px" />
          </FormItem>
          <FormItem v-if="isOpen && !isAdd" label="帐号/手机：" prop="phone">
            <p style="width: 250px">{{userAddForm.phone}}</p>
          </FormItem>
          <FormItem v-if="isOpen && isAdd" label="密码：" prop="password">
            <Input
              clearable
              placeholder="请填写密码"
              v-model="userAddForm.password"
              style="width: 250px"
            />
          </FormItem>
          <FormItem v-if="isOpen && !isAdd" label="密码：" prop="valiPassword">
            <Input
              clearable
              placeholder="不修改则不用填写"
              v-model="userAddForm.valiPassword"
              style="width: 250px"
            />
          </FormItem>
          <FormItem label="姓名：" prop="name">
            <Input clearable v-model="userAddForm.name" placeholder="请填写姓名" style="width: 250px" />
          </FormItem>

          <FormItem label="性别：" prop="sex">
            <Select clearable v-model="userAddForm.sex" placeholder="请选择性别" style="width: 250px">
              <Option value="0" key="0">男</Option>
              <Option value="1" key="1">女</Option>
              <Option value="2" key="2">无</Option>
            </Select>
          </FormItem>

          <FormItem label="学号：" prop="sid">
            <Input clearable v-model="userAddForm.sid" placeholder="请填写学号" style="width: 250px" />
          </FormItem>
          <FormItem label="身份证：" prop="idcard">
            <Input
              clearable
              v-model="userAddForm.idcard"
              placeholder="请填写身份证"
              style="width: 250px"
            />
          </FormItem>
          <FormItem label="出生日期：" prop="birthday">
            <DatePicker
              v-model="userAddForm.birthday"
              type="date"
              format="yyyy-MM-dd"
              placeholder="支持格式 YYYY-MM-DD 或 YYYY/MM/DD "
              style="width: 250px"
            ></DatePicker>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="text" @click="cancelUserAddModal">取消</Button>
        <Button type="primary" @click="addUser('userAddForm')">确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { findUserInfo, doUserAdd, doUserEdit, doUserDel } from '@/api/user'
import { findUserGroupInfoById } from '@/api/user-group'
import { formatDate } from '@/libs/util'
import imgUpload from '../components/img-upload/img-upload'
export default {
  name: 'user-basic',
  computed: {},
  components: {
    imgUpload
  },

  data() {

    return {
      isOpen: false,
      isAdd: false, // 真表示添加，假表示修改
      rules: {
        phone: [
          { required: true, message: '手机号不能为空' },
          { pattern: /^1[3|4|5|7|8][0-9]{9}$/, message: '请填写正确的手机号码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '姓名不能为空' },
          { pattern: /^[\u4e00-\u9fa5_a-zA-Z]+$/, message: '名字不能出现非法字符' },
          { max: 15, message: '名字过长' }
        ],
        sid: [
          { pattern: /^[0-9]+/, message: '请输入数字' },
          { max: 15, message: '学号过长' }
        ],
        password: [
          { required: true, message: '密码不能为空' },
          { pattern: /^[A-Za-z0-9_]{6,20}$/, message: '密码由字母、数字和下划线组成的6到20个字符'}
        ],
        valiPassword: [
          { pattern: /^[A-Za-z0-9_]{6,20}$/, message: '密码由字母、数字和下划线组成的6到20个字符'}
        ],
        idcard: [
          { max: 18, message: '身份证过长' }
        ]

      }, // 校验对象
      userData: [],
      // 用户列表表头数组
      columnsList: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: '头像',
          align: 'center',
          width: 120,
          key: 'imgUrl',
          render: (h, params) => {
            if (!params.row.imgUrl) {
              return
            }
            return h('img', {
              attrs: {
                src: params.row.imgUrl
              },
              style: {
                height: '75px',
                width: '75px',
                margin: '8px'
              }
            })
          }
        },
        {
          title: '帐号/手机',
          align: 'center',
          key: 'phone'
        },
        {
          title: '姓名',
          align: 'center',
          key: 'name'
        },
        {
          title: '性别',
          align: 'center',
          key: 'sex',
          render: (h, params) => {
            let sex = parseInt(params.row.sex)
            return h('span', [sex === 0 ? '男' : sex === 1 ? '女' : '无'])
          }
        },
        {
          title: '出生年月日',
          align: 'center',
          key: 'birthday'
        },
        {
          title: '学号',
          align: 'center',
          key: 'sid'
        },
        {
          title: '身份证',
          align: 'center',
          key: 'idcard',
          width: 180
        },
        {
          title: '操作',
          align: 'center',
          key: 'handle',
          width: 500,
          render: (h, params) => {
            return h('div', [
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
                      this.openUserEditModel(params.row)
                    }
                  }
                },
                '编辑'
              ),

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
                      this.getGroupInfo(params.row)
                    }
                  }
                },
                '分组'
              ),

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
                      this.getBodyInfo(params.row)
                    }
                  }
                },
                '体征'
              ),
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
                      this.getDietInfo(params.row)
                    }
                  }
                },
                '饮食'
              ),

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
                      this.getExerciseInfo(params.row)
                    }
                  }
                },
                '运动'
              ),

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
                      this.getFoodDefineInfo(params.row)
                    }
                  }
                },
                '自定义食物'
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
                        content: `<p>删除账号: ${params.row.phone} 后无法恢复,确认删除?</p>`,
                        okText: '确认',
                        onOk: () => {
                          let phone = params.row.id
                          this.deleteUserById(phone)
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
        pageNum: 1 // 当前页面
      },
      // 批量选择删除的帐号
      selectedUser: [],
      userAddForm: {}, // 用户添加表单对象
      searchOption: {} // 查询用参数
    }
  },
  created() {
    this.findUserInfo()
  },

  methods: {
    addUrl: function(e) {
      this.userAddForm.imgUrl = e
    },

    // 获取用户列表
    async findUserInfo() {
      let params = {
        name: this.searchOption.searchName,
        page: this.page.pageNum
      }

      let res = await findUserInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.userData = []
        res.data.list.forEach((item) => {
          this.userData.push({
            birthday: item.birthday ? formatDate(new Date(item.birthday), 'yyyy-MM-dd') : '',
            sid: item.studentNumber,
            id: item.id,
            phone: item.phone,
            idcard: item.idNumber,
            sex: item.gender.toString(),
            name: item.name,
            imgUrl: item.imgUrl ? (/^http.+$/.test(item.imgUrl) ? item.imgUrl : 'http://' + item.imgUrl) : item.imgUrl
          })
        })
        this.page = {
          total: res.data.total,
          pageNum: res.data.pageNum
        }

        // 数据同步
        // 别的管理员可能删除了数据
        if (res.data.list.length === 0 && res.data.total > 0) {
          this.page.pageNum = Math.ceil(res.data.total / res.data.pageSize)
          this.findUserInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
    },

    updateUserInfo() {
      this.page.pageNum = 1
      this.searchOption = {}
      this.findUserInfo()
    },

    searchUserByName() {
      this.page.pageNum = 1
      this.findUserInfo()
    },

    // 批量选择
    batchSelect(selection) {
      this.selectedUser = []
      selection.forEach((row) => {
        this.selectedUser.push(row.id)
      })
    },

    async deleteUserById(id) {
      let params = {
        ids: id
      }
      let res = await doUserDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findUserInfo()
      } else {
        this.$Message.error(res.data)
      }
    },

    async getGroupInfo(user) {
      let params = {
        userId: user.id
      }
      console.log(params)
      let res = await findUserGroupInfoById(params)
      if (res.code === 200) {
        if (res.data.list.length === 0) {
          this.$Modal.info({
            title: '组别',
            content: '暂不属于任一组别'
          })
        } else {
          let groups = res.data.list.map(item => {
            return item.name
          })
          this.$Modal.info({
            title: '用户所属组别',
            content: groups.join(',')
          })
        }
      } else {
        this.$Message.error(res.data)
      }
    },

    getBodyInfo(user) {
      this.$router.push({
        name: 'user-body',
        params: {
          userId: user.id,
          searchName: user.name
        }
      })
    },

    getDietInfo(user) {
      this.$router.push({
        name: 'user-diet',
        params: {
          userId: user.id,
          searchName: user.name
        }
      })
    },

    getExerciseInfo(user) {
      this.$router.push({
        name: 'user-exercise',
        params: {
          userId: user.id,
          searchName: user.name
        }
      })
    },

    getFoodDefineInfo(user) {
      this.$router.push({
        name: 'user-food-define',
        params: {
          userId: user.id,
          searchName: user.name
        }
      })
    },

    batchDelClick() {
      if (this.selectedUser.length === 0) {
        this.$Message.info('请选择删除帐号')
        return
      }
      this.$Modal.confirm({
        title: '请确认删除',
        content: `<p>删除所选账号后无法恢复,确认删除?</p>`,
        okText: '确认',
        onOk: () => {
          this.deleteSelectedUser()
        },
        // 取消删除
        onCancel: () => {
          this.$Message.info('取消删除！')
        }
      })
    },

    async deleteSelectedUser() {
      let params = {
        ids: this.selectedUser.join(',')
      }
      let res = await doUserDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        this.findUserInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedUser = []
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findUserInfo()
    },

    // 用户添加modal打开
    openUserAddModal() {
      this.userAddForm = {}
      this.$refs.userAddForm.resetFields()
      this.isAdd = true
      this.isOpen = true
    },

    openUserEditModel(userInfo) {
      // this.userAddForm = userInfo
      // 后面的属性会覆盖前面的属性
      this.isAdd = false
      this.isOpen = true
      this.userAddForm = Object.assign({}, userInfo)
    },

    // 用户添加modal关闭
    cancelUserAddModal() {
      // 重置用户添加表单对象
      this.$refs.userAddForm.resetFields()
      this.isOpen = false
    },

    addUser(userAddForm) {
      this.$refs[userAddForm].validate(async (valid) => {
        if (valid) {
          let params = {
            phone: this.userAddForm.phone,
            name: this.userAddForm.name,
            gender: this.userAddForm.sex ? this.userAddForm.sex : 2,
          }
          if (this.userAddForm.studentNumber) {
            params.studentNumber = this.userAddForm.sid
          }
          if (this.userAddForm.idcard) {
            params.idNumber = this.userAddForm.idcard
          }
          if (this.userAddForm.imgUrl) {
            params.imgUrl = this.userAddForm.imgUrl
          }
          if (this.userAddForm.birthday) {
            params.birthday = formatDate(this.userAddForm.birthday, 'yyyy-MM-dd hh:mm:ss')
          }
          if (this.isAdd) {
            // 添加
            params.password = this.userAddForm.password
            let res = await doUserAdd(params)
            if (res.code === 200) {
              // 刷新
              await this.findUserInfo()
              this.$Message.success('添加成功')
            } else {
              this.$Message.error(res.data)
            }
          } else {
            // 编辑
            params.id = this.userAddForm.id
            if (this.userAddForm.valiPassword) {
              params.password = this.userAddForm.valiPassword
            }
            let res = await doUserEdit(params)
            if (res.code === 200) {
              // 刷新
              await this.findUserInfo()
              this.$Message.success('编辑成功')
            } else {
              this.$Message.error(res.data)
            }
          }
          this.$refs.userAddForm.resetFields()
          this.userAddForm = {}
          this.isOpen = false
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style scoped>
</style>
