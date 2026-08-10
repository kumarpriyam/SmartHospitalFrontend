// ============================================================
// SMART HOSPITAL SYSTEM
// FRONTEND JAVASCRIPT
// ============================================================

const API_BASE = "https://smarthospitalapi.onrender.com/api";

let currentSection = "dashboard";

let patients = [];
let doctors = [];

let waitingTimer = null;


// ============================================================
// API FETCH
// ============================================================

async function apiFetch(endpoint, options = {}) {

    try {

        const response = await fetch(
            API_BASE + endpoint,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                ...options
            }
        );


        if (!response.ok) {

            let errorMessage = "Request failed";

            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.message ||
                    errorData.detail ||
                    errorData.title ||
                    errorMessage;

            } catch (_) {}

            throw new Error(errorMessage);

        }


        return await response.json();

    }

    catch (error) {

        console.error("API Error:", error);

        if (error.name === "TypeError") {

            throw new Error(
                "Unable to connect to Smart Hospital API. Make sure ASP.NET API is running."
            );

        }

        throw error;

    }

}


// ============================================================
// SECTION NAVIGATION
// ============================================================

function showSection(sectionName) {

    document.querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    const section =
        document.getElementById(sectionName);


    if (section) {

        section.classList.add(
            "active-section"
        );

    }


    document.querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

        });


    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(item => {

        if (
            item.getAttribute("onclick") &&
            item.getAttribute("onclick")
                .includes(`'${sectionName}'`)
        ) {

            item.classList.add("active");

        }

    });


    currentSection = sectionName;


    const titles = {

        dashboard: [
            "Hospital Dashboard",
            "Real-time hospital management overview"
        ],

        patients: [
            "Patient Management",
            "Register, edit and manage patients"
        ],

        queue: [
            "Live Patient Queue",
            "Real-time waiting queue"
        ],

        doctors: [
            "Doctor Management",
            "Add, edit and manage doctors"
        ],

        appointments: [
            "Appointments",
            "Manage consultation appointments"
        ],

        reports: [
            "Hospital Reports",
            "Daily hospital statistics"
        ]

    };


    if (titles[sectionName]) {

        document.getElementById(
            "pageTitle"
        ).textContent =
            titles[sectionName][0];


        document.getElementById(
            "pageSubtitle"
        ).textContent =
            titles[sectionName][1];

    }


    refreshCurrentSection();

}


// ============================================================
// REFRESH CURRENT SECTION
// ============================================================

