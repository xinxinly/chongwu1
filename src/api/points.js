import request from '@/utils/request'

/**
 * 获取兴趣点分页数据
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<{ success: boolean, data: { list: Array, total: number, page: number, pageSize: number } }>}
 */
export function getPoints (params) {
  return request({
    url: '/points',
    method: 'get',
    params
  })
}

/**
 * 创建兴趣点
 * @param {Object} data
 * @param {string} data.lat - 纬度
 * @param {string} data.lon - 经度
 * @param {string} data.type - 类型
 * @param {string} data.tel - 电话
 * @param {string} data.adname - 地区名
 * @param {string} data.address - 地址
 * @param {string} data.categories - 分类
 * @param {string} data.name - 名称
 * @returns {Promise<{ success: boolean, message: string, data: { id: number } }>}
 */
export function createPoint (data) {
  return request({
    url: '/points',
    method: 'post',
    data
  })
}

/**
 * 更新兴趣点
 * @param {number} id - 兴趣点ID
 * @param {Object} data - 更新数据
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export function updatePoint (id, data) {
  return request({
    url: `/points/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除兴趣点
 * @param {number} id - 兴趣点ID
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export function deletePoint (id) {
  return request({
    url: `/points/${id}`,
    method: 'delete'
  })
}
