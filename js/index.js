"use strict"

let pushButton = {
  changeRailway: () => {},
  changeElevation: () => {},
  changePlaceName: () => {},
  changeDetailRailway: () => {},
  changeStationMarker: () => {},
  resetDistance: () => {}
}

window.onload = () => {
  let mode = 'normalMode';
  // LeafketMapを定義する
  const map = new LeafletMap(mode);
  const changeMode = () => {
    $(".inputMode").hide();
    $(".distanceMode").hide();
    map.mode = mode;
    // 入力欄を表示にする
    if(mode === 'inputMode') {
      $(".inputMode").show();
    }
    // 距離測定欄を表示する
    if(mode === 'distanceMode') {
      $(".distanceMode").show();
    }
  }
  const modeChange = {
    changeNoramalMode: () => {
      mode = 'normal';
      changeMode();
    },
    changeDistanceMode:  () => {
      mode = 'distanceMode';
      changeMode();
    },
    changeInputMode:  () => {
      mode = 'inputMode';
      changeMode();
    },
  }
  pushButton = {
    ...pushButton,
    ...modeChange,
    changeRailway: map.changeRailway,
    changeElevation: map.changeElevation,
    changePlaceName: map.changePlaceName,
    changeDetailRailway: map.changeDetailRailway,
    changeStationMarker: map.changeStationMarker,
    // 距離をリセットする
    resetDistance: map.resetDistanceMarker,
    // 鉄道路線を非表示にする
    hideLines: map.station.hideLines,
    // 鉄道路線を表示する
    showLines: map.station.showLines,
    // 鉄道路線を強調する
    emphasisLine: map.station.emphasisLine
  }
  // 初回読み込み時のモードチェンジ
  changeMode();
}

