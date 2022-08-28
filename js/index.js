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
  const changeMode = () => {
    $(".inputMode").hide();
    $(".distanceMode").hide();
    // 入力欄を表示にする
    if(mode === 'inputMode') {
      $(".inputMode").show();
    }
    // 距離測定欄を表示する
    if(mode === 'distanceMode') {
      $(".distanceMode").show();
    }
  }
  // LeafketMapを定義する
  const map = new LeafletMap(mode);
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
    resetDistance: map.resetDistanceMarker
  }
  // 初回読み込み時のモードチェンジ
  changeMode();
}

