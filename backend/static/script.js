/* ============================================================
   THANEL — script.js
   All original features preserved · UX improvements added
   ============================================================ */

let entries = [];

/* ════════ ROLE TABS ════════ */
function selectRole(role) {
    // Update hidden select (keeps login() logic working unchanged)
    document.getElementById("role").value = role;

    // Update tab active state
    document.querySelectorAll(".role-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.role === role);
    });
}

/* ════════ PAGE NAVIGATION ════════ */
function showPage(page) {
    ["loginPage","ucDashboard","rcDashboard","posterPage"].forEach(p => {
        const el = document.getElementById(p);
        if (el) el.classList.add("hidden");
    });
    const target = document.getElementById(page);
    if (target) {
        target.classList.remove("hidden");
        // Re-trigger entry animation
        target.style.animation = "none";
        target.offsetHeight;
        target.style.animation = "";
    }
    window.location.hash = page;
}

/* ════════ LOGIN ════════ */
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role     = document.getElementById("role").value;

    const btn = document.querySelector(".btn-primary.btn-full");
    if (btn) { btn.querySelector("span").textContent = "Signing in…"; btn.disabled = true; }

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            if (role === "uc") {
                showPage("ucDashboard");
            } else {
                showPage("rcDashboard");
                loadEntries();
            }
        } else {
            alert("Invalid username or password.");
            if (btn) { btn.querySelector("span").textContent = "Sign In"; btn.disabled = false; }
        }
    })
    .catch(() => {
        alert("Connection error. Please try again.");
        if (btn) { btn.querySelector("span").textContent = "Sign In"; btn.disabled = false; }
    });
}

/* ════════ UC SUBMIT ════════ */
function submitEntry() {
    const form = document.getElementById("uploadForm");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const imageFile = document.getElementById("imageUpload").files[0];
    if (!imageFile) { alert("Please select an image."); return; }

    const formData = new FormData();
    formData.append("image",   imageFile);
    formData.append("name",    document.getElementById("name").value);
    formData.append("dob",     document.getElementById("dob").value);
    formData.append("unit",    document.getElementById("unit").value);
    formData.append("college", document.getElementById("college").value);
    formData.append("plant",   document.getElementById("plant").value);

    const btn = document.querySelector("#ucDashboard .btn-primary");
    if (btn) { btn.querySelector("span").textContent = "Uploading…"; btn.disabled = true; }

    fetch("/upload", { method: "POST", body: formData })
    .then(res => res.json())
    .then(() => {
        showToast("Upload successful! 🌱");
        setTimeout(() => location.reload(), 1500);
    })
    .catch(() => {
        alert("Upload failed. Please try again.");
        if (btn) { btn.querySelector("span").textContent = "Submit Entry"; btn.disabled = false; }
    });
}

/* ════════ STATS COUNT-UP ANIMATION ════════ */
function countUp(elId, target, duration = 700) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.round(start + range * ease);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function updateStats(data) {
    const total    = data.length;
    const approved = data.filter(e => e.status === "Approved").length;
    const verified = data.filter(e => e.status === "Verified").length;
    const pending  = data.filter(e => e.status !== "Approved" && e.status !== "Verified").length;
    countUp("statTotal",    total);
    countUp("statApproved", approved);
    countUp("statVerified", verified);
    countUp("statPending",  pending);
}

/* ════════ LOAD RC TABLE ════════ */
function loadEntries() {
    fetch("/get_entries")
    .then(res => res.json())
    .then(data => {
        entries = data;
        updateStats(data);
        const table = document.getElementById("entriesTable");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>College</th>
                    <th>Status</th>
                    <th>View</th>
                    <th>Verify</th>
                    <th>Approve</th>
                    <th>Remove</th>
                </tr>
            </thead>
            <tbody id="entriesBody"></tbody>
        `;

        const tbody = document.getElementById("entriesBody");

        if (!entries.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--clr-text-soft);font-style:italic;">No entries found.</td></tr>`;
            return;
        }

        entries.forEach(entry => {
            const row = tbody.insertRow();

            // Name & College
            row.insertCell(0).innerText = entry.name;
            row.insertCell(1).innerText = entry.college;

            // Status pill
            const statusCell = row.insertCell(2);
            const statusClass =
                entry.status === "Approved" ? "status-approved" :
                entry.status === "Verified" ? "status-verified"  : "status-pending";
            statusCell.innerHTML = `<span class="status-pill ${statusClass}">${entry.status}</span>`;

            // Buttons
            function makeBtn(label, cls, handler) {
                const b = document.createElement("button");
                b.textContent = label;
                if (cls) b.classList.add(cls);
                b.onclick = handler;
                return b;
            }

            row.insertCell(3).appendChild(makeBtn("View",    null,         () => window.open("/uploads/" + entry.filename)));
            row.insertCell(4).appendChild(makeBtn("Verify",  null,         () => verifyEntry(entry.filename)));
            row.insertCell(5).appendChild(makeBtn("Approve", null,         () => approveEntry(entry)));
            row.insertCell(6).appendChild(makeBtn("Remove",  "btn-remove", () => removeEntry(entry.filename)));
        });
    });
}

