"use strict";

/** 国境・地方行政区域表示レイヤー */
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
      /** ポリゴン情報を作成する */
      this.makePolygon();
    })();
  }

  makePolygon = () => {
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
  }

  drawBorders = () => {
    this.map.addLayer(this.sectionLayer);
  }

  hide = () => {
    this.map.removeLayer(this.sectionLayer);
  }

  /** 地方行政区域作成モードがONになる */
  onMakePrefectureMode = () => {
    this.drawBorders();
  }

  /** 地方行政区域作成モードがOFFになる */
  offMakePrefectureMode = () => {
    this.hide();
  }

  /** 行政区分のポリゴンファイルを一括で読み込む */
  readBorderFile = async (file) => {
    return new Promise((resolve, reject) => {
      const url = `./json/border/${file}`;
      $.getJSON(url, (data) => {
        resolve(data);
      });
    })
  }
}