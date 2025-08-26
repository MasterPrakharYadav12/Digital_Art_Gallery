# 🎨 Digital Art Gallery

A full-stack web application for showcasing digital artworks with user interaction features and admin management capabilities.

## Features

### 🖼️ Main Gallery (User Portal)
- **Grid-based gallery** displaying uploaded artworks
- **Filter by category** (Pencil, Ink, Acrylic, Digital, Watercolor, Oil, Mixed Media)
- **Sort options** (Newest/Oldest first)
- **Search functionality** (by title and category)
- **Dark/Light mode toggle** with persistent theme
- **Interactive art cards** with hover effects
- **Lightbox view** for full-size image viewing
- **Like system** - users can like artworks
- **Comment system** - users can add and view comments
- **Responsive design** for all device sizes

### 🔑 Admin Panel
- **Secure login** with password protection (password: `ruchita123`)
- **Upload new artworks** with title, category, and image file
- **Manage existing artworks** with thumbnail previews
- **Delete artworks** with confirmation dialog
- **Cleanup missing files** - remove orphaned database entries
- **View artwork statistics** (likes and comments count)
- **Dark/Light mode toggle**
- **Session management** with logout functionality

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite3** database for data persistence
- **Multer** for file upload handling
- **RESTful API** design

### Frontend
- **Vanilla JavaScript** (no frameworks)
- **HTML5** with semantic markup
- **CSS3** with CSS Grid and Flexbox
- **CSS Custom Properties** for theming
- **Responsive design** with mobile-first approach

### Database Schema
- **photos** table: id, title, category, filename, upload_date
- **comments** table: id, photo_id, comment, comment_date
- **likes** table: id, photo_id, like_date
- **Foreign key constraints** with CASCADE delete

## Installation & Setup

1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the server**:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```
4. **Access the application**:
   - Main Gallery: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## API Endpoints

### User APIs
- `GET /photos` - List all photos with optional filters (category, sort, search)
- `POST /comment/:photo_id` - Add a comment to a photo
- `GET /comments/:photo_id` - Get all comments for a photo
- `POST /like/:photo_id` - Add a like to a photo
- `GET /likes/:photo_id` - Get like count for a photo

### Admin APIs
- `GET /admin/photos` - List all uploaded photos with statistics
- `POST /admin/upload` - Upload a new photo (multipart/form-data)
- `DELETE /admin/delete/:id` - Delete a photo and related data
- `DELETE /admin/cleanup` - Remove orphaned database entries

## File Structure

```
digital-art-gallery/
├── server.js              # Main server file with API endpoints
├── package.json           # Node.js dependencies and scripts
├── gallery.db             # SQLite database (created automatically)
├── uploads/               # Directory for uploaded images
└── public/                # Frontend files
    ├── index.html         # Main gallery page
    ├── admin.html         # Admin panel page
    ├── styles.css         # CSS styles for both pages
    ├── script.js          # JavaScript for main gallery
    └── admin.js           # JavaScript for admin panel
```

## Features in Detail

### Image Upload
- **File validation**: Only image files (JPG, PNG, GIF, WebP) allowed
- **Size limit**: Maximum 10MB per file
- **Unique filenames**: Timestamp-based naming to prevent conflicts
- **Error handling**: Proper cleanup if upload fails

### Database Management
- **Foreign key constraints** with CASCADE delete
- **Automatic cleanup** of orphaned records
- **Transaction safety** for data integrity
- **Efficient queries** with JOIN operations for statistics

### User Experience
- **Smooth animations** and transitions
- **Keyboard navigation** support (ESC to close modals)
- **Loading states** and error handling
- **Responsive design** for mobile and desktop
- **Accessibility features** with proper ARIA labels

### Security Features
- **File type validation** on both client and server
- **SQL injection prevention** with parameterized queries
- **XSS protection** with HTML escaping
- **Session-based admin authentication**


## Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes
- Uses vanilla JavaScript for maximum compatibility
- No external CSS frameworks for lightweight performance
- SQLite for easy deployment without external database
- Modular code structure for maintainability

## Future Enhancements
- User registration and authentication
- Advanced search with tags
- Image editing capabilities
- Social sharing features
- Analytics dashboard
- Bulk upload functionality

---

**Created with ❤️ for digital art enthusiasts**
