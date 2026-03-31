import os
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

try:
    from docx2pdf import convert as docx_convert
except ImportError:
    docx_convert = None

try:
    import comtypes.client
    import pythoncom
except ImportError:
    comtypes = None

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.abspath('uploads')
CONVERTED_FOLDER = os.path.abspath('converted')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

import threading

def auto_delete_old_files():
    while True:
        try:
            current_time = time.time()
            for folder in [UPLOAD_FOLDER, CONVERTED_FOLDER]:
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)
                    if os.path.isfile(file_path):
                        if os.stat(file_path).st_mtime < current_time - 3600:
                            os.remove(file_path)
                            print(f"[Cleanup] Deleted old file: {filename}")
        except Exception as e:
            pass
        time.sleep(900)

cleanup_thread = threading.Thread(target=auto_delete_old_files, daemon=True)
cleanup_thread.start()

def convert_image(input_path, output_path, target_format):
    img = Image.open(input_path)
    if img.mode in ("RGBA", "P") and target_format.lower() in ['jpg', 'jpeg']:
        img = img.convert("RGB")
    
    format_map = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP'}
    pil_format = format_map.get(target_format.lower(), target_format.upper())
    img.save(output_path, pil_format)

def convert_docx_to_pdf(input_path, output_path):
    if not docx_convert:
        raise Exception("docx2pdf is not installed.")
    docx_convert(input_path, output_path)

def convert_pptx_to_pdf(input_path, output_path):
    if not comtypes:
        raise Exception("comtypes is not installed.")
    
    pythoncom.CoInitialize()
    powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
    try:
        powerpoint.Visible = 1
        deck = powerpoint.Presentations.Open(input_path, WithWindow=False)
        deck.SaveAs(output_path, 32) # 32 is the code for SaveAsPDF
        deck.Close()
    finally:
        powerpoint.Quit()
        pythoncom.CoUninitialize()

@app.route('/api/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file element in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    target_format = request.form.get('target', '').lower()
    if not target_format:
        return jsonify({'error': 'No target format specified'}), 400
        
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    filename_without_ext = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
    
    # Generate unique filenames
    unique_id = uuid.uuid4().hex[:8]
    safe_filename = f"{unique_id}_{file.filename}"
    input_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    
    out_filename = f"{unique_id}_{filename_without_ext}.{target_format}"
    output_path = os.path.join(CONVERTED_FOLDER, out_filename)
    
    file.save(input_path)
    
    try:
        # Image conversions
        if ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp'] and target_format in ['png', 'jpg', 'jpeg', 'webp']:
            convert_image(input_path, output_path, target_format)
            
        elif ext == 'docx' and target_format == 'pdf':
            convert_docx_to_pdf(input_path, output_path)
            
        elif ext == 'pptx' and target_format == 'pdf':
            convert_pptx_to_pdf(input_path, output_path)
            
        else:
            return jsonify({'error': f'Conversion from .{ext} to .{target_format} is currently unsupported or invalid.'}), 400
            
    except Exception as e:
        print(f"Error during conversion: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass
                
    return jsonify({
        'message': 'Success',
        'download_url': f'/api/download/{out_filename}'
    })

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(CONVERTED_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
