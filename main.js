
var svg = d3.select("svg"),
    margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom;

var formatValue = d3.format(",d");

var x = d3.scaleLinear()
    .range([0,width])
    .interpolate(d3.interpolateRound);
    //.rangeRound([0, width]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//la funcio type 'limpia' los datos, dejando fuera los que interesan
d3.json("graph.json",update)

function update(data) {

  //calcula el minimo y el máximo es lo que hace d3.extent
  let domainExtent = d3.extent(data, function(d) { return d.year; })

  //define el domino de x
  x.domain(domainExtent);


  var simulation = d3.forceSimulation(data)
       //el x aplica la transformacion al año
       //al final cada node es atraido al centro de cada año
      .force("x", d3.forceX(function(d) { return x(d.year); }).strength(.5))
      .force("y", d3.forceY(height / 2))
      //dependiendo si ha ganado un golden nica tendrá 5 o 3 de radio
      .force("collide", d3.forceCollide(d => (d.prize == 'Golden Nica') ? 6:4 ))
      .stop(); //para el clock tick

  simulation.on('tick',x => console.log('tick'))
  //corre la simulación 220 ticks
  for (var i = 0; i < 210; ++i) simulation.tick();

  //dibuja la linea inferior
  g.append("g")
      .attr("class", "axis axis--x")
      //lo pone al suelo
      .attr("transform", "translate(0," + height + ")")
      //.attr("transform", "rotate(50deg)") //no va la rotacion
      .call(d3.axisBottom(x).ticks());

/*
  var cell = g.append("g")
      .attr("class", "cells")
      .selectAll("g").data(d3.voronoi()
        //el area donde se calcula
        .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.top]])
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
      .polygons(data)) // se le pasan los datos del json
      .enter()
        .append("g");

//las ceclulas de voronoi
  let vcell = cell.append("path")
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
*/

  //en este punto cell contiene todas las celuclas
  let circle = g.selectAll("circle").data(data).enter().append('circle')
      .attr("r", d => (d.prize == 'Golden Nica') ? 5:3)
      .attr("cx"   , d => d.x )
      .attr("cy"   , d => d.y )
      .attr("class", d => d.category.replace(' ','_').replace('.','').toLowerCase())


  circle.append("title")
      .text(function(d) { return d.category + "\n" + d.title });
  circle.attr('id',function(d) { return 'p'+d.id })
  circle.on('click',function(d,index){
      d3.event.stopPropagation();

      console.log( d)
      if(d3.select('#p'+d.id).classed('disabled')){
        console.log('disabled');
        circle.classed('disabled',false)
        return
      }
      let ids = d.neighbours.map(function(x){return x[0]})

      circle.classed('disabled',true)

      for (neighbour of d.neighbours){

        let id       = neighbour[0]
        let distance = neighbour[1]
        if( distance < 0.96){
          d3.select('#p'+id).classed('disabled',false)
        }
      }

      d3.select(this).classed('disabled',false)
  })

  svg.on('click',d => circle.classed('disabled',false))
  circle.on('mouseover', d => $('#title').text(d.title))

}


function type(d) {
  if (!d.value) return;
  d.value = +d.value;
  return d;
}
