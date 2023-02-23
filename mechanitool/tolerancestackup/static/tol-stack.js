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

  $("#advance").click(function () {
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
          displayResults(data, stackRows);
        },
      });
    } else if (pageState.page == State.pages.Results) {
      displayReport();
    }
  });

  $("#back").click(function () {
    if (pageState.page == State.pages.Results) {
      displaySetup();
    } else if (pageState.page == State.pages.Report) {
      console.log("RETURN TO RESULTS");
    }
  });

  // Input Events
  $("#tolerance").on("input", function () {
    toleranceInputChange(this);
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
  row.find("#tolerance").on("input", function () {
    toleranceInputChange(this);
  });
}

/**
 * Event for when a tolerance input changes value, updating the STD input
 * @param {JQueryObject} obj The input that has changed value
 */
function toleranceInputChange(obj) {
  if (!isNaN($(obj).val()) && $(obj).val() != "") {
    console.log($(obj).val());
    $(obj)
      .parent()
      .parent()
      .find("#std")
      .val(roundNDecs($(obj).val() / 6, 3)); // Update based on 3σ assumption
  }
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
    row.find("#nominal").val("");
    row.find("#tolerance").val("");
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
      nominal: parseFloat(row.find("#nominal").val()),
      std: parseFloat(row.find("#std").val()),
      tolerance: parseFloat(row.find("#tolerance").val()),
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
  $("#advance").html(
    '<i class="fa-solid fa-calculator"></i>&ensp;'
    +'Calculate &ensp;<i class="fa-solid fa-arrow-right"></i>'
  );
  $("#setup-pane").css("display", "block");
  $("#add-step").css("visibility", "visible");
  $("#back").css("visibility", "hidden");
  $("#results-container").css("display", "none");
  $("#advance").css("visibility", "visible");
}

/**
 * Displays the results pane for a tolerance stack
 * @param {Array} data The data to populate the histogram with
 * @param {Object} stackRows Object holding StackRow objects at numeric indices
 */
function displayResults(data, stackRows) {
  pageState.page = State.pages.Results;
  $("#advance").html(
    '<i class="fa-regular fa-file-lines"></i>&ensp;'
    +'Create Report &ensp; <i class="fa-solid fa-arrow-right"></i>'
  );
  $("#setup-pane").css("display", "none");
  $("#add-step").css("visibility", "hidden");
  $("#back").css("visibility", "visible");
  $("#results-container").css("display", "block");
  $("#advance").css("visibility", "visible");
  createHistogram(data["values"]);
  updateStatisticalTables(data["values"], stackRows);
}

/**
 * Displays the report creation page
 */
function displayReport() {
  console.log("REPORT");
  pageState.page = State.pages.Report;

  $("#advance").css("visibility", "hidden");
  $("#setup-pane").css("display", "none");
  $("#add-step").css("visibility", "hidden");
  $("#back").css("visibility", "visible");
  $("#results-container").css("display", "none");

  // TODO: ADD report title, revision, name
  createPDF();
}

/**
 * Creates a pdf report of the tolerance stackup
 */
function createPDF() {
  const doc = new jsPDF();
  doc.text("Unicode σ", 10, 10);
  // A4 page size: 210 X 297 mm
  // Default left margin: 14mm
  doc.text("Overview", 14, 20);

  // Statistical table
  let columns = [
    { title: "Parameter", dataKey: "Parameter" },
    { title: "Value", dataKey: "Value" },
  ];

  let rows = [
    { Parameter: "Mean", Value: $("#tab-mean").html() },
    { Parameter: "Median", Value: $("#tab-median").html() },
    { Parameter: "Standard Deviation", Value: $("#tab-std").html() },
    { Parameter: "Number Of Samples", Value: $("#tab-samples").html() },
  ];

  let columnStyles = {
    0: { cellWidth: 91 },
    1: { cellWidth: 91 },
  };
  addTable(doc, columns, rows, columnStyles);

  // Results table
  columns = [
    { title: "Stackup Type", dataKey: "Type" },
    { title: "Minimum", dataKey: "Minimum" },
    { title: "Maximum", dataKey: "Maximum" },
  ];

  rows = [
    {
      Type: "Worst Case (Absolute) Tolerance Stackup",
      Minimum: $("#tab-abs-min").html(),
      Maximum: $("#tab-abs-max").html(),
    },
    {
      Type: "Statistical (Three Sigma) Tolerance Stackup",
      Minimum: $("#tab-stat-min").html(),
      Maximum: $("#tab-stat-max").html(),
    },
    {
      Type: "Range of Simulated Results",
      Minimum: $("#tab-sim-min").html(),
      Maximum: $("#tab-sim-max").html(),
    },
  ];
  columnStyles = {
    0: { cellWidth: 92 },
    1: { cellWidth: 45 },
    2: { cellWidth: 45 },
  };

  addTable(doc, columns, rows, columnStyles);

  // Results table
  columns = [
    { title: "Range", dataKey: "Range" },
    { title: "Minimum", dataKey: "Minimum" },
    { title: "Maximum", dataKey: "Maximum" },
  ];

  rows = [
    {
      Range: "70% of Samples Fall Between",
      Minimum: $("#tab-70-min").html(),
      Maximum: $("#tab-70-max").html(),
    },
    {
      Range: "95% of Samples Fall Between",
      Minimum: $("#tab-95-min").html(),
      Maximum: $("#tab-95-max").html(),
    },
    {
      Range: "99% of Samples Fall Between",
      Minimum: $("#tab-99-min").html(),
      Maximum: $("#tab-99-max").html(),
    },
    {
      Range: "99.9% of Samples Fall Between",
      Minimum: $("#tab-99_9-min").html(),
      Maximum: $("#tab-99_9-max").html(),
    },
    {
      Range: "99.99% of Samples Fall Between",
      Minimum: $("#tab-99_99-min").html(),
      Maximum: $("#tab-99_99-max").html(),
    },
  ];
  columnStyles = {
    0: { cellWidth: 92 },
    1: { cellWidth: 45 },
    2: { cellWidth: 45 },
  };

  addTable(doc, columns, rows, columnStyles);

  doc.save("a4.pdf");
}

/**
 * Adds a formatted table to a JSPDF document
 * @param {jsPDF} doc JSPDF Document to add the table to
 * @param {Array} columns Array of column header objects
 * @param {Array} rows Array of row objects
 * @param {Object} columnStyles Object of cell widths
 */
function addTable(doc, columns, rows, columnStyles) {
  doc.autoTable(columns, rows, {
    margin: { top: 25 },
    headStyles: {
      lineWidth: 0.25,
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      halign: "center",
    },
    bodyStyles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      halign: "center",
    },
    theme: "grid",
    columnStyles,
    columnWidth: "auto",
  });
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
  const parent = $(".results-graph");

  // Remove any prior graph, but keep the styling
  svg.selectAll("*:not(.style)").remove();

  const margin = 140;
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
        (margin / 2 - 50) +
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

  createGraphRules(svg, margin, height, width, xScale, data);
}

