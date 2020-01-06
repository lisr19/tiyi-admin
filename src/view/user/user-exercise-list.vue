<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户运动记录</p>
      <Row>
        <Col span="10">
          <Button type="primary" style="width: 80px; margin:5px" @click="openItemAddModal">添加</Button>
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
          <Button type="primary" style="width: 80px;margin: 5px" :loading="exportLoading" @click="exportToExcel">excel导出</Button>
        </Col>

        <!--Col span="4" style="float:right;margin:5px;" >
          <DatePicker icon="search" placeholder="输入日期搜索"></DatePicker>
        </Col-->

        <Col span="4" style="float:right;margin:5px" >
          <i-input clearable icon="ios-search" v-model="searchOption.searchName" @on-change="searchSportHistoryByName" placeholder="输入姓名搜索"></i-input>
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
    <Modal v-model="isOpen" @on-cancel="cancelItemAddModal" :title="isAdd ? '添加用户运动记录' : '查看用户记录'" width="500">
      <Form :model="itemAddForm" ref="itemAddForm" :rules="rules" :label-width="100">
        <Card>
          <p slot="title">基础运动</p>
          <FormItem v-if="isOpen && isAdd" label="姓名：" prop="userId">
            <userSelect userType="user" @on-change="changeUserId"> </userSelect>
          </FormItem>

          <FormItem v-if="isOpen && !isAdd" label="姓名：">
            <p style="width: 250px"> {{itemAddForm.userName}} </p>
          </FormItem>

          <FormItem label="记录日期：" prop="recordDate">
            <DatePicker
              v-if="isAdd"
              v-model="itemAddForm.recordDate"
              type="date"
              format="yyyy-MM-dd"
              placeholder="请选择日期"
              style="width: 250px">
            </DatePicker>
            <p v-else style="width: 250px"> {{itemAddForm.recordDate}} </p>
          </FormItem>

          <FormItem label="运动手环：" prop="walkStep">
            <Input v-if="isAdd" v-model="itemAddForm.walkStep" placeholder="请填写运动步数" style="width: 250px">
              <span slot="append">步数</span>
            </Input>
            <p v-else style="width: 250px"> {{itemAddForm.walkStep}} 步 </p>
          </FormItem>
          <FormItem label="消耗能量：" prop="walkEnergy">
            <Input v-if="isAdd" v-model="itemAddForm.walkEnergy" placeholder="请填写消耗能量" style="width: 250px">
              <span slot="append">千卡路里</span>
            </Input>
            <p v-else style="width: 250px"> {{itemAddForm.walkEnergy}} 千卡路里 </p>
          </FormItem>

          <FormItem label="跳绳app：" prop="ropeSkippingTime">
            <Input v-if="isAdd" v-model="itemAddForm.ropeSkippingTime" placeholder="请填写跳绳次数" style="width: 250px">
              <span slot="append">次数  </span>
            </Input>
            <p v-else style="width: 250px"> {{itemAddForm.ropeSkippingTime}} 次 </p>
          </FormItem>

          <FormItem label="消耗能量：" prop="ropeSkippingEnergy">
            <Input v-if="isAdd" v-model="itemAddForm.ropeSkippingEnergy" placeholder="请填写消耗能量" style="width: 250px">
              <span slot="append">千卡路里</span>
            </Input>
            <p v-else style="width: 250px"> {{itemAddForm.ropeSkippingEnergy}} 千卡路里 </p>
          </FormItem>
        </Card>

        <Card v-for="(item,index) in itemAddForm.otherType"  :key="index" style="margin-top: 10px">
        <p slot="title">特殊运动 {{index + 1}}</p>
          <Button v-if="isAdd" slot="extra" @click="deleteOtherType(index)" type='error'>
            删除
          </Button>
          <FormItem label="运动类型：" :prop="'otherType.' + index + '.type'" :rules="[{required: true, message: '运动类型不能为空'},
          {pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/, message: '不能出现非法字符'},
          {max: 10, message: '字符过长'}]">
            <Input v-if="isAdd" clearable v-model="item.type" placeholder="请填写运动类型" style="width: 250px"/>
            <p v-else style="width: 250px"> {{item.type}} </p>
          </FormItem>

          <FormItem label="运动时间：" :prop="'otherType.' + index + '.time'" :rules="{required: true, message: '运动时间不能为空'}">
            <Time-picker v-if="isAdd" v-model="item.time" format="HH:mm:ss" placeholder="选择时间" style="width: 250px"></Time-picker>
            <p v-else style="width: 250px"> {{item.time}}  </p>
          </FormItem>

          <FormItem label="运动时长：" :prop="'otherType.' + index + '.lasting'" :rules="[{required: true, message: '运动时长不能为空'}]">
            <Input v-if="isAdd" clearable v-model="item.lasting" placeholder="请填写运动时长" style="width: 250px">
              <span slot="append">分钟</span>
            </Input>
            <p v-else style="width: 250px"> {{item.lasting}} 分钟 </p>
          </FormItem>
        </Card>
        <Button v-if="isAdd" style="margin-top: 10px" @click="addOtherType" type="primary"> 添加特殊运动</Button>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button v-if="isAdd" type="text" @click="cancelItemAddModal">取消</Button>
        <Button type="primary" @click="addItem('itemAddForm')" >确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import excel from '@/libs/excel'
