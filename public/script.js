// Global variables
let allPhotos = [];
let currentPhotoId = null;

// DOM elements
const galleryGrid = document.getElementById('galleryGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const themeToggle = document.getElementById('themeToggle');

// Lightbox elements
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxLikeBtn = document.getElementById('lightboxLikeBtn');
const lightboxLikeCount = document.getElementById('lightboxLikeCount');
const lightboxCommentBtn = document.getElementById('lightboxCommentBtn');
const closeLightbox = document.getElementById('closeLightbox');

// Comments modal elements
const commentsModal = document.getElementById('commentsModal');
const closeCommentsModal = document.getElementById('closeCommentsModal');
const commentInput = document.getElementById('commentInput');
const submitComment = document.getElementById('submitComment');
const commentsList = document.getElementById('commentsList');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadPhotos();
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

// Event listeners setup
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Filter changes
    categoryFilter.addEventListener('change', loadPhotos);
    sortFilter.addEventListener('change', loadPhotos);
    
    // Lightbox controls
    closeLightbox.addEventListener('click', closeLightboxModal);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightboxModal();
        }
    });
    
    lightboxLikeBtn.addEventListener('click', function() {
        if (currentPhotoId) {
            likePhoto(currentPhotoId, true);
        }
    });
    
    lightboxCommentBtn.addEventListener('click', function() {
        if (currentPhotoId) {
            openCommentsModal(currentPhotoId);
        }
    });
    
    // Comments modal controls
    closeCommentsModal.addEventListener('click', closeCommentsModalFunc);
    commentsModal.addEventListener('click', function(e) {
        if (e.target === commentsModal) {
            closeCommentsModalFunc();
        }
    });
    
    submitComment.addEventListener('click', function() {
        if (currentPhotoId) {
            submitCommentFunc(currentPhotoId);
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (lightbox.style.display === 'block') {
                closeLightboxModal();
            }
            if (commentsModal.style.display === 'block') {
                closeCommentsModalFunc();
            }
        }
    });
}

// Load photos from API
async function loadPhotos() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams();
        
        const category = categoryFilter.value;
        const sort = sortFilter.value;
        const search = searchInput.value.trim();
        
        if (category && category !== 'all') {
            params.append('category', category);
        }
        
        if (sort) {
            params.append('sort', sort);
        }
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await fetch(`/photos?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Failed to load photos');
        }
        
        allPhotos = await response.json();
        displayPhotos(allPhotos);
        
    } catch (error) {
        console.error('Error loading photos:', error);
        showError('Failed to load photos. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display photos in the gallery grid
function displayPhotos(photos) {
    if (photos.length === 0) {
        galleryGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    galleryGrid.innerHTML = photos.map(photo => `
        <div class="art-card" data-id="${photo.id}">
            <div class="art-image-container">
                <img src="/uploads/${photo.filename}" alt="${photo.title}" class="art-image">
                <div class="image-overlay">
                    <button class="view-large-btn" onclick="openLightbox(${photo.id})">
                        🔍 View Large
                    </button>
                </div>
            </div>
            <div class="art-info">
                <h3 class="art-title">${escapeHtml(photo.title)}</h3>
                <p class="art-category">${escapeHtml(photo.category)}</p>
                <div class="art-actions">
                    <button class="like-btn" onclick="likePhoto(${photo.id})">
                        ❤️ <span class="like-count">${photo.like_count || 0}</span>
                    </button>
                    <button class="comment-btn" onclick="openCommentsModal(${photo.id})">
                        💬 Comments (${photo.comment_count || 0})
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle search
function handleSearch() {
    loadPhotos();
}

// Open lightbox with full image view
function openLightbox(photoId) {
    const photo = allPhotos.find(p => p.id === photoId);
    if (!photo) return;
    
    currentPhotoId = photoId;
    
    lightboxImage.src = `/uploads/${photo.filename}`;
    lightboxImage.alt = photo.title;
    lightboxTitle.textContent = photo.title;
    lightboxCategory.textContent = photo.category;
    lightboxLikeCount.textContent = photo.like_count || 0;
    
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightboxModal() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentPhotoId = null;
}

// Like a photo
async function likePhoto(photoId, isLightbox = false) {
    try {
        const response = await fetch(`/like/${photoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to like photo');
        }
        
        // Update like count in UI
        const likeResponse = await fetch(`/likes/${photoId}`);
        const likeData = await likeResponse.json();
        
        // Update gallery view
        const card = document.querySelector(`[data-id="${photoId}"]`);
        if (card) {
            const likeCountSpan = card.querySelector('.like-count');
            if (likeCountSpan) {
                likeCountSpan.textContent = likeData.count;
            }
        }
        
        // Update lightbox view if open
        if (isLightbox && currentPhotoId === photoId) {
            lightboxLikeCount.textContent = likeData.count;
        }
        
        // Update the photo in allPhotos array
        const photoIndex = allPhotos.findIndex(p => p.id === photoId);
        if (photoIndex !== -1) {
            allPhotos[photoIndex].like_count = likeData.count;
        }
        
    } catch (error) {
        console.error('Error liking photo:', error);
        showError('Failed to like photo. Please try again.');
    }
}

// Open comments modal
async function openCommentsModal(photoId) {
    currentPhotoId = photoId;
    commentsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Clear previous comments and input
    commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
    commentInput.value = '';
    
    await loadComments(photoId);
}

// Close comments modal
function closeCommentsModalFunc() {
    commentsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentPhotoId = null;
}

// Load comments for a photo
async function loadComments(photoId) {
    try {
        const response = await fetch(`/comments/${photoId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load comments');
        }
        
        const comments = await response.json();
        displayComments(comments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<div class="error-message">Failed to load comments.</div>';
    }
}

// Display comments in the modal
function displayComments(comments) {
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-results">No comments yet. Be the first to comment!</div>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-date">${formatDate(comment.comment_date)}</div>
            <div class="comment-text">${escapeHtml(comment.comment)}</div>
        </div>
    `).join('');
}

// Submit a new comment
async function submitCommentFunc(photoId) {
    const comment = commentInput.value.trim();
    
    if (!comment) {
        showError('Please enter a comment.');
        return;
    }
    
    try {
        const response = await fetch(`/comment/${photoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit comment');
        }
        
        // Clear input and reload comments
        commentInput.value = '';
        await loadComments(photoId);
        
        // Update comment count in gallery
        const card = document.querySelector(`[data-id="${photoId}"]`);
        if (card) {
            const commentBtn = card.querySelector('.comment-btn');
            if (commentBtn) {
                // Reload photos to get updated comment count
                loadPhotos();
            }
        }
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showError('Failed to submit comment. Please try again.');
    }
}

// Utility functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'status-message error';
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.maxWidth = '300px';
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
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
