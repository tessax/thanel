let entries = [];

// ================= LOGIN =================
function login() {
    let role = document.getElementById("role").value;

    document.getElementById("loginPage").classList.add("hidden");

    if (role === "uc") {
        document.getElementById("ucDashboard").classList.remove("hidden");
    } else {
        document.getElementById("rcDashboard").classList.remove("hidden");
        loadEntries();
    }
}

// ================= UC UPLOAD =================
function submitEntry() {

    let imageFile = document.getElementById("imageUpload").files[0];

    if (!imageFile) {
        alert("Please select an image!");
        return;
    }

    let name = document.getElementById("name").value;
    let dob = document.getElementById("dob").value;
    let unit = document.getElementById("unit").value;
    let college = document.getElementById("college").value;
    let plant = document.getElementById("plant").value;

    if (!name || !dob || !unit || !college || !plant) {
        alert("Please fill all fields!");
        return;
    }

    let formData = new FormData();
    formData.append("image", imageFile);
    formData.append("name", name);
    formData.append("dob", dob);
    formData.append("unit", unit);
    formData.append("college", college);
    formData.append("plant", plant);

    fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert("Upload Successful!");

        // Clear form
        document.getElementById("imageUpload").value = "";
        document.getElementById("name").value = "";
        document.getElementById("dob").value = "";
        document.getElementById("unit").value = "";
        document.getElementById("college").value = "";
        document.getElementById("plant").value = "";
    })
    .catch(error => {
        console.error("Upload error:", error);
        alert("Upload failed. Check backend.");
    });
}

// ================= LOAD ENTRIES =================
function loadEntries() {

    fetch("http://127.0.0.1:5000/get_entries")
    .then(res => res.json())
    .then(data => {

        entries = data;

        let table = document.getElementById("entriesTable");

        table.innerHTML = `
            <tr>
                <th>Name</th>
                <th>College</th>
                <th>Status</th>
                <th>View</th>
                <th>Verify</th>
                <th>Approve</th>
            </tr>
        `;

        entries.forEach((entry, index) => {

            let row = table.insertRow();

            row.insertCell(0).innerText = entry.name;
            row.insertCell(1).innerText = entry.college;
            row.insertCell(2).innerText = entry.status;

            // VIEW BUTTON
            let viewBtn = document.createElement("button");
            viewBtn.innerText = "View";
            viewBtn.onclick = function () {
                window.open("http://127.0.0.1:5000/uploads/" + entry.filename);
            };

            // VERIFY BUTTON
            let verifyBtn = document.createElement("button");
            verifyBtn.innerText = "Verify";
            verifyBtn.onclick = function () {
                verifyEntry(index);
            };

            // APPROVE BUTTON
            let approveBtn = document.createElement("button");
            approveBtn.innerText = "Approve";
            approveBtn.onclick = function () {
                approveEntry(index);
            };

            row.insertCell(3).appendChild(viewBtn);
            row.insertCell(4).appendChild(verifyBtn);
            row.insertCell(5).appendChild(approveBtn);
        });

    })
    .catch(error => {
        console.error("Load error:", error);
    });
}

// ================= VERIFY =================
function verifyEntry(index) {

    let entry = entries[index];

    fetch("http://127.0.0.1:5000/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            filename: entry.filename,
            dob: entry.dob,
            upload_date: entry.uploadDate
        })
    })
    .then(res => res.json())
    .then(data => {

        alert("Verification Result: " + data.result);

        entries[index].status = data.result;
        loadEntries();
    })
    .catch(error => {
        console.error("Verify error:", error);
    });
}

// ================= APPROVE =================
function approveEntry(index) {

    entries[index].status = "Approved";
    generatePoster(entries[index]);
}

// ================= POSTER =================
function generatePoster(entry) {

    document.getElementById("rcDashboard").classList.add("hidden");
    document.getElementById("posterPage").classList.remove("hidden");

    document.getElementById("posterName").innerText = entry.name;
    document.getElementById("posterCollege").innerText = entry.college;
    document.getElementById("posterUnit").innerText = entry.unit;
    document.getElementById("posterPlant").innerText = entry.plant;
    document.getElementById("posterDate").innerText = entry.uploadDate;

    document.getElementById("posterImage").src =
        "http://127.0.0.1:5000/uploads/" + entry.filename;
}