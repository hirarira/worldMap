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

  /** 初回・モード切替時に呼ばれる */
  const changeMode = () => {
    $(".inputMode").hide();
    $(".distanceMode").hide();
    $(".emphasisLineMode").hide();
    $(".makePrefectureMode").hide();
    map.mode = mode;
    /** マップ中のモード切替関数を呼ぶ */
    map.changeMode();
    switch(mode) {
      // 入力欄を表示にする
      case 'inputMode':
        $(".inputMode").show();
        break;
      // 距離測定欄を表示する
      case 'distanceMode':
        $(".distanceMode").show();
        break;
      // 路線強調欄を表示する
      case 'emphasisLineMode':
        $(".emphasisLineMode").show();
        break;
      // 行政区分作成モード
      case 'makePrefectureMode':
        $(".makePrefectureMode").show();
        break;
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
    changeEmphasisLineMode: () => {
      mode = 'emphasisLineMode';
      changeMode();
    },
    changeMakePrefectureMode: () => {
      mode = 'makePrefectureMode';
      changeMode();
    }
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
    // 鉄道路線を一つ戻す
    prevPoints: map.prevPoints,
    // 鉄道路線の表示を切り替える
    changeShowTrainLines: ()=>{
      const isShow = $("#change-show-train-lines").prop("checked");
      if(isShow) {
        map.station.showLines();
      }
      else {
        map.station.hideLines();
      }
    },
    changeShowPrefectureLabel: () => {
      const isShow = $("#change-show-prefecture").prop("checked");
      map.layers.border.isShowPrefectureLabel(isShow);
    },
    // 鉄道路線を強調する
    emphasisLine: map.station.emphasisLine
  }
  // 初回読み込み時のモードチェンジ
  changeMode();
}

