const API_BASE_URL = "http://localhost:3000";

const register = async (username, password) => {
    console.log("Register ran");

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        console.log(data);

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Registration failed." };
        }

        return { success: true, token: data.token };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const login = async (username, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Login failed." };
        }

        return { success: true, token: data.token };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const getBoards = async () => {    
    try {
        const response = await fetch(`${API_BASE_URL}/board?_=${Date.now()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (response.status === 403 || response.status == 401) {
            localStorage.removeItem("token");
            window.location.href = "index.html"
            return { success: false, error: "Unauthorized" };        
        }
        else if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Failed to fetch boards." };
        }

        return { success: true, boards: data.boards };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const getBoardById = async (boardId) => {
    if (!boardId || typeof(boardId) !== 'number') return { success: false, error: "Board id must be a positive number. Do request was sent." };

    try {
        const response = await fetch(`${API_BASE_URL}/board/${boardId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });
        const data = await response.json();

        if (response.status === 403 || response.status == 401) {
            localStorage.removeItem("token");
            window.location.href = "index.html"
            return { success: false, error: "Unauthorized" };        
        }
        else if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Failed to fetch board." };
        }
        return { success: true, board: data.board };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const newBoard = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/board`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            }
        });
        
        const data = await response.json();

        if (response.status === 403 || response.status == 401) {
            localStorage.removeItem("token");
            window.location.href = "index.html"
            return { success: false, error: "Unauthorized" };        
        }
        else if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Failed to create board." };
        }
        return { success: true, id: data?.board?.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const deleteBoard = async (delete_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/board/${delete_id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            }
        });
        
        const data = await response.json();

        if (response.status === 403 || response.status == 401) {
            localStorage.removeItem("token");
            window.location.href = "index.html"
            return { success: false, error: "Unauthorized" };        
        }
        else if (!response.ok || !data.success) {
            return { success: false, error: data.error || "Failed to create board." };
        }
        return { success: true, id: data?.board?.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const updateBoardTitle = async (boardId, newName) => {
    const response = await fetch(`${API_BASE_URL}/board/${boardId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you're storing JWT token this way
        },
        body: JSON.stringify({ name: newName })
    });

    const data = await response.json();

    if (response.status === 403 || response.status == 401) {
        localStorage.removeItem("token");
        window.location.href = "index.html"
        return { success: false, error: "Unauthorized" };        
    }
    else if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Failed to create board." };
    }
    return { success: true, new_board: data.board };
}

export { 
    register, login,
    getBoards, getBoardById, newBoard, deleteBoard, updateBoardTitle
};
