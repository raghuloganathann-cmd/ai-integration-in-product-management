# AI Integration in Product Management

A simple web project showing how AI-style automation supports product managers.

## Features
1. **Prioritize backlog** - ranks features using the RICE score: (Reach x Impact x Confidence) / Effort.
2. **Analyze feedback** - rule-based sentiment analysis and theme tagging of customer comments.
3. **Write user story** - generates a user story, acceptance criteria and a success metric.

## How to run
Unzip the folder and open `index.html` in any web browser. No installation needed.

## Project structure
```
ai-product-management/
  index.html     page structure
  css/style.css  styling (with automatic dark mode)
  js/app.js      application logic
  README.md      this file
```

## Connecting a real AI model
The sentiment analysis and story generator are rule-based so the project works offline.
To use a real LLM (for example the Claude API), call it from your own backend
(never put an API key in browser code) and use the result inside `analyzeComment()`
and the story generator in `js/app.js`. A commented `askAI()` example is included.

## Technologies
HTML5, CSS3, JavaScript (vanilla)
