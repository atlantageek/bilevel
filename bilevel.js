let attributes = ['promoter', 'detractor', 'neutral'];

var root = d3.hierarchy(data, (d) => {
    return d.children
});

var currentDepth = 0;


// x = angular
// y = depth 0-1
var colors = {
    promoter: 'green',
    detractor: 'red',
    neutral: 'blue'
}


var margin = {
        top: 350,
        right: 480,
        bottom: 350,
        left: 480
    },
    radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;
//X - angle
var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);
//Y - depth
var y = d3.scaleLinear()
    .range([0, radius]).domain([0, 3]).clamp(true);
var depth_levels = 3;

var svg = d3.select("body").append("svg")
    .attr("width", margin.left + margin.right)
    .attr("height", margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var arc = d3.arc()
    .startAngle(function(d) {
        let v = Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
        return v;
    })
    .endAngle(function(d) {
        let v = Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
        return v;
    })
    .innerRadius(function(d) {
        let v = y(d.y0);
        return v;
    })
    .outerRadius(function(d) {
        let v = y(d.y1);
        return v;
    });

function findNode(name, currentNode) {
    var i,
        currentChild,
        result;

    if (name == currentNode.data.name) {
        return currentNode;
    } else {

        // Use a for loop instead of forEach to avoid nested functions
        // Otherwise "return" will not work properly
        if (!currentNode.hasOwnProperty('children')) {
            return false;
        }
        for (i = 0; i < currentNode.children.length; i += 1) {
            currentChild = currentNode.children[i];

            // Search in the current child
            result = findNode(name, currentChild);

            // Return the result if the node has been found
            if (result !== false) {
                return result;
            }
        }

        // The node has not been found and we have no more options
        return false;
    }
}

function buildPaths(head, depth) {
    //y = d3.scaleLinear().range([0, radius]).domain([head.depth, head.depth + 3]);

    var result = [];
    var lvlRange = 1.0 / depth;
    var startDepth = head.depth;
    var endDepth = startDepth + depth;
    var sum = 0;
    //Loop over each key and get a sum
    for (var key in head.value) {
        sum += head.value[key];
    }
    depthTrackerX = [0, 0, 0, 0, 0];
    head.each((elem) => {
        //if (head == elem) return;
        if (elem.depth >= endDepth) return;
        var baseX = elem.depth - startDepth;
        let elemSum = 0;
        for (var key in elem.value) {
            elemSum += elem.value[key];
        }
        lastDepth = 0;
        for (var key in elem.value) {
            path = {
                name: elem.data.name,
                x0: depthTrackerX[elem.depth],
                x1: elemSum / sum + depthTrackerX[elem.depth],
                y0: (elem.depth + lastDepth - startDepth),
                y1: (elem.depth + elem.value[key] / elemSum + lastDepth) - startDepth,
                fill: colors[key],
                debug: elem
            }
            if (head == elem) {
		    path.class="root"
	    }

            result.push(path);
            lastDepth += elem.value[key] / elemSum;
        }
        depthTrackerX[elem.depth] += elemSum / sum;

    })

    return result;
}
function zoomIn(d) {
    console.log("D=" );
	console.log(d);
    zoom(d.name);
}

function zoom(name) {
    var currData = root;

    if (name != null) {
        currData = findNode(name, root);
    }
    var dataPaths = buildPaths(currData, 4);

    var paths = svg.selectAll("path").data(dataPaths, function(d) {
        return d.name + d.fill;
    });

    //Remove the ones going away

    //Create the ones to create
    paths.enter().append("path").attr("d", arc).
	style("opacity", function(d) {return (d.class == "root") ? 0.0 : 1.0}).on("end", function(d) { 
		this._current = d
	})
	.each(function(d) {
            this._current = d;
        })
        .style("stroke", "black").style("stroke-opacity", "1").style("stroke-width", "1").style("fill", function(d) { return d.fill }).on("click", zoomIn)
    paths.exit().transition().duration(2000).style('opacity',0).attrTween("d", arcTween)


    let t0 = paths.transition().duration(2000).attrTween("d", arcTween)
	.style("opacity", function(d) {return (d.class == "root") ? 0.0 : 1.0}).on("end", function(d) {
                this._current = d;
            })

    console.log(t0);

}

//root.sum(function(d) {return d.size;})
//Summarize
root.eachAfter(function(d) {
    if (d.hasOwnProperty('children')) {
        let e = d['children'].reduce((sumchild, child) => {
            result = {
                value: {}
            };
            if (sumchild == undefined) {
                sumchild.value = {};
                attributes.forEach((e) => {
                    sumchild.value[e] = 0;
                })

            }
            if (sumchild.value == undefined) {
                sumchild.value = {};
                attributes.forEach((e) => {
                    sumchild.value[e] = 0;
                });
            }
            attributes.forEach((e) => {
                result.value[e] = sumchild.value[e] + child.value[e];
            });
            //sumchild.value['promoter'] +=child.value['promoter'];
            //sumchild.value['detractor'] +=child.value['detractor'];
            //sumchild.value['neutral'] +=child.value['neutral'];

            //sumchild.value = result.value;
            return result
        });
        d.value = e.value;

    } else {
        d.value = {
            'promoter': d.data.promoter,
            'detractor': d.data.detractor,
            'neutral': d.data.neutral
        };

    }
})

function arcTween(a) {
//0.436, 0.545
    var i0 = d3.interpolate(this._current.x0, a.x0);
    var i1 = d3.interpolate(this._current.x1, a.x1);
    var j0 = d3.interpolate(this._current.y0, a.y0);
    var j1 = d3.interpolate(this._current.y1, a.y1);
    //this._current = i(0);
    result = this._current;
    this._current.x0 = a.x0;
    this._current.x1 = a.x1;
    this._current.y0 = a.y0;
    this._current.y1 = a.y1;

    return function(t) {
        d = a;
        result.x0 = i0(t);
        result.x1 = i1(t);
        result.y0 = j0(t);
        result.y1 = j1(t);
        return arc(result);
    };
}



//var dataPaths = buildPaths(root.children[1],3);
// var path = svg.selectAll("path").data(dataPaths)
//   .enter().append("path").attr("d",arc).style("stroke","black").style("stroke-width","1").style("fill", function(d) { return d.fill}).on("click",zoomIn);
//   //.each(function(d) { this._current = updateArc(d);})
//   //.on("click", zoomIn)
//   svg.selectAll("path").data(dataPaths).exit().remove();
zoom('root');
