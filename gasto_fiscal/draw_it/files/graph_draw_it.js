var Chart = function(opts) {

    // load in arguments from config object
    this.data = opts.data;
    this.element = opts.element;
    this.breakYear = opts.breakYear;
    this.color = opts.color
    this.height = 400 
    this.button_selector = opts.button_selector
    this.ƒ = d3.f
    this.dragged = false
    this.button_color_completed = "#008CBA"

    this.bachelet1 = opts.bachelet1
    this.pinera1 = opts.pinera1
    this.bachelet2 = opts.bachelet2
    this.y_range = opts.y_range

    // create the chart
    this.draw();
}

Chart.prototype.draw = function() {
    var self = this
    var data = this.data

    var retrieveYear = function(data) { return data.year; }
    this.minYear = d3.min(data, retrieveYear)
    this.maxYear = d3.max(data, retrieveYear)
    this.bisect = d3.bisector(function(d) { return d.year; }).left;

    self.debtBreakYear = self.data[this.bisect(data, this.breakYear)].debt

    var sel = d3.select(this.element)
    sel.html("");

    console.log(this.yourDataSel)
    this.c = d3.conventions({
      parentSel: sel, 
      totalWidth: sel.node().offsetWidth, 
      height: this.height, 
      margin: {left: 50, right: 50, top: 10, bottom: 30}
    })

    this.c.svg.enter().append('rect').at({width: self.c.width, height: self.c.height, opacity: 0})

    this.createScales();
    // Show presidential periods
    this.rectangulosPresidenciales();
    this.area = d3.area().x(this.ƒ('year', this.c.x)).y0(this.ƒ('debt', this.c.y)).y1(this.c.height)
    this.line = d3.area().x(this.ƒ('year', this.c.x)).y(this.ƒ('debt', this.c.y))
    this.addLine();
    this.yourDataSel = this.c.svg.append('path.your-line')
    this.addAxes();
    this.dragDraw();

}

//////////
// Axes //
//////////
Chart.prototype.createScales = function(){    
    this.c.x.domain([this.minYear, this.maxYear])
    this.c.y.domain(this.y_range)

    this.c.xAxis.ticks(this.data.length).tickFormat(this.ƒ())
    this.c.yAxis.ticks(5).tickFormat(d => d + '%')
}

Chart.prototype.addAxes = function(){
    this.c.drawAxis()
}

/////////////////////////////
// PERIODOS PRESIDENCIALES //
/////////////////////////////
Chart.prototype.rectangulosPresidenciales = function(){

    var c = this.c

    // Bachelet 1
    if(this.bachelet1){
    var year1 = 2006
    var year2 = 2010
    this.c.svg.append('rect.bachelet')
    .attr("x", c.x(year1))
    .attr("y", 0)
    .attr("width", c.x(year2) - c.x(year1))
    .attr("height", c.y(0));

    this.c.svg.append("text.texto_presi.texto_bachelet")
    .attr("x", c.x((year1+year2)/2  - 0.5))
    .attr("y", c.height/10)
    .attr("dy", ".35em")
    .text("Bachelet 1");
    }
    
    if(this.pinera1){
    // Piñera 1
    var year1 = 2010
    var year2 = 2014
    this.c.svg.append('rect.pinera')
    .attr("x", c.x(year1))
    .attr("y", 0)
    .attr("width", c.x(year2) - c.x(year1))
    .attr("height", c.y(0));

    this.c.svg.append("text.texto_presi.text_pinera")
    .attr("x", c.x((year1+year2)/2  - 0.5))
    .attr("y", c.height/10)
    .attr("dy", ".35em")
    .text("Piñera 1");
    }

    if(this.bachelet2){
    // Bachelet 2
    var year1 = 2014
    var year2 = 2017
    this.c.svg.append('rect.bachelet')
    .attr("x", c.x(year1))
    .attr("y", 0)
    .attr("width", c.x(year2) - c.x(year1))
    .attr("height", c.y(0));

    this.c.svg.append("text.texto_presi.texto_bachelet")
    .attr("x", c.x((year1+year2)/2 - 0.5))
    .attr("y", c.height/10)
    .attr("dy", ".35em")
    .text("Bachelet 2");
    }
}

