// const BACKEND_URL = "http://localhost:5000/api";
const BACKEND_URL = "https://e-registration-1i0c.onrender.com/api";

let userData = localStorage.getItem("token");
userData = JSON.parse(userData);
const { token, user } = userData;

$(document).ready(function () {
  // Assume the user role is dynamically fetched from your backend
  const userRole = user.role; // Replace with actual user role fetching logic

  // Hide all menus initially
  $(".super-admin-menu, .support-admin-menu, .user-menu").hide();

  // Show menus based on role
  if (userRole === "super_admin") {
    $(".super-admin-menu").show();
    // $(".dashboard_bar").text("Admin Panel");
  } else if (userRole === "support_admin") {
    $(".support-admin-menu").show();
    $('.super-admin-menu:has(a[href="approvals.html"])').show();
    // $(".dashboard_bar").text("Admin Panel");
  } else if (userRole === "user") {
    $(".user-menu").show();
    // $(".dashboard_bar").text("Dashboard");
  }
});

$(document).ready(function () {
  // Utility function to set input values
  const setInputValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || "";
    }
  };

  // Fetch user details on page load
  $.ajax({
    url: `${BACKEND_URL}/users/${user.id}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      // Set the value in the select field
      $("#gender").val(data.gender).change();
      $("#membership_status").val(data.membership_status).change();
      $("#lga").val(data.lga).change();
      $("#ward").val(data.ward).change();
      $("#polling_unit").val(data.polling_unit).change();

      $(".selectpicker").selectpicker("refresh");

      // Destructure the main fields
      const {
        firstname,
        lastname,
        email,
        middlename,
        phone,
        gender,
        DOB,
        membership_no,
        reg_area,
        voters_card_no,
      } = data;

      // Populate main fields
      const mainFields = {
        first_name: firstname,
        lastname: lastname,
        email: email,
        middlename: middlename,
        phone: phone,
        gender: gender,
        DOB: DOB,
        membership_no,
        reg_area,
        voters_card_no,
      };
      Object.entries(mainFields).forEach(([id, value]) =>
        setInputValue(id, value)
      );
    },
    error: function (error) {
      const errorMessage =
        error.responseJSON?.message || "Failed to load user profile.";
      Swal.fire("Oops...", errorMessage, "error");
      console.error("Error fetching profile:", error);
      $("#name").text("Error loading profile");
    },
  });
});

$(document).ready(function () {
  // Function to collect form data
  const collectFormData = () => {
    const formData = new FormData();
    // Collect input values and append them to formData
    const fields = [
      "middlename",
      "gender",
      "DOB",
      "reg_area",
      "polling_unit",
      "voters_card_no",
      "membership_no",
      "membership_status",
      "lga",
      "ward",
    ];

    fields.forEach((field) => {
      const value = $(`#${field}`).val();
      formData.append(field, value || ""); // Fallback to empty string if value is null/undefined
    });

    // Handle file upload
    const passportPhoto = $("#passportPhoto")[0]?.files[0];
    if (passportPhoto) {
      formData.append("passportPhoto", passportPhoto);
    }

    return {
      formData,
    };
  };

  // Unified form submission
  $("#unifiedForm").on("submit", function (e) {
    e.preventDefault();

    try {
      const { formData } = collectFormData();
      $.ajax({
        type: "PUT",
        url: `${BACKEND_URL}/users/${user.id}`,
        contentType: false, // Important for FormData
        processData: false, // Important for FormData
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: formData, // Do not stringify FormData
        success: function (response) {
          Swal.fire(
            "Congratulations",
            "Account successfully updated",
            "success"
          );
        },
        error: function (xhr) {
          const errorMessage = xhr.responseJSON?.message || "An error occurred";
          Swal.fire("Oops...", errorMessage, "error");
        },
      });
    } catch (error) {
      Swal.fire(
        "Oops...",
        error.message || "An unexpected error occurred",
        "error"
      );
    }
  });
});
function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const table = document.getElementById("dataTable");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    // Skip header row
    const rowText = rows[i].textContent.toLowerCase();

    if (rowText.includes(input)) {
      rows[i].classList.remove("no-match");
    } else {
      rows[i].classList.add("no-match");
    }
  }
}

