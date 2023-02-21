const HIST_BINS = 50;
const data = [
  0.1, 0.2, 0.3, 0.5, 0.9, 1.5, 2.5, 2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 3.2, 3.5,
  3.9, 4.5,
];
const data2 = [
  0.2, 0.2, 0.8, 1.5, 2.5, 1.5, 0.8, 0.7, 1.2, 0.9, 1.5, 1.2, 0.9, 1.0, 0.5,
  0.9, 1.5, 2.5, 2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 3.2, 3.5, 3.9, 4.5,
];

createHistogram(data);

/**
 * Creates data for a histogram
 * @param {Array} data Array of numbers to create a histogram for
 * @param {Array} domain [minimum value, maximum value]
 * @return {Array} [maximum Y value, [X (Bins), Y (Count)]]
 */
function getHistogramBins(data, domain) {
  const histData = [];
  const binWidth = (domain[1] - domain[0]) / (HIST_BINS - 1);
  const binStart = domain[0];
  let maxY = 0;
  for (let i = 0; i < HIST_BINS; i++) {
    const x = binStart + binWidth * i;
    let y = 0;
    for (let j = 0; j < data.length; j++) {
      if (data[j] >= x && data[j] < x + binWidth) {
        y++;
      }
    }
    histData.push([x, y]);
    if (y > maxY) {
      maxY = y;
    }
  }
  return [maxY, histData];
}

/**
 * Create a histogram using an SVG file within the DOM
 * @param {Array} data Array of numbers to create a histogram for
 */
function createHistogram(data) {
  const svg = d3.select("svg");

  // Remove any prior graph, but keep the styling
  svg.selectAll("*:not(.style)").remove();

  const margin = 200;
  const width = svg.attr("width") - margin;
  const height = svg.attr("height") - margin;

  const domain = [Math.min(...data), Math.max(...data)];
  const [maxY, histData] = getHistogramBins(data, domain);
  const range = [0, maxY];

  const xScale = d3.scaleLinear().domain(domain).range([0, width]);
  const yScale = d3.scaleLinear().domain(range).range([height, 0]);
  const yAxisTicks = yScale.ticks().filter((tick) => Number.isInteger(tick));
  const yFormat = d3.format("d");
  const xFormat = d3.format("0.2f");

  // Title
  svg
    .append("text")
    .attr("x", (width + margin) / 2)
    .attr("y", margin / 2 - 20)
    .attr("text-anchor", "middle")
    .text("Stackup Results")
    .attr("class", "title");

  // X label
  svg
    .append("text")
    .attr("x", (width + margin) / 2)
    .attr("y", 40 + height + margin / 2)
    .attr("text-anchor", "middle")
    .style("font-family", "Helvetica")
    .style("font-size", 12)
    .text("Stackup Dimension")
    .attr("class", "axis-title");

  // Y label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(60," + height + ")rotate(-90)")
    .style("font-family", "Helvetica")
    .style("font-size", 12)
    .text("Number Of Samples")
    .attr("class", "axis-title");

  // X axis
  svg
    .append("g")
    .attr(
      "transform",
      "translate(" + margin / 2 + "," + (height + margin / 2) + ")"
    )
    .call(d3.axisBottom(xScale).tickFormat(xFormat))
    .attr("class", "axis");

  // Y axis
  svg
    .append("g")
    .attr("transform", "translate(" + margin / 2 + "," + margin / 2 + ")")
    .call(d3.axisLeft(yScale).tickValues(yAxisTicks).tickFormat(yFormat))
    .attr("class", "axis");

  // Dots
  svg
    .append("g")
    .selectAll("dot")
    .data(histData)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d[0]);
    })
    .attr("cy", function (d) {
      return yScale(d[1]);
    })
    .attr("r", 2)
    .attr("transform", "translate(" + 100 + "," + 100 + ")")
    .attr("class", "dot");

  // Line
  const line = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    })
    .curve(d3.curveMonotoneX);
  svg
    .append("path")
    .datum(histData)
    .attr("class", "line")
    .attr("transform", "translate(" + 100 + "," + 100 + ")")
    .attr("d", line)
    .attr("class", "line");
}
