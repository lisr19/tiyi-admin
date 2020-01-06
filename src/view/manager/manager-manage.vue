
<template>
  <div>
    <!--按钮部分-->

    <Card>
      <p slot="title">管理员信息管理</p>
      <Row>
        <Col span="3">
          <Button type="primary" style="width: 110px;" @click="openModal(null)">添加</Button>
        </Col>

        <Col span="3">
          <Button type="error" style="width: 110px;" @click="confirmDeleteSeletedObject">批量删除</Button>
        </Col>
        <Col span="3" offset="15">
          <Input
            @on-change="handleSearch"
            v-model="searchValue.name"
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

    <!--添加/编辑管理员Modal-->

    <Modal v-model="showModal" @on-cancel="cancelModal" :title="modalTitle" width="400">
      <Form :model="managerForm" ref="managerForm" :rules="rules" :label-width="90">
        <Card>
          <FormItem label="用户名：" prop="username">
            <Input
              :disabled="isEditing"
              v-model="managerForm.username"
              placeholder="请填写用户名"
              style="width: 200px"
            />
          </FormItem>
          <FormItem v-if="isAdding" label="密码：" prop="password">
            <Input
              type="password"
              clearable
              v-model="managerForm.password"
              placeholder="请填写密码"
              style="width: 200px"
            />
          </FormItem>
          <FormItem v-if="isAdding" label="密码确认：" prop="passwordConfirm">
            <Input
              type="password"
              clearable
              v-model="managerForm.passwordConfirm"
              placeholder="请重复你填写的密码"
              style="width: 200px"
            />
          </FormItem>
          <FormItem v-if="isEditing" label="密码：" prop="passwordEdit">
            <Input
              type="password"
              clearable
              v-model="managerForm.passwordEdit"
              placeholder="请填写密码"
              style="width: 200px"
            />
          </FormItem>
          <FormItem v-if="isEditing" label="密码确认：" prop="passwordConfirmEdit">
            <Input
              type="password"
              clearable
              v-model="managerForm.passwordConfirmEdit"
              placeholder="请重复你填写的密码"
              style="width: 200px"
            />
          </FormItem>
          <FormItem v-if="false" label="角色：" prop="role">
            <Input
              type="number"
              v-model.number="managerForm.role"
              placeholder="请填写角色"
              style="width: 200px"
            />
          </FormItem>
          <FormItem label="姓名：" prop="name">
            <Input clearable v-model="managerForm.name" placeholder="请填写姓名" style="width: 200px" />
          </FormItem>
          <FormItem label="手机：" prop="phone">
            <Input clearable v-model="managerForm.phone" placeholder="请填写手机" style="width: 200px" />
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmit('managerForm')">确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { doManagerAdd, doManagerDel, doManagerEdit, doManagerDelMany, findManagerInfo } from '@/api/manager'

