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
    const stationFileList = [
      '001_dropLine.json',
      '002_felfaLine.json',
      '003_mashuli.json',
      '004_enicalLine.json',
      '005_cenelLine.json',
      '006_neloleLine.json',
      '007_letonLine copy.json',
      '008_phateLine.json',
      '009_ostaLine.json',
      '010_felthenLine.json',
      '011_konanEnganLine.json',
      '012_enouLine.json',
      '013_geondLine.json',
      '014_tikusaLine.json',
      '015_dorelLine.json',
      '050_moldoLine.json',
      '051_multLine.json',
      '100_endelMainLine.json',
      '101_endleAirportLine.json',
      '103_dorejiLine.json',
      '104_daneLine.json',
      '110_losnalMainLine.json',
      '111_babetLine.json',
      '112_musujolLine.json',
      '113_karabaLine.json',
      '114_ogalLine.json',
      '120_estimaMainLine.json',
      '130_enicalLine.json',
      '140_pholiLine.json',
      '150_fmyolLine.json',
      '160_nishiDonoliLine.json',
      '200_dropLine.json'
    ]
    const readStationPromises = stationFileList.map((x)=>{
      return this.readStationFile(x);
    })
    Promise.all(readStationPromises)
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
  setStationMarker = (params, popupBodyList) => {
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
      if(popupBodyList) {
        const popUpBody = popupBodyList.reduce((a, x)=>{
          return a + `<p>${x}</p>`;
        }, "")
        popup = L.popup().setContent(popUpBody);
      }
      const marker = L.marker([params.pos.x, params.pos.y], {icon: stationIcon})
      addLayerInstance.marker.addLayer(marker);
      if(popup) {
        marker.bindPopup(popup).openPopup()
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
        const stationLabel = station.label !== ''? station.label: '(駅名未定)'
        const popupBodyList = [
          `路線: ${line.lineName}`,
          `駅名: ${stationLabel}`
        ];
        if(index > 0) {
          const beforeStation = line.stations[index-1];
          const beforeStationLabel = beforeStation.label !== ''? beforeStation.label: '(駅名未定)';
          const beforeStationDistance = calcDistance(
            [beforeStation.pos.x, beforeStation.pos.y],
            [station.pos.x, station.pos.y]
          );
          popupBodyList.push(`← ${beforeStationLabel} (${beforeStationDistance} km)`);
        }
        if(line.stations[index+1]) {
          const afterStation = line.stations[index+1];
          const afterStationLabel = afterStation.label !== ''? afterStation.label: '(駅名未定)';
          const afterStationDistance = calcDistance(
            [afterStation.pos.x, afterStation.pos.y],
            [station.pos.x, station.pos.y]
          );
          popupBodyList.push(`${afterStationLabel} (${afterStationDistance} km) →`);
        }
        this.setStationMarker(station, popupBodyList);
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