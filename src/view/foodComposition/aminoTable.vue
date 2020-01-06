
<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">氨基酸管理</p>
      <Row>
        <Col span="3">
          <Button type="primary" style="width: 110px;" @click="openModal(null)">添加</Button>
        </Col>

        <Col span="3">
          <Button type="error" style="width: 110px;" @click="confirmDeleteSeletedObject">批量删除</Button>
        </Col>
        <Col span="3">
          <Button
            icon="md-download"
            style="width: 120px;"
            :loading="exportLoading"
            @click="exportExcel"
          >导出EXCEL</Button>
        </Col>

        <Col span="3">
          <Upload action nowrap :before-upload="uploadExcel" accept=".xls, .xlsx">
            <Button
              icon="ios-cloud-upload-outline"
              style="width: 120px;"
              :loading="uploadLoading"
            >导入EXCEL</Button>
          </Upload>
        </Col>
        <Col span="4">
          <Button
            type="primary"
            v-if="debug"
            style="width: 170px;"
            @click="deleteAllAmino"
          >删除所有氨基酸(测试用)</Button>
        </Col>
        <Col span="5" offset="3">
          <Input
            @on-change="handleSearch"
            v-if="false"
            v-model="searchValue.name"
            clearable
            icon="search"
            placeholder="输入食物名称查询（没接口，没作用）"
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

    <!--添加氨基酸Modal-->

    <Modal v-model="showModal" @on-cancel="cancelModal" :title="modalTitle" width="1000">
      <Form :model="aminoForm" ref="aminoForm" :rules="rules" :label-width="170" inline>
        <Card>
          <FormItem label="食物名称：" prop="name">
            <Input v-model="aminoForm.name" placeholder="请填写食物名称" style="width: 200px" />
          </FormItem>
          <FormItem label="食物编码：" prop="code">
            <Input v-model="aminoForm.code" placeholder="请填写食物编码" style="width: 200px" />
          </FormItem>
          <FormItem label="备注：" prop="remark">
            <Input v-model="aminoForm.remark" placeholder="请填写备注，标明食物或数据的来源" style="width: 200px" />
          </FormItem>

          <FormItem
            v-for="(item, index) in dataType"
            :key="index"
            :label="item.label + ':'"
            :prop="item.key"
          >
            <Input
              style="width: 200px"
              type="number"
              v-model.number="aminoForm[item.key]"
              :placeholder="'请填写'+item.label"
            ></Input>
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmit('aminoForm')">确认</Button>
      </div>
    </Modal>
    <!--加载中Modal-->
    <Modal v-model="loading" :title="loadingTitle" :mask-closable="false" width="1000">
      <Progress :percent="progress" />
      <div slot="footer"></div>
      <div slot="close"></div>
    </Modal>
  </div>
</template>

<script>
import excel from '@/libs/excel'
import { doAminoAdd, doAminoDel, doAminoDelMany, findAminoInfo, doAminoAddMany } from '@/api/amino-table'

