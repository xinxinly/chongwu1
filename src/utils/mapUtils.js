// 区域颜色配置
export const areaColors = {
  历下区: '#FF9999',
  市中区: '#99FF99',
  槐荫区: '#9999FF',
  天桥区: '#FFFF99',
  历城区: '#FF99FF',
  长清区: '#99FFFF',
  章丘区: '#FFB366',
  济阳区: '#B366FF',
  莱芜区: '#66FFB3',
  钢城区: '#66B3FF',
  平阴县: '#FFB3B3',
  商河县: '#B3FFB3'
}

// 添加行政区划到地图
export const addAdministrativeRegion = (map, geojsonData) => {
  // 添加面数据源
  if (!map.getSource('administrative-region')) {
    map.addSource('administrative-region', {
      type: 'geojson',
      data: geojsonData
    })
  }

  // 添加面图层
  if (!map.getLayer('administrative-region-fills')) {
    map.addLayer({
      id: 'administrative-region-fills',
      type: 'fill',
      source: 'administrative-region',
      paint: {
        'fill-color': ['get', ['to-string', ['get', 'name']], ['literal', areaColors]],
        'fill-opacity': 0
      }
    })
  }

  // 添加边界线图层
  if (!map.getLayer('administrative-region-borders')) {
    map.addLayer({
      id: 'administrative-region-borders',
      type: 'line',
      source: 'administrative-region',
      paint: {
        'line-color': ['get', ['to-string', ['get', 'name']], ['literal', areaColors]],
        'line-width': 4
      }
    })
  }

  // 添加标签图层
  if (!map.getLayer('administrative-region-labels')) {
    map.addLayer({
      id: 'administrative-region-labels',
      type: 'symbol',
      source: 'administrative-region',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-anchor': 'center',
        'text-justify': 'center'
      },
      paint: {
        'text-color': ['get', ['to-string', ['get', 'name']], ['literal', areaColors]],
        'text-halo-color': '#000',
        'text-halo-width': 1
      }
    })

    // 根据缩放级别控制标签显示
    map.setLayerZoomRange('administrative-region-labels', 0, 10)
  }
}

// 移除行政区划图层
export const removeAdministrativeRegion = (map) => {
  if (map.getLayer('administrative-region-labels')) {
    map.removeLayer('administrative-region-labels')
  }
  if (map.getLayer('administrative-region-borders')) {
    map.removeLayer('administrative-region-borders')
  }
  if (map.getLayer('administrative-region-fills')) {
    map.removeLayer('administrative-region-fills')
  }
  if (map.getSource('administrative-region')) {
    map.removeSource('administrative-region')
  }
}