export default {
  name: 'manager-manage',
  computed: {
    userName() {
      return this.$store.state.user.userName
    },
    userId() {
      return this.$store.state.user.userId
    }
  },
  data() {
    return {
      debug: false,
      modalTitle: '',
      rules: {}, // 校验规则
      seletedObjectId: [], // 被选中的对象
      managerForm: {}, // 正在被编辑的对象
      showModal: false, // 是否显示modal
      isAdding: false, // 是否在正在添加管理员
      isEditing: false, // 是否在正在编辑管理员
      columns: [], // 表格的表头
      page: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      searchValue: {},
      showData: [], // 当前显示的数据
      errorMes: '网络异常,请联系管理员',

      uploadLoading: false, // 正在导入
      exportLoading: false // 正在导出
    }
  },

  created() {
    this.columnsInit() // 初始化表格表头
    this.handlePageTurn(1)
    this.ruleInit() // 初始化校验规则
  },
  methods: {
    // 初始化表头
    columnsInit() {
      this.columns = []
      this.columns.push({ type: 'selection', width: 60, align: 'center' })

      let title = ['用户名', '姓名', '手机']
      let key = ['username', 'name', 'phone']
      for (let i = 0; i < title.length; i++) {
        this.columns.push({ title: title[i], width: 120, align: 'center', key: key[i] })
      }
      this.columns.push({
        title: '是否禁用',
        width: 150,
        align: 'center',
        key: 'enable',
        render: (h, params) => {
          var show = params.row.enable ? '已启用' : '已禁用'
          return h('span', show)
        }
      })
      this.columns.push({
        title: '操作',
        align: 'center',
        key: 'handle',
        render: (h, params) => {
          if (params.row.id === this.userId) return h('span', '当前登陆的管理员')
          return h('div', [
            h(
              // 禁用，启用
              'Button',
              {
                props: {
                  type: params.row.enable ? 'error' : 'primary'
                },
                style: {
                  marginRight: '40px'
                },
                on: {
                  click: () => {
                    params.row.enable = params.row.enable ? 0 : 1
                    this.doManagerEdit(params.row)
                  }
                }
              },
              params.row.enable ? '禁用' : '启用'
            ),
            h(
              'Button',
              {
                props: {
                  type: 'primary'
                },
                style: {
                  marginRight: '40px'
                },
                on: {
                  click: () => {
                    this.openModal(params.row)
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
                on: {
                  click: () => {
                    this.$Modal.confirm({
                      title: '请确认删除',
                      content: `<p>删除管理员: “${params.row.name}” 后无法恢复,确认删除?</p>`,
                      okText: '确认',
                      onOk: () => {
                        if (this.debug) console.log('确认删除', h, params)
                        this.doManagerDel(params.row)
                      },
                      // 取消删除
                      onCancel: () => {
                        this.$Message.info('取消删除')
                      }
                    })
                  }
                }
              },
              '删除'
            )
          ])
        }
      })
    },
    // 初始化校验规则
    ruleInit() {
      this.rules = {}
      this.rules = {
        username: [
          { required: true, message: '用户名不能为空', trigger: 'change' },
          { max: 20, message: '请输入20个以内字符', trigger: 'blur' },
          {
            pattern: /^(?!_)(?!.*?_$)[0-9a-zA-Z_]+$/,
            message: '用户名只含有字母、数字、下划线不能以下划线开头和结尾',
            trigger: 'blur'
          }
        ],
        name: [
          { required: true, message: '姓名不能为空', trigger: 'blur' },
          { max: 20, message: '请输入20个以内字符', trigger: 'blur' },
          {
            pattern: /^(?!_)(?!.*?_$)[a-zA-Z\u4e00-\u9fa5]+$/,
            message: '姓名只含有中文和英文',
            trigger: 'blur'
          }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'change' },
          {
            pattern: /^[A-Za-z0-9_]+$/,
            message: '密码由字母、数字、下划线组成',
            trigger: 'change'
          }
        ],
        passwordEdit: [
          {
            pattern: /^[A-Za-z0-9_]+$/,
            message: '密码由字母、数字、下划线组成',
            trigger: 'change'
          }
        ],
        passwordConfirm: [
          { required: true, message: '密码不能为空', trigger: 'change' },
          { validator: this.valiConfirmPwd, message: '两次输入的密码不一致', trigger: 'change' }
        ],
        passwordConfirmEdit: [{ validator: this.valiConfirmPwd, message: '两次输入的密码不一致', trigger: 'change' }],
        role: [{ type: 'number', required: true, message: '角色不能为空', trigger: 'change' }, { validator: this.valiRole, trigger: 'change' }],
        phone: [{ required: true, message: '手机不能为空', trigger: 'change' }, { validator: this.valiPhone, trigger: 'change' }]
        // phone: [{ required: true, message: '手机不能为空', trigger: 'blur' }, { pattern: /^[0-9]{11}$/, message: '手机格式不正确', trigger: 'blur' }]
      }
    },
    validatePhone(phone) {
      var msg = ''
      const regex = /^0?(1[3456789][0-9])[0-9]{8}$/
      if (phone === '' || phone === null) {
        msg = '手机号码不能为空'
      } else if (!regex.test(phone)) {
        msg = '请填写合法手机号码'
      }
      return msg
    },
    valiPhone(rule, value, callback) {
      if (this.validatePhone(value) !== '') {
        callback(new Error(this.validatePhone(value)))
      } else {
        callback()
      }
    },

    // 校验密码
    valiConfirmPwd(rule, value, callback) {
      if (this.managerForm.passwordConfirm === this.managerForm.password && this.managerForm.passwordConfirmEdit === this.managerForm.passwordEdit) {
        callback()
      } else {
        callback(new Error('密码必须一致'))
      }
    },
    // 校验角色
    valiRole(rule, value, callback) {
      if (value <= 127 && value >= -128) {
        var reg = /^([+-]?[1-9]+)$/
        if (reg.test(value)) {
          callback()
        } else {
          callback(new Error('角色必须是大于-127，小于128的整数'))
        }
      } else {
        callback(new Error('角色必须是大于-127，小于128的整数'))
      }
    },
    // 页面翻页
    // pageIndex 翻到第pageIndex页
    async handlePageTurn(pageIndex) {
      // pageIndex不能小于一
      pageIndex = pageIndex < 1 ? 1 : pageIndex
      this.searchValue.page = pageIndex
      let res = await findManagerInfo(this.searchValue)
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
    },

    // 存储所有的勾选的对象的id
    batchSelect(selection) {
      this.seletedObjectId = []
      if (this.debug) console.log(selection)
      selection.forEach((row) => {
        this.seletedObjectId.push(row.id)
      })
    },

    // 打开modal
    openModal(row) {
      this.$refs.managerForm.resetFields()
      if (row === null) {
        this.managerForm = {}

        this.modalTitle = '添加管理员'
        this.isAdding = true
      } else {
        this.managerForm = Object.assign({}, row)
        this.modalTitle = '编辑管理员'
        this.isEditing = true
      }
      this.showModal = true
    },
    // 关闭/取消modal
    cancelModal() {
      this.isAdding = false
      this.isEditing = false
      this.showModal = false
      if (this.debug) {
        console.log('关闭/取消modal', this.managerForm)
      }
    },
    // 处理表单提交
    handleSubmit(name) {
      if (this.debug) console.log('处理表单提交')
      this.$refs[name].validate(async (valid) => {
        // 如果表单校验无误
        if (valid) {
          if (this.debug) {
            console.log('表单校验无误')
            console.log('managerForm', this.managerForm)
          }
          if (this.isAdding) {
            this.managerForm.role = 0
            await this.doManagerAdd(this.managerForm)
          } else {
            await this.doManagerEdit(this.managerForm)
          }
          this.handlePageTurn(this.page.pageNum)
        } else {
          this.$Message.error('失败，表单填写错误!')
        }
      })
    },
    async isExist(username) {
      let res = await findManagerInfo({ username: username })
      if (this.debug) {
        console.log('isExist')
      }
      for (let i = 0; i < res.data.list.length; i++) {
        if (res.data.list[i].username === username) {
          return true
        }
      }
      return false
    },
    // 添加管理员
    async doManagerAdd(obj) {
      if (await this.isExist(obj.username)) {
        this.$Message.error('用户名已被使用')
        return
      }
      let res = await doManagerAdd(obj)
      if (this.debug) console.log('添加管理员', res)
      if (res.code === 200) {
        // 添加成功,刷新当前页
        this.isAdding = false
        this.showModal = false
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 编辑管理员
    async doManagerEdit(obj) {
      if (this.managerForm.hasOwnProperty('passwordEdit')) {
        this.managerForm.password = this.managerForm.passwordEdit
      }
      let res = await doManagerEdit(obj)
      if (res.code === 200) {
        // 编辑成功,刷新当前页
        this.isEditing = false
        this.showModal = false
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },

    // 删除管理员
    async doManagerDel(obj) {
      let res = await doManagerDel({ id: obj.id })
      if (res.code === 200) {
        // 删除成功,刷新当前页
        // 删除最后一条，返回前一页
        if (this.showData.length === 1) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 确认批量删除
    confirmDeleteSeletedObject() {
      if (this.seletedObjectId.length === 0) {
        this.$Message.info('请选择删除的对象')
        return
      }
      for (let i = 0; i < this.seletedObjectId.length; i++) {
        if (this.seletedObjectId[i] === this.userId) {
          this.$Message.error('不可删除当前登陆管理员' + this.userName)
          return
        }
      }

      this.$Modal.confirm({
        title: '请确认删除',
        content: `<p>删除所选管理员后无法恢复,确认删除?</p>`,
        okText: '确认',
        onOk: () => {
          let deleteAll = this.seletedObjectId.length === this.showData.length
          let ids = this.seletedObjectId.join(',')
          this.doManagerDelMany(ids, deleteAll)
        },
        // 取消删除
        onCancel: () => {
          this.$Message.info('取消删除')
        }
      })
    },
    // 批量删除管理员
    async doManagerDelMany(ids, deleteAll) {
      let res = await doManagerDelMany({ ids: ids })
      if (res.code === 200) {
        // 删除成功,刷新当前页
        // 全删，返回前一页
        if (deleteAll) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    goToFirstPage() {
      this.$router.push({
        name: 'login'
      })
    }
  }
}
</script>

<style scoped>
</style>
