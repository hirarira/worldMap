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

class LeafletMap {
  // 1kmに相当するマップ上の距離1
  static ONE_KM_TO_MAPDISTANCE = 0.128;
  constructor(mode) {
    this.mode = mode;
    this.map = L.map('map', {
      minZoom: 1,
      maxZoom: 9,
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
    const trainDetail = {
      ...defaultOption,
      pathType: 'zoom',
      minNativeZoom: 2,
      maxNativeZoom: 6,
    }
    const dummy = {
      ...defaultOption,
      pathType: 'dummy',
      minNativeZoom: 1,
      maxNativeZoom: 10
    }
    // 各レイヤー
    this.layers = {
      base: new Layer('base', defaultOption),
      train: new Layer('train', defaultOption),
      elevation: new Layer('elevation', defaultHide),
      placeName: new Layer('placeName', defaultOption),
      trainDetail: new Layer('trainDetail', trainDetail),
      // dummy: new Layer('dummy', dummy),
    }
    // 表示可能範囲
    this.map.setMaxBounds(new L.LatLngBounds([0,0], [-320,512]));
    const options = {
      position: 'bottomleft',
      numDigits: 7
    }
    // 現在表示中の座標情報を表示する
    L.control.mousePosition(options).addTo(this.map);
    this.show = {
      train: true,
      elevation: false,
      placeName: true,
      trainDetail: false,
      stationMarker: true
    }
    this.lines = [];
    // 新しくクリックして作られた駅一覧
    this.clickPositonList = [];
    this.station = new Station(this.map);
    // 新しくクリックされたポイント一覧
    this.clickDistanceList = {
      totalDistance: 0,
      points: [],
      layer: L.featureGroup()
    };
    this.map.addLayer(this.clickDistanceList.layer);
    // 距離凡例の描画
    this.showDistanceExample();
    // クリックした地点情報を表示する
    this.map.on('click', this.onClickMap);
    this.map.on('zoomend',  this.onZoomMap)
    // 描画をし直す
    this.redrawLayerys();
  }

  // 距離凡例を表示する
  showDistanceExample = () => {
    const tenKm = LeafletMap.ONE_KM_TO_MAPDISTANCE * 10;
    const initX = 54;
    L.polygon([
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
    ).addTo(this.map);
    [...Array(11)].forEach((x, a)=>{
      const addX = (a+1)*tenKm;
      L.marker(
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
      .addTo(this.map);
    })
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
    L.polyline(latlngs, lineOption)
    .addTo(this.map);
  }

  // 二点感距離を求める
  calcDistance = (posA, posB) => {
    const a = Math.abs(posB[0] - posA[0]);
    const b = Math.abs(posB[1] - posA[1]);
    const distance = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    const km = distance / LeafletMap.ONE_KM_TO_MAPDISTANCE;
    return Math.round(km*1000)/1000;
  }

  // マップ中をクリックした際に呼ばれるイベント
  onClickMap = (e) => {
    if(this.mode === 'inputMode') {
      this.setNewStation(e)
    }
    // 最後にクリックしたポイントを取り出す
    const beforePoint = this.clickDistanceList.points.slice(-1)[0];
    const latlng = [e.latlng.lat, e.latlng.lng];
    this.clickDistanceList.points.push(latlng)
    if(this.mode !== 'inputMode') {
      this.clickDistanceList.layer.addLayer(
        L.marker(latlng)
      )
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
      // 距離を求める
      const sectionDistance = this.calcDistance(beforePoint, latlng);
      this.clickDistanceList.totalDistance += sectionDistance;
      const showDistance = Math.round(this.clickDistanceList.totalDistance*1000)/1000;
      $('#totalDistance').text(showDistance);
      $('#sectionDistance').text(sectionDistance);
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
    this.station.showStationMarker();
  }

  // 描画をし直す
  redrawLayerys = () => {
    // 初めにすべてを非表示にする
    Object.keys(this.layers).forEach((x)=>{
      if(x !== 'base' && this.layers[x].isShow) {
        this.layers[x].hyde();
      }
    });
    const showOrderList = ['elevation', 'placeName', 'train' , 'trainDetail'];
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
  changeDetailRailway = () => {
    this.show.trainDetail = !this.show.trainDetail;
    this.redrawLayerys();
  }
  changeElevation = () => {
    this.show.elevation = !this.show.elevation;
    this.redrawLayerys();
  }
  changePlaceName = () => {
    this.show.placeName = !this.show.placeName;
    this.redrawLayerys();
  }
  changeStationMarker = () => {
    this.station.swichShowMarker();
    this.station.showStationMarker();
  }
}
