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
  // クエリパラメータの一覧を取得する
  const params = new URLSearchParams(location.search);
  const mode = (()=>{
    if(params.get('inputMode') === 'true') {
      return 'inputMode';
    }
    return 'noramalMode';
  })()
  // inputModeが有効でない場合には入力欄を非表示にする
  if(mode !== 'inputMode') {
    $(".inputMode").hide();
  }
  // inputModeが有効のときには距離測定欄を非表示にする
  if(mode !== 'noramalMode') {
    $(".normalMode").hide();
  }
  // LeafketMapを定義する
  const map = new LeafletMap(mode);
  pushButton = {
    ...pushButton,
    changeRailway: map.changeRailway,
    changeElevation: map.changeElevation,
    changePlaceName: map.changePlaceName,
    changeDetailRailway: map.changeDetailRailway,
    changeStationMarker: map.changeStationMarker,
    resetDistance: map.resetDistanceMarker
  }
}
