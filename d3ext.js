//Run this once the web page has fully loaded
$(document).ready(function() {
  //Add a click event to the config save button
  $("#configButton").click(function() {
    console.log("Config Saving");
    // Disable the button after it's been clicked
    $("#configButton").prop("disabled", true);
    saveConfig();
  });

  //This runs when a user selects the config dropdown in the Tableau UI
  tableau.extensions.initializeAsync({ configure: configure }).then(function() {
    console.log("ConfigInitialising");
    $("#config").hide();
    $("#main").show();
  });

  //This runs upon loading the extension
  tableau.extensions.initializeAsync().then(function() {

    //Load the data table by setting the parameter used to filter out the data, performance enhancement that may not be required
    loadViz();

    // Add an event listener for the filter changed event on this sheet.
    // Assigning the event to a variable just to make the example fit on the page here.
    worksheet = retrieveTargetWorksheet();
    const FilterChanged = tableau.TableauEventType.FilterChanged;
    unregisterEventHandlerFunction = worksheet.addEventListener(
      FilterChanged,
      function(selectionEvent) {
        // When the selection changes, reload the data
        loadViz();
      }
    );
  });
});

//Returns the worksheet object using the saved setting
function retrieveTargetWorksheet() {
  var dashboard = tableau.extensions.dashboardContent.dashboard;
  //  After initialization, ask Tableau what sheets are available
  const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var targetWorksheet = tableau.extensions.settings.get("targetWorksheet");
  // Find a specific worksheet and return it to the worksheet variable
  var worksheet = worksheets.find(function(sheet) {
    return sheet.name === targetWorksheet;
  });
  return worksheet;
}

//Loads the Summary data shown in the viz, converts the returned array into
//key:value pairs and supplies that to the Dimple.js library
//A simple bar chart is displayed using the first measure and first dimension in the array
//This could be enhanced by providing the user with further config options to select
//the dimension and measure to be used in the viz
//Further enhancement to allow user to configure the viz type and the code
//dynamically produces the correct output viz based on the setting saved.
function loadViz() {
  worksheet = retrieveTargetWorksheet();
  // get the summary data for the selected worksheet
  worksheet.getSummaryDataAsync().then(function(summary) {
    /*var tableColumns = [];
    //Push the column names into the data array - not needed but interesting
    for (i = 0; i < summary.columns.length; i++) {
      tableColumns.push({ title: summary.columns[i].fieldName });
    }*/
    const worksheetData = summary.data;
    //var totalColumns = summary.columns.length;
    var totalRows = summary.totalRowCount;
    //Create an array to hold our viz data for Dimple
    var tableData = [];
    //Push into array the key value pairs for the d3 viz
    for (var i = 0; i < totalRows; i++) {
      key = worksheetData[i][0].formattedValue;
      value = worksheetData[i][1].value;
      tableData.push({ Dim: key, Measure: value });
    }
    //Removes any previous viz that was in the web page
    d3.select("svg").remove();
    //Creates a new svg element on the page
    var svg = dimple.newSvg("#vizcontainer", 500, 500);

    var chart = new dimple.chart(svg, tableData);
    var y = chart.addCategoryAxis("y", "Dim");
    y.addOrderRule("Measure");
    chart.addMeasureAxis("x", "Measure");
    chart.setMargins(60, 0, 0, 50);
    chart.addSeries(null, dimple.plot.bar);
    chart.draw();

/*  Dimple Donut Chart Example - because everyone loves donuts
    var myChart = new dimple.chart(svg, tableData);
    myChart.setBounds(10, 10, 460, 360)
    myChart.addMeasureAxis("p", "Measure");
    var ring = myChart.addSeries("Dim", dimple.plot.pie);
    ring.innerRadius = "50%";
    myChart.addLegend(430, 20, 90, 300, "left");
    myChart.draw();
*/

  });
}

function saveConfig() {
  targetWorksheet = $("#worksheetDropdown").val();
  tableau.extensions.settings.set("targetWorksheet", targetWorksheet);
  console.log(tableau.extensions.settings.get("targetWorksheet"));
  storeSettings();
  //Re-enable the config button
  $("#configButton").prop("disabled", false);
  $("#config").hide();
  loadViz();
  $("#main").show();
}

function storeSettings() {
  tableau.extensions.settings
    .saveAsync()
    .then(result => {
      console.log("Settings saved.");
    })
    .catch(error => {
      console.log(error);
    });
}

function configure() {
  // ... code to configure the extension
  console.log("Config Selected");
  $("#config").show();
  $("#main").hide();
  worksheetDropdown();
}

function worksheetDropdown() {
  const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var worksheetNames = [];
  for (var i = 0; i < worksheets.length; i++) {
    worksheetNames[i] = [worksheets[i].name];
  }
  $("#worksheetDropdown").empty();
  $.each(worksheetNames, function(i, p) {
    $("#worksheetDropdown").append(
      $("<option></option>")
        .val(p)
        .html(p)
    );
  });
}