import { formatDate } from '@/libs/util'
import userSelect from '../components/item-select/user-select'
import { findSportHistoryInfo, doSportHistoryAdd, doSportHistoryEdit, doSportHistoryDel } from '@/api/sport-history'
import { findUserInfo } from '@/api/user'

export default {
  name: 'user-exercise',
  computed: {
  },
  components: {
    userSelect
  },
  data () {
    return {
      loading: false,
      isOpen: false,
      exportLoading: false,
      isAdd: false, // 真表示添加，假表示修改
      rules: {
        userId: [
          { required: true, message: '用户姓名不能为空' }
        ],
        recordDate: [
          { required: true, message: '日期不能为空' }
        ],
        walkStep: [
          { required: true, message: '运动步数不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) }}
        ],
        ropeSkippingTime: [
          { required: true, message: '跳绳次数不能为空，无则填写0' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) }}
        ],
        ropeSkippingEnergy: [
          { required: true, message: '跳绳消耗能量不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) }}
        ],
        walkEnergy: [
          { required: true, message: '运动消耗能量不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) }}
        ]
      },
      itemData: [],
      // 用户列表表头数组
      columnsList: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: '姓名',
          align: 'center',
          key: 'userName'
        },
        {
          title: '创建时间',
          align: 'center',
          key: 'createTime',
          width: 150
        },
        {
          title: '记录日期',
          align: 'center',
          key: 'recordDate',
          width: 150
        },
        {
          title: '运动手环/步',
          align: 'center',
          key: 'walkStep'
        },
        {
          title: '消耗能量/kcal',
          align: 'center',
          key: 'walkEnergy'
        },
        {
          title: '跳绳app/次',
          align: 'center',
          key: 'ropeSkippingTime'
        },
        {
          title: '消耗能量/kcal',
          align: 'center',
          key: 'ropeSkippingEnergy'
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
              //     click: () => {
              //       this.openItemEditModel(params.row)
              //     }
              //   }
              // }, '编辑'),
              h('Button', {
                props: {
                  type: 'primary'
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => {
                    this.getDetail(params.row)
                  }
                }
              }, '详情'),
              h('Button', {
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
              }, '删除')
            ])
          }
        }
      ],
      page: {// 页面翻页对象
        total: 1, // 数据总数
        currentPage: 1// 当前页面
      },
      // 批量选择删除的记录
      selectedItem: [],
      itemAddForm: {}, // 用户添加表单对象
      searchOption: {} // 查询用参数

    }
  },
  mounted() {
    if (this.$route.params.userId) {
      this.searchOption.userId = this.$route.params.userId
    }
    if (this.$route.params.userId) {
      this.searchOption.searchName = this.$route.params.searchName
    }
    this.findSportHistoryInfo()
  },

  // 监听参数的变化
  // 复用时触发
  watch: {
    '$route' (to, from) {
      if (from.name === 'user-basic' && to.name === 'user-exercise') {
        if (this.$route.params.userId) {
          this.searchOption.userId = this.$route.params.userId
        } else {
          delete (this.searchOption['userId'])
        }
        if (this.$route.params.searchName) {
          this.searchOption.searchName = this.$route.params.searchName
        } else {
          delete (this.searchOption['searchName'])
        }
        this.findSportHistoryInfo()
      }
    }
  },

  methods: {
    // 获取表格数据
    async findSportHistoryInfo() {
      let params = {
        userName: this.searchOption.searchName,
        page: this.page.pageNum,
        userId: this.searchOption.userId,
      }
      let res = await findSportHistoryInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = []
        res.data.list.forEach(item => {
          let otherType = item.otherSportHistoryList.map(item => {
            return {
              type: item.name,
              time: item.sportTime,
              lasting: item.sportPeriod
            }
          })

          this.itemData.push({
            userName: item.userName,
            createTime: formatDate(new Date(item.createTime), 'yyyy-MM-dd hh:mm'),
            recordDate: formatDate(new Date(item.sportDate), 'yyyy-MM-dd'),
            id: item.id,
            userId: item.userId,
            ropeSkippingTime: item.ropeSkippingNumber,
            ropeSkippingEnergy: item.ropeSkippingCalorie,
            walkStep: item.stepNumber,
            walkEnergy: item.stepCalorie,
            otherType: otherType
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
          this.findSportHistoryInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
    },

    searchSportHistoryByName() {
      this.page.pageNum = 1
      delete (this.searchOption['userId'])
      this.findSportHistoryInfo()
    },

    // 记录选择的id
    changeUserId: function(e) {
      this.$set(this.itemAddForm, 'userId', e)
    },

    addOtherType() {
      this.itemAddForm.otherType.push({
        type: '',
        time: '',
        lasting: ''
      })
    },
    deleteOtherType(index) {
      this.itemAddForm.otherType.splice(index, 1)
    },
    exportToExcel () {
      if (this.itemData.length === 0) {
        this.$Message.info('当前没有数据')
        return
      }
      this.$Modal.confirm({
        title: '请确认',
        content: `<p>是否导出当前所有记录?</p>`,
        okText: '确认',
        onOk: () => {
          this.exportLoading = true
          const params = {
            title: ['姓名','创建时间', '运动时间', '运动手环/步', '消耗能量/kcal','跳绳app','跳绳消耗/kcal'],
            key: ['userName','createTime', 'recordDate', 'walkStep', 'walkEnergy','ropeSkippingTime','ropeSkippingEnergy'],
            data: this.itemData,
            autoWidth: true,
            filename: '运动记录'
          }
          excel.export_array_to_excel(params)
          this.exportLoading = false
        },
        // 取消
        onCancel: () => {
          this.$Message.info('取消导出！')
        }
      })
    },

    // 批量选择
    batchSelect (selection) {
      this.selectedItem = []
      selection.forEach(row => {
        this.selectedItem.push(row.id)
      })
    },

    async deleteItemById(id) {
      let params = {
        ids: id
      }
      let res = await doSportHistoryDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findSportHistoryInfo()
      } else {
        this.$Message.error(res.data)
      }
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
      let res = await doSportHistoryDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findSportHistoryInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedId = []
    },

    // 页面翻页
    handlePageTurn (page) {
      this.page.pageNum = page
      this.findSportHistoryInfo()
    },

    // 用户添加modal打开
    openItemAddModal () {
      this.itemAddForm = {}
      this.$set(this.itemAddForm, 'otherType', [])
      this.$refs.itemAddForm.resetFields()
      this.isAdd = true
      this.isOpen = true
    },

    openItemEditModel (itemInfo) {
      // 后面的属性会覆盖前面的属性
      this.itemAddForm = Object.assign({}, itemInfo)
      this.isAdd = false
      this.isOpen = true
    },

    // 用户添加modal关闭
    cancelItemAddModal () {
      // 重置用户添加表单对象
      this.$refs.itemAddForm.resetFields()
      this.isOpen = false
    },

    getDetail (detail) {
      this.itemAddForm = Object.assign({}, detail)
      this.isAdd = false
      this.isOpen = true
    },

    addItem (itemAddForm) {
      if (!this.isAdd) {
        this.isOpen = false
        return
      }
      this.$refs[itemAddForm].validate(async (valid) => {
        if (valid) {
          let otherSportHistoryList = this.itemAddForm.otherType.map(item => {
            console.log(item.time)
            return {
              name: item.type,
              sportTime: item.time,
              sportPeriod: item.lasting
            }
          })
          let addData = {
            userId: this.itemAddForm.userId,
            stepNumber: this.itemAddForm.walkStep,
            stepCalorie: this.itemAddForm.walkEnergy,
            sportDate: formatDate(this.itemAddForm.recordDate, 'yyyy-MM-dd'),
            ropeSkippingNumber: this.itemAddForm.ropeSkippingTime,
            ropeSkippingCalorie: this.itemAddForm.ropeSkippingEnergy,
            otherSportHistoryList: otherSportHistoryList
          }
          let params = {
            addData: JSON.stringify(addData)
          }

          if (this.isAdd) {
            // 添加
            let res = await doSportHistoryAdd(params)
            if (res.code === 200) {
              // 刷新
              await this.findSportHistoryInfo()
              this.$Message.success('添加成功')
              this.$refs.itemAddForm.resetFields()
              this.itemAddForm = {}
              this.isOpen = false
            } else {
              this.$Message.error(res.message)
            }
          } // else {
          // 编辑
          // params.id = this.userAddForm.id
          // let res = await doUserEdit(params)
          // if (res.code === 200) {
          //   // 刷新
          //   await this.findUserInfo()
          //   this.$Message.success('编辑成功')
          // } else {
          //   this.$Message.error(res.data)
          // }
          // }
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
