This is a React app using Babel standalone for JSX in the browser

# Testing instructions

To test this script (a React app using Babel standalone for JSX in the browser) on localhost, you can serve the project directory using a simple HTTP server. Here are the common commands:

## Using Python3 (built-in on macOS):
Open a terminal and navigate to the project directory:

````cd "/Users/stuartnewman/Library/CloudStorage/OneDrive-THERAPEUTICINNOVATIONAUSTRALIALIMITED/TIA/19 - Valley of Death Game/VOD VSCODE"````

````python3 -m http.server 8000````

This starts a local webserver in the VOD VSCODE folder

This works for Windows too as long as in a system shell and not the Pythin terminal

Open your browser and go to http://localhost:8000.

## Stopping the localhost

To stop the Python HTTP server running on localhost, simply press Ctrl+C in the terminal where it's running. This will interrupt the process and stop the server immediately.

*If* you started it in the background (which isn't typical for python -m http.server), you might need to find and kill the process, but Ctrl+C is the standard way for foreground processes.

## Using Node.js (if installed):
Navigate to the project directory as above.

Run:
````npx serve . -p 8000````

Open your browser and go to http://localhost:8000.

The app should load and run directly in the browser since it uses CDN-hosted React and Babel. Stop the server with Ctrl+C when done. If you encounter issues, ensure no firewall blocks port 8000.



