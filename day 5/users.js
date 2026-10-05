
const loadUsersButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");    
const statusElement = document.getElementById("status");
const userListElement = document.getElementById("user-list");

async function fetchUsers() {
    statusElement.textContent = "Loading users...";
    loadUsersButton.disabled = true; 
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        statusElement.textContent = "Error fetching users.";
    } finally {
        loadUsersButton.disabled = false;
    }
}
function displayUsers(users) {
    userListElement.textContent = ""; 
    // Clear previous list
    users.forEach(user => {
        const listItem = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = user.name;
        const email = document.createElement("span");
        email.textContent = `Email: ${user.email}`;
        const city = document.createElement("span");
        city.textContent = `City: ${user.address.city}`;
        const company = document.createElement("span");
        company.textContent = `Company: ${user.company.name}`;
        listItem.appendChild(name);
        listItem.appendChild(document.createElement("br"));
        listItem.appendChild(email);
        listItem.appendChild(document.createElement("br"));
        listItem.appendChild(city);
        listItem.appendChild(document.createElement("br"));
        listItem.appendChild(company);
        userListElement.appendChild(listItem);

    })

    filterInput.addEventListener("input", () => {
        const filterValue = filterInput.value.toLowerCase();
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(filterValue) 
        );
        displayUsers(filteredUsers);
    })
    loadUsersButton.addEventListener("click", fetchUsers);
}