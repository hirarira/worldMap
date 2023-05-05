"use strict";

/** 国境・地方行政区域表示レイヤー */
class Border {
  /**
   * @param {L.map} map 
   * @param {() => void} addPrefecturePoint
   */
  constructor(map, addPrefecturePoint) {
    this.map = map;
    this.addPrefecturePoint = addPrefecturePoint;
    this.borderFiles = [];
    this.sectionLayers = {
      /** 背景行政区分レイヤー */
      backend: L.featureGroup(),
      /** 行政区分作成モードで表示する区分のポイントを表示するレイヤー */
      points: L.featureGroup(),
      /** 国名・地方自治体名を表示するレイヤー */
      label: L.featureGroup()
    }
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
      /** Point情報を作成する */
      this.makePoints();
      this.map.addLayer(this.sectionLayers.backend);
    })();
  }

  makePoints = () => {
    // 各ファイルに対してforEach
    this.borderFiles.forEach((file) => {
      // 各ファイルの行政区分
      file.forEach((prefecture) => {
        prefecture.polygon.forEach((point) => {
          this.sectionLayers.points.addLayer(
            L.marker(point)
              .on('click', (e) =>{
                const latlng = [
                  e.latlng.lat,
                  e.latlng.lng
                ]
                this.addPrefecturePoint(latlng);
              })
          );
        })
      })
    })
  }

  /** ポリゴン情報を作成する */
  makePolygon = () => {
    // 各ファイルに対してforEach
    this.borderFiles.forEach((file) => {
      // 各ファイルの行政区分
      file.forEach((prefecture) => {
        const polygon = L.polygon([
          prefecture.polygon
        ],
        {
          color: prefecture.color,
          fillColor: prefecture.fillColor,
          fillOpacity: 0.3,
        });
        this.sectionLayers.backend.addLayer(polygon);
      })
    })
  }

  /** 地方行政区域作成モードがONになる */
  onMakePrefectureMode = () => {
    this.map.addLayer(this.sectionLayers.points);
  }

  /** 地方行政区域作成モードがOFFになる */
  offMakePrefectureMode = () => {
    this.map.removeLayer(this.sectionLayers.points);
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