// //Get All Users
$(document).ready(function () {
  // Track the current page and define the page size
  const currentPage = { value: 1 };
  const pageSize = 10;

  // Utility function to make API requests
  const apiRequest = (
    url,
    method,
    headers = {},
    data = null,
    onSuccess,
    onError
  ) => {
    $.ajax({
      url,
      method,
      headers,
      data,
      success: onSuccess,
      error: onError || ((error) => console.error("API Error:", error)),
    });
  };

  // Update the table with user data
  const updateTable = (data, page) => {
    const tableBody = $("#table-body");
    tableBody.empty(); // Clear existing table rows

    // Populate table rows with user data
    data.forEach((item, index) => {
      const rowHtml = `
        <tr>
          <td>${(page - 1) * pageSize + index + 1}</td>
          <td>${item.firstname} ${item.lastname}</td>
          <td>${item.phone}</td>
          <td>${item.email}</td>
          <td>${item.role}</td>
          <td>
            <button class="btn btn-sm update-role-btn" 
                    data-id="${item._id}" 
                    data-role="${item.role}" 
                    style="background-color: #4C956C; color: #fff">
              Update Role
            </button>
          </td>
           <td>
           <button class="btn btn-sm view-user-btn" 
                    data-id="${item._id}" 
                    style="background-color: #007BFF; color: #fff">
              View
            </button>
          </td>
        </tr>`;
      tableBody.append(rowHtml); // Add the row to the table
    });
  };

  // Fetch user data for the current page
  const fetchData = (page) => {
    const url = `${BACKEND_URL}/users?page=${page}&limit=${pageSize}`;
    const headers = { Authorization: `Bearer ${token}` };

    apiRequest(url, "GET", headers, null, (response) => {
      const { data, hasNextPage } = response;
      updateTable(data, page);

      $("#prev-btn").prop("disabled", page === 1);
      $("#next-btn").prop("disabled", !hasNextPage);
      $("#usercount").text(data.length);
    });
  };

  // Update the role of a specific user
  const updateRole = (userId, currentRole) => {
    const roleMap = {
      user: "support_admin",
      support_admin: "super_admin",
      super_admin: "user",
    };
    const newRole = roleMap[currentRole];

    if (!newRole) return;

    const url = `${BACKEND_URL}/users/${userId}/role`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const data = JSON.stringify({ role: newRole });

    apiRequest(
      url,
      "PATCH",
      headers,
      data,
      () => {
        alert("Role updated successfully!");
        fetchData(currentPage.value);
      },
      () => alert("Failed to update role.")
    );
  };

  // Fetch and display user details in a modern profile modal
  const viewDetails = (userId) => {
    const url = `${BACKEND_URL}/users/${userId}`;
    const headers = { Authorization: `Bearer ${token}` };

    apiRequest(url, "GET", headers, null, (response) => {
      // Construct user details dynamically
      const details = `
        <div class="user-profile">
          <div class="profile-header">
            <img 
              // src="${
                response.passportPhoto || "/assets/images/avatar.jpeg"
              }" 
              alt="Passport Photo" 
              class="profile-photo" 
              crossOrigin="anonymous"
            >
            <h2 class="profile-name">${response.firstname} ${
        response.lastname
      }</h2>
            <p class="profile-role">${response.role}</p>
          </div>
          <div class="profile-details">
            <p><strong>Email:</strong> ${response.email}</p>
            <p><strong>Phone:</strong> ${response.phone}</p>
          </div>
        </div>
      `;
      $("#details-modal .modal-body").html(details); // Populate modal with user details
      $("#details-modal").modal("show"); // Show the
    });
  };

  // Handle role update button clicks
  $("#table-body").on("click", ".update-role-btn", function () {
    const userId = $(this).data("id");
    const currentRole = $(this).data("role");
    updateRole(userId, currentRole);
  });

  // Handle view details button clicks
  $("#table-body").on("click", ".view-user-btn", function () {
    const userId = $(this).data("id");
    viewDetails(userId);
  });

  // Handle pagination
  $("#prev-btn").click(function () {
    if (currentPage.value > 1) {
      currentPage.value--;
      fetchData(currentPage.value);
    }
  });

  $("#next-btn").click(function () {
    currentPage.value++;
    fetchData(currentPage.value);
  });

  // Load initial data
  fetchData(currentPage.value);
});

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade show";
    backdrop.id = `${modalId}-backdrop`;
    document.body.appendChild(backdrop);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    const backdrop = document.getElementById(`${modalId}-backdrop`);
    if (backdrop) {
      backdrop.remove();
    }
  }
}

// // Indigene Certificate
$(document).ready(function () {
  const pageSize = 10;
  let currentPage = 1;
  let rejectionId = null;

  const apiHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const tableBody = $("#view-all-request-table");

  function updatePaginationButtons(hasNextPage) {
    $("#btn-prev").prop("disabled", currentPage === 1);
    $("#btn-next").prop("disabled", !hasNextPage);
  }

  function updateRequestCount(count) {
    $("#request").text(count);
  }

  function renderTable(data) {
    tableBody.empty();
    data.forEach((item, index) => {
      const isRejected = item.status === "Rejected";
      tableBody.append(`
        <tr data-id="${item._id}">
          <td>${(currentPage - 1) * pageSize + index + 1}</td>
          <td>${item.firstname} ${item.lastname}</td>
          <td>${item.phone}</td>
          <td>${item.email}</td>
          <td>${item.status}</td>
          <td>
            <div class="dropdown">
              <button class="btn btn-xs btn-action dropdown-toggle" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><button class="dropdown-item btn-approve" data-id="${
                  item._id
                }" style="color: green;">Approve</button></li>
                <li><button class="dropdown-item btn-reject" data-id="${
                  item._id
                }" ${
        isRejected ? "disabled" : ""
      } style="color: red;">Reject</button></li>
                <li><button class="dropdown-item btn-view" data-id="${
                  item._id
                }" style="color: blue;">View</button></li>
              </ul>
            </div>
          </td>
        </tr>
      `);
    });
  }

  function fetchData(page) {
    $.ajax({
      url: `${BACKEND_URL}/indigene/certificate/request?page=${page}&limit=${pageSize}&statuses=Pending,Rejected`,
      method: "GET",
      headers: apiHeaders,
      success: function (response) {
        const { data, hasNextPage } = response;

        renderTable(data);
        updatePaginationButtons(hasNextPage);
        updateRequestCount(data.length);
        data.forEach((element) => {
          if (element.status === "Pending") {
            $("#pending").text(data.length);
          }
          if (element.status === "Rejected") {
            $("#rejected").text(data.length);
          }
        });
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      },
    });
  }

  function handleApproval(requestId) {
    $.ajax({
      url: `${BACKEND_URL}/indigene/certificate/${requestId}/approve`,
      method: "PATCH",
      headers: apiHeaders,
      success: function () {
        fetchData(currentPage);
      },
      error: function (error) {
        console.error("Error approving request:", error);
      },
    });
  }

  function handleRejection(rejectionReason) {
    if (!rejectionReason) {
      alert("Please provide a rejection reason.");
      return;
    }

    $.ajax({
      url: `${BACKEND_URL}/indigene/certificate/${rejectionId}/reject`,
      method: "PATCH",
      contentType: "application/json",
      data: JSON.stringify({ rejectionReason }),
      headers: apiHeaders,
      success: function () {
        $("#rejectionModal").modal("hide");
        $("#rejectionReason").val("");
        fetchData(currentPage);
      },
      error: function (error) {
        console.error("Error rejecting request:", error);
      },
    });
  }

  function handleView(requestId) {
    $.ajax({
      url: `${BACKEND_URL}/indigene/certificate/${requestId}/request`,
      method: "GET",
      headers: apiHeaders,
      success: function (response) {
        // Populate the view modal with the request details
        $("#viewModal .modal-body").html(`
          <p><strong>Name:</strong> ${response.firstname} ${
          response.lastname
        }</p>
          <p><strong>Phone:</strong> ${response.phone}</p>
          <p><strong>Email:</strong> ${response.email}</p>
          <p><strong>Status:</strong> ${response.status}</p>
          <p><strong>Details:</strong> ${response.details || "N/A"}</p>
        `);
        $("#viewModal").modal("show");
      },
      error: function (error) {
        console.error("Error fetching request details:", error);
      },
    });
  }

  $(document).on("click", ".btn-approve", function () {
    const requestId = $(this).data("id");
    handleApproval(requestId);
  });

  $(document).on("click", ".btn-reject", function () {
    rejectionId = $(this).data("id");
    $("#rejectionModal").modal("show");
  });

  $("#dataTable").on("click", ".btn-view", function () {
    const requestId = $(this).data("id");

    handleView(requestId);
  });

  $("#submitRejection").click(function () {
    const reason = $("#rejectionReason").val();
    handleRejection(reason);
  });

  $("#btn-prev").click(function () {
    if (currentPage > 1) {
      currentPage--;
      fetchData(currentPage);
    }
  });

  $("#btn-next").click(function () {
    currentPage++;
    fetchData(currentPage);
  });

  // Initial data load
  fetchData(currentPage);
});

