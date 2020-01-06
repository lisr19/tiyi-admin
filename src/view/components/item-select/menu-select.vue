<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">菜谱</p>
      <Row>
        <Col span="15">
          <Tag type="dot" color="success" v-for="item in selectedItem" :key="item.menuId" :name="item.menuId" closable @on-close="deleteItem" > {{item.name}} </Tag>
        </Col>
        <Col span="3" style="float:right;margin:5px" >
          <Input clearable icon="ios-search" v-model="searchOption.foodName" @on-change="searchFoodByName" placeholder="输入食物名称搜索"></Input>
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
import { findMenuInfo } from '@/api/menu'

export default {
  name: 'menuSelect',
  computed: {},
  data() {
    return {

      itemData: [],
      // 用户列表表头数组
      columnsList: [
        {
          title: '图片',
          align: 'center',
          key: 'picture',
          width: 150,
          render: (h, params) => {
            if (params.row.imgUrl) {
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
          }
        },
        {
          title: '菜品/食物名称',
          align: 'center',
          key: 'foodName'
        },
        {
          title: '菜谱类型',
          align: 'center',
          key: 'menuTypeName'
        },
        {
          title: '总重量/g',
          align: 'center',
          key: 'totalWeight'
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
                      return params.row.menuId === item.menuId
                    })
                    if (!isSelected) {
                      this.selectedItem.push({
                        name: params.row.foodName,
                        menuId: params.row.menuId,
                        percentage: 100,
                        weight: params.row.totalWeight,
                        menuCode: params.row.menuCode
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
    this.findMenuInfo()
  },

  methods: {
    // 获取用户列表
    async findMenuInfo() {
      let params = {
        userName: this.searchOption.searchName,
        page: this.page.pageNum,
        userId: this.searchOption.userId,
        name: this.searchOption.foodName,
        size: 5
      }
      let res = await findMenuInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = []
        res.data.list.forEach((item) => {
          this.itemData.push({
            menuId: item.id,
            foodName: item.name,
            menuTypeName: item.menuTypeName,
            price: item.price,
            menuCode: item.code,
            totalWeight: item.weight ? item.weight.replace(/g$/gi, '') : item.weight,
            // picture: item.imgUrl
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
          this.findMenuInfo()
        }
      } else {
        this.$Message.error(res.data)
      }
    },

    searchFoodByName() {
      this.page = 1
      delete (this.searchOption['userId'])
      this.findMenuInfo()
    },

    deleteItem(event, name) {
      this.selectedItem.some((item, index) => {
        if (item.menuId === name) {
          this.selectedItem.splice(index, 1)
          return true
        }
      })
      this.$emit('on-change', this.selectedItem)
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findMenuInfo()
    }
  }
}
</script>

<style scoped>
</style>
