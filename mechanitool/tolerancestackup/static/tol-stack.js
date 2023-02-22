/**
 * Class to track the state of the application
 */
function State() {
  State.pages = {
    Setup: 0,
    Results: 1,
    Report: 2,
  };

  this.currentRowNum = 0;
  this.page = 0;
}

const HIST_BINS = 15;
const pageState = new State();

$(document).ready(function () {
  // Update first row to update events:
  updateRow($("#row-0"), 0);

  // Setup Button Events
  $("#add-step").click(function () {
    pageState.currentRowNum++;
    addRow(pageState.currentRowNum);
  });

  $("#calculate").click(function () {
    if (pageState.page == State.pages.Setup) {
      stackRows = new StackRows();
      console.log("Wrote: ");
      console.log(stackRows);
      $.ajax({
        url: "http://127.0.0.1:8000/tol/api",
        headers: {
          "X-CSRFToken": $.cookie("csrftoken"),
        },
        type: "POST",
        data: JSON.stringify(stackRows),
        contentType: "application/json; charset=utf-8",
        processData: false,
        success: function (data) {
          console.log("Recieved: ");
          console.log(data);
          displayResults(data);
        },
      });
    }
  });

  $("#back").click(function () {
    console.log("Button Pressed");
    if (pageState.page == State.pages.Results) {
      displaySetup();
    }
  });
});

/**
 * Deletes the given row
 * @param {JQueryObject} row
 */
function deleteRow(row) {
  row.remove();
  let hasSkipped = false; // Tracks if deleted row has been passed
  for (let i = 0; i <= pageState.currentRowNum; i++) {
    row = $("#row-" + i);
    if (row.length != 0) {
      // Deleting the row throws off the count; subtract 1
      if (hasSkipped) {
        updateRow(row, i - 1);
      } else {
        updateRow(row, i);
      }
    } else {
      hasSkipped = true;
    }
  }
  pageState.currentRowNum--;
}

/**
 * Adds a stack-row
 * @param {*} rowNum
 */
function addRow(rowNum) {
  const row = $("#row-" + (rowNum - 1))
    .clone()
    .appendTo("#stack-container");
  updateRow(row, rowNum, true);
  // Delete button listener
  row.find("#delete").click(function () {
    deleteRow(row);
  });
}

/**
 * Adds a stack-row
 *  @param {JQueryObject} row - A stack-step
 * @param {Number} rowNum
 * @param {Boolean} resetRow
 */
function updateRow(row, rowNum, resetRow = false) {
  const cutoffs = row.find(".cutoffs-check");
  const cutoffsLabel = row.find(".cutoffs-label");

  // Update IDs
  row.attr("id", updateID(row, rowNum));
  cutoffs.attr("id", updateID(cutoffs, rowNum));
  cutoffsLabel.attr("id", updateID(cutoffsLabel, rowNum));
  cutoffsLabel.attr("for", "cutoffs-" + rowNum);
  row.find("#stack-num").html(rowNum + 1);

  // Reset to default row
  if (resetRow) {
    row.find("#stack-name").val("");
    row.find("#dist").val("Normal");
    row.find("#mean").val("");
    row.find("#std").val("");
    row.find("#lower-cutoff").val("");
    row.find("#upper-cutoff").val("");
    cutoffs.prop("checked", false);
    row.find("#cutoff-well").css("visibility", "hidden");
    row.find("#delete").css("visibility", "visible");
  }

  // Change cutoff visibility on toggle
  cutoffs.change(function () {
    if (cutoffs.is(":checked")) {
      fadeIn(row.find("#cutoff-well"));
    } else {
      fadeOut(row.find("#cutoff-well"));
    }
  });
}

/**
 * Fades out a jquery object to become hidden
 * @param {JQueryObject} JQObj
 */
function fadeOut(JQObj) {
  let op = 1;
  const timer = setInterval(function () {
    if (op <= 0.1) {
      clearInterval(timer);
      JQObj.css("visibility", "hidden");
    }
    JQObj.css("opacity", op);
    JQObj.css("filter", "alpha(opacity=" + op * 100 + ")");
    op -= op * 0.15;
  }, 3);
}

