from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))
        
        print("Navigating to app...")
        page.goto('http://localhost:5173')
        time.sleep(3)
        
        print("Checking Sidebar...")
        connect_btn = page.locator("button").filter(has_text="连接设备")
        
        if not connect_btn.is_visible():
            print("Connect button not found!")
            print("Content:", page.content())
        
        assert connect_btn.is_visible()
        browser.close()

if __name__ == "__main__":
    run()
