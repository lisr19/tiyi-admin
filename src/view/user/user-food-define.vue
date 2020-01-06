<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户自定义食物</p>
      <Row>
        <Col span="10">
          <Button type="primary" style="width: 80px; margin:5px" @click="openItemAddModal">添加</Button>
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
        </Col>

        <Col span="3" style="float:right;margin:5px" >
          <Input clearable icon="ios-search" v-model="searchOption.foodName" @on-change="searchFoodByName" placeholder="输入食物名称搜索"></Input>
        </Col>
        <Col span="3" style="float:right;margin:5px" >
          <Input clearable icon="ios-search" v-model="searchOption.searchName" @on-change="searchFoodByName" placeholder="输入用户姓名搜索"></Input>
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
      :title="isAdd ? '添加自定义食物' : '编辑自定义食物'"
      width="600"
    >
      <Form :model="itemAddForm" ref="itemAddForm" :rules="rules" :label-width="120">
        <Card>
          <!--<FormItem label="头像：" prop="logoUrl">-->
          <!--<img-upload ref="imgUpload" @imgUpload="getUploadImg"></img-upload>-->
          <!--</FormItem>-->

          <FormItem v-if="isOpen && isAdd" label="姓名：" prop="userId">
            <userSelect userType="user" @on-change="changeUserId"> </userSelect>
          </FormItem>

          <FormItem v-if="isOpen && !isAdd" label="姓名：" prop="userId">
            <p style="width: 250px"> {{itemAddForm.userName}}</p>
          </FormItem>

          <FormItem label="菜品/食物名称：" prop="foodName">
            <Input
              clearable
              v-model="itemAddForm.foodName"
              placeholder="请填写菜品/食物名称"
              style="width: 250px"
            />
          </FormItem>

          <FormItem v-if="isOpen && isAdd" label="图片：" prop="picture">
            <imgUploadMore @imgUpload="addUrl" @delImg="deleteUrl"></imgUploadMore>
          </FormItem>
          <FormItem v-if="isOpen && !isAdd" label="图片：" prop="picture">
            <imgUploadMore :defaultUrls="imgUrls" @imgUpload="addUrl" @delImg="deleteUrl"></imgUploadMore>
          </FormItem>
          <FormItem label="总重量/g：" prop="totalWeight">
            <Input
              clearable
              v-model="itemAddForm.totalWeight"
              placeholder="请填写食物总重量"
              style="width: 250px"
            />
          </FormItem>
          <FormItem label="总能量/kcal：" prop="totalEnergy">
            <Input
              clearable
              v-model="itemAddForm.totalEnergy"
              placeholder="请填写食物总能量"
              style="width: 250px"
            />
          </FormItem>
          <FormItem label="成分：" prop="ingredient">
            <div v-for="(item,index) in ingredient" :key="index">
              <Input
                v-model="ingredient[index]"
                placeholder="请填写成分"
                style="margin-bottom: 5px;width: 150px"
              />
              <Button
                type="error"
                style="margin-bottom: 5px; margin-left: 10px"
                @click="deleteIngredient(index)"
              >删除</Button>
            </div>
            <Button type="primary" @click="addIngredient">添加成分</Button>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="text" @click="cancelItemAddModal">取消</Button>
        <Button type="primary" @click="addItem('itemAddForm')">确认</Button>
      </div>
    </Modal>

    <Modal title="查看大图" v-model="isVisible" footer-hide>
      <img :src="bigPictureURL" style="width: 100%" />
    </Modal>
  </div>
</template>

<script>
import imgUploadMore from '../components/img-upload/img-upload-more'
import userSelect from '../components/item-select/user-select'
import excel from '@/libs/excel'
import { formatDate } from '@/libs/util'
import { findCustomFoodInfo, doCustomFoodAdd, doCustomFoodEdit, doCustomFoodDel } from '@/api/custom-food'

