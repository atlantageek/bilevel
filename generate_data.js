

hashCode = function(val){
	var hash = 0;
	if (val.length == 0) return hash;
	for (i = 0; i < val.length; i++) {
		char = val.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
function rnd2() {
    return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) ) / 6;
}

function getRatios(name) {
  var promoter = rnd2();
  var neutral = rnd2() * rnd2();
  var detractor = 1.0 - promoter - neutral;
  multiplier = (hashCode(name) %10) * 4.0 * Math.random();
  return [Math.round(multiplier * promoter) +1, Math.round(multiplier * neutral) +1, Math.round(multiplier * detractor) +1]
}

//levels = [{name:'nation',segments:[0.4,0.3,0.3]},
//{name:'region', segments:[0.6,0.4]},{name:'district',segments:},{name:'location'},{name:'salesman'}];

levels=['nation', 'region','segments','district','location','salesman']

var result = buildSegment(0,3,'');
console.log(JSON.stringify(result));

function buildSegment(level_index, level_count,prefix) {

  var result = [];
  if (level_index  >= levels.length) {
    ratio = (hashCode(prefix) % 10)

    //ratio = (prefix.hashcode() % 10) * 0.1
    for(var i=0;i<level_count;i++) {

      name =  prefix + String.fromCharCode(65 + i);
      ratios = getRatios(prefix);
      result.push({name: name, neutral: ratios[1], promoter: ratios[0], detractor: ratios[2]});
    }
  }
  else {
    for (var i=0;i<level_count;i++) {
      children = buildSegment(level_index + 1, level_count + 1, prefix + String.fromCharCode(65 + i));
      name =  prefix + String.fromCharCode(65 + i);
      result.push({name: name, children: children});
    }
  }
  return result;
}
