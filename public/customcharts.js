function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
      words = text
        .text()
        .split(/\s+/)
        .reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", `${++lineNumber * lineHeight + dy}em`)
          .text(word);
      }
    }
  });
}

/**
 * @param selector css selector
 */
const ctx = selector => d3.select(selector);

/**
 * @param ctx | d3 selector object
 * @param options | JS Object
 *  data,
    width,
    height,
    xScaleDomain,
    yScaleDomain,
    axisBottomTickFormat,
    xFormat,
    yFormat,
    getHeight,
    padding,
    margin
 */
const barChart = (ctx, options = {}) => {
  const {
    data,
    width,
    height,
    xScaleDomain,
    yScaleDomain,
    axisBottomTickFormat,
    xFormat,
    yFormat,
    getHeight,
    padding,
    margin,
    barColor
  } = options;

  /**
   * Create Chart object
   * @function translate uses translate transformation tx, ty
   */
  const chart = ctx
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`);

  /**
   * Create scale for X axis
   */
  const xScale = d3
    .scaleBand()
    .range([0, width])
    .domain(data.map(s => xScaleDomain(s)))
    .padding(padding || 0.3);

  /**
   * Create scale for Y axis
   */
  const yScale = d3
    .scaleLinear()
    .range([height, 0])
    .domain(yScaleDomain);

  /**
   * Horizontal Grid Lines
   */
  const makeYLines = () => d3.axisLeft().scale(yScale);
  /*chart
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-width, 0, 0)
        .tickFormat("uv")
    );*/

  /**
   * X Axis design
   */
  chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => axisBottomTickFormat(d)))
    .selectAll(".tick text")
    .call(wrap, 130);

  /**
   * Y Axis design
   */
  chart.append("g").call(d3.axisLeft(yScale));

  /*chart
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(width-10, 0, 10)
        .tickFormat(" μV")
    );*/
  chart
    .append("g")
    .attr("class", "grid")
    .call(
      makeYLines()
        .tickSize(-width, 0, 0)
        .tickFormat(d => d.heldon)
    );

  /**
   * barGroups object
   */
  const barGroups = chart
    .selectAll()
    .data(data)
    .enter()
    .append("g");

  barGroups
    .append("rect")
    .attr("class", "bar")
    .attr("x", g => xFormat(xScale, g) + xScale.bandwidth() / 6)
    .attr("y", g => yFormat(yScale, g))
    .attr("height", g => getHeight(height, yScale, g))
    .attr("width", (2 * xScale.bandwidth()) / 3);

  const bars = chart.selectAll("rect");
  bars.each(function(d, i) {
    d3.select(this).attr("fill", barColor);
  });

  return chart;
};
const lineCurve = (options = {}) => {
  var first_element = true;
  const {
    height,
    width,
    range,
    dataset,
    key,
    referenceline,
    n,
    color,
    margin,
    selector,
    svg,
    axisBottomTickFormat
  } = options;

  const xScale = d3
    .scaleLinear()
    .domain([0, n - 1])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(range)
    .range([height, 0]);

  const line = d3
    .line()
    .defined(d => !isNaN(d.max))
    .x(function(d, i) {
      return xScale(d.date);
    })
    .y(function(d) {
      return yScale(d[key]);
    })
    .curve(d3.curveMonotoneX);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(n)
        .tickFormat(d => axisBottomTickFormat(d))
    );

  svg
    .append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale));

  svg
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-width, 0, 0)
        .tickFormat("")
    );

  svg
    .append("path")
    .datum(dataset.filter(d => d.max !== null))
    .style("stroke", color)
    .style("stroke-width", 3)
    .style("fill", "none")
    .attr("d", line);


  svg.append('line')
    .attr('x1', 0)
    .attr('y1', yScale(referenceline))
    .attr('x2', width)
    .attr('y2', yScale(referenceline))
    .attr("stroke-width", 2)
    .attr("stroke", "#00B386");

  if (!leftBar) {
    svg
      .selectAll("right-bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("fill", function(d, i) {
        let barLength = parseInt(d.max, 10) - parseInt(d.min, 10);
        let bodyPartRange = range[1] - range[0];

        if (barLength < 0.33 * bodyPartRange) {
          return colors[1];
        } else if (
          barLength < 0.66 * bodyPartRange &&
          barLength > 0.33 * bodyPartRange
        ) {
          return colors[1];
        } else {
          return colors[1];
        }
      })
      .attr("x", (d, i) => xScale(i) + 0)
      .attr("width", (d,i)=> {
        if(d.max !== null){
          if(first_element){
              first_element = false;
              console.log(first_element);
              return "4";
          }
          else{
            return "2";
          }
        }
      })
      .attr("y", d => yScale(parseInt(d.max, 10)))
      .attr("height", d =>
        Math.max(
          0,
          height - yScale(parseInt(d.max, 10) + range[0] - parseInt(d.min, 10))
        )
      );
  } else {
    svg
      .selectAll("left-bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("fill", function(d, i) {
        let barLength = d.max - parseInt(d.min, 10);

        let bodyPartRange = range[1] - range[0];

        if (barLength < 0.33 * bodyPartRange) {
          return colors[1];
        } else if (
          barLength < 0.66 * bodyPartRange &&
          barLength > 0.33 * bodyPartRange
        ) {
          return colors[1];
        } else {
          return colors[1];
          //#fff #00B386
        }
      })
      .attr("x", (d, i) => xScale(i)-0.5)
      .attr("width", (d,i)=> {
        if(d.max !== null){
          if(first_element){
              first_element = false;
              console.log(first_element);
              return "4";
          }
          else{
            return "2";
          }
        }
      })
      .attr("y", d => yScale(d.max))
      .attr("height", d =>
        Math.max(
          0,
          height - yScale(parseInt(d.max, 10) + range[0] - parseInt(d.min, 10))
        )
      );
  }
  svg
    .selectAll(".dot")
    .data(dataset.filter(d => d.max !== null))
    .enter()
    .append("circle")
    .style("stroke", "#00B386")
    .style("fill", color)
    .attr("cx", function(d, i) {
      return xScale(d.date);
    })
    .attr("cy", function(d) {
      return yScale(d[key]);
    })
    .attr("r", 5)
    .on("mouseover", function(a, b, c) {
      console.log(a);
      this.attr("class", "focus");
    });


  
};
let leftBar = true;
const lineChartFunc = (options = {}, left_dataset, right_dataset) => {
  const { margin, height, width, n, color, selector, range } = options;
  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  options.svg = svg;

  // LEFT
  leftBar = true;
  options.dataset = left_dataset;
  options.color = colors[2];
  options.key = "min";
  lineCurve(options);
  options.key = "max";
  lineCurve(options);

  leftBar = false;
  options.dataset = right_dataset;
  options.color = colors[1];
  options.key = "min";
  lineCurve(options);
  options.key = "max";
  lineCurve(options);
};
const lineChartFuncEmg = (options = {}, left_dataset, right_dataset) => {
  const { margin, height, width, n, color, selector, range } = options;
  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  options.svg = svg;

  // LEFT
  leftBar = true;
  options.dataset = left_dataset;
  options.color = colors[2];
  options.key = "max";
  lineCurve(options);

  leftBar = false;
  options.dataset = right_dataset;
  options.color = colors[1];
  options.key = "max";
  lineCurve(options);
};

//left right seperate
const lineChartFuncLeftRightSeperate = (options = {}, left_dataset) => {
  const { margin, height, width, n, color, selector, range } = options;
  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  options.svg = svg;

  // LEFT
  leftBar = true;
  options.dataset = left_dataset;
  options.color = colors[2];
  options.key = "min";
  options.referenceline = range[0];
  range[0] = range[0] + range[0]*0.2;
  console.log(range[0]);
  lineCurve(options);
  options.key = "max";
  options.referenceline = range[1];
  lineCurve(options);
};


const increaseRange= (range)=>{
  console.log(range);
  range = parseInt(range)+ (parseInt(range)*0.2);
  console.log(range);
  return range;
};



const lineChartFuncEmgLeftRightSeperate = (options = {}, left_dataset) => {
  const { margin, height, width, n, color, selector, range } = options;
  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  options.svg = svg;

  // LEFT
  leftBar = true;
  options.dataset = left_dataset;
  options.color = colors[2];
  options.key = "max";
  options.referenceline = range[1];
  lineCurve(options);
};

const colors = ["#33ff00", "#C8C8C8", "#00B386", "#23D160"];
const drawLineChart = (selector, lines_data = []) => {
  lines_data.forEach((line, index) => {
    lineChartFunc({
      selector,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      height: 300,
      width: 300,
      n: 7,
      color: colors[3],
      dataset: line
    });
  });
};