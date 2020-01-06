import Main from '@/components/main'

/**
 * iview-admin中meta除了原生参数外可配置的参数:
 * meta: {
 *  title: { String|Number|Function }
 *         显示在侧边栏、面包屑和标签栏的文字
 *         使用'{{ 多语言字段 }}'形式结合多语言使用，例子看多语言的路由配置;
 *         可以传入一个回调函数，参数是当前路由对象，例子看动态路由和带参路由
 *  hideInBread: (false) 设为true后此级路由将不会出现在面包屑中，示例看QQ群路由配置
 *  hideInMenu: (false) 设为true后在左侧菜单不会显示该页面选项
 *  showAlways:(false)设为true后在左侧菜单显示该页面选项，级别低于hideInMenu
 *  notCache: (false) 设为true后页面在切换标签后不会缓存，如果需要缓存，无需设置这个字段，而且需要设置页面组件name属性和路由配置的name一致
 *  access: (null) 可访问该页面的权限数组，当前路由设置的权限会影响子路由
 *  icon: (-) 该页面在左侧菜单、面包屑和标签导航处显示的图标，如果是自定义图标，需要在图标名称前加下划线'_'
 *  beforeCloseName: (-) 设置该字段，则在关闭当前tab页时会去'@/router/before-close.js'里寻找该字段名对应的方法，作为关闭前的钩子函数
 * }
 */

export default [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: 'Login - 登录',
      hideInMenu: true
    },
    component: () => import('@/view/login/login.vue')
  },
  {
    path: '/',
    name: '_home',
    redirect: '/home',
    component: Main,
    meta: {
      hideInMenu: true,
      notCache: true
    },
    children: [
      {
        path: '/home',
        name: 'home',
        meta: {
          hideInMenu: true,
          title: '首页',
          notCache: true,
          icon: 'md-home'
        },
        component: () => import('@/view/single-page/home')
      }
    ]
  },
  {
    path: '/user',
    name: 'user',
    component: Main,
    meta: {
      title: '用户管理',
      showAlways: true
    },
    children: [
      {
        path: '/user-basic-list',
        name: 'user-basic',
        meta: {
          title: '基本信息',
          icon: 'md-home'
        },
        component: () => import('@/view/user/user-basic-list')
      },
      {
        path: '/user-body-list',
        name: 'user-body',
        meta: {
          title: '体征信息',
          icon: 'md-home'
        },
        component: () => import('@/view/user/user-body-list')
      },
      {
        path: '/user-diet-list',
        name: 'user-diet',
        meta: {
          title: '饮食记录',
          icon: 'md-home'
        },
        component: () => import('@/view/user/user-diet-list')
      },
      {
        path: '/user-exercise-list',
        name: 'user-exercise',
        meta: {
          title: '科学运动',
          icon: 'md-home'
        },
        component: () => import('@/view/user/user-exercise-list')
      },
      {
        path: '/user-food-define',
        name: 'user-food-define',
        meta: {
          title: '自定义食物',
          icon: 'md-home'
        },
        component: () => import('@/view/user/user-food-define')
      }
    ]
  },
  {
    path: '/manager',
    name: 'manager',
    component: Main,
    meta: {
      title: '管理员管理',
      icon: 'md-man',
      showAlways: true
    },
    children: [
      {
        path: '/manager-manage',
        name: 'manager-manage',
        meta: {
          title: '管理员信息管理',
          icon: 'md-man'
        },
        component: () => import('@/view/manager/manager-manage')
      },
      {
        path: '/manager-login',
        name: 'manager-login',
        meta: {
          title: '管理员登陆信息',
          icon: 'md-man'
        },
        component: () => import('@/view/manager/manager-login')
      }
    ]
  },
  {
    path: '/foodComposition',
    name: 'foodComposition',
    component: Main,
    meta: {
      title: '食物成分表数据管理',
      icon: 'md-egg',
      showAlways: true
    },
    children: [
      {
        path: '/nutriTable',
        name: 'nutriTable',
        meta: {
          title: '一般营养素',
          icon: 'md-egg'
        },

        component: () => import('@/view/foodComposition/nutriTable')
      },
      {
        path: '/aminoTable',
        name: 'aminoTable',
        meta: {
          title: '氨基酸',
          icon: 'md-egg'
        },
        component: () => import('@/view/foodComposition/aminoTable')
      },
      {
        path: '/fattyTable',
        name: 'fattyTable',
        meta: {
          title: '脂肪酸',
          icon: 'md-egg'
        },
        component: () => import('@/view/foodComposition/fattyTable')
      }
    ]
  },
  {
    path: '/group',
    name: 'group',
    component: Main,
    meta: {
      title: '分组管理',
      icon: 'logo-yahoo',
      showAlways: true
    },
    children: [
      {
        path: '/groupInformation',
        name: 'groupInformation',
        meta: {
          title: '分组信息管理',
          icon: 'logo-yahoo'
        },
        component: () => import('@/view/group/groupInformation')
      }
    ]
  },
  {
    path: '/address',
    name: 'address',
    component: Main,
    meta: {
      title: '地址管理',
      icon: 'logo-yahoo',
      showAlways: true
    },
    children: [
      {
        path: '/addressInformation',
        name: 'addressInformation',
        meta: {
          title: '地址信息管理',
          icon: 'logo-yahoo'
        },
        component: () => import('@/view/address/addressInformation')
      }
    ]
  },
  {
    path: '/recipe',
    name: 'recipe',
    component: Main,
    meta: {
      title: '菜谱信息管理',

      icon: 'md-pizza',
      showAlways: true
    },
    children: [
      {
        path: '/recipeType',
        name: 'recipeType',
        meta: {
          title: '菜谱类型管理',
          icon: 'md-apps'
        },
        component: () => import('@/view/recipe/recipeType')
      },
      {
        path: '/originalRecipe',
        name: 'originalRecipe',
        meta: {
          title: '原始菜谱管理',
          icon: 'md-egg'
        },
        component: () => import('@/view/recipe/originalRecipe')
      },
      {
        path: '/standardRecipe',
        name: 'standardRecipe',
        meta: {
          title: '标准化菜谱管理',
          icon: 'md-egg'
        },
        component: () => import('@/view/recipe/standardRecipe')
      }
    ]
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: Main,
    meta: {
      title: '用户反馈管理',
      icon: 'md-egg',
      showAlways: true
    },
    children: [
      {
        path: '/feedback-manage',
        name: 'feedback-manage',
        meta: {
          title: '反馈信息列表',
          icon: 'md-egg'
        },
        component: () => import('@/view/feedback/feedback-manage')
      }
    ]
  },
  {
    path: '/message',
    name: 'message',
    component: Main,
    meta: {
      title: '推送消息管理',
      icon: 'md-egg',
      showAlways: true
    },
    children: [
      {
        path: '/message-manage',
        name: 'message-manage',
        meta: {
          title: '推送消息列表',
          icon: 'md-egg'
        },
        component: () => import('@/view/message/message-manage')
      }
    ]
  }
]
