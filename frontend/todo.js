const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoLane = document.getElementById("todo-lane");

let i = 0;

const margin = () => {
  var random_margin = ["-5px", "1px", "5px", "10px", "15px", "20px"];
  return random_margin[Math.floor(Math.random() * random_margin.length)];
};

const rotate = () => {
  var random_rotate = ["rotate(3deg)", "rotate(1deg)", "rotate(-3deg)", "rotate(-1deg)", "rotate(5deg)", "rotate(10deg)"]
  return random_rotate[Math.floor(Math.random() * random_rotate.length)];
};

const color = () => {
  var random_color = ["#c2ff3d", "#ff3de8", "#3dc2ff", "#04e022", "#bc83e6", "#ebb328"]
  if (i > random_color.length - 1) {
    i = 0;
  }
  return random_color[i++];
};




form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = input.value;

  if (!value) return;

  const newTask = document.createElement("p");
  newTask.classList.add("task");
  newTask.setAttribute(
    "style",
    "font-size: 16px; text-align: center; padding: 10px; height:100px; margin-top: 10px; box-shadow: 0px 10px 24px 0px rgba(0,0,0,0.75);"
  );
  newTask.style.margin = margin();
  newTask.style.background = color();
  newTask.style.transform = rotate();

  newTask.setAttribute("draggable", "true");
  newTask.innerText = value;

  newTask.addEventListener("dragstart", () => {
    newTask.classList.add("is-dragging");
  });

  newTask.addEventListener("dragend", () => {
    newTask.classList.remove("is-dragging");
  });

  todoLane.appendChild(newTask);

  input.value = "";
});

/*
Notification scripts for on click display and on screen click hide
*/
const notiBtn = document.getElementById("noti-btn");
const notiDropdown = document.getElementById("noti-dropdown");

notiBtn.addEventListener("click", (event) => {
  event.stopPropagation(); 
  notiDropdown.classList.toggle("hidden");
});
document.addEventListener("click", (event) => {
  if (!notiDropdown.classList.contains("hidden")) {
    
    if (
      event.target !== notiBtn &&
      !notiDropdown.contains(event.target)
    ) {
      notiDropdown.classList.add("hidden");
    }
  }
});