/**
 * Adds draggable rules to a graph
 * @param {Element} svg The svg element to add the rules to
 * @param {number} margin The margin around the graph within the SVG element
 * @param {number} height The height of the SVG element
 * @param {number} width The width of the SVG element
 * @param {d3.scaleLinear} xScale Scale for the x axis
 * @param {Array} data Array of numbers plotted by the histogram
 */
function createGraphRules(svg, margin, height, width, xScale, data) {
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

  createLineRule(
    svg,
    false,
    leftStart,
    rightStart,
    margin,
    width,
    height,
    xScale,
    data
  );
  createLineRule(
    svg,
    true,
    leftStart,
    rightStart,
    margin,
    width,
    height,
    xScale,
    data
  );

  // Handles relocation of the line rules
  const dragHandler = d3.drag().on("drag", function () {
    dragLineRuleEvent(this, width, margin, xScale, data);
  });
  dragHandler(svg.selectAll(".line-rule-container"));
}

/**
 * Handles relocation of graph line rules
 * @param {g} g SVG g element
 * @param {Number} width Width of SVG element
 * @param {Number} margin Margin within the SVG to the graph
 * @param {d3.scaleLinear} xScale Scale for the x axis
 * @param {Array} data Array of numbers plotted by the histogram
 */
function dragLineRuleEvent(g, width, margin, xScale, data) {
  if (d3.event.x > width + margin / 2) {
    // Don't let drag off the right of the svg
    d3.event.x = width + margin / 2;
  }
  if (d3.event.x < margin / 2) {
    // Don't let drag off the left of the svg
    d3.event.x = margin / 2;
  }

  const isRightRule = d3
    .select(g)
    .select(".rule-rect-outside")
    .attr("class")
    .includes("right");

  // https://stackoverflow.com/questions/38224875/how-can-d3-transform-be-used-in-d3-v4/38230545#38230545
  let rightX =
    d3.select(".rule-right").node().transform.baseVal[0].matrix.e - margin / 2;
  let leftX =
    d3.select(".rule-left").node().transform.baseVal[0].matrix.e - margin / 2;

  const leftPercentile = getPercentile(data, xScale.invert(leftX));
  const rightPercentile = 100 - getPercentile(data, xScale.invert(rightX));

  let textPrefixPercent = "Above";
  let percentile = rightPercentile;
  let textAlign = "start";

  if (isRightRule) {
    // Ensure that the rules do not cross
    if (d3.event.x < leftX + margin / 2) {
      d3.event.x = leftX + margin / 2;
    }
  } else {
    // Ensure that the rules do not cross
    if (d3.event.x > rightX + margin / 2) {
      d3.event.x = rightX + margin / 2;
    }
    textPrefixPercent = "Below";
    percentile = leftPercentile;
    textAlign = "end";
  }

  d3.select(g).attr("transform", "translate(" + d3.event.x + ",0)");
  // Update text
  d3.select(g)
    .select(".rule-text")
    .text("X=" + roundNDecsFixed(xScale.invert(d3.event.x - margin / 2)))
    .append("tspan")
    .attr("x", 0)
    .attr("dy", "1.2em")
    .text(textPrefixPercent + " limit: " + roundNDecsFixed(percentile, 1) + "%")
    .attr("text-anchor", textAlign)
    .attr("class", "rule-text-percent");

  // Update rects
  if (isRightRule) {
    // Update the rect as though it is the right margin
    d3.select(g)
      .select(".rule-rect-outside")
      .attr("width", width - d3.event.x + margin / 2);
  } else {
    // Update the rect as though it is the left margin
    d3.select(g)
      .select(".rule-rect-outside")
      .attr("width", d3.event.x - margin / 2);
    d3.select(g)
      .select(".rule-rect-outside")
      .attr("x", -d3.event.x + margin / 2);
  }
  // Update the inside rect
  d3.select(".rule-rect-inside")
    .attr("x", leftX + margin / 2)
    .attr("width", rightX - leftX);

  // Update the inside text
  d3.select(".rule-text-within")
    .text(
      "CPK: " +
        roundNDecsFixed(
          getCPK(data, xScale.invert(rightX), xScale.invert(leftX))
        )
    )
    .attr("class", "rule-text-within")
    .append("tspan")
    .attr("x", 0)
    .attr("dy", "1.2em")
    .text(
      "Within limits: " +
        roundNDecsFixed(100 - rightPercentile - leftPercentile, 1) +
        "%"
    )
    .attr("text-anchor", "end");
}

