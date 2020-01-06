<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户饮食记录</p>
      <Row>
        <Col span="10">
          <Button type="primary" style="width: 80px; margin:5px" @click="openItemAddModal">添加</Button>
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
          <Button type="primary" style="width: 80px;margin: 5px" :loading="exportLoading" @click="exportToExcel">excel导出</Button>
        </Col>

        <Col span="4" style="float:right;margin:5px;">
          <Select clearable v-model="searchOption.mealType" @on-change="searchDietHistory">
            <Option
              v-for="item in mealTypeList"
              :value="item.value"
              :key="item.value"
            >{{item.label}}</Option>
          </Select>
        </Col>

        <Col span="4" style="float:right;margin:5px">
          <Input
            clearable
            icon="search"
            v-model="searchOption.searchName"
            @on-change="searchDietHistory"
            placeholder="输入姓名搜索"
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
            :page-size="pageSize"
            @on-change="handlePageTurn"
          ></Page>
        </div>
      </div>
    </Card>

    <!--添加Modal-->
    <Modal
      v-model="isOpen"
      @on-cancel="cancelItemAddModal"
      :title="isAdd ? '添加用户饮食信息' : '编辑用户'"
      width="500"
    >
      <Form :model="itemAddForm" ref="itemAddForm" :rules="rules" :label-width="90">
        <Card>
          <FormItem v-if="isOpen && isAdd" label="姓名：" prop="userId">
            <userSelect userType="user" @on-change="changeUserId"></userSelect>
          </FormItem>
          <FormItem v-if="isOpen && !isAdd" label="姓名：" prop="userId">
            <p style="width: 250px">{{itemAddForm.userName}}</p>
          </FormItem>
          <FormItem label="用餐类型：" prop="type">
            <Select v-model="itemAddForm.type" style="width: 250px">
              <Option
                v-for="item in mealTypeList"
                :value="item.value"
                :key="item.value"
              >{{item.label}}</Option>
            </Select>
          </FormItem>
          <FormItem label="用餐时间: " prop="mealTime">
	          <TimePicker
			          v-model="itemAddForm.mealTime"
			          type="time"
			          placeholder="请选择就餐时间"
			          style="width: 250px"
	          ></TimePicker>
            <!--<DatePicker ref="mealtime"-->
              <!--v-model="itemAddForm.mealTime"-->
              <!--type="datetime"-->
              <!--placeholder="请选择就餐时间"-->
              <!--style="width: 250px"-->
            <!--&gt;</DatePicker>-->
          </FormItem>
	        <FormItem label="记录时间: " prop="createTime">
		        <DatePicker ref="createtime"
				        v-model="itemAddForm.createTime"
				        type="datetime"
				        placeholder="请选择记录时间"
				        style="width: 250px"
		        ></DatePicker>
	        </FormItem>
          <FormItem v-if="isOpen && isAdd" label="标准菜谱：" prop="menuFoodIds">
            <Row v-for="item in itemAddForm.dietHistoryMenuRelAddVOList">
              <Col span="10">
                <Tag type="dot" color="success">{{item.name}}</Tag>
              </Col>
              <Col span="5">
                <InputNumber
                  :max="100"
                  :min="1"
                  v-model="item.percentage"
                  :formatter="value => `${value}%`"
                  :parser="value => value.replace('%', '')"
                  :precision="0"
                ></InputNumber>
              </Col>
            </Row>
            <Button style="width: 120px;" type="primary" @click="openAddMenuFoodModal">编辑标准菜谱</Button>
          </FormItem>
          <FormItem v-if="isOpen && isAdd" label="自定义食物：" prop="customFoodIds">
            <Row v-for="item in itemAddForm.dietHistoryCustomFoodRelAddVOList">
              <Col span="10">
                <Tag type="dot" color="success">{{item.name}}</Tag>
              </Col>
              <Col span="5">
                <InputNumber
                  :max="100"
                  :min="1"
                  v-model="item.percentage"
                  :formatter="value => `${value}%`"
                  :parser="value => value.replace('%', '')"
                  :precision="0"
                ></InputNumber>
              </Col>
            </Row>
            <Button style="width: 120px;" type="primary" @click="openAddCustomFoodModal">编辑自定义食物</Button>
          </FormItem>
          <FormItem label="重量：" prop="weight">
            <p>{{totalWeight}}g</p>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="text" @click="cancelItemAddModal">取消</Button>
        <Button type="primary" @click="addItem('itemAddForm')">确认</Button>
      </div>
    </Modal>

    <Modal v-model="isAddCustomFood" width="1200">
      <customFoodSelect v-if="isOpen" @on-change="changeCustomFoodIds"></customFoodSelect>
    </Modal>
    <Modal v-model="isAddMenuFood" width="1200">
      <menuSelect v-if="isOpen" @on-change="changeMenuIds"></menuSelect>
    </Modal>

    <!--详情Modal-->
    <Modal v-model="isDetail" :title="'详情'" width="1000">
      <Form :model="itemDetailForm" :label-width="90" inline>
        <Card>
          <FormItem label="姓名：">
            <p style="width: 200px">{{itemDetailForm.userName}}</p>
          </FormItem>
          <FormItem label="用餐时间：">
            <p style="width: 200px">{{itemDetailForm.mealTime}}</p>
          </FormItem>
          <FormItem label="用餐类型：" inline>
            <p style="width: 200px">{{mealType[itemDetailForm.type]}}</p>
          </FormItem>
          <div v-if="!itemDetailForm.menuList || itemDetailForm.menuList.length !== 0">
            <FormItem label="蛋白质：">
              <p
                style="width: 200px"
              >{{itemDetailForm.protein ? itemDetailForm.protein.toFixed(2) : 0}} g</p>
            </FormItem>
            <FormItem label="碳水化合物：">
              <p
                style="width: 200px"
              >{{itemDetailForm.cho ? itemDetailForm.cho.toFixed(2) : 0}} g</p>
            </FormItem>
            <FormItem label="脂肪：">
              <p
                style="width: 200px"
              >{{itemDetailForm.fat ? itemDetailForm.fat.toFixed(2) : 0}} g</p>
            </FormItem>
            <FormItem label="铁元素：">
              <p
                style="width: 200px"
              >{{itemDetailForm.fe ? itemDetailForm.fe.toFixed(2) : 0}} mg</p>
            </FormItem>
            <FormItem label="钙元素：">
              <p
                style="width: 200px"
              >{{itemDetailForm.ca ? itemDetailForm.ca.toFixed(2) : 0}} mg</p>
            </FormItem>
          </div>
        </Card>
      </Form>
      <Table
        v-if="isDetail && itemDetailForm.menuList.length"
        :columns="menuList"
        :data="itemDetailForm.menuList.filter(s=>s)"
        border
        disabled-hover
      ></Table>
      <Table
        v-if="isDetail && itemDetailForm.customFoodList.length"
        :columns="customFoodList"
        :data="itemDetailForm.customFoodList.filter(s=>s)"
        border
        disabled-hover
      ></Table>
    </Modal>
  </div>