/**
 * Fades in an jquery object to become visible
 * @param {JQueryObject} element
 */
function fadeIn(element) {
  let op = 0.0;
  element.css("visibility", "visible");
  const timer = setInterval(function () {
    if (op >= 0.95) {
      clearInterval(timer);
    }
    element.css("opacity", op);
    element.css("filter", "alpha(opacity=" + op * 100 + ")");
    op += 0.2;
  }, 3);
}

/**
 * Updates the id of a jquery object to have the rowNum provided
 * @param {JQueryObject} jqObj - the object to modify the id for
 * @param {Number} rowNum
 */
function updateID(jqObj, rowNum) {
  const newID = jqObj.attr("id").split("-");
  newID.pop();
  newID.push(rowNum);
  jqObj.attr("id", newID.join("-"));
}

/**
 * Creates a stackrows object given the data within the UI
 * @return {StackRow} Representation of UI data
 */
function StackRows() {
  const stackRows = {};
  for (let i = 0; i <= pageState.currentRowNum; i++) {
    const row = $("#row-" + i);
    console.log("ROW" + row);
    stackRows[i] = {
      number: i + 1,
      name: row.find("#stack-name").val(),
      distribution: row.find("#dist").val(),
      mean: parseFloat(row.find("#mean").val()),
      std: parseFloat(row.find("#std").val()),
      lsl: parseFloat(row.find("#lower-cutoff").val()),
      usl: parseFloat(row.find("#upper-cutoff").val()),
    };
  }
  return stackRows;
}

/**
 * Displays the setup pane for a tolerance stack
 */
function displaySetup() {
  pageState.page = State.pages.Setup;
  $("#setup-pane").css("display", "block");
  $("#add-step").css("visibility", "visible");
  $("#back").css("visibility", "hidden");
  $("#results-container").css("display", "none");
}

/**
 * Displays the results pane for a tolerance stack
 * @param {Array} data The data to populate the histogram with
 */
function displayResults(data) {
  pageState.page = State.pages.Results;
  $("#setup-pane").css("display", "none");
  $("#add-step").css("visibility", "hidden");
  $("#back").css("visibility", "visible");
  $("#results-container").css("display", "block");
  console.log("Run Histogram");
  createHistogram(data["values"]);
}

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
  const parent = $("#results-container");

  // Remove any prior graph, but keep the styling
  svg.selectAll("*:not(.style)").remove();

  const margin = 120;
  const width = parent.width() - margin;
  const height = parent.height() - margin;

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
    .attr(
      "transform",
      "translate(" +
        (margin / 2 - 40) +
        "," +
        (height + margin) / 2 +
        ")rotate(-90)"
    )
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
    .attr("transform", "translate(" + margin / 2 + "," + margin / 2 + ")")
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
    .attr("transform", "translate(" + margin / 2 + "," + margin / 2 + ")")
    .attr("d", line)
    .attr("class", "line");

  createGraphRules(svg, margin, height, width, xScale);
}

/**
 * Adds draggable rules to a graph
 * @param {Element} svg The svg element to add the rules to
 * @param {number} margin The margin around the graph within the SVG element
 * @param {number} height The height of the SVG element
 * @param {number} width The width of the SVG element
 * @param {d3.scaleLinear} xScale Scale for the x axis
 */
