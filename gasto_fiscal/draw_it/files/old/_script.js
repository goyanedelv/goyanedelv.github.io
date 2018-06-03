var data = [
  // {"year": 2000,    "debt": 13.2},
  // {"year": 2001,    "debt": 14.5},
  // {"year": 2002,    "debt": 15.2},
  // {"year": 2003,    "debt": 12.7},
  // {"year": 2004,    "debt": 10.3},
  // {"year": 2005,    "debt": 7},
  {"year": 2006,    "debt": 5},
  {"year": 2007,    "debt": 3.9},
  {"year": 2008,    "debt": 4.9},
  {"year": 2009,    "debt": 5.8},
  {"year": 2010,    "debt": 8.6},
  {"year": 2011,    "debt": 11.1},
  {"year": 2012,    "debt": 11.9},
  {"year": 2013,    "debt": 12.7},
  {"year": 2014,    "debt": 14.9},
  {"year": 2015,    "debt": 17.3},
  {"year": 2016,    "debt": 21},
  {"year": 2017,    "debt": 23.6}
]

var bisect = d3.bisector(function(d) { return d.year; }).left;

var breakYear = 2010
var debtBreakYear = data[bisect(data, breakYear)].debt

var yTickFormat = function(d){ return d3.round(d,1) + '%' }
var yellow = 0xffff00

var ƒ = d3.f
var sel = d3.select('#chartDeuda')

var c = d3.conventions({
  parentSel: sel, 
  totalWidth: sel.node().offsetWidth, 
  height: 400, 
  margin: {left: 50, right: 50, top: 10, bottom: 30}
})

c.svg.append('rect').at({width: c.width, height: c.height, opacity: 0})

//////////
// AXIS //
//////////

var retrieveYear = function(data) { return data.year; }
var minYear = d3.min(data, retrieveYear)
var maxYear = d3.max(data, retrieveYear)
c.x.domain([minYear, maxYear])
c.y.domain([0, 70])

c.xAxis.ticks(data.length).tickFormat(ƒ())
c.yAxis.ticks(5).tickFormat(d => d + '%')

/////////////////////////////
// PERIODOS PRESIDENCIALES //
/////////////////////////////

// Bachelet 1
var year1 = 2006
var year2 = 2010
c.svg.append('rect.bachelet')
      .attr("x", c.x(year1))
      .attr("y", 0)
      .attr("width", c.x(year2) - c.x(year1))
      .attr("height", c.y(0));

c.svg.append("text.texto_presi.texto_bachelet")
      .attr("x", c.x((year1+year2)/2  - 0.5))
      .attr("y", c.height/10)
      .attr("dy", ".35em")
      .text("Bachelet 1");

// Piñera 1
var year1 = 2010
var year2 = 2014
c.svg.append('rect.pinera')
      .attr("x", c.x(year1))
      .attr("y", 0)
      .attr("width", c.x(year2) - c.x(year1))
      .attr("height", c.y(0));

c.svg.append("text.texto_presi.text_pinera")
      .attr("x", c.x((year1+year2)/2  - 0.5))
      .attr("y", c.height/10)
      .attr("dy", ".35em")
      .text("Piñera 1");

// Bachelet 2
var year1 = 2014
var year2 = 2017
c.svg.append('rect.bachelet')
      .attr("x", c.x(year1))
      .attr("y", 0)
      .attr("width", c.x(year2) - c.x(year1))
      .attr("height", c.y(0));

c.svg.append("text.texto_presi.texto_bachelet")
      .attr("x", c.x((year1+year2)/2 - 0.5))
      .attr("y", c.height/10)
      .attr("dy", ".35em")
      .text("Bachelet 2");

// Texto de ayuda
// c.svg.append("text")
//       .attr("x", c.x(2012.2))
//       .attr("y", c.height/4)
//       .style('opacity', 0.8)
//       .style('font-size','1.1em')
//       .text("Completa la línea para los años que faltan");


/////////////////////////////////////////
// AREA BAJO LA CURVA HASTA BREAK YEAR //
/////////////////////////////////////////

var area = d3.area().x(ƒ('year', c.x)).y0(ƒ('debt', c.y)).y1(c.height)
var line = d3.area().x(ƒ('year', c.x)).y(ƒ('debt', c.y))

