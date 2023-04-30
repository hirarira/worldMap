"use strict";

class Border {
  constructor(map) {
    this.map = map;
    this.borderFiles = [];
    this.sectionLayer = L.featureGroup();
    const fileList = [
      'prefecture/mabetic.json'
    ];
    (async () => {
      this.borderFiles = await Promise.all(
        fileList.map(async (fileName) => {
          return await this.readBorderFile(fileName);
        })
      )
      this.drawBorders();
    })();
  }

  drawBorders = () => {
    // とりあえずテスト的に1つ目のポリゴンだけ描画
    const polygon = L.polygon([
      this.borderFiles[0]
    ],
    {
      color: '#bbbbbb',
      fillColor: '#888888',
      fillOpacity: 0.3,
    });
    this.sectionLayer.addLayer(polygon);
    this.map.addLayer(this.sectionLayer);
  }

  readBorderFile = async (file) => {
    return new Promise((resolve, reject) => {
      const url = `./json/border/${file}`;
      $.getJSON(url, (data) => {
        resolve(data);
      });
    })
  }
}