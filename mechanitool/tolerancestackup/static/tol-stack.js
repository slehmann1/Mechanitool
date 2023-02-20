let currrentRowNum = 0;

$(document).ready(function () {
  // Update first row to update events:
  updateRow($("#row-0"), 0);

  $("#add-step").click(function () {
    currrentRowNum++;
    addRow(currrentRowNum);
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
