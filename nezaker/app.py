import os
import sys
import subprocess
import threading
import time
import webbrowser
import database
import pdf_service
import scheduler_service
import server

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 5500
URL = f"http://127.0.0.1:{PORT}"

def run_flask():
    server.start_server(port=PORT)

def launch_desktop_window(url):
    """
    Launches a dedicated standalone native desktop application window.
    Prioritizes PyWebView (true native desktop frame), falling back to Edge App Mode.
    """
    # 1. Native PyWebView
    try:
        import webview
        print("Launching native Desktop Window via PyWebView...")
        webview.create_window(
            title='نذاكر | Nezaker — المنصة الطبية الذكية لطلاب الطب',
            url=url,
            width=1400,
            height=900,
            min_size=(1050, 720)
        )
        webview.start()
        return "closed"
    except Exception as e:
        print(f"PyWebView fallback: {e}")

    # 2. Standalone Edge App Mode
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe")
    ]
    
    edge_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            edge_exe = p
            break

    if edge_exe:
        print(f"Launching standalone Desktop App window via Edge App Mode...")
        profile_dir = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "nezaker_edge_profile")
        app_args = [
            edge_exe,
            f"--app={url}",
            f"--user-data-dir={profile_dir}",
            "--window-size=1350,880",
            "--window-position=50,50",
            "--disable-extensions",
            "--no-first-run",
            "--app-auto-launched"
        ]
        proc = subprocess.Popen(app_args)
        start_time = time.time()
        proc.wait()
        if time.time() - start_time < 3:
            print("App window launched. Server is active. Press Ctrl+C to terminate.")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
        return "closed"
    else:
        # 3. Fallback to standard browser
        print("Opening in default browser...")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        return "closed"

def main():
    print("=" * 60)
    print("Starting: Nezaker - Medical AI Platform")
    print("=" * 60)

    # 1. Initialize Database
    database.init_db()

    # 2. Check indexed lectures
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM lectures")
    lec_count = cur.fetchone()[0]
    print(f"Lectures indexed in database: {lec_count}")
    conn.close()

    # 3. Start Flask background server
    t = threading.Thread(target=run_flask, daemon=True)
    t.start()
    time.sleep(1.2) # Allow flask to bind

    print(f"Local server running at: {URL}")

    # 4. Launch Desktop Window
    launch_desktop_window(URL)

if __name__ == "__main__":
    main()
