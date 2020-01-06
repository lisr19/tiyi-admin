
<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">分组信息管理</p>
      <Row>
        <Col span="3">
          <Button type="primary" style="width: 110px;" @click="openModal(null)">添加</Button>
        </Col>

        <Col span="3">
          <Button type="error" style="width: 110px;" @click="confirmDeleteSeletedObject">批量删除</Button>
        </Col>
        <Col span="5" offset="13">
          <Input
            @on-change="handleSearch"
            v-if="false"
            v-model="searchValue.name"
            clearable
            icon="search"
            placeholder="输入分组名称查询"
          />
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <Table :columns="columns" :data="showData" border @on-selection-change="batchSelect"></Table>
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

    <!--添加/编辑Modal-->
    <Modal v-model="showModal" @on-cancel="cancelModal" :title="modalTitle" width="720">
      <Form
        :model="groupForm"
        ref="groupForm"
        :rules="rules"
        :label-width="110"
        @submit.native.prevent
        inline
      >
        <Card>
          <FormItem label="分组名称：" prop="name">
            <Input v-model="groupForm.name" placeholder="请填写分组名称" style="width:200px " />
          </FormItem>
          <FormItem label="分组类型：" prop="type">
            <Select v-model="groupForm.type" style="width: 200px">
              <Option v-for="i in typeOptions" :value="i.value" :key="i.value">
                {{
                i.text
                }}
              </Option>
            </Select>
          </FormItem>
          <FormItem label="监察时间：" prop="timeRange">
            <DatePicker
              @on-change="handleTimeChange"
              :clearable="false"
              type="daterange"
              placement="bottom-end"
              placeholder="点击选择监察时间"
              split-panels
              style="width: 200px "
              :options="datePickerOptions1"
              v-model="groupForm.timeRange"
            ></DatePicker>
          </FormItem>
          <FormItem label="发送提醒的日期：">
            <DatePicker
              :clearable="false"
              type="date"
              multiple
              style="width: 200px"
              placeholder="点击选择日期（多选）"
              :options="datePickerOptions2"
              v-model="groupForm.remindDate"
            ></DatePicker>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmit('groupForm')">确认</Button>
      </div>
    </Modal>

    <!--用户Modal-->
    <Modal v-model="showModalUser" @on-cancel="cancelModal" width="1000">
      <editUserInGroup :group="currentGroup" :showModal="showModalUser"></editUserInGroup>
      <div slot="footer"></div>
    </Modal>
  </div>
</template>