function createGraphRules(svg, margin, height, width, xScale) {
  const leftStart = (width - margin) / 6 + margin / 2;
  const rightStart = ((width - margin) * 5) / 6 + margin / 2;

  // Note order important to overly properly
  svg
    .append("rect")
    .attr("y", margin / 2)
    .attr("x", leftStart)
    .attr("height", height)
    .attr("width", rightStart - leftStart)
    .attr("class", "rule-rect-inside ");

  createLineRule(svg, false, leftStart, margin, width, height, xScale);
  createLineRule(svg, true, rightStart, margin, width, height, xScale);

  // Handles relocation of the line rules
  const dragHandler = d3.drag().on("drag", function (d) {
    if (d3.event.x > width + margin / 2) {
      // Don't let drag off the right of the svg
      d3.event.x = width + margin / 2;
    }
    if (d3.event.x < margin / 2) {
      // Don't let drag off the left of the svg
      d3.event.x = margin / 2;
    }

    const rightSide = d3
      .select(this)
      .select(".rule-rect-outside")
      .attr("class")
      .includes("right");

    // https://stackoverflow.com/questions/38224875/how-can-d3-transform-be-used-in-d3-v4/38230545#38230545
    let rightX = d3.select(".rule-right").node().transform.baseVal[0].matrix.e;
    let leftX = d3.select(".rule-left").node().transform.baseVal[0].matrix.e;

    let textPrefix = "Upper";

    if (rightSide) {
      // Ensure that the rules do not cross
      if (d3.event.x < leftX) {
        d3.event.x = leftX;
      }
    } else {
      // Ensure that the rules do not cross
      if (d3.event.x > rightX) {
        d3.event.x = rightX;
      }
      textPrefix = "Lower";
    }

    d3.select(this).attr("transform", "translate(" + d3.event.x + ",0)");
    // Update text
    d3.select(this)
      .select(".rule-text")
      .text(
        textPrefix +
          " Limit: X=" +
          (
            Math.round(xScale.invert(d3.event.x - margin / 2) * 100) / 100
          ).toFixed(2)
      );

    // Update rects
    if (rightSide) {
      // Update the rect as though it is the right margin
      d3.select(this)
        .select(".rule-rect-outside")
        .attr("width", width - d3.event.x + margin / 2);
      rightX = d3.event.x;
    } else {
      // Update the rect as though it is the left margin
      d3.select(this)
        .select(".rule-rect-outside")
        .attr("width", d3.event.x - margin / 2);
      d3.select(this)
        .select(".rule-rect-outside")
        .attr("x", -d3.event.x + margin / 2);
      leftX = d3.event.x;
    }
    // Update the inside rect
    d3.select(".rule-rect-inside")
      .attr("x", leftX)
      .attr("width", rightX - leftX);
  });
  dragHandler(svg.selectAll(".line-rule-container"));
}

/**
 *  Adds a line rule to a graph
 * @param {Element} svg SVG Element to add the line rules to
 * @param {boolean} isRightSide Is the rule to be added on the right?
 * @param {number} startX The start X value of the rule in the SVG's coordinates
 * @param {number} margin Margin added around the graph within the svg
 * @param {number} width Width of the svg
 * @param {number} height Height of the svg
 * @param {d3.scaleLinear} xScale Scale for the x axis
 */
function createLineRule(
  svg,
  isRightSide,
  startX,
  margin,
  width,
  height,
  xScale
) {
  let className = "rule-right";
  let rectX = 0;
  let rectWidth = width - startX + margin / 2;
  let textTransformX = 200;
  let textAlign = "end";

  if (!isRightSide) {
    className = "rule-left";
    rectX = -startX + margin / 2;
    rectWidth = startX - margin / 2;
    textTransformX *= -1;
    textAlign = "start";
  }

  const lineRuleContainer = svg
    .append("g")
    .attr("transform", "translate(" + startX + ",0)")
    .attr("class", "line-rule-container " + className);

  lineRuleContainer
    .append("rect")
    .attr("y", margin / 2)
    .attr("x", rectX)
    .attr("height", height)
    .attr("width", rectWidth)
    .attr("class", "rule-rect-outside " + className);

  lineRuleContainer
    .append("line")
    .attr("y1", margin / 2)
    .attr("y2", height + margin / 2)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("class", "rule-line");

  lineRuleContainer
    .append("circle")
    .attr("r", 10)
    .attr("cx", 0)
    .attr("cy", height + margin / 2)
    .attr("class", "rule-circle");

  lineRuleContainer
    .append("circle")
    .attr("r", 10)
    .attr("cx", 0)
    .attr("cy", margin / 2)
    .attr("class", "rule-circle");

  lineRuleContainer
    .append("text")
    .attr("text-anchor", textAlign)
    .attr(
      "transform",
      "translate(" + textTransformX + "," + (margin / 2 + 20) + ")"
    )
    .text(
      "Upper Limit: X=" + (xScale.invert((margin / 2) * 100) / 100).toFixed(2)
    )
    .attr("class", "rule-text");
}
