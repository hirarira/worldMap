"use strict";

class DistanceExample {
  constructor(map) {
    this.map = map;
    this.sectionLayer = L.featureGroup();
    
    const tenKm = LeafletMap.ONE_KM_TO_MAPDISTANCE * 10;
    const initX = 54;

    /** 凡例の背景 */
    const polygon = L.polygon([
        [-260, initX],
        [-260, initX+(tenKm*12)],
        [-268, initX+(tenKm*12)],
        [-268, initX],
      ],
      {
        color: '#bbbbbb',
        fillColor: '#888888',
        fillOpacity: 0.3,
      }
    )
    this.sectionLayer.addLayer(polygon);
  
    /** 10kmおきに表示する縦棒とXXkmの表示文字列 */
    [...Array(11)].forEach((x, a)=>{
      const addX = (a+1)*tenKm;
      const marker = L.marker(
        [-266, initX+addX],
        {icon: L.divIcon(
          {
            html: `${a*10} km`,
            className: 'divExp',
            iconSize: [50, 20],
            iconAnchor: [10, -10]
          }
        )}
      )
      this.sectionLayer.addLayer(marker);
    })

    /** 横棒 */
    const lineOption = {
      weight: 5,
      color: "#000000"
    }
    const latlngs = [...Array(11)].map((x,a)=>{
      return [[-262, initX+((a+1)*tenKm)], [-266, initX+((a+1)*tenKm)]];
    });
    latlngs.push(
      [
        [-264, (initX+(1*tenKm))],
        [-264, (initX+(11*tenKm))]
      ]
    )
    const polyline = L.polyline(latlngs, lineOption);
    this.sectionLayer.addLayer(polyline);
  
    /** 最後にMapに表示 */
    this.draw();
  }

  draw = () => {
    this.map.addLayer(this.sectionLayer);
  }

}