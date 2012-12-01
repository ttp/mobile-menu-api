
/**
 * @name QuadTree.js
 * @author Esa
 * @copyright (c) 2011 Esa I Ojala
 * @fileoverview QuadTree.js is an extension to Google Maps API version 3.
 * It declares a collection of functions for Quadtree indexing
 * http://en.wikipedia.org/wiki/Quadtree
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
Tile numbering scheme follows Z shape.
 ___ ___
| 0 | 1 |
|___|___|
| 2 | 3 |
|___|___|

*/

/**
 *  What is hip? Namespaces are hip. We use 'QuadTree'
 */

var QuadTree = {};
module.exports = QuadTree;

QuadTree.tileSize = 256;


/**
 *  @version 0.1 - Quick and ugly first release Apr 2011
 */
QuadTree.VERSION = "0.1";


/**
 *  Mercator projection
 *  can be overwritten like QuadTree.mercator = map.getProjection();
 *  If you have a custom projection or if you just rely more on Google's Mercator projection
 */
QuadTree.mercator = {};
QuadTree.mercator.fromLatLngToPoint = function(lat, lng){
  var wP = {};
  var xx = (lng + 180) / 360;
  wP.x = xx * QuadTree.tileSize;
  var sinLat = Math.sin(lat * Math.PI / 180);
  var yy = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  wP.y = yy * QuadTree.tileSize;
  return wP;
}
QuadTree.mercator.fromPointToLatLng = function(point){
  var x = point.x / QuadTree.tileSize - 0.5;
  var y = point.y / QuadTree.tileSize - 0.5;
  var lat = 90 - 360 * Math.atan(Math.exp(y * 2 * Math.PI)) / Math.PI;
  var lng = 360 * x;
  return {lat: lat, lng: lng};
}

/**
 *  encode
 *  @private
 */
QuadTree.encode = function(x, y, z){
  var arr = [];
  for(var i=z; i>0; i--) {
    var pow = 1<<(i-1);
    var cell = 0;
    if ((x&pow) != 0) cell++;
    if ((y&pow) != 0) cell+=2;
    arr.push(cell);
  }
  return arr.join("");
}


/**
 *  Quad Tree key string generator
 *  @param laLo {LatLng}
 *  @return Quadtree key string
 *  also adds '.quad' property to the poor LatLng instance
 */
QuadTree.latLngToQuad = function(lat, lng, len) {
  var pnt = QuadTree.mercator.fromLatLngToPoint(lat, lng);
  var tiX = Math.floor(pnt.x * Math.pow(2, len) / QuadTree.tileSize);
  var tiY = Math.floor(pnt.y * Math.pow(2, len) / QuadTree.tileSize);
  return QuadTree.encode(tiX, tiY, len);
}


/**
 *  decode a quadtree key string to x, y, z {}
 *  @param quad {String}
 *  @returns {Object} x, y, z
 *  @private I would say. And funny implementation
 */
QuadTree.decode = function(quad){
  var arr = quad.split("");
  var len = arr.length;
  var keyChain = [{x:0, y:0}, {x:1, y:0}, {x:0, y:1}, {x:1, y:1}];
  var xx = yy = 0;
  for (var i=len; i>0; i--){
    var mask = 1 << i;
    xx += keyChain[arr[i-1]].x / mask;
    yy += keyChain[arr[i-1]].y / mask;
  }
  xx *= 1<<len;
  yy *= 1<<len;
  return {x:xx, y:yy, z:len};
}



/**
 *  resolves quadtree key string to LatLng
 *  @param quad {String}
 *  @return {LatLng}
 */
QuadTree.quadToLatLng = function(quad){
  var tile = QuadTree.decode(quad);
  var len = tile.z;
  var wP = {};
  wP.x = QuadTree.tileSize * tile.x / Math.pow(2, len);
  wP.y = QuadTree.tileSize * tile.y / Math.pow(2, len);
  return QuadTree.mercator.fromPointToLatLng(wP);
}



/**
 *  nextDoor() finds a node in offset to the given node
 *  It doesn't have to be adjacent neighbour. Any offset goes.
 */

QuadTree.nextDoor = function(quad, x_off, y_off){
  var xOff = parseInt(x_off, 10) || 0;
  var yOff = parseInt(y_off, 10) || 0;
  var me = QuadTree.decode(quad);
  var xx = me.x + xOff;
  var yy = me.y + yOff;
  return QuadTree.encode(xx, yy, me.z);
}


/**
 *  A function to shorten a key string.
 *  That is equal to making the square bigger.
 */

QuadTree.clip = function(quad, level){
  var key = quad + "";
  return quad.substring(0, +level);
}


/**
 *  Test and normalize quadtree string. Use this for user input data.
 *  Returns the valid string till the first invalid character
 *  @param quad {string}
 *  @param strict {boolean} If present and true, returns empty string in case of invalid input.
 */

QuadTree.validateQuad = function(quad, strict){
  if (+quad == 0) return quad;   // all zero treatment
  var preZeros = [];             // leading zero treatment
  for (var i=0, len=quad.length; i<len; i++){
    if (quad.charAt(i) != "0") break;
    preZeros.push("0");
  }
  var val = parseInt(quad, 4).toString(4);
  val = preZeros.join("") + val;
  if (strict && quad.length != val.length) return "";
  if (isNaN(+val)) return "";
  return val;
}


/**
 *  utility functions for base-36 conversion and back
 */

QuadTree.base36ToQuad = function(str){
  return parseInt(str, 36).toString(4);
}

QuadTree.quadToBase36 = function(str, opt_prec){
  var temp = str;
  if (opt_prec) temp = temp.substring(0, +opt_prec);
  return parseInt(temp, 4).toString(36);
}