/* ════════ AI VERIFY ════════ */
function verifyEntry(filename) {
    fetch("/verify/" + filename, { method: "POST" })
    .then(res => res.json())
    .then(data => {
        alert("AI Result: " + data.result);
        loadEntries();
    });
}

/* ════════ APPROVE ════════ */
function approveEntry(entry) {
    fetch("/approve/" + entry.filename, { method: "POST" })
    .then(() => generatePoster(entry));
}

/* ════════ POSTER GENERATION ════════ */
function generatePoster(entry) {
    showPage("posterPage");

    const canvas      = document.getElementById("posterCanvas");
    const ctx         = canvas.getContext("2d");
    const placeholder = document.getElementById("placeholderText");

    const templateImg = new Image();
    templateImg.src   = "/static/template.jpg";

    templateImg.onload = function () {
        canvas.width  = templateImg.width;
        canvas.height = templateImg.height;
        ctx.drawImage(templateImg, 0, 0);

        const userPhoto = new Image();
        userPhoto.src   = "/uploads/" + entry.filename;

        userPhoto.onload = function () {
            ctx.drawImage(
                userPhoto,
                canvas.width  * 0.2427,
                canvas.height * 0.340,
                canvas.width  * 0.2349,
                canvas.height * 0.331
            );

            ctx.fillStyle = "#000";
            ctx.font      = "600 32px Arial";
            ctx.fillText(entry.name,  canvas.width * 0.62, canvas.height * 0.428);
            ctx.fillText(entry.unit,  canvas.width * 0.6,  canvas.height * 0.471);
            ctx.fillText(entry.dob,   canvas.width * 0.6,  canvas.height * 0.5125);

            if (placeholder) placeholder.style.display = "none";

            document.getElementById("captionText").value =
`Name: ${entry.name}
Unit no: ${entry.unit}
College name: ${entry.college}
DOB: ${entry.dob}

#birthdaytreeplantingchallenge
#nrpfgreenkerala
#nss2026
#nss
#birthdaychallenge
@apjaktu_nss_cell @nrpf__ktu`;
        };
    };
}

/* ════════ DOWNLOAD POSTER ════════ */
function downloadPoster() {
    const canvas = document.getElementById("posterCanvas");
    const link   = document.createElement("a");
    link.download = `thanel-poster-${Date.now()}.png`;
    link.href     = canvas.toDataURL("image/png");
    link.click();
}

/* ════════ COPY CAPTION ════════ */
function copyCaption() {
    const caption = document.getElementById("captionText");
    if (navigator.clipboard) {
        navigator.clipboard.writeText(caption.value)
        .then(() => showToast("Caption copied to clipboard!"));
    } else {
        caption.select();
        caption.setSelectionRange(0, 99999);
        document.execCommand("copy");
        showToast("Caption copied to clipboard!");
    }
}

/* ════════ REMOVE ENTRY ════════ */
function removeEntry(filename) {
    if (!confirm("Remove this entry? This cannot be undone.")) return;
    fetch("/remove/" + filename, { method: "POST" }).then(() => loadEntries());
}

/* ════════ TOAST ════════ */
function showToast(msg) {
    let t = document.getElementById("__toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "__toast";
        Object.assign(t.style, {
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%) translateY(80px)",
            background: "#14532d",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: "600",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            zIndex: "9999",
            opacity: "0",
            transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.24s ease",
            pointerEvents: "none",
            whiteSpace: "nowrap"
        });
        document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => {
        t.style.transform = "translateX(-50%) translateY(0)";
        t.style.opacity   = "1";
    });
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
        t.style.transform = "translateX(-50%) translateY(80px)";
        t.style.opacity   = "0";
    }, 2800);
}

/* ════════ UPLOAD ZONE DRAG & DROP ════════ */
function initUploadZone() {
    const zone  = document.getElementById("uploadZone");
    const input = document.getElementById("imageUpload");
    if (!zone || !input) return;

    zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", ()  => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", e => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            updateUploadLabel(file.name);
        }
    });
    input.addEventListener("change", () => {
        if (input.files[0]) updateUploadLabel(input.files[0].name);
    });
}

function updateUploadLabel(name) {
    const t = document.querySelector(".upload-title");
    if (t) t.textContent = "📎 " + name;
}

/* ════════ ROUTING ════════ */
window.onload = function () {
    initUploadZone();
    const page = window.location.hash.replace("#", "");
    if (page) {
        showPage(page);
        if (page === "rcDashboard") loadEntries();
    } else {
        showPage("loginPage");
    }

    window.onhashchange = function () {
        const p = window.location.hash.replace("#", "");
        if (p) {
            showPage(p);
            if (p === "rcDashboard") loadEntries();
        }
    };
};