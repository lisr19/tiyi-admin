<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户体征信息</p>
      <Row>
        <Col span="10">
          <Button type="primary" style="width: 80px; margin:5px" @click="openItemAddModal">添加</Button>
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
          <!--Button type="primary" style="width: 80px;margin: 5px" :loading="exportLoading" @click="exportToExcel">excel导出</Button-->
        </Col>

        <!--Col span="4" style="float:right;margin:5px;" >
          <DatePicker icon="search" v-model="searchOption.searchDate" placeholder="输入日期搜索"></DatePicker>
        </Col-->

        <Col span="4" style="float:right;margin:5px" >
          <Input clearable icon="ios-search" v-model="searchOption.searchName" @on-change="searchUserBodyByName" placeholder="输入姓名搜索"></Input>
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
    <Modal v-model="isOpen" @on-cancel="cancelItemAddModal" :title="isAdd ? '添加用户体征信息' : '编辑用户体征信息'" width="600">
      <Form :model="itemAddForm" ref="itemAddForm" :rules="rules" :label-width="100">
        <Card>
          <FormItem v-show="isOpen && isAdd" label="姓名：" prop="userId" >
            <userSelect userType="user" @on-change="changeUserId" :key="isOpen"> </userSelect>
          </FormItem>
          <FormItem v-show="isOpen && !isAdd" label="姓名：" prop="userId" :key="!isOpen">
            <p style="width: 250px"> {{itemAddForm.userName}} </p>
          </FormItem>
          <FormItem label="身高：" prop="height">
            <Input clearable v-model="itemAddForm.height" placeholder="请填写身高" style="width: 250px" key="userHeight">
              <span slot="append">cm</span>
            </Input>
          </FormItem>
          <FormItem label="体重：" prop="weight">
            <Input clearable v-model="itemAddForm.weight" placeholder="请填写体重" style="width: 250px">
              <span slot="append">kg</span>
            </Input>
          </FormItem>
          <!--<FormItem label="BMI：" prop="bmi">
            <p style="width: 250px;padding-left:10px"> {{ bmi}} </p>
          </FormItem>-->
          <FormItem label="脂肪率：" prop="fat">
            <Input clearable v-model="itemAddForm.fat" placeholder="请填写脂肪率" style="width: 250px">
              <span slot="append">%</span>
            </Input>
          </FormItem>
          <FormItem label="肌肉率：" prop="muscle">
            <Input clearable v-model="itemAddForm.muscle" placeholder="请填写肌肉率" style="width: 250px">
              <span slot="append">%</span>
            </Input>
          </FormItem>
          <FormItem label="基础代谢率：" prop="bmr">
            <Input number clearable v-model="itemAddForm.bmr" placeholder="请填写基础代谢率" style="width: 250px">
              <span slot="append">%</span>
            </Input>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="text" @click="cancelItemAddModal">取消</Button>
        <Button type="primary" @click="addItem('itemAddForm')" >确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import excel from '@/libs/excel'
import { formatDate } from '@/libs/util'
import { findUserBodyInfo, doUserBodyAdd, doUserBodyEdit, doUserBodyDel } from '@/api/user-physical-signs'
import userSelect from '../components/item-select/user-select'

