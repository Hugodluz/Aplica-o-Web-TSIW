document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('open-modal-btn');
    const modal = document.getElementById('testimonial-modal');
    const closeBtn = document.querySelector('.close-btn');
    const testimonialForm = document.getElementById('testimonial-form');
    const userName = document.getElementById('user-name');
    const testimonialContent = document.getElementById('testimonial-content');
    const userPhoto = document.getElementById('user-photo');
    const additionalInfo = document.getElementById('additional-info');
    const testimonialsList = document.getElementById('testimonials-list');

    // Function to open the modal
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Function to close the modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', event => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Handle form submission
    testimonialForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = userName.value;
        const content = testimonialContent.value;
        const photo = userPhoto.files[0];
        const additional = additionalInfo.value;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('content', content);
        if (photo) {
            formData.append('photo', photo);
        }
        if (additional) {
            formData.append('additional', additional);
        }

        fetch('/testimonials', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(testimonial => {
            addTestimonialToDOM(testimonial);
            userName.value = '';
            testimonialContent.value = '';
            userPhoto.value = '';
            additionalInfo.value = '';
            modal.style.display = 'none';
        });
    });

    // Fetch testimonials from the server
    fetch('/testimonials')
        .then(response => response.json())
        .then(data => {
            data.forEach(testimonial => addTestimonialToDOM(testimonial));
        });

    // Function to add testimonial to the DOM
    function addTestimonialToDOM(testimonial) {
        const div = document.createElement('div');
        div.classList.add('testimonial');
        div.innerHTML = `
            <p><strong>${testimonial.name}</strong></p>
            <p>${testimonial.content}</p>
            ${testimonial.photo ? `<img src="${testimonial.photo}" alt="User Photo">` : ''}
            ${testimonial.additional ? `<p>${testimonial.additional}</p>` : ''}
            <div class="admin-controls">
                <button class="delete-btn" data-id="${testimonial.id}">Delete</button>
            </div>
        `;
        testimonialsList.appendChild(div);

        // Add event listener for delete button
        div.querySelector('.delete-btn').addEventListener('click', event => {
            const id = event.target.getAttribute('data-id');
            fetch(`/testimonials/${id}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(() => {
                div.remove();
            });
        });
    }
});

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

let testimonials = [];
let nextId = 1;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

app.use(bodyParser.json());
app.use(express.static('public'));  // Serve static files from "public" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/testimonials', (req, res) => {
    res.json(testimonials);
});

app.post('/testimonials', upload.single('photo'), (req, res) => {
    const testimonial = {
        id: nextId++,
        name: req.body.name,
        content: req.body.content,
        photo: req.file ? `/uploads/${req.file.filename}` : null,
        additional: req.body.additional || ''
    };
    testimonials.push(testimonial);
    res.json(testimonial);
});

app.delete('/testimonials/:id', (req, res) => {
    const id = parseInt(req.params.id);
    testimonials = testimonials.filter(t => t.id !== id);
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

