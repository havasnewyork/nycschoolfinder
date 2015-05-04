
'use strict';

/**
 * Return the euclidean distance between two profiles
 * @param  json origin The personality insights profile
 * @param  json target The personality insights profile
 * @return Array      The 5 main traits
 */
var matchbig5 = function(origin) {
  origin = typeof (origin) === 'string' ? JSON.parse(origin) : origin;
  // target = typeof (target) === 'string' ? JSON.parse(target) : target;
  var distance = 0.0,
    origin_big5 = origin.tree.children[0].children[0].children,
    // target_big5 = target.tree.children[0].children[0].children;

    ret = [];
    // for each trait in origin personality...
    // just match / flatten big5 without children for now
    origin_big5.forEach(function(trait, i) {
      ret.push({name: trait.name, percentage: trait.percentage})
      // distance += Math.pow(trait.percentage - target_big5[i].percentage, 2);
      // ret.push()
    });
    // var ret = 1-(Math.sqrt(distance/origin_big5.length));
    return ret;
};

module.exports = matchbig5;


/*
"id": "Extraversion_parent",
              "name": "Extraversion",
              "category": "personality",
              "percentage": 0.02947145172536738,
*/