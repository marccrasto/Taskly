import { getBoards, newBoard, deleteBoard } from "./apis.js";

// Default task structure to use until tasks are properly fetched
const defaultTasks = {
  todo: ["Email client", "Fix bugs"],
  doing: ["Prepare demo"],
  done: ["Update docs"]
};

// Function to create a board card element
const createBoardCard = (board) => {
  const card = document.createElement("div");
  card.className = "board-card";
  
  // Redirect when the main part of the card is clicked
  card.onclick = () => {
    window.location.href = `board.html?id=${board.id}`;
  };

  // Title section
  const title = document.createElement("h2");
  title.textContent = board.name;

  // Create trash icon container
  const trash = document.createElement("span");
  trash.className = "trash-icon";
  trash.innerHTML = "🗑️";
  trash.title = "Delete Board";

  // Prevent card click from firing when trash is clicked
  trash.onclick = async (e) => {
    e.stopPropagation(); // Stop event bubbling
    console.log(`Trash icon clicked for board ID: ${board.id}`);
    

    if (confirm(`Are you sure you want to delete ${board.name}?`)) {
      const response = await deleteBoard(board.id);

      if (response.success) {
        // reload boards or simply just delete the deleted board locally 
        // Wait for the animation to finish (e.g. 300ms) before removing
        card.classList.add("fade-out");
        setTimeout(() => {
          card.remove();
        }, 300);
      }
    }
  };

  // Title + trash wrapper
  const titleBar = document.createElement("div");
  titleBar.className = "title-bar";
  titleBar.appendChild(title);
  titleBar.appendChild(trash);

  const miniLanes = document.createElement("div");
  miniLanes.className = "mini-lanes";

  ["todo", "doing", "done"].forEach(lane => {
    const miniLane = document.createElement("div");
    miniLane.className = "mini-lane";

    board.tasks[lane].slice(0, 2).forEach(task => {
      const taskElem = document.createElement("p");
      taskElem.className = "mini-task";
      taskElem.textContent = task;
      miniLane.appendChild(taskElem);
    });

    miniLanes.appendChild(miniLane);
  });

  card.appendChild(titleBar);
  card.appendChild(miniLanes);
  return card;
};


// Function to load boards from the API
const loadBoards = async () => {
  const scrollContainer = document.getElementById("board-scroll");
  const addNew = document.getElementById("add-new");
  
  const response = await getBoards();
  if (!response.success) {
    const errorMsg = response.error || "Server error";
    alert(errorMsg); // Display error message if boards couldn't be fetched
    return;
  }
  
  // If the response is successful, display boards
  response.boards.forEach(board => {
    const boardWithTasks = {
      ...board, // Copy all board properties
      tasks: defaultTasks // Add default task structure
    };
    
    const card = createBoardCard(boardWithTasks);
    scrollContainer.insertBefore(card, addNew);
  });
  
  addNew.onclick = async () => {
    const res = await newBoard();
    if (res.success) {
      window.location.href = `board.html?id=${res.id}`;
    } else {
      console.error("Failed to create board");
      window.location.href = 'board.html';
    }
  };
}

const start = async () => {
	// Does the guy have a token?
	if (!localStorage.getItem("token")) {
		window.location.href = "index.html";
	} else {
		// Token exists, use the token to get boards
		await loadBoards();
	}
}


await start();