// 食物用户名不能相同
export default {
  name: 'conpositonTable',
  data() {
    return {
      debug: false,
      progress: 0, // 进度
      loading: false, // 加载中
      loadingTitle: '加载中', // 加载中标题
      modalTitle: '',
      rules: {}, // 校验规则
      seletedObjectId: [], // 被选中的对象
      aminoForm: {}, // 正在被编辑的对象
      showModal: false, // 是否显示modal
      showModalComposition: false, // 是否显示成分modal
      isAdding: false, // 是否在正在添加菜谱
      isEditing: false, // 是否在正在编辑菜谱
      columns: [], // 表格的表头
      excelTitle: [], // 导入导出时表头的标题
      excelKey: [], // 导入导出时表头的标题
      page: {
        total: 1, // 数据总数
        pageNum: 1, // 当前页面
        pageSize: 10 // 每页数据条数
      },
      searchValue: {},
      showData: [], // 当前显示的数据
      recipeOptions: [], // 菜谱类型
      errorMes: '网络异常,请联系管理员',

      uploadLoading: false, // 正在导入
      exportLoading: false, // 正在导出

      dataType: []
    }
  },
  created() {
    this.dataInit()
    this.columnsInit()
    this.handlePageTurn(1)

    this.ruleInit()
    if (this.debug) console.log(this.rules)
  },
  methods: {
    // 数据初始化
    dataInit() {
      this.dataType = [
        { label: '水分（g∕100g）', key: 'water' },
        { label: '蛋白质（g∕100g）', key: 'protein' },
        { label: '异亮氨酸（mg∕100g）', key: 'ile' },
        { label: '亮氨酸（mg∕100g）', key: 'leu' },
        { label: '赖氨酸（mg∕100g）', key: 'lys' },
        { label: '含硫氨基酸（mg∕100g）', key: 'saa' },
        { label: '蛋氨酸（mg∕100g）', key: 'met' },
        { label: '胱氨酸（mg∕100g）', key: 'cys' },
        { label: '芳香族氨基酸（mg∕100g）', key: 'aaa' },
        { label: '苯丙氨酸（mg∕100g）', key: 'phe' },
        { label: '酪氨酸（mg∕100g）', key: 'tyr' },
        { label: '苏氨酸（mg∕100g）', key: 'thr' },
        { label: '色氨酸（mg∕100g）', key: 'trp' },
        { label: '缬氨酸（mg∕100g）', key: 'val' },
        { label: '精氨酸（mg∕100g）', key: 'arg' },
        { label: '组氨酸（mg∕100g）', key: 'his' },
        { label: '丙氨酸（mg∕100g）', key: 'ala' },
        { label: '天冬氨酸（mg∕100g）', key: 'asp' },
        { label: '谷氨酸（mg∕100g）', key: 'glu' },
        { label: '甘氨酸（mg∕100g）', key: 'gly' },
        { label: '脯氨酸（mg∕100g）', key: 'pro' },
        { label: '丝氨酸（mg∕100g）', key: 'ser' }
      ]
      this.excelTitle = [
        'Code',
        'FD_name',
        'Water',
        'Protein',
        'Ile',
        'Leu',
        'Lys',
        'SAA',
        'Met',
        'Cys',
        'Phe',
        'Tyr',
        'AAA',
        'Thr',
        'Trp',
        'Val',
        'Arg',
        'His',
        'Ala',
        'Asp',
        'Glu',
        'Gly',
        'Pro',
        'Ser',
        'Remark'
      ]
    },
    // 初始化表头
    columnsInit() {
      this.columns = []
      this.excelKey = ['code', 'name']
      this.columns.push({ type: 'selection', width: 60, align: 'center', fixed: 'left' })
      this.columns.push({ title: '食物编号', width: this.computeWidth('食物编号'), align: 'center', key: 'code' })
      this.columns.push({ title: '食物名称', width: 200, align: 'center', key: 'name' })
      this.dataType.forEach((type) => {
        this.excelKey.push(type.key)
        this.columns.push({
          title: type.label,
          width: this.computeWidth(type.label),
          align: 'center',
          key: type.key
        })
      })
      this.excelKey.push('remark')
      this.columns.push({ title: '备注', width: this.computeWidth('备注'), align: 'center', key: 'remark' })

      this.columns.push({
        title: '操作',
        align: 'center',
        key: 'handle',
        width: 200,
        fixed: 'right',
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
                      content: `<p>删除: ${params.row.name} 后无法恢复,确认删除?</p>`,
                      okText: '确认',
                      onOk: () => {
                        this.doAminoDel(params.row)
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
    // 初始化校验规则
    ruleInit() {
      this.rules = {}
      this.rules['name'] = [{ required: true, message: '食物名称不能为空', trigger: 'change' }]
      this.rules['code'] = [{ required: true, message: '食物编号不能为空', trigger: 'change' }]
      /* this.dataType.forEach((type) => {
        this.rules[type.key] = [{ type: 'number', required: true, message: type.label + '不能为空', trigger: 'change' }]
      }) */
    },
    // 计算表头宽度
    computeWidth(str) {
      let blen = 0
      for (let i = 0; i < str.length; i++) {
        if ((str.charCodeAt(i) & 0xff00) !== 0) {
          blen++
        }
        blen++
      }
      return blen * 9 < 100 ? 100 : blen * 9
    },
    // 页面翻页
    // pageIndex 翻到第pageIndex页
    async handlePageTurn(pageIndex) {
      // pageIndex不能小于一
      pageIndex = pageIndex < 1 ? 1 : pageIndex
      this.searchValue.page = pageIndex
      let res = await findAminoInfo(this.searchValue)
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
      // this.handlePageTurn(1)
    },

    // 存储所有的勾选的对象的id
    batchSelect(selection) {
      this.seletedObjectId = []
      if (this.debug) console.log(selection)
      selection.forEach((row) => {
        this.seletedObjectId.push(row.id)
      })
    },

    // 返回全为1的氨基酸
    testAminoForm() {
      let obj = {}
      this.dataType.forEach((type) => {
        obj[type.key] = 1
      })
      obj['name'] = '1'
      obj['code'] = '1'
      return obj
    },
    // 打开氨基酸添加model
    openModal(row) {
      this.$refs.aminoForm.resetFields()

      if (row === null) {
        this.aminoForm = this.debug ? this.testAminoForm() : {}

        this.modalTitle = '添加氨基酸'
        this.isAdding = true
      } else {
        // 编辑，因为没有api，所以不会执行
        this.aminoForm = {}
        Object.assign(this.aminoForm, row)
        this.modalTitle = '编辑氨基酸'
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
        console.log('关闭/取消modal', this.aminoForm)
      }
      // 刷新当前页
      this.handlePageTurn(this.page.pageNum)
    },

    // 处理表单提交
    handleSubmit(name) {
      if (this.debug) console.log('处理表单提交')
      this.$refs[name].validate(async (valid) => {
        // 如果表单校验无误
        if (valid) {
          if (this.debug) {
            console.log('表单校验无误')
            console.log('aminoForm', this.aminoForm)
          }
          if (this.isAdding) {
            await this.doAminoAdd(this.aminoForm)
          } else {
            await this.doAminoEdit(this.aminoForm)
          }
          this.handlePageTurn(this.page.pageNum)
        } else {
          this.$Message.error('失败，表单填写错误!')
        }
      })
    },
    // 添加氨基酸
    async doAminoAdd(obj) {
      let res = await doAminoAdd(obj)
      if (this.debug) console.log('添加氨基酸obj', obj)
      if (this.debug) console.log('添加氨基酸res', res)
      if (res.code === 200) {
        // 添加成功
        this.isAdding = false
        this.showModal = false
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 批量添加氨基酸
    async doAminoAddMany(array) {
      let res = await doAminoAddMany(array)
      if (this.debug) console.log('批量添加氨基酸obj', array)
      if (this.debug) console.log('批量添加氨基酸res', res)
      if (res.code === 200) {
        // 添加成功
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 删除氨基酸
    async doAminoDel(obj) {
      let res = await doAminoDel({ id: obj.id })
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
      this.$Modal.confirm({
        title: '请确认删除',
        content: `<p>删除所选对象后无法恢复,确认删除?</p>`,
        okText: '确认',
        onOk: () => {
          let deleteAll = this.seletedObjectId.length === this.showData.length
          let ids = this.seletedObjectId.join(',')
          this.doAminoDelMany(ids, deleteAll)
        },
        // 取消删除
        onCancel: () => {
          this.$Message.info('取消删除！')
        }
      })
    },
    // 批量删除氨基酸
    async doAminoDelMany(ids, deleteAll) {
      let res = await doAminoDelMany({ ids: ids })
      if (res.code === 200) {
        // 删除成功,刷新当前页
        // 全删，返回前一页
        if (deleteAll) this.page.pageNum--
        this.handlePageTurn(this.page.pageNum)
      } else {
        this.$Message.error(this.errorMes)
      }
    },
    // 删除所有氨基酸
    async deleteAllAmino() {
      this.loading = true
      this.progress = 0
      this.loadingTitle = '正在删除所有氨基酸'
      // 获取所有氨基酸
      let data = await findAminoInfo({ size: this.page.total })
      data = data.data.list
      let ids = []
      // 得到ids
      let length = data.length
      for (let i = 0; i < length; i++) {
        this.progress = (100 * i) / length
        ids.push(data[i].id)
        if (i % 100 === 0) {
          await doAminoDelMany({ ids: ids.join(',') })
          ids = []
        }
      }
      // 删除
      await doAminoDelMany({ ids: ids.join(',') })
      // 刷新页面
      this.handlePageTurn(this.page.pageNum)
      this.loading = false
    },
    // 导出Excel
    async exportExcel() {
      // 查询所有氨基酸
      let data = await findAminoInfo({ size: this.page.total })
      data = data.data.list
      if (data.length === 0) {
        this.$Message.info('表格数据不能为空！')
      } else {
        // 开始导出
        this.exportLoading = true
        const params = {
          data: data,
          key: this.excelKey,
          title: this.excelTitle,
          filename: '《氨基酸》',
          autoWidth: true
        }
        excel.export_array_to_excel(params)
        this.exportLoading = false
      }
    },
    uploadExcel(file) {
      if (this.uploadLoading) return false
      const fileExt = file.name
        .split('.')
        .pop()
        .toLocaleLowerCase()
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        this.readFile(file)
      } else {
        this.$Notice.warning({
          title: '文件类型错误',
          desc: '文件：' + file.name + '不是EXCEL文件，请选择后缀为.xlsx或者.xls的EXCEL文件。'
        })
      }
      return false
    },
    // 读取文件
    readFile(file) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadstart = (e) => {
        this.uploadLoading = true
      }
      reader.onerror = (e) => {
        this.$Message.error('文件读取出错')
      }
      reader.onload = (e) => {
        const data = e.target.result
        const { header, results } = excel.read(data, 'array')
        this.loadDate(header, results)
      }
    },
    // 将数据加入数据库
    async loadDate(header, dataIn) {
      let allData = []
      this.loading = true
      this.progress = 0
      this.loadingTitle = '正在导入数据'
      // 循环导入每一行数据
      let length = dataIn.length
      for (var i = 0; i < length; i++) {
        this.progress = (100 * i) / length
        var dataSave = {}
        // 读取每一列的数据
        for (let j = 0; j < this.excelTitle.length; j++) {
          if (dataIn[i][this.excelTitle[j]] !== undefined) {
            let dataInWithSpace = dataIn[i][this.excelTitle[j]].replace(/^\s+|\s+$/g, '')
            dataSave[this.excelKey[j]] = dataInWithSpace
          }
        }

        // 将数据类型的数据从字符串转为数字
        this.dataType.forEach((type) => {
          if (dataSave[type.key] !== undefined) {
            let num = parseFloat(dataSave[type.key])
            if (!isNaN(num)) {
              dataSave[type.key] = parseFloat(dataSave[type.key])
            } else {
              delete dataSave[type.key]
            }
          }
        })
        allData.push(dataSave)
        if (i % 100 === 0) {
          await this.doAminoAddMany(allData)
          allData = []
        }
        // await this.doAminoAdd(dataSave)
      }
      await this.doAminoAddMany(allData)
      this.uploadLoading = false
      this.$Message.info('文件读取成功')
      this.loading = false
    }
  }
}
</script>

<style scoped>
</style>
