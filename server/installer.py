import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import os
import sys
import queue

class InstallerUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Installer")
        self.root.geometry("600x400")
        self.root.resizable(False, False)
        
        self.main_container = ttk.Frame(root)
        self.main_container.pack(expand=True, fill='both')
        
        self.terms_frame = self.create_terms_page()
        self.install_frame = self.create_install_page()
        
        self.show_terms_page()
        
        self.log_queue = queue.Queue()

    def create_terms_page(self):
        frame = ttk.Frame(self.main_container)
        
        title_label = ttk.Label(frame, text="Terms of Use", font=('Arial', 14, 'bold'))
        title_label.pack(pady=10)

        terms_text = """Terms of Use

1. By accepting these terms, you agree to install this software on your system.
2. The installation process will:
   - Check and install Python if not present
   - Install required Python packages
   - Download and extract necessary files
   - Start a local server
3. You acknowledge that you understand these changes will be made to your system.

Please review the terms carefully before proceeding."""

        terms_area = scrolledtext.ScrolledText(frame, wrap=tk.WORD, width=60, height=15)
        terms_area.pack(padx=10, pady=10)
        terms_area.insert(tk.END, terms_text)
        terms_area.config(state='disabled')

        agreement_frame = ttk.Frame(frame)
        agreement_frame.pack(pady=10)

        self.agreement_var = tk.BooleanVar(value=False)

        ttk.Radiobutton(agreement_frame, text="I do not accept", variable=self.agreement_var, 
                       value=False, command=self.update_continue_button).pack(side=tk.LEFT, padx=10)
        ttk.Radiobutton(agreement_frame, text="I accept", variable=self.agreement_var,
                       value=True, command=self.update_continue_button).pack(side=tk.LEFT, padx=10)

        self.continue_button = ttk.Button(frame, text="Continue",
                                        command=self.show_install_page, state='disabled')
        self.continue_button.pack(pady=10)
        
        return frame

    def create_install_page(self):
        frame = ttk.Frame(self.main_container)
        
        title_label = ttk.Label(frame, text="Installation Progress", font=('Arial', 14, 'bold'))
        title_label.pack(pady=10)

        self.progress = ttk.Progressbar(frame, length=500, mode='determinate')
        self.progress.pack(padx=10, pady=10)

        self.log_area = scrolledtext.ScrolledText(frame, wrap=tk.WORD, 
                                                width=60, height=15)  
        self.log_area.pack(padx=10, pady=10)
        
        button_frame = ttk.Frame(frame)
        button_frame.pack(fill='x', padx=10, pady=5)
        
        self.finish_button = ttk.Button(button_frame, text="Finish",
                                      command=self.root.destroy, state='disabled')
        self.finish_button.pack(side='right')
        
        return frame

    def show_terms_page(self):
        self.install_frame.pack_forget()
        self.terms_frame.pack(expand=True, fill='both')

    def show_install_page(self):
        self.terms_frame.pack_forget()
        self.install_frame.pack(expand=True, fill='both')
        self.start_installation()
        self.root.after(100, self.check_log_queue)

    def update_continue_button(self):
        if self.agreement_var.get():
            self.continue_button.config(state='normal')
        else:
            self.continue_button.config(state='disabled')

    def start_installation(self):
        install_thread = threading.Thread(target=self.run_installation)
        install_thread.daemon = True
        install_thread.start()

    def run_installation(self):
        batch_path = os.path.join(os.getcwd(), "startup.bat")

        process = subprocess.Popen(batch_path, shell=True, stdout=subprocess.PIPE, 
                                 stderr=subprocess.STDOUT, universal_newlines=True)

        progress_value = 0
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                self.log_queue.put(output.strip())
                progress_value = min(progress_value + 2, 100)
                self.progress['value'] = progress_value
                self.root.update_idletasks()

        self.progress['value'] = 100
        self.log_queue.put("\nInstallation completed!")
        
        self.root.after(0, lambda: self.finish_button.config(state='normal'))

    def check_log_queue(self):
        while True:
            try:
                message = self.log_queue.get_nowait()
                self.log_area.insert(tk.END, message + '\n')
                self.log_area.see(tk.END)
            except queue.Empty:
                break
        
        self.root.after(100, self.check_log_queue)

def main():
    root = tk.Tk()
    app = InstallerUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()