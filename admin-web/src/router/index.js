import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { title: '找回密码', noAuth: true }
  },
{
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
    meta: { title: '重置密码', noAuth: true }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'pets',
        name: 'Pets',
        component: () => import('../views/Pets.vue'),
        meta: { title: '宠物管理', icon: 'Guide' }
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('../views/Config.vue'),
        meta: { title: '系统配置', icon: 'Setting' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { title: '个人设置', icon: 'UserFilled' }
      },
      {
        path: 'medicines',
        name: 'Medicines',
        component: () => import('../views/Medicines.vue'),
        meta: { title: '药品管理', icon: 'FirstAidKit' }
      },
      {
        path: 'medicine-reports',
        name: 'MedicineReports',
        component: () => import('../views/MedicineReports.vue'),
        meta: { title: '药品上报', icon: 'Bell' }
      },
      {
        path: 'tanks',
        name: 'Tanks',
        component: () => import('../views/Tanks.vue'),
        meta: { title: '龟缸管理', icon: 'Monitor' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

// 路由守卫：未登录强制跳转
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.noAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