/////////////////////////////////////////
// AREA BAJO LA CURVA HASTA BREAK YEAR //
/////////////////////////////////////////
Chart.prototype.addLine = function(){
    var self = this
    var c = this.c

    this.clipRect = c.svg
    .append('clipPath#clip')
    .append('rect')
    .at({width: c.x(this.breakYear) - 2, height: c.height})

    var correctSel = c.svg.append('g').attr('clip-path', 'url(#clip)')
    correctSel.append('path.area').at({d: self.area(this.data)})
    correctSel.append('path.line').at({d: self.line(this.data)})

    // Circulo break year
    var breakYearCircle = c.svg.append('circle')
    .at({r: 5, fill: '#1d428a', opacity: 1, cx: c.x(this.breakYear)}).attr("cy", c.y(this.debtBreakYear))

    var breakYearText = c.svg.append('text')
    .at({fill: '#1d428a', opacity: 1, x: c.x(this.breakYear-0.3)})
    .attr("y", c.y(this.debtBreakYear)-15)
    .attr("dy", ".35em")
    .text(this.debtBreakYear+"%")
}

// the following are "public methods"
// which can be used by code outside of this file
Chart.prototype.setColor = function(newColor) {

    this.plot.select('.line')
    .style('stroke',newColor);

    // store for use when redrawing
    this.lineColor = newColor;
}

Chart.prototype.setData = function(newData) {
    this.data = newData;
    
    // full redraw needed
    this.draw();
}

Chart.prototype.setCompleted = function(comp) {
    this.completed = comp;
    d3.select(self.button_selector).transition().duration(500)
      .style('background-color','#fa4825')
      .style('opacity', 1)
      .attr('pointer-events','none')
      .text('Rellena el gráfico...');

    console.log(this.line)
    this.draw();

    // full redraw needed
}

Chart.prototype.dragDraw = function(element_selector){
    var self = this
    
    // Guiding circle (the one at the right)
    var yourDataCircleSel = this.c.svg.append('circle')
    .at({r: 5, fill: this.color, opacity: 0, cx: this.c.x(this.maxYear)})

    // Text showing the % of debt
    var yourDataTextSel = this.c.svg.append('text.g-y-num')
    .at({opacity: 0, dy: '0.33em', x: 10, textAnchor: 'start', fill: this.color})

    var yourData = this.data
    .map(function(d){ return {year: d.year, debt: d.debt, defined: 0} })
    .filter(function(d){
        if (d.year == self.breakYear) d.defined = true
            return d.year >= self.breakYear
    })

    self.completed = false
    llegoUltimoAno = false

    var drag = d3.drag()
    .on('drag', function(){
        self.dragged = true
        var moverPuntoGuia = true

        var pos = d3.mouse(this)
        var year = clamp(self.breakYear+1, self.maxYear, self.c.x.invert(pos[0]))
        var debt = clamp(0, self.c.y.domain()[1], self.c.y.invert(pos[1]))

        if(year >= self.maxYear-0.5){
          llegoUltimoAno = true
      }

      if(llegoUltimoAno && year <= self.maxYear-0.5){
        moverPuntoGuia = false
    }

    if(moverPuntoGuia){
        yourDataCircleSel
        .at({opacity: 1, cy: self.c.y(debt)})
    }

    yourData.forEach(function(d){
      if (Math.abs(d.year - year) < .5){
        d.debt = debt
        d.defined = true
    }
    })

    self.yourDataSel.at({d: self.line.defined(self.ƒ('defined'))(yourData)})

    if (!self.completed && d3.mean(yourData, self.ƒ('defined')) == 1){
      self.completed = true
      d3.select(self.button_selector).transition().duration(500)
      .style('background-color',self.button_color_completed)
      .style('opacity', 1)
      .attr('pointer-events','all')
      .text('Revisa tu respuesta');
  }

  var yTickFormat = function(d){ return d3.round(d,1) + '%' }
  yourDataTextSel
  .at({opacity: 1, x: self.c.x(year) - 10, y: self.c.y(debt) - 20})
  .text(yTickFormat(debt))
 }) // End on drag

    self.c.svg.call(drag)
}

Chart.prototype.animateData = function(){
    var clipRect = this.clipRect
    var c = this.c
    var maxYear = this.maxYear
    var data = this.data

    if (this.completed){
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
    var debtLastYearPinera = data[this.bisect(data, 2014)].debt

    var lastYearPinera = c.svg.append('circle')
    .at({r: 5, fill: '#1d428a', opacity: 1, cx: c.x(2014)}).attr("cy", c.y(debtLastYearPinera))
    
    var lastYearPinera = c.svg.append('text')
    .at({fill: '#1d428a', opacity: 1, x: c.x(2014)})
    .attr("y", c.y(debtLastYearPinera)-15)
    .attr("dy", ".35em")
    .text(debtLastYearPinera+"%")
    }

    // Remove floating text
    //this.c.svg.select('text.g-y-num').attr('opacity', '0');

}

function clamp(a, b, c){ return Math.max(a, Math.min(b, c)) }