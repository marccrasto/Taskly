// Select all draggable task elements
const draggables = document.querySelectorAll(".task");
// Select all drop zones (columns)
const droppables = document.querySelectorAll(".swim-lane");

// Add drag event listeners to each task
draggables.forEach((task) => {
  task.addEventListener("dragstart", () => {
    // Add a class to identify the task being dragged
    task.classList.add("is-dragging");
  });
  task.addEventListener("dragend", () => {
    // Remove the class when dragging ends
    task.classList.remove("is-dragging");
  });
});

// Add dragover behavior to each drop zone
droppables.forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow drop

    // Find the task currently under the cursor
    const bottomTask = insertAboveTask(zone, e.clientY);
    const curTask = document.querySelector(".is-dragging");

    if (!bottomTask) {
      // If no task is found below, append at end
      zone.appendChild(curTask);
    } else {
      // Otherwise, insert above the closest task
      zone.insertBefore(curTask, bottomTask);
    }
  });
});

// Helper function to find the task directly below the cursor
const insertAboveTask = (zone, mouseY) => {
  const els = zone.querySelectorAll(".task:not(.is-dragging)");

  let closestTask = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  els.forEach((task) => {
    const { top } = task.getBoundingClientRect();
    const offset = mouseY - top;

    // Find the nearest task with a top position below the mouseY
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestTask = task;
    }
  });

  return closestTask;
};
