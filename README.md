# ConvertPro - Universal File Converter 🚀

ConvertPro is a fast, responsive, and secure web application designed to convert your documents and images easily without relying on third-party cloud services. Built with a Flask Python backend and a beautiful Vanilla HTML/CSS/JS glassmorphism frontend, everything runs locally on your machine—ensuring 100% privacy.

## ✨ Features
- **Drag & Drop UI**: Sleek, modern dashboard built with a responsive glassmorphism aesthetic.
- **Image Conversion**: Effortlessly convert between PNG, JPG, JPEG, and WEBP.
- **Document Conversion**: Convert DOCX and PPTX files directly to PDF.
- **Privacy First**: Files are converted locally and an auto-delete daemon gracefully purges any uploads/converted files older than 1 hour.
- **Dark/Light Themes**: Beautiful visual toggle for nighttime viewing.

---

## 💻 Prerequisites (What you need to download)

To run this application on an everyday Windows computer, you need to install the following core software:

### 1. Python (Required)
The engine that runs the backend server and handles conversions.
- **Download**: [python.org/downloads](https://www.python.org/downloads/)
- ⚠️ **CRITICAL INSTALLATION STEP**: When you run the Python installer, look at the very bottom of the first setup window and **make sure to check the box that says "Add python.exe to PATH"**. If you skip this, your computer terminal will not be able to recognize Python commands!

### 2. Microsoft Office (Required for Documents)
To accurately convert complex formatting in Word (`.docx`) and PowerPoint (`.pptx`) files to PDF, the backend securely hooks into the Microsoft Office suite running on your PC.
- You must have Microsoft Word and PowerPoint installed and activated on your computer for these specific document conversions to succeed.

---

## 🛠️ Setup and Execution Guide

Follow these simple steps once you have Python installed correctly:

### Step 1: Download the Project
1. Clone this repository or click the green **Code** button and select **Download ZIP**.
2. Extract the folder to a location on your computer (e.g., your Desktop).

### Step 2: Open your Terminal
1. Open the project folder you just extracted.
2. Click on the address bar at the top of the file explorer window, type the word `cmd`, and press **Enter**. This will instantly open a black terminal window pointing directly to the project folder.

### Step 3: Install the Magic
In the terminal, copy and paste the following command to download the required Python libraries (like Flask and Pillow) and press Enter:
```cmd
pip install -r requirements.txt
```

### Step 4: Turn on the Engine
Once the installation finishes, type the following to start the conversion backend:
```cmd
python app.py
```
*(You will see a message that says `* Running on http://127.0.0.1:5000`. **Leave this black window open** in the background!)*

### Step 5: Launch the Application
Finally, go back to your project folder and double-click the `index.html` file. It will open in your web browser. Drag a file in, click convert, and enjoy!
