document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('dark-theme')) {
            icon.classList.replace('ph-moon', 'ph-sun');
        } else {
            icon.classList.replace('ph-sun', 'ph-moon');
        }
    });

    // Drag and Drop Logic
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const dashboard = document.getElementById('dashboard');
    const fileList = document.getElementById('fileList');

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    window.droppedFiles = {}; // Store files in memory

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Handle selected files
    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if(files.length > 0) dashboard.style.display = 'block';
        
        Array.from(files).forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                showToast(`File ${file.name} is too large (>50MB)`, 'error');
                return;
            }
            addFileToList(file);
        });
    }

    function addFileToList(file) {
        const id = 'file-' + Math.random().toString(36).substr(2, 9);
        window.droppedFiles[id] = file;
        
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const ext = file.name.split('.').pop().toLowerCase();
        
        let targetFormats = '';
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
            targetFormats = `
                <option value="jpg">to JPG</option>
                <option value="png">to PNG</option>
                <option value="webp">to WEBP</option>
            `;
        } else if (['docx', 'pptx'].includes(ext)) {
            targetFormats = `<option value="pdf">to PDF</option>`;
        } else {
            targetFormats = `<option value="pdf">to PDF</option>`; // Fallback generic
        }

        const template = `
            <div class="file-item" id="${id}">
                <div class="file-info">
                    <i class="ph ph-file"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${sizeMB} MB</span>
                </div>
                <div class="file-status status-pending">
                    <i class="ph ph-clock"></i> Pending
                </div>
                <div class="file-actions">
                    <select class="format-select" id="target-${id}">
                        ${targetFormats}
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="startConversion('${id}', '${file.name}')">Convert</button>
                    <button class="btn-icon text-danger" onclick="removeFile('${id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `;
        
        fileList.insertAdjacentHTML('beforeend', template);
        showToast(`Added ${file.name}`);
    }

});

// Global functions for inline handlers
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-in reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.removeFile = function(id) {
    document.getElementById(id).remove();
    delete window.droppedFiles[id];
}

// REAL integration with Flask API backend
window.startConversion = async function(id, filename) {
    const item = document.getElementById(id);
    const targetFormat = document.getElementById(`target-${id}`).value;
    const statusDiv = item.querySelector('.file-status');
    const actionsDiv = item.querySelector('.file-actions');
    const file = window.droppedFiles[id];
    
    if (!file) {
        showToast('File not found in memory', 'error');
        return;
    }
    
    statusDiv.innerHTML = '<div class="spinner"></div> <span>Converting to '+targetFormat.toUpperCase()+'...</span>';
    statusDiv.className = 'file-status status-pending';
    actionsDiv.style.opacity = '0.5';
    actionsDiv.style.pointerEvents = 'none';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', targetFormat);
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/convert', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Conversion failed');
        }
        
        statusDiv.className = 'file-status status-success';
        statusDiv.innerHTML = '<i class="ph ph-check-circle"></i> <span>Completed</span>';
        
        actionsDiv.style.opacity = '1';
        actionsDiv.style.pointerEvents = 'all';
        
        // Render the actual clickable download button
        actionsDiv.innerHTML = `
            <a href="http://127.0.0.1:5000${data.download_url}" class="btn btn-secondary btn-sm" download>
                <i class="ph ph-download-simple"></i> Download File
            </a>
            <button class="btn-icon text-danger" onclick="removeFile('${id}')"><i class="ph ph-trash"></i></button>
        `;
        showToast(`${filename} converted successfully!`);
        
    } catch (err) {
        console.error(err);
        statusDiv.className = 'file-status status-error';
        statusDiv.innerHTML = '<i class="ph ph-warning-circle"></i> <span>Failed</span>';
        
        actionsDiv.style.opacity = '1';
        actionsDiv.style.pointerEvents = 'all';
        showToast(err.message, 'error');
    }
}
