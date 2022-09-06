"use strict";

class Station {
  constructor(map) {
    this.map = map;
    this.sections = [];
    this.sectionLayer = L.featureGroup();
    // 表示するかどうか
    this.isShow = true;
    // 駅マーカー一覧
    this.stationMarkers =  {
      // 全国規模主要駅
      main: {
        zoom: {
          marker: 2,
          label: 2
        },
        layer: {
          marker: L.featureGroup(),
          label: L.featureGroup(),
        }
      },
      // 中位主要駅
      middle: {
        zoom: {
          marker: 3,
          label: 4
        },
        layer: {
          marker: L.featureGroup(),
          label: L.featureGroup(),
        }
      },
      // ローカル駅
      local: {
        zoom: {
          marker: 4,
          label: 5
        },
        layer: {
          marker: L.featureGroup(),
          label: L.featureGroup(),
        }
      },
      // 大都市近郊小駅
      cityLocal: {
        zoom: {
          marker: 5,
          label: 6
        },
        layer: {
          marker: L.featureGroup(),
          label: L.featureGroup(),
        }
      }
    };
    // popUpを制御するVue
    this.popup = new Vue({
      el: '#popup',
      data: {
        lineName: '',
        stationName: '',
        beforeStation: {},
        afterStation: {}
      },
      methods: {
        setData: (data) => {
          this.popup.lineName = data.lineName;
          this.popup.stationName = data.stationName;
          this.popup.beforeStation = data.beforeStation;
          this.popup.afterStation = data.afterStation;
        }
      }
    })
    // 外部JSONより路線リストを読み込む
    this.readStationFile('lineList.json')
    .then((stationFileList)=>{
      const readStationPromises = stationFileList.map((x)=>{
        return this.readStationFile(x);
      })
      return Promise.all(readStationPromises);
    })
    .then((dataAll)=>{
      this.lines = dataAll;
      this.makeStationPopupMarker()
      this.drawTrainLine();
      this.drawStationMarker();
    })
  }
  
  readStationFile = async (file) => {
    return new Promise((resolve, reject) => {
      const url = `./json/station/${file}`;
      $.getJSON(url, (data) => {
        resolve(data);
      });
    })
  }

  // 駅マーカーの表示・非表示を切り替える
  swichShowMarker = () => {
    this.isShow = !this.isShow;
  }

  // 追加するレイヤーのタイプを選択する
  addLayerInstance = (type)=>{
    switch(type) {
      case 'main':
        return this.stationMarkers.main.layer;
      case  'middle':
        return this.stationMarkers.middle.layer;
      case  'local':
        return this.stationMarkers.local.layer;
      default:
        return this.stationMarkers.cityLocal.layer;
    }
  };

  // 駅の描画を行う
  setStationMarker = (params, popupBodyObject) => {
    // 追加するレイヤーのタイプを選択する
    const addLayerInstance = this.addLayerInstance(params.type);
    const stationIconList = {
        main: L.icon({
          iconUrl: './img/icon/station-03.png',
          iconSize: [25, 25]
        }),
        middle: L.icon({
          iconUrl: './img/icon/station-01.png',
          iconSize: [20, 20]
        }),
        local: L.icon({
          iconUrl: './img/icon/station-02.png',
          iconSize: [15, 15]
        }),
        cityLocal: L.icon({
          iconUrl: './img/icon/station-02.png',
          iconSize: [10, 10],
        }),
    }
    const stationIcon = (()=>{
      switch(params.type) {
        case 'main':
          return stationIconList.main;
        case 'middle':
          return stationIconList.middle;
        case 'local':
          return stationIconList.local;
        case 'cityLocal':
          return stationIconList.cityLocal;
        default:
          return null;
      }
    })() 
    // 地点マーカーを追加する
    if(stationIcon !== null) {
      let popup;
      if(popupBodyObject) {
        const popupDocument = $('#popup').get(0);
        const popupOption = {
          minWidth: 400
        }
        popup = L.popup(popupOption).setContent(popupDocument);
      }
      const marker = L.marker([params.pos.x, params.pos.y], {icon: stationIcon})
      addLayerInstance.marker.addLayer(marker);
      if(popup) {
        marker.bindPopup(popup).openPopup().on('click', ()=>{
          this.popup.setData(popupBodyObject);
        })
      }
    }
    if(params.label !== '') {
      const divIcon = L.divIcon({
        html: params.label,
        className: 'divicon',
        iconSize: [100, 20],
        iconAnchor: [75, -10]
      })
      // 地点ラベルを追加する
      addLayerInstance.label.addLayer(
        L.marker([params.pos.x, params.pos.y], {icon: divIcon})
      );
    }
  }