</template>

<script>
import excel from '@/libs/excel'
import { formatDate } from '@/libs/util'
import { findDietHistoryInfo, doDietHistoryAdd, doDietHistoryEdit, doDietHistoryDel } from '@/api/diet-history'
import { findStandardCompositionInfo } from '@/api/menu-standard-composition'
import { findNutriInfo } from '@/api/nutri-table'
import userSelect from '../components/item-select/user-select'
import customFoodSelect from '../components/item-select/custom-food-select'
import menuSelect from '../components/item-select/menu-select'

export default {
  name: 'user-diet',
  computed: {
    totalWeight: function() {
      let weight = 0
      if (this.itemAddForm.dietHistoryCustomFoodRelAddVOList) {
        this.itemAddForm.dietHistoryCustomFoodRelAddVOList.forEach((item) => {
          if (item.weight) {
            weight += (parseInt(item.weight) * item.percentage) / 100
          }
        })
      }
      if (this.itemAddForm.dietHistoryMenuRelAddVOList) {
        this.itemAddForm.dietHistoryMenuRelAddVOList.forEach((item) => {
          if (item.weight) {
            weight += (parseInt(item.weight) * item.percentage) / 100
          }
        })
      }
      return weight.toFixed(0)
    },
    // 自定义食物的能量
    // 食谱的能量另外计算
    totalCustomEnergy: function() {
      let energy = 0
      if (this.itemAddForm.dietHistoryCustomFoodRelAddVOList) {
        this.itemAddForm.dietHistoryCustomFoodRelAddVOList.forEach((item) => {
          if (item.energy) {
            energy += (parseInt(item.energy) * item.percentage) / 100
          }
        })
      }
      return energy
    }
  },

  components: {
    userSelect,
    customFoodSelect,
    menuSelect
  },

  mounted() {
    if (this.$route.params.userId) {
      this.searchOption.userId = this.$route.params.userId
    }
    if (this.$route.params.userId) {
      this.searchOption.searchName = this.$route.params.searchName
    }
    this.findDietHistoryInfo()
  },

  // 监听参数的变化
  watch: {
    $route(to, from) {
      if (from.name === 'user-basic' && to.name === 'user-diet') {
        if (this.$route.params.userId) {
          this.searchOption.userId = this.$route.params.userId
        } else {
          delete this.searchOption['userId']
        }
        if (this.$route.params.searchName) {
          this.searchOption.searchName = this.$route.params.searchName
        } else {
          delete this.searchOption['searchName']
        }
        this.findDietHistoryInfo()
      }
    }
  },

  data() {
    return {
      isOpen: false,
      isAddCustomFood: false,
      isAddMenuFood: false,
      isDetail: false,
      exportLoading: false,
      errorMessage: '请联系系统管理员',
      isAdd: false, // 真表示添加，假表示查看
      rules: {
        userId: [{ required: true, message: '用户姓名不能为空' }],
        type: [{ required: true, message: '用餐类型不能为空' }],
        mealTime: [{ required: true, message: '用餐日期不能为空' }]
      }, // 校验对象
      mealTypeList: [
        {
          value: 1,
          label: '早餐'
        },
        {
          value: 2,
          label: '午餐'
        },
        {
          value: 3,
          label: '晚餐'
        },
        {
          value: 0,
          label: '加餐'
        }
      ],
      mealType: ['加餐', '早餐', '午餐', '晚餐'],
      itemData: [],
      // 列表表头数组
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
          title: '记录时间',
          align: 'center',
          key: 'createTime',
          width: 150
        },
        // {
        //   title: '用餐时间',
        //   align: 'center',
        //   key: 'mealDate',
        //   width: 150
        // },
        {
          title: '用餐类型',
          align: 'center',
          render: (h, params) => {
            let type = params.row.type
            return h('div', this.mealType[type])
          }
        },
        {
          title: '用餐时间',
          align: 'center',
          key: 'mealTime',
          width: 100
        },

        {
          title: '菜品/食物名称',
          align: 'center',
          key: 'dishes',
          width: '200px',
          render: (h, params) => {
            // let dishes = params.row.dishes
            let dishes = []
            let customFoodList = params.row.customFoodList
            let menuList = params.row.menuList
            customFoodList.forEach((item) => {
              if (item) {
                dishes.push(item.name)
              }
            })
            menuList.forEach((item) => {
              if (item) {
                dishes.push(item.name)
              }
            })
            return h('div', dishes.join('、'))
          }
        },
        {
          title: '摄入量/g',
          align: 'center',
          key: 'weight'
        },
        {
          title: '摄入能量/kcal',
          align: 'center',
          key: 'calorie'
          // render: (h, params) =>{
          //   let cal = params.row.menuEnergy + params.row.customFoodEnergy
          //   return h('div',cal.toFixed(0))
          // }
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
	                    // console.log(params);
	                    this.getDetail(params.row)
                    }
                  }
                },
                '详情'
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
      // 详情菜谱
      menuList: [
        {
          title: '图片',
          align: 'center',
          key: 'picture',
          width: 150,
          render: (h, params) => {
            if (params.row.imgUrl) {
              return h('img', {
                attrs: {
                  src: /^http.+$/.test(params.row.imgUrl) ? params.row.imgUrl : params.row.imgUrl ? 'http://' + params.row.imgUrl : params.row.imgUrl
                },
                style: {
                  height: '75px',
                  width: '75px',
                  margin: '8px'
                }
              })
            }
          }
        },
        {
          title: '菜谱名称',
          align: 'center',
          key: 'name'
        },
        {
          title: '菜谱类型',
          align: 'center',
          key: 'menuTypeName'
        },
        {
          title: '总重量/g',
          align: 'center',
          key: 'weight'
        },
        {
          title: '食用比例',
          align: 'center',
          key: 'percentage'
        }
      ],
      // 自定义食物
      customFoodList: [
        {
          title: '图片',
          align: 'center',
          key: 'imgUr1',
          width: 310,
          render: (h, params) => {
            let pic = []
            let item = params.row
            if (item.imgUrl1) {
              pic.push(/^http.+$/.test(item.imgUrl1) ? item.imgUrl1 : 'http://' + item.imgUrl1)
            }
            if (item.imgUrl2) {
              pic.push(/^http.+$/.test(item.imgUrl2) ? item.imgUrl1 : 'http://' + item.imgUrl2)
            }
            if (item.imgUrl3) {
              pic.push(/^http.+$/.test(item.imgUrl3) ? item.imgUrl1 : 'http://' + item.imgUrl3)
            }
            return pic.map(function(item) {
              return h('img', {
                attrs: {
                  src: item
                },
                style: {
                  height: '75px',
                  width: '75px',
                  margin: '8px'
                }
              })
            })
          }
        },
        {
          title: '自定义食物名称',
          align: 'center',
          key: 'name'
        },
        {
          title: '总重量/g',
          align: 'center',
          key: 'weight',
          width: 100
        },
        {
          title: '总重量/g',
          align: 'center',
          key: 'weight',
          width: 100
        },
        {
          title: '食用比例',
          align: 'center',
          key: 'percentage'
        },
        {
          title: '成分',
          align: 'center',
          key: 'composition'
        }
      ],
      page: {
        // 页面翻页对象
        total: 1, // 数据总数
        currentPage: 1, // 当前页面

      },
	    pageSize:10,
      // 批量选择删除的记录
      selectedItem: [],
      itemDetailForm: {},
      itemAddForm: {}, // 用户添加表单对象
      searchOption: {} // 查询用参数
    }
  },

  methods: {
    // 计算每种菜的营养素的量
    // 1. 先得到每个食物的成分
    // 2. 计算每种成分的蛋白质、碳水化合物、脂肪、铁、钙
    calNutri() {
      this.itemData.forEach((item1, index) => {
	      this.$set(this.itemData[index], 'protein', 0)
        this.$set(this.itemData[index], 'cho', 0)
        this.$set(this.itemData[index], 'fat', 0)
        this.$set(this.itemData[index], 'fe', 0)
        this.$set(this.itemData[index], 'ca', 0)
        this.$set(this.itemData[index], 'menuEnergy', 0)
        if (item1.menuList) {
          // 查询成分
          item1.menuList.forEach(async (item) => {
            let params = {
              menuCode: item.code
            }
            let res = await findStandardCompositionInfo(params)
            let percentage = item.percentage
            if (res.code === 200) {
              // 得到每个菜谱食物的成分
              let compositions = res.data
              // 得到五种成分
              compositions.forEach(async (item) => {
                let params = {
                  name: item.composition
                }
                let res = await findNutriInfo(params)
                if (res.code === 200) {
                  if (res.data.total === 0) {
                    return
                  }

                  let nutriList = res.data.list[0]
                  if (nutriList.protein) {
                    this.itemData[index].protein += (((percentage / 100) * parseFloat(item.quantity)) / 100) * nutriList.protein
                  }
                  if (nutriList.cho) {
                    this.itemData[index].cho += (((percentage / 100) * parseFloat(item.quantity)) / 100) * nutriList.cho
                  }
                  if (nutriList.fat) {
                    this.itemData[index].fat += (((percentage / 100) * parseFloat(item.quantity)) / 100) * nutriList.fat
                  }
                  if (nutriList.fe) {
                    this.itemData[index].fe += (((percentage / 100) * parseFloat(item.quantity)) / 100) * nutriList.fe
                  }
                  if (nutriList.ca) {
                    this.itemData[index].ca += (((percentage / 100) * parseFloat(item.quantity)) / 100) * nutriList.ca
                  }
                }
              })
            }
          })
        }
      })
    },

    // 上传前计算卡路里
    // 线性计算
    async calMenuEnergy(menuList) {
      let menuEnergy = 0
      for (let item of menuList) {
        let params = {
          menuCode: item.menuCode
        }
        let res = await findStandardCompositionInfo(params)
        let percentage = item.percentage
        if (res.code === 200) {
          // 得到每个食物的成分
          let compositions = res.data
          // 得到五种成分
          for (let i of compositions) {
            console.log(i)
            let res = await findNutriInfo({ name: i.composition })
            if (res.code === 200) {
              if (res.data.total === 0) {
                return
              }
              // 万一有重名
              let nutriList = res.data.list[0]
              if (nutriList.energyKcal) {
                menuEnergy += (((percentage / 100) * parseFloat(i.quantity)) / 100) * nutriList.energyKcal
              }
            }
          }
        }
      }
      return menuEnergy
    },

    // 获取用户列表
    async findDietHistoryInfo() {
      let params = {
        userId: this.searchOption.userId,
        userName: this.searchOption.searchName,
        type: this.searchOption.mealType,
        page: this.page.pageNum,
	      size:this.pageSize
      }
      let res = await findDietHistoryInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = res.data.list
	      this.itemData.forEach((i)=>{
	      	// if(i.type===0){
		     //    i.type= '加餐'
	        // }
		     //  if(i.type===1){
			 //      i.type= '早餐'
		     //  }
		     //  if(i.type===2){
			 //      i.type= '午餐'
		     //  }
		     //  if(i.type===3){
			 //      i.type= '晚餐'
		     //  }
		      let dishes = []
		      i.menuList.forEach((item) => {
			      if (item) {
				      dishes.push(item.name)
			      }
		      })
		      i.customFoodList.forEach((item) => {
			      if (item) {
				      dishes.push(item.name)
			      }
		      })
		      i.dishes = dishes.toString()
	      })
	      // 查看食物成分
        this.calNutri()

        this.page = {
          total: res.data.total,
          pageNum: res.data.pageNum,
        }

        // 数据同步
        // 别的管理员可能删除了数据
	      this.page.pageNum = Math.ceil(res.data.total / res.data.pageSize)
        // if (res.data.list.length === 0 && res.data.total > 0) {
        //   this.page.pageNum = Math.ceil(res.data.total / res.data.pageSize)
        //   this.findDietHistoryInfo()
        // }
      } else {
        this.$Message.error(res.data)
      }
    },

    openAddCustomFoodModal() {
      this.isAddCustomFood = true
    },
    openAddMenuFoodModal() {
      this.isAddMenuFood = true
    },

    // 记录选择的id
    changeUserId: function(e) {
      this.$set(this.itemAddForm, 'userId', e)
      // this.itemAddForm.userId = e
    },
    // 记录自定义食物
    changeCustomFoodIds: function(e) {
      let ids = e.map((item) => {
        return item.id
      })
      this.$set(this.itemAddForm, 'dietHistoryCustomFoodRelAddVOList', e)
      // this.itemAddForm.dietHistoryCustomFoodRelAddVOList = e.filter(item=>item)
      // this.itemAddForm.dietHistoryCustomFoodRelAddVOList = Object.assign([], e)
      // console.log(this.totalWeight)
    },

    changeMenuIds: function(e) {
      let ids = e.map((item) => {
        return item.id
      })

      this.$set(this.itemAddForm, 'dietHistoryMenuRelAddVOList', e)
      // this.itemAddForm.dietHistoryMenuRelAddVOList = Object.assign([], e)
    },

    searchDietHistory() {
      this.page = 1
      delete this.searchOption['userId']
      this.findDietHistoryInfo()
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
            title: ['姓名', '记录时间', '用餐类型', '用餐时间', '菜品/食物名称', '摄入量/g', '摄入能量/kcal','蛋白质','碳水化合物','脂肪','铁','钙'],
            key: ['userName', 'createTime', 'type', 'mealTime', 'dishes', 'weight', 'calorie','protein','cho','fat','fe','ca'],
            data: this.itemData,
            autoWidth: true,
            filename: '饮食记录'
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
      let res = await doDietHistoryDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findDietHistoryInfo()
      } else {
        this.$Message.error(res.data)
      }
    },

    getDetail(itemInfo) {
      this.itemDetailForm = Object.assign({}, itemInfo)
      this.isDetail = true
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
      let res = await doDietHistoryDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findDietHistoryInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedId = []
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findDietHistoryInfo()
    },

    // 用户添加modal打开
    openItemAddModal() {
      this.itemAddForm = {}
      this.$refs.itemAddForm.resetFields()
      this.isAdd = true
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

    addItem(itemAddForm) {
      this.$refs[itemAddForm].validate(async (valid) => {
        if (valid) {
          if (this.isAdd) {
            let params = {
              userId: this.itemAddForm.userId,
              type: this.itemAddForm.type,
              weight: this.totalWeight,
              calorie: this.totalCustomEnergy,
	          mealTime: this.itemAddForm.mealTime,
            }
	          if (this.itemAddForm.createTime) {
		          params.createTime = this.$refs.createtime.publicStringValue
	          }
            if (this.itemAddForm.dietHistoryCustomFoodRelAddVOList) {
              params.dietHistoryCustomFoodRelAddVOList = this.itemAddForm.dietHistoryCustomFoodRelAddVOList
            }
            if (this.itemAddForm.dietHistoryMenuRelAddVOList) {
              params.dietHistoryMenuRelAddVOList = this.itemAddForm.dietHistoryMenuRelAddVOList
              params.calorie += await this.calMenuEnergy(this.itemAddForm.dietHistoryMenuRelAddVOList)
            }
            if (!this.itemAddForm.dietHistoryCustomFoodRelAddVOList && !this.itemAddForm.dietHistoryMenuRelAddVOList) {
              this.$Message.error('请填写食物信息')
              return
            }
            // 添加
            let res = await doDietHistoryAdd(params)
            if (res.code === 200) {
              // 刷新
              await this.findDietHistoryInfo()
              this.$Message.success('添加成功')
            } else {
              this.$Message.error(res.data)
            }
          } else {
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