export default {
  name: 'user-food-define',
  components: {
    imgUploadMore,
    userSelect
  },
  computed: {},
  data() {
    // 成分有多项，因此自定义验证
    const validateIngredient = (rule, value, callback) => {
      // console.log(this.ingredient)
      if (this.ingredient.lenght === 0) {
        callback()
      }
      let empty = this.ingredient.some(item => {
        return !item
      })
      if (empty) {
        callback(new Error('成分不能为空'))
      }

      let invalid = this.ingredient.some(item => {
        let reg = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/
        return !reg.test(item)
      })
      if (invalid) {
        callback('不能出现非法字符')
      }
      callback()
    }
    return {
      isOpen: false,
      exportLoading: false,
      isVisible: false,
      isAdd: false, // 真表示添加，假表示修改
      rules: {
        userId: [
          { required: true, message: '用户名称不能为空' }
        ],
        foodName: [
          { required: true, message: '食物名称不能为空' },
          { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/, message: '名称不能出现非法字符' },
          { max: 10, message: '名字过长' }
        ],
        sid: [
          { required: true, message: '学号不能为空' }
        ],
        totalWeight: [
          { required: true, message: '重量不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } }
        ],
        totalEnergy: [
          { required: true, message: '总能量不能为空' },
          { type: 'string', max: 5, message: '长度过长' },
          { type: 'number', message: '输入的类型为数字', transform(value) { return Number(value) } }
        ],
        ingredient: [
          { validator: validateIngredient }
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
          title: '图片',
          align: 'center',
          key: 'picture',
          width: 310,
          render: (h, params) => {
            var _this = this
            return params.row.picture.map(function(item) {
              return h('img', {
                attrs: {
                  src: item
                },
                style: {
                  height: '75px',
                  width: '75px',
                  margin: '8px'
                },
                on: {
                  click: () => {
                    _this.checkPicture(item)
                  }
                }
              })
            })
          }
        },
        {
          title: '菜品/食物名称',
          align: 'center',
          key: 'foodName'
        },
        {
          title: '总重量/g',
          align: 'center',
          key: 'totalWeight'
        },
        {
          title: '总能量/kcal',
          align: 'center',
          key: 'totalEnergy'
        },
        {
          title: '成分',
          align: 'center',
          key: 'ingredient',
          render: (h, params) => {
            let ingredient = params.row.ingredient
            if (ingredient) {
              return h('div', ingredient.join('、'))
            }
          }
        },
        {
          title: '操作',
          align: 'center',
          key: 'handle',
          width: 250,
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
      // 批量选择删除的记录
      selectedItem: [],
      itemAddForm: {}, // 用户添加表单对象
      ingredient: [], // 添加成分数组
      // picture: [],
      bigPictureURL: '',
      searchOption: {}, // 查询用参数
      imgUrls: [], // 上传的图片id
      loading: false
    }
  },

  mounted() {
    if (this.$route.params.userId) {
      this.searchOption.userId = this.$route.params.userId
    }
    if (this.$route.params.userName) {
      this.searchOption.searchName = this.$route.params.searchName
    }
    this.findCustomFoodInfo()
  },

  // 监听参数的变化
  // 复用时触发
  watch: {
    '$route' (to, from) {
      if (from.name === 'user-basic' && to.name === 'user-food-define') {
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
        this.findCustomFoodInfo()
      }
    }
  },

  methods: {
    // 获取用户列表
    async findCustomFoodInfo() {
      let params = {
        userName: this.searchOption.searchName,
        page: this.page.pageNum,
        userId: this.searchOption.userId,
        name: this.searchOption.foodName
      }
      let res = await findCustomFoodInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = []
        res.data.list.forEach((item) => {
          var pic = []
          if (item.imgUrl1) {
            pic.push(/^http.+$/.test(item.imgUrl1) ? item.imgUrl1 : 'http://' + item.imgUrl1)
          }
          if (item.imgUrl2) {
            pic.push(/^http.+$/.test(item.imgUrl2) ? item.imgUrl1 : 'http://' + item.imgUrl2)
          }
          if (item.imgUrl3) {
            pic.push(/^http.+$/.test(item.imgUrl3) ? item.imgUrl1 : 'http://' + item.imgUrl3)
          }
          this.itemData.push({
            userName: item.userName,
            recordTime: formatDate(new Date(item.createTime), 'yyyy-MM-dd hh:mm'),
            id: item.id,
            userId: item.userId,
            foodName: item.name,
            totalEnergy: item.energy.toString(),
            totalWeight: item.weight.toString(),
            picture: pic,
            ingredient: item.composition ? item.composition.split(',') : []
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
          this.findCustomFoodInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
    },

    searchFoodByName() {
      this.page = 1
      delete (this.searchOption['userId'])
      this.findCustomFoodInfo()
    },

    // 记录选择的id
    changeUserId: function(e) {
      this.$set(this.itemAddForm, 'userId', e)
    },

    // 增加图片url
    addUrl: function(e) {
      this.imgUrls.push(e)
    },
    // 删除图片url
    deleteUrl: function(e) {
      this.imgUrls.splice(e, 1)
    },

    // 查看大图
    checkPicture(url) {
      this.bigPictureURL = url
      this.isVisible = true
    },
    addIngredient() {
      this.ingredient.push('')
    },
    deleteIngredient(index) {
      this.ingredient.splice(index, 1)
      // 再验证是否为空
      this.$refs.itemAddForm.validateField('ingredient')
    },
    exportToExcel() {
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
            title: ['姓名', '身高', '体重', '记录时间', 'BMI', '血压', '血糖', '尿酸', '腰臀比'],
            key: ['name', 'height', 'weight', 'recordTime', 'bmi', 'pressure', 'sugar', 'acid', 'whr'],
            data: this.itemData,
            autoWidth: true,
            filename: '体征信息'
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
      let res = await doCustomFoodDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findCustomFoodInfo()
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
      let res = await doCustomFoodDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findCustomFoodInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedId = []
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findCustomFoodInfo()
    },

    // 用户添加modal打开
    openItemAddModal() {
      this.itemAddForm = {}
      this.ingredient = []
      this.imgUrls = []
      this.$refs.itemAddForm.resetFields()
      this.isAdd = true
      this.isOpen = true
    },

    openItemEditModel(itemInfo) {
      // 后面的属性会覆盖前面的属性
      this.$refs.itemAddForm.resetFields()
      this.itemAddForm = Object.assign({}, itemInfo)
      this.ingredient = Object.assign([], itemInfo.ingredient)
      this.imgUrls = Object.assign([], itemInfo.picture)
      this.isAdd = false
      this.isOpen = true
    },

    // 用户添加modal关闭
    cancelItemAddModal() {
      // 重置用户添加表单对象
      // console.log(this.uploadList)
      this.isOpen = false
    },

    addItem(itemAddForm) {
      this.$refs[itemAddForm].validate(async (valid) => {
        if (valid) {
          let params = {
            userId: this.itemAddForm.userId,
            name: this.itemAddForm.foodName,
            weight: this.itemAddForm.totalWeight,
            energy: this.itemAddForm.totalEnergy,
            imgUrl1: this.imgUrls[0] ? this.imgUrls[0] : '',
            imgUrl2: this.imgUrls[1] ? this.imgUrls[1] : '',
            imgUrl3: this.imgUrls[2] ? this.imgUrls[2] : '',
            composition: this.ingredient.join(',')
          }

          if (this.isAdd) {
            // 添加
            let res = await doCustomFoodAdd(params)
            if (res.code === 200) {
              // 刷新
              await this.findCustomFoodInfo()
              this.$Message.success('添加成功')
            } else {
              this.$Message.error(res.data)
            }
          } else {
            // 编辑
            params.id = this.itemAddForm.id
            let res = await doCustomFoodEdit(params)
            if (res.code === 200) {
              // 刷新
              await this.findCustomFoodInfo()
              this.$Message.success('编辑成功')
            } else {
              this.$Message.error(res.data)
            }
          }
          this.$refs.itemAddForm.resetFields()
          this.itemAddForm = {}
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