/**
 *  Adds a line rule to a graph
 * @param {Element} svg SVG Element to add the line rules to
 * @param {boolean} isRightSide Is the rule to be added on the right?
 * @param {number} leftX The X value of the left rule in the SVG's coordinates
 * @param {number} rightX The X value of the right rule in the SVG's coordinates
 * @param {number} margin Margin added around the graph within the svg
 * @param {number} width Width of the svg
 * @param {number} height Height of the svg
 * @param {d3.scaleLinear} xScale Scale for the x axis
 * @param {Array} data Array of numbers plotted by the histogram
 */
function createLineRule(
  svg,
  isRightSide,
  leftX,
  rightX,
  margin,
  width,
  height,
  xScale,
  data
) {
  let className = "rule-right";
  let rectX = 0;
  let startX = 0;
  isRightSide ? (startX = rightX) : (startX = leftX);
  let rectWidth = width - startX + margin / 2;
  let textTransformX = 30;
  let textAlign = "start";
  let textPrefixPercent = "Above";

  const leftPercentile = getPercentile(data, xScale.invert(leftX));
  const rightPercentile = 100 - getPercentile(data, xScale.invert(rightX));
  let percentile = rightPercentile;

  const lineRuleContainer = svg
    .append("g")
    .attr("transform", "translate(" + startX + ",0)");

  if (!isRightSide) {
    className = "rule-left";
    rectX = -startX + margin / 2;
    rectWidth = startX - margin / 2;
    textTransformX *= -1;
    textAlign = "end";
    textPrefixPercent = "Below";
    percentile = leftPercentile;
  } else {
    lineRuleContainer
      .append("text")
      .attr("text-anchor", "end")
      .attr(
        "transform",
        "translate(" + -textTransformX + "," + (margin / 2 + 20) + ")"
      )
      .text(
        "CPK: " +
          roundNDecsFixed(
            getCPK(
              data,
              xScale.invert(rightX - margin / 2),
              xScale.invert(leftX - margin / 2)
            )
          )
      )
      .attr("class", "rule-text-within")
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em")
      .text(
        "Within limits: " +
          roundNDecsFixed(100 - rightPercentile - leftPercentile, 1) +
          "%"
      )
      .attr("text-anchor", "end");
  }

  lineRuleContainer.attr("class", "line-rule-container " + className);

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
    .text("X=" + xScale.invert(startX - margin / 2).toFixed(2))
    .attr("class", "rule-text")
    .append("tspan")
    .attr("x", 0)
    .attr("dy", "1.2em")
    .text(textPrefixPercent + " limit: " + roundNDecsFixed(percentile, 1) + "%")
    .attr("text-anchor", textAlign)
    .attr("class", "rule-text-percent");
}

