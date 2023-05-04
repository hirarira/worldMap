"use strict";

// Station情報からLinesを抽出する
const formatLines = (line) => {
  const stations = line.stations;
  return stations.map((station, index)=>{
    if(stations[index+1] === undefined) {
      return null;
    }
    const dep = [station.pos.x, station.pos.y];
    const arr = [stations[index+1].pos.x, stations[index+1].pos.y];
    return [dep, arr];
  })
  .filter((x)=>{
    return x !== null;
  });
}

/** マップ表示Class */
class LeafletMap {
  /**
   * @type {number} 1kmに相当するマップ上の距離1
   */
  static ONE_KM_TO_MAPDISTANCE = 0.128;
  /**
   * @param {string} mode 
   */
  constructor(mode) {
    /**
     * マップ表示モード
     * @type {string}
     * normal | distanceMode | inputMode | emphasisLineMode | makePrefectureMode
     */
    this.mode = mode;
    /**
     * @type {L.map}
     */
    this.map = L.map('map', {
      minZoom: 1,
      maxZoom: 10,
      center: [-225, 166],
      zoom: 4,
      crs: L.CRS.Simple
    });
    const defaultOption = {
      minNativeZoom: 2,
      maxNativeZoom: 2,
      minZoom: 1,
      maxZoom: 10,
      pathType: 'default',
      isShow: true,
      map: this.map
    }
    const defaultHide = {
      ...defaultOption,
      isShow: false
    }
    const dummy = {
      ...defaultOption,
      pathType: 'dummy',
      minNativeZoom: 1,
      maxNativeZoom: 10
    }

    /** 
     * 画像レイヤー
     * ラインやポリゴンによって構成されるレイヤーは別の管轄となる
     */
    this.layers = {
      /** 背景*/
      base: new Layer('base', defaultOption),
      /** 鉄道路線（画像） */ 
      train: new Layer('train', defaultOption),
      /** 標高 */
      elevation: new Layer('elevation', defaultHide),
      /** 地点名・国境（画像）*/
      placeName: new Layer('placeName', defaultOption),    
      /** 距離凡例レイヤー */
      distanceExample: new DistanceExample(this.map),
      /** 国境・行政区分区境レイヤー */
      border: new Border(this.map)
      // dummy: new Layer('dummy', dummy),
    }
    
    /** 駅・路線情報レイヤー */
    this.station = new Station(this.map);

    /** 表示可能範囲 */
    this.map.setMaxBounds(new L.LatLngBounds([0,0], [-320,512]));
    /** 現在表示中の座標情報を表示する */
    this.show = {
      train: true,
      elevation: false,
      placeName: true,
      trainDetail: false,
      stationMarker: true,
      border: true
    }
    this.lines = [];
    // 新しくクリックして作られた駅一覧
    this.clickPositonList = [];

    // 新しくクリックされたポイント一覧
    this.clickDistanceList = {
      totalDistance: 0,
      points: [],
      layer: L.featureGroup()
    };
    this.map.addLayer(this.clickDistanceList.layer);
    // クリックした地点情報を表示する
    this.map.on('click', this.onClickMap);
    this.map.on('zoomend',  this.onZoomMap)
    // 描画をし直す
    this.redrawLayerys();
  }

  // マップ中をクリックした際に呼ばれるイベント
  onClickMap = (e) => {
    if(['normalMode', 'emphasisLineMode'].includes(this.mode)) {
      return;
    }
    // 最後にクリックしたポイントを取り出す
    const beforePoint = this.clickDistanceList.points.slice(-1)[0];
    const latlng = [e.latlng.lat, e.latlng.lng];
    this.clickDistanceList.points.push(latlng)
    switch(this.mode) {
      // 鉄道路線追加モードの場合
      case 'inputMode':
        this.setNewStation(e);
        break;
      // それ以外のモードの場合
      default:
        this.clickDistanceList.layer.addLayer(
          L.marker(latlng)
        )
        break;
    }
    // 2回目以降のクリックならラインを引く
    if(beforePoint) {
      const lineOption = {
        weight: 5,
        color: '#333333'
      }
      const linePos = [
        beforePoint,
        latlng
      ]
      this.clickDistanceList.layer.addLayer(
        L.polyline(linePos, lineOption)
      );
      switch(this.mode) {
        /** 距離測定モードの場合 */
        case 'distanceMode':
          // 距離を求める
          const sectionDistance = calcDistance(beforePoint, latlng);
          this.clickDistanceList.totalDistance += sectionDistance;
          const showDistance = Math.round(this.clickDistanceList.totalDistance*1000)/1000;
          $('#totalDistance').text(showDistance);
          $('#sectionDistance').text(sectionDistance);
          break;
        /** 行政区分作成モードの場合 */
        case 'makePrefectureMode':
          this.clickPositonList.push([
            e.latlng.lat,
            e.latlng.lng
          ]);
          // クリック中の座標情報をJSON文字列として保存する
          $('#outputPrefectureJSON').val(JSON.stringify(this.clickPositonList));
          break;
      }
    }
  }

