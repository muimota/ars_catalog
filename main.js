'use strict'

var svg = d3.select("#svgview"),
    margin = {top: 20, right: 40, bottom: 40, left: 80},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom;

var x = d3.scaleLinear()
    .range([30,width])


//https://bl.ocks.org/mbostock/3371592
var categories = ['Starts Prize','Hybrid Art','Interactive Art','Net Vision','.net' ]
var y = d3.scalePoint()
    .domain(categories)
    .range([height/9, 8*height/9])

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = g.append("text")
    .attr("class", "tooltip")
    .style("opacity", 0)

var circle

var selected = null //0 displays all projects , 1 one project is selected

//fix in case image is not avaliable
d3.select('#artworkimage').on('error', d => {
  d3.select('#artworkimage').attr('src','noimage.jpg')
  return false
})

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

  g.append("g")
      .attr("class", "axis axis--x")
      //lo pone al suelo
     // .attr("transform", "translate(0," + height + ")")
      //.attr("transform", "rotate(50deg)") //no va la rotacion
      .call(d3.axisLeft(y))


  data.forEach(function(d){
    d.x = width /2
    d.y = height/2;
    d.collide = (d.prize == 'Golden Nica') ? 10:6
  })

  var simulation = d3.forceSimulation(data)
       //el x aplica la transformacion al año
       //al final cada node es atraido al centro de cada año



  circle = g.selectAll("circle")
    .data(data)
    .enter()
      .append('circle')
      .attr('id',d => 'p'+d.id )
      .attr("r", d => d.collide - 1)
      .attr("class", d => d.category.replace(' ','_').replace('.','').toLowerCase())


  //en este punto cell contiene todas las celuclas
  function updateSim(){

    circle
      .attr("cx" , d => d.x )
      .attr("cy" , d => d.y )
    simulation.nodes(circle.data())

    line.selectAll('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.collide + 6)

  }

  simulation.on('tick',updateSim)

  let line = g.append('g')
  tooltip.raise()

  clearUI()



  circle.on('click',function(d,index){



      if( d3.event != null ){
        d3.event.stopPropagation()
      }
      //

      //display location hash
      location.hash = d.id + '_' + encodeURIComponent(d.title.substr(0,10))

      let node = d3.select(this)

      if(selected != null && selected.node() != node.node() && !node.classed('disabled')){

        circle.classed('selected',false)
        node.classed('selected',true)
        updateInfo(d)
        selected = node

        return;

      }

      selected = node
      clearUI();


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

      let artworks = [{'title':d.title,'id':d.id}]
      let collide  = 10
      for (let neighbour of d.neighbours){

        let id       = neighbour[0]
        let distance = neighbour[1]
        if( distance < threshold){

          let n = d3.select('#p'+id)
          let datum = n.datum()
          n.classed('disabled',false)
          datum.collide = collide
          n.transition().duration(200).attr('r',collide)

          collide = Math.max(5,collide*0.75)

          artworks.push({ 'title':datum.title,'id':datum.id})

        }
      }

      d.collide = 30
      d3.select('#p'+d.id).transition().duration(200).attr('r',d.collide - 1.5).attr

      //https://bl.ocks.org/plmrry/b9db6d47dabaff6e59f565d9287c4064
      simulation.nodes(circle.data())
        .force("collide", d3.forceCollide(d => d.collide))
        .alpha(0.35 )
        .restart()


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

      d3.select('#p'+d.id).classed('disabled',false).classed('selected',true)

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


      // update UI

      d3.select('#closest').html(artworks.map(d => `${d.title}`).join(' - '))  
      updateInfo(d)

  })

  function clearUI(){


    line.selectAll('text').remove()

    d3.select('#closest').text('')
    d3.select('#title').text('')
    d3.select('#prizes').text('')
    d3.select('#catalog_text').text('')
    d3.select('#artworkimage').attr('src','noimage.jpg')
    data.forEach(d =>
      d.collide = (d.prize == 'Golden Nica') ? 7:4)

    g.selectAll('circle:not(.disabled)').attr('r',d => d.collide - 1 )

    if( g.selectAll('circle.disabled').size() > 0 ){

      simulation.nodes(circle.data())
        .force("collide", d3.forceCollide(d => d.collide))
        .alpha(0.35)
        .restart()

    }
    circle.classed('disabled selected',false)

    simulation
      .force("x", d3.forceX(d => x(d.year)).strength(.5))
      .force("y", d3.forceY(d => y(d.category)))
      //dependiendo si ha ganado un golden nica tendrá 5 o 3 de radio
      .force("collide", d3.forceCollide(d => d.collide))
      .alpha(0.35 )
      .alphaDecay(0.01)

  }

  function updateInfo(d){

    // update UI
    let texturl = 'texts/' + d3.format('06')(d.id) + '.txt'
    d3.text(texturl, (error,data) => {

      let maxlength = 700
      let catalog_text = '<p>' + (data.length > maxlength) ? data.substr(0,maxlength) + '...' : data + '</p>'
      catalog_text    += '<p><a target="_blank" href="http://archive.aec.at/prix/#' + d.id + '">Ars Electronica link </a></p>'
      d3.select('#catalog_text').html(catalog_text)}
    )

    let imgurl = `images/${(''+d.id).padStart(6,'0')}.jpg`;
    d3.select('#artworkimage').attr('src',imgurl)

    d3.select('#title').text(d.title)
    d3.select('#prizes').text(d.prize + ' ' +d.year)

  }

  if( location.hash.length != '' ){
    let id = location.hash.split('_')[0].substr(1)
    let node = d3.select('#p'+id)
    node.on('click')(node.datum(),0)
  }

  //disable cells on mouseclick on the svg
  svg.on('click',(d,index) =>
    {
      //https://stackoverflow.com/a/28155967
      history.replaceState({}, document.title, ".");
      d3.event.stopPropagation()
      clearUI()
      selected = null
    }
  )

  circle.on('mouseover', d => {

       tooltip.transition()
         .duration(200)
         .style("opacity", .9);
       tooltip.html(d.title)
         .attr('x',d.x)
         .attr('y',0)
       })

  circle.on("mouseout", function(d) {
       tooltip.transition()
         .duration(200)
         .style("opacity", 0);
       });

}