<script>
import { doUserGroupAdd, doUserGroupDel, doUserGroupEdit, doUserGroupDelMany, findUserGroupInfo } from '@/api/user-group'
import { formatDate } from '@/libs/util'
import editUserInGroup from './editUserInGroup.vue'
export default {
  components: {
    editUserInGroup
  },
  name: 'conpositonTable',
  data() {
    return {
      debug: false,
      modalTitle: '',
      rules: {}, // 校验规则
      seletedObjectId: [], // 被选中的对象
      groupForm: {}, // 正在被编辑的对象
      showModal: false, // 是否显示modal
      isAdding: false, // 是否在正在添加菜谱
      isEditing: false, // 是否在正在编辑菜谱
      columns: [], // 表格的表头

      page: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      searchValue: {},
      showData: [], // 当前显示的数据
      typeOptions: [{ text: '对照组', value: 0 }, { text: '干预组', value: 1 }], // 分组类型
      errorMes: '网络异常,请联系管理员',
      datePickerOptions1: {
        disabledDate: (date) => {
          return date.valueOf() < Date.now() - 86400000
        }
      },
      datePickerOptions2: {
        disabledDate: (date) => {
          let startDate, endDate
          if (this.groupForm.timeRange === undefined || this.groupForm.timeRange[0] === undefined || this.groupForm.timeRange[1] === undefined) {
            startDate = Date.now()
            endDate = Date.now()
          } else {
            startDate = this.groupForm.timeRange[0].valueOf()
            endDate = this.groupForm.timeRange[1].valueOf()
          }
          return date.valueOf() < startDate || date.valueOf() > endDate
        }
      },
      currentGroup: {},
      showModalEdit: false,
      showModalUser: false
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
      this.columns.push({ title: '分组名称', width: 100, align: 'center', key: 'name' })
      this.columns.push({ title: '监察时间', width: 200, align: 'center', key: 'timeRangeShow' })

      this.columns.push({
        title: '发送提醒的日期',
        width: 250,
        align: 'center',
        render: (h, params) => {
          let remindDate = params.row.remindDate
          return h('span', this.getShowDate(remindDate))
        }
      })
      this.columns.push({
        title: '分组类型',
        width: 100,
        align: 'center',
        render: (h, params) => {
          var show = params.row.type ? '干预组' : '对照组'
          return h('span', show)
        }
      })
      this.columns.push({
        title: '启用',
        width: 100,
        align: 'center',
        key: 'enable',
        render: (h, params) => {
          console.log(h)
          return h('i-switch', {
            // 数据库1是已处理，0是未处理
            props: {
              type: 'primary',
              value: params.row.enable === 1
            },
            on: {
              'on-change': (value) => {
                if (this.debug) console.log('启用/禁用')
                this.doUserGroupEdit({ id: params.row.id, enable: params.row.enable ? 0 : 1 })
              }
            }
          })
        }
      })
      this.columns.push({
        title: '操作',
        align: 'center',
        key: 'handle',
        render: (h, params) => {
          if (params.row.enable === 0) return h('span', '不可操作未启用分组')
          return h('div', [
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
                  type: 'primary'
                },
                style: {
                  marginRight: '40px'
                },
                on: {
                  click: () => {
                    this.openUserModal(params.row)
                  }
                }
              },
              '成员'
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
                      content: `<p>删除分组: ${params.row.name} 后无法恢复,确认删除?</p>`,
                      okText: '确认',
                      onOk: () => {
                        this.doUserGroupDel({ id: params.row.id })
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
      })
    },

    ruleInit() {
      this.rules = {}
      this.rules['name'] = [{ required: true, message: '分组名称不能为空', trigger: 'change' }]
      this.rules['timeRange'] = [
        {
          required: true,
          type: 'array',
          message: '监察时间不能为空',
          fields: {
            '0': { type: 'date', required: true },
            '1': { type: 'date', required: true }
          }
        }
      ]
    },
    // 清空提醒日期
    handleTimeChange() {
      if (this.groupForm.remindDate.length !== 0) {
        this.$Message.info('监察时间变动，清空提醒日期')
        this.groupForm.remindDate = []
      }
    },
    //  获取显示的日期
    getShowDate(remindDate) {
      if (remindDate === 'undefined') {
        return '未设置提醒日期，点击编辑设置'
      }
      if (remindDate === null || remindDate === undefined || remindDate === '') {
        return '未设置提醒日期，点击编辑设置'
      }
      if (remindDate.length === 0) {
        return '未设置提醒日期，点击编辑设置'
      }
      let dates = JSON.parse(remindDate)

      let moreThan3 = false
      if (dates.length > 3) {
        dates = dates.slice(0, 3)
        moreThan3 = true
      }
      let result = dates[0]
      for (let i = 1; i < dates.length; i++) {
        result = result + ',' + dates[i]
      }

      if (moreThan3) result = result + '......'
      return result
    },
    // 页面翻页
    // pageIndex 翻到第pageIndex页
    handlePageTurn(pageIndex) {
      if (pageIndex < 1) {
        pageIndex = 1
      }
      this.findUserGroupInfo({ page: pageIndex })
    },

    // 处理查询
    handleSearch() {
      if (this.debug) console.log('搜索：', this.searchValue)
      this.findUserGroupInfo(this.searchValue)
    },
    // 存储所有的勾选的对象的id
    batchSelect(selection) {
      this.seletedObjectId = []
      if (this.debug) console.log(selection)
      selection.forEach((row) => {
        this.seletedObjectId.push(row.id)
      })
    },
    // 确认批量删除
    confirmDeleteSeletedObject() {
      if (this.seletedObjectId.length === 0) {
        this.$Message.info('请选择删除的对象')
        return
      }
      this.$Modal.confirm({
        title: '请确认删除',
        content: `<p>删除所选对象后无法恢复,确认删除?</p>`,
        okText: '确认',
        onOk: () => {
          let deleteAll = this.seletedObjectId.length === this.showData.length
          let obj = { ids: '' }
          obj.ids = this.seletedObjectId.join(',')
          this.doUserGroupDelMany(obj, deleteAll)
        },
        // 取消删除
        onCancel: () => {
          this.$Message.info('取消删除')
        }
      })
    },

    // 打开添加modal
    openModal(row) {
      this.$refs.groupForm.resetFields()
      if (row === null) {
        this.groupForm = {}
        this.modalTitle = '添加分组'
        this.isAdding = true
      } else {
        this.groupForm = Object.assign({}, row)

        this.modalTitle = '编辑分组'
        this.isEditing = true
      }
      this.showModal = true
    },
    // 打开成员modal
    openUserModal(row) {
      this.currentGroup = row
      this.showModalUser = true
    },
    // 关闭/取消modal
    cancelModal() {
      this.isAdding = false
      this.isEditing = false
      this.showModal = false
      this.showModalUser = false

      if (this.debug) {
        console.log('关闭/取消modal', this.groupForm)
      }
    },

    // 处理表单提交
    handleSubmit(name) {
      if (this.debug) console.log('处理表单提交')
      this.$refs[name].validate((valid) => {
        // 如果表单校验无误
        if (valid) {
          if (this.debug) {
            console.log('表单校验无误')
            console.log('groupForm', this.groupForm)
          }
          // 修改日期格式
          this.groupForm.remindDate = this.changeDateFrom(this.groupForm.remindDate)
          this.groupForm.startTime = formatDate(this.groupForm.timeRange[0], 'yyyy-MM-dd 00:00:00')
          this.groupForm.endTime = formatDate(this.groupForm.timeRange[1], 'yyyy-MM-dd 00:00:00')

          if (this.isAdding) {
            this.doUserGroupAdd(this.groupForm)
          } else {
            this.doUserGroupEdit(this.groupForm)
          }
        } else {
          this.$Message.error('失败，表单填写错误!')
        }
      })
    },
    // 修改日期格式，将表单格式改为后端api格式
    changeDateFrom(remindDate) {
      if (remindDate === null || remindDate === undefined || remindDate === '') {
        return remindDate
      }
      if (typeof remindDate === 'string') {
        return remindDate
      }
      let result = []
      for (let i = 0; i < remindDate.length; i++) {
        if (remindDate[i] !== null) result.push(formatDate(remindDate[i], '"yyyy-MM-dd"'))
      }
      if (result.length === 0) return ''
      return '[' + result.join(',') + ']'
    },
    // 往数据中添加TimeRange属性
    getTimeRange(datas) {
      for (let i = 0; i < datas.length; i++) {
        if (datas[i].startTime !== undefined) {
          datas[i].timeRangeShow = datas[i].startTime + ' - ' + datas[i].endTime
        } else {
          datas[i].timeRangeShow = '未设置监察时间'
        }

        datas[i].timeRange = [new Date(datas[i].startTime), new Date(datas[i].endTime)]
      }
      return datas
    },
    // 查询
    async findUserGroupInfo(obj) {
      let res = await findUserGroupInfo(obj)
      if (this.debug) console.log('查询结果：', res)
      if (res.code === 200) {
        // 查询成功,更新页面

        this.showData = []
        this.showData = this.getTimeRange(res.data.list)

        this.page = {
          total: res.data.total,
          pageNum: res.data.pageNum,
          pageSize: res.data.pageSize
        }
      } else {
        this.$Message.error(res.data)
      }
    },
    // 添加分组
    async doUserGroupAdd(obj) {
      let res = await doUserGroupAdd(obj)
      if (this.debug) console.log('添加分组', res)
      if (res.code === 200) {
        // 添加成功,刷新当前页
        this.isAdding = false
        this.showModal = false
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 编辑分组
    async doUserGroupEdit(obj) {
      this.groupForm.password = null
      let res = await doUserGroupEdit(obj)
      if (res.code === 200) {
        // 编辑成功,刷新当前页
        this.isEditing = false
        this.showModal = false
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 删除分组
    async doUserGroupDel(obj) {
      let res = await doUserGroupDel(obj)
      if (res.code === 200) {
        // 删除成功,刷新当前页
        // 删除最后一条，返回前一页
        if (this.showData.length === 1) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 批量删除分组
    async doUserGroupDelMany(obj, deleteAll) {
      let res = await doUserGroupDelMany(obj)
      if (res.code === 200) {
        // 删除成功,刷新当前页
        // 全删，返回前一页
        if (deleteAll) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    }
  }
}
</script>

<style scoped>
</style>
