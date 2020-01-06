
<template>
  <div>
    <!--按钮部分-->
    <Card>
      <p slot="title">标准菜谱管理</p>
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

        <Col span="3">
          <Button type="error" v-if="debug" style="width: 120px;" @click="deleteAllRecipe">删除所有菜谱</Button>
        </Col>

        <Col span="3" offset="9">
          <Input
            @on-change="handleSearch"
            v-model="searchValue.name"
            clearable
            icon="search"
            placeholder="输入菜谱名称查询"
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
    <Modal v-model="showModal" @on-cancel="cancelModal" :title="modalTitle" width="700">
      <Form :model="recipeForm" ref="recipeForm" :rules="rules" :label-width="100">
        <Card>
          <FormItem label="菜谱名称：" prop="name">
            <Input v-model="recipeForm.name" placeholder="请填写菜谱名称" style="width: 200px" />
          </FormItem>
          <FormItem label="菜谱类型" prop="menuTypeId">
            <Select v-model="recipeForm.menuTypeId" style="width: 200px">
              <Option v-for="i in recipeOptions" :value="i.value" :key="i.value">
                {{
                i.text
                }}
              </Option>
            </Select>
          </FormItem>
          <FormItem label="地址" prop="addressId">
            <Select v-model="recipeForm.addressId" style="width: 200px">
              <Option v-for="i in addressList" :value="i.value" :key="i.value">
                {{
                i.text
                }}
              </Option>
            </Select>
          </FormItem>
          <FormItem label="菜谱code：" prop="code">
            <Input
              :disabled="isEditing"
              v-model="recipeForm.code"
              placeholder="请填写菜谱code"
              style="width: 200px"
            />
          </FormItem>
          <FormItem label="菜谱重量：" prop="weight">
            <Input v-model="recipeForm.weight" placeholder="请填写重量" style="width: 200px" />
          </FormItem>
          <FormItem v-if="isAdding" label="菜谱图片" prop="picture">
            <imgUpload @imgUpload="addUrl" @imgDel="delUrl"></imgUpload>
          </FormItem>
          <FormItem v-if="isEditing" label="菜谱图片" prop="picture">
            <imgUpload :defaultUrl="recipeForm.imgUrl" @imgUpload="addUrl" @imgDel="delUrl"></imgUpload>
          </FormItem>
          <FormItem label="单价/￥：" prop="price">
            <Input v-model.number="recipeForm.price" placeholder="请填写单价/￥" style="width: 200px" />
          </FormItem>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmit('recipeForm')">确认</Button>
      </div>
    </Modal>
    <!--编辑材料Modal-->
    <Modal v-model="showModalComposition" @on-cancel="cancelModal" title="编辑菜谱材料" width="700">
      <Form :model="recipeForm" ref="recipeFormComposition" :label-width="100" inline>
        <Card>
          <Row>
            <Col span="12">
              <FormItem
                v-for="(item, index) in recipeForm.composition"
                :key="index"
                :label="'材料' + (index+1)"
                :prop="'composition.' + index + '.composition'"
                :rules="[{required: true, message: '材料不能为空', trigger: 'change'},{ validator: valiComposition, trigger: 'blur' }]"
              >
                <Input type="text" v-model="item.composition" placeholder="请填写材料"></Input>
              </FormItem>
            </Col>
            <Col span="12">
              <FormItem
                v-for="(item, index) in recipeForm.composition"
                :key="index"
                :label="'量' + (index+1)"
                :prop="'composition.' + index + '.quantity'"
                :rules="[{ required: true, message: '量不能为空', trigger: 'change'},{
                      pattern: /^[0-9]+.?[0-9]*g$/,
                      message: '必须是整数或小数，以符号‘g’结尾',
                      trigger: 'blur'
                    }]"
              >
                <Row>
                  <Col span="10">
                    <Input v-model="item.quantity" placeholder="请填写单位"></Input>
                  </Col>
                  <Col span="6" offset="4">
                    <Button @click="removeFormItem(index)">删除</Button>
                  </Col>
                </Row>
              </FormItem>
            </Col>
          </Row>
          <Row type="flex" justify="center">
            <Col span="18">
              <Button type="dashed" long @click="addFormItem" icon="md-add">添加材料</Button>
            </Col>
          </Row>
        </Card>
      </Form>
      <!--自定义页脚-->
      <div slot="footer">
        <Button type="error" @click="cancelModal">取消</Button>
        <Button type="primary" @click="handleSubmitComposition('recipeFormComposition')">确认</Button>
      </div>
    </Modal>
    <!--导出Modal-->
    <Modal v-model="showModalExport" @on-cancel="cancelModal" :title="errorTitle" width="1000">
      <Card>
        <Row>
          <Col span="4">
            <Button
              icon="md-download"
              style="width: 200px;"
              :loading="exportLoading"
              @click="exportExcel"
            >导出非标准数据(EXCEL)</Button>
          </Col>
        </Row>
      </Card>
      <Card>
        <div>
          <Table :columns="columnsError" :data="errorShow" border></Table>
        </div>
      </Card>
      <div slot="footer"></div>
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
  import imgUpload from '../components/img-upload/img-upload'
  import { doMenuAdd, doMenuDel, doMenuEdit, doMenuDelMany, findMenuInfo } from '@/api/menu'
  import { findMenuTypeInfo } from '@/api/menu-type'
  import { getAddress ,addAddress} from '@/api/address'

  import { doOriginCompositionDelMany, findOriginCompositionInfo } from '@/api/menu-origin-composition'

  import { doStandardCompositionAddMany, doStandardCompositionDelMany, findStandardCompositionInfo } from '@/api/menu-standard-composition'
  import { findNutriInfo } from '@/api/nutri-table'

  export default {
    name: 'standardalRecipe',
    components: {
      imgUpload
    },
    data() {
      return {
        debug: false,
        progress: 0, // 进度
        loading: false, // 加载中
        loadingTitle: '加载中', // 加载中标题
        modalTitle: '',
        rules: {}, // 校验规则
        seletedObjectId: [], // 被选中的对象
        seletedObjectCode: [], // 被选中的对象的材料
        recipeForm: {}, // 正在被编辑的对象

        showModal: false, // 是否显示modal
        showModalComposition: false, // 是否显示材料modal
        showModalExport: false, // 是否显示导出modal
        isAdding: false, // 是否在正在添加菜谱
        isEditing: false, // 是否在正在编辑菜谱
        columns: [], // 表格的表头
        columnsError: [],
        excelTitle: [], // 导入导出时表头的标题
        excelKey: [], // 导入导出时表头的标题
        page: {
          total: 1, // 数据总数
          pageNum: 1, // 当前页面
          pageSize: 10 // 每页数据条数
        },
        searchValue: {},
        showData: [], // 当前显示的数据
        errorData: [], // 导入的非标准数据
        errorShow: [], // 显示的非标准数据
        errorTitle: '导入失败数据',
        recipeOptions: [], // 菜谱类型
        addressList: [], // 地址
        compositionNames: [], // 材料名称
        errorMes: '网络异常,请联系管理员',

        uploadLoading: false, // 正在导入
        exportLoading: false // 正在导出
      }
    },
    created() {
      this.columnsInit() // 初始化表格表头
      this.handlePageTurn(1)
      this.ruleInit() // 初始化校验规则
      this.dataInit()
    },
    methods: {
      delUrl: function() {
        if (this.recipeForm.imgUrl !== undefined) {
          delete this.recipeForm.imgUrl
        }
      },
      // 记录图片url
      addUrl: function(e) {
        this.recipeForm.imgUrl = 'http://' + e
      },
      // 数据初始化
      async dataInit() {
        // 读取菜谱类型，用于填写表单时可以选择
        let res = await findMenuTypeInfo({})
        let data = res.data
        this.recipeOptions = []
        for (let i = 0; i < data.length; i++) {
          this.recipeOptions.push({ text: data[i].name, value: data[i].id })
        }


        // 读取材料名称，用于填写表单时校验是否存在
        res = await findNutriInfo({})
        res = await findNutriInfo({ size: res.data.total })
        data = res.data.list
        this.compositionNames = []
        for (let i = 0; i < data.length; i++) {
          this.compositionNames.push(data[i].name)
        }

        await this.addressDataInit()

      },
      async addressDataInit(){
        // 读取地址，用于填写表单时可以选择
        let res = await getAddress({})
        let data = res.data
        this.addressList = []
        for (let i = 0; i < data.length; i++) {
          this.addressList.push({ text: data[i].name, value: data[i].id })
        }
      },

      // 初始化表头
      columnsInit() {
        // columnsError中没有图片，操作
        this.columns = []
        this.columnsError = []
        this.excelTitle = ['序号', '菜谱名称', '菜谱类型', '地址', '重量', '单价']
        this.excelKey = ['code', 'name', 'menuTypeName', 'addressName', 'weight', 'price']

        // 添加表头
        for (let i = 0; i < this.excelKey.length; i++) {
          this.columns.push({ title: this.excelTitle[i], width: 100, align: 'center', key: this.excelKey[i] })
        }
        // 添加20个材料和量
        for (let i = 0; i < 20; i++) {
          this.excelTitle.push('材料' + (i + 1))
          this.excelTitle.push('量' + (i + 1))
          this.excelKey.push('composition' + (i + 1))
          this.excelKey.push('quantity' + (i + 1))
        }
        for (let i = 0; i < 20; i++) {
          this.columns.push({
            title: this.excelTitle[6 + i * 2],
            width: 120,
            align: 'center',
            render: (h, params) => {
              let length = params.row.composition.length
              let show = length > i ? params.row.composition[i].composition : ''
              return h('span', show)
            }
          })
          this.columns.push({
            title: this.excelTitle[7 + i * 2],
            width: 80,
            align: 'center',
            render: (h, params) => {
              let length = params.row.composition.length
              let show = length > i ? params.row.composition[i].quantity : ''
              return h('span', show)
            }
          })
        }
        Object.assign(this.columnsError, this.columns)

        this.columns.splice(0, 0, { type: 'selection', width: 60, align: 'center', fixed: 'left' })

        this.columns.splice(5, 0, {
          title: '图片',
          align: 'center',
          width: 120,
          key: 'imgUrl',
          render: (h, params) => {
            if (!params.row.imgUrl || params.row.imgUrl === '') {
              return
            }
            return h('img', {
              attrs: {
                src: 'http://' + params.row.imgUrl
              },
              style: {
                height: '75px',
                width: '75px',
                margin: '8px'
              }
            })
          }
        })
        this.columns.push({
          title: '操作',
          align: 'center',
          key: 'handle',
          width: 350,
          fixed: 'right',
          render: (h, params) => {
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
                      this.openModalComposition(params.row)
                    }
                  }
                },
                '编辑材料'
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
                        content: `<p>删除: ${params.row.name} 后无法恢复,确认删除?</p>`,
                        okText: '确认',
                        onOk: () => {
                          this.doMenuDel(params.row)
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
        this.rules['code'] = [{ required: true, message: '菜谱code不能为空', trigger: 'change' }]
        this.rules['name'] = [{ required: true, message: '菜谱名称不能为空', trigger: 'change' }]
        // this.rules['menuTypeId'] = [{ type: 'number', required: true, message: '菜谱类型不能为空', trigger: 'change' }]
      },
      // 校验填写的材料是否存在
      valiComposition(rule, value, callback) {
        if (this.isCompositionExist(value)) {
          callback()
        } else {
          callback(new Error('材料不存在'))
        }
      },
      // 判断材料是否存在
      isCompositionExist(name) {
        for (let i = 0; i < this.compositionNames.length; i++) {
          if (name === this.compositionNames[i]) {
            return true
          }
        }
        return false
      },
      // 页面翻页
      // pageIndex 翻到第pageIndex页
      async handlePageTurn(pageIndex) {
        // pageIndex不能小于一
        pageIndex = pageIndex < 1 ? 1 : pageIndex
        this.searchValue.page = pageIndex
        this.searchValue.size = 10
        let res = await findMenuInfo(this.searchValue)
        // if (this.debug) console.log('查询结果：', res)
        if (res.code !== 200) {
          this.$Message.error(res.data)
        } else {
          // 查询成功
          if (res.data.list.length === 0 && this.page.pageNum !== 1) {
            this.handlePageTurn(1)
            return
          }
          // 更新页面

          this.showData = await this.getShowDataBySourceData(res.data.list)
          this.page = {
            total: res.data.total,
            pageNum: res.data.pageNum,
            pageSize: res.data.pageSize
          }
        }
      },
      // 处理查询
      handleSearch() {
        this.handlePageTurn(1)
      },
      // 存储所有的勾选的对象的id
      batchSelect(selection) {
        this.seletedObjectId = []
        this.seletedObjectCode = []
        if (this.debug) console.log(selection)
        selection.forEach((row) => {
          this.seletedObjectId.push(row.id)
          this.seletedObjectCode.push(row.code)
        })
      },

      // 打开model
      openModal(row) {
        this.$refs.recipeForm.resetFields()
        this.recipeForm = {}
        if (row === null) {
          this.modalTitle = '添加原始菜谱'
          this.isAdding = true
        } else {
          this.recipeForm = Object.assign({}, row)
          if (this.recipeForm.imgUrl !== undefined) {
            this.recipeForm.imgUrl = 'http://' + this.recipeForm.imgUrl
          }
          this.modalTitle = '编辑原始菜谱'
          this.isEditing = true
        }
        this.showModal = true
      },
      // 打开材料model
      openModalComposition(row) {
        this.recipeForm = row
        // 填写表单时，加上一个材料
        if (this.recipeForm.composition.length === 0) {
          this.addFormItem()
        }
        this.showModalComposition = true
      },
      // 关闭/取消modal
      cancelModal() {
        this.isAdding = false
        this.isEditing = false
        this.loading = false
        this.showModalComposition = false

        this.showModal = false

        if (this.debug) {
          console.log('cancelModal', this.recipeForm)
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
              console.log('recipeForm', this.recipeForm)
            }
            if (this.recipeForm.imgUrl === undefined) {
              this.recipeForm.imgUrl = ''
            } else {
              this.recipeForm.imgUrl = this.recipeForm.imgUrl.substring(7)
            }
            if (this.isAdding) {
              await this.doMenuAdd(this.recipeForm)
            } else {
              await this.doMenuEdit(this.recipeForm)
            }
            this.handlePageTurn(this.page.pageNum)
          } else {
            this.$Message.error('添加失败，表单填写错误!')
          }
        })
      },
      async isExist(code) {
        let res = await findMenuInfo({ code: code })
        if (this.debug) {
          console.log('isExist')
        }
        for (let i = 0; i < res.data.list.length; i++) {
          if (res.data.list[i].code === code) {
            return true
          }
        }
        return false
      },
      // 添加菜谱
      async doMenuAdd(obj) {
        if (await this.isExist(obj.code)) {
          this.$Message.error('菜谱序列已被使用')
          return
        }
        let res = await doMenuAdd(obj)
        if (this.debug) console.log('添加菜谱', res)
        if (res.code === 200) {
          // 添加成功
          this.isAdding = false
          this.showModal = false
        } else {
          this.$Message.error(this.errorMes)
        }
        return res
      },
      // 编辑菜谱
      async doMenuEdit(obj) {
        if(obj[`addressId`])obj.address_id = obj.addressId

        let res = await doMenuEdit(obj)
        if (this.debug) console.log('编辑菜谱', res)
        if (res.code === 200) {
          // 编辑成功,刷新当前页
          this.isEditing = false
          this.showModal = false
        } else {
          this.$Message.error(this.errorMes)
        }
      },
      // 删除菜谱
      async doMenuDel(obj) {
        // 删除菜谱对应的材料
        await this.deleteCompositonByRecipeCode(obj.code)
        if (this.debug) console.log('删除菜谱材料')
        let res = await doMenuDel({ id: obj.id })
        if (this.debug) console.log('删除菜谱', res)
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
            this.doMenuDelMany(ids, this.seletedObjectCode, deleteAll)
          },
          // 取消删除
          onCancel: () => {
            this.$Message.info('取消删除！')
          }
        })
      },
      // 批量删除菜谱
      async doMenuDelMany(ids, codes, deleteAll) {
        // 删除菜谱对应的材料

        for (let i = 0; i < codes.length; i++) {
          this.deleteCompositonByRecipeCode(codes[i])
        }
        let res = await doMenuDelMany({ ids: ids })
        if (this.debug) console.log('批量删除菜谱', res)
        if (res.code === 200) {
          // 删除成功,刷新当前页
          // 全删，返回前一页
          if (deleteAll) this.page.pageNum--
          this.handlePageTurn(this.page.pageNum)
        } else {
          this.$Message.error(this.errorMes)
        }
      },
      async deleteCompositonByRecipeCode(recipeCode) {
        let res1 = await findStandardCompositionInfo({ menuCode: recipeCode })
        let res2 = await findOriginCompositionInfo({ menuCode: recipeCode })
        // 得到材料ids

        let ids = []
        for (let i = 0; i < res1.data.length; i++) {
          let com = res1.data[i]
          ids.push(com.id)
          if (ids.length === 100) {
            await doStandardCompositionDelMany({ ids: ids.join(',') })
            ids = []
          }
        }
        if (ids.length !== 0) {
          await doStandardCompositionDelMany({ ids: ids.join(',') })
        }
        ids = []
        for (let i = 0; i < res2.data.length; i++) {
          let com = res2.data[i]
          ids.push(com.id)
          if (ids.length === 100) {
            await doStandardCompositionDelMany({ ids: ids.join(',') })
            ids = []
          }
        }
        if (ids.length !== 0) {
          await doOriginCompositionDelMany({ ids: ids.join(',') })
        }
      },
      async deleteAllRecipe() {
        this.loading = true
        this.progress = 0
        this.loadingTitle = '正在删除所有菜谱'
        let res = await findMenuInfo({ size: this.page.total })
        if (this.debug) console.log('查询结果：', res)
        let allData = res.data.list
        let ids = []
        let length = allData.length
        for (let i = 0; i < length; i++) {
          this.progress = (100 * i) / length
          ids.push(allData[i].id)
          await this.deleteCompositonByRecipeCode(allData[i].code)
        }
        await doMenuDelMany({ ids: ids.join(',') })
        this.handlePageTurn(1)
        this.loading = false
      },

      // 处理材料表单提交
      handleSubmitComposition(name) {
        this.$refs[name].validate(async (valid) => {
          if (valid) {
            this.showModalComposition = false
            await this.editCompositon(this.recipeForm)
            this.handlePageTurn(this.page.pageNum)
          } else {
            this.$Message.error('添加失败，表单填写错误!')
          }
        })
      },
      async editCompositon(obj) {
        delete obj.createTime // createTime转为string类型再传回去会出错，所以删除
        if (obj.compositionIds !== '') {
          // 将原来的材料删除
          await doStandardCompositionDelMany({ ids: obj.compositionIds })
        }
        // 添加编辑后的材料
        let compositionJson = JSON.stringify(obj.composition)
        console.log('添加编辑的材料', compositionJson)
        await doStandardCompositionAddMany({ addList: compositionJson })
      },

      // 动态表单添加表单项
      addFormItem() {
        this.recipeForm.composition.push({
          composition: '',
          quantity: '0g',
          menuCode: this.recipeForm.code
        })
        if (this.debug) {
          console.log('addFormItem', this.recipeForm.composition)
        }
      },
      // 移除表单项
      removeFormItem(index) {
        this.recipeForm.composition.splice(index, 1)
      },

      // 将composition的id合成为一个字符串
      getCompositionIds(composition) {
        if (composition.length === 0) return ''
        let ids = []

        composition.forEach((d) => {
          ids.push(d.id)
        })
        return ids.join(',')
      },
      // 处理拿到的标准数据,得到展示数据
      async getShowDataBySourceData(data) {
        for (let i = 0; i < data.length; i++) {
          // 得到菜谱对应的材料
          let res2 = await findStandardCompositionInfo({ menuCode: data[i].code })
          // 得到材料ids
          data[i].compositionIds = this.getCompositionIds(res2.data)
          // 记录材料
          data[i].composition = res2.data
          delete data[i].createTime // createTime转为string类型再传回去会出错，所以删除
        }
        return data
      },

      // 将菜谱类型和菜谱材料合并
      combineData(data) {
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].composition.length; j++) {
            data[i]['composition' + (j + 1)] = data[i].composition[j].composition
            data[i]['quantity' + (j + 1)] = data[i].composition[j].quantity
          }
        }
        return data
      },
      // 导出Excel
      async exportExcel() {
        let data = []
        if (this.showModalExport) {
          data = this.errorData
        } else {
          // 得到所有菜谱类型
          let res = await findMenuInfo({ size: this.page.total })
          data = res.data.list
          if (data.length === 0) {
            this.$Message.info('表格数据不能为空！')
            return
          }
          // 根据菜谱类型，得到相应的菜谱材料
          data = await this.getShowDataBySourceData(data)
          // 将菜谱类型和菜谱材料合并
        }
        data = this.combineData(data)
        // 开始导出
        this.exportLoading = true
        const params = {
          data: data,
          key: this.excelKey,
          title: this.excelTitle,
          filename: this.showModalExport ? '菜谱非标准信息表' : '菜谱标准化信息表',
          autoWidth: true
        }

        excel.export_array_to_excel(params)
        this.exportLoading = false
      },
      // 导入Excel
      uploadExcel(file) {
        // 如果当前正在导入，点击导入无效果
        if (this.uploadLoading) {
          return false
        }
        if (this.isExcelFile(file)) {
          this.readFile(file)
        } else {
          this.$Notice.warning({
            title: '文件类型错误',
            desc: '文件：' + file.name + '不是EXCEL文件，请选择后缀为.xlsx或者.xls的EXCEL文件。'
          })
        }
        return false
      },
      // 判断文件是否为excel表格
      isExcelFile(file) {
        // 文件后缀
        let fileExt = file.name
          .split('.')
          .pop()
          .toLocaleLowerCase()
        return fileExt === 'xlsx' || fileExt === 'xls'
      },
      // 从文件中读取数据
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
          this.addDate(header, results)
        }
      },
      // 将数据加入数据库
      async addDate(header, datas) {
        this.loading = true
        this.progress = 0
        this.loadingTitle = '正在导入数据'
        let length = datas.length
        this.errorData = []
        // 循环导入每一行数据
        for (var i = 0; i < length; i++) {
          this.progress = (100 * i) / length
          let data = datas[i]
          // 将导入的数据转化为显示的数据
          data = await this.dataUploadToDataShow(header, data)

          // 获取原来数据库中的数据，没有则添加
          let dataInDatabase = await this.getdataInDatabase(data)
          // 如果失败，则跳过这一行数据
          if (dataInDatabase === null) continue

          // 去除非标准的材料
          data = this.deleteInvalidDate(data)
          // 合并导入的材料和原有的材料
          data = this.combineDataUploadAndDataExist(data, dataInDatabase)
          this.editCompositon(data)
        }
        this.errorShow = this.getErrorShow()
        if (this.errorShow.length !== 0) {
          this.errorTitle = '导入失败数据(一共有' + this.errorData.length + '数据导入失败，显示了' + this.errorShow.length + '条数据)'
          this.showModalExport = true
        }

        this.uploadLoading = false
        this.$Message.info('文件读取成功')
        this.cancelModal()
      },
      getTypeIdByName(type) {
        for (let i = 0; i < this.recipeOptions.length; i++) {
          if (type === this.recipeOptions[i].text) {
            // return this.recipeOptions[i].text + '  ,id:' + menuTypeId
            return this.recipeOptions[i].value
          }
        }
        return -1
      },
      async getAddressIdByName(address) {
        for (let i = 0; i < this.addressList.length; i++) {
          if (address === this.addressList[i].text) {
            // return this.recipeOptions[i].text + '  ,id:' + menuTypeId
            return this.addressList[i].value
          }
        }
        let res = await addAddress({name:address,pid: 0})
        if (res.code === 200) {
          this.addressDataInit();
          return this.getAddressIdByName(address)
        }
        else{
          return -1
        }

      },
      getErrorShow() {
        this.errorShow = []
        let size = this.errorData.length > 10 ? 10 : this.errorData.length
        for (let i = 0; i < size; i++) {
          this.errorShow.push(this.errorData[i])
        }
        return this.errorShow
      },
      async getdataInDatabase(data) {
        let res = await findMenuInfo({ code: data.code })
        res = res.data.list
        // 菜谱不存在，添加菜谱
        if (res.length === 0) {
          let error = await this.doMenuAdd(data)
          if (error.code !== 200) {
            this.errorData.push(data)
            return null
          }

          res = await findMenuInfo({ code: data.code })
          res = res.data.list
        }
        data.id = res[0].id
        await this.doMenuEdit(data)
        res = await this.getShowDataBySourceData(res)
        return res[0]
      },
      async dataUploadToDataShow(header, data) {
        let res = {}
        if (data['序号'] !== undefined) {
          data['序号'] = data['序号'].replace(/^\s+|\s+$/g, '')
          res.code = data['序号']
        }
        if (data['菜谱名称'] !== undefined) {
          data['菜谱名称'] = data['菜谱名称'].replace(/^\s+|\s+$/g, '')
          res.name = data['菜谱名称']
        }
        if (data['菜谱类型'] !== undefined) {
          let id = this.getTypeIdByName(data['菜谱类型'].replace(/^\s+|\s+$/g, ''))
          if (id !== -1) res.menuTypeId = id
        }
        if (data['地址'] !== undefined) {
          setTimeout(async ()=>{
            let id = await this.getAddressIdByName(data['地址'].replace(/^\s+|\s+$/g, ''))
            if (id !== -1) res.addressId = id
          },100)
        }
        if (data['单价'] !== undefined) {
          data['单价'] = data['单价'].replace(/^\s+|\s+$/g, '')
          res.price = data['单价']
        }
        if (data['重量'] !== undefined) {
          data['重量'] = data['重量'].replace(/^\s+|\s+$/g, '')
          res.weight = data['重量']
        }
        // 将导入的材料转为数组
        let composition = []
        for (let i = 1; i <= 20; i++) {
          if (data['材料' + i] === undefined) {
            break
          }
          data['材料' + i] = data['材料' + i].replace(/^\s+|\s+$/g, '')
          if (data['量' + i] !== undefined) {
            data['量' + i] = data['量' + i].replace(/^\s+|\s+$/g, '')
          }

          composition.push({ menuCode: res.code, composition: data['材料' + i], quantity: data['量' + i] })
        }
        res.composition = composition
        return res
      },
      // 提取data中不标准的材料，添加到errordata中
      // 返回标准的材料
      deleteInvalidDate(data) {
        // '必须是整数或小数，以符号‘g’结尾'
        const isANumberWithG = /^[0-9]+.?[0-9]*g$/

        let validComposition = []
        let invalidComposition = []
        data.composition.forEach((com) => {
          // '必须是整数或小数，以符号‘g’结尾' && 材料必须存在
          if (isANumberWithG.test(com.quantity) && this.isCompositionExist(com.composition)) {
            validComposition.push(com)
          } else {
            invalidComposition.push(com)
          }
        })
        let error = {}
        Object.assign(error, data)
        error.composition = invalidComposition
        if (invalidComposition.length !== 0 || error.weight === undefined) {
          this.errorData.push(error)
        }

        data.composition = validComposition

        // 得到材料ids
        data.compositionIds = this.getCompositionIds(data.composition)
        return data
      },
      // 添加材料
      insertCompositon(datas, com) {
        for (let i = 0; i < datas.composition.length; i++) {
          if (datas.composition[i].composition === com.composition) {
            datas.composition.splice(i, 1)
            break
          }
        }
        datas.composition.push(com)
        return datas
      },
      // 合并导入的材料和原有的材料
      combineDataUploadAndDataExist(upload, dataExist) {
        let res = dataExist
        for (let i = 0; i < upload.composition.length; i++) {
          res = this.insertCompositon(res, upload.composition[i])
        }
        res.compositionIds = dataExist.compositionIds
        return res
      }
    }
  }
  /* 数据格式
  第一种：导入的数据，，key是中文

  第二种：显示的数据，key是英文，且成分在子项中

  第三种：导出的数据，key是英文，且成分不在子项中 */
</script>

<style scoped>
</style>
