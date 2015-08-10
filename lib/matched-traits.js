
'use strict';

/**
 * Returns the big 5
 * @return Array  The 5 main traits
 */
var big5 = function(origin) {
  origin = typeof (origin) === 'string' ? JSON.parse(origin) : origin;
  var origin_big5 = origin.tree.children[0].children[0].children,

    ret = [];
    // for each trait in origin personality...
    // just match / flatten big5 without children for now
    origin_big5.forEach(function(trait) {
      ret.push({ name: trait.name, percentage: trait.percentage });
    });
    return ret;
};

module.exports = big5;