  // 鉄道路線ラインオブジェクトの設置をする
  setTrainLine = (latlng, lineColor) => {
    const lineOption = {
      weight: 5,
      color: lineColor
    }
    const polyline = L.polyline(latlng, lineOption)
    this.sectionLayer.addLayer(polyline);
  }

  // 路線名の描画をする
  setLineName = (line) => {
    const divIcon = L.divIcon({
      html: line.lineName,
      className: 'lineName',
      iconSize: [200, 33],
      iconAnchor: [75, -10]
    })
    const layer = this.addLayerInstance(line.type);
    layer.label.addLayer(
      L.marker([line.pos.x, line.pos.y], {icon: divIcon})
    );
  }

  // 駅マーカーのポップアップオブジェクトを作成する
  makeStationPopupMarker = () => {
    this.lines.forEach((line)=>{
      // 路線名の描画をする
      if(line.lineName && line.pos) {
        this.setLineName(line);
      }
      line.stations.forEach((station, index)=>{
        // ポップアップに表示するラベルを定める
        const stationLabel = station.label !== ''? station.label: '(駅名未定)';
        const popupBodyObject = {
          lineName: line.lineName,
          stationName:  stationLabel
        };
        if(index > 0) {
          const beforeStation = line.stations[index-1];
          popupBodyObject.beforeStation = {
            label: beforeStation.label !== ''? beforeStation.label: '(駅名未定)',
            distance: calcDistance(
              [beforeStation.pos.x, beforeStation.pos.y],
              [station.pos.x, station.pos.y]
            )
          };
        }
        if(line.stations[index+1]) {
          const afterStation = line.stations[index+1];
          popupBodyObject.afterStation = {
            label: afterStation.label !== ''? afterStation.label: '(駅名未定)',
            distance: calcDistance(
              [afterStation.pos.x, afterStation.pos.y],
              [station.pos.x, station.pos.y]
            )
          };
        }
        this.setStationMarker(station, popupBodyObject);
      });
    });
  }

  // 鉄道路線の描画を行う
    // emphasisLineNumberに引数がある場合、該当する路線だけを強調表示する
  drawTrainLine = (emphasisLineNumberList = null) => {
    this.lines.forEach((line)=>{
      formatLines(line)
      .forEach((section)=>{
        const drawLineColor = (()=>{
          // 引数がない時には設定されている路線の色を描画する
          if(emphasisLineNumberList === null) {
            return line.lineColor;
          }
          // 強調路線の場合
          if(emphasisLineNumberList.includes(Number(line.number))) {
            return '#ff0000';
          }
          // それ以外の場合
          return '#888888';
        })()
        this.setTrainLine(section, drawLineColor);
      });
    });
    this.map.addLayer(this.sectionLayer);
  }

  // 駅マーカーを描画する
  drawStationMarker = () => {
    const zoom  = this.map.getZoom();
    // 駅の規模と拡大率に合わせて表示する駅を変更する
    Object.keys(this.stationMarkers).forEach((type)=>{
      const target = this.stationMarkers[type];
      if(!this.isShow) {
        this.map.removeLayer(target.layer.marker);
        this.map.removeLayer(target.layer.label);
      } 
      else {
        // マーカーの描画
        if(zoom > target.zoom.marker) {
          this.map.addLayer(target.layer.marker);
        }
        else {
          this.map.removeLayer(target.layer.marker);
        }
        // ラベルの描画
        if(zoom > target.zoom.label) {
          this.map.addLayer(target.layer.label);
        }
        else {
          this.map.removeLayer(target.layer.label);
        }
      }
    })
  }

  // 鉄道路線を非表示にする
  hideLines = () => {
    this.isShow = false;
    this.map.removeLayer(this.sectionLayer);
    this.drawStationMarker();
  }

  // 鉄道路線を表示する
  showLines = () => {
    this.isShow = true;
    this.map.addLayer(this.sectionLayer);
    this.drawStationMarker();
  }

  // 特定の路線だけを強調表示する
  emphasisLine = (emphasisLineNumberList) => {
    this.map.removeLayer(this.sectionLayer);
    this.drawTrainLine(emphasisLineNumberList);
    this.map.addLayer(this.sectionLayer);
  }
}