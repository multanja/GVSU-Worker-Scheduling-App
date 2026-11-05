"use strict";

// GVSU Worker Scheduling App
// CIS 350 - Introduction to Software Engineering
// Release 1 Prototype

const STORAGE_KEY = "gvsu_worker_scheduling_v1";
const DEMO_EMPLOYEE = "Student Employee";

let currentRole = null;

// Load saved data or initialize the application.
function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);

            if (
                parsed &&
                Array.isArray(parsed.schedules) &&
                Array.isArray(parsed.availability) &&
                Array.isArray(parsed.requests)
            ) {
                return parsed;
            }
        } catch (error) {
            console.error("Unable to load saved data:", error);
        }
    }

    return {
        schedules: [],
        availability: [],
        requests: []
    };
}

let appData = loadData();

// Save application data.
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// Generate a unique identifier.
function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
}

// Format a date without timezone conversion.
function formatDate(dateString) {
    if (!dateString) return "";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

// Format a 24-hour time.
function formatTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":").map(Number);

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Prevent user-entered text from being interpreted as HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

// Create a card for displaying information.
function createCard(content) {
    return `<div class="card">${content}</div>`;
}

// LOGIN AND LOGOUT

function login(role) {
    if (role !== "employee" && role !== "manager") {
        return;
    }

    currentRole = role;

    document.getElementById("login-section").style.display = "none";

    document.getElementById("employee-dashboard").style.display =
        role === "employee" ? "block" : "none";

    document.getElementById("manager-dashboard").style.display =
        role === "manager" ? "block" : "none";

    renderAll();
}

function logout() {
    currentRole = null;

    document.getElementById("login-section").style.display = "block";
    document.getElementById("employee-dashboard").style.display = "none";
    document.getElementById("manager-dashboard").style.display = "none";
}

// EMPLOYEE SCHEDULE

function renderEmployeeSchedule() {
    const container = document.getElementById("employee-schedule");

    const shifts = appData.schedules
        .filter(shift => shift.employee === DEMO_EMPLOYEE)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (shifts.length === 0) {
        container.innerHTML = "<p>No shifts have been assigned yet.</p>";
        return;
    }

    container.innerHTML = shifts.map(shift => createCard(`
        <p><strong>Date:</strong> ${formatDate(shift.date)}</p>
        <p><strong>Time:</strong>
            ${formatTime(shift.start)} - ${formatTime(shift.end)}
        </p>
    `)).join("");
}

// MANAGER SCHEDULE

function renderManagerSchedule() {
    const container = document.getElementById("manager-schedule");

    const shifts = [...appData.schedules]
        .sort((a, b) => a.date.localeCompare(b.date));

    if (shifts.length === 0) {
        container.innerHTML = "<p>No employee shifts have been created.</p>";
        return;
    }

    container.innerHTML = shifts.map(shift => createCard(`
        <p><strong>Employee:</strong> ${escapeHTML(shift.employee)}</p>
        <p><strong>Date:</strong> ${formatDate(shift.date)}</p>
        <p><strong>Time:</strong>
            ${formatTime(shift.start)} - ${formatTime(shift.end)}
        </p>
    `)).join("");
}

// EMPLOYEE AVAILABILITY

function renderManagerAvailability() {
    const container = document.getElementById("manager-availability");

    if (appData.availability.length === 0) {
        container.innerHTML = "<p>No availability has been submitted.</p>";
        return;
    }

    container.innerHTML = appData.availability.map(item => createCard(`
        <p><strong>Employee:</strong> ${escapeHTML(item.employee)}</p>
        <p><strong>Date:</strong> ${formatDate(item.date)}</p>
        <p><strong>Available From:</strong> ${formatTime(item.time)}</p>
    `)).join("");
}

// EMPLOYEE REQUESTS

function renderEmployeeRequests() {
    const container = document.getElementById("employee-requests");

    const requests = appData.requests.filter(
        request => request.employee === DEMO_EMPLOYEE
    );

    if (requests.length === 0) {
        container.innerHTML = "<p>You have not submitted any requests.</p>";
        return;
    }

    container.innerHTML = requests.map(request => createCard(`
        <p><strong>Type:</strong> ${escapeHTML(request.type)}</p>
        <p><strong>Date:</strong> ${formatDate(request.date)}</p>
        <p><strong>Reason:</strong> ${escapeHTML(request.reason)}</p>
        <p>
            <strong>Status:</strong>
            <span class="status ${request.status.toLowerCase()}">
                ${escapeHTML(request.status)}
            </span>
        </p>
    `)).join("");
}

