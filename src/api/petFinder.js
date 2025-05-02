import request from '@/utils/request'
/**
 * 创建宠物寻主信息
 * @param {Object} data
 * @param {string} data.ownerName - 主人姓名
 * @param {string} data.contactPhone - 联系电话
 * @param {string} data.petFeatures - 宠物特征
 * @param {number} data.lng - 经度
 * @param {number} data.lat - 纬度
 * @param {string} data.username - 登录用户名
 * @returns {Promise<{ success: boolean, message: string, data: { id: number } }>}
 */
export function createPetFinder (data) {
  return request({
    url: '/pet-finder',
    method: 'post',
    data: {
      owner_name: data.ownerName,
      contact_phone: data.contactPhone,
      pet_features: data.petFeatures,
      lng: data.lng,
      lat: data.lat,
      username: data.username
    }
  })
}

/**
 * 获取宠物寻找记录列表
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<{ success: boolean, data: { list: Array, total: number, page: number, pageSize: number } }>}
 */
export function getPetFinderListbyPage (params) {
  return request({
    url: '/pet-finder',
    method: 'get',
    params
  })
}

/**
 * 更新宠物寻找记录
 * @param {number} id - 记录ID
 * @param {Object} data - 更新数据
 * @param {string} data.contact_phone - 联系电话
 * @param {string} data.pet_features - 宠物特征
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export function updatePetFinder (id, data) {
  return request({
    url: `/pet-finder/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除宠物寻找记录
 * @param {number} id - 记录ID
 * @param {string} username - 用户名
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export function deletePetFinder (id, username) {
  return request({
    url: `/pet-finder/${id}`,
    method: 'delete',
    params: { username: username }
  })
}

/**
 * 获取所有宠物寻找记录（不分页）
 * @returns {Promise<{ success: boolean, data: Array<{
 *   id: number,
 *   owner_name: string,
 *   contact_phone: string,
 *   pet_features: string,
 *   lng: number,
 *   lat: number,
 *   username: string,
 *   created_time: string
 * }> }>}
 */
export function getPetFinderList () {
  return request({
    url: '/pet-finder/all',
    method: 'get'
  })
}
