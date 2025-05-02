import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import mapboxgl from 'mapbox-gl'

// 图标映射
const iconMap = {
  business: './images/business.png',
  park: './images/park.png',
  hospital: './images/hospital.png'
}

// 存储点击事件监听器，用于后续移除
let clickListener = null

// 添加点数据到地图
export const addPointsToMap = async (map) => {
  try {
    // 等待地图样式加载完成
    if (!map.isStyleLoaded()) {
      await new Promise(resolve => {
        map.once('style.load', resolve)
      })
    }

    const response = await request.get('/points/all')
    if (!response.success) {
      throw new Error('获取点数据失败')
    }

    const points = response.data

    // 添加点数据源
    map.addSource('points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          },
          properties: {
            id: point.id,
            name: point.name,
            type: point.type,
            tel: point.tel,
            adname: point.adname,
            address: point.address,
            categories: point.categories
          }
        }))
      }
    })

    // 为每种类型添加图层
    await Promise.all(Object.keys(iconMap).map(async category => {
      // 添加图标
      await new Promise((resolve, reject) => {
        map.loadImage(iconMap[category], (error, image) => {
          if (error) reject(error)
          else {
            map.addImage(`${category}-icon`, image)
            resolve()
          }
        })
      })
      // 添加图层
      map.addLayer({
        id: `points-${category}`,
        type: 'symbol',
        source: 'points',
        filter: ['==', ['get', 'categories'], category],
        layout: {
          'icon-image': `${category}-icon`,
          'icon-size': 0.5,
          'icon-anchor': 'bottom'
        }
      })
    }))

    // 添加点击事件
    clickListener = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: Object.keys(iconMap).map(category => `points-${category}`)
      })
      if (features.length > 0) {
        const feature = features[0]
        const properties = feature.properties
        const coordinates = feature.geometry.coordinates

        // 创建弹出窗口
        new mapboxgl.Popup({
          className: 'custom-popup',
          closeButton: false,
          maxWidth: '300px',
          offset: [0, -35]
        })
          .setLngLat(coordinates)
          .setHTML(`
            <div class="popup-content">
              <h3 class="popup-title">${properties.name}</h3>
              <div class="popup-info">
                <p><span class="label">类型</span>${properties.type}</p>
                <p><span class="label">电话</span>${properties.tel}</p>
                <p><span class="label">地址</span>${properties.address}</p>
                <p><span class="label">区域</span>${properties.adname}</p>
              </div>
            </div>
          `)
          .addTo(map)
      }
    }
    // 添加点击事件监听
    addPointsFromMap(map)
    return true
  } catch (error) {
    console.error('添加点数据失败:', error)
    ElMessage.error('添加点数据失败')
    return false
  }
}

export const addPointsFromMap = (map) => {
  map.on('click', clickListener)
}

// 移除点数据
export const removePointsFromMap = (map) => {
  // 移除点击事件监听
  if (clickListener) {
    map.off('click', clickListener)
  }
}

// 添加热力图
export const addHeatmapLayer = (map) => {
  if (!map.getSource('points')) return

  // 添加热力图图层
  map.addLayer({
    id: 'points-heat',
    type: 'heatmap',
    source: 'points',
    layout: {
      visibility: 'none' // 默认隐藏
    },
    paint: {
      // 热力图强度
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'mag'],
        0, 0,
        6, 1
      ],
      // 热力图颜色 - 使用标准热力图颜色
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgba(0, 255, 255, 1)',
        0.4, 'rgba(0, 255, 0, 1)',
        0.6, 'rgba(255, 255, 0, 1)',
        0.8, 'rgba(255, 128, 0, 1)',
        1, 'rgba(255, 0, 0, 1)'
      ],
      // 热力图半径
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 2,
        9, 20
      ],
      // 热力图不透明度
      'heatmap-opacity': 0.8
    }
  }, 'points-business') // 确保热力图在点图层下面
}

// 修改 togglePointsVisibility 函数，添加热力图控制
export const togglePointsVisibility = (map, layerId, visible = true) => {
  if (layerId === 'heatmap') {
    if (map.getLayer('points-heat')) {
      map.setLayoutProperty('points-heat', 'visibility', visible ? 'visible' : 'none')
    }
  } else {
    if (map.getLayer(`points-${layerId}`)) {
      map.setLayoutProperty(`points-${layerId}`, 'visibility', visible ? 'visible' : 'none')
    }
  }
}
