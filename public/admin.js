// Global variables
let isLoggedIn = false;
let allArtworks = [];
let deletePhotoId = null;

// DOM elements
const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');

// Upload form elements
const uploadForm = document.getElementById('uploadForm');
const titleInput = document.getElementById('titleInput');
const categoryInput = document.getElementById('categoryInput');
const imageInput = document.getElementById('imageInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

// Management elements
const loadingSpinner = document.getElementById('loadingSpinner');
const artworksList = document.getElementById('artworksList');
const noArtworks = document.getElementById('noArtworks');
const cleanupBtn = document.getElementById('cleanupBtn');

// Delete modal elements
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');

// Admin password
const ADMIN_PASSWORD = 'ruchita123';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    checkLoginStatus();
    setupEventListeners();
});

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggle(newTheme);
}

function updateThemeToggle(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Check if user is already logged in
function checkLoginStatus() {
    const loginStatus = sessionStorage.getItem('adminLoggedIn');
    if (loginStatus === 'true') {
        showAdminDashboard();
    } else {
        showLoginSection();
    }
}

// Event listeners setup
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Login functionality
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', handleLogout);
    
    // Upload form
    uploadForm.addEventListener('submit', handleUpload);
    
    // Cleanup functionality
    cleanupBtn.addEventListener('click', handleCleanup);
    
    // Delete modal controls
    closeDeleteModal.addEventListener('click', closeDeleteModalFunc);
    cancelDelete.addEventListener('click', closeDeleteModalFunc);
    confirmDelete.addEventListener('click', handleDeleteConfirm);
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModalFunc();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (deleteModal.style.display === 'block') {
                closeDeleteModalFunc();
            }
        }
    });
}

// Handle login
function handleLogin() {
    const password = passwordInput.value.trim();
    
    if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminDashboard();
        hideLoginError();
    } else {
        showLoginError('Invalid password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Handle logout
function handleLogout() {
    isLoggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    showLoginSection();
    
    // Clear form data
    uploadForm.reset();
    hideUploadStatus();
}

// Show admin dashboard
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    logoutBtn.style.display = 'block';
    
    // Load artworks
    loadArtworks();
}

// Show login section
function showLoginSection() {
    loginSection.style.display = 'block';
    adminDashboard.style.display = 'none';
    logoutBtn.style.display = 'none';
    
    passwordInput.value = '';
    hideLoginError();
}

// Show/hide login error
function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

function hideLoginError() {
    loginError.style.display = 'none';
}

// Handle file upload
async function handleUpload(e) {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const imageFile = imageInput.files[0];
    
    if (!title || !category || !imageFile) {
        showUploadStatus('Please fill in all fields and select an image.', 'error');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
        showUploadStatus('Please select a valid image file (JPG, PNG, GIF, WebP).', 'error');
        return;
    }
    
    // Validate file size (10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
        showUploadStatus('File size must be less than 10MB.', 'error');
        return;
    }
    
    try {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('image', imageFile);
        
        const response = await fetch('/admin/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showUploadStatus('Artwork uploaded successfully!', 'success');
            uploadForm.reset();
            loadArtworks(); // Reload the artworks list
        } else {
            showUploadStatus(result.error || 'Upload failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showUploadStatus('Upload failed. Please check your connection and try again.', 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Artwork';
    }
}

// Show upload status message
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type}`;
    uploadStatus.style.display = 'block';
    
    // Hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            hideUploadStatus();
        }, 5000);
    }
}

function hideUploadStatus() {
    uploadStatus.style.display = 'none';
}

// Load artworks from API
async function loadArtworks() {
    try {
        showLoading(true);
        
        const response = await fetch('/admin/photos');
        
        if (!response.ok) {
            throw new Error('Failed to load artworks');
        }
        
        allArtworks = await response.json();
        displayArtworks(allArtworks);
        
    } catch (error) {
        console.error('Error loading artworks:', error);
        showError('Failed to load artworks. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display artworks in the management section
function displayArtworks(artworks) {
    if (artworks.length === 0) {
        artworksList.innerHTML = '';
        noArtworks.style.display = 'block';
        return;
    }
    
    noArtworks.style.display = 'none';
    
    artworksList.innerHTML = artworks.map(artwork => `
        <div class="artwork-item" data-id="${artwork.id}">
            <img src="/uploads/${artwork.filename}" alt="${artwork.title}" class="artwork-thumbnail">
            <div class="artwork-info">
                <h4>${escapeHtml(artwork.title)}</h4>
                <div class="artwork-meta">
                    <p><strong>Category:</strong> ${escapeHtml(artwork.category)}</p>
                    <p><strong>Uploaded:</strong> ${formatDate(artwork.upload_date)}</p>
                    <p><strong>Likes:</strong> ${artwork.like_count || 0} | <strong>Comments:</strong> ${artwork.comment_count || 0}</p>
                </div>
            </div>
            <div class="artwork-actions">
                <button class="delete-btn" onclick="openDeleteModal(${artwork.id}, '${escapeHtml(artwork.title)}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Open delete confirmation modal
function openDeleteModal(photoId, title) {
    deletePhotoId = photoId;
    deleteModal.querySelector('.modal-body p').textContent = 
        `Are you sure you want to delete "${title}"? This action cannot be undone.`;
    deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close delete modal
function closeDeleteModalFunc() {
    deleteModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    deletePhotoId = null;
}

// Handle delete confirmation
async function handleDeleteConfirm() {
    if (!deletePhotoId) return;
    
    try {
        confirmDelete.disabled = true;
        confirmDelete.textContent = 'Deleting...';
        
        const response = await fetch(`/admin/delete/${deletePhotoId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Artwork deleted successfully!');
            closeDeleteModalFunc();
            loadArtworks(); // Reload the artworks list
        } else {
            showError(result.error || 'Failed to delete artwork. Please try again.');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete artwork. Please check your connection and try again.');
    } finally {
        confirmDelete.disabled = false;
        confirmDelete.textContent = 'Delete';
    }
}

// Handle cleanup missing files
async function handleCleanup() {
    if (!confirm('This will remove database entries for missing image files. Continue?')) {
        return;
    }
    
    try {
        cleanupBtn.disabled = true;
        cleanupBtn.textContent = '🧹 Cleaning...';
        
        const response = await fetch('/admin/cleanup', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess(result.message);
            loadArtworks(); // Reload the artworks list
        } else {
            showError(result.error || 'Cleanup failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Cleanup error:', error);
        showError('Cleanup failed. Please check your connection and try again.');
    } finally {
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = '🧹 Cleanup Missing Files';
    }
}

// Utility functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    // Create a temporary notification
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `status-message ${type}`;
    notificationDiv.textContent = message;
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.top = '20px';
    notificationDiv.style.right = '20px';
    notificationDiv.style.zIndex = '9999';
    notificationDiv.style.maxWidth = '300px';
    
    document.body.appendChild(notificationDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notificationDiv.parentNode) {
            notificationDiv.parentNode.removeChild(notificationDiv);
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
