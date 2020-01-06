
<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">菜谱类型管理</p>

      <Row>
        <Col span="3">
          <Button type="primary" style="width: 110px;" @click="openModal(null)">添加</Button>
        </Col>
      </Row>
    </Card>

    <!--表格部分-->
    <Card>
      <div>
        <tree-table
          :is-fold="false"
          border
          expand-key="name"
          :expand-type="false"
          :selectable="false"
          :columns="columns"
          :data="showData"
          getCheckedProp
        >
          <template slot="action" slot-scope="{row}">
            <Button type="primary" @click="openModal(row)" style="width: 80px;marginRight: 40px;">编辑</Button>
            <Button type="error" @click="deleteObject(row)" style="width: 80px;">删除</Button>
          </template>
        </tree-table>
      </div>
    </Card>

    <!--添加/编辑Modal-->
    <Modal v-model="showModal" @on-cancel="cancelModal" :title="modalTitle" width="600">
      <Form :model="recipeTypeForm" ref="recipeTypeForm" :rules="rules" :label-width="90">
        <Card>
          <FormItem label="类型名称：" prop="name">
            <Input v-model="recipeTypeForm.name" placeholder="请填写类型名称" style="width: 200px" />
          </FormItem>
          <FormItem label="父类类型" prop="pid">
            <Select v-model="recipeTypeForm.pid" style="width: 200px">
              <Option v-for="i in recipeOptions" :value="i.value" :key="i.value">
                {{
                i.text
                }}
              </Option>
            </Select>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmit('recipeTypeForm')">确认</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { doMenuTypeAdd, doMenuTypeDel, doMenuTypeEdit, doMenuTypeDelMany, findMenuTypeInfo } from '@/api/menu-type'