function refreshCurrentSection() {

    if (currentSection === "dashboard") {

        loadDashboard();

    }

    else if (currentSection === "patients") {

        loadPatients();

    }

    else if (currentSection === "queue") {

        loadQueue();

    }

    else if (currentSection === "doctors") {

        loadDoctors();

    }

    else if (currentSection === "appointments") {

        loadAppointments();

    }

    else if (currentSection === "reports") {

        loadDailyReport();

    }

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        const data =
            await apiFetch("/dashboard");


        if (!data || !data.success) {

            return;

        }


        document.getElementById(
            "totalPatients"
        ).textContent =
            data.patients?.total ?? 0;


        document.getElementById(
            "waitingPatients"
        ).textContent =
            data.patients?.waiting ?? 0;


        document.getElementById(
            "availableDoctors"
        ).textContent =
            data.doctors?.available ?? 0;


        document.getElementById(
            "busyDoctors"
        ).textContent =
            data.doctors?.busy ?? 0;


        await loadQueue();

        await loadDoctors();

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// ============================================================
// PATIENTS
// ============================================================

async function loadPatients() {

    const tbody =
        document.getElementById(
            "patientsTableBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="loading">
                Loading patients...
            </td>
        </tr>
    `;


    try {

        const data =
            await apiFetch("/patients");


        patients =
            data.patients || [];


        renderPatients();

    }

    catch (error) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="empty-state">

                    ${escapeHtml(error.message)}

                </td>
            </tr>
        `;

    }

}


// ============================================================
// RENDER PATIENTS
// ============================================================

function renderPatients() {

    const tbody =
        document.getElementById(
            "patientsTableBody"
        );


    if (!tbody) {

        return;

    }


    if (!patients.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="empty-state">

                    No patients registered.

                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        patients.map(patient => {

            const statusClass =
                getStatusClass(
                    patient.status
                );


            const waiting =
                calculateWaitingTime(
                    patient
                );


            return `

                <tr>

                    <td>
                        <strong>
                            #${patient.token}
                        </strong>
                    </td>


                    <td>
                        <strong>
                            ${escapeHtml(
                                patient.name
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHtml(
                            patient.mobile || "-"
                        )}
                    </td>


                    <td>
                        ${patient.age ?? "-"}
                    </td>


                    <td>
                        ${escapeHtml(
                            patient.gender || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            patient.type || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            patient.department || "-"
                        )}
                    </td>


                    <td>

                        <span class="status-badge ${statusClass}">

                            ${escapeHtml(
                                patient.status ||
                                "WAITING"
                            )}

                        </span>

                    </td>


                    <td>

                        <span
                            class="waiting-time"
                            id="waiting-${patient.token}">

                            ${waiting}

                        </span>

                    </td>


                    <td>

                        <div class="action-buttons">

                            <button
                                class="edit-btn"
                                onclick="editPatient(${patient.token})">

                                Edit

                            </button>


                            <button
                                class="secondary-btn"
                                onclick="showPatientPrint(${patient.token})">

                                🖨️

                            </button>


                            <button
                                class="danger-btn"
                                onclick="deletePatient(${patient.token})">

                                Delete

                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================================
// PATIENT MODAL
// ============================================================

function openPatientModal() {

    const title =
        document.getElementById(
            "patientModalTitle"
        );


    const submitButton =
        document.getElementById(
            "patientSubmitButton"
        );


    const editingToken =
        document.getElementById(
            "editingPatientToken"
        );


    const form =
        document.getElementById(
            "patientForm"
        );


    if (title) {

        title.textContent =
            "Register New Patient";

    }


    if (submitButton) {

        submitButton.textContent =
            "Register Patient";

    }


    if (editingToken) {

        editingToken.value = "";

    }


    if (form) {

        form.reset();

    }


    clearMessage(
        "patientMessage"
    );


    const modal =
        document.getElementById(
            "patientModal"
        );


    if (modal) {

        modal.classList.add("show");

    }

}


function closePatientModal() {

    const modal =
        document.getElementById(
            "patientModal"
        );


    if (modal) {

        modal.classList.remove("show");

    }

}


// ============================================================
// EDIT PATIENT
// ============================================================

async function editPatient(token) {

    try {

        const data =
            await apiFetch(
                `/patients/${token}`
            );


        const patient =
            data.patient;


        if (!patient) {

            throw new Error(
                "Patient not found."
            );

        }


        setText(
            "patientModalTitle",
            `Edit Patient #${token}`
        );


        setText(
            "patientSubmitButton",
            "Update Patient"
        );


        setValue(
            "editingPatientToken",
            token
        );


        setValue(
            "patientName",
            patient.name
        );


        setValue(
            "patientMobile",
            patient.mobile
        );


        setValue(
            "patientAge",
            patient.age
        );


        setValue(
            "patientGender",
            patient.gender
        );


        setValue(
            "patientLocation",
            patient.location
        );


        setValue(
            "patientType",
            patient.type || "Normal"
        );


        setValue(
            "patientDepartment",
            patient.department ||
            "General Medicine"
        );


        clearMessage(
            "patientMessage"
        );


        const modal =
            document.getElementById(
                "patientModal"
            );


        if (modal) {

            modal.classList.add("show");

        }

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// PATIENT FORM
// ============================================================

const patientForm =
    document.getElementById(
        "patientForm"
    );


if (patientForm) {

    patientForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const editingToken =
                getValue(
                    "editingPatientToken"
                );


            const name =
                getValue(
                    "patientName"
                ).trim();


            const mobile =
                getValue(
                    "patientMobile"
                ).trim();


            const age =
                Number(
                    getValue(
                        "patientAge"
                    )
                );


            const gender =
                getValue(
                    "patientGender"
                );


            const location =
                getValue(
                    "patientLocation"
                ).trim();


            const type =
                getValue(
                    "patientType"
                );


            const department =
                getValue(
                    "patientDepartment"
                );


            if (
                mobile &&
                !/^[0-9]{10}$/.test(mobile)
            ) {

                showMessage(
                    "patientMessage",
                    "Please enter a valid 10 digit mobile number.",
                    "error"
                );

                return;

            }


            const body = {

                name,
                mobile,
                gender,
                age,
                location,
                type,
                department

            };


            try {

                let data;


                if (editingToken) {

                    data =
                        await apiFetch(
                            `/patients/${editingToken}`,
                            {
                                method: "PUT",
                                body: JSON.stringify(body)
                            }
                        );

                }

                else {

                    data =
                        await apiFetch(
                            "/patients",
                            {
                                method: "POST",
                                body: JSON.stringify(body)
                            }
                        );

                }


                showMessage(
                    "patientMessage",
                    data.message ||
                    "Patient saved successfully.",
                    "success"
                );


                setTimeout(() => {

                    closePatientModal();

                    loadPatients();

                    loadDashboard();

                }, 700);

            }

            catch (error) {

                showMessage(
                    "patientMessage",
                    error.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// DELETE PATIENT
// ============================================================

async function deletePatient(token) {

    const patient =
        patients.find(
            p => p.token === token
        );


    if (!patient) {

        return;

    }


    const confirmed =
        confirm(
            `Delete patient ${patient.name} (#${token})?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const data =
            await apiFetch(
                `/patients/${token}`,
                {
                    method: "DELETE"
                }
            );


        alert(
            data.message ||
            "Patient deleted successfully."
        );


        loadPatients();

        loadDashboard();

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// PATIENT PRINT
// ============================================================

async function showPatientPrint(token) {

    try {

        const data =
            await apiFetch(
                `/patients/${token}`
            );


        const patient =
            data.patient;


        if (!patient) {

            throw new Error(
                "Patient not found."
            );

        }


        const waiting =
            calculateWaitingTime(
                patient
            );


        const container =
            document.getElementById(
                "patientPrintContent"
            );


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div class="patient-slip">

                <div class="slip-header">

                    <h1>
                        🏥 Smart Hospital
                    </h1>

                    <p>
                        Patient Consultation Registration Slip
                    </p>

                </div>


                <div class="slip-token">

                    <p>
                        Patient Token
                    </p>

                    <strong>
                        #${patient.token}
                    </strong>

                </div>


                <table class="slip-table">

                    <tr>
                        <td><strong>Patient Name</strong></td>
                        <td>${escapeHtml(patient.name)}</td>
                    </tr>

                    <tr>
                        <td><strong>Mobile Number</strong></td>
                        <td>${escapeHtml(patient.mobile || "-")}</td>
                    </tr>

                    <tr>
                        <td><strong>Age</strong></td>
                        <td>${patient.age ?? "-"}</td>
                    </tr>

                    <tr>
                        <td><strong>Gender</strong></td>
                        <td>${escapeHtml(patient.gender || "-")}</td>
                    </tr>

                    <tr>
                        <td><strong>Location</strong></td>
                        <td>${escapeHtml(patient.location || "-")}</td>
                    </tr>

                    <tr>
                        <td><strong>Patient Type</strong></td>
                        <td>${escapeHtml(patient.type || "-")}</td>
                    </tr>

                    <tr>
                        <td><strong>Department</strong></td>
                        <td>${escapeHtml(patient.department || "-")}</td>
                    </tr>

                    <tr>
                        <td><strong>Status</strong></td>
                        <td>${escapeHtml(patient.status || "WAITING")}</td>
                    </tr>

                    <tr>
                        <td><strong>Estimated Waiting Time</strong></td>
                        <td>${waiting}</td>
                    </tr>

                    <tr>
                        <td><strong>Appointment Date</strong></td>
                        <td>
                            ${escapeHtml(
                                patient.appointmentDate ||
                                "Not scheduled"
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td><strong>Appointment Time</strong></td>
                        <td>
                            ${escapeHtml(
                                patient.appointmentTime ||
                                "Not scheduled"
                            )}
                        </td>
                    </tr>

                </table>


                <div class="slip-notice">

                    <strong>
                        Important Instructions
                    </strong>

                    <br><br>

                    Please carry this slip with you
                    when visiting the hospital.

                    <br><br>

                    Consultation booking confirmation,
                    appointment timing and waiting-time
                    updates will be sent to the registered
                    mobile number.

                </div>


                <div class="slip-footer">

                    Smart Hospital Management System

                    <br>

                    This is a computer generated slip.

                </div>

            </div>

        `;


        const modal =
            document.getElementById(
                "patientPrintModal"
            );


        if (modal) {

            modal.classList.add("show");

        }

    }

    catch (error) {

        alert(error.message);

    }

}


function closePatientPrintModal() {

    const modal =
        document.getElementById(
            "patientPrintModal"
        );


    if (modal) {

        modal.classList.remove("show");

    }

}


function printPatientDetails() {

    window.print();

}


// ============================================================
// QUEUE
// ============================================================

async function loadQueue() {

    try {

        const data =
            await apiFetch("/queue");


        const queue =
            data.queue ||
            data.patients ||
            [];


        renderQueue(queue);

    }

    catch (error) {

        console.error(
            "Queue Error:",
            error
        );


        const queueContainer =
            document.getElementById(
                "queueContainer"
            );


        const fullQueueContainer =
            document.getElementById(
                "fullQueueContainer"
            );


        if (queueContainer) {

            queueContainer.innerHTML = `
                <div class="empty-state">
                    ${escapeHtml(error.message)}
                </div>
            `;

        }


        if (fullQueueContainer) {

            fullQueueContainer.innerHTML = `
                <div class="empty-state">
                    ${escapeHtml(error.message)}
                </div>
            `;

        }

    }

}


// ============================================================
// RENDER QUEUE
// ============================================================

function renderQueue(queue) {

    const html =
        queue.length

        ?

        queue.map(
            (patient, index) => {

                const waiting =
                    calculateWaitingTime(
                        patient
                    );


                return `

                    <div class="queue-item">

                        <div class="queue-left">

                            <span class="token-badge">

                                #${patient.token}

                            </span>


                            <div>

                                <strong>

                                    ${escapeHtml(
                                        patient.name
                                    )}

                                </strong>

                                <br>

                                <small>

                                    ${escapeHtml(
                                        patient.department || ""
                                    )}

                                </small>

                            </div>

                        </div>


                        <div>

                            <div class="waiting-time">

                                ${waiting}

                            </div>


                            <small>

                                Queue #${index + 1}

                            </small>

                        </div>

                    </div>

                `;

            }
        ).join("")

        :

        `
            <div class="empty-state">

                No patient waiting.

            </div>
        `;


    const queueContainer =
        document.getElementById(
            "queueContainer"
        );


    const fullQueueContainer =
        document.getElementById(
            "fullQueueContainer"
        );


    if (queueContainer) {

        queueContainer.innerHTML =
            html;

    }


    if (fullQueueContainer) {

        fullQueueContainer.innerHTML =
            html;

    }

}


// ============================================================
// CALL NEXT PATIENT
// ============================================================

async function callNextPatient() {

    const confirmed =
        confirm(
            "Call the next patient?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const data =
            await apiFetch(
                "/queue/call-next",
                {
                    method: "POST"
                }
            );


        alert(
            data.message ||
            "Next patient called."
        );


        await loadDashboard();

        await loadPatients();

        await loadQueue();

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// DOCTORS
// ============================================================

async function loadDoctors() {

    const container =
        document.getElementById(
            "fullDoctorContainer"
        );


    try {

        const data =
            await apiFetch(
                "/doctors"
            );


        doctors =
            data.doctors || [];


        renderDoctors();

        renderDashboardDoctors();

    }

    catch (error) {

        if (container) {

            container.innerHTML = `
                <div class="empty-state">

                    ${escapeHtml(
                        error.message
                    )}

                </div>
            `;

        }

    }

}


// ============================================================
// RENDER DOCTORS
// ============================================================

function renderDoctors() {

    const container =
        document.getElementById(
            "fullDoctorContainer"
        );


    if (!container) {

        return;

    }


    if (!doctors.length) {

        container.innerHTML = `
            <div class="empty-state">

                No doctors available.

            </div>
        `;

        return;

    }


    container.innerHTML =
        doctors.map(
            doctor => {

                const available =
                    doctor.available === true;


                return `

                    <div class="doctor-card">

                        <h3>

                            👨‍⚕️

                            ${escapeHtml(
                                doctor.name
                            )}

                        </h3>


                        <div class="doctor-specialization">

                            ${escapeHtml(
                                doctor.specialization
                            )}

                        </div>


                        <p>

                            <strong>ID:</strong>

                            ${doctor.doctorId}

                        </p>


                        <p>

                            <strong>
                                Consultations:
                            </strong>

                            ${doctor.consultationsCompleted || 0}

                        </p>


                        <p>

                            <strong>
                                Current Patient:
                            </strong>

                            ${
                                doctor.currentPatientToken &&
                                doctor.currentPatientToken !== -1

                                    ? "#" +
                                      doctor.currentPatientToken

                                    : "None"
                            }

                        </p>


                        <br>


                        <span class="doctor-status ${
                            available
                                ? "available"
                                : "busy"
                        }">

                            ${
                                available
                                    ? "AVAILABLE"
                                    : "BUSY"
                            }

                        </span>


                        <div class="doctor-actions">

                            <button
                                class="edit-btn"
                                onclick="editDoctor(${doctor.doctorId})">

                                ✏️ Edit

                            </button>


                            <button
                                class="secondary-btn"
                                onclick="toggleDoctorAvailability(
                                    ${doctor.doctorId},
                                    ${available}
                                )">

                                ${
                                    available
                                        ? "Set Busy"
                                        : "Set Available"
                                }

                            </button>


                            <button
                                class="secondary-btn"
                                onclick="doctorHistory(${doctor.doctorId})">

                                History

                            </button>


                            <button
                                class="danger-btn"
                                onclick="deleteDoctor(${doctor.doctorId})">

                                Delete

                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ============================================================
// DASHBOARD DOCTORS
// ============================================================

function renderDashboardDoctors() {

    const container =
        document.getElementById(
            "doctorContainer"
        );


    if (!container) {

        return;

    }


    if (!doctors.length) {

        container.innerHTML = `
            <div class="empty-state">

                No doctors found.

            </div>
        `;

        return;

    }


    container.innerHTML =
        doctors.map(
            doctor => {

                return `

                    <div class="queue-item">

                        <div>

                            <strong>

                                ${escapeHtml(
                                    doctor.name
                                )}

                            </strong>

                            <br>

                            <small>

                                ${escapeHtml(
                                    doctor.specialization
                                )}

                            </small>

                        </div>


                        <span class="doctor-status ${
                            doctor.available
                                ? "available"
                                : "busy"
                        }">

                            ${
                                doctor.available
                                    ? "AVAILABLE"
                                    : "BUSY"
                            }

                        </span>

                    </div>

                `;

            }
        ).join("");

}


// ============================================================
// DOCTOR MODAL
// ============================================================

function openDoctorModal() {

    const title =
        document.getElementById(
            "doctorModalTitle"
        );


    const editingId =
        document.getElementById(
            "editingDoctorId"
        );


    const form =
        document.getElementById(
            "doctorForm"
        );


    const doctorId =
        document.getElementById(
            "doctorId"
        );


    if (title) {

        title.textContent =
            "Add Doctor";

    }


    if (editingId) {

        editingId.value = "";

    }


    if (form) {

        form.reset();

    }


    if (doctorId) {

        doctorId.disabled = false;

    }


    clearMessage(
        "doctorMessage"
    );


    const modal =
        document.getElementById(
            "doctorModal"
        );


    if (modal) {

        modal.classList.add("show");

    }

}


function closeDoctorModal() {

    const modal =
        document.getElementById(
            "doctorModal"
        );


    if (modal) {

        modal.classList.remove("show");

    }

}


// ============================================================
// EDIT DOCTOR
// ============================================================

function editDoctor(doctorId) {

    const doctor =
        doctors.find(
            d => d.doctorId === doctorId
        );


    if (!doctor) {

        alert(
            "Doctor not found."
        );

        return;

    }


    setText(
        "doctorModalTitle",
        `Edit Doctor #${doctorId}`
    );


    setValue(
        "editingDoctorId",
        doctorId
    );


    setValue(
        "doctorId",
        doctorId
    );


    const doctorIdInput =
        document.getElementById(
            "doctorId"
        );


    if (doctorIdInput) {

        doctorIdInput.disabled = true;

    }


    setValue(
        "doctorName",
        doctor.name || ""
    );


    setValue(
        "doctorSpecialization",
        doctor.specialization || ""
    );


    clearMessage(
        "doctorMessage"
    );


    const modal =
        document.getElementById(
            "doctorModal"
        );


    if (modal) {

        modal.classList.add("show");

    }

}


// ============================================================
// DOCTOR FORM
// ============================================================

const doctorForm =
    document.getElementById(
        "doctorForm"
    );


if (doctorForm) {

    doctorForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const editingId =
                getValue(
                    "editingDoctorId"
                );


            const doctorId =
                Number(
                    getValue(
                        "doctorId"
                    )
                );


            const name =
                getValue(
                    "doctorName"
                ).trim();


            const specialization =
                getValue(
                    "doctorSpecialization"
                ).trim();


            if (doctorId <= 0) {

                showMessage(
                    "doctorMessage",
                    "Please enter a valid Doctor ID.",
                    "error"
                );

                return;

            }


            const body = {

                doctorId,
                name,
                specialization

            };


            try {

                let data;


                if (editingId) {

                    data =
                        await apiFetch(
                            `/doctors/${editingId}`,
                            {
                                method: "PUT",
                                body: JSON.stringify(body)
                            }
                        );

                }

                else {

                    data =
                        await apiFetch(
                            "/doctors",
                            {
                                method: "POST",
                                body: JSON.stringify(body)
                            }
                        );

                }


                showMessage(
                    "doctorMessage",
                    data.message ||
                    "Doctor saved successfully.",
                    "success"
                );


                setTimeout(() => {

                    closeDoctorModal();

                    loadDoctors();

                    loadDashboard();

                }, 700);

            }

            catch (error) {

                showMessage(
                    "doctorMessage",
                    error.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// DOCTOR AVAILABILITY
// ============================================================

async function toggleDoctorAvailability(
    doctorId,
    currentlyAvailable
) {

    try {

        const data =
            await apiFetch(
                `/doctors/${doctorId}/availability`,
                {
                    method: "PUT",

                    body: JSON.stringify({

                        available:
                            !currentlyAvailable

                    })
                }
            );


        alert(
            data.message ||
            "Doctor status updated."
        );


        loadDoctors();

        loadDashboard();

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// DELETE DOCTOR
// ============================================================

async function deleteDoctor(
    doctorId
) {

    const doctor =
        doctors.find(
            d => d.doctorId === doctorId
        );


    if (!doctor) {

        return;

    }


    const confirmed =
        confirm(
            `Delete ${doctor.name} (Doctor ID: ${doctorId})?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const data =
            await apiFetch(
                `/doctors/${doctorId}`,
                {
                    method: "DELETE"
                }
            );


        alert(
            data.message ||
            "Doctor deleted successfully."
        );


        loadDoctors();

        loadDashboard();

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// DOCTOR HISTORY
// ============================================================

async function doctorHistory(
    doctorId
) {

    try {

        const data =
            await apiFetch(
                `/doctors/${doctorId}/history`
            );


        const history =
            data.history || [];


        let message =
            `Doctor: ${
                data.doctor?.name || ""
            }\n\n`;


        if (!history.length) {

            message +=
                "No consultation history available.";

        }

        else {

            history.forEach(
                item => {

                    message +=
                        `Token #${item.patientToken} - ` +
                        `${item.patientName} - ` +
                        `${item.department}\n`;

                }
            );

        }


        alert(message);

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// APPOINTMENTS
// ============================================================

async function loadAppointments() {

    const tbody =
        document.getElementById(
            "appointmentsTableBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="loading">
                Loading appointments...
            </td>
        </tr>
    `;


    try {

        const data =
            await apiFetch(
                "/appointments"
            );


        const appointments =
            data.appointments || [];


        if (!appointments.length) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="8"
                        class="empty-state">

                        No appointments found.

                    </td>

                </tr>
            `;

            return;

        }


        tbody.innerHTML =
            appointments.map(
                appointment => {

                    /*
                     * Backend AppointmentController returns:
                     *
                     * token
                     * name
                     * age
                     * department
                     * appointmentDate
                     * appointmentTime
                     * status
                     */


                    return `

                        <tr>

                            <td>
                                <strong>
                                    #${appointment.token}
                                </strong>
                            </td>


                            <td>
                                ${escapeHtml(
                                    appointment.name ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    appointment.mobile ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    appointment.department ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    appointment.appointmentDate ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    appointment.appointmentTime ||
                                    "-"
                                )}
                            </td>


                            <td>

                                <span class="status-badge status-called">

                                    Scheduled

                                </span>

                            </td>


                            <td>

                                <div class="action-buttons">

                                    <button
                                        class="secondary-btn"
                                        onclick="showPatientPrint(${appointment.token})">

                                        🖨️ Slip

                                    </button>


                                    <button
                                        class="danger-btn"
                                        onclick="cancelAppointment(${appointment.token})">

                                        Cancel

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            ).join("");

    }

    catch (error) {

        tbody.innerHTML = `
            <tr>

                <td colspan="8"
                    class="empty-state">

                    ${escapeHtml(
                        error.message
                    )}

                </td>

            </tr>
        `;

    }

}


// ============================================================
// APPOINTMENT MODAL
// ============================================================

function openAppointmentModal() {

    const form =
        document.getElementById(
            "appointmentForm"
        );


    if (form) {

        form.reset();

    }


    clearMessage(
        "appointmentMessage"
    );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    setValue(
        "appointmentDate",
        today
    );


    const modal =
        document.getElementById(
            "appointmentModal"
        );


    if (modal) {

        modal.classList.add("show");

    }

}


function closeAppointmentModal() {

    const modal =
        document.getElementById(
            "appointmentModal"
        );


    if (modal) {

        modal.classList.remove("show");

    }

}


// ============================================================
// APPOINTMENT FORM
// ============================================================

const appointmentForm =
    document.getElementById(
        "appointmentForm"
    );


if (appointmentForm) {

    appointmentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const token =
                Number(
                    getValue(
                        "appointmentToken"
                    )
                );


            const date =
                getValue(
                    "appointmentDate"
                );


            const time =
                getValue(
                    "appointmentTime"
                );


            if (!token || token <= 0) {

                showMessage(
                    "appointmentMessage",
                    "Please enter a valid patient token.",
                    "error"
                );

                return;

            }


            if (!date) {

                showMessage(
                    "appointmentMessage",
                    "Please select appointment date.",
                    "error"
                );

                return;

            }


            if (!time) {

                showMessage(
                    "appointmentMessage",
                    "Please select appointment time.",
                    "error"
                );

                return;

            }


            try {

                /*
                 * IMPORTANT:
                 *
                 * Backend endpoint:
                 * POST /api/appointments/{token}
                 *
                 * Backend expects:
                 * {
                 *     date: "...",
                 *     time: "..."
                 * }
                 */


                const data =
                    await apiFetch(
                        `/appointments/${token}`,
                        {
                            method: "POST",

                            body: JSON.stringify({

                                date: date,

                                time: time

                            })
                        }
                    );


                showMessage(
                    "appointmentMessage",
                    data.message ||
                    "Appointment scheduled successfully.",
                    "success"
                );


                setTimeout(async () => {

                    closeAppointmentModal();

                    await loadAppointments();

                    await loadPatients();

                    await loadDashboard();

                }, 800);

            }

            catch (error) {

                console.error(
                    "Appointment Error:",
                    error
                );


                showMessage(
                    "appointmentMessage",
                    error.message ||
                    "Unable to schedule appointment.",
                    "error"
                );

            }

        }
    );

}


// ============================================================
// CANCEL APPOINTMENT
// ============================================================

async function cancelAppointment(token) {

    const confirmed =
        confirm(
            `Cancel appointment for patient #${token}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const data =
            await apiFetch(
                `/appointments/${token}`,
                {
                    method: "DELETE"
                }
            );


        alert(
            data.message ||
            "Appointment cancelled successfully."
        );


        await loadAppointments();

        await loadPatients();

        await loadDashboard();

    }

    catch (error) {

        alert(error.message);

    }

}


// ============================================================
// DAILY REPORT
// ============================================================

async function loadDailyReport() {

    const container =
        document.getElementById(
            "dailyReportContainer"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `
        <div class="loading">
            Loading report...
        </div>
    `;


    try {

        const data =
            await apiFetch(
                "/reports/daily"
            );


        /*
         * Backend response:
         *
         * {
         *   success: true,
         *
         *   patients: {
         *      total,
         *      waiting,
         *      withDoctor,
         *      completed,
         *      emergency
         *   },
         *
         *   appointments: {
         *      total,
         *      cancelled
         *   },
         *
         *   doctors: [...]
         * }
         */


        const totalPatients =
            data.patients?.total ?? 0;


        const waitingPatients =
            data.patients?.waiting ?? 0;


        const withDoctor =
            data.patients?.withDoctor ?? 0;


        const completed =
            data.patients?.completed ?? 0;


        const emergency =
            data.patients?.emergency ?? 0;


        const totalAppointments =
            data.appointments?.total ?? 0;


        const cancelledAppointments =
            data.appointments?.cancelled ?? 0;


        const totalDoctors =
            Array.isArray(data.doctors)
                ? data.doctors.length
                : 0;


        container.innerHTML = `

            <div class="stats-grid">

                <div class="stat-card">

                    <div class="stat-icon patients-icon">
                        👥
                    </div>

                    <div>

                        <p>
                            Total Patients
                        </p>

                        <h2>
                            ${totalPatients}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon waiting-icon">
                        ⏳
                    </div>

                    <div>

                        <p>
                            Waiting Patients
                        </p>

                        <h2>
                            ${waitingPatients}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon doctor-icon">
                        👨‍⚕️
                    </div>

                    <div>

                        <p>
                            With Doctor
                        </p>

                        <h2>
                            ${withDoctor}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon busy-icon">
                        🩺
                    </div>

                    <div>

                        <p>
                            Completed
                        </p>

                        <h2>
                            ${completed}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        🚨
                    </div>

                    <div>

                        <p>
                            Emergency Patients
                        </p>

                        <h2>
                            ${emergency}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        📅
                    </div>

                    <div>

                        <p>
                            Active Appointments
                        </p>

                        <h2>
                            ${totalAppointments}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        ❌
                    </div>

                    <div>

                        <p>
                            Cancelled Appointments
                        </p>

                        <h2>
                            ${cancelledAppointments}
                        </h2>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        👨‍⚕️
                    </div>

                    <div>

                        <p>
                            Total Doctors
                        </p>

                        <h2>
                            ${totalDoctors}
                        </h2>

                    </div>

                </div>

            </div>


            <div class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Daily Hospital Report
                        </h2>

                        <p>
                            ${escapeHtml(
                                data.reportDate ||
                                new Date().toISOString().split("T")[0]
                            )}
                        </p>

                    </div>

                </div>


                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>Doctor ID</th>

                                <th>Doctor</th>

                                <th>Specialization</th>

                                <th>Consultations Completed</th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                Array.isArray(data.doctors) &&
                                data.doctors.length

                                    ?

                                    data.doctors.map(
                                        doctor => `

                                            <tr>

                                                <td>
                                                    ${doctor.doctorId}
                                                </td>

                                                <td>
                                                    ${escapeHtml(
                                                        doctor.name || "-"
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHtml(
                                                        doctor.specialization || "-"
                                                    )}
                                                </td>

                                                <td>
                                                    ${doctor.consultationsCompleted ?? 0}
                                                </td>

                                            </tr>

                                        `
                                    ).join("")

                                    :

                                    `
                                        <tr>

                                            <td
                                                colspan="4"
                                                class="empty-state">

                                                No doctor data available.

                                            </td>

                                        </tr>
                                    `
                            }

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "Report Error:",
            error
        );


        container.innerHTML = `
            <div class="empty-state">

                ${escapeHtml(
                    error.message
                )}

            </div>
        `;

    }

}


// ============================================================
// WAITING TIME
// ============================================================

function calculateWaitingTime(
    patient
) {

    if (!patient) {

        return "0 min";

    }


    if (
        patient.status &&
        patient.status.toUpperCase() !==
        "WAITING"
    ) {

        return patient.status;

    }


    if (
        patient.estimatedWaitingTime !==
        undefined &&
        patient.estimatedWaitingTime !==
        null
    ) {

        return formatMinutes(
            Number(
                patient.estimatedWaitingTime
            )
        );

    }


    const index =
        patients.findIndex(
            p => p.token === patient.token
        );


    if (index < 0) {

        return "Calculating...";

    }


    const normalConsultationMinutes =
        15;


    return formatMinutes(
        index *
        normalConsultationMinutes
    );

}


// ============================================================
// FORMAT MINUTES
// ============================================================

function formatMinutes(
    minutes
) {

    minutes =
        Math.max(
            0,
            Math.round(minutes)
        );


    if (minutes < 60) {

        return `${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const remaining =
        minutes % 60;


    return `${hours}h ${remaining}m`;

}


// ============================================================
// LIVE WAITING TIME REFRESH
// ============================================================

function updateWaitingTimes() {

    patients.forEach(
        patient => {

            const element =
                document.getElementById(
                    `waiting-${patient.token}`
                );


            if (element) {

                element.textContent =
                    calculateWaitingTime(
                        patient
                    );

            }

        }
    );

}


waitingTimer =
    setInterval(
        updateWaitingTimes,
        30000
    );


// ============================================================
// HELPERS
// ============================================================

function showMessage(
    elementId,
    message,
    type
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `form-message ${
            type === "success"
                ? "success-message"
                : "error-message"
        }`;

}


function clearMessage(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent = "";


    element.className =
        "form-message";

}


function getStatusClass(
    status
) {

    const value =
        String(
            status || ""
        ).toUpperCase();


    if (
        value === "WAITING"
    ) {

        return "status-waiting";

    }


    if (
        value === "COMPLETED" ||
        value === "DONE"
    ) {

        return "status-completed";

    }


    if (
        value === "CALLED" ||
        value === "IN_PROGRESS" ||
        value === "WITH DOCTOR"
    ) {

        return "status-called";

    }


    if (
        value === "CANCELLED" ||
        value === "CANCELED"
    ) {

        return "status-cancelled";

    }


    return "status-waiting";

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// SAFE DOM HELPERS
// ============================================================

function getValue(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return "";

    }


    return element.value ?? "";

}


function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

        loadPatients();

        loadDoctors();

        loadAppointments();

    }
);


// ============================================================
// AUTO REFRESH
// EVERY 30 SECONDS
// ============================================================

setInterval(
    function () {

        if (
            currentSection ===
                "dashboard" ||
            currentSection ===
                "queue"
        ) {

            loadDashboard();

        }


        if (
            currentSection ===
            "patients"
        ) {

            loadPatients();

        }


        if (
            currentSection ===
            "doctors"
        ) {

            loadDoctors();

        }


        if (
            currentSection ===
            "appointments"
        ) {

            loadAppointments();

        }


        if (
            currentSection ===
            "reports"
        ) {

            loadDailyReport();

        }

    },
    30000
);