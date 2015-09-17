
'use strict';

var similarity = require('./similarity'),
  matches      = require('./matched-traits');

/**
 * Returns a 'flattened' version of the traits tree, to display it as a list
 * @return array of {id:string, title:boolean, value:string} objects
 */
function flatten(tree) {
  var arr = [],
    f = function(t, level) {
      if (!t) return;
      if (level > 0 && (!t.children || level !== 2)) {
        arr.push({
          id: t.name,
          title: t.children ? true : false,
          value: (typeof (t.percentage) !== 'undefined') ? Math.floor(t.percentage * 100) + '%' : ''
        });
      }
      if (t.children && t.id !== 'sbh') {
        for (var i = 0; i < t.children.length; i++) {
          f(t.children[i], level + 1);
        }
      }
    };
  f(tree, 0);
  return arr;
}


module.exports = {
	flatten: flatten,
	similarity: similarity,
  matches: matches
};