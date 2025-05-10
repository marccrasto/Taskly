
const notiDropdown = document.getElementById("noti-dropdown");

// HElper function to format date
function formatDate(date) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July",    "August",   "September", "October", "November", "December"
  ];

  let month = monthNames[date.getMonth()];
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  hour = hour || 12; 
  minute = minute < 10 ? "0" + minute : minute;

  // Example: "April 3 at 9:15 AM"
  return `${month} ${day} at ${hour}:${minute} ${ampm}`;
}


//    (type: 0 -> created, 1 -> completed, 2 -> due soon, 3 -> overdue)
function getNotificationMessage(type, taskName) {
  switch (type) {
    case 0:
      return `New task "${taskName}" was created`;
    case 1:
      return `Task "${taskName}" was completed`;
    case 2:
      return `Task "${taskName}" is due in 24 hours.`;
    case 3:
      return `Task "${taskName}" is overdue.`;
    default:
      return "Unknown notification type";
  }
}

// 4. Core function that inserts a notification card into the UI
function createNotificationInUi(type, taskName, timestamp) {
  //create wrapper for notification cards
    const notifCard = document.createElement("div");
  notifCard.classList.add("notif-card");

  // Main notification text
  const messageDiv = document.createElement("div");
  messageDiv.textContent = getNotificationMessage(type, taskName);
  notifCard.appendChild(messageDiv);

  // Time label
  const notifTimeDiv = document.createElement("div");
  notifTimeDiv.classList.add("notif-time");
  notifTimeDiv.textContent = formatDate(new Date(timestamp));
  notifCard.appendChild(notifTimeDiv);

  notiDropdown.appendChild(notifCard);
}

// 5. Function to create a new notification, store it in your database, 
//    and then show it in the UI.
async function createAndStoreNotification(type, taskName, boardID) {
  const now = new Date();

  // TODO: Routing to database based on 4 parameters: type (0-3), taskName, boardID, now = Date

  // create the notification in the UI
  createNotificationInUi(type, taskName, now);
}

// 6. Function to load all notifications for a specific board from the database
async function loadNotificationsFromDb(boardID) {

  // TODO: Fetch notifications from the database or backend for this boardID. 
         
  // Example placeholder data:
  /* const fakeData = [
   {
      type: 0,
      taskName: "Fix bugs",
      timestamp: "2025-03-24T09:15:00Z",
      boardID: boardID
    },
    {
      type: 3,
      taskName: "Draft Documentation",
    timestamp: "2025-03-24T10:05:00Z",
      boardID: boardID
    }
  ]; */

  return fakeData; // Replace with real data from your DB
}

// 7. Once we have the list of notifications from the DB, we display them.
function displayNotificationsInUi(notificationsList) {
  notiDropdown.innerHTML = "";

  const reversed = [...notificationsList].reverse(); // create reversed copy
for (const notif of reversed) {
  const { type, taskName, timestamp } = notif;
  createNotificationInUi(type, taskName, timestamp);
}

}

async function initNotifications(boardID) {
  const notifications = await loadNotificationsFromDb(boardID);
  displayNotificationsInUi(notifications);
}

window.createAndStoreNotification = createAndStoreNotification;
window.initNotifications = initNotifications;
