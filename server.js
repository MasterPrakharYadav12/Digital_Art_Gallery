const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Database setup
const db = new sqlite3.Database('gallery.db');

// Initialize database tables
db.serialize(() => {
    // Photos table
    db.run(`CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        filename TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id INTEGER,
        comment TEXT NOT NULL,
        comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE
    )`);

    // Likes table
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id INTEGER,
        like_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE
    )`);
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// USER API ENDPOINTS

// GET /photos - List all photos with optional filters
app.get('/photos', (req, res) => {
    const { category, sort, search } = req.query;
    
    let query = `
        SELECT p.*, 
               COUNT(DISTINCT l.id) as like_count,
               COUNT(DISTINCT c.id) as comment_count
        FROM photos p
        LEFT JOIN likes l ON p.id = l.photo_id
        LEFT JOIN comments c ON p.id = c.photo_id
    `;
    
    let conditions = [];
    let params = [];
    
    if (category && category !== 'all') {
        conditions.push('p.category = ?');
        params.push(category);
    }
    
    if (search) {
        conditions.push('(p.title LIKE ? OR p.category LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY p.id';
    
    if (sort === 'oldest') {
        query += ' ORDER BY p.upload_date ASC';
    } else {
        query += ' ORDER BY p.upload_date DESC';
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST /comment/:photo_id - Add comment
app.post('/comment/:photo_id', (req, res) => {
    const { photo_id } = req.params;
    const { comment } = req.body;
    
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    db.run('INSERT INTO comments (photo_id, comment) VALUES (?, ?)', 
           [photo_id, comment.trim()], 
           function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Comment added successfully' });
    });
});

// GET /comments/:photo_id - Fetch comments
app.get('/comments/:photo_id', (req, res) => {
    const { photo_id } = req.params;
    
    db.all('SELECT * FROM comments WHERE photo_id = ? ORDER BY comment_date DESC', 
           [photo_id], 
           (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST /like/:photo_id - Add like
app.post('/like/:photo_id', (req, res) => {
    const { photo_id } = req.params;
    
    db.run('INSERT INTO likes (photo_id) VALUES (?)', [photo_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Like added successfully' });
    });
});

// GET /likes/:photo_id - Get like count
app.get('/likes/:photo_id', (req, res) => {
    const { photo_id } = req.params;
    
    db.get('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?', 
           [photo_id], 
           (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ count: row.count });
    });
});

// ADMIN API ENDPOINTS

// GET /admin/photos - List all uploaded photos
app.get('/admin/photos', (req, res) => {
    db.all(`
        SELECT p.*, 
               COUNT(DISTINCT l.id) as like_count,
               COUNT(DISTINCT c.id) as comment_count
        FROM photos p
        LEFT JOIN likes l ON p.id = l.photo_id
        LEFT JOIN comments c ON p.id = c.photo_id
        GROUP BY p.id
        ORDER BY p.upload_date DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST /admin/upload - Upload new photo
app.post('/admin/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    const { title, category } = req.body;
    
    if (!title || !category) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Title and category are required' });
    }
    
    db.run('INSERT INTO photos (title, category, filename) VALUES (?, ?, ?)', 
           [title, category, req.file.filename], 
           function(err) {
        if (err) {
            // Delete uploaded file if database insert fails
            fs.unlinkSync(req.file.path);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID, 
            message: 'Photo uploaded successfully',
            filename: req.file.filename 
        });
    });
});

// DELETE /admin/delete/:id - Delete photo with related comments and likes
app.delete('/admin/delete/:id', (req, res) => {
    const { id } = req.params;
    
    // First get the filename to delete the file
    db.get('SELECT filename FROM photos WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        const filename = row.filename;
        const filePath = path.join('uploads', filename);
        
        // Delete the photo record (CASCADE will handle comments and likes)
        db.run('DELETE FROM photos WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Delete the physical file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            res.json({ message: 'Photo deleted successfully' });
        });
    });
});

// DELETE /admin/cleanup - Remove missing files from DB
app.delete('/admin/cleanup', (req, res) => {
    db.all('SELECT id, filename FROM photos', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        let deletedCount = 0;
        let processed = 0;
        
        if (rows.length === 0) {
            return res.json({ message: 'No photos to check', deletedCount: 0 });
        }
        
        rows.forEach(photo => {
            const filePath = path.join('uploads', photo.filename);
            
            if (!fs.existsSync(filePath)) {
                // File doesn't exist, remove from database
                db.run('DELETE FROM photos WHERE id = ?', [photo.id], (deleteErr) => {
                    if (!deleteErr) {
                        deletedCount++;
                    }
                    processed++;
                    
                    if (processed === rows.length) {
                        res.json({ 
                            message: `Cleanup completed. Removed ${deletedCount} orphaned records.`,
                            deletedCount 
                        });
                    }
                });
            } else {
                processed++;
                if (processed === rows.length) {
                    res.json({ 
                        message: `Cleanup completed. Removed ${deletedCount} orphaned records.`,
                        deletedCount 
                    });
                }
            }
        });
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🎨 Digital Art Gallery server running on http://localhost:${PORT}`);
    console.log(`📁 Admin panel: http://localhost:${PORT}/admin`);
});