// // Id Card
$(document).ready(function () {
  const pageSize = 10;
  let currentPage = 1;
  let rejectionId = null;

  const apiHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const tableBody = $("#view-all-card-table");

  function updatePaginationButtons(hasNextPage) {
    $("#btn-prev").prop("disabled", currentPage === 1);
    $("#btn-next").prop("disabled", !hasNextPage);
  }

  function updateRequestCount(count) {
    $("#request").text(count);
  }

  function renderTable(data) {
    tableBody.empty();
    data.forEach((item, index) => {
      const isRejected = item.status === "Rejected";
      tableBody.append(`
        <tr data-id="${item._id}">
          <td>${(currentPage - 1) * pageSize + index + 1}</td>
          <td>${item.firstname} ${item.lastname}</td>
          <td>${item.phone}</td>
          <td>${item.email}</td>
          <td>${item.status}</td>
          <td>
            <div class="dropdown">
              <button class="btn btn-xs btn-action dropdown-toggle" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><button class="dropdown-item btn-approve" data-id="${
                  item._id
                }" style="color: green;">Approve</button></li>
                <li><button class="dropdown-item btn-reject" data-id="${
                  item._id
                }" ${
        isRejected ? "disabled" : ""
      } style="color: red;">Reject</button></li>
                <li><button class="dropdown-item btn-view" data-id="${
                  item._id
                }" style="color: blue;">View</button></li>
              </ul>
            </div>
          </td>
        </tr>
      `);
    });
  }

  function fetchData(page) {
    $.ajax({
      url: `${BACKEND_URL}/idcard/request?page=${page}&limit=${pageSize}&statuses=Pending,Rejected`,
      method: "GET",
      headers: apiHeaders,
      success: function (response) {
        const { data, hasNextPage } = response;
        renderTable(data);
        updatePaginationButtons(hasNextPage);
        updateRequestCount(data.length);
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      },
    });
  }

  // Handle card Approval
  function handleApproval(requestId) {
    $.ajax({
      url: `${BACKEND_URL}/idcard/${requestId}/approve`,
      method: "PATCH",
      headers: apiHeaders,
      success: function () {
        fetchData(currentPage);
      },
      error: function (error) {
        console.error("Error approving request:", error);
      },
    });
  }

  // Handle card rejection
  function handleRejection(rejectionReason) {
    if (!rejectionReason) {
      alert("Please provide a rejection reason.");
      return;
    }

    $.ajax({
      url: `${BACKEND_URL}/idcard/${rejectionId}/reject`,
      method: "PATCH",
      contentType: "application/json",
      data: JSON.stringify({ rejectionReason }),
      headers: apiHeaders,
      success: function () {
        $("#rejectionModal").modal("hide");
        $("#rejectionReason").val("");
        fetchData(currentPage);
      },
      error: function (error) {
        console.error("Error rejecting request:", error);
      },
    });
  }

  // Handle card view
  function handleView(requestId) {
    $.ajax({
      url: `${BACKEND_URL}/idcard/${requestId}/request`,
      method: "GET",
      headers: apiHeaders,
      success: function (response) {
        // Populate the view modal with the request details
        $("#viewModal .modal-body").html(`
          <p><strong>Name:</strong> ${response.firstname} ${
          response.lastname
        }</p>
          <p><strong>Phone:</strong> ${response.phone}</p>
          <p><strong>Email:</strong> ${response.email}</p>
          <p><strong>Status:</strong> ${response.status}</p>
          <p><strong>Details:</strong> ${response.details || "N/A"}</p>
        `);
        $("#viewModal").modal("show");
      },
      error: function (error) {
        console.error("Error fetching request details:", error);
      },
    });
  }

  $(document).on("click", ".btn-approve", function () {
    const requestId = $(this).data("id");
    handleApproval(requestId);
  });

  $(document).on("click", ".btn-reject", function () {
    rejectionId = $(this).data("id");
    $("#rejectionModal").modal("show");
  });

  $("#dataTable").on("click", ".btn-view", function () {
    const requestId = $(this).data("id");

    handleView(requestId);
  });

  $("#submitRejection").click(function () {
    const reason = $("#rejectionReason").val();
    handleRejection(reason);
  });

  $("#btn-prev").click(function () {
    if (currentPage > 1) {
      currentPage--;
      fetchData(currentPage);
    }
  });

  $("#btn-next").click(function () {
    currentPage++;
    fetchData(currentPage);
  });

  // Initial data load
  fetchData(currentPage);
});
const nigeriaData = {
  adamawa: [
    "Demsa",
    "Fufure",
    "Ganye",
    "Gayuk",
    "Gombi",
    "Grie",
    "Hong",
    "Jada",
    "Larmurde",
    "Madagali",
    "Maiha",
    "Mayo Belwa",
    "Michika",
    "Mubi North",
    "Mubi South",
    "Numan",
    "Shelleng",
    "Song",
    "Toungo",
    "Yola North",
    "Yola South",
  ],
  akwa_ibom: [
    "Abak",
    "Eastern Obolo",
    "Eket",
    "Esit Eket",
    "Essien Udim",
    "Etim Ekpo",
    "Etinan",
    "Ibeno",
    "Ibesikpo Asutan",
    "Ibiono-Ibom",
    "Ikot Abasi",
    "Ika",
    "Ikono",
    "Ikot Ekpene",
    "Ini",
    "Mkpat-Enin",
    "Itu",
    "Mbo",
    "Nsit-Atai",
    "Nsit-Ibom",
    "Nsit-Ubium",
    "Obot Akara",
    "Okobo",
    "Onna",
    "Oron",
    "Udung-Uko",
    "Ukanafun",
    "Oruk Anam",
    "Uruan",
    "Urue-Offong/Oruko",
    "Uyo",
  ],
  anambra: [
    "Aguata",
    "Anambra East",
    "Anaocha",
    "Awka North",
    "Anambra West",
    "Awka South",
    "Ayamelum",
    "Dunukofia",
    "Ekwusigo",
    "Idemili North",
    "Idemili South",
    "Ihiala",
    "Njikoka",
    "Nnewi North",
    "Nnewi South",
    "Ogbaru",
    "Onitsha North",
    "Onitsha South",
    "Orumba North",
    "Orumba South",
    "Oyi",
  ],
  abia: [
    "Aba North",
    "Arochukwu",
    "Aba South",
    "Bende",
    "Isiala Ngwa North",
    "Ikwuano",
    "Isiala Ngwa South",
    "Isuikwuato",
    "Obi Ngwa",
    "Ohafia",
    "Osisioma",
    "Ugwunagbo",
    "Ukwa East",
    "Ukwa West",
    "Umuahia North",
    "Umuahia South",
    "Umu Nneochi",
  ],
  bauchi: [
    "Alkaleri",
    "Bauchi",
    "Bogoro",
    "Damban",
    "Darazo",
    "Dass",
    "Gamawa",
    "Ganjuwa",
    "Giade",
    "Itas/Gadau",
    "Jama'are",
    "Katagum",
    "Kirfi",
    "Misau",
    "Ningi",
    "Shira",
    "Tafawa Balewa",
    "Toro",
    "Warji",
    "Zaki",
  ],
  benue: [
    "Agatu",
    "Apa",
    "Ado",
    "Buruku",
    "Gboko",
    "Guma",
    "Gwer East",
    "Gwer West",
    "Katsina-Ala",
    "Konshisha",
    "Kwande",
    "Logo",
    "Makurdi",
    "Obi",
    "Ogbadibo",
    "Ohimini",
    "Oju",
    "Okpokwu",
    "Oturkpo",
    "Tarka",
    "Ukum",
    "Ushongo",
    "Vandeikya",
  ],
  borno: [
    "Abadam",
    "Askira/Uba",
    "Bama",
    "Bayo",
    "Biu",
    "Chibok",
    "Damboa",
    "Dikwa",
    "Guzamala",
    "Gubio",
    "Hawul",
    "Gwoza",
    "Jere",
    "Kaga",
    "Kala/Balge",
    "Konduga",
    "Kukawa",
    "Kwaya Kusar",
    "Mafa",
    "Magumeri",
    "Maiduguri",
    "Mobbar",
    "Marte",
    "Monguno",
    "Ngala",
    "Nganzai",
    "Shani",
  ],
  bayelsa: [
    "Brass",
    "Ekeremor",
    "Kolokuma/Opokuma",
    "Nembe",
    "Ogbia",
    "Sagbama",
    "Southern Ijaw",
    "Yenagoa",
  ],
  cross_river: [
    "Abi",
    "Akamkpa",
    "Akpabuyo",
    "Bakassi",
    "Bekwarra",
    "Biase",
    "Boki",
    "Calabar Municipal",
    "Calabar South",
    "Etung",
    "Ikom",
    "Obanliku",
    "Obubra",
    "Obudu",
    "Odukpani",
    "Ogoja",
    "Yakuur",
    "Yala",
  ],
  delta: [
    "Aniocha North",
    "Aniocha South",
    "Bomadi",
    "Burutu",
    "Ethiope West",
    "Ethiope East",
    "Ika North East",
    "Ika South",
    "Isoko North",
    "Isoko South",
    "Ndokwa East",
    "Ndokwa West",
    "Okpe",
    "Oshimili North",
    "Oshimili South",
    "Patani",
    "Sapele",
    "Udu",
    "Ughelli North",
    "Ukwuani",
    "Ughelli South",
    "Uvwie",
    "Warri North",
    "Warri South",
    "Warri South West",
  ],
  ebonyi: [
    "Abakaliki",
    "Afikpo North",
    "Ebonyi",
    "Afikpo South",
    "Ezza North",
    "Ikwo",
    "Ezza South",
    "Ivo",
    "Ishielu",
    "Izzi",
    "Ohaozara",
    "Ohaukwu",
    "Onicha",
  ],
  edo: [
    "Akoko-Edo",
    "Egor",
    "Esan Central",
    "Esan North-East",
    "Esan South-East",
    "Esan West",
    "Etsako Central",
    "Etsako East",
    "Etsako West",
    "Igueben",
    "Ikpoba Okha",
    "Orhionmwon",
    "Oredo",
    "Ovia North-East",
    "Ovia South-West",
    "Owan East",
    "Owan West",
    "Uhunmwonde",
  ],
  ekiti: [
    "Ado Ekiti",
    "Efon",
    "Ekiti East",
    "Ekiti South-West",
    "Ekiti West",
    "Emure",
    "Gbonyin",
    "Ido Osi",
    "Ijero",
    "Ikere",
    "Ilejemeje",
    "Irepodun/Ifelodun",
    "Ikole",
    "Ise/Orun",
    "Moba",
    "Oye",
  ],
  enugu: [
    "Awgu",
    "Aninri",
    "Enugu East",
    "Enugu North",
    "Ezeagu",
    "Enugu South",
    "Igbo Etiti",
    "Igbo Eze North",
    "Igbo Eze South",
    "Isi Uzo",
    "Nkanu East",
    "Nkanu West",
    "Nsukka",
    "Udenu",
    "Oji River",
    "Uzo Uwani",
    "Udi",
  ],
  abuja: [
    "Abaji",
    "Bwari",
    "Gwagwalada",
    "Kuje",
    "Kwali",
    "Municipal Area Council",
  ],
  gombe: [
    "Akko",
    "Balanga",
    "Billiri",
    "Dukku",
    "Funakaye",
    "Gombe",
    "Kaltungo",
    "Kwami",
    "Nafada",
    "Shongom",
    "Yamaltu/Deba",
  ],
  jigawa: [
    "Auyo",
    "Babura",
    "Buji",
    "Biriniwa",
    "Birnin Kudu",
    "Dutse",
    "Gagarawa",
    "Garki",
    "Gumel",
    "Guri",
    "Gwaram",
    "Gwiwa",
    "Hadejia",
    "Jahun",
    "Kafin Hausa",
    "Kazaure",
    "Kiri Kasama",
    "Kiyawa",
    "Kaugama",
    "Maigatari",
    "Malam Madori",
    "Miga",
    "Sule Tankarkar",
    "Roni",
    "Ringim",
    "Yankwashi",
    "Taura",
  ],
  lagos: [
    "Agege",
    "Ajeromi-Ifelodun",
    "Alimosho",
    "Amuwo-Odofin",
    "Badagry",
    "Apapa",
    "Epe",
    "Eti Osa",
    "Ibeju-Lekki",
    "Ifako-Ijaiye",
    "Ikeja",
    "Ikorodu",
    "Kosofe",
    "Lagos Island",
    "Mushin",
    "Lagos Mainland",
    "Ojo",
    "Oshodi-Isolo",
    "Shomolu",
    "Surulere Lagos State",
  ],
  oyo: [
    "Afijio",
    "Akinyele",
    "Atiba",
    "Atisbo",
    "Egbeda",
    "Ibadan North",
    "Ibadan North-East",
    "Ibadan North-West",
    "Ibadan South-East",
    "Ibarapa Central",
    "Ibadan South-West",
    "Ibarapa East",
    "Ido",
    "Ibarapa North",
    "Irepo",
    "Iseyin",
    "Itesiwaju",
    "Iwajowa",
    "Kajola",
    "Lagelu",
    "Ogbomosho North",
    "Ogbomosho South",
    "Ogo Oluwa",
    "Olorunsogo",
    "Oluyole",
    "Ona Ara",
    "Orelope",
    "Ori Ire",
    "Oyo",
    "Oyo East",
    "Saki East",
    "Saki West",
    "Surulere Oyo State",
  ],
  imo: [
    "Aboh Mbaise",
    "Ahiazu Mbaise",
    "Ehime Mbano",
    "Ezinihitte",
    "Ideato North",
    "Ideato South",
    "Ihitte/Uboma",
    "Ikeduru",
    "Isiala Mbano",
    "Mbaitoli",
    "Isu",
    "Ngor Okpala",
    "Njaba",
    "Nkwerre",
    "Nwangele",
    "Obowo",
    "Oguta",
    "Ohaji/Egbema",
    "Okigwe",
    "Orlu",
    "Orsu",
    "Oru East",
    "Oru West",
    "Owerri Municipal",
    "Owerri North",
    "Unuimo",
    "Owerri West",
  ],
  kaduna: [
    "Birnin Gwari",
    "Chikun",
    "Giwa",
    "Ikara",
    "Igabi",
    "Jaba",
    "Jema'a",
    "Kachia",
    "Kaduna North",
    "Kaduna South",
    "Kagarko",
    "Kajuru",
    "Kaura",
    "Kauru",
    "Kubau",
    "Kudan",
    "Lere",
    "Makarfi",
    "Sabon Gari",
    "Sanga",
    "Soba",
    "Zangon Kataf",
    "Zaria",
  ],
  kebbi: [
    "Aleiro",
    "Argungu",
    "Arewa Dandi",
    "Augie",
    "Bagudo",
    "Birnin Kebbi",
    "Bunza",
    "Dandi",
    "Fakai",
    "Gwandu",
    "Jega",
    "Kalgo",
    "Koko/Besse",
    "Maiyama",
    "Ngaski",
    "Shanga",
    "Suru",
    "Sakaba",
    "Wasagu/Danko",
    "Yauri",
    "Zuru",
  ],
  kano: [
    "Ajingi",
    "Albasu",
    "Bagwai",
    "Bebeji",
    "Bichi",
    "Bunkure",
    "Dala",
    "Dambatta",
    "Dawakin Kudu",
    "Dawakin Tofa",
    "Doguwa",
    "Fagge",
    "Gabasawa",
    "Garko",
    "Garun Mallam",
    "Gezawa",
    "Gaya",
    "Gwale",
    "Gwarzo",
    "Kabo",
    "Kano Municipal",
    "Karaye",
    "Kibiya",
    "Kiru",
    "Kumbotso",
    "Kunchi",
    "Kura",
    "Madobi",
    "Makoda",
    "Minjibir",
    "Nasarawa",
    "Rano",
    "Rimin Gado",
    "Rogo",
    "Shanono",
    "Takai",
    "Sumaila",
    "Tarauni",
    "Tofa",
    "Tsanyawa",
    "Tudun Wada",
    "Ungogo",
    "Warawa",
    "Wudil",
  ],
  kogi: [
    "Ajaokuta",
    "Adavi",
    "Ankpa",
    "Bassa",
    "Dekina",
    "Ibaji",
    "Idah",
    "Igalamela Odolu",
    "Ijumu",
    "Kogi",
    "Kabba/Bunu",
    "Lokoja",
    "Ofu",
    "Mopa Muro",
    "Ogori/Magongo",
    "Okehi",
    "Okene",
    "Olamaboro",
    "Omala",
    "Yagba East",
    "Yagba West",
  ],
  osun: [
    "Aiyedire",
    "Atakunmosa West",
    "Atakunmosa East",
    "Aiyedaade",
    "Boluwaduro",
    "Boripe",
    "Ife East",
    "Ede South",
    "Ife North",
    "Ede North",
    "Ife South",
    "Ejigbo",
    "Ife Central",
    "Ifedayo",
    "Egbedore",
    "Ila",
    "Ifelodun",
    "Ilesa East",
    "Ilesa West",
    "Irepodun",
    "Irewole",
    "Isokan",
    "Iwo",
    "Obokun",
    "Odo Otin",
    "Ola Oluwa",
    "Olorunda",
    "Oriade",
    "Orolu",
    "Osogbo",
  ],
  sokoto: [
    "Gudu",
    "Gwadabawa",
    "Illela",
    "Isa",
    "Kebbe",
    "Kware",
    "Rabah",
    "Sabon Birni",
    "Shagari",
    "Silame",
    "Sokoto North",
    "Sokoto South",
    "Tambuwal",
    "Tangaza",
    "Tureta",
    "Wamako",
    "Wurno",
    "Yabo",
    "Binji",
    "Bodinga",
    "Dange Shuni",
    "Goronyo",
    "Gada",
  ],
  plateau: [
    "Bokkos",
    "Barkin Ladi",
    "Bassa",
    "Jos East",
    "Jos North",
    "Jos South",
    "Kanam",
    "Kanke",
    "Langtang South",
    "Langtang North",
    "Mangu",
    "Mikang",
    "Pankshin",
    "Qua'an Pan",
    "Riyom",
    "Shendam",
    "Wase",
  ],
  taraba: [
    "Ardo Kola",
    "Bali",
    "Donga",
    "Gashaka",
    "Gassol",
    "Ibi",
    "Jalingo",
    "Karim Lamido",
    "Kumi",
    "Lau",
    "Sardauna",
    "Takum",
    "Ussa",
    "Wukari",
    "Yorro",
    "Zing",
  ],
  yobe: [
    "Bade",
    "Bursari",
    "Damaturu",
    "Fika",
    "Fune",
    "Geidam",
    "Gujba",
    "Gulani",
    "Jakusko",
    "Karasuwa",
    "Machina",
    "Nangere",
    "Nguru",
    "Potiskum",
    "Tarmuwa",
    "Yunusari",
    "Yusufari",
  ],
  zamfara: [
    "Anka",
    "Birnin Magaji/Kiyaw",
    "Bakura",
    "Bukkuyum",
    "Bungudu",
    "Gummi",
    "Gusau",
    "Kaura Namoda",
    "Maradun",
    "Shinkafi",
    "Maru",
    "Talata Mafara",
    "Tsafe",
    "Zurmi",
  ],
  katsina: [
    "Bakori",
    "Batagarawa",
    "Batsari",
    "Baure",
    "Bindawa",
    "Charanchi",
    "Danja",
    "Dandume",
    "Dan Musa",
    "Daura",
    "Dutsi",
    "Dutsin Ma",
    "Faskari",
    "Funtua",
    "Ingawa",
    "Jibia",
    "Kafur",
    "Kaita",
    "Kankara",
    "Kankia",
    "Katsina",
    "Kurfi",
    "Kusada",
    "Mai'Adua",
    "Malumfashi",
    "Mani",
    "Mashi",
    "Matazu",
    "Musawa",
    "Rimi",
    "Sabuwa",
    "Safana",
    "Sandamu",
    "Zango",
  ],
  kwara: [
    "Asa",
    "Baruten",
    "Edu",
    "Ilorin East",
    "Ifelodun",
    "Ilorin South",
    "Ekiti Kwara State",
    "Ilorin West",
    "Irepodun",
    "Isin",
    "Kaiama",
    "Moro",
    "Offa",
    "Oke Ero",
    "Oyun",
    "Pategi",
  ],
  nasarawa: [
    "Akwanga",
    "Awe",
    "Doma",
    "Karu",
    "Keana",
    "Keffi",
    "Lafia",
    "Kokona",
    "Nasarawa Egon",
    "Nasarawa",
    "Obi",
    "Toto",
    "Wamba",
  ],
  niger: [
    "Agaie",
    "Agwara",
    "Bida",
    "Borgu",
    "Bosso",
    "Chanchaga",
    "Edati",
    "Gbako",
    "Gurara",
    "Katcha",
    "Kontagora",
    "Lapai",
    "Lavun",
    "Mariga",
    "Magama",
    "Mokwa",
    "Mashegu",
    "Moya",
    "Paikoro",
    "Rafi",
    "Rijau",
    "Shiroro",
    "Suleja",
    "Tafa",
    "Wushishi",
  ],
  rivers: [
    "Abua/Odual",
    "Ahoada East",
    "Ahoada West",
    "Andoni",
    "Akuku-Toru",
    "Asari-Toru",
    "Bonny",
    "Degema",
    "Emuoha",
    "Eleme",
    "Ikwerre",
    "Etche",
    "Gokana",
    "Khana",
    "Obio/Akpor",
    "Ogba/Egbema/Ndoni",
    "Ogu/Bolo",
    "Okrika",
    "Omuma",
    "Opobo/Nkoro",
    "Oyigbo",
    "Port Harcourt",
    "Tai",
  ],
};

