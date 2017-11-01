
var svg = d3.select("svg"),
    margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom;

var x = d3.scaleLinear()
    .range([0,width])
    .interpolate(d3.interpolateRound);
    //.rangeRound([0, width]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var div = g.append("text")
    .attr("class", "tooltip")
    .style("opacity", 0)

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
      .call(d3.axisBottom(x).tickFormat(d3.format('04')).ticks());

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

/*
line.append("path")
    .data([[[0,0],[100,100]]])
      .attr("stroke", "black")
      .attr('stroke-width',0.25)
      .attr('d',linef)
      */
              //.attr("d", 'M' + ((Math.random() * 900) | 0) + ' 0 L 100 100')
  //en este punto cell contiene todas las celuclas
  let circle = g.selectAll("circle").data(data).enter().append('circle')
      .attr("r", d => (d.prize == 'Golden Nica') ? 5:3)
      .attr("cx"   , d => d.x )
      .attr("cy"   , d => d.y )
      .attr("class", d => d.category.replace(' ','_').replace('.','').toLowerCase())

  //line
  var linef = d3.line()
                .x(d => d.x)
                .y(d => d.y)

  let line = g.append('g')
  
  circle.append("title")
      .text(function(d) { return d.category + "\n" + d.title });
  circle.attr('id',function(d) { return 'p'+d.id })
  circle.on('click',function(d,index){

/*
      g.selectAll('line')
        .data({'x1':0,'y1':0,'x2':100,'y2':200})
*/
      d3.event.stopPropagation()

      d3.select('#title').text(d.title)
      console.log( d)
      if(d3.select('#p'+d.id).classed('disabled')){
        console.log('disabled');
        circle.classed('disabled',false)
        return
      }
      let ids = d.neighbours.map(function(x){return x[0]})

      circle.classed('disabled',true).classed('selected',false)

      for (neighbour of d.neighbours){

        let id       = neighbour[0]
        let distance = neighbour[1]
        if( distance < 0.93){
          let n = d3.select('#p'+id).classed('disabled',false)
        }
      }


      d3.select(this).classed('disabled',false).classed('selected',true)
      //display catalog text
      let texturl = 'texts/' + d3.format('06')(d.id) + '.txt'
      d3.text(texturl, (error,data) => d3.select('#catalog_text').text(data))
      d3.select('#catalog_text').text(t => d3.text(d3.format('06')(d.id).replace('\n','<br>')))


      let dataset = g.selectAll('circle:not(.disabled)').nodes().map(d => d.__data__)
      console.log(dataset);
      //let dataset = [[0,0],[100,100]]

      line.selectAll('path')
            .data([dataset])
            .attr('d',linef)
            .enter().append('path')
                .attr('class', 'line')
                .attr('d',linef)
            .exit().remove()
  })

  //disable cells on mouseclick on the svg
  svg.on('click',d => circle.classed('disabled selected',false))

  circle.on('mouseover', function(d) {
       div.transition()
         .duration(200)
         .style("opacity", .9);
       div.html(d.title)
         .attr('x',d.x)
         .attr('y',10)
       })

  circle.on("mouseout", function(d) {
       div.transition()
         .duration(200)
         .style("opacity", 0);
       });

}


function type(d) {
  if (!d.value) return;
  d.value = +d.value;
  return d;
}
