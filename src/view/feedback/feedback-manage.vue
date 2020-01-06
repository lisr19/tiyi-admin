<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">用户反馈信息</p>
      <Row>
        <Col span="10">
          <Button type="error" style="width: 80px;margin: 5px" @click="batchDelClick">批量删除</Button>
          <!--Button type="error" style="width: 80px;margin: 5px" @click="batchAddClick">Test</Button-->
        </Col>

        <Col span="4" style="float:right;margin:5px;">
          <!--DatePicker icon="seach" clearable placeholder="输入查询日期"></DatePicker-->
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
  </div>
</template>

<script>
import { formatDate } from '@/libs/util'
import { findFeedbackInfo, doFeedbackDel } from '@/api/feedback'
export default {
  name: 'feedback',
  computed: {},

  data() {
    return {
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
          key: 'userName',
          width: 100
        },
        // {
        //   title: '帐号',
        //   align: 'center',
        //   key: 'phone',
        //   width: 200
        // },
        {
          title: '记录时间',
          align: 'center',
          key: 'recordTime',
          width: 150
        },

        {
          title: '内容',
          align: 'center',
          key: 'description'
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

      searchOption: {} // 查询用参数
    }
  },

  mounted() {
    this.findFeedbackInfo()
  },
  methods: {

    async batchAddClick() {
      let params = {
        userId: 2,
        content: 'nice'
      }
      await doFeedbackAdd(params)
      this.findFeedbackInfo()
    },

    async findFeedbackInfo() {
      let params = {
        name: this.searchOption.searchName,
        page: this.page.pageNum
      }
      let res = await findFeedbackInfo(params)
      if (res.code === 200) {
        // 查询成功
        this.itemData = []
        res.data.list.forEach(item => {
          this.itemData.push({
            description: item.content,
            userName: item.userName,
            recordTime: formatDate(new Date(item.createTime), 'yyyy-MM-dd hh:mm'),
            id: item.id,
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
          this.findFeedbackInfo()
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
      let res = await doFeedbackDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findFeedbackInfo()
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
      let res = await doFeedbackDel(params)
      if (res.code === 200) {
        this.$Message.info('删除成功')
        await this.findFeedbackInfo()
      } else {
        this.$Message.error(res.data)
      }
      this.selectedId = []
    },

    // 页面翻页
    handlePageTurn(page) {
      this.page.pageNum = page
      this.findFeedbackInfo()
    }
  }
}
</script>

<style scoped>
</style>
