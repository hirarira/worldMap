"use strict";

class Border {
  constructor(map) {
    this.map = map;
    const fileList = [
      'prefecture/mabetic.json'
    ]
  }

  readBorderFile = async (file) => {
    return new Promise((resolve, reject) => {
      const url = `./json/border/${file}`;
      $.getJSON(url, (data) => {
        resolve(data);
      });
    })
  }
}