
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

var circle
//la funcio type 'limpia' los datos, dejando fuera los que interesan
d3.json("graph.json",update)



function update(data) {

  //calcula el minimo y el máximo es lo que hace d3.extent
  let domainExtent = d3.extent(data, function(d) { return d.year; })

  //define el domino de x
  x.domain(domainExtent);

  //dibuja la linea inferior
  g.append("g")
      .attr("class", "axis axis--x")
      //lo pone al suelo
      .attr("transform", "translate(0," + height + ")")
      //.attr("transform", "rotate(50deg)") //no va la rotacion
      .call(d3.axisBottom(x).tickFormat(d3.format('04')).ticks());

  data.forEach((d)=>{d.x = Math.random() * width ; d.y = height/2;})

  var simulation = d3.forceSimulation(data)
       //el x aplica la transformacion al año
       //al final cada node es atraido al centro de cada año
      .force("x", d3.forceX(d => x(d.year)).strength(.5))
      .force("y", d3.forceY(height / 2))
      //dependiendo si ha ganado un golden nica tendrá 5 o 3 de radio
      .force("collide", d3.forceCollide(d => (d.prize == 'Golden Nica') ? 6:4 ))
      .alpha(0.08 )
      .alphaDecay(0.001)
      .stop(); //para el clock tick


  //corre la simulación 220 ticks
  //for (var i = 0; i < 210; ++i) simulation.tick();
  circle = g.selectAll("circle")
  .data(data)
  .enter()
    .append('circle')
    .attr('id',d => 'p'+d.id )
    .attr("r", d => (d.prize == 'Golden Nica') ? 5:3)
    .attr("class", d => d.category.replace(' ','_').replace('.','').toLowerCase())
    /*.append("title")
        .text(function(d) { return d.category + "\n" + d.title })
*/

  //en este punto cell contiene todas las celuclas
  function updateSim(){

    circle
      .attr("cx"   , function(d) { return d.x; } )
      .attr("cy"   , function(d) { return d.y; } )

  }



  simulation.on('tick',updateSim)
  //for (var i = 0; i < 15; ++i) simulation.tick();
  simulation.restart()

  let line = g.append('g')


  circle.on('click',function(d,index){

      d3.event.stopPropagation()

      clearUI()

      if(d3.select('#p'+d.id).classed('disabled')){
        circle.classed('disabled',false)
        return
      }
      let ids = d.neighbours.map(x => x[0])

      circle.classed('disabled',true).classed('selected',false)

      let global_threshold = 0.935
      let minNeighbours = 2
      let maxNeighbours = 5

      let distances = d.neighbours.map( d => d[1]).sort()
      let threshold = 0

      for(let i = minNeighbours; i <= maxNeighbours && threshold <= global_threshold ; i ++ ){
        threshold = distances[i]
      }

      for (let neighbour of d.neighbours){

        let id       = neighbour[0]
        let distance = neighbour[1]
        if( distance < threshold){
          let n = d3.select('#p'+id).classed('disabled',false)
        }
      }


      //display catalog text
      d3.select('#title').text(d.title)
      let texturl = 'texts/' + d3.format('06')(d.id) + '.txt'
      d3.text(texturl, (error,data) => d3.select('#catalog_text').text(data))
      d3.select('#catalog_text').text(t => d3.text(d3.format('06')(d.id).replace('\n','<br>')))

      //fill dataset
      let dataset = []
      for (let neighbour of d.neighbours){

        let id       = neighbour[0]
        let distance = neighbour[1]

        if( distance < threshold ) {
          let projData = d3.select('#p'+id).datum()
          dataset.push({'source':d,'target':projData,'distance':distance})
        }

      }

      console.log(dataset);
      //let dataset = g.selectAll('circle:not(.disabled)').data()

      d3.select(this).classed('disabled',false).classed('selected',true)

      //let dataset = [[0,0],[100,100]]
      let linef = function(d){
          //angle from src to dst
          let angle  = Math.atan2((d.target.y - d.source.y),(d.target.x - d.source.x))
          let src = {x:d.source.x + Math.cos(angle) * 8 ,y:  d.source.y + Math.sin(angle) * 7 }
          let dst = {x:d.target.x + Math.cos(angle + Math.PI) * 8 ,y:  d.target.y + Math.sin(angle + Math.PI ) * 7 }
          let l = `M ${src.x} ${src.y} L ${dst.x} ${dst.y}`
          console.log(l)
          return l
      }

      let w = d3.scaleLinear().domain([0.94,0.92]).range([0.25,1]).clamp([0.94,0.92])

      line.selectAll('path').remove()

      line.selectAll('path')
        .data(dataset)
        .enter()
        .append('path')
        .attr('class', 'line')
        .attr('stroke-width',d=> w(d.distance))
        .attr('opacity',d=> w(d.distance))
        .attr('d',linef)

      line.selectAll('text').remove()

      dataset = d3.selectAll('circle:not(.disabled').data()
      line.selectAll('text')
        .data(dataset)
        .enter()
          .append('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y + 12)
          .attr('class','tooltip')
          .html( function(d){
                    if(d.title.length > 15 ){
                      return d.title.substr(0,12)+'..'
                    }else{
                      return d.title
                    }})

        //arrangeLabels()

  })
  function clearUI(){

    circle.classed('disabled selected',false)
    line.selectAll('path').remove()
    line.selectAll('text').remove()
    d3.select('#title').text('')
    d3.select('#catalog_text').text('')
  }
  //disable cells on mouseclick on the svg
  svg.on('click',clearUI)

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