/**
 * Updates statistical tables on the page
 * @param {Array} data Array of data
 * @param {Object} stackRows Object holding StackRow objects at numeric indices
 */
function updateStatisticalTables(data, stackRows) {
  // Update stat results table
  const statResults = new StatisticalResults(data);

  $("#tab-mean").html(roundNDecsFixed(statResults.mean));
  $("#tab-median").html(roundNDecsFixed(statResults.median));
  $("#tab-std").html(roundNDecsFixed(statResults.std));
  $("#tab-samples").html(statResults.numSamples);

  const rangeResults = new RangeResults(data, stackRows);
  $("#tab-70-min").html(roundNDecsFixed(rangeResults.percentSample70[0]));
  $("#tab-70-max").html(roundNDecsFixed(rangeResults.percentSample70[1]));
  $("#tab-95-min").html(roundNDecsFixed(rangeResults.percentSample95[0]));
  $("#tab-95-max").html(roundNDecsFixed(rangeResults.percentSample95[1]));
  $("#tab-99-min").html(roundNDecsFixed(rangeResults.percentSample99[0]));
  $("#tab-99-max").html(roundNDecsFixed(rangeResults.percentSample99[1]));
  $("#tab-99_9-min").html(roundNDecsFixed(rangeResults.percentSample99_9[0]));
  $("#tab-99_9-max").html(roundNDecsFixed(rangeResults.percentSample99_9[1]));
  $("#tab-99_99-min").html(roundNDecsFixed(rangeResults.percentSample99_99[0]));
  $("#tab-99_99-max").html(roundNDecsFixed(rangeResults.percentSample99_99[1]));

  $("#tab-stat-min").html(roundNDecsFixed(statResults.statMin));
  $("#tab-stat-max").html(roundNDecsFixed(statResults.statMax));
  $("#tab-sim-min").html(roundNDecsFixed(statResults.min));
  $("#tab-sim-max").html(roundNDecsFixed(statResults.max));

  absRange = getAbsoluteRange(stackRows);
  $("#tab-abs-min").html(roundNDecsFixed(absRange[0]));
  $("#tab-abs-max").html(roundNDecsFixed(absRange[1]));
}

/**
 * Rounds a floating point number to N fixed decimal places
 * @param {Number} num A floating point number to be rounded
 * @param {Number} places A floating point number to be rounded
 * @return {string} Rounded number in a string representation
 */
