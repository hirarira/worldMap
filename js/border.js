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
      label: {
        /** 国単位 */
        country: L.featureGroup(),
        /** 都道府県レベル */
        prefecture: L.featureGroup(),
        /** 市区町村レベル */
        city: L.featureGroup()
      }
    }
    /** 行政区分作成モードでピンを立てる地点の一覧
     * 全て立てると重くなるので、必要なものだけ立てる
     */
    this.showPrefectureModePointNameList = [
      "エスタレスト州"
    ]
    const fileList = [
      'prefecture/mabetic.json',
      'prefecture/roulette.json',
      'prefecture/elable.json',
      'city/letn.json',
      'city/nazadali.json',
      'country/country.json'
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

  /** 名称ラベルを作成する */
  makeNameLabels = () => {
    // 各ファイルに対してforEach
    this.borderFiles.forEach((file) => {
      // 各ファイルの行政区分
      file.forEach((prefecture) => {
        if(prefecture.name && prefecture.nameLatlng && prefecture.nameLatlng.length > 1) {
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
          /** 規模に応じて追加するレイヤーを変える */
          switch(prefecture.category) {
            /** 国レベル */
            case 'country':
              this.sectionLayers.label.country.addLayer(marker);
              break;
            /** 都道府県レベル */
            case 'prefecture':
              this.sectionLayers.label.prefecture.addLayer(marker);
              break;
            /** 市区町村レベル */
            default:
              this.sectionLayers.label.city.addLayer(marker);
              break;
          }
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
        console.log(prefecture);
        if(!this.showPrefectureModePointNameList.includes(prefecture.name)) {
          return;
        }
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
              return '#ffbf7f';
            case 2:
              return '#ffff7f';
            case 3:
              return '#bfff7f';
            case 4:
              return '#7fff7f';
            case 5:
              return '#7fffbf';
            case 6:
              return '#7fffff';
            case 7:
              return '#7fbfff';
            case 8:
              return '#7f7fff';
            case 9:
              return '#bf7fff';
            case 10:
              return '#ff7fff';
            case 11:
              return '#ff7fbf';
            case 12:
              return '#ff7f7f';
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
   * 拡大率を考慮して行政区分ラベルを表示する
   * @param {boolean} isShow 
   */
  drawPrefectureLabel = () => {
    const isShow = $("#change-show-prefecture").prop("checked");
    if(isShow) {
      // 拡大率を取得する
      const zoom  = this.map.getZoom();
      /** 国ラベルは拡大率2以上で表示する */
      if(zoom > 1) {
        this.map.addLayer(this.sectionLayers.label.country);
      }
      else {
        this.map.removeLayer(this.sectionLayers.label.country);
      }
      /** 都道府県ラベルは拡大率4以上で表示する */
      if(zoom > 3) {
        this.map.addLayer(this.sectionLayers.label.prefecture);
      }
      else {
        this.map.removeLayer(this.sectionLayers.label.prefecture);
      }
      /** 市区町村ラベルは拡大率6以上で表示する */
      if(zoom > 5) {
        this.map.addLayer(this.sectionLayers.label.city);
      }
      else {
        this.map.removeLayer(this.sectionLayers.label.city);
      }
    }
    else {
      this.map.removeLayer(this.sectionLayers.label.country);
      this.map.removeLayer(this.sectionLayers.label.prefecture);
      this.map.removeLayer(this.sectionLayers.label.city);
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