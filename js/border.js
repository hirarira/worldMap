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
      'prefecture/mabetic.json',
      'city/letn.json',
      'city/nazadali.json'
    ];
    (async () => {
      this.borderFiles = await Promise.all(
        fileList.map(async (fileName) => {
          return await this.readBorderFile(fileName);
        })
      )
      /** ポリゴン情報を作成する */
      this.makePolygon();
      /** 名称ラベルを追加する */
      this.makeNameLabels();
      /** Point情報を作成する */
      this.makePoints();
      /** 市区町村境界を表示する */
      this.map.addLayer(this.sectionLayers.backend);
    })();
  }

  fixNamleLabelFontSize = (zoom) => {
    if (zoom < 3) {
      return "12px";
    } else if (zoom < 4) {
      return "14px";
    } else {
      return "16px";
    }
  }

  makeNameLabels = () => {
    // 各ファイルに対してforEach
    this.borderFiles.forEach((file) => {
      // 各ファイルの行政区分
      file.forEach((prefecture) => {
        if(prefecture.name && prefecture.nameLatlng) {
          const divIcon = L.divIcon({
            html: prefecture.name,
            className: 'placeNameIcon',
            iconSize: [200, 35],
            iconAnchor: [75, -10]
          })
          const marker = L.marker(prefecture.nameLatlng,{
            icon: divIcon,
            interactive: false,
            keyboard: false,
          })
          this.sectionLayers.label.addLayer(marker);
        }
      })
    })
  }

  /** 作成用のPoint情報を作成する */
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
        const color = (()=>{
          switch(prefecture.fillColor) {
            case 1:
              return '#ff8c00';
            case 2:
              return '#7fffd4';
            case 3:
              return '#00bfff';
            case 4:
              return '#b22222';
            default:
              return prefecture.fillColor;
          }
        })()
        const polygon = L.polygon([
          prefecture.polygon
        ],
        {
          color: prefecture.color,
          fillColor: color,
          fillOpacity: 0.3,
        });
        this.sectionLayers.backend.addLayer(polygon);
      })
    })
  }

  /**
   * 市区町村ラベルを表示するか
   * @param {boolean} isShow 
   */
  isShowPrefectureLabel = (isShow) => {
    if(isShow) {
      this.map.addLayer(this.sectionLayers.label);
    }
    else {
      this.map.removeLayer(this.sectionLayers.label);
    }
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