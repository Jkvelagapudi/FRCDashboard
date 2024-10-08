// Define UI elements
let ui = {
    timer: document.getElementById('timer'),
    robotState: document.getElementById('robot-state').firstChild,
    gyro: {
        container: document.getElementById('gyro'),
        val: 0,
        offset: 0,
        visualVal: 0,
        arm: document.getElementById('gyro-arm'),
        number: document.getElementById('gyro-number')
    },
    robotDiagram: {
        arm: document.getElementById('robot-arm')
    },
    // example: {
    //     button: document.getElementById('example-button'),
    //     readout: document.getElementById('example-readout').firstChild
    // },
    autoSelect: document.getElementById('auto-select'),
    armPosition: document.getElementById('arm-position'),
    camera: document.getElementById('camera'),
    camera2: document.getElementById('camera2'),
    m1: document.getElementById('m1'),
    gyro: document.getElementById('gyro')
};
// Set a global alias for the camera and related elements.
ui.camera = {
	viewer: document.getElementById('camera'),
	id: 0,
	srcs: [ // Will default to first camera
        'http://10.57.88.41:1182/?action=stream',
        // 'http://10.57.88.40:1182/?action=stream',
    ]
};

// Unlike most addons, this addon doesn't interact with NetworkTables. Therefore, we won't need to add any NT listeners.

// When camera is clicked on, change to the next source.
// ui.camera.viewer.onclick = function() {
//     ui.camera.id += 1;
// 	if (ui.camera.id === ui.camera.srcs.length) ui.camera.id = 0;
// 	ui.camera.viewer.style.backgroundImage = 'url(' + ui.camera.srcs[ui.camera.id] + ')';
// };

ui.camera2 = {
    viewer: document.getElementById('camera2'),
    id: 0,
    srcs: [
        'http://10.57.88.40:1182/?action=stream',
        'http://10.57.88.41:1182/?action=stream',
    ]
};

ui.camera2.viewer.onclick = function() {
    ui.camera2.id += 1;
    if (ui.camera2.id === ui.camera2.srcs.length) ui.camera2.id = 0;
    ui.camera2.viewer.style.backgroundImage = 'url(' + ui.camera2.srcs[ui.camera2.id] + ')';
}

// Key Listeners

// Gyro rotation
let updateGyro = (key, value) => {
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }
    ui.gyro.arm.style.transform = `rotate(${ui.gyro.visualVal}deg)`;
    ui.gyro.number.textContent = ui.gyro.visualVal + 'º';
};
NetworkTables.addKeyListener('/SmartDashboard/drive/navx/yaw', updateGyro);

// The following case is an example, for a robot with an arm at the front.
NetworkTables.addKeyListener('/SmartDashboard/arm/encoder', (key, value) => {
    // 0 is all the way back, 1200 is 45 degrees forward. We don't want it going past that.
    if (value > 1140) {
        value = 1140;
    }
    else if (value < 0) {
        value = 0;
    }
    // Calculate visual rotation of arm
    var armAngle = value * 3 / 20 - 45;
    // Rotate the arm in diagram to match real arm
    ui.robotDiagram.arm.style.transform = `rotate(${armAngle}deg)`;
});

// // This button is just an example of triggering an event on the robot by clicking a button.
// NetworkTables.addKeyListener('/SmartDashboard/example_variable', (key, value) => {
//     // Set class active if value is true and unset it if it is false
//     ui.example.button.classList.toggle('active', value);
//     ui.example.readout.data = 'Value is ' + value;
// });

// NetworkTables.addKeyListener('/Shuffleboard/Teleoperated/Total Current', (key, value) => {
//     // Set class active if value is true and unset it if it is false
//     // ui.example.button.classList.toggle('active', value);
//     ui.example.readout.data = 'Value is ' + value;
// });

NetworkTables.addKeyListener('/robot/time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.
    ui.timer.textContent = value < 0 ? '0:00' : Math.floor(value / 60) + ':' + (value % 60 < 10 ? '0' : '') + value % 60;
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/modes', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    // Make an option for each autonomous mode and put it in the selector
    for (let i = 0; i < value.length; i++) {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(value[i]));
        ui.autoSelect.appendChild(option);
    }
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/currentlySelectedMode');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/selected', (key, value) => {
    ui.autoSelect.value = value;
});

NetworkTables.addKeyListener('/SmartDashboard/autonomous/selected', (key, value) => {
    ui.autoSelect.value = value;
});

NetworkTables.addKeyListener('/Shuffleboard/Teleoperated/navX-Sensor[1]/Value', (key, value) => {
    ui.m1.textContent = value;
    console.log(value);
});

NetworkTables.addKeyListener('/SmartDashboard/Teleoperated/Gyro', (key, value) => {
    ui.gyro.value = value;
});

// The rest of the doc is listeners for UI elements being clicked on
ui.example.button.onclick = function() {
    // Set NetworkTables values to the opposite of whether button has active class.
    NetworkTables.putValue('/SmartDashboard/example_variable', this.className != 'active');
};
// Reset gyro value to 0 on click
ui.gyro.container.onclick = function() {
    // Store previous gyro val, will now be subtracted from val for callibration
    ui.gyro.offset = ui.gyro.val;
    // Trigger the gyro to recalculate value.
    updateGyro('/SmartDashboard/drive/navx/yaw', ui.gyro.val);
};
// Update NetworkTables when autonomous selector is changed
ui.autoSelect.onchange = function() {
    NetworkTables.putValue('/SmartDashboard/autonomous/selected', this.value);
};
// Get value of arm height slider when it's adjusted
ui.armPosition.oninput = function() {
    NetworkTables.putValue('/SmartDashboard/arm/encoder', parseInt(this.value));
};

addEventListener('error', (ev) => {
    window.api.sendWindowError({
		mesg: ev.message,
		file: ev.filename,
		lineNumber: ev.lineno
	});
});