// MANAGER REQUESTS

function renderManagerRequests() {
    const container = document.getElementById("manager-requests");

    if (appData.requests.length === 0) {
        container.innerHTML = "<p>No employee requests have been submitted.</p>";
        return;
    }

    container.innerHTML = "";

    appData.requests.forEach(request => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <p><strong>Employee:</strong> ${escapeHTML(request.employee)}</p>
            <p><strong>Type:</strong> ${escapeHTML(request.type)}</p>
            <p><strong>Date:</strong> ${formatDate(request.date)}</p>
            <p><strong>Reason:</strong> ${escapeHTML(request.reason)}</p>
            <p>
                <strong>Status:</strong>
                <span class="status ${request.status.toLowerCase()}">
                    ${escapeHTML(request.status)}
                </span>
            </p>
        `;

        if (request.status === "Pending") {
            const approveButton = document.createElement("button");
            approveButton.textContent = "Approve";
            approveButton.className = "approve-btn";

            approveButton.addEventListener("click", () => {
                updateRequestStatus(request.id, "Approved");
            });

            const denyButton = document.createElement("button");
            denyButton.textContent = "Deny";
            denyButton.className = "deny-btn";

            denyButton.addEventListener("click", () => {
                updateRequestStatus(request.id, "Denied");
            });

            card.appendChild(approveButton);
            card.appendChild(denyButton);
        }

        container.appendChild(card);
    });
}

// APPROVE OR DENY REQUESTS

function updateRequestStatus(requestId, status) {
    if (currentRole !== "manager") {
        return;
    }

    const request = appData.requests.find(
        item => item.id === requestId
    );

    if (!request || request.status !== "Pending") {
        return;
    }

    if (status !== "Approved" && status !== "Denied") {
        return;
    }

    request.status = status;

    saveData();
    renderAll();
}

// UPDATE ALL DASHBOARDS

function renderAll() {
    renderEmployeeSchedule();
    renderManagerSchedule();
    renderManagerAvailability();
    renderEmployeeRequests();
    renderManagerRequests();
}

// FORM SUBMISSIONS

document.getElementById("availability-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (currentRole !== "employee") return;

        const date = document.getElementById("available-date").value;
        const time = document.getElementById("available-time").value;

        if (!date || !time) return;

        appData.availability.push({
            id: generateId(),
            employee: DEMO_EMPLOYEE,
            date: date,
            time: time
        });

        saveData();
        renderAll();

        this.reset();
        alert("Availability submitted successfully!");
    });

document.getElementById("timeoff-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (currentRole !== "employee") return;

        const date = document.getElementById("timeoff-date").value;
        const reason = document.getElementById("timeoff-reason").value.trim();

        if (!date || !reason) return;

        appData.requests.push({
            id: generateId(),
            employee: DEMO_EMPLOYEE,
            type: "Time Off",
            date: date,
            reason: reason,
            status: "Pending"
        });

        saveData();
        renderAll();

        this.reset();
        alert("Time-off request submitted!");
    });

document.getElementById("shiftchange-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (currentRole !== "employee") return;

        const date = document.getElementById("shift-date").value;
        const reason = document.getElementById("shift-reason").value.trim();

        if (!date || !reason) return;

        appData.requests.push({
            id: generateId(),
            employee: DEMO_EMPLOYEE,
            type: "Shift Change",
            date: date,
            reason: reason,
            status: "Pending"
        });

        saveData();
        renderAll();

        this.reset();
        alert("Shift-change request submitted!");
    });

document.getElementById("schedule-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (currentRole !== "manager") return;

        const employee = document.getElementById("employee-name").value.trim();
        const date = document.getElementById("schedule-date").value;
        const start = document.getElementById("start-time").value;
        const end = document.getElementById("end-time").value;

        if (!employee || !date || !start || !end) {
            return;
        }

        if (end <= start) {
            alert("The shift end time must be after the start time.");
            return;
        }

        appData.schedules.push({
            id: generateId(),
            employee: employee,
            date: date,
            start: start,
            end: end
        });

        saveData();
        renderAll();

        this.reset();
        alert("Employee shift created successfully!");
    });

// Initialize the application.
renderAll();