function roundNDecsFixed(num, places = 2) {
  return (Math.round(num * 10 ** places) / 10 ** places).toFixed(places);
}

/**
 * Rounds a floating point number to N decimal places, dropping trailing zeroes
 * @param {Number} num A floating point number to be rounded
 * @param {Number} places A floating point number to be rounded
 * @return {string} Rounded number in a string representation
 */
function roundNDecs(num, places = 2) {
  return Math.round(num * 10 ** places) / 10 ** places;
}

/**
 * Computes basic statistical results for an array of numbers
 * @param {Array} data Array of numbers to compute statistical results for
 */
function StatisticalResults(data) {
  this.numSamples = data.length;
  this.mean = calcMean(data);
  this.std = calcSTD(data, this.mean);
  const midpoint = Math.floor(data.length / 2);
  // If odd take midpoint
  // If even take avg of midpoints
  this.median =
    data.length % 2 === 1
      ? data[midpoint]
      : (data[midpoint - 1] + data[midpoint]) / 2;

  this.min = Math.min(...data);
  this.max = Math.max(...data);

  this.statMin = this.mean - 3 * this.std;
  this.statMax = this.mean + 3 * this.std;
}

/**
 * Object that computes percentage ranges associated with numeric data
 * @param {Array} data Array of numbers to compute range results for
 */
function RangeResults(data) {
  this.percentSample70 = getPercentileRange(data, 70);
  this.percentSample95 = getPercentileRange(data, 95);
  this.percentSample99 = getPercentileRange(data, 99);
  this.percentSample99_9 = getPercentileRange(data, 99.9);
  this.percentSample99_99 = getPercentileRange(data, 99.99);
}

/**
 * Computes the two sided limit required to enclose
 * a certain percentage of a data array
 * @param {Array} data Array of numbers to compute the percentile range for
 * @param {Number} percent Percentage that should fall between the bounds
 * @return {Array} [Lower Limit, Upper Limit]
 */
function getPercentileRange(data, percent) {
  // Samples permitted on either side
  const samples = Math.floor((data.length * percent) / 200);
  const i = data.length / 2 - samples < 0 ? 0 : data.length / 2 - samples;
  const j =
    data.length / 2 + samples > data.length - 1
      ? data.length - 1
      : data.length / 2 + samples;
  return [data[i], data[j]];
}

/**
 * Compute the absolute range (worst case) of a tolerance stackup
 * @param {Object} stackRows Object holding StackRow objects at numeric indices
 * @return {Array} [min value, max value]
 */
function getAbsoluteRange(stackRows) {
  let min = 0;
  let max = 0;
  for (let i = 0; i < Object.keys(stackRows).length; i++) {
    min += stackRows[i].nominal - stackRows[i].tolerance;
    max += stackRows[i].nominal + stackRows[i].tolerance;
  }
  return [min, max];
}

/**
 * Determines the percentile at which the given value occurs in the data
 * @param {Array} data Ordered array of numbers to compute a percentile for
 * @param {Number} value A value at which the percentile should be determined
 * @return {Number} Percentile
 */
function getPercentile(data, value) {
  for (let i = 0; i < data.length; i++) {
    if (data[i] > value) {
      return (i / data.length) * 100;
    }
  }
}

/**
 * Computes a CPK
 * @param {Number} data Data to calculate CPK for
 * @param {Number} usl Upper specification limit
 * @param {Number} lsl Lower specification limit
 * @return {Number}
 */
function getCPK(data, usl, lsl) {
  console.log("LSL: " + lsl + "USL" + usl);
  const mean = calcMean(data);
  const std = calcSTD(data, mean);
  const CPU = (usl - mean) / 3 / std;
  const CPL = (mean - lsl) / 3 / std;
  return Math.min(CPU, CPL);
}

/**
 * Computes the arithmetic mean of an array of numbers
 * @param {Array} data Array of numbers
 * @return {Number} Arithmetic mean
 */
function calcMean(data) {
  return data.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Computes the standard deviation of an array of numbers
 * @param {Array} data Array of numbers
 * @param {Number} mean Arithmetic mean of data
 * @return {Number} Standard deviation
 */
function calcSTD(data, mean) {
  return Math.sqrt(
    data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data.length
  );
}
