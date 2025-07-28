* When I say "process feedback", that means:
  - list json files in `temp/feedback/reports` 1 at a time. For each feedback:
    - review the feedback/logs in json, screenshot, related code
    - determine if action can be taken. 
      - If not move json to `temp/feedback/no-action` folder.
      - If so, perform changes, in `temp/feedback/processed` folder, create a markdown file (same filename as report with extension as .md instead) containing the summary of the feedback, what problem was discovered, and changes applied. Delete the feedback/screenshot file.
