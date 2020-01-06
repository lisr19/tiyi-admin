<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户自定义食物</p>
      <Row>
        <Col span="15">
          <Tag type="dot" color="success" v-for="item in selectedItem" :key="item.customFoodId" :name="item.customFoodId" closable @on-close="deleteItem" > {{item.name}} </Tag>
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
          disabled-hover
        ></Table>
      </div>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page
            show-total
            show-elevator
            :total="page.total"
            :page-size="5"
            :current="page.currentPage"
            @on-change="handlePageTurn"
          ></Page>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>

import { formatDate } from '@/libs/util'
import { findCustomFoodInfo } from '@/api/custom-food'

export default {
  name: 'customFoodSelect',
  computed: {},
  data() {
    return {

      itemData: [],
      // 用户列表表头数组
      columnsList: [
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
            return params.row.picture.map(function(item) {
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
          width: 150,
          render: (h, params) => {
            return h(
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
                    // 增加
                    let isSelected = this.selectedItem.some(item => {
                      return params.row.customFoodId === item.customFoodId
                    })
                    if (!isSelected) {
                      this.selectedItem.push({
                        name: params.row.foodName,
                        customFoodId: params.row.customFoodId,
                        percentage: 100,
                        weight: params.row.totalWeight,
                        energy: params.row.energy
                      })
                      this.$emit('on-change', this.selectedItem)
                    }
                  }
                }
              }, '添加')
          }
        }
      ],
      page: {
        size: 5
      },
      // 选择添加的记录
      selectedItem: [],
      searchOption: {} // 查询用参数
    }
  },

  mounted() {
    this.findCustomFoodInfo()
  },

  methods: {
    // 获取用户列表
    async findCustomFoodInfo() {
      let params = {
        userName: this.searchOption.searchName,
        page: this.page.pageNum,
        userId: this.searchOption.userId,
        name: this.searchOption.foodName,
        size: 5
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
            customFoodId: item.id,
            userId: item.userId,
            foodName: item.name,
            energy: item.energy,
            totalWeight: item.weight,
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

    deleteItem(event, name) {
      console.log(name)
      this.selectedItem.some((item, index) => {
        if (item.customFoodId === name) {
          this.selectedItem.splice(index, 1)
          return true
        }
      })
      this.$emit('on-change', this.selectedItem)
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findCustomFoodInfo()
    }
  }
}
</script>

<style scoped>
</style>
