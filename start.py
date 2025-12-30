import subprocess
import time
import sys

# --- COMMANDS LIST ---
# Add any new commands you want to run here as a string.
commands = [
    "ollama serve",
    "chroma run --host localhost --port 8000",
    # "your-new-command-here", 
]

def run_services():
    processes = []
    
    print(f"--- Starting {len(commands)} services ---")

    try:
        for cmd in commands:
            print(f"Launching: {cmd}")
            # shell=True is used here to make running simple string commands easier
            proc = subprocess.Popen(cmd, shell=True)
            processes.append(proc)
            
            # Short sleep to prevent CPU spikes and allow logs to print clearly
            time.sleep(1)

        print("\nAll services are running. Press Ctrl+C to stop all of them.\n")

        # Keep the main script alive while processes are running
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n--- Stopping services ---")
        for proc in processes:
            proc.terminate()
        print("All processes terminated.")
        sys.exit(0)

if __name__ == "__main__":
    run_services()