var clipRect = c.svg
  .append('clipPath#clip')
  .append('rect')
  .at({width: c.x(breakYear) - 2, height: c.height})

var correctSel = c.svg.append('g').attr('clip-path', 'url(#clip)')
correctSel.append('path.area').at({d: area(data)})
correctSel.append('path.line').at({d: line(data)})

yourDataSel = c.svg.append('path.your-line')

c.drawAxis()

// Circulo break year
var breakYearCircle = c.svg.append('circle')
  .at({r: 5, fill: '#1d428a', opacity: 1, cx: c.x(breakYear)}).attr("cy", c.y(debtBreakYear))

var breakYearText = c.svg.append('text')
  .at({fill: '#1d428a', opacity: 1, x: c.x(breakYear-0.3)})
  .attr("y", c.y(debtBreakYear+3))
  .attr("dy", ".35em")
  .text(debtBreakYear+"%")

//////////////////////////////
///// DATOS A INGRESAR   /////
//////////////////////////////

var yourDataCircleSel = c.svg.append('circle')
  .at({r: 5, fill: yellow, opacity: 0, cx: c.x(maxYear)})

var yourDataTextSel = c.svg.append('text.g-y-num')
  .at({opacity: 1, dy: '0.33em', x: 10, textAnchor: 'start', fill: yellow})

yourData = data
  .map(function(d){ return {year: d.year, debt: d.debt, defined: 0} })
  .filter(function(d){
    if (d.year == breakYear) d.defined = true
    return d.year >= breakYear
  })

var completed = false
var llegoUltimoAno = false

var drag = d3.drag()
  .on('drag', function(){
    var moverPuntoGuia = true

    var pos = d3.mouse(this)
    var year = clamp(breakYear+1, maxYear, c.x.invert(pos[0]))
    var debt = clamp(0, c.y.domain()[1], c.y.invert(pos[1]))

    if(year >= maxYear-0.5){
      llegoUltimoAno = true
    }

    if(llegoUltimoAno && year <= maxYear-0.5){
        moverPuntoGuia = false
    }

        if(moverPuntoGuia){
    yourDataCircleSel
          .at({opacity: 1, cy: c.y(debt)})
    }

    yourData.forEach(function(d){
      if (Math.abs(d.year - year) < .5){
        d.debt = debt
        d.defined = true
      }

    })

    yourDataSel.at({d: line.defined(ƒ('defined'))(yourData)})

    if (!completed && d3.mean(yourData, ƒ('defined')) == 1){
      completed = true
      d3.select("#checkDeuda").transition().duration(500)
        .style('background-color','#008CBA')
        .style('opacity', 1)
        .attr('pointer-events','all')
        .text('Revisa tu respuesta');
      }

    yourDataTextSel
      .at({opacity: 1, x: c.x(year) - 10, y: c.y(debt) - 30})
      .text(yTickFormat(debt))
  })

c.svg.call(drag)

function checkDeuda(){
    if (completed){
    clipRect.transition()
      .duration(1000)
      .attr('width', c.x(maxYear))

    // Dibujar punto del último año Bachelet
    var lastYearBachelet = c.svg.append('circle')
    .at({r: 5, fill: '#1d428a', opacity: 1, cx: c.x(maxYear)}).attr("cy", c.y(data[data.length-1]["debt"]))
    
    var lastYearBachelet = c.svg.append('text')
    .at({fill: '#1d428a', opacity: 1, x: c.x(maxYear+0.1)})
    .attr("y", c.y(data[data.length-1]["debt"]))
    .attr("dy", ".35em")
    .text(data[data.length-1]["debt"]+"%")

    // Dibujar punto del último año Piñera
    var debtLastYearPinera = data[bisect(data, 2014)].debt

    var lastYearPinera = c.svg.append('circle')
    .at({r: 5, fill: '#1d428a', opacity: 1, cx: c.x(2014)}).attr("cy", c.y(debtLastYearPinera))
    
    var lastYearPinera = c.svg.append('text')
    .at({fill: '#1d428a', opacity: 1, x: c.x(2014)})
    .attr("y", c.y(debtLastYearPinera-2))
    .attr("dy", ".35em")
    .text(debtLastYearPinera+"%")
  }
}

function clamp(a, b, c){ return Math.max(a, Math.min(b, c)) }