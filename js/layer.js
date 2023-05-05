"use strict";

/** Leaflet.jsの画像レイヤー機能 */
class Layer {
  constructor(label, option) {
    this.map = option.map;
    this.isShow = option.isShow;
    const path = (()=>{
      switch(option.pathType){
        case 'default':
          return `img/${label}/{x}/{y}.png`
        case 'zoom':
          return `img/${label}/{z}/{x}/{y}.png`
        case 'dummy':
          return `img/dummy/dummy.png`
        default:
          return `img/${label}/{x}/{y}.png`
      }
    })()
    this.layer = L.tileLayer(
      path,
      {
        attribution: label,
        minZoom: option.minZoom,
        maxZoom: option.maxZoom,
        minNativeZoom: option.minNativeZoom,
        maxNativeZoom: option.maxNativeZoom,
        errorTileUrl: `img/${label}/error.png`
      }
    );
    if(this.isShow) {
      this.layer.addTo(this.map);
    }
  }
  show = () => {
    this.isShow = true;
    this.layer.addTo(this.map);
  }
  hyde = () => {
    this.isShow = false;
    this.layer.remove();
  }
  change = () => {
    if(this.isShow) {
      this.hyde();
    } else {
      this.show();
    }
  }
}