function updateLocalGovernmentsOfOrigin() {
  const stateSelect = document.getElementById("stateOfOrigin");
  const lgaSelect = document.getElementById("lgaOfOrigin");
  const selectedState = stateSelect.value;

  // Clear previous options
  lgaSelect.innerHTML = '<option value="">Select Local Government</option>';

  if (nigeriaData[selectedState]) {
    nigeriaData[selectedState].forEach((lga) => {
      const option = document.createElement("option");
      option.value = lga;
      option.textContent = lga;
      lgaSelect.appendChild(option);
    });
  }
}

function updateLocalGovernmentsOfResidence() {
  const stateSelect = document.getElementById("stateOfResidence");
  const lgaSelect = document.getElementById("lgaOfResidence");
  const selectedState = stateSelect.value;

  // Clear previous options
  lgaSelect.innerHTML = '<option value="">Select Local Government</option>';

  if (nigeriaData[selectedState]) {
    nigeriaData[selectedState].forEach((lga) => {
      const option = document.createElement("option");
      option.value = lga;
      option.textContent = lga;
      lgaSelect.appendChild(option);
    });
  }
}

// Select country of residence
$(document).ready(function () {
  const countrySelect = $("#countryOfResidence");

  // Fetch user data from backend
  $.ajax({
    url: `${BACKEND_URL}/users/${user.id}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      const userCountryCode = data.countryOfResidence; // Ensure this key matches the backend response

      // Fetch list of countries from the REST Countries API
      $.ajax({
        url: "https://restcountries.com/v3.1/all",
        method: "GET",
        success: function (countries) {
          countries.forEach(function (country) {
            const countryName = country.name.common;
            const countryCode = country.cca2;
            countrySelect.append(new Option(countryName, countryCode));
          });

          // Set the user's country after the options are loaded
          if (userCountryCode) {
            countrySelect.val(userCountryCode);
          }
        },
        error: function () {
          Swal.fire("Oops...", "Failed to fetch countries data", "error");
        },
      });
    },
    error: function (error) {
      const errorMessage =
        error.responseJSON?.message || "Failed to load user profile.";
      Swal.fire("Oops...", errorMessage, "error");
      console.error("Error fetching profile:", error);
      $("#name").text("Error loading profile");
    },
  });
});

function toggleOtherInput(selectElement) {
  const otherContainer = document.getElementById(
    "other-identification-container"
  );
  if (selectElement.value === "others") {
    otherContainer.style.display = "block";
  } else {
    otherContainer.style.display = "none";
    document.getElementById("other-identification").value = "";
  }
}

// find card by ID
$(document).ready(function () {
  let resubmitId = null;
  let downloadUrl = `${BACKEND_URL}/idcard/download/`;

  function fetchData() {
    $.ajax({
      url: `${BACKEND_URL}/idcard/${user.id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (data) {
        const tableBody = $("#card-table");
        tableBody.empty();

        // Helper function to append a row to the table
        const appendRow = (isDisabled, showPayButton) => {
          tableBody.append(`
    <tr>
      <td>${data.firstname} ${data.lastname}</td>
      <td>${data.phone}</td>
      <td>${data.email}</td>
      <td>${data.status}</td>
      <td>${data.resubmissionAttempts || 0}</td>
      <td>
      <div id="loadingIndicator" style="display: none;">
      <div class="loader"></div>
     </div>
        <div class="dropdown">
          <button class="btn btn-xs btn-action dropdown-toggle" data-bs-toggle="dropdown">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item btn-card-download" data-id="${
                data._id
              }" ${isDisabled ? "disabled" : ""} style="color: green;">
                Download Card
              </button>
            </li>
            <li>
              <button class="dropdown-item view-card-btn" data-id="${
                data._id
              }"  ${isDisabled ? "disabled" : ""}  style="color: blue;">
                View Card
              </button>
            </li>
            ${
              data.status === "Rejected" && data.resubmissionAllowed
                ? `<li><button class="dropdown-item resubmit-card-btn" data-id="${data._id}" data-name="${data.firstname}" style="color: orange;">
                     Resubmit
                   </button></li>`
                : ""
            }
            
             ${
               data.status === "Rejected"
                 ? `<li><button class="dropdown-item delete-card-btn" data-id="${data._id}" style="color: red;">
                 Delete request
               </button></li>`
                 : ""
             }

               ${
                 showPayButton
                   ? `<li><button class="dropdown-item btn-card-pay" data-id="${data._id}">Pay</button></li>`
                   : ""
               }
            
          </ul>
        </div>
      </td>
    </tr>
  `);
        };

        $("#card-status").text(data.status);

        if (data.status === "Rejected" || data.status === "Pending") {
          appendRow(true, false);
        } else if (data.status === "Approved") {
          // Check if payment has been made
          $.ajax({
            url: `${BACKEND_URL}/transaction/${user.id}`,
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            success: function (transaction) {
              if (transaction.length > 0) {
                transaction.forEach((transaction) => {
                  if (transaction.cardId === data._id) {
                    if (transaction.status === "successful") {
                      appendRow(false, false);
                    } else {
                      appendRow(true, true);
                    }
                  }
                });
              } else {
                // No transactions found, append row with pay button
                appendRow(true, true);
              }
            },
            error: function (error) {
              console.error("Error fetching transaction status:", error);
              appendRow(true, true);
            },
          });
        }

        // Attach click event to view-card-btn
        $(document).on("click", ".view-card-btn", function () {
          const cardId = $(this).data("id");
          window.location.href = `id-card-temp.html?id=${cardId}`;
        });

        // Handle card Download
        async function handleDownload(cardId) {
          if (
            !confirm(
              "Warning! Sure you want to download? Click ok to continue or else click cancel. You can only download once."
            )
          ) {
            return;
          }

          try {
            // Show loading indicator
            showLoadingIndicator();

            // Fetch the certificate PDF
            const blob = await fetchCardPdf(cardId);

            // Trigger the download
            triggerDownload(blob, "card.pdf");

            // Notify the user of success
            showSuccessMessage("Card downloaded successfully!");
          } catch (error) {
            // Handle errors
            console.error(error.responseJSON?.message);
            const errorMessage =
              // error.responseJSON?.message || "Failed to download the card.";
              error.responseJSON?.message || "Card Already Downloaded";

            showErrorMessage(errorMessage);
          } finally {
            // Hide loading indicator
            hideLoadingIndicator();
          }
        }

        function fetchCardPdf(cardId) {
          return new Promise((resolve, reject) => {
            $.ajax({
              url: `${downloadUrl}${cardId}`,
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              xhrFields: {
                responseType: "blob",
              },
              success: resolve,
              error: reject,
            });
          });
        }

        // Trigger the download of the PDF file
        function triggerDownload(blob, fileName) {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }

        // Show the loading indicator
        function showLoadingIndicator() {
          const loadingIndicator = document.getElementById("loadingIndicator");
          if (loadingIndicator) {
            loadingIndicator.style.display = "flex";
          }
        }

        // Hide the loading indicator
        function hideLoadingIndicator() {
          const loadingIndicator = document.getElementById("loadingIndicator");
          if (loadingIndicator) {
            loadingIndicator.style.display = "none";
          }
        }

        // Show a success message
        function showSuccessMessage(message) {
          console.log("Success:", message);
          alert(message); // Replace with a toast notification if needed
        }

        // Show an error message
        function showErrorMessage(message) {
          console.error("Error:", message);
          alert(message); // Replace with a toast notification if needed
        }

        // Add click event listeners for download buttons
        $(document).on("click", ".btn-card-download", function () {
          const cardId = $(this).data("id");
          const button = $(this);

          if (cardId) {
            button.prop("disabled", true);
            handleDownload(cardId);
            setTimeout(() => button.prop("disabled", false), 5000); // Optional: Re-enable after 5 seconds
          }
        });
      },

      error: function (error) {
        $("#name").text("Error loading profile");
      },
    });

    // Open resubmission modal
    $(document).on("click", ".resubmit-card-btn", function () {
      resubmitId = $(this).data("id");
      $("#resubmitCardName").val($(this).data("name"));
      $("#resubmitCardModal").modal("show");
    });
    // Submit resubmission
    $("#submitCardResubmission").click(function () {
      const updatedName = $("#resubmitCardName").val();
      if (confirm("Are you sure you want to resubmit?")) {
        $.ajax({
          url: `${BACKEND_URL}/idcard/${resubmitId}/resubmit`,
          method: "POST",
          contentType: "application/json",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify({ firstname: updatedName }),
          success: function () {
            $("#resubmitCardModal").modal("hide");
            fetchData();
          },
          error: function (xhr) {
            console.log(xhr.responseJSON);
            // alert(xhr.responseJSON?.message || "Failed to resubmit request.");
            alert("Failed to resubmit. Maximum resubmission attempts reached");
          },
        });
      }
    });

    // Handle delete card
    function handleDelete(cardId) {
      if (confirm("Are you sure you want to delete this Request")) {
        $.ajax({
          url: `${BACKEND_URL}/idcard/${cardId}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          success: function () {
            Swal.fire("Request", "Successfully Deleted!", "success");
            fetchData();
          },
          error: function (error) {
            console.error("Error deleting request:", error);
          },
        });
      }
    }

    $(document).on("click", ".delete-card-btn", function () {
      const requestId = $(this).data("id");
      handleDelete(requestId);
    });

    //Card Payment
    function initiateCardPayment(cardId) {
      // Retrieve user authentication data
      if (!userData?.token || !userData?.user?.id) {
        Swal.fire("Error", "User authentication failed!", "error");
        return;
      }
      const { token, user } = userData;

      const userId = user.id; // Replace with actual user ID
      const email = user.email; // Replace with actual email
      const amount = 5000; // Replace with actual amount

      if (!token) {
        alert("Please log in to proceed with payment");
        return;
      }
      $.ajax({
        url: `${BACKEND_URL}/transaction/pay`,
        method: "POST",
        contentType: "application/json",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify({ cardId, userId, amount, email }),
        success: function (response) {
          console.log(response);
          if (response.status === 200) {
            window.location.href = response.data.authorizationUrl;
          } else {
            alert("Payment initiation failed!");
          }
        },
        error: function (error) {
          console.error("Error initiating payment:", error.message);
          alert("Failed to initiate payment. Please try again.");
        },
      });
    }

    $(document).on("click", ".btn-card-pay", function () {
      const cardId = $(this).data("id");
      initiateCardPayment(cardId);
    });
  }
  // Initial fetch
  fetchData();
});

// //Get All Transactions
$(document).ready(function () {
  // Track the current page and define the page size
  const currentPage = { value: 1 };
  const pageSize = 10;

  // Utility function to make API requests
  const apiRequest = (
    url,
    method,
    headers = {},
    data = null,
    onSuccess,
    onError
  ) => {
    $.ajax({
      url,
      method,
      headers,
      data,
      success: onSuccess,
      error: onError || ((error) => console.error("API Error:", error)),
    });
  };

  // Update the table with user data
  const updateTable = (data, page) => {
    const tableBody = $("#transaction-table");
    tableBody.empty(); // Clear existing table rows

    // Populate table rows with user data
    data.forEach((item, index) => {
      const rowHtml = `
        <tr>
          <td>${(page - 1) * pageSize + index + 1}</td>
          <td>${item.firstname} ${item.lastname}</td>
          <td>${item.amount}</td>
          <td>${item.email}</td>
          <td>${item.status}</td>
           <td>
           <button class="btn btn-sm verify-btn" 
                    data-id="${item.reference}" 
                    style="background-color: #007BFF; color: #fff">
              verify
            </button>
          </td>
        </tr>`;
      tableBody.append(rowHtml); // Add the row to the table
    });
  };

  // Fetch user data for the current page
  const fetchData = (page) => {
    const url = `${BACKEND_URL}/transaction?page=${page}&limit=${pageSize}`;
    const headers = { Authorization: `Bearer ${token}` };

    apiRequest(url, "GET", headers, null, (response) => {
      const { data, hasNextPage } = response;
      updateTable(data, page);

      $("#prev-btn").prop("disabled", page === 1);
      $("#next-btn").prop("disabled", !hasNextPage);
    });
  };

  // Fetch and display user details in a modern profile modal
  const verifyPayment = (reference) => {
    // Handle Verify Payment button clicks
    const verifyUrl = `${BACKEND_URL}/transaction/verify/${reference}`;

    $.ajax({
      url: verifyUrl,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      success: function (response) {
        console.log(response);
        alert(`Payment verification result: ${response.message}`);
        fetchData(); // Reload to update transaction status
      },
      error: function (error) {
        console.error("Verification Error:", error);
        alert("Failed to verify payment.");
      },
    });
  };

  // Handle view details button clicks
  $(document).on("click", ".verify-btn", function () {
    const reference = $(this).data("id");
    verifyPayment(reference);
  });

  // Handle pagination
  $("#prev-btn").click(function () {
    if (currentPage.value > 1) {
      currentPage.value--;
      fetchData(currentPage.value);
    }
  });

  $("#next-btn").click(function () {
    currentPage.value++;
    fetchData(currentPage.value);
  });

  // Load initial data
  fetchData(currentPage.value);
});

// Function to update the header title based on the current page
function updateHeaderTitle() {
  const path = window.location.pathname;
  const page = path.split("/").pop().replace(".html", "");
  const titleMap = {
    index: "Admin Panel",
    "user-dasboard": "User Dashboard",
    approvals: "Approvals",
    request: "View Certificate Status",
    idcard: "View Card Status",
    "all-request": "View Certificate Request",
    "all-card": "View Card Request",
    citizens: "Members",
    certificate: "Request Certificate",
    profile: "User Account",
    transaction: "Transactions",
    login: "Login",
    card: "Request Card",
  };

  const pageTitle = titleMap[page] || "Dashboard";
  document.title = pageTitle + " | BIRCIIRCIMS";
  document.querySelector(".dashboard_bar").textContent = pageTitle;
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", updateHeaderTitle);