export default {
  name: 'user-body',
  computed: {
    // 根据身高体重计算BMI kg/m^2
    bmi: function() {
      if (!this.itemAddForm.height || !this.itemAddForm.weight) {
        return 0
      } else {
        return (this.itemAddForm.weight * 10000 / (this.itemAddForm.height * this.itemAddForm.height)).toFixed(2)
      }
    }
  },
  components: {
    userSelect
  },

  mounted() {
    if (this.$route.params.userId) {
      this.searchOption.userId = this.$route.params.userId
    }
    if (this.$route.params.userId) {
      this.searchOption.searchName = this.$route.params.searchName
    }
    this.findUserBodyInfo()
  },

  // 监听参数的变化
  // 复用时触发
  watch: {
    '$route' (to, from) {
      if (from.name === 'user-basic' && to.name === 'user-body') {
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
        this.findUserBodyInfo()
      }
    }
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
        height: [
          { required: true, message: '身高不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } },
          { type: 'number', min: 50, max: 220, message: '身高单位是cm' }
        ],
        weight: [
          { required: true, message: '体重不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } },
          { type: 'number', min: 25, max: 150, message: '身高单位是kg' }
        ],
        fat: [
          { required: true, message: '脂肪率不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } },
          { type: 'number', min: 1, max: 100, message: '肌肉率的单位是%' }
        ],
        muscle: [
          { required: true, message: '肌肉率不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } },
          { type: 'number', min: 1, max: 100, message: '肌肉率单位是%' }
        ],
        bmr: [
          { required: true, message: '基础代谢率不能为空' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } },
          { type: 'number', min: -200, max: 200, message: '请填写合适范围' }
        ]

      }, // 校验对象
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
          title: '身高/cm',
          align: 'center',
          key: 'height'
        },
        {
          title: '体重/kg',
          align: 'center',
          key: 'weight'
        },
        {
          title: '记录时间',
          align: 'center',
          key: 'recordTime',
          width: 150
        },
        // {
        //   title: 'BMI',
        //   align: 'center',
        //   render: (h, params) => {
        //     if (!params.row.height || !params.row.weight) {
        //       return
        //     } else {
        //       return h('div', (params.row.weight * 10000 / (params.row.height * params.row.height)).toFixed(2) )
        //     }
        //   }
        // },
        {
          title: '脂肪率/%',
          align: 'center',
          key: 'fat'
        },
        {
          title: '肌肉率/%',
          align: 'center',
          key: 'muscle'
        },
        {
          title: '基础代谢率/%',
          align: 'center',
          key: 'bmr'
        },

        {
          title: '操作',
          align: 'center',
          key: 'handle',
          width: 250,
          render: (h, params) => {
            return h('div', [
              h('Button', {
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
              }, '编辑'),

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
      searchOption: {}, // 查询用参数
      options: []
    }
  },
  methods: {

    // 记录选择的id
    changeUserId: function(e) {
      this.$set(this.itemAddForm, 'userId', e)
    },

    searchUserBodyByName() {
      this.page.pageNum = 1
      delete (this.searchOption['userId'])
      this.findUserBodyInfo()
    },

    // 获取用户列表
    async findUserBodyInfo() {
      let params = {
        userId: this.searchOption.userId,
        userName: this.searchOption.searchName,
        page: this.page.pageNum
      }
      let res = await findUserBodyInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = []
        res.data.list.forEach(item => {
          this.itemData.push({
            userName: item.userName,
            recordTime: formatDate(new Date(item.createTime), 'yyyy-MM-dd hh:mm'),
            height: item.height,
            weight: item.weight,
            id: item.id,
            fat: item.fat,
            muscle: item.muscle,
            bmr: item.bmr,
            userId: item.userId
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
          this.findUserBodyInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
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
          // this.exportLoading = true
          // const params = {
          //   title: ['姓名', '身高', '体重', '记录时间', 'BMI', '血压', '血糖', '尿酸', '腰臀比'],
          //   key: ['name', 'height', 'weight', 'recordTime', 'bmi', 'pressure', 'sugar', 'acid', 'whr'],
          //   data: this.itemData,
          //   autoWidth: true,
          //   filename: '体征信息'
          // }
          // excel.export_array_to_excel(params)
          // this.exportLoading = false
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
      let res = await doUserBodyDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findUserBodyInfo()
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
      let res = await doUserBodyDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findUserBodyInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedItem = []
    },

    // 页面翻页
    handlePageTurn (page) {
      this.page.pageNum = page
      this.findUserBodyInfo()
    },

    // 用户添加modal打开
    openItemAddModal () {
      this.itemAddForm = {}
      this.$refs.itemAddForm.resetFields()
      this.isAdd = true
      this.isOpen = true
    },

    openItemEditModel (itemInfo) {
      // 后面的属性会覆盖前面的属性
      this.$refs.itemAddForm.resetFields()
      this.isAdd = false
      this.isOpen = true
      this.itemAddForm = Object.assign({}, itemInfo)
    },

    // 用户添加modal关闭
    cancelItemAddModal () {
      // 重置用户添加表单对象
      this.$refs.itemAddForm.resetFields()
      this.itemAddForm = {}
      this.isOpen = false
    },

    addItem (itemAddForm) {
      this.$refs[itemAddForm].validate(async (valid) => {
        if (valid) {
          // console.log(this.itemAddForm.userId)
          let params = {
            userId: this.itemAddForm.userId,
            gender: this.itemAddForm.sex,
            height: this.itemAddForm.height,
            weight: this.itemAddForm.weight,
            bmr: this.itemAddForm.bmr,
            fat: this.itemAddForm.fat,
            muscle: this.itemAddForm.muscle
          }

          if (this.isAdd) {
            // 添加
            let res = await doUserBodyAdd(params)
            if (res.code === 200) {
              // 刷新
              await this.findUserBodyInfo()
              this.$Message.success('添加成功')
            } else {
              this.$Message.error(res.data)
            }
          } else {
            // 编辑
            params.id = this.itemAddForm.id
            let res = await doUserBodyEdit(params)
            if (res.code === 200) {
              // 刷新
              await this.findUserBodyInfo()
              this.$Message.success('编辑成功')
            } else {
              this.$Message.error(res.data)
            }
          }
          this.$refs.itemAddForm.resetFields()
          this.itemAddForm = {}
          this.isOpen = false
        } else {

        }
      })
    }
  }
}
</script>

<style scoped>
</style>