  // マップ上の距離測定イベントをリセットする
  resetDistanceMarker = () => {
    $('#totalDistance').text(0.000);
    this.map.removeLayer(this.clickDistanceList.layer);
    this.clickDistanceList = {
      totalDistance: 0,
      points: [],
      layer: L.featureGroup()
    };
    this.map.addLayer(this.clickDistanceList.layer);
    // 路線作成モードの情報もリセットする
    this.clickPositonList = [];
  }

  // マップ上に新しい駅をプロットする（inputModeのみ）
  setNewStation = (e) =>{
    const latlng = e.latlng;
    const stationName = $("#nextStationName").val();
    const stationList = stationName.split('\n');
    const firstStation = stationList[0];
    const station = {
      label: firstStation,
      pos: {
        x: latlng.lat,
        y: latlng.lng
      },
      type: 'main'
    };
    const afterList = stationList.slice(1,);
    const afterStr = afterList.length > 0? afterList.reduce((x,a)=>{ return `${x}\n${a}`; }): '';
    // クリックした箇所にピンを建てる
    this.station.setStationMarker(station);
    // クリックポジション情報を追加する
    this.clickPositonList.push(station)
    // 入力駅名を削除する
    $("#nextStationName").val(afterStr);
    // JSON一覧を出力する
    $("#outputJSON").val(JSON.stringify(this.clickPositonList))
  }

  //  マップの拡大率を変更したときに呼ばれるイベント
  onZoomMap = (e) => {
    this.station.drawStationMarker();
  }

  // 描画をし直す
  redrawLayerys = () => {
    // 初めにすべてを非表示にする
    Object.keys(this.layers).forEach((x)=>{
      if(x !== 'base' && this.layers[x].isShow) {
        this.layers[x].hyde();
      }
    });
    const showOrderList = ['elevation', 'placeName', 'train'];
    showOrderList.forEach((x)=>{
      if(this.show[x]) {
        this.layers[x].show();
      }
    });
    // テスト描画
    // this.testLayer.addTo(this.map);
  }

  // 列車表示の切り替え
  changeRailway = () => {
    this.show.train = !this.show.train;
    this.redrawLayerys();
  }
  // ナーザダリ近郊路線図表示切り替え
  changeDetailRailway = () => {
    this.show.trainDetail = !this.show.trainDetail;
    this.redrawLayerys();
  }
  // 標高表示切り替え
  changeElevation = () => {
    this.show.elevation = !this.show.elevation;
    this.redrawLayerys();
  }
  // 地名表示切り替え
  changePlaceName = () => {
    this.show.placeName = !this.show.placeName;
    this.redrawLayerys();
  }
  // 駅マーカー切り替え
  changeStationMarker = () => {
    this.station.swichShowMarker();
    this.station.drawStationMarker();
  }
  /** モードチェンジ */
  changeMode = () => {
    switch(this.mode) {
      case 'makePrefectureMode':
        this.layers.border.onMakePrefectureMode();
        break;
      default:
        this.layers.border.offMakePrefectureMode();
        break;
    }
  }
}

// 二点感距離を求める
function calcDistance(posA, posB) {
  const a = Math.abs(posB[0] - posA[0]);
  const b = Math.abs(posB[1] - posA[1]);
  const distance = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  const km = distance / LeafletMap.ONE_KM_TO_MAPDISTANCE;
  return Math.round(km*1000)/1000;
}