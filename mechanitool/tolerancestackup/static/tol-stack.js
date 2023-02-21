const HIST_BINS = 15;
let currrentRowNum = 0;

$(document).ready(function () {
  // Update first row to update events:
  updateRow($("#row-0"), 0);

  $("#add-step").click(function () {
    currrentRowNum++;
    addRow(currrentRowNum);
  });

  $("#calculate").click(function () {
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
  });
});

/**
 * Deletes the given row
 * @param {JQueryObject} row
 */
function deleteRow(row) {
  row.remove();
  let hasSkipped = false; // Tracks if deleted row has been passed
  for (let i = 0; i <= currrentRowNum; i++) {
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
  currrentRowNum--;
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
  for (let i = 0; i <= currrentRowNum; i++) {
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
 * Displays the results pane for a tolerance stack
 * @param {Array} data The data to populate the histogram with
 */
function displayResults(data) {
  $("#setup-pane").css("display", "none");
  $("#results-container").css("display", "block");
  console.log("RUN");
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
}
