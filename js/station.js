"use strict";

class Station {
  constructor(map) {
    this.map = map;
    this.sections = [];
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
          marker: 5,
          label: 6
        },
        layer: {
          marker: L.featureGroup(),
          label: L.featureGroup(),
        }
      },
      // 大都市近郊小駅
      cityLocal: {
        zoom: {
          marker: 6,
          label: 8
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
          console.log(data);
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
      this.drawTrainLine(dataAll);
      this.showStationMarker();
    })
  }
  
  readStationFile = async (file) => {
    return new Promise((resolve, reject) => {
      const url = `./json/${file}`;
      $.getJSON(url, (data) => {
        resolve(data);
      });
    })
  }

  // 駅マーカーの表示・非表示を切り替える
  swichShowMarker = () => {
    this.isShow = !this.isShow;
  }

  // 駅の描画を行う
  setStationMarker = (params, popupBodyObject) => {
    const addLayerInstance = (()=>{
      switch(params.type) {
        case 'main':
          return this.stationMarkers.main.layer;
        case  'middle':
          return this.stationMarkers.middle.layer;
        case  'local':
          return this.stationMarkers.local.layer;
        default:
          return this.stationMarkers.cityLocal.layer;
      }
    })()
    const stationIconList = {
        main: L.icon({
          iconUrl: './img/icon/station-03.png',
          iconSize: [30, 30]
        }),
        middle: L.icon({
          iconUrl: './img/icon/station-01.png',
          iconSize: [30, 30]
        }),
        local: L.icon({
          iconUrl: './img/icon/station-02.png',
          iconSize: [25, 25]
        }),
        cityLocal: L.icon({
          iconUrl: './img/icon/station-02.png',
          iconSize: [20, 20],
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
        const hoge = $('#popup').get(0);
        const popupOption = {
          minWidth: 400
        }
        popup = L.popup(popupOption).setContent(hoge);
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
        iconSize: [150, 30],
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
    const polyline = L.polyline(latlng, lineOption ).addTo(this.map);
    this.sections.push(polyline);
  }

  // 鉄道路線の描画を行う
  drawTrainLine = () => {
    this.lines.forEach((line)=>{
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
      formatLines(line)
      .forEach((section)=>{
        this.setTrainLine(section, line.lineColor);
      });
    });
  }

  // 駅マーカーとラインを描画する
  showStationMarker = () => {
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

}