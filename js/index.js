// const BACKEND_URL = "http://localhost:5000/api";
const BACKEND_URL = "https://identity-management-af43.onrender.com/api";

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

      $(".selectpicker").selectpicker("refresh");

      // Destructure the main fields
      const {
        firstname,
        lastname,
        email,
        middlename,
        phone,
        stateOfOrigin,
        LGA,
        gender,
        DOB,
        membership_no,
        membership_status,
        polling_unit,
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
        stateOfOrigin: stateOfOrigin,
        lga: LGA,
        gender: gender,
        DOB: DOB,
        membership_no,
        membership_status,
        polling_unit,
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
          console.log(response);
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
              }" style="color: blue;">
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
              transaction.map((transaction) => {
                if (transaction.cardId === data._id) {
                  if (transaction.status === "successful") {
                    appendRow(false, false);
                  } else {
                    appendRow(true, true);
                  }
                }
              });
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

$(document).ready(function () {
  // Sample data structure
  const data = {
    ADO: {
      "AKPOGE/OGBILOLO": [
        "OSUDU, OSUDU PLAY GRD",
        "OGBILOLO 1, OGBILOLO PLAY GRD.",
        "AKPOGE, AKPOGE PLAY GRD",
        "OTOKILO, OTOKILO PLAY GRD",
        "OKPATOBOM, OKPATOBOM PLAY GRD",
        "ONWA, ONWA PLAY GRD",
        "OKPAKO, OKPAKO PLAY GRD",
        "OJALLA, MKT SQ.",
        "AJENOWA, PLAY GRD.",
        "ONOGWU, PLAY GRD",
        "ANMETA, PLAY GRD",
        "UMUEZE KOHA, PLAY GRD",
        "EFOHA PLAY GRD.",
        "OGBILOLO II, PLAY GRD",
      ],
      APA: [
        "METHODIST PRI SCHO I, SCH. COMP.APA",
        "R.C.M. SCH. APA, SCH. COMP",
        "APA I MARKETSQ. MARKET SQ.",
        "APA II, OPPOSITE AUSTIN CHEM.",
        "APA III, BY A1-UNAZI PLAY GRD",
        "APA IV BY A1-KPACHO BORE HOLE",
        "APA OGBOZU MARKET SQ.",
        "OKPODO, PLAY GRD",
        "AZIGBILEDE, PLAY GRD",
        "OKPOBILA, MKT SQ.",
        "OGEBE, PRI SCH.",
        "UMUEZEOKA, PLAY GRD",
        "IVEISE, PRI. SCH.",
        "NETH. PRIM. SCH. II SCH. COMP, APA",
        "APA, OKLOBA PLAY GROUND",
        "ALOKWO PLAY GROUND",
        "ONYODUMA PLAY GROUND",
        "VICTORY NUR./PRI. SCH. AL-KPACHO",
        "UNITY SQUARE, NEW JERUSALEM",
        "APA, COMM SEC,SCH APA",
      ],
      EKILE: [
        "OFUNAGA, METH. PRIM. SCHOOL",
        "BY PRIMARY SCHOOL, ATALOGA/NDUKABI",
        "AKPOGE PLAY GROUND",
        "IYOMA I, PLAY GROUND",
        "BY METH. PRIM. SCH., ONYENE",
        "NDIGWE, PLAY GROUND",
        "BY PRIM. SCH. NSIDA-NDIGWE",
        "ODOKEM, PLAY GROUND",
        "METH. PRIM. SCH. ANMEKA EKPUFU",
        "ANMEKA NSIDA, NDOUOBASI MKT. SQ",
        "EGEDE, PLAY GROUND",
        "ALOMO, PLAY GROUND",
        "ONOGWU, PLAY GROUND",
        "IYOMA II, PLAY GROUND",
      ],
      "IGUMALE I": [
        "L.G. CLINIC I, BY CLINIC PRE. IGUMALE I",
        "OTURUKPO, PLAY GROUND",
        "OGONGO, PLAY GROUND",
        "IGAH, PLAY GROUND",
        "A1-AMEH, PLAY GROUND",
        "OSUKPO, PLAY GROUND",
        "OLOKWU, PLAY GROUND",
        "OSABO, PLAY GROUND",
        "OGBEE, PLAY GROUND",
        "L.G. CLINIC II, BY CLINIC PRE. IGUMALE",
      ],
      "IGUMALE II": [
        "CAMP. I, MKT. SQ.",
        "CAMP II, L.G. DISPENSARY",
        "UMU-IGBOKE, PLAY GROUND",
        "UJE-UMUEZOKOHA, PLAY GROUND",
        "UMENYI, PLAY GROUND",
        "ETENYI, MKT SQ.",
        "IKPENGBE, PLAY GROUND",
        "AKPA VILLAGE, PLAY GROUND",
        "MISSION GROUND, PLAY GROUND",
        "CAMP III, MKT. SQ.",
        "WESLEY PRI. SCH. CAMP I",
        "OLE/OKPARA PLAY GROUND",
      ],
      IJIGBAN: [
        "EHAJE, PLAY GROUND",
        "IPOLE I, PLAY GROUND",
        "OGONGO, PLAY GROUND",
        "OBAKOTO METH. PRIM. SCH.",
        "EZZA ODUMOKE, L.G.E.A. SCH.",
        "ONOGWU, PLAY GROUND",
        "UDU-DENYI/NSURA MKT SQ.",
        "NDUBAN, PLAY GROUND",
        "OFFIANKA BY TAX MASTER'S HOUSE",
        "ONUEBOR, PLAY GROUND",
        "ODIREWU/OJABA PRI. SCH.",
        "UGBENYUM MKT SQ",
        "ANMEKA, PLAY GROUND",
        "IPOLE II, PLAY GROUND",
        "OGWAFIYA LGEA PRI. SCH",
        "NSURA TOWN HALL",
        "OLECHO PLAY GROUND",
        "AL-AGBO PLAY GROUND",
        "OJABA IJE PLAY GROUND",
      ],
      OGEGE: [
        "ST JOSEPH PRIM SCH, UDEBO ORIJO",
        "UNWEJE/ALOMO RIJO, L.G.E.A. SCH. RIJO",
        "OKWASI PRIM SCHOOL",
        "UDEBO OGI, PLAY GROUND",
        "ST. MARY'S PRI. SCH. IKPOMOLOKPO",
        "L.G.E.A. PRI. SCH., AYAGA",
        "OGEDEGI UDEGI, PLAY GROUND",
        "LGEA PRIM SCH, UDEBO WATUOLO",
        "AKWACHA, PLAY GROUND",
        "IKPEYI, PLAY GROUND",
        "BY DISPENSARY, CAMP WATUOLO",
        "OLUKPO, PLAY GROUND",
        "OKPIRIGBE, PLAY GROUND",
        "ST JOSEPH PRIM SCH II, PRIM SCH UDEBO ORIJO",
        "OGI PUBLIC SQUARE",
        "OGI KIGBASUKWU",
        "UDEBO ORIJO TOWN HALL",
      ],
      ROYONGO: [
        "UDEBO IGBA, L.G.E.A. PRI. SCH.",
        "IGBORO, PLAYGROUND",
        "UNENYIM, PLAY GROUND",
        "OKETE IGBA, PLAY GROUND",
        "ST. MARY PRI. SCH., AMAGALEME",
        "WUREGO, PLAY GROUND",
        "ADOCHI, PLAY GROUND",
        "UJOL MARKET, MKT SQ.",
        "UDEBO OJENYO, PLAY GROUND",
        "IJOKORO, L.G.E.A. PRI. SCH.",
        "OSILOKO I, MKT. SQ.",
        "OJIJE, PRI. SCH.",
        "WURUKPO, PLAY GROUND",
        "IGEIFE, PLAY GROUND",
        "IKORO PRI. SCH., PRI. SCH.",
        "ISILOKO II, MKT. SQ.",
      ],
      UKWONYO: [
        "UKWONYO WESLEY PRI. SCH. PRI. SCH.",
        "COUNCIL HALL I, BY COUNCIL HALL",
        "ONWEGWE, PLAY GROUND",
        "EFELO, PLAY GROUND",
        "JAGWUE CLINIC, BY CLINIC",
        "RETOREKOR, PLAY GROUND",
        "OJIJE UKWONYO, PLAY GROUND",
        "ST. PAUL SCH., UTONKON TOWN",
        "OKONOJI/AJODE PLAY GROUND",
        "ST. PAUL SCH., HAUSA/IDOMA I",
        "ST. PAUL SCH., HAUSA/IDOMA II",
        "UDEBO, UKWONYO PRI. SCH.",
        "EVE, MKT. SQ.",
        "UKWONYO RICE MILL, BY RICE MILL SQ.",
        "EVENING MKT., MKT. SQ.",
        "GOVT. COLLEGE UTONKON, GOVT COLL.",
        "AGADAGBA, PLAY GROUND",
        "IKPEYI, PLAY GROUND",
        "COUNCIL HALL II BY COUNCIL HALL",
        "NDEKMA PLAY GROUND",
      ],
      ULAYI: [
        "A1-OGA, PRI. SCHOOL (RCM)",
        "EKEBE EBIA, PLAY GROUND",
        "AMEKA ULAYI PLAY GROUND",
        "EKA, PLAY GROUND",
        "EBERA IPOLE I MKT SQR",
        "INIKIRU, MKT. SQ.",
        "UMU-ALUMA, PLAY GROUND",
        "UMUAWO, OPEN SPACE",
        "OGBOLOKUTA, MKT. SQ.",
        "ODUM EFFIUM, MKT. SQ.",
        "OJEGBE CENTRE, PLAY GROUND",
        "EBIA, PRI. SCH.",
        "ULAYI HEALTH CLINIC (L.G. CLINIC)",
        "OKPERE, L.G.E.A. SCH.",
      ],
    },
    AGATU: {
      EGBA: [
        "AILA PRI. SCH. AILA",
        "AILA MKT SQ. I, AILA CENTRE",
        "AILA MKT SQ. II, AILA CENTRE",
        "EGBA PLAY GROUND, EGBA CENTRE",
        "EGBA PRI. SCH., EGBA EAST",
        "EDEJE PRI.SCH. EDEJE VILLAGE",
        "OMIKWIDI PRI. SCH., OMIKWIDI",
        "ADAGBO MKT. SQ. ADAGBO",
        "ABUGBE PRIM SCH - ABUGBE SOUTH",
        "ABUGBE PLAY GROUND - ABUGBE CENTRE",
        "INMINYI, PRI. SCH.",
        "ADANA, PRI. SCH., ADANA TOWN",
        "OLEGEJE, PLAY GROUND",
        "AILA PRIMARY SCHOOL II",
        "AILA MARKET SQUARE I - ETUGEHA CENTER",
        "ADAGBO PRIMARY SCHOOL",
      ],
      ENUNGBA: [
        "ENUNGBA, PRI. SCHOOL",
        "ENUNGBA, PLAY GROUND",
        "OGBANGEDE, PLAY GROUND",
        "ENICHA PLAY GROUND",
        "ENGILA, PLAY GROUND",
        "ELLO, PLAY GROUND",
        "ICHOGOLOGWU, PLAY GROUND",
        "ENUNGBA PLAYGROUND II",
        "OGBANGEDE PRIMARY SCHOOL",
        "ICHOGOLUGWU PRIMARY SCHOOL",
      ],
      OBAGAJI: [
        "OBAGAJI OLD MKT 1 - HAUSA QTRS.",
        "OBAGAJI OLD MKT II, - OLD MKT.",
        "OBAGAJI, PRI. SCHOOL 1",
        "OBAGAJI, PLAY GROUND",
        "OBAGAJI, NEW MKT. 1",
        "OLECHOLOGBA PRI SCHOOL I",
        "OLAGBA PRI. SCH. GISHU",
        "OBISHU, PRI. SCH.",
        "INOLI-OLEGBECHONO, PLAY GROUND",
        "OLEGOCHEPO PLAY GROUND",
        "OLOCHOLOGBA PRI SCHOOLII",
        "OBAGAJI NEW MKT II",
        "OBAGAJI OLD MARKET II",
        "OBAGAJI OLD MKT SQAURE III",
        "ABATA OPEN SPACE",
        "OPEN SPACE ONGBABO UJI",
        "OTUKPO ROAD OPEN SPACE PRIMARY SCHOOL - OBAGAJI",
        "OBAGAJI NEW MARKET SQUARE 1 - ONCHALE OHEBUTELE",
        "OLE-GOGA OPEN SPACE",
        "NEW MARKET SQUARE II - OBAGAJI OBALI CENTRE",
      ],
      ODUBEHO: [
        "ODUGBEHO PRI. SCH.",
        "ODUGBEHO MKT. SQ.",
        "UGBOJU PRI. SCH.",
        "ODEJO PLAY GROUND",
        "ODUGBEHO PRIMARY SCHOOL - OLEGOBIDU",
        "ODUGBEHO MARKET SQUARE - SABON GARI",
      ],
      OGBALU: [
        "OGBAULU PLAY GROUND",
        "OGBAULU PRIMARY SCHOOL",
        "OGBALU MARKET SQUARE",
        "OLEGA BULU PLAY GROUND",
        "OKPEGWA PLAY GROUND",
      ],
      "OGWULE-KADUNA": [
        "OGWULE-KADUNA PRI. SCH.",
        "OGWULE-KADUNA PLAY GROUND",
        "OGWULE-UGBOKPO PRI. SCH.",
        "OKPANCHENYI PRI. SCH.",
        "AKELE PLAY GROUND",
        "EKWO/OKADU (EKWO PLAY GROUND)",
        "OGWULE KADUNA, PRIMARY HEALTH CARE",
        "OLEGENTONU PLAYGROUND",
        "OKPANCHENYI PLAYGROUND",
        "OKADU MARKET SQUARE",
      ],
      " OGWULE-OGBAULU": [
        "OGWULE-OGBAULU PRI. SCH. 1",
        "OGWULE-OGBAULU PLAY GROUND",
        "OGWULE-ANKPA PRI. SCH.",
        "OKPAGABI PRI. SCH.",
        "IBADO PRI. SCH.",
        "EGWUMA PRI. SCH.",
        "AJOMACHI PLAY GROUND",
        "OLEGAGBANE PRI. SCH.",
        "OKWU TANOBE MKT. SQ.",
        "OGBEIGOBA/JERUSALEM (AT OGBEIGOBA P/G)",
        "OGWULE-OGAULU PRI. SCH. II",
        "EGWUMA PLAYGROUND OPEN SPACE",
        "OGWULE OGBAULU PRIMARY SCHOOL II OPEN SPACE",
      ],
      OKOKOLO: [
        "OKOKOLO PRI. SCH. I",
        "OKOKOLO PRI. SCH. II",
        "OKOKOLO MARKET SQUARE",
        "AKWU PRIMARY SCHOOL (AKWU WEST)",
        "AKWU PLAY GROUND",
        "AKPEKE PRIMARY SCHOOL",
        "OCHOLONYA PRIMARY SCHOOL",
        "BANZU OPEN SPACE",
      ],
      OSHIGBUDU: [
        "OSHIGBUDU PRIM. SCH. I",
        "OSHIGBUDU PRIM. SCH. II",
        "AYELE PRIM. SCH.",
        "ENOGAJI PRIM. SCH.",
        "ATAKPA PRIM. SCH.",
        "IGOJE PRIMARY SCHOOL CENTER",
        "OLD MARKET SQUARE OSHIGBUDU",
      ],
      USHA: [
        "USHA PLAY GROUND",
        "USHA PRIM. SCH.",
        "USHA MKT. SQ.",
        "OGWUMOGBO PRIM. SCH.",
        "IKPELE PRIM. SCH.",
        "OGWUFA PLAY GROUND",
        "OWETO PLAY GROUND",
        "UTUGOLUGWU PRI. SCHOOL",
        "EBETE PRIM. SCH.",
        "IGA-GISHU PLAY GROUND",
        "OGAM PLAY GROUND",
        "WARRI PLAY GROUND",
        "OLEIGNAIGWU PLAYGROUND - USHA",
        "EJUMA PRIMARY SCHOOL - EGWUMOGBO",
        "IKPELE GOCHI PRIMARY SCHOOL",
        "OCHELEFU PLAYGROUND OWETO",
        "WARRI PRIMARY SCHOOL",
      ],
    },
    // Add more LGAs, Wards, and Polling Units here
    APA: {
      "APETE/OJANTELLE": [
        "OJANTELLE, MARKET SQUARE I",
        "OJANTELLE, MARKET SQUARE II",
        "OJANTELLE, METHO. PRIMARY SCHOOL",
        "AKPETE MARKET SQUARE",
        "JOS/AKPETE OPEN SPACE",
        "ASABA PLAY GROUND",
        "OMELEMU PLAY GROUND",
        "ATAGANYI PRIMARY SCHOOL",
        "ATAGANYI OPEN SPACE",
        "OJANTALLE NEW MARKET SQUARE",
      ],
      AUKE: [
        "AUKE-IGERI PLAY GROUND",
        "AUKE-IBADO PLAY GROUND",
        "OGEDE - OPEN SPACE",
        "AKPOLOKO/OLOCHEKWU OPEN SPACE",
        "OLOCHEKWU PLAY GROUND",
        "LGEA PRI. SCHOOL, AIJA",
        "AUKE- IBADO OPEN SPACE",
      ],
      "EDIKU I": [
        "UKPOGO PRIM. SCHOOL",
        "UKPOGO OPEN SPACE",
        "IKAMPU II OLOCHOKWUNU PLAY GROUND",
        "OJECHO PLAY GROUND",
        "EDIKWU ICHO PRIM. SCH.",
        "OKWIJI OPEN SPACE",
        "OLADOGA OPEN SPACE",
        "EDIKWU-ICHO OPEN SPACE",
        "IJAHA OPEN SPACE",
        "LGEA PRI. SCH. EDIKWU-OLIJAMU",
        "LGEA PRI. SCHOOL ANGWA",
      ],
      "EDIKU II": [
        "ODUGBO PRIM. SCHOOL",
        "ODUGBO PLAY GROUND",
        "OBINDA PRIM. SCHOOL",
        "OPAHA PRIM. SCHOOL",
        "ANKPALI PRIMARY SCHOOL",
        "ANKPALI OPEN SPACE",
        "OLEKELE PRIM. SCHOOL",
        "EBUGODO OPEN SPACE",
        "ODUGBO OPEN SPACE",
        "OPPOSITE PRY HEALTH CENTRE, OPAHA",
      ],
      "EGA-OKPAYA": [
        "IGAH-OKPAYA MKT. SQR. I",
        "IGAH-OKPAYA MKT. SQR. II",
        "IGAH-OKPAYA MOTOR PARK",
        "IGAH METH. PRIM. SCHOOL",
        "IGAH-ACHEMA OPEN SPACE",
        "OCHEKELE PLAY GROUND",
        "L.G.E.A. PRIM. SCHOOL",
        "OKPOKWU PLAY GROUND",
        "IGAH-OLOGBECHE PLAY GROUND",
        "IGAH-OKPAYA PLAY GROUND",
        "TOWN HALL IGAH-OKPAYA",
        "IGAH-OKAPAYA COMP. HEALTH CENTRE.",
      ],
      IGORO: [
        "OCHICHI MARKET SQUARE",
        "OCHICHI AJI OPEN SPACE",
        "IMANA OPEN SPACE",
        "IJEGE PLAY GROUND",
        "IKADUNA PLAY GROUND",
        "IGORO PRIM. SCHOOL",
        "OLOJO-OTUGUGWU PLAY GROUND",
        "ALAJA/OPANDA MARKET SQUARE",
        "OKPAKACHI PRIMARY SCHOOL",
        "LGEA PRIMARY SCHOOL OGBONOKO",
      ],
      IKOBI: [
        "IKOBI CATH. PRIM. SCH.",
        "IKOBI PRIM. SCHOOL",
        "OLUGWU PLAY GROUND",
        "OLOKE PRIM. SCHOOL",
        "IJAHA PRIM. SCHOOL",
        "UGBOBI PRIM. SCHOOL",
        "IMANA PRIM. SCHOOL",
        "OLOGBA PRIM. SCHOOL",
        "OPE MARKET SQUARE",
        "ENEMUNU PLAY GROUND",
        "OLEGONCHAL OLEGEE OPEN SPACE",
        "LGEA PRI. SCH., AKPANTA",
      ],
      OBA: [
        "ATAKPA PRIM. SCHOOL",
        "OKPENE PRIM. SCHOOL",
        "AKPANIHO PRIM. SCHOOL",
        "AJIBE-AHAJE PLAY GROUND",
        "OLADU PRIM. SCHOOL",
        "EKLA PRIM. SCHOOL",
        "OBA PRIM. SCHOOL",
        "ALIFETI PRIM. SCHOOL",
        "ALIFETI OPEN SPACE",
        "OBA OPEN SPACE",
      ],
      OFOKE: [
        "OFOKE PRIM. SCHOOL",
        "OFOKE MARKET SQUARE",
        "OLE-AKOMONYE OPEN SPACE",
        "OLITODO OPEN SPACE",
        "OGODO OPEN SPACE",
        "OFEKE PLAY GROUND",
        "AMOKE PRIM SCHOOL",
        "OLUFIENE OPEN SPACE",
        "IKOR PLAY GROUND",
        "ST. JOHNS SEC. SCHOOL, AMOKE",
        "IKOR OPEN SPACE",
        "LGEA PRIMARY SCH. OLOJO-OKWOJIA",
      ],
      OIJI: [
        "OIJI PRIM. SCHOOL",
        "OIJI PLAY GROUND",
        "OIJI OPEN SPACE",
        "IDADA PRIM. SCHOOL",
        "IDADA PLAY GROUND",
        "IJOSI PRIM. SCHOOL",
        "IJOSI OPEN SPACE",
        "ANGLICAN PRI. SCH., OIJI",
        "GRADE I AREA COURT, OIJI",
      ],
      UGBOKPO: [
        "ROAD BLOCK",
        "UGBOKPO MKT. SQR. I",
        "UGBOKPO MKT. SQR. II",
        "UGBOKPO MOTOR PARK",
        "UGBOKPO PRIM. SCHOOL",
        "GSS UGBOKPO OPEN SPACE",
        "ADIJA OPEN SPACE",
        "R.C.M. OCHUMEKWU",
        "IJAHA PLAY GROUND",
        "BENIN/KANO PLAY GROUND",
        "KANO PLAY GROUND",
        "METHODIST HIGH SCH. UGBOKPO",
        "AGBOGO OPEN SPACE",
        "OGBEIGOBA OPEN SPACE",
        "AKPULUKA OPEN SPACE",
        "OLOKWU OPEN SPACE",
        "GRACE OF GOD OPEN SPACE",
        "SECRETARIAL OPEN SPACE",
        "LGEA QUARTERS OPEN SPACE",
        "RCM PRIMARY SCHOOL, ADIJA",
        "OCHUMEKWU PLAY GROUND",
      ],
    },

    BURUKU: {
      BENEV: [
        "LGEA SCHOOL, AGUDU",
        "LGEA SCHOOL, SUE",
        "LGEA SCHOOL, IGYU",
        "LGEA SCHOOL, IORZA",
        "LGEA SCHOOL, HAA",
        "LGEA SCHOOL, WUNA",
        "ANGLICAN PRI. SCHOOL, TYOAMBIR",
        "TSE BUMKENG VILLAGE",
        "AGUVE VILLAGE, MBAYEGH OPEN SPACE",
        "TAFI MARKET SQUARE",
        "LGEA SCHOOL BUTER",
        "GBOR MARKET SQUARE",
        "LGEA SCHOOL, YARKWAN",
        "TYOGBENDA WOMBO MARKET SQUARE",
        "LGEA SCHOOL, GBANYAM",
        "LGEA SCHOOL, SEV-AV",
        "LGEA SCHOOL, UGERE",
        "AKYANGBA MARKET SQUARE",
        "GBAAM NURS & PRIMARY SCHOOL",
        "LGEA SCH UDWER",
        "LGEA SCH NYOR",
        "OPEN SPACE NR RCM CHURCH, ANGENA",
        "MBAKYUNDU NUR PRI SCH, ORTESE MBASHIIAN",
        "DOGO MKT SQR",
      ],
      ETULO: [
        "NEAR OTSE ETULO COMP. ETULO",
        "NEAR SINAFI COMPOUND 1-ETULO",
        "NEAR ONGYUDE COMP.-ETULO",
        "ATTA SEC. SCHOOL, ADI I",
        "ATTA SEC. SCHOOL, ADI II",
        "LGEA SCHOOL, ABAKWA",
        "COMMUNITY PRI. SCHOOL, ABAKWA",
        "ADI MARKET SQUARE I",
        "ADI MARKET SQUARE II",
        "LGEA SCHOOL, DAMKOR",
        "LGEA SCHOOL, AKAWA",
        "NEAR SINAFI MODE COMP. II ETULO",
        "COMMUNITY SEC. SCHOOL, OGURUBE",
        "NEAR SIKI COMPOUND - ETULO",
        "ILIM MKT SQR",
        "UBE JSS, OGURUBE",
        "MANDELA MKT SQR",
      ],
      MBAADE: [
        "NEAR TSE TSUE COMP. 1 - MBAGBUM",
        "LGEA SCHOOL, TOFI I",
        "LGEA SCHOOL, TOFI II",
        "LGEA SCHOOL, ANGOUGH",
        "MBAKUMSHI SETTLEMENT",
        "AKUME MARKET SQUARE",
        "LGEA SCHOOL, TYOUGH I",
        "LGEA SCHOOL, TYOUGH II",
        "NEAR TSE TSUE COMP. II - MBAGBUM",
        "LGEA SCH, GBUDU",
        "ANIMA MKT SQR",
        "JOV GBENDA MKT SQR",
        "ASAWA MKT SQR",
      ],
      MBAAKURA: [
        "NEAR JIAGWEI ADAMGBE COMP.-MBALEVA",
        "NEAR TSE NDYORHWER COMP.-MBALEVA",
        "LGEA SCHOOL, ABWA I",
        "ONKASEV MARKET SQUARE",
        "LGEA SCHOOL, SOKPO",
        "ANGBAGBONGUM MARKET SQUARE",
        "UGBEMA MKT. SQUARE I",
        "UGBEMA MKT. SQUARE II",
        "ABUGH TYUMBE MARKET SQUARE",
        "GBELEVE MARKET SQUARE",
        "NEAR TSE HOM AVAAN I",
        "NEAR TSE HOM AVAAN II",
        "ANCHIHA MARKET SQUARE",
        "LGEA SCHOOL, TSE-ALU",
        "NEAR TSE IVAMBE COMP.-MBALEVA",
        "ALAGHA VILLAGE-OPEN SPACE",
        "TYOGBENDA BOOGER MKT SQR",
        "OPEN SPACE NR TSE BAI, MBAMSOLOM",
        "NR TSE AGBERAGBA COMP-MBALEVA",
        "OPEN SPACE NR TSE AKPONGO",
        "DANIELLA DIVINE GRACE NUR PRI SCH, ABWA",
        "TOM GERALD NUR PRI SCH, UGBEMA",
      ],
      MBAAPEN: [
        "TOMAHAR MARKET SQUARE I",
        "TOMAHAR MARKET SQUARE II",
        "OR-EL MARKET SQUARE",
        "TSEGHE MARKET SQUARE",
        "ORTESE MARKET SQUARE I",
        "ORTESE MARKET SQUARE II",
        "LGEA SCHOOL, MBAVIHIN",
        "ANYIASE MARKET SQUARE",
        "KUR MARKET SQUARE I",
        "KUR MARKET SQUARE II",
        "LGEA SCHOOL, TAHAV I",
        "LGEA SCHOOL, IMENGER",
        "LGEA SCHOOL, ISHAN",
        "LGEA SCHOOL, AKURA",
        "NEGE MARKET SQUARE I",
        "NEGE MARKET SQUARE II",
        "LGEA SCHOOL, AYUGHTSE",
        "BURUKU MARKET SQUARE",
        "OPP. BURUKU POLICE STATION",
        "LGEA SCHOOL, FEFA",
        "TYOGBENDA MBAJOR MARKET SQUARE I",
        "TYOGBENDA MBAJOR MARKET SQUARE II",
        "AGRIC TRAINING CENTRE, MBATIE",
        "YASAR MARKET SQUARE",
        "LGEA SCHOOL, ISHOM",
        "LGEA SCHOOL, TORGEMA",
        "UBANGAJI MKT SQR",
        "LGEA SCH, IANNA",
        "TOMBO COMM SEC SCH, BURUKU",
        "PLAY GROUND NR NKST CHURCH, ACHAKU",
        "HON MKT SQR",
        "GBAJAH MKT SQR",
      ],
      MBAATIRYAA: [
        "ANG. PRI. SCHOOL, UGANGESE",
        "LGEA SCHOOL, AKURAGA",
        "NEAR JINGARI COMP. - MBAGUNE",
        "LGEA SCHOOL, AMINDE",
        "IMANDE MARKET SQUARE",
        "LGEA SCHOOL, AKAANYA",
        "LGEA SCHOOL, INYOM",
        "NEAR TSE JABI COMP.",
        "JINGIR MARKET SQUARE",
        "LGEA SCHOOL, CHIA",
        "NEAR AN-OR AMANDE COMP.-MBASAGHER",
        "NEAR TSE GAMBE COMP. - MBASAGHER",
        "LGEA SCHOOL, VONGU",
        "ANATA VILLAGE, ANATA",
        "TSE ATIM JUNCTION",
        "LGEA PRI SCH, MBGEGHA",
        "KAAMEM MKT SQR",
        "LGEA PRI SCH ISHONDOIKYE",
        "LGEA PRI SCH, ANYIASE",
        "LGEA PRI SCH, AWUAPILA",
      ],
      MABAAZAGEE: [
        "LGEA SCHOOL, KER",
        "LGEA SCHOOL, GAI 1",
        "LGEA SCHOOL, LEGHEM I",
        "NYAMATSOR MARKET SQUARE I",
        "NYAMATSOR MARKET SQUARE II",
        "LGEA SCHOOL, HAA I",
        "LGEA SCHOOL, HAA II",
        "LGEA SCHOOL, AJOHOL",
        "ANYIASE MARKET SQUARE",
        "AJOHOL MARKET SQUARE",
        "LGEA SCHOOL, GAI II",
        "AKPU GARRAGE, NYAMATSOR",
        "LGEA PRI SCH, KOZER",
        "HAA MKT SQR",
      ],

      "MBAIYONGO/NYIFON": [
        "LGEA SCHOOL, ANKUNYA",
        "NEAR TSE ABYA COMP. - MBAYEGH",
        "NEAR TSE ISHENGE COMP.",
        "UGA NEW MARKET SQUARE",
        "NEAR TSE KON MBAAKAA",
        "NEAR TSE IORZAR COMP.-MBAYEGH",
        "LGEA SCHOOL, AJIFE",
        "OLD UGA MARKET SQUARE",
        "TOGULA NUR PRI SCHOOL",
        "OPEN SPACE NR NKST CHURCH, ATEOTO",
      ],
      MBAITYOUGH: [
        "TSE WOMBO VILLAGE - OPEN SPACE",
        "LGEA SCHOOL, IGBUR I",
        "LGEA SCHOOL, IGBUR II",
        "ASHIBI MARKET SQUARE",
        "NKST PRI. SCHOOL, AGBONOR",
        "NEAR TSE ALI HIM COMP.-MBATEVA",
        "LGEA SCHOOL, TOUGH",
        "ZUA MARKET SQUARE",
        "LGEA SCHOOL, BUA",
        "LGEA SCHOOL, AKUME",
        "NEAR ZUZU ICHEGH COMP.-MBAASENEKU",
        "DIWA MARKET SQUARE",
        "LEPROSY CLINIC, APAA",
        "OPEN SPACE AT ABANYI KOR JUNCTION",
        "ABIN MKT SQR",
        "GBOUGH MKT SQR, MBATEVA",
        "YEGHER MKT SQR",
        "MT CARMEL NUR PRI SCH, IORTYER",
        "IORNONGO MKT SQR",
        "FADA MKT SQR, MBATSER",
        "TYOGBENDA ZEREMO, MBAMANGE",
        "IYOL CHRISTU NUR PRI SCH, IORGBA",
        "ADAAKU MKT SQR, ASANGE",
      ],
      MBAKYAAN: [
        "SATI MARKET SQUARE",
        "TAVERSHIMA MARKET SQUARE I",
        "TAVERSHIMA MARKET SQUARE II",
        "LGEA SCHOOL, ORAHII I",
        "LGEA SCHOOL, ORAHII II",
        "LGEA SCHOOL, AKURA",
        "LGEA SCHOOL, YEGH",
        "LGEA SCHOOL, AKO I",
        "LGEA SCHOOL, AKO II",
        "UTSOMBI MKT SQR",
        "AKU MKT SQR",
        "IGYUNGU MKT SQR",
        "TOMATAAN MKT SQR",
      ],
      MBAYA: [
        "INGOLOKO MARKET SQUARE",
        "NEAR TSE EMBERGA COMP.-MBAGBAGH",
        "NKST. SCHOOL, TYONZUGHUL",
        "TOMAHAR MARKET SQUARE",
        "LGEA SCHOOL, NYIHEMBA",
        "MZER MARKET SQUARE",
        "LGEA SCHOOL, ADOGO",
        "NEAR TSE-AKPOUGHUL COMP.-MBAGBAGH",
        "LGEA SCHOOL, IKYAAR I",
        "LGEA SCHOOL, IKYAAR II",
        "LGEA SCHOOL, GAJIR I",
        "LGEA SCHOOL, GAJIR II",
        "USEN MARKET SQUARE",
        "LGEA SCHOOL, BILIJI",
        "NEAR CHAHUL GYEGWE COMP.-GBAILIV",
        "MBATEMA NUR PRI SCH, MBAKUNDU",
        "NR NKST NUR PRI SCH, MBANOR",
        "LGEA SCH MBANYADE",
        "OPEN SPACE NR LIVING FAITH CHURCH, ZWA YUGH",
        "TSE ADO MKT SQR",
        "NR NKST CHURCH CHOMBU TAR, MBAJIJA",
      ],
      MBAYAKA: [
        "LGEA SCHOOL, ASHAMENA",
        "AGIR MARKET SQUARE",
        "KAMALU MARKET SQUARE",
        "TOMANYIIN MARKET SQUARE I",
        "TOMANYIIN MARKET SQUARE II",
        "ANSHAV MARKET SQUARE",
        "LGEA SCHOOL, ATEEBE",
        "AWAMBE - MARKET SQUARE",
        "NEAR IORKUMBUR MKOVUR COMP. - UGONDO",
        "MCHINGA MKT SQR",
        "OPEN SPACE NR BOREHOLE, MBASAKA",
        "ANGLICAN NUR PRI SCH, MBAYEM",
        "GANDEIFIAN MKT SQR",
        "ATANYI MKT SQR",
      ],
      SHOROV: [
        "TYOWANYE MARKET SQUARE I",
        "TYOWANYE MARKET SQUARE II",
        "LGEA SCHOOL, ANONGO",
        "NEAR AKPEHE AGBANDE COMP.",
        "NEAR TEMA DANYI COMP.-MBAAV",
        "LGEA SCHOOL, ANEE",
        "ATSEMBER MKE COMP.-MBAKYA",
        "NKST. SCHOOL, GARAGBOUGHUL I, MBAJU",
        "NKST. SCHOOL, GARAGBOUGHUL II, MBAJU",
        "NEAR KYAAN GBAAONDU COMP. - MBAAV",
        "OPEN SPACE NR NKST CHURCH, NONGUN",
        "OPEN SPACE NR NKST CHURCH, SWASE",
        "OPEN SPACE INFRONT OF DOOSHIMA HIGH SCH, TYOWANYE",
        "AGRO SERVICE CENTRE, TYOWANYE",
        "LGEA SCH, TYOWANYE",
        "UBE JSS GARAGBOUGHUL",
      ],
    },

    GBOKO: {
      " GBK/CENTRAL MARKET": [
        "GBOKO MARKET, NR AGBA AGBO COMP.",
        "GBOKO MARKET, MKAR TAXI PARK I",
        "GBOKO MARKET, MKAR TAXI PART II",
        "NEAR DOSSIES COMPOUND",
        "NEAR SHEHU BABAYO COMPOUND",
        "GBOKO CENTRAL, OPP IORTYOM LUGA COMP",
        "LGEA PRIMARY SCHOOL, GBK CENTRAL",
        "POST OFFICE OLD",
        "MARKET SQUARE, YAM",
        "PRIMARY SCHOOL, ST. JOHN'S I",
        "PRIMARY SCHOOL, ST. JOHN'S II",
        "JUNCTION ADINNGI & SUB. TR.",
        "TAZACO, TAZACO SYSTEMS",
        "NR W/SHOP KPAMBER ADURA",
        "GBOKO MARKET, (MKAR TAXI PARK III",
        "NEAR ISHAN HOTEL, ISHAN HOTEL",
        "NR ISAAC KPUM COMP GBOKO CENTRAL",
        "NEAR ULA LISA COMPOUND",
        "SUPER MARKET UNION NO. 22 J.S. TARKA WAY",
        "MKAR PARK",
        "NEAR BABA SHARIFF COMP.",
        "SARKI JAGABA COMPOUND",
        "JOKASE CLINIC",
        "NUT HOUSE",
        "JS TARKA STADIUM",
        "UBE SECOND GATE",
        "NEAR JS TARKA COMPOUND",
        "GATE 2 YAM MARKET",
        "TERDOOFAN INVEST. HOUSE",
        "NEAR CORNERSTONE",
        "NEAR AKIGA HOUSE",
      ],
      "GBOKO EAST": [
        "GBOKO EAST, NR DOMINIC I HUGH COMP",
        "MARKET SQUARE ADEKAA MAIN",
        "HOTEL QUEENS GARDEN I",
        "HOTEL QUEENS GARDEN II",
        "NR AYUA COMP M.O.W.",
        "GBOKO EAST, (NEAR ATSUE ATUNGWA COMPOUND)",
        "GBOKO EAST - NO. 105 TSE MURKPA",
        "GBOKO EAST, NR APER SHINYI COMP",
        "GBOKO EAST, NR GBAFAN COMP",
        "GBOKO EAST, INF. OF MADAM SOCIAL",
        "PRIMARY SCHOOL, ST. PETERS",
        "PRIMARY SCHOOL, NR ANYAMNYIAN COMP",
        "GBOKO EAST, NR ORAFAGA DEM COMP",
        "GBOKO EAST, NR. IYOUGHTA COMP",
        "GBOKO EAST, NR JOHN AWEN COMP",
        "JOS STREET PRIMIER HOTEL",
        "NUR/PRIMARY SCH. GBAA MAKAR",
        "GBOKO EAST, NR IPEVER COMP",
        "GBOKO EAST, NR ATAKPA COMP",
        "GBOKO EAST, NR AYAKPAM COMP",
        "GBOKO EAST, (NEAR YANDEV DZEVER COMPOUND)",
        "GBOKO EAST, NR ANDOOR COMP",
        "GBOKO EAST, (NEAR UKPULU KPISHI COMPOUND)",
        "GBOKO EAST, NEAR REV. FR. MAAER COMP",
        "OPP. S. MARKET, OPP. UNION SUP MARKET",
        "BAR DOOSHIMA (ALMB)",
        "J.S. TARKA WAY - NR ABU FAMILY CLUB",
        "GBOKO EAST - NR IORSHAMBER COMP",
        "GBOKO EAST - NR MAJO AKANDE COMP",
        "GBOKO EAST, NR ABUUL JIJA COMP",
        "GBOKO EAST - BEHIND ACB OPEN SPACE",
        "MKAR ROAD, GSS GBOKO GATE",
        "GBOKO EAST (NEAR TARZA IKYUMBUR COMPOUND)",
        "GBOKO EAST - MADAM KUTA COMP",
        "GUEST HOUSE - NR NATO GUEST INN",
        "GBOKO EAST - NR INNOCENT MOJI COMP I",
        "GBOKO EAST - NR INNOCENT MOJI COMP II",
        "GBOKO EAST, G.S.S. GBOKO - NUR/PRIMARY SCHOOL PREMISES",
        "GBOKO EAST - NR IORTYOM BEBE COMP",
        "CLOSE TO MOUNT ZION CITY NUR/PRI. SCH GBOKO",
        "BEHIND BRISTOW SEC. SCH. GBOKO",
        "MARKET SQUARE II",
        "NOA OFFICE PREMISES GBOKO",
        "NEAR MFATERDOO SCHOOL GBK",
        "OPP. BENUE HOTELS GBOKO",
        "NEAR APER SHINYI COMPOUND II",
        "ST. THERESA CATHOLIC CHURCH GATE RICE MILL",
        "NEAR ISHWA VILLAGE GBOKO",
        "OPEN SPACE NEAR TSE GBEA NOR COMP.",
        "NEAR KANKWE NYAMADI COMPOUND GBOKO",
        "KAAMEM MARKET SQUAREBEHID GENERAL HOSP.",
        "OPEN SPACE NEAR MBAYION INTERNATINAL COLLEGE",
        "TSE MELA DAKA BEHIND NATIONAL",
        "OPEN SPACE NEAR TSE KYAYON VILLAGE",
        "BAR DOOSHIMA (ALMB) II",
        "MGBANGUN AOSUGH",
        "SAHARA",
        "GBOKO EAST MADAM KUTA COMP II",
      ],
      "GBOKO NORTH WEST": [
        "NKST PRIM. SCHOOL - ANZWAR",
        "MARKET SQUARE I- TSE GOON",
        "MARKET SQUARE II - TSE GOON",
        "HIGH LEVEL 1 - TSE ADEKAA",
        "MARKET SQUARE - ANSHANGE APA",
        "NEAR AGA NYHAMIKYUME COMPOUND",
        "LGEA PRIM. SCHOOL - GBUUSHI",
        "MARKET SQUARE - TOMATO",
        "HOTEL (CCD) - NR VIEW POINT",
        "HOSPITAL - NR SS. (NITR)",
        "GBOKO NORTH - NR GYADO VILLAGE",
        "STATION - OPP. TRAFFIC POLICE",
        "GBOKO NORTH - OPP. POLICE FIELD",
        "GBOKO N/WEST (NEAR TSE HOMGBEV COMPOUND I",
        "GBOKO N/WEST (NEAR TSE HOMGBEV COMPOUND II",
        "GBOKO WEST - WUAM GAMBE - COMP. I",
        "GBOKO N/WEST - AGUM COMP.",
        "GBOKO WEST - WUAM GAMBE - COMP. II",
        "RICE MILL - IGBA GAAV",
        "MARKET SQUARE I - ANKYENGE GARAGE",
        "MARKET SQUARE II - ANKYENGE GARAGE",
        "OPP. ADEKAA MKT - NR ULA LISA COMP.",
        "GYADO HOSPITAL ROAD - OPP. GYADO HOSP. GATE",
        "LGEA PRIM. SCHOOL - BUTER",
        "LGEA PRIM. SCHOOL - ANYIMAN",
        "NEAR KUMA LODGE GBOKO",
      ],
      "GBOKO SOUTH": [
        "GBOKO SOUTH (NEAR HANMEZA AGBA COMPOUND)",
        "GBOKO SOUTH - NR ATSUME KUGHIN COMP.",
        "GBOKO SOUTH - NR ORAWASEM COMP.",
        "GBOKO SOUTH INF. OF GASKYIYA - CLINIC",
        "GBOKO SOUTH - NR ANUSA COMP. I",
        "GBOKO SOUTH - NR ANUSA COMP. II",
        "GENERAL HOSP. ROAD - GENERAL HOSPITAL GAVE",
        "MARKET SQUARE - ABAGU",
        "LGEA PRIM. SCHOOL - GBK SOUTH",
        "GBOKO SOUTH - NR ORAKOMBO COMP.",
        "GBOKO SOUTH - OPP. BLUE SISTERS BAR",
        "MARKET SQUARE - TOMAHAR",
        "GBOKO SOUTH - OPP. CENT. POLICE STATION",
        "GBOKO SOUTH - NR MAGSU CINEMA HALL",
        "GBOKO SOUTH (NEAR GBANGER ZONE",
        "GBOKO SOUTH - NR IORKYASE ATULE COMP.",
        "NEAR ANSHA KPAASE COMPOUND",
        "GBOKO SOUTH - NR EDGAR IORSHAGHER",
        "GBOKO SOUTH - NR AHIMBIR CHILE COMP.",
        "GBOKO SOUTH-MBANU, INJAA BUS STOP",
        "GBOKO SOUTH - INF. OF AJANDA HOTEL",
        "GBOKO SOUTH - NR ISHEGH COMP.",
        "NO. 22 MKAR ROAD - MKAR ROAD",
        "GBOKO SOUTH-NEAR DANLADI MAIGARI COMPOUND)",
        "GBOKO SOUTH-NEAR ALH ABUBAKAR BD COMPOUND",
        "GBOKO SOUTH (NEAR ALH. SHAGARI COMPOUND)",
        "GBOKO SOUTH - NR SHEHU BAKO COMP.",
        "GBOKO SOUTH - NOAH VEREGH COMP.",
        "RICE MILL ROAD - VET OFFICE PREMISES",
        "GBOKO SOUTH - NR ISAAC SHAAHU COMP.",
        "GEN HOSP. ROAD - NR TOR TIV GARDEN",
        "GBOKO SOUTH - MYOM HOSPITAL",
        "GBOKO SOUTH - BALA LALOHA COMP.",
        "GBOKO SOUTH - NR AONDOAKAA ORGA COMP.",
        "GBOKO SOUTH - NR TSE ABEKE COMP.",
        "GBOKO SOUTH - MODERN MARKET GBOKO",
        "GBOKO SOUTH COUNCIL CHAMBER",
        "TSE NYAM STREET OPEN SPACE",
        "LGEA PRI. HEALTH CARE GBOKO SOUTH",
        "OPP. HEISTER SUITE GATE",
        "OPP. GBK HIGH SCH. GATE",
        "OPP. NKST CHURCH GBK SOUTH",
        "BAPTIST NUR/PRI. SCH",
        "BEHIND LGA SECRETERIATE GBK",
        "INFRONT OF NANKA TOWN HALL,NANKA STR.",
        "INFRONT OF GARDEN OF GLORY",
        "NEAR SMILES HOSPITAL",
        "MIN. OF EDU. OFFICE GBOKO AREA OFFICE GATE",
        "OPP. CHRIST THE ARK OF SAVATION CHURCH",
        "BESIDE ROYAL HOPITAL ISAAC SHAAHU RD.",
        "NEAR TOFI COMPOUND HOSP. ROAD",
        "FAASEMA STREET. JUNCT. OPP. TOR TIV GARDEN",
        "NEAR SURGO LAB, HOSP, ROAD",
        "OPP. APOSTOLIC NUR./PRI. SCHOOL, KASHIM IBRAHIM",
        "NEAR VICTORY NUR/PRI. SCH. APEFATER STR.",
        "AGBER DIOGO MKT JUNCTION",
      ],
      IGYOROV: [
        "RCM PRIM. SCH. I - NAGA",
        "MSONGUN MARKET SQUARE",
        "MARKET SQUARE - NGUTSAV",
        "MARKET SQUARE - GATIE",
        "LGEA PRIMARY SCHOOL CHIYONGU",
        "RCM PRIM. SCHOOL - USU",
        "MARKET SQUARE - IKYASE",
        "NR NKST CHURCH - MKOVOUR",
        "RCM PRIM. SCHOOL - USUE",
        "MARKET SQUARE - MKOVOUR",
        "NEAR TSE MADUGU VILLAGE",
        "LGEA PRIMARY SCHOOL ABI",
        "NKST. PRIM. SCHOOL - AMBIGHIR",
        "MARKET SQUARE - LIANKU",
        "RCM PRIM. SCHOOL - BAI",
        "MARKET SQUARE I - CHEMBE",
        "LGEA PRIMARY SCHOOL ATSADO",
        "NKST PRIM. SCHOOL - UCHU",
        "OPEN SPACE - NR TYOAKURA OSU COMP.",
        "OPEN SPACE (NEAR ATAMBER ALUAIGBA",
        "BESIDE REDEEMED CHRISTIAN CHURCH ZEMA",
        "NEAR UHON NUR/PRI. SCHOOL",
      ],
      MBAANKU: [
        "MARKET SQUARE - MBAGELE",
        "LGEA PRIM. SCHOOL - YOHOL",
        "LGEA PRIM. SCHOOL - YAHIM I",
        "LGEA PRIM. SCHOOL - YAHIM II",
        "MBAANKU - NR TIVKAA I COMP.",
        "MBAANKU - NR TIVKAA II COMP.",
        "MBAANKU NEAR TSE MANTA",
        "MARKET SQUARE - TYOADO I",
        "MARKET SQUARE - TYOADO II",
        "MARKET SQUARE - NDUR",
        "RCM PRIM. SCHOOL - IORJAA",
        "MARKET SQUARE - PIKA",
        "MARKET SQUARE - UKULUGH",
        "MARKET SQUARE - UJON",
        "OPEN SPACE - TSEHE IGYUNGU",
        "LGEA PRIM SCH. ORNGU DWEM",
        "MBAANKU - NR AKERA NAMBE COMP.",
        "MBAANKU - NR SHIRGA COMP.",
        "MBAANKU - AZAGA VILLAGE",
        "MARKET SQUARE - ABAV UGEDE",
        "MARKET SQUARE WANINDYER",
        "MBAANKU - TAKPI VILLAGE",
        "LGEA PRIM. SCHOOL - AKYUMBUR",
        "MARKET SQUARE IEEKU",
        "MARKET SQUARE ABAGEN",
      ],
      "MBAA VARAKAA": [
        "NEAR TSE VISHIGH COMPOUND",
        "LGEA PRIMARY SCHOOL ZAKI",
        "MARKET SQUARE - ANIKPENGER I",
        "MARKET SQUARE - ANIKPENGER II",
        "NEAR IANGE ZUZO COMPOUND",
        "NEAR IANGE ZUZO COMPOUND II",
        "MARKET SQUARE - ACHIDAM",
        "MARKET SQURE MBAMANGEDA ATELU",
        "MARKET SQUARE - NEGE",
        "LGEA PRIMARY SCHOOL AGERA",
        "SAINT ANTHONY SECONDARY SCHOOL CHILEMO",
      ],
      MBADAM: [
        "LGEA PRIM. SCHOOL - CHAHU",
        "LGEA PRIM. SCHOOL - IMBUA",
        "MARKET SQUARE INIENGE",
        "MARKET SQUARE NGIBO",
        "MARKET SQUARE ZELGEN",
      ],
      MBADIM: [
        "LGEA PRIM. SCHOOL - ZEGE",
        "MBADIM, AGBADU IYAR COMP.",
        "MARKET SQUARE - LUGA",
        "LGEA PRIM. SCHOOL - FOGA",
        "LGEA PRIM. SCHOOL - VAASE",
        "LGEA PRIM. SCHOOL - KUMBUR",
        "MBADIM - NR AGBUM AWANGE COMP.",
        "LGEA PRIM. SCHOOL - AVERVOR",
        "LGEA PRIM. SCHOOL - AKPENEMBER",
        "RCM PRIM. SCHOOL - AJO",
        "NKST. PRIM. SCHOOL - GWAR",
        "PRIM. SCHOOL - DEMEGO",
        "LGEA PRIM. SCHOOL - KORVE",
        "LGEA PRIM. SCHOOL - LOUGH",
        "MARKET SQUARE - IKYUMBUR",
        "LGEA PRIM. SCHOOL - VANAM",
        "LGEA PRIM. SCHOOL - MBAYEM",
        "LGEA PRIM. SCHOOL - DUL",
        "MARKET SQUARE - AKPAGHER I",
        "MARKET SQUARE - AKPAGHER II",
        "LGEA PRIM. SCHOOL - TSE BAAGU",
        "NEAR TSE ANIBIAM COMPOUND",
        "RCM PRIM. SCHOOL - AGIDI",
        "MBADIM - NEAR TSE VISHIGH COMPOUND",
        "MBADIM - NEAR TYOTULE IVUUNGU COMPOUND",
        "MARKET SQUARE - ANIHUNDU",
        "MARKET SQUARE TYOKIGHIR",
        "MARKET SQUARE - IGBESUE",
        "LGEA PRI. SCH. KUKWA",
        "AJAM MARKET SQUARE",
        "OPP. LGEA PRI SCHOOL, KWAGHCHIMIN",
        "OPP. NKST IORNYEGHEN",
        "APINE GBFAN (MARKET SQUARE LOUGH)",
        "KAAMEM PRI. SCHOOL GATE",
        "OPP. AKPAGHER YAM MARKET SQUARE",
        "NEAR SAINT PETERS CHURCH UKYAVER",
        "IN FRONT OS ST. JOHNS CHURCH NUMPEV",
      ],
      MBAKPER: [
        "MBAKPER - GTC MKAR GATE I",
        "MKAR GATE II",
        "MBAKPER - NR ORPHANAGE HOME",
        "SCHOOL - NURS & MIDW I",
        "SCHOOL - NURS & MIDW II",
        "MARKET SQUARE - ORTESE I",
        "GATE - KCC MKAR I",
        "GATE - KCC MKAR II",
        "FIELD - MKAR DEM",
        "MARKET SQUARE - ORTESE II",
        "PREMISES - BESIDE RTCN",
        "NKST. PRIM. SCHOOL - AKAAJIME",
        "NEAR ALI, ABIE COMPOUND",
        "COLLEGE - TOFI, MEMORIAL",
        "NEAR AHAMBE GYAKPA COMPOUND",
        "NEAR HIIM AHOBIAM COMPOUND",
        "MARKET SQUARE - ANIKYOV",
        "LGEA PRIM. SCHOOL - AKAA",
        "MARKET SQUARE - TOMANYIIN I",
        "NKST. PRIM. SCHOOL - ABANGER",
        "MARKET SQUARE - TOMANYIIN II",
        "LGEA PRIM. SCHOOL I - ADUUV",
        "LGEA PRIM. SCHOOL II - ADUUV",
        "LGEA PRIM. SCHOOL - AMBOR",
        "LGEA PRIM. SCHOOL - TSE NYAJO",
        "LGEA PRIM SCHOOL - IKPAIVUUNGU",
        "NKST PRIM. SCHOOL, AMERA",
        "NKST. PRIM. SCHOOL - AKERAN",
        "NKST PRIM. SCHOOL, VANDE",
        "NKST PRIM. SCHOOL - ANYONGU",
        "NEAR IHIL INJA COMPOUND",
        "NKST. PRIM. SCHOOL I - TSE KAGHER",
        "OPEN SPACE MBAGBON",
        "NEAR AWANNGBA COMPOUND",
        "BESIDE NKST CHURCH MBAAMANDEV",
        "NKST PRIM. SCHOOL - AGUJI",
        "RCM PRIM. SCHOOL. 1 - BUA I",
        "IN FRONT OF CREATIVITY NURSERY AND PRIMARY SCHOOL GATE",
        "LGEA PRIM. SCHOOL - TOR-AJILA",
        "LGEA PRIM. SCHOOL - ADOOR",
        "SNR STAFF QUARTERS GATE - BCC PLC - MKAR",
        "NEAR GBAZAN COMPOUND",
        "LEGEA PRIM. SCH. IKPAVNGU",
        "MARKET SQUARE - MASEJE",
        "OPEN SPACE - ADUE JOV COMP.",
        "OPEN SPACE - TSE IGBOKO COMP.",
        "OPEN SPACE - AYILA-KOR",
        "OPPOSITE OPEN SPACE TSE-USEN",
        "NKST SCH. OF HEALTH TECH. GATE MKAR",
        "NEAR HARRY PASS POLYTHECNIC GATE",
        "TOMANYIN MARKET SQUARE",
        "BNARDA OFFICE PREMISES AKAAJIME",
      ],
      MBAKWEN: [
        "MARKET SQUARE - IKPA I",
        "MARKET SQUARE - IKPA II",
        "MARKET SQUARE - MNGBANNGUN",
        "MARKET SQUARE - LUGA I",
        "MARKET SQUARE - LUGA II",
        "MBAKWEN - NR TSE AZA COMP.",
        "MBAKWEN - NR TSE IYORSHAGHER",
        "MARKET SQUARE - ASUKO",
        "MARKET SQUARE - ISHUWA",
        "NR VILLAGE - MOZE",
        "MARKET SQUARE - AGBUM AWAGBE",
        "MARKET SQUARE - AGAYO",
        "MARKET SQUARE - ANDE",
        "MARKET SQUARE - AUMAZWA",
        "MARKET SQUARE - IKPENGER",
        "MARKET SQUARE - GUNDU",
        "MARKET SQUARE - KUHWA",
        "MARKET SQUARE - TOM-ATAR",
        "MARKET SQUARE - AGANYI",
        "GSS - IKPA",
        "MBAKWEN - NR TSE-VOR AZEMBE",
        "MBAKWEN - NR ACHA COMP.",
        "MARKET SQUARE WO HYEV",
      ],
      MBATAN: [
        "LGEA PRIMARY SCHOOL MBAAMAN",
        "MBATAN - NR TSE AWUHE COMP.",
        "MARKET SQUARE - APINE I",
        "NEAR TSE AJO COMPOUND",
        "LGEA PRIM. SCHOOL - IGBE",
        "LGEA PRIM. SCHOOL. ANKUM",
        "MARKET SQUARE - IGYULA",
        "LGEA PRIMARY SCOOL ANUM",
        "MARKET SQUARE - APINE II",
        "MBATAN - NR CHONGON COMPOUND",
        "OPP. CHURCH NKST AIKIE",
        "IGBOHO MARKET SQUARE",
        "NORMADIC PRIMARY SCHOOL IGYULA",
      ],
      MBATSER: [
        "LGEA PRIM. SCHOOL - ANDE",
        "MBATSER - NR NYIETAGHER AGA COMP.",
        "MBATSER - NR TSE AJAV COMP.",
        "MARKET SQUARE - MKANAN",
        "LGEA PRIM. SCHOOL - AKUME",
        "NR COMP. - TSE-ORYA",
        "NURS/PRIM. SCHOOL - AGI",
        "LGEA PRIM. SCHOOL - BUNDE",
        "LGEA PRIM. SCHOOL - AKPEHE",
        "NEAR TSE-AMEE COMPOUND",
        "GBOKO COLLEGE OF EDUCATION",
        "MARKET SQUARE ATONKO",
        "OPP. TSE YAGA COMPOUND, MBATSER",
        "OPPOSSITE NKST CHURCH ANGUTA",
        "YION DAY SECONDARY SCHOOL",
        "MARKET SQUARE BUNDE",
      ],
      MBATYU: [
        "RCM SCHOOL - AGBILE",
        "MARKET SQUARE - MKE",
        "NEAR-NRATOTO ;YATAR COMPOUND",
        "NEAR - AZAKPE AKWANYA COMPOUND",
        "MARKET SQUARE - IHUNGWANOR",
        "LGEA PRIM. SCHOOL - TSE-NEGE",
        "NEAR - TSE GBILA COMPOUND",
        "NEAR - TSE INDYER COMPOUND",
        "LGEA PRIM. SCHOOL - TSE-KUCHA",
        "LGEA PRIM. SCHOOL - ATUUL",
        "MARKET SQUARE - ANDE",
        "RCM PRIM. SCHOOL - TYODUGH",
        "LGEA PRIM. SCHOOL - ABAVER",
        "GANDO MARKET SQUARE",
        "MARKET SQUARE - TSE KUCHA",
        "NEAR ANGWE ANUM COMPOUND",
        "FACTORY - BCC PLC SIGNBOARD",
        "BCC PLC - GAAV YAJI STREET I",
        "BCC PLC - GAAV YAJI STREET II",
        "LGEA PRIMARY SCHOOL MKILIM DOKI",
        "GBILA MARKET SQUARE",
        "MBATYU COUNCIL CHAMBER",
        "NKST PRIMARY SCHOOL IVO MKPE",
        "TSE KAA COMMUNITY SQUARE",
      ],
      UKPEKPE: [
        "LGEA PRIM. SCHOOL - AMUA",
        "NEAR TSE INJE COMPOUND",
        "MBAKATU PRI. HEALTH CARE",
        "LGEA PRIM. SCHOOL - ISHOM",
        "NEAR TSE-SHIE COMPOUND",
        "OPP. BENUE CEMENT FACTORY ESTATE",
        "LGEA PRIM. SCH. KUHWA",
        "LGEA PRIM. SCHOOL - HULE",
        "MARKET SQUARE PADA",
        "LGEA PRIM. SCHOOL MBAAMENGE",
        "LGEA PRIM. SCHOOL - SHENGE",
        "NEAR ANUM AYATI COMPOUND",
        "NEAR TSE ADAMATE I COMPOUND",
        "NEAR TSE ADAMATE COMPOUND",
        "ANDOR MARKET SQUARE",
      ],
      "YANDEV NORTH": [
        "NEAR APEINUMBU COMPOUND",
        "NEAR MBALUKA COMPOUND",
        "MARKET SQUARE - TYEKU",
        "CHRISTIAN REFORMED INST. - ANA AMBER",
        "NEAR KUSUV COMPOUND I.",
        "MARKET SQUARE - MAANA",
        "LGEA PRIM. SCHOOL - GBACHA",
        "YANDEV - BANK OF THE NORTH",
        "NEAR KUSUV COMPOUND II.",
        "MARKET SQUARE ANKUU",
        "LGEA PRIM SCH MBACHII",
        "NEAR NKST CHURCH SHIDI",
        "TOMATAAN MARKET SQUARE",
        "MARKET SQUARE TSE-UGUM",
        "LGEA PRIMARY SCHOOL ORPIN",
      ],
      "YANDEV SOUTH": [
        "NKST. PRIM. SCHOOL - GENYI",
        "RCM PRIM. SCHOOL. - MBADEDA",
        "QUARTERS - DZOMON",
        "LGEA PRIM. SCHOOL - OR",
        "NKST PRIM. SCHOOL, BURUKU",
        "NEAR- TSE AKEME COMPOUND",
        "ST. JOHN PRIM. SCHOOL VENDE",
        "LGEA PRIM. SCHOOL - NOR",
        "LGEA PRIM. SCHOOL - AKOVOR",
        "RCM PRIM. SCHOOL - KYADO I",
        "NEAR AUL-MKU COMP. - KYADO II",
        "NEAR UCHI CHI COMPOUND-YANDEV SOUTH",
        "OPPOSITE NKST PRI. SCH GENYI",
        "TARUKPE MARKET SQUARE",
        "BEHIND NKST PRIMARY SCHOOL GENYI",
        "OPPOSSITE RCM CHURCH MBADEDA",
        "LGEA PRIMARY SCHOOL TSEYATYO",
        "LGEA PRI. SCH GBACHA",
      ],
    },

    GUMA: {
      ABINSI: [
        "ABINSI CENTRAL LGEA PRIM. SCHOOL",
        "ANKWA VILLAGE PLAY GROUND",
        "GRADE II AREA COURT - ABINSI",
        "LG. DISPENSARY - ABINSI",
        "NEAR IKYEREVE COMPOUND - BENCO",
        "DOGOLAMBA - KABAWA COMPOUND",
        "NDA-MADU COMPOUND",
        "NKST OPEN SPACE-ORNEAREA",
        "MAKERA OPEN SPACE IMAM STREET",
        "NTA VIEW CENTER",
        "ATIWAKOR TSOFON KASUWA",
        "RAHAWA OPEN SPACE",
        "AFYIFE ROGO ANGWAN ZUDOR",
      ],
      KAAMBE: [
        "AGASHA I - LGEA PRIM. SCHOOL AGASHA",
        "AGASHA II - AGASHA MARKET SQUARE",
        "NEAR ANGORUGH COMPOUND",
        "AZOM - LGEA PRIM. SCHOOL - AZOM",
        "GBERIKON COMPOUND",
        "IKYOR - LGEA PRIM. SCHOOL IKYOR",
        "MBAGBAAV COMPOUND",
        "NEAR ORTSERGA COMPOUND",
        "TYULEN I - LGEA PRIM. SCHOOL TYULEN",
        "TYULEN II - TYULEN MARKET SQUARE",
        "TSE-JOO COMPOUND",
        "TSE-ALASHI COMPOUND",
        "TSE AZER IWEV",
        "UHEMBE BAAKI COMPOUND",
        "GSS AGASHA",
        "DEMAYOOSU COMPOUND",
        "COMPREHENSIVE HEALTH CARE CENTER AGASHA",
        "TSE FOGA COMPOUND",
        "TSE ANBUA COMPOUND",
      ],
      MBABAI: [
        "ABIGE MARKET SQUARE",
        "ATONGO COMPOUND",
        "GWABO - LGEA PRIM SCHOOL, GWABO",
        "IMANDE UTIME COMPOUND",
        "MBAGWA I - HAAGA COMPOUND",
        "MBAGWA II - MKPE AYAKU COMPOUND",
        "MBAGWA III - CHIA MKENA COMPOUND",
        "ORTSEGA COMPOUND",
        "SHIMJE TARKENDE - TSE DAUDU",
        "TSE-WURA I - LGEA PRIM. SCHOOL, WURA",
        "UIKPAM I - LGEA PRIM. SCHOOL - UIKPAM",
        "UIKPAM II - UIKPA MARKET SQUARE",
        "TSE-WURA II",
      ],
      MBADWEN: [
        "ANGUR COMPOUND",
        "ANGYOM COMPOUND",
        "ANINGE - LGEA PRIM. SCHOOL. ANINGE",
        "ASANGABAR - LGEA PRIM. SCHOOL. ASANGABAR",
        "BUA DYU - IMANDE, NEAR BUA COMPOUND",
        "INGBANKYOR - LGEA SCHOOL - INGBANKYOR",
        "TORKULA I - LGEA PRIM. SCHOOL - TORKULA",
        "TORKULA II - LGEA PRIM. SCHOOL - TORKULA",
        "TORKPANDE - LGEA PRIM SCHOOL, TORKPANDE",
        "UMENGER I - LGEA PRIM. UMENGER",
        "UMENGER II - UMENGER MOTOR PARK",
        "ZANZAN ABIGWA COMPOUND",
        "UGEH-IFU COMPOUND",
        "NEAR IORTYOM DURA COMPOUND",
      ],
      MBAWA: [
        "ALI AGUDU - LGEA PRIM. SCHOOL, - ALI AGUDU",
        "ANKUNGU COMPOUND",
        "AYEM COMPOUND",
        "CHIA NYAM COMPOUND",
        "DAUDU - RCM SCHOOL, DAUDU",
        "GBANDE GBE COMPOUND",
        "GBANDE UPELE - TSE GBANDE COMPOUND",
        "HUMBAOR AGER - LGEA PRIM. HUMBAOR AGER",
        "IGBAHINA COMPOUND",
        "INUNDU - LGEA PRIM. SCHOOL. INUNDU",
        "NYIOR AKA COMPOUND",
        "TSE IHOM COMPOUND",
        "TSE AVINE - LGEA PRIM. SCHOOL. AVINE",
        "TSE IORSHE COMPOUND",
        "TSE YEV COMPOUND",
        "TSE TYONDON COMPOUND",
        "TYOHEMBE - LGEA SCHOOL, TYOHEMBE",
        "DAUDU SOUTH NKST DAUDU",
        "MBAWA COMMUNITY SCHOOL DAUDU",
        "AGRIC AGRO SERVICE CENTER DAUDU",
      ],
      "MBAYER/YANDEV": [
        "ADAYI - LGEA PRIM. SCHOOL, ADAYI",
        "AMUA HEALTH CLINIC",
        "HAGHER COMPOUND",
        "IKPEN - TSE-IKPEN COMPOUND",
        "IKYOR GBISHA COMPOUND",
        "MAKONDO - LGEA PRIM. SCHOOL., MAKONDO",
        "MBADEV - RCM SCHOOL, UHEMBE",
        "MBAAVONGU - LGEA KULAYEMEN",
        "MBAWURA - IGYOROUGH COMPOUND",
        "SARWUAN - LGEA SCHOOL, SARWUAN",
        "TSE BEEKU - LGEA SCHOOL, BEEKU",
        "TSE KELEKE COMPOUND",
        "TSE KPANYER - KPANYER MARKET SQUARE",
        "YOGBO I - LGEA SCHOOL, YOGBO",
        "YOGBO II - YOGBO MARKET SQUARE",
        "ZEGEOR INUNDU MARKET SQUARE",
        "MBAGBEOR - TSE UKER COMPOUND",
        "YOGBO MOTOR PARK",
        "UHEMBE - LGEA SCHOOL, UHEMBE",
        "TSE GOON COMPOUND",
      ],
      NYIEV: [
        "AGBOUGH COMPOUND",
        "TSE HIRNYAM COMPOUND",
        "TSE IHO COMPOUND",
        "TSE IKYOON COMPOUND",
        "INIONDU COMPOUND",
        "TSE IVAAN COMPOUND",
        "KIDAM - TSE ANGUR COMPOUND",
        "TSE MAGUN COMPOUND",
        "MBACHOHON BAPTIST SCHOOL, UDEI",
        "MBAKULAYEM I - TSE LIM COMPOUND",
        "MBAZUGBE I - TOWN HALL UDEI",
        "MBANYAM - NKST. SCHOOL, GYUNGU",
        "MOM - LGEA SCHOOL, MOM",
        "NGBAN - LGEA SCHOOL, NGBAN",
        "OROGBO - TSE OROGBO COMPOUND",
        "PEVIKYAA - ALU AMOUGH COMPOUND",
        "TSE - AMA - LGEA SCHOOL, TSE-AMA",
        "TSE DAV - DAV COMPOUND",
        "TSWAREV - LGEA SCHOOL, IKYAA",
        "ZAYOL - TSE ZAYOL COMPOUND",
        "ULOHOL COMPOUND",
        "YELEWATAR - RCM SCHOOL, YELEWATAR",
        "MBAZUGBE II",
        "MBAKULEYEM II",
        "TSE PEM COMPOUND",
        "TSE ANSHONGU LGEA SCHOOL",
        "TSE KYOGEN COMPOUND",
        "KINGA UPAA SACRED HEART",
        "TSE TATYOUGH ABUGHUL CPD",
      ],
      NZOROV: [
        "AGBAKA - LGEA SCHOOL, AGBAKA",
        "AHENTSE - LGEA SCHOOL, AHENTSE",
        "AKO - LGEA SCHOOL, AKO",
        "AKOR VILLAGE PLAY GROUND",
        "LG. DISPENSARY GBAJIMBA",
        "IORDYE - LGEA SCHOOL, IORDYE",
        "SHAMIOR AREA",
        "TOM ANYIIN MARKET SQUARE",
        "TSE BAKO COMPOUND",
        "TSE KYEGH COMPOUND",
        "TSE ORMEGHA COMPOUND",
        "TSE SHIRSHA COMPOUND",
        "TSOFON KASUWA - OLD MARKET - GBAJIMBA",
        "KONDOM - TSE KONDOM COMPOUND",
        "SHAMIOR II COLLEGE OF EDU.",
        "TSE ORTOM VILLAGE ORTOM",
        "KWAGHNGU MARKET SQUARE",
        "TSE IYORHON VILLAGE",
        "TSE BAKO LOGO II",
        "GOVT.SCI.&TECH.COLLEGE GBAJ",
      ],
      SAGHEV: [
        "AIIM - LGEA SCHOOL, AIIM",
        "ANDIAR - LGEA SCHOOL, ANDIAR",
        "IGBENKE - LGEA SCHOOL, IGBENKE",
        "IJOV - LGEA SCHOOL, IJOV",
        "INUMBUR - LGEA SCHOOL, INUMBUR",
        "IKYUAN - LGEA SCHOOL, IKYUAN",
        "ISHAN - LGEA SCHOOL, ISHAN",
        "IWA-NYAJO - LGEA SCHOOL, IWA-NYAJO",
        "KPAV I - LGEA SCHOOL, KPAV",
        "KPAV II - LGEA SCHOOL, KPAV",
        "KPOUGHUL - LGEA SCHOOL, KPOUGHUL",
        "TSE AVIAKA - LGEA SCHOOL, AVIAKA",
        "TSE AKPA - LGEA SCHOOL, AKPA",
        "TSE GINDE - LGEA SCHOOL, TSE GINDE",
        "TSE NYAJO - TSE NYAJO COMPOUND",
        "TSE IKYO - LGEA SCHOOL, TSE IKYO",
        "TSE SHAGBA - LGEA SCHOOL, TSE SHAGBA",
        "TSE TSAVNUM - LGEA SCHOOL, TSE TSAVNUM",
        "TOMATAR I - TOMATAR MARKET SQUARE",
        "TOMATAR II - LGEA SCHOOL, TOMATAR",
        "TSEGHEM COMPOUND",
        "USOUGHUL - LGEA SCHOOL, USOUGHUL",
        "AGENKE - OPEN SPACE",
        "LGEA SCHOOL TSE AN-USU",
        "LGEA SCHOOL BEGHA",
        "LGEA SCHOOL AKURE",
        "NEAR ST MATTHEWS CATHOLIC CHURCH AUNA",
        "LGEA SCHOOL ALUGA",
        "TSE UGBENDE",
        "TSF KASHIN",
        "TSE UTEM LGEA SCHOOL",
        "TSE ABI MARKET SQUARE",
      ],
      UYIR: [
        "ADO COMPOUND",
        "ASOM - LGEA SCHOOL, ASOM",
        "BAM - LGEA SCHOOL, BAM",
        "DUGERI COMPOUND",
        "IJOH - LGEA SCHOOL, IJOH",
        "IORNDIAR - AKUMBA TIZA COMPOUND",
        "IMANDE DEM AREA I",
        "IYE - IYE MARKET SQUARE",
        "KASEYO - LGEA SCHOOL, KASEYO",
        "NYAM UKAA COMPOUND",
        "PAKENA COMPOUND",
        "TSE AKENYI - HEALTH CLINIC",
        "TSE ORVIHI COMPOUND",
        "UHUWE - LGEA UHUWE",
        "UKAA COMPOUND",
        "NEAR USENDA COMPOUND",
        "IMANDE DEM AREA II",
        "ULEVA ALUGA COMPOUND ULEVA",
        "KASEYO II KASEYO MKT. SQUARE",
        "LGEA SCHOOL ANTSO",
      ],
    },

    "GWER EAST": {
      AKPACHAYI: [
        "AINU, LGED SCHOOL",
        "UGBOBA, LGED SCHOOL",
        "AKPACHAYI LGED SCHOOL",
        "AIDI, MARKET SQUARE",
        "IHIEJWO MKT SQ",
        "LGEA PRI SCH, EPWA-ODEHE",
        "NKST SCH ALIADE",
      ],
      "ALADE TOWN": [
        "RCM SCHOOL, ALIADE",
        "ALIADE LGED SCHOOL I",
        "ALIADE LGED SCHOOL II",
        "MBAKINE ROAD ALIADE I",
        "MBAKINE ROAD ALIADE II",
        "MDA HALL, ALIADE",
        "DANCO GUEST HOUSE, ALIADE",
        "PUBLIC SQUARE ALIADE I",
        "PUBLIC SQUARE ALIADE II",
        "PARK & GARDEN, ALIADE",
        "LEPROSY CLINIC ALIADE I",
        "LEPROSY CLINIC ALIADE II",
        "TSE UGO, LGED SCHOOL",
        "KULAVAAN, OPEN SPACE",
        "LELE MARKET SQUARE I",
        "LELE MARKET SQUARE II",
        "ALIADE LGED SCHOOL III",
        "PUBLIC SQUARE ALIADE III",
        "GENERAL HOSP. ALIADE",
        "SHAL MKT SQ",
        "JATO UDUM OPEN SPACE",
        "UBA MKT JUNCTION",
        "APEX NUR/PRI SCHOOL ALIADE",
        "STADIUM ALIADE",
      ],
      GREMACHA: [
        "ADUKU, RCM SCHOOL",
        "UTEE JEMBE, OPEN SPACE",
        "UUSE OPEN SPACE 1",
        "UUSE OPEN SPACE II",
        "UGON OPEN SPACE I",
        "UGON OPEN SPACE II",
        "IORKYAA, OPEN SPACE",
        "ADETSAV, LGED SCHOOL",
        "IGBA APUA OPEN SPACE",
      ],
      IKYOGBAJIR: [
        "TOMATAR MARKET SQUARE",
        "ADUETSAV LGED SCHOOL 1",
        "SAMU, LGED SCHOOL",
        "TSE NUNGWA, OPEN SPACE",
        "AJINE, LGED SCHOOL",
        "UKYARI, MARKET SQUARE",
        "ADUETSAV LGED SCHOOL 2",
        "TSE BAKA OPEN SPACE",
        "LGED SCH MBACHILA",
        "LGED SCHOOL AKPOUGHOL",
      ],
      IKYONOV: [
        "LIJAM MARKET SQUARE I - LIJAM",
        "LIJAM MARKET SQUARE II - LIJAM",
        "RCM SCHOOL SEGHER I - SEGHER VILLAGE",
        "RCM SCHOOL, SEGHER II - SEGHER VILLAGE",
        "JIWUNDE MARKET SQUARE - JIWUNDE",
        "RCM SCHOOL UTURUGH I - UTURUGH VILLAGE",
        "RCM SCHOOL, UTURUGHE II - UTURUGH VILLAGE",
        "RCM SCHOOL, NYAMAGBADU I - NYAMAGBADU",
        "CLAN OFFICE ASHINA I - ASHINA TOWN",
        "CLAN OFFICE SHINA II - ASHINA TOWN",
        "NYAMAGBADU II, RCM SCHOOL",
        "AKPA MBAAFA O.S",
        "TSE ORBUNDE PLAY GROUND",
        "AKPU MKT SQ",
      ],
      MBABUR: [
        "TYOKIGHIR NKST SCHOOL",
        "GYUNGU - RCM SCHOOL",
        "JATO RCM SCHOOL I",
        "JATO RCM SCHOOL II",
        "ASAR - NKST. SCHOOL",
        "CHEEDU - LGED SCHOOL",
        "ABENGA - RCM SCHOOL",
        "HWANDE - NKST SCHOOL",
        "MBAM - MARKET SQUARE",
        "ANKYOCHE LGED SCHOOL",
        "NKST ATOO-AKOH O.S.",
        "ABALI MKT SQ",
        "GYUNGU MKT SQ",
      ],
      MBAIASE: [
        "RCM. SCHOOL - ULLAM - ULLAM",
        "ULLAM MARKET SQUARE - ULLAM VILLAGE",
        "RCM SCHOOL. ZAKI - ZAKI VILLAGE",
        "MBADATYEV - OPEN SPACE",
        "NKST. SCHOOL, DOKI I, DOKI VILLAGE",
        "RCM SCHOOL, ANHWANGE - ANHWANGE",
        "AKOR LGED SCHOOL I",
        "NGURAN RCM SCHOOL I",
        "NGURAN RCM SCHOOL II",
        "ASONGO MARKET SQUARE I",
        "ASONGO MARKET SQUARE II",
        "AKOR LGED SCHOOL II",
        "DOKI NKST SCHOOL II",
      ],
      MBAIKYU: [
        "TYOUGH GYURA - MARKET SQUARE",
        "UVA - RCM SCHOOL",
        "SHANNA I - NKST SCHOOL",
        "NKST SCHOOL SHANNA II",
        "MASE I - LGED SCHOOL",
        "IKPOGHOUR - LEPROSY CLINIC",
        "IGBOR - RCM SCHOOL",
        "ANJA - LGED SCHOOL",
        "IGBOR",
        "MASE II - LGED SCHOOL",
        "RCM SCH MBESE",
        "TINEGENGER O.S",
        "ANSHWA OPEN SPACE",
      ],
      MBAIKYAAN: [
        "KIMBIR RCM SCHOLL",
        "AWARGA, OPEN SPACE",
        "ABUNDE AKOMBO, OPEN SPACE",
        "TARAKU RCM SCHOOL I",
        "TARAKU RCM SCHOOL II",
        "NKST SCHOOL, TARAKU SCHOOL COMP.",
        "LGED SCHOOL, TARAKU, LGED SCHOOL",
        "AGERNOR, RCM SCHOOL",
        "UGEN, RCM SCHOOL",
        "TOMATAR MARKET SQUARE",
        "TARBO LGED SCHOOL I",
        "TARBO LGED SCHOOL II",
        "ABELAJA OPEN SPACE",
        "ADE RCM SCHOOL I",
        "ADE RCM SCHOOL II",
        "AGYITSO OPEN SPACE",
        "TARAKU, CLAN OFFICE",
        "GYARI, OPEN SPACE",
        "APEV, LGED SCHOOL",
        "SEGHER, LGED SCHOOL",
        "UBE JNR SCH TARAKU",
        "PUBLIC S.Q TARAKU",
        "ADAA MKT SQUARE",
      ],
      MBALOM: [
        "RCM SCHOOL, AGANA - AGANA",
        "AYAR - MARKET SQUARE",
        "TSE BEE - OPEN SPACE",
        "TSE GUNDU - OPEN SPACE",
        "HUNDU - LGED SCHOOL",
        "PAKA - MARKET SQUARE",
        "MYENGE - OPEN SPACE",
        "JATO TSWA - RCM SCHOOL",
        "TSE-NEV - OPEN SPACE",
        "WANDOR - NKST. SCHOOL",
        "LGED SCHOOL TSOKAA",
        "RCM SCHOOL ANSHWA",
      ],
      MBASOMBO: [
        "TSE NDYERYO, OPEN SPACE",
        "IKPAYONGO I, MARKET SQUARE",
        "IKPAYONGO II, MARKET SQUARE",
        "GYASEN, OPEN SPACE",
        "ABIEM, RCM SCHOOL",
        "TSE KUHE, OPEN SPACE",
        "AYATI, LGED SCHOOL",
        "IKPAYONGO, CLAN OFFICE",
        "ANCHIHA I, OPEN SPACE",
        "SAAN AKUTSA, OPEN SPACE",
        "AYABO, RCM SCHOOL",
        "ANCHIHA II, OPEN SPACE",
        "AZEM MKT SQ",
        "MOUNT ZION ACADEMY IKPAYONGO",
      ],
      MBAYON: [
        "GBACHE I - MARKET SQUARE",
        "APIR - NKST. SCHOOL",
        "ADOKA - MARKET SQUARE",
        "AKPUTU I - MARKET SQUARE",
        "AKPUTU II - MARKET SQUARE",
        "GBACHE II - MARKET SQUARE",
      ],
      SHOUGH: [
        "JORDOON - OPEN SPACE",
        "CHIHICHAN I - RCM SCHOOL",
        "CHIHICHAN II - RCM SCHOOL",
        "ANGWAR, LGED SCH0OL",
        "TSE BO, OPEN SPACE",
        "USANGE, NKST SCHOOL",
        "NEV I - LGED SCHOOL",
        "AYABO, LGED SCHOOL",
        "HAR I, RCM SCHOOL",
        "HAR II, RCM SCHOOL",
        "NEV II, LGED SCHOOL",
        "NKST UGBA OPEN SPACE",
      ],
      UGEE: [
        "TSE IKYAGH - SPACE SPACE",
        "HOWE I, LEPROSY CLINIC",
        "HOWE II, LGED SCHOOL",
        "GBAGIR, OPEN SPACE",
        "AKPE, NKST SCHOOL AKPE",
        "IGBILA I, LGED SCHOOL",
        "IGBILA II, LGED SCHOOL",
        "AKULEGA, OPEN SPACE",
        "TOMATAR, MARKET SQUARE",
        "TSE GABU, OPEN SPACE",
        "KUEWE, OPEN SPACE",
        "TSE BIAGA, OPEN SPACE",
        "ATSOR, OPEN SPACE",
        "UGESA, PLAY GROUND",
        "HARGA I - LGED SCHOOL",
        "HARGA II - LGED SCHOOL",
        "TYOADAA WAKU, OPEN SPACE",
        "UGEEDE OPEN SPACE",
        "TSE YIASE OPEN SPACE",
      ],
    },

    "GWER WEST": {
      Merkyen: [
        "ATONDIIR - ATONDIIR MARKET SQUARE",
        "UGBEA - LGEA SCHOOL, UGBEA",
        "KULA - KULA MARKET SQUARE",
        "ORMIN - ORMIN COMP.",
        "AJEBE - LGEA SCHOOL, AJEBE",
        "GBINDE - LGEA SCHOOL, GBINDE",
        "TSE ANYANKA-CHUNDA MKT SQR",
      ],
      Mbachohon: [
        "AGAGBE - AGAGBE MARKET SQUARE",
        "NAGI CAMP - NAGI MARKET SQUARE",
        "AJIGBA - NKST. SCHOOL AJIGBA",
        "AGAGBE II - ST. FRANCIS PRI. SCHOOL",
        "ST FRANCIS XAVIER SEC SCH",
        "TSE NYITAR OPEN SPACE",
        "MBAGBISHA-LGEA PRI SCH",
        "MBAZAM-LGEA PRI SCH MBAZAM",
        "EEC CLINIC AGAGBE",
      ],
      Mbapa: [
        "UCHU - TSE UCHU COMP",
        "IKYOGUNDU - IKYOGUNDU COMP.",
        "AKWE - TSE - AKWE COMP.",
        "ATONGO - ATONGO COMP",
        "UDEGHE - TSE-UDEGHE COMP.",
        "AMEE - TSE-AMEE COMP.",
        "MBAAKPE - NKST SCHOOL, MBAAKPE",
        "MBANYAKA-ST JOSEPH SCHOOL",
      ],
      Tijime: [
        "GBABI - NKST. SCHOOL, GBABI",
        "MBASAR - RCM SCHOOL, ALUKA",
        "TOMBO - RCM SCHOOL, TOMBO",
        "ATO - TSE ATO COMP.",
        "AONDOANA - RCM SCHOOL, AONDOANA",
        "TAMEN - NKST. SCHOOL, TAMEN",
        "NEAR TSE-ALOUR COMP.OPEN SPACE",
        "AONDOANA 11-GOVT SEC SCH AONDOANA",
      ],
      Avihijime: [
        "TSE – ACHU – LGEA SCHOOL, ACHU",
        "APENDA – TSE – APENDA COMP.",
        "ANGBAN – ANGBAN COMP.",
        "MTSEKYURAN – TSE MTSEKYURAN",
        "JOR – JOR MARKET SQUARE",
        "AGBO VENGAV-LGEA SCHOOL, AGBO VENGAV",
        "IGBYADI – IGBYADYI OPEN SPACE",
        "LGEA PRI SCH MBAMONDO",
        "CHEGU MKT SQ",
      ],
      "Gbaange/Tongov": [
        "AONDOGBUUSU - AONDOGBUUSU COMP.",
        "IGBAFU - LGEA SCHOOL, IGBAFU",
        "ENGER - LGEA SCHOOL, ENGER",
        "ADUDU - TSE ADUDU COMP.",
        "AJI TSE AJI COMP.",
        "AGBERAGBA - LGEA SCHOOL, AGBERAGBA",
        "IHOO-RCM SCH",
        "ENGER 11-ENGER MRKT SQUARE",
        "GAASE-LGEA SCH GAASE",
      ],
      "Tyoughatee/Injaha": [
        "TEMA - LGEA SCHOOL, TEMA",
        "NEAR AUDU ORYA COMPOUND",
        "MBAIER - RCM SCHOOL, MBAIER",
        "UTIM - UTIM COMP.",
        "GBADUMA - TSE GBADUMA COMP.",
        "GIDAN PEPA - GIDAN PEPA COMP.",
        "MBAKYU-LGEA PRI SCH MBAKYU",
        "NEW NIGERIA-LGEA SCH",
      ],
      "Sengev/Yengev": [
        "TSAVHEMBA - TSAVHEMBA COMP.",
        "CHIKPA - TSE CHIKPA COMP",
        "BUNAKA - BUNAKA MARKET SQUARE",
        "ILIOKO - LGEA SCHOOL, ILIOKO",
        "AGBO GYALUWA - LGEA SCHOOL, GYALUWA",
        "ACHAGH - TSE ACHAGH COMP.",
        "MBAABAJI-MBAABAJI JUNCTION",
        "KPEIRYISA OPEN SPACE",
      ],
      "Saghev/Ukusu": [
        "GOH - LGEA SCHOOL, GOH",
        "IMANDE - RCM SCHOOL, IMANDE",
        "JIMBA - RCM SCHOOL, JIMBA",
        "AHUME - AHUME MARKET SQUARE",
        "IGBAHENA - IGBAHENA COMP.",
        "AGBANU-AGBANU OPEN SPACE",
        "IKYOUGH COMP.OPEN SPACE",
        "AYIMBA/AYAR (YIASE MRKT SQR)",
      ],
      Sengev: [
        "YUHE - TSE - YUHE COMP.",
        "SHIA - TSE - SHIA COMP",
        "ABIAN - ABIAN MARKET SQUARE",
        "MBACHWA - LGEA SCHOOL, MBACHWA",
        "IKYERKYAA - RCM SCHOOL, IKYERKYAA",
        "ABIAN II - ABIAN MARKET SQUARE",
        "KPAR-RCM SCHOOL KPAR",
        "MBADUR-JIKA MARKET SQUARE",
        "IORSHASE-LGEA SCHOOL",
      ],
      Ikyaghev: [
        "UNYO - UNYO COMP.",
        "GBUUSU - GBUUSU COMP.",
        "ATUKPU - NKST SCHOOL, ATUKPU",
        "BODANYI - BODANYI COMP.",
        "SHAAPERA - LGEA SCHOOL, SHAAPERA",
        "ADAGBA - TSE ADAGBA COMP.",
        "ANDE AJAV - ANDE AJAV OPEN SPACE",
        "ABI - ABI COMP",
        "LGEA SCHOOL, NAKA - LGEA SCHOOL, NAKA",
        "DOOGA - LGEA SCHOOL, TSE ALE",
        "NAKA LGEA OFFICE - LGEA OFFICE ADOKA ROAD",
        "UGONDU-LGEA SCH UGONDU",
        "PEACE ACADEMY NAKA",
        "PEACE COLLEGE NAKA",
        "GOVT COMPR SEC SCH NAKA",
        "LGEA PRI SCH AGBAJA",
        "GEN HOSPITAL NAKA",
      ],
      Mbabuande: [
        "IKYANDE - IKYANDE MARKET SQUARE",
        "ACHAI - TSE ACHAI COMP.",
        "ADAWA - ADAWA MARKET SQUARE",
        "UKUMA - NKST. SCHOOL UKUMA",
        "AGBE - TSE AGBE COMP.",
        "KPERAN - LGEA SCHOOL, KPERAN",
        "ANTYAM-TSE ANTYAM COMP",
      ],
      Mbanyamshi: [
        "ATSWERGA - ATSWERGA COMP.",
        "KWEGI - LGEA SCHOOL, KWEGI",
        "UCHOV - UCHOV COMP.",
        "YAYUA - TSE YAYUA COMP",
        "ABENA II - ABENA PLAY GROUND",
      ],

      " Tsambe/Mbasev": [
        "YOGBO - LGEA - YOGBO",
        "DUGERI - LGEA SCHOOL, DUGERI",
        "KUKU - LGEA SCHOOL, KUKU",
        "UDEGU - UDEGU MARKET SQUARE",
        "ABU - ABU COMP.",
      ],
    },

    "KATSINA-ALA": {
      "IKURAV TIEV I": [
        "IKOWE I - IKOWE MARKET SQUARE",
        "IKOWE II - IKOWE MARKET SQUARE",
        "NKST. ANBER SCHOOL/SCHOOL COMPOUND",
        "LGEA SCHOOL NGIBO/SCHOOL COMPOUND",
        "LGEA SCHOOL SORNYI/SCHOOL COMPOUND",
        "ANSHIRA AMAR/NEAR ANSHIRA AMAR",
        "AYUA MARKET I/AYUA MARKET SQUARE",
        "AYUA MARKET II/AYUA MARKET SQUARE",
        "AFAAKAA PRIM. SCHOOL/SCHOOL COMPOUND",
        "TSE ANAWEGH/NEAR TSE ANWEGH COMPOUND",
        "UTYO HOUSE/NEAR UTYO HOUSE",
        "TSE GBER/LGEA SCHOOL PREMISES TSE-GBER",
        "RCM SCHOOL, ORFE/SCHOOL COMPOUND",
        "AFAAKA PRI. SCHOOL II/SCHOOL COMPOUND",
        "OPEN SPACE NEAR NKST CHURCH IORZAA",
        "OPEN SPACE NEAR NKST CHURCH DZEREMO",
        "OPEN SPACE NEAR ST. TITUS CHURCH GBONGBON",
        "OPEN SPACE NEAR DORUWA MARKET SQUARE MBAVEGHER",
        "OPEN SPACE NEAR PRIMARY HEALTH CENTRE NDELE",
        "OPEN SPACE NEAR ST. ANDREW'S CATHOLIC CHURCH CHAVER",
        "LGEA PRIMARY SCHOOL ANGIR",
        "LGEA PRIMARY SCHOOL NOM, AGUNDU",
        "OPEN SPACE NEAR PRIMARY HEALTH CENTRE, AYUA",
        "OPEN SPACE NKST CHURCH IGYEKEM.",
      ],
      "IKURAV TIEV II": [
        "HEMEN DAMSA/NEAR HEMEN DAMSA COMPOUND",
        "TAKOR I/SCHOOL COMPOUND",
        "TAKOR II/SCHOOL COMPOUND",
        "TSE AMINDE/NEAR TSE AMINDE COMPOUND",
        "AKAMBER IKYAREM/AKAMBE IKYAREM COMPOUND",
        "LGEA SCHOOL AMUZEGHER/SCHOOL PREMISES",
        "NKST SCHOOL, TSE YUWA I/SCHOOL PREMISES",
        "NKST. SCHOOL, TSE YUWA II/SCHOOL PREMISES",
        "NKST SCHOOL, ABO/SCHOOL PREMISES",
        "LGEA; AGBER/SCHOOL PREMISES",
        "TSE-SENDE/NEAR TSE SENDE COMPOUND",
        "LGEA AMUZEGHER II/SCHOOL COMPOUND",
        "OPEN SPACE NEAR ST. FRANCIS CATHOLIC CHURCH ZEVER MBAAFAN",
        "OPEN SPACE NEAR ST. PETER'S CATHOLIC CHURCH AONDOAKAA",
      ],
      "IWAR(TONGOV I)": [
        "AMAAFU VILLAGE/AMAAFU MARKET",
        "LGEA SCHOOL, LOKO/SCHOOL COMPOUND",
        "NKST. SCHOOL, IKPAKA/SCHOOL COMPOUND",
        "LGEA SCHOOL ANYIATSE ( SCH. COMPOUND )",
        "KWAZA VILLAGE/KWAZA VILLAGE SQUARE",
        "RCM SCHOOL, TWAR/SCHOOL PREMISES",
        "NUMBEVE VILLAGE (NUMBEVE VILLAGE SQUARE",
        "PAWA VILLAGE/PAWA VILLAGE SQUARE",
        "UNE VILLAGE/UNE VILLAGE SQUARE",
        "IMANDE KURETO/IMANDE SWETTLEMENT",
        "NKST. SCHOOL, ASEN/SCHOOL PREMISES",
        "KEVA VILLAGE/KEVA VILLAGE SQUARE",
        "LOCAL GOVERNMENT CLINIC AKUGH",
        "AMAAFU VILLAGE II/MARKET SQUARE",
        "OPEN SPACE NEAR NKST CHURCH AMAAFU",
        "OPEN SPACE NEAR NKST CHURCH ANJIE",
        "OPEN SPACE NEAR AKU MARKET SQUARE",
        "LGEA PRIMARY SCHOOL IORTSOR",
        "OPEN SPACE NEAR NKST CHURCH UNE",
        "LGEA PRIMARY SCHOOL AMENGER",
        "OPEN SPACE NEAR ABUR NOR VILLAGE SQUARE.",
      ],
      "KATSINA-ALA TOWN": [
        "NKST. ADZEGE I/SCHOOL COMPOUND",
        "NKST. ADZEGE II/SCHOOL COMPOUND",
        "RCM ST. JOHN SCHOOL/SCHOOL COMPOUND",
        "CENTRAL PRI. SCHOOL, K/ALA I (SCH. COMPOUND",
        "CENTRAL PRI. SCHOOL, K/ALA II (SCH. COMPOUND",
        "LOCAL GOVT. SECRETARIAT/NEAR HEALTH DEPT.",
        "COLL. OF EDUCATION K/ALA I (WITHIN REGISTRY DEPT.",
        "COLL. OF EDUCATION K/ALA II(NEAR SICK BAY.",
        "TSE ABAVER/NEAR TSE ABAVER COMPOUND",
        "AKAANGEE VILLAGE/BEHIND MECHANIC VILLAGE",
        "ADI USU/ADI USU MARKET (AFTER DIVINE LOVE)",
        "GENERAL HOSPITAL - NEAR GEN. HOSPITAL GATE",
        "SATI AGIRIGI/NEAR MARKET SQUARE",
        "IORNENGE ADI/NEAR IORNENGE ADI COMPOUND",
        "GOVT. COLL. K/ALA I ( NEAR FOOTBALL FIELD )",
        "GOVT. COLL. K/ALA II ( FACING GOVT. COLLEGE )",
        "LOW COST HOUSES ( NEAR FORMER NRC SECRETARIAT",
        "ASHIEKAA VILLAGE ( NEAR HEAD BRIDGE TYO-TSAR )",
        "TOWN CLUB I/NEAR LAWN TENNIS COURT",
        "TOWN CLUB II/UNDER MARINA TREES",
        "TOWN CLUB III/TOWARDS LG. GUEST HOUSE",
        "DIVIVISIONAL OFFICE I/NEAR ZONAL OFFICE MIN. OF EDUCATION",
        "DIVISIONAL OFFICE II/NEAR SUB-TREASURY",
        "GBOROYA(IGUNGU ABUA) NORMADIC PRIM. SCHOOL, (IGUNGU ABUA)",
        "LGEA TOWNSHIP SCHOOL/SCHOOL COMP9OUND",
        "ISLAMIC SCHOOL I/SCHOOL COMPOUND",
        "ISLAMIC SCHOOL II/SCHOOL COMPOUND",
        "OLD MAGISTRATE COURT/NEAR CENTRAL MOSQUE",
        "HAUSA WARD I/NEAR LGEA DISPENSARY",
        "HAUSA WARD II/NEAR ALHAJI GAMBO",
        "OTSAAZI VILLAGE/OTSAAZI VILLAGE SQUARE",
        "NYEBE HOUSE/NEAR OTSAAZI VILLAGE",
        "OPEN SPACE NEAR WATER BOARD GATE K-ALA",
        "OPEN SPACE NEAR RCM AKAI CHURCH",
        "OPEN SPACE NEAR NKST CHURCH VIHISHIMA",
        "OPEN SPACE NEAR FOOTBALL FIELD IN FRONT OF CHURCH OF GOD MISSION ROAD",
        "OPEN SPACE NEAR GENERAL HOSPITAL, GENERAL HOSPITAL GATE II.",
        "OPEN SPACE NEAR AKUME ATONGO TOWNSHIP STADIUM",
        "OPEN SPACE NEAR CHURCH OF GOD MISSION TSE MANDE",
        "NOMADIC PRIMARY SCHOOL AGENTSE",
        "OPEN SPACE NEAR ST. PIUS CHURCH TSAVANDE",
        "COLLEGE OF EDUCATION K-ALA WITHIN REGISTRY DEPT II",
        "LGEA PRIMARY SCHOOL AKATA",
        "DIVISIONAL OFFICE NEAR SUB TREASURY",
        "OPEN SPACE NEAR BERANDA MAIN MARKET SQUARE II",
        "OPEN SPACE NEAR BERANDA MAIN MARKET SQUARE I",
        "OPEN SPACE ROYAL COLLEGE K-ALA",
        "OPEN SPACE OLD MAGISTRATE COURT NEAR CENTRAL MOSQUE",
        "ISLAMIC SCHOOL COMPOUND II",
        "LGEA PRIMARY SCHOOL II",
        "OPEN SPACE NEAR NKST CHURCH MOSHI",
        "OPEN SPACE, NEAR NITEL OFFICE K-ALA",
      ],
      MBACHER: [
        "NKST. ADZEGE I/SCHOOL COMPOUND",
        "NKST. ADZEGE II/SCHOOL COMPOUND",
        "RCM ST. JOHN SCHOOL/SCHOOL COMPOUND",
        "CENTRAL PRI. SCHOOL, K/ALA I (SCH. COMPOUND",
        "CENTRAL PRI. SCHOOL, K/ALA II (SCH. COMPOUND",
        "LOCAL GOVT. SECRETARIAT/NEAR HEALTH DEPT.",
        "COLL. OF EDUCATION K/ALA I (WITHIN REGISTRY DEPT.",
        "COLL. OF EDUCATION K/ALA II(NEAR SICK BAY.",
        "TSE ABAVER/NEAR TSE ABAVER COMPOUND",
        "AKAANGEE VILLAGE/BEHIND MECHANIC VILLAGE",
        "ADI USU/ADI USU MARKET (AFTER DIVINE LOVE)",
        "GENERAL HOSPITAL - NEAR GEN. HOSPITAL GATE",
        "SATI AGIRIGI/NEAR MARKET SQUARE",
        "IORNENGE ADI/NEAR IORNENGE ADI COMPOUND",
        "GOVT. COLL. K/ALA I ( NEAR FOOTBALL FIELD )",
        "GOVT. COLL. K/ALA II ( FACING GOVT. COLLEGE )",
        "LOW COST HOUSES ( NEAR FORMER NRC SECRETARIAT",
        "ASHIEKAA VILLAGE ( NEAR HEAD BRIDGE TYO-TSAR )",
        "TOWN CLUB I/NEAR LAWN TENNIS COURT",
        "TOWN CLUB II/UNDER MARINA TREES",
        "TOWN CLUB III/TOWARDS LG. GUEST HOUSE",
        "DIVIVISIONAL OFFICE I/NEAR ZONAL OFFICE MIN. OF EDUCATION",
        "DIVISIONAL OFFICE II/NEAR SUB-TREASURY",
        "GBOROYA(IGUNGU ABUA) NORMADIC PRIM. SCHOOL, (IGUNGU ABUA)",
        "LGEA TOWNSHIP SCHOOL/SCHOOL COMP9OUND",
        "ISLAMIC SCHOOL I/SCHOOL COMPOUND",
        "ISLAMIC SCHOOL II/SCHOOL COMPOUND",
        "OLD MAGISTRATE COURT/NEAR CENTRAL MOSQUE",
        "HAUSA WARD I/NEAR LGEA DISPENSARY",
        "HAUSA WARD II/NEAR ALHAJI GAMBO",
        "OTSAAZI VILLAGE/OTSAAZI VILLAGE SQUARE",
        "NYEBE HOUSE/NEAR OTSAAZI VILLAGE",
        "OPEN SPACE NEAR WATER BOARD GATE K-ALA",
        "OPEN SPACE NEAR RCM AKAI CHURCH",
        "OPEN SPACE NEAR NKST CHURCH VIHISHIMA",
        "OPEN SPACE NEAR FOOTBALL FIELD IN FRONT OF CHURCH OF GOD MISSION ROAD",
        "OPEN SPACE NEAR GENERAL HOSPITAL, GENERAL HOSPITAL GATE II.",
        "OPEN SPACE NEAR AKUME ATONGO TOWNSHIP STADIUM",
        "OPEN SPACE NEAR CHURCH OF GOD MISSION TSE MANDE",
        "NOMADIC PRIMARY SCHOOL AGENTSE",
        "OPEN SPACE NEAR ST. PIUS CHURCH TSAVANDE",
        "COLLEGE OF EDUCATION K-ALA WITHIN REGISTRY DEPT II",
        "LGEA PRIMARY SCHOOL AKATA",
        "DIVISIONAL OFFICE NEAR SUB TREASURY",
        "OPEN SPACE NEAR BERANDA MAIN MARKET SQUARE II",
        "OPEN SPACE NEAR BERANDA MAIN MARKET SQUARE I",
        "OPEN SPACE ROYAL COLLEGE K-ALA",
        "OPEN SPACE OLD MAGISTRATE COURT NEAR CENTRAL MOSQUE",
        "ISLAMIC SCHOOL COMPOUND II",
        "LGEA PRIMARY SCHOOL II",
        "OPEN SPACE NEAR NKST CHURCH MOSHI",
        "OPEN SPACE, NEAR NITEL OFFICE K-ALA",
      ],
      MBAJIR: [
        "NKST. SCHOOL SAI I/SCHOOL COMPOUND",
        "NKST. PRI. SCHOOL SAI II/SCHOOL COMPOUND",
        "ATURE HOUSE (MANGO TREE)/MANGO TREE (ATURE HOUSE)",
        "RCM PRI. SCHOOL UGANDE/SCHOOL COMPOUND",
        "NKST. PRI. SCHOOL, ABAKO/SCHOOL COMPOUND",
        "TSE AKUA/NEAR TSE AKUA COMPOUND",
        "NKST PRI. SCHOOL, GBAAIKYO/SCHOOL COMPOUND",
        "MBAKYER MARKET/MARKET SQUARE",
        "NKST PRI. SCHOOL, ABAKO II/SCHOOL COMPOUND",
        "OPEN SPACE NEAR TINE CHIHA/TSE MALU",
        "OPEN SPACE NEAR NKST CHURCH TSAVCHONGO",
        "OPEN SPACE NKST CHURCH TAAWA",
        "LGEA PRIMARY SCHOOL, UKANDE NYAJO SCHOOL COMPOUND",
      ],
      "MBATULA/MBEREV": [
        "AGU CENTRE/RCM SCHOOL, TWAR",
        "MBAAGBILE LGEA SCHOOL I/SCHOOL COMPOUND",
        "MBAAGBILE LGEA SCHOOL II/SCHOOL COMPOUND",
        "TOR ANYOM MARKET I/MARKET SQUARE",
        "TOR ANYOM MARKET II/MARKET SQUARE",
        "GBUTU VILLAGE/SMALL HUT, GBUTU VILLAGE",
        "MBATYULA/MBEREV",
        "NKST. PRI. SCHOOL, AGBAMI/SCHOOL COMPOUND",
        "RCM PRI. SCHOOL YAAYEM/SCHOOL COMPOUND",
        "NKST PRI. SCHOOL, TSE HWANGE I/SCHOOL COMPOUND",
        "NKST PRI. SCHOOL, TSE-HWANGE II/SCHOOL COMPOUND",
        "OPEN SPACE NEAR NKST CHURCH KWAGHZAN",
        "LGEA PRIMARY SCHOOL ATUMBE SCHOOL COMPOUND",
      ],
      MBAYONGO: [
        "RCM SCHOOL, AGATSO/SCHOOL COMPOUND",
        "AHUNGWA BER VILLAGE/OPEN SPACE",
        "AYAKA VILLAGE/OPEN SPACE",
        "GBISHE VILLAGE I/GBISHE MARKET SQUARE",
        "NKST SCHOOL, GAWA/SCHOOL COMPOUND",
        "IGYUDU(MBIAKOM OPEN SPACE)",
        "NAGU VILLAGE/NAGU VILLAGE SQUARE",
        "SHIVA PAREGH(NEAR SHIVA PAREGH COMPOUND)",
        "TSE PAV/OPEN SPACE",
        "UTYONDO VINGIR/OPEN SPACE",
        "WENDE IHONGO/OPEN SPACE",
        "GBISHE VILLAGE II/VILLAGE MARKET SQUARE",
        "RCM PRIMARY SCHOOL, GBISHE",
        "OPEN SPACE NEAR ST. GABRIEL CATHOLIC SCHOOL, GESA",
        "OPEN SPACE NKST CHURCH UGBAR",
        "OPEN SPACE NEAR WOGEMA MARKET",
        "OPEN SPACE NEAR BEM MARKET SQUARE",
        "OPEN SPACE IMANDE (LEPROSY CLINIC) ADIGAMI",
        "OPEN SPACE NEAR ST. PHILIP CATHOLIC CHURCH NDERVE",
        "RCM PRIMARY SCHOOL KWAGHAONDO",
        "OPEN SPACE NEAR HEMEN MARKET SQUARE",
        "OPEN SPACE NEAR ST. PIUS CATHOLIC CHURCH MISE",
        "OPEN SPACE NEAR ST. MARK CATHOLIC CHURCH TSE-DE",
      ],
      MICHIHE: [
        "SHIKAAN(SHIKAAN MARKET)",
        "AGULUGU/OPEN SPACE",
        "MBAMTSAR, LGEA SCHOOL/SCHOOL COMPOUND",
        "GBERIHWA/OPEN SPACE",
        "UCHA/OPEN SPACE",
        "LGEA SCHOOL, ABAJI/SCHOOL COMPOUND",
        "ABAJI MARKET/MARKET SQUARE",
        "UKEJI/NEAR TSE UKEJI'S COMPOUND",
        "KUMPA/OPEN SPACE",
        "TSAFA/OPEN SPACE",
        "SOLOZO/OPEN SPACE",
        "HOKON/OPEN SPACE SPACE",
        "TSE-ABA/NEAR TSE ABA COMPOUND",
        "GUGUL/OPEN SPACE",
        "LGEA PRIMARY SCHOOL ATONGO",
        "TAVACHAN/OPEN SPACE",
        "TSE-MKER/OPEN SPACE",
        "NDERZER/NEAR NDERZER COMPOUND",
        "LGEA TSE NOR/SCHOOL PREMISES",
        "LGEA PRIMARY SCHOOL ASEMA KYUNDU",
        "REDEEMED PRIMARY SCHOOL INUDUGH",
        "NKST PRIMARY SCHOOL IMUNAN",
        "NKST PRIMARY SCHOOL ABAJI SCHOOL COMPOUND",
        "OPEN SPACE NEAR RCM CHURCH ABAJI",
        "OPEN SPACE NEAR DAM-AYALI COMPOUND",
        "OPEN SPACE NEAR NYIKYAA MARKET SQUARE",
        "ORMADIC PRIMARY SCHOOL, IGBAKAAVE",
        "OPEN SPACE TAVACHAN MARKET SQUARE",
      ],
      "TIIR(TONGOV II)": [
        "NKST SCHOOL, MGOR/SCHOOL PREMISES",
        "RCM SCHOOL, IGBA/SCHOOL OPREMISES",
        "AKPERA, MARKET/SCHOOL PREMISES",
        "ACHOUGH MARKET,(MARKET SQUARE)",
        "NKST. SCHOOL, APAREGH/SCHOOL PREMISES",
        "MBASHONOV LEPROSY CLINIC/CLINIC PREMISES",
        "ANYAGBA MARKET/MARKET SQUARE",
        "KASEVE VILLAGE(OPEN SPACE)",
        "RCM SCHOOL, BWAJA/SCHOOL PREMISES",
        "LGEA SCHOOL, UGBER/SCHOOL PREMISES",
        "NKST. SCHOOL, DAUDU/SCHOOL PREMISES",
        "KEVER VILLAGE/VILLAGE PREMISES",
        "RCM SCHOOL, YAMEOR(SCHOOL PREMISES",
        "MBAJIME VILLAGE(VILLAGE PREMISES)",
        "ADIKPO MARKET/MARKET SQUARE",
        "NKST. SCHOOL, ALAM/SCHOOL PREMISES",
        "LGEA SCHOOL, NGOBUA I (SCHOOL COMPOUND)",
        "RCM SCHOOL, NGOBUA II (SCHOOL COMPOUND)",
        "RCM SCHOOL, ADAMGBE/SCHOOL PREMISES",
        "KUSE VILLAGE/VILLAGE PREMISES",
        "TSE-TSEGBA/OPEN SPACE",
        "GBOR MARKET/MARKET SQUARE",
        "OPEN SPACE NEAR RCM BOGBO",
        "OPEN SPACE NEAR RCM FEGH",
        "OPEN SPACE NEAR NKST WOMBO",
        "OPEN SPACE NEAR NKST HOOBAH",
        "NKST SCHOOL MANGER",
        "OPEN SPACE NEAR NKST GBANDE",
        "RCM SCHOOL UKO",
        "OPEN SPACE RCM ULI",
        "LGEA SCHOOL KYON",
        "OPEN SPACE NEAR MBATOON MARKET SQUARE",
        "NKST TYOGBENDA UDENDE",
        "OPEN SPACE NEAR ST. JEROME CATHOLIC CHURCH",
        "OPEN SPACE NEAR RCM AHAR",
        "OPEN SPACE NKST AYONGUL",
        "OPEN SPACE NEAR RCM ATOGBENDA",
        "OPEN SPACE NEAR RCM ANTIEV",
        "OPEN SPACE NEAR RCM TYOKYAA",
        "LGEA PRIMARY SCHOOL TARBO",
      ],
      UTAGE: [
        "AGEE LGEA SCHOOL/SCHOOL COMPOUND",
        "SENGA VILLAGE/OPEN SPACE",
        "TSE GBAN ATILE (OPEN SPACE)",
        "NKST SCHOOL, KASAR/SCHOOL COMPOUND",
        "NKST. SCHOOL, HUNDU I SCHOOL COMPOUND",
        "ANYIASE MBAINGBA/OPEN SPACE",
        "ADAMU VILLAGE/VILLAGE SQUARE",
        "GBENGER VILLAGE/LGEA SCHOOL COMPOUND",
        "ADABO VILLAGE/VILLAGE SQUARE",
        "UKORIKYA I/OPEN SPACE",
        "UKORIKYA II/OPEN SPACE",
        "TORDONGA VILLAGE/NEAR TORDONGA MARKET",
        "TORDONGA COUNCIL HALL/COUNCIL HALL",
        "LGEA TORDONGA/SCHOOL COMPOUND",
        "IGUNDUNASE VILLAGE/OPEN SPACE",
        "GWA ANYAM VILLAGE/VILLAGE SQUARE",
        "TORDONGA COUNCIL HALL II/NEAR COUNCIL HALL",
        "HUNDU II (OPEN SPACE)",
        "OPEN SPACE NEAR AFRICA CHURCH SENGA",
        "OPEN SPACE NEAR RCM CHURCH KUR KAUN",
        "OPEN SPACE SUA RAPHA MAIN MARKET SQUARE",
        "OPEN SPACE CENTRAL MOSQUE HAUSA QUARTERS",
        "SHITILE COMMUNITY SECONDARY SCHOOL, TOR-DONGA",
        "OPEN SPACE NEAR GRADE I AREA COURT PREMISES",
        "LGEA PRIMARY SCHOOL MBASA",
        "RCM PRIMARY SCHOOL FAIMEGA",
        "OPEN SPACE NEAR COUNCIL II BERANDA TOR-DONGA",
      ],
      YOOYO: [
        "LGEA SCHOOL, TACHA/SCHOOL COMPOUND",
        "RCM. SCHOOL, BENTE/SCHOOL COMPOUND",
        "CHIREAKEVA VILLAGE/VILLAGE SQR",
        "IMBUFU ATO VILLAGE",
        "NKST. SCHOOL, GALWAYOLNA/SCHOOL COMPOUND",
        "LGEA SCHOOL, IGBABAKA/SCHOOL COMPOUND",
        "RCM SCHOOL, JIMA/SCHOOL COMPOUND",
        "NKST. SCHOO, TIONKWASE/SCHOOL COMPOUND",
        "LGEA SCHOOL, ASOGO/SCHOOL COMPOUND",
        "LGEA SCHOOL, MBAYUHE(SCHOOL COMPOUND)",
        "IORTYOM VILLAGE/VILLAGE SQUARE",
        "RCM. SCHOOL, JIMA II/SCHOOL COMPOUND",
        "OPEN SPACE TACHA MARKET SQUARE",
        "RCM PRIMARY SCHOOL BENTE II",
        "OPEN SPACE ST. PAUL CATHOLIC CHURCH",
        "OPEN SPACE PRIMARY HEALTH CARE, IGBABAKA",
        "NKST PRIMARY SCHOOL IORPENDA TIONKWASE",
        "OPEN SPACE ST. THOMAS CATHOLIC CHURCH, ASOGO",
        "OPEN SPACE NEAR ST. THERESA'S CATHOLIC CHURCH AZAKERA",
      ],
    },

    KONSHISHA: {
      "IKURAV/MBATWEI": [
        "LGED SCHOOL, ACHIKA - ACHIKA",
        "LGED SCHOOL, AGBA - AGBA",
        "LGED SCHOOL, ADAMGBE - ADAMGBE",
        "LGED SCHOOL, DEKE - DEKE",
        "LEP. CLINIC, GBAJOV - GBAJOV",
        "LEP CLINIC MBAGBAR",
        "MARKET SQUARE - DIO I",
        "LEP. CLINIC HAANONGUN - HAANONGUN",
        "AZEM MARKET SQUARE - AZEM",
        "AGERA MARKET SQUARE - AGERA",
        "TAAVE VILLAGE - TAAVE",
        "L.G. HEALTH CLINIC - DIO II",
        "AKINDE PUBLIC SQUARE",
        "GAJIR PUBLIC SQ",
      ],

      "MBAGSA/MBATSE": [
        "LGED SCHOOL, ABA - ABA",
        "LGED SCHOOL, AKAABIAM - AKAABIAM",
        "LGED SCHOOL, AYEV - AYEV",
        "LGED SCHOOL, KPE-ALA - KPE-ALA",
        "MANTA MARKET - MANTA",
        "LGED SCHOOL, MUTA - MUTA",
        "LGED SCHOOL, BATURE - BATURE",
        "LGED SCHOOL, GBADEMA - GBADEMA",
        "LGED SCHOOL, IKPEM - IKPEM",
        "LGED SCHOOL, KIBOUGH - KIBOUGH",
        "LGED SCHOOL, OCHORO - OCHORO",
        "LGED SCHOOL, MANTA - MANTA",
        "GBINDE MARKET I - GBINDE",
        "SHIRIKI MARKET - SHIRIKI",
        "GBINDE MARKET II - MHOR PARK",
        "LGEA HEALTH CENTRE",
        "COMMUNITY SEC. SCH. MANTA",
        "TSE-TYO MARKET",
      ],
      MBAIKYASE: [
        "NKST. PRI. SCHOOL, AGEN - AGEN",
        "LGED PRI. SCHOOL, AYAGA - AYAGA",
        "LEP. CLINIC, GBAKPER - GBAKPER",
        "LGED PRI. SCHOOL, KYONDU - KYONDU",
        "JOV-IKYUNDAN MARKET - JOV-IKYUNDAN",
        "TYOKYAA LGED SCHOOL, TYOKYAA - TYOKYAA",
        "UGBETSEGH - UGBETSEGH",
        "YANDE I LGED SCHOOL, YANDE",
        "TSUE MARKET - TSUE",
        "TYOATE LGED PRI. SCHOOL - TYOATE",
        "LGED PRI. SCHOOL, IKPAOR - IKPAOR",
        "LGED PRI. SCHOOL, KAAN - KAAN",
        "LGED PRI. SCHOOL, YAAKUGH - YAAKUGH",
        "ABAGI MARKET SQUARE - ABAGI",
        "LGED PRI. SCHOOL, AKU - AKU",
        "LGED PRI. SCHOOL, MBAKPUR - MBAKPUR",
        "LGED PRI. SCHOOL, MBAUME - MBAUME",
        "LGED PRI. SCHOOL, AGUNE - AGUNE",
        "GUNGUL MAIN - GUNGUL",
        "GUNGUL MARKET SQUARE - GUNGUL",
        "RCM. PRI. SCHOOL, GUNGUL - GUNGUL",
        "IKYO - MAZO, IKYO-MAZO VILLAGE SQUARE",
        "LGED PRI. SCHOOL, TUGHGBA - TUGHGBA",
        "NKST. PRI. SCHOOL, JOV-KYUNDAN - JOV-KYUNDAN",
        "LGED PRI. SCHOOL, TSUWE",
        "NALDA MARKET - NALDA",
        "YANDE II - AHURAGBON",
        "RCM PRIM. SCH. AKILE",
        "GERA MKT SQUARE",
        "MBAAMULUDU COMM. SEC. SCH.",
        "ASHITONGU MKT. SQ.",
        "CLUB HOUSE GUNGUL",
        "LEPROSY CLINIC GOCHI",
        "COMMUNITY SEC. SCH. TSE-TYO",
        "RCM PRIM SCH. ADIHAR",
      ],

      MBAIWARNYAM: [
        "NKST. PRI. SCHOOL, AGEN - AGEN",
        "LGED PRI. SCHOOL, AYAGA - AYAGA",
        "LEP. CLINIC, GBAKPER - GBAKPER",
        "LGED PRI. SCHOOL, KYONDU - KYONDU",
        "JOV-IKYUNDAN MARKET - JOV-IKYUNDAN",
        "TYOKYAA LGED SCHOOL, TYOKYAA - TYOKYAA",
        "UGBETSEGH - UGBETSEGH",
        "YANDE I LGED SCHOOL, YANDE",
        "TSUE MARKET - TSUE",
        "TYOATE LGED PRI. SCHOOL - TYOATE",
        "LGED PRI. SCHOOL, IKPAOR - IKPAOR",
        "LGED PRI. SCHOOL, KAAN - KAAN",
        "LGED PRI. SCHOOL, YAAKUGH - YAAKUGH",
        "ABAGI MARKET SQUARE - ABAGI",
        "LGED PRI. SCHOOL, AKU - AKU",
        "LGED PRI. SCHOOL, MBAKPUR - MBAKPUR",
        "LGED PRI. SCHOOL, MBAUME - MBAUME",
        "LGED PRI. SCHOOL, AGUNE - AGUNE",
        "GUNGUL MAIN - GUNGUL",
        "GUNGUL MARKET SQUARE - GUNGUL",
        "RCM. PRI. SCHOOL, GUNGUL - GUNGUL",
        "IKYO - MAZO, IKYO-MAZO VILLAGE SQUARE",
        "LGED PRI. SCHOOL, TUGHGBA - TUGHGBA",
        "NKST. PRI. SCHOOL, JOV-KYUNDAN - JOV-KYUNDAN",
        "LGED PRI. SCHOOL, TSUWE",
        "NALDA MARKET - NALDA",
        "YANDE II - AHURAGBON",
        "RCM PRIM. SCH. AKILE",
        "GERA MKT SQUARE",
        "MBAAMULUDU COMM. SEC. SCH.",
        "ASHITONGU MKT. SQ.",
        "CLUB HOUSE GUNGUL",
        "LEPROSY CLINIC GOCHI",
        "COMMUNITY SEC. SCH. TSE-TYO",
        "RCM PRIM SCH. ADIHAR",
      ],

      MBAKE: [
        "AJANDE LGED SCHOOL, AJANDE",
        "ANSHA LGED SCHOOL - ANSHA",
        "ANSHA MARKET - ANSHA",
        "AVI LGED SCHOOL, AVI",
        "GSS KORINYA - KORINYA",
        "TYOUTSA - TYOUTSA",
        "IKYAAVE NKST. SCHOOL, IKYAAVE",
        "L.G. DISP. KORINYA - KORINYA",
        "TIAN LGED SCHOOL, TIAN",
        "TSE-IHUGH - TSE-HUGH",
        "UKA'S COMPOUND I - UKA'S COMP.",
        "KWAR NKST. SCHOOL, KWAR",
        "KORINYA MARKET I - KORINYA",
        "ANWUA MARKET - ANWUA",
        "AGRO SERVICE CENTRE - AGRO KORINYA",
        "KORINYA MARKET II - MOTOR PARK",
        "UKA'S COMPOUND II - UKA'S JUNCTION",
        "AVI MKT SQ",
        "LGEA PRIM. SCH. AKYANGBA",
        "GRADE I AREA CRT KORNYA",
        "ST. JOSEPH & MARY SEC. SCH. KORNYA",
        "UVA BRIDGE KORNYA",
        "KORNY NYAM MKT",
      ],

      MBANOR: [
        "WUAOR LGED SCHOOL - WUAOR",
        "NGOR LGED SCHOOL - NGOR",
        "ADYOROUGH - ADYOROUGH",
        "MHAMBE MARKET - MHAMBE",
        "MHAMBE LGED SCHOOL, MHAMBE",
        "SAAMAKPE - SAAMAKPE",
        "IORVER LGED SCHOOL - IORVER",
        "ANIMA MARKET - ANIMA",
        "TORJAPE LGED SCHOOL - TORJAPE",
        "KOKO - KOKO",
        "UBO AGERA - UBO AGERA",
        "AKILE JIME BASK LIT. - AKILE",
        "JIRGBA LGED SCHOOL I - JIRGBA",
        "ADI LGED SCHOOL I - ADI",
        "LGED SCHOOL, JIRGBA II - PUBLIC SQUARE",
        "IORNONGU MKT SQ",
        "UGI MKT SQ.",
      ],

      MBATSEN: [
        "ASHAGBA JUNTI - ASHAGBA",
        "AGERAGA MARKET - AGERAGA",
        "KUNGO LGED SCHOOL, KUNGO",
        "AILIGH KOR'S COMP. - AILIGH KOR",
        "AGBEDE MARKET - AGBEDE",
        "AMUA ZEP CLINIC - AMUA",
        "AMUA LGED SCHOOL - AMUA",
        "AHILE MARKET - AHILE",
        "YONKYEGH JUNCTION - YONKYEGH",
        "ANYAHWAR MARKET - ANYAHWAR",
        "KUNGO LGED SCHOOL, KUNGO",
        "WUAOR LGED SCHOOL, WUAOR",
        "AYEM LGED SCHOOL, AYEM",
        "AGBANYI LGED SCHOOL, AGBANYI",
        "AKO LGED SCHOOL, AKO",
        "AGBANYI MARKET - AGBANYI",
        "ADE-AGINDE - ADE-AGINDE",
        "IGBO RCM. IGBO",
        "TYOGBENDA MARKET - TYOGBENDA",
        "MAROCHI'S CAMP. - MAROCHI'S",
        "ADAGBA - ADAGBA",
        "MBAASUKU I - MBAASUKU",
        "MBAASUKU II - MBAASUKU PUBLIC SQUARE",
        "LGED PRIM. SCH. AJIM",
      ],

      MBAVAA: [
        "SEV LEP. CLINIC - SEV",
        "ATUMBASHIMA JUNT. - ATUMBASHIMA",
        "LGED SCHOOL, TYOAKOSO - TYOAKOSO",
        "LGED SCHOOL, NORGBA - NORGBA",
        "LGEA SCHOOL, ALYEWAN - ALYEWAN",
        "L.G. DISP. JOV MBAVAA - MBAVAA",
        "KACHIR COMP. - KACHIR",
        "GBOGBO MARKET - GBOGBO",
        "NKST. PRI. SCHOOL, BER - BER",
        "AGBOUGHUL LGED SCHOOL, AGBOUGHUL",
        "ATSEGHA LGED PRI. SCHOOL, ATSEGHA",
        "AKPUTU MARKET I - AKPUTU",
        "AKPUTU MARKET II - L.G. DISP.",
        "ADULE MKT SQ.",
      ],

      MBAWAR: [
        "NENGE LGED SCHOOL, NENGE",
        "IORPUU MARKET - IORPUU",
        "ANYORIKYO LGED SCHOOL, ANYORIKYO",
        "WUESE MARKET I - WUESE",
        "ISHUA NKST. SCHOOL, ISHUA",
        "ALABUSA LGED SCHOOL, ALABUSA",
        "ALABUSA MARKET - ALABUSA",
        "AWANGE MARKET - AWANGE",
        "ANKPINE NKST. SCHOOL, ANKPINE",
        "UDE LGED SCHOOL, UDE",
        "AKUNDE MARKET - AKUNDE",
        "ANAJAV JUNT. - ANAJAV",
        "ANYAMNGURA MARKET - ANYAMNGURA",
        "GBIHI LGED SCHOOL - GBIHI",
        "UKEHE MARKET - UKEHE",
        "UKEHE LGED SCHOOL, UKEHE",
        "IORKYOSU LGED SCHOOL I - IORKYOSU",
        "UMBA-ATOROUGH - UMBA-ATOROUGH",
        "GBOR MARKET - GBOR",
        "WUESE MARKET II - TSE-GBASHA",
        "IORKYOSU II - SCHOOL JUNCTION",
        "LOCAL GOVT. PRIM. HEALTH CENTRE WUESE",
        "LOCAL GOVT. PRIM HEALTH CENT. IKAANEM",
        "LGEA DANKOR",
        "AGERA PRIM. SCH. AGBO",
        "ANYIASE MKT. SQ.",
      ],

      "MBAYEGH/MBAIKY": [
        "KENA LGED SCHOOL, KENA",
        "AGERA LGED SCHOOL, AGERA",
        "BUGH LGED SCHOOL, BUGH",
        "DABUR LGED SCHOOL, DABUR",
        "ANGER LGED SCHOOL, ANGER",
        "YAR-GUM - YAR-GUM",
        "AUDU LEP. CLINIC - AUDU",
        "IKYOMBUN LGED SCHOOL - IKYOMBUN",
        "ADAMU LGED SCHOOL, ADAMU",
        "IKPEAKOR MARKET - IKPEAKOR",
        "TYULEN VILLAGE - TYULEN",
        "GBAYA MARKET - GBAYA",
        "KYOIVE LGED SCHOOL - LGED SCHOOL",
        "SULE CHICHI LGED SCHOOL, SULE",
        "TONGO MARKET - TONGO",
        "TSE-ORTYEV - TSE-ORTYEV",
        "UDELE LGED SCHOOL, UDELE",
        "UGBA LGED SCHOOL, UGBA",
        "TSE-IKYA - TSE-IKYA",
        "BAM - BAM",
        "ANJI MARKET - ANJI",
        "TSE INGYA - TSE-INGYA",
        "L.G. DISP. TONGO - TONGO",
        "ATSADU VILLAGE - ATSADU",
        "AKUNDU MARKET - AKUNDU",
        "TONGO MARKET II - MOTOR PARK",
        "BETSE MKT SQ.",
        "LGEA SCH. TEMA",
        "LGEA SCH. TONGU",
      ],
      "TSE-AGBERAGBA": [
        "AGUNDU NR TIME IKYAR - AGUNDU",
        "AMASETIMIN LGED SCHOOL, AMASETIMIN",
        "SELAGI MARKET I - SELAGI",
        "LGED SCHOOL, IVE - IVE",
        "TYOUGH MARKET - TYOUGH",
        "LGED SCHOOL, MBAIKPAM - MBAIKPAM",
        "LGED SCHOOL, IORKIGHIR - IORKIGHIR",
        "PUBLIC SQUARE I - PUBLIC SQUARE",
        "TRADITIONAL COUNCIL OFFICE - TRADITIONAL COUNCIL OFFICE",
        "LGED SCHOOL, AGBERAGBA WEST - AG. WEST",
        "TYOTSAR MARKET - TYOTSAR",
        "LEKE HIGH SCHOOL, LEKE",
        "UGBAIKYO LEP. CLINIC - UGBAIKYO",
        "IBER DISP. CLINIC - IBER",
        "JOY-BILIKI MARKET - JOY-BILIKI",
        "ANDYAR LGED SCHOOL, ANDYAR",
        "HINDAN LGED SCHOOL, HINDAN",
        "GOVT. SEC. SCHOOL, TSE - TSE-AGBERAGA",
        "HEMEN LGED SCHOOL, HEMEN",
        "SELAGI MARKET II - L.G. HEALTH CLINIC",
        "PUBLIC SQUARE II - MOTOR PARK",
        "LGEA SCH. TE",
        "LGEA OFFICE",
        "KANSHIO MKT",
        "LOCAL GOVT. SECRETARIAT",
        "LGEA PRIM. SCH. IBER",
        "LGED PRIM. SCH. AJIM",
      ],
    },

    // 11 KWANDE

    // 12 LOGO

    // 13 MAKURDI

    // 14 OBI

    // 15 OGBADIBO

    // 16 OJU

    // 17 OHIMINI

    // 18OKPOKWU

    // 19 OTUKPO

    // 20 TARKA

    // 21 UKUM

    // 22 USHONGO

    // 23 VANDEIKYA
  };

  // Populate LGA dropdown
  const lgaDropdown = $("#lga");
  Object.keys(data).forEach((lga) => {
    lgaDropdown.append(new Option(lga, lga));
  });
  lgaDropdown.selectpicker("refresh");

  // Handle LGA selection
  lgaDropdown.on("changed.bs.select", function () {
    const selectedLGA = $(this).val();
    const wardDropdown = $("#ward");

    // Clear and disable Ward and Polling Unit dropdowns
    wardDropdown
      .empty()
      .append('<option value="">Select Ward</option>')
      .selectpicker("refresh")
      .prop("disabled", true);
    $("#pollingUnit")
      .empty()
      .append('<option value="">Select Polling Unit</option>')
      .selectpicker("refresh")
      .prop("disabled", true);

    if (selectedLGA) {
      // Populate Ward dropdown
      Object.keys(data[selectedLGA]).forEach((ward) => {
        wardDropdown.append(new Option(ward, ward));
      });
      wardDropdown.prop("disabled", false).selectpicker("refresh");
    }
  });

  // Handle Ward selection
  $("#ward").on("changed.bs.select", function () {
    const selectedLGA = $("#lga").val();
    const selectedWard = $(this).val();
    const pollingUnitDropdown = $("#pollingUnit");

    // Clear Polling Unit dropdown
    pollingUnitDropdown
      .empty()
      .append('<option value="">Select Polling Unit</option>')
      .selectpicker("refresh")
      .prop("disabled", true);

    if (selectedLGA && selectedWard) {
      // Populate Polling Unit dropdown
      data[selectedLGA][selectedWard].forEach((pollingUnit) => {
        pollingUnitDropdown.append(new Option(pollingUnit, pollingUnit));
      });
      pollingUnitDropdown.prop("disabled", false).selectpicker("refresh");
    }
  });
});
