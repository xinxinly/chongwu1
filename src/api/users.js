import request from '@/utils/request'

/**
 * 获取所有用户列表
 * @returns {Promise<{ 
 *   code: number, 
 *   data: Array<{
 *     id: number,
 *     username: string,
 *     email: string,
 *     user_role: string,
 *     created_at: string
 *   }> 
 * }>}
 */
export function getAllUsers () {
  return request({
    url: '/all',
    method: 'get'
  })
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise<{ code: number, message: string }>}
 */
export function deleteUser (id) {
  return request({
    url: `/${id}`,
    method: 'delete'
  })
}

/**
 * 更新用户角色
 * @param {number} id - 用户ID
 * @param {string} role - 新角色
 * @returns {Promise<{ 
 *   code: number, 
 *   message: string,
 *   data: {
 *     id: number,
 *     username: string,
 *     role: string
 *   }
 * }>}
 */
export function updateUserRole (id, role) {
  return request({
    url: `/${id}/role`,
    method: 'put',
    data: { user_role: role }
  })
}