export default {
  name: 'recipeType',
  data() {
    return {
      debug: false,
      modalTitle: '',
      rules: {}, // 校验规则
      seletedObjectId: [], // 被选中的对象
      recipeTypeForm: {}, // 正在被编辑的对象
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
      sourceData: [], // 原始数据
      recipeOptions: [], // 菜谱类型

      errorMes: '网络异常,请联系管理员'
    }
  },
  created() {
    this.columnsInit() // 初始化表格表头
    this.findMenuTypeInfo()

    this.ruleInit() // 初始化校验规则
  },
  methods: {
    // 初始化表头
    columnsInit() {
      // 使用tree-table实现树状表格，tree-table中的表头找不到居中的方法
      this.columns = []
      this.columns.push({ title: '类型名称', width: 120, align: 'left', key: 'name' })
      this.columns.push({ title: '菜谱级别', width: 120, align: 'left', key: 'level' })
      this.columns.push({ title: '菜谱ID', width: 120, align: 'left', key: 'id' })
      this.columns.push({
        title: '操作',
        key: 'action',
        width: '100px',
        type: 'template',
        template: 'action'
      })
    },
    // 初始化校验规则
    ruleInit() {
      this.rules = {}
      this.rules['name'] = [{ required: true, message: '类型名称不能为空', trigger: 'change' }, { validator: this.valiName, trigger: 'change' }]
      this.rules['pid'] = [
        {
          pattern: /^[A-Za-z0-9_]+$/,
          message: '父类类型Id是大于0的整数',
          trigger: 'blur'
        }
      ]
    },
    valiName(rule, value, callback) {
      if (this.isTypeExist(value)) {
        callback(new Error('菜谱类型已存在'))
      } else {
        callback()
      }
    },
    // 判断菜谱类型是否存在
    isTypeExist(name) {
      for (let i = 0; i < this.recipeOptions.length; i++) {
        if (name === this.recipeOptions[i].text) {
          return true
        }
      }
      return false
    },
    // 获取父类选项，不可以选自己
    getRecipeOptions(name) {
      let result = [{ text: '无', value: 0 }]
      for (let i = 0; i < this.sourceData.length; i++) {
        let type = this.sourceData[i]
        if (type.name !== name) {
          result.push({ text: type.name, value: type.id })
        }
      }
      return result
    },
    // 数据格式转换
    changeIntoShowdata(dataIn) {
      let dataOut = []

      // 将dataIn中第1级的数据放入dataOut
      for (let i = 0; i < dataIn.length; i++) {
        dataIn[i].children = []
        if (dataIn[i].pid === 0) {
          dataIn[i].level = 1
          dataOut.push(dataIn[i])
          dataIn.splice(i, 1)
          i--
        }
      }

      let putting = true
      while (putting) {
        putting = false
        if (dataIn.length === 0) break
        for (let i = 0; i < dataOut.length; i++) {
          for (let j = 0; j < dataIn.length; j++) {
            let obj = this.putDataAInDataB(dataIn[j], dataOut[i])
            if (obj.success) {
              putting = true
              dataOut[i] = obj.dataOut
              dataIn.splice(j, 1)
            }
          }
        }
      }

      // 将没找到父类的子类设为第一级
      dataIn.forEach((row) => {
        dataOut.push(row)
      })

      return dataOut
    },

    putDataAInDataB(DataA, DataB) {
      if (DataB.id === DataA.pid) {
        // 子类的级别 = 父类级别+1
        DataA.level = DataB.level + 1
        DataB.children.push(DataA)
        return { success: true, dataOut: DataB }
      }
      if (DataB.children.length !== 0) {
        for (let i = 0; i < DataB.children.length; i++) {
          let obj = this.putDataAInDataB(DataA, DataB.children[i])
          if (obj.success) {
            DataB.children[i] = obj.dataOut
            return { success: true, dataOut: DataB }
          }
        }
      }

      return { success: false, dataOut: DataB }
    },
    deleteObject(row) {
      let ids = this.getIdsOfMenu(row, '')
      ids = ids.substr(0, ids.length - 1)
      if (this.debug) console.log('删除', ids)
      this.doMenuTypeDelMany({ ids: ids })
    },

    // 得到这个对象和它说所有子类的id
    getIdsOfMenu(row, ids) {
      ids = ids + row.id + ','
      for (let i = 0; i < row.children.length; i++) {
        ids = this.getIdsOfMenu(row.children[i], ids)
      }
      return ids
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
      this.$refs.recipeTypeForm.resetFields()

      if (row === null) {
        this.recipeOptions = this.getRecipeOptions('')
        this.recipeTypeForm = { pid: 0 }
        this.modalTitle = '添加菜谱类型'
        this.isAdding = true
      } else {
        this.recipeOptions = this.getRecipeOptions(row.name)
        this.recipeTypeForm = {}
        this.recipeTypeForm = Object.assign({}, row)
        this.modalTitle = '编辑菜谱类型'
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
        console.log('cancelModal', this.recipeTypeForm)
      }
    },
    // 处理表单提交
    handleSubmit(name) {
      if (this.debug) console.log('处理表单提交')
      this.$refs[name].validate((valid) => {
        // 如果表单校验无误
        if (valid) {
          if (this.debug) console.log('表单校验无误')

          if (this.isAdding) {
            this.doMenuTypeAdd(this.recipeTypeForm)
          } else {
            this.doMenuTypeEdit(this.recipeTypeForm)
          }
        } else {
          this.$Message.error('添加失败，表单填写错误!')
        }
      })
    },
    // 查询
    async findMenuTypeInfo() {
      let res = await findMenuTypeInfo({})
      if (this.debug) console.log('查询结果：', res)
      if (res.code === 200) {
        // 查询成功,更新
        this.showData = []
        this.showData = res.data
        this.sourceData = []
        Object.assign(this.sourceData, res.data)
        this.showData = this.changeIntoShowdata(this.showData)
      } else {
        this.$Message.error(res.data)
      }
    },
    getNames(datas) {
      let names = []
      for (let i = 0; i < datas.length; i++) {
        names.push(datas[i].name)
      }
      return names
    },
    // 添加
    async doMenuTypeAdd(obj) {
      let res = await doMenuTypeAdd(obj)
      if (this.debug) console.log('添加', res)
      if (res.code === 200) {
        // 添加成功,刷新
        this.isAdding = false
        this.showModal = false
        this.findMenuTypeInfo()
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 编辑
    async doMenuTypeEdit(obj) {
      let res = await doMenuTypeEdit(obj)

      if (this.debug) console.log('编辑结果：', res)
      if (res.code === 200) {
        // 编辑成功,刷新
        this.isEditing = false
        this.showModal = false
        this.findMenuTypeInfo()
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 删除
    async doMenuTypeDel(obj) {
      let res = await doMenuTypeDel(obj)
      if (this.debug) console.log('删除', res)

      if (res.code === 200) {
        // 删除成功,刷新
        this.findMenuTypeInfo()
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 批量删除
    async doMenuTypeDelMany(obj) {
      let res = await doMenuTypeDelMany(obj)
      if (this.debug) console.log('批量删除结果：', res)

      if (res.code === 200) {
        // 删除成功,刷新
        this.findMenuTypeInfo()
      } else {
        this.$Message.error(this.errorMes)
      }
    }
  }
}
</script>

<style scoped>
</style>
