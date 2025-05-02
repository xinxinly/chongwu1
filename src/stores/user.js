import { defineStore } from 'pinia'
// pnia 是一个状态管理插件，它可以帮助我们管理状态，它可以帮助我们在多个组件之间共享状态，并且它可以自动地跟踪状态的变化，并通知所有相关的组件更新。
export const useUserStore = defineStore('user', {
  state: () => ({
    username: JSON.parse(localStorage.getItem('username')).username || ''
  }),

  actions: {
    setUser (username) {
      this.username = username
      localStorage.setItem('username', username)
    },

    clearUser () {
      this.username = ''
      localStorage.removeItem('username')
    }
  }
})
