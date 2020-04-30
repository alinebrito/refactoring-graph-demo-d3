// References:
// http://bl.ocks.org/fancellu/2c782394602a93921faff74e594d1bb1
// https://bl.ocks.org/martinjc/7aa53c7bf3e411238ac8aef280bd6581

var graph_body_id = '#graphbody';
var width = d3.select(graph_body_id).node().getBoundingClientRect().width;
var height = 400;//TODO: responsible height
var radius = 14;
var edge_distance = 180;
var edge_label_size = 15;
var arrow_color = '#555555'

var svg = d3.select(graph_body_id)
.append('svg')
.attr('width', width)
.attr('height', height);
var node;
var link;
var colors = d3.scaleOrdinal().range(["#000000"]);

//arrows
svg.append('defs').append('marker')
  .attrs({'id':'arrowhead',
      'viewBox':'-0 -5 10 10',
      'refX': radius + 3.5,
      'refY': 0,
      'orient':'auto',
      'markerWidth': 5,
      'markerHeight': 5,
      'xoverflow':'visible'})
  .append('svg:path')
  .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
  .attr('fill', arrow_color)
  .style('stroke','none');

// edge
var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function (d) {return d.id;})
  .distance(edge_distance)
  .strength(1))
  .force("charge", d3.forceManyBody())
  .force("collide", d3.forceCollide().radius(12))
  .force("center", d3.forceCenter(width/2, height/2));

// data
d3.json("data/graph.json", function(error, data) {
  update(data.links, data.nodes);
});

function update(links, nodes) {

  // edge
  link = svg.selectAll(".link")
    .data(links)
    .enter()
    .append('path')
    .attrs({
      'class': 'link',
      'fill-opacity': 0,//curve backgroud
      'id': function (d, i) {return 'edgepath' + i}
    })
    .attr('marker-end','url(#arrowhead)')

  link.append("title")
    .text(function (d) {return d.refactoring_name;});

  // edge path
  edgepaths = svg.selectAll(".edgepath")
    .data(links)
    .enter()
    .append('path')
    .attrs({
      'class': 'edgepath',
      'fill-opacity': 0,
      'stroke-opacity': 0,
      'id': function (d, i) {return 'edgepath' + i}
    })
    .style("pointer-events", "none");

  // edge label
  edgelabels = svg.selectAll(".edgelabel")
    .data(links)
    .enter()
    .append('text')
    .style("pointer-events", "none")
    .attrs({
      'font-family': "Times",
      'class': 'edgelabel',
      'id': function (d, i) {return 'edgelabel' + i},
      'font-size': edge_label_size,
      'fill': '#000'
    });

  edgelabels.append('textPath')
    .attr('xlink:href', function (d, i) {return '#edgepath' + i})
    .style("text-anchor", "middle")
    .style("pointer-events", "none")
    .attr("startOffset", "50%")
    .text(function (d) {return d.refactoring_name});

  // node 
  node = svg.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("stroke", arrow_color)
    .attr("stroke-width", '1px')
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
    );

  node.append("circle")
    .attr("r", radius)
    .style("fill", function (d, i) {return colors(i);})
      
  node.append("title")
    .text(function (d) {return d.id;});
  // node.append("text")
  //     .attr("dy", -3)
  //     .text(function (d) {return d.name+":"+d.label;});

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);
}

//edge curve
function positionLink(d) {
  var offset = 50;

  var midpoint_x = (d.source.x + d.target.x) / 2;
  var midpoint_y = (d.source.y + d.target.y) / 2;

  var dx = (d.target.x - d.source.x);
  var dy = (d.target.y - d.source.y);

  var normalise = Math.sqrt((dx * dx) + (dy * dy));

  var offSetX = midpoint_x + offset*(dy/normalise);
  var offSetY = midpoint_y - offset*(dx/normalise);

  return "M" + d.source.x + "," + d.source.y +
      "S" + offSetX + "," + offSetY +
      " " + d.target.x + "," + d.target.y;
}

function ticked() {

  link
  .attr("d", positionLink);

  node
  .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});

  edgepaths.attr('d', positionLink);

  edgelabels.attr('transform', function (d) {
    if (d.target.x < d.source.x) {
      var bbox = this.getBBox();
      rx = bbox.x + bbox.width / 2;
      ry = bbox.y + bbox.height / 2;
      return 'rotate(180 ' + rx + ' ' + ry + ')';
    }
    else {
      return 'rotate(0)';
    }

  });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}
