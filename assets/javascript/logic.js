$(document).ready(function(){
    // Setup for Firebase Config
    var config = {
        apiKey: "AIzaSyAOHxmgnq2mE_OV98WbqXq-V2sI_j4SU8U",
        authDomain: "train-scheduler-ac26f.firebaseapp.com",
        databaseURL: "https://train-scheduler-ac26f.firebaseio.com",
        projectId: "train-scheduler-ac26f",
        storageBucket: "",
        messagingSenderId: "583142225513",
        appId: "1:583142225513:web:b042035044abc900"
    };

    // Initializes firebase and database
    firebase.initializeApp(config);
    var database = firebase.database();

    // Grabs data from firebase and updates the train arrival table
    function trainTable() {
        $("#tableBody").empty();
        database.ref("/trains/").on("child_added", function(snapshot) {
            let trainName = snapshot.val().trainName;
            let destination = snapshot.val().destination;
            let trainFrequency = snapshot.val().trainFrequency;
            let firstTrainTime = snapshot.val().firstTrainTime;

            var trainNameCell = $("<td>");
            trainNameCell.text(trainName);

            var destinationCell = $("<td>");
            destinationCell.text(destination);

            var trainFrequencyCell = $("<td>");
            trainFrequencyCell.text(trainFrequency);

            var minutesAwayCell = $("<td>");
            var minutesAway = minutesAwayCalc(firstTrainTime,trainFrequency);
            minutesAwayCell.text(minutesAway);

            var nextArrivalCell = $("<td>");
            var nextArrival = nextArrivalCalc(minutesAway);
            nextArrivalCell.text(nextArrival);

            var tableRow = $("<tr>");
            tableRow.append(trainNameCell);
            tableRow.append(destinationCell);
            tableRow.append(trainFrequencyCell);
            tableRow.append(nextArrivalCell);
            tableRow.append(minutesAwayCell);
            $("#tableBody").append(tableRow);
        });
    };

    // Updates table if train is removed, removal button not yet implemented
    database.ref("/trains/").on("child_removed", function() {
        trainTable();
    });

    // Calculates train minutes away with moment based on first train time and train frequency
    function minutesAwayCalc(firstTrainTime,trainFrequency){
        var currentTime = moment().format("HH:mm");
        trainFrequency = parseInt(trainFrequency);
        var timeDifference = moment(currentTime,"HH:mm").diff(moment(firstTrainTime,"HH:mm"),"minutes");
        if (timeDifference >= 0) {
            var minutesAway = trainFrequency-timeDifference%trainFrequency;
        } else {
            var minutesAway = -1*timeDifference;
        }
        return minutesAway;
    };

    // Calculates next train arrival based on minutes away
    function nextArrivalCalc(minutesAway){
        var currentTime = moment().format("HH:mm");
        var nextArrival = moment(currentTime, "HH:mm").add(minutesAway, "minutes").format("hh:mm A");
        return nextArrival;
    };

    // Takes input for new train entry and pushes to firebase
    $(document).on('click', '#submit', function(event){
        event.preventDefault();

        var trainName = $("#trainNameInput").val();
        var destination = $("#destinationInput").val();
        var firstTrainTime = $("#firstTrainTimeInput").val();
        var trainFrequency = $("#trainFrequencyInput").val();

        // Checks that train time entered is a valid military time
        var d = moment(firstTrainTime,'HH:mm');
        if(d == null || !d.isValid()) {
            var trainTimeCheck = false;
        } else {
            var trainTimeCheck = true;
        };

        // Checks that train frequency input is a valid positive integer
        if (Number.isInteger(parseFloat(trainFrequency)) && parseFloat(trainFrequency)>0) {
            var trainFrequencyCheck = true;
        } else {
            var trainFrequencyCheck = false;
        };

        // Alerts on invalid data entry and doesn't push to firebase
        if (trainTimeCheck === false) {
            alert("Check First Train Time input for proper formatting");
        } else if (trainFrequencyCheck === false) {
            alert("Train Frequency Input is not a valid positive integer");
        } else {
            database.ref("/trains/").push({
                trainName: trainName,
                destination: destination,
                firstTrainTime: firstTrainTime,
                trainFrequency: trainFrequency
            });
            $("#trainNameInput").val("");
            $("#destinationInput").val("");
            $("#firstTrainTimeInput").val("");
            $("#trainFrequencyInput").val("");
        };
    });

    // Refreshes screen every 5 seconds
    // Originally set to a minute but sometimes the table glitches when inputing new train info and lists the train several times
    var refresh = setInterval(trainTable, 5*1000);

    // Calls the initial train table function on page load
    trainTable();
});