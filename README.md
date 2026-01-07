# SearchThatTerm

A Chrome extension that lets you instantly research any term or sentence without leaving your page. Get quick AI-powered summaries and dive deeper with a contextual chatbot.

## Features

- **Instant Explanations** - Select any text and get a quick, concise explanation
- **Contextual Chat** - Click "Dive Deeper" to ask follow-up questions
- **Context-Aware** - Uses surrounding text for more relevant explanations
- **Dark UI** - Clean glassmorphism design that works on any site
- **Multiple AI Models** - Choose from various OpenRouter-supported models
- **Free Tier Support** - Works with free OpenRouter models

## Installation

### From Source (Developer Mode)

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `SearchThatTerm` folder
6. Click the extension icon and **add your OpenRouter API key**

### Get an OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy and paste it into the extension settings

## Usage

1. **Select any text** on a webpage (a term, phrase, or sentence)
2. **Click the button** that appears near your selection
3. **Read the quick explanation** provided by the AI
4. **Click "Dive Deeper"** if you want to ask more questions
5. Use **Quick Actions** like "Simplify", "Example", or "Why important?"

## File Structure

```
SearchThatTerm/
├── manifest.json           # Extension configuration (Manifest V3)
├── background/
│   └── background.js       # Service worker for API calls
├── content/
│   ├── content.css         # Popup styling
│   └── content.js          # Text selection & UI logic
├── popup/
│   ├── popup.html          # Settings page
│   ├── popup.css           # Settings styling
│   └── popup.js            # Settings logic
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## Chrome Web Store Compliance & Permissions Explanation

This section explains why each permission declared in `manifest.json` is required for the extension to function.

### Permissions

#### `storage`
- **Purpose**: Store user preferences locally within Chrome's extension storage.
- **What is stored**: 
  - The user's OpenRouter API key (required to authenticate API requests)
  - The user's selected AI model preference
  - Any custom models the user has added
- **Why required**: Without this permission, the extension cannot persist user settings between sessions. Users would need to re-enter their API key every time they open the browser.

#### `activeTab`
- **Purpose**: Access the content of the currently active tab only when the user explicitly interacts with the extension.
- **What it allows**: Reading selected text from the current page after the user clicks the extension's trigger button.
- **Why required**: The extension needs to read the user's text selection to send it to the AI for explanation. This permission is the minimum required and does not grant persistent or background access to any tab.

### Host Permissions

#### `https://openrouter.ai/*`
- **Purpose**: Make API requests to OpenRouter's API endpoint.
- **What it allows**: The extension can send HTTP requests to `openrouter.ai` to retrieve AI-generated responses.
- **Why required**: OpenRouter is the AI backend that processes text and returns explanations. Without this permission, the extension cannot communicate with the AI service.

### Content Scripts

The extension injects a content script (`content/content.js` and `content/content.css`) on all pages (`<all_urls>`).

**What the content script does**:
- Listens for text selection events on the page
- Displays a trigger button near selected text when the user makes a selection
- Shows a popup UI when the user clicks the trigger button
- Sends messages to the background service worker to request AI explanations

**What the content script does NOT do**:
- Does not automatically collect, scrape, or transmit any page content
- Does not read page content unless the user explicitly selects text and clicks the trigger button
- Does not run in the background or persist beyond the page session
- Does not modify page content (except for injecting the extension's UI elements)
- Does not access cookies, form data, passwords, or any sensitive page elements

---

## Privacy & Data Usage (Detailed)

This section provides a complete description of the extension's data handling practices.

### Data Accessed

| Data Type | When Accessed | Purpose |
|-----------|---------------|---------|
| User-selected text | When user clicks the trigger button | Sent to OpenRouter API for AI processing |
| Surrounding paragraph text | When user clicks the trigger button | Provides context for more relevant AI responses |
| User-provided API key | When user enters it in settings | Stored locally to authenticate OpenRouter API requests |

### When Data Is Sent

Data is transmitted to external servers **only** under the following conditions:
1. The user explicitly selects text on a webpage
2. The user clicks the extension's trigger button (a visual button that appears near the selection)
3. The extension sends the selected text to OpenRouter's API

**No data is ever sent automatically, in the background, or without explicit user action.**

### Where Data Is Sent

- **Destination**: `https://openrouter.ai/api/v1/chat/completions`
- **Purpose**: To retrieve AI-generated explanations of the selected text
- **Protocol**: HTTPS (encrypted)
- **Third-party service**: OpenRouter.ai (see their privacy policy at https://openrouter.ai/privacy)

### Data Storage

| Data | Storage Location | Persistence |
|------|------------------|-------------|
| API key | Chrome's `chrome.storage.sync` | Until user clears it or uninstalls extension |
| Model preference | Chrome's `chrome.storage.sync` | Until user changes it or uninstalls extension |
| Custom models | Chrome's `chrome.storage.sync` | Until user removes them or uninstalls extension |
| Conversation history | In-memory only | Cleared when popup is closed or page is refreshed |

### What Is Never Collected or Stored

- Browsing history
- Page URLs (not logged or transmitted)
- Cookies or session tokens
- Form data or passwords
- Personal information
- Usage analytics or telemetry
- Any data when the extension is not actively used

### API Key Handling

- The API key is provided by the user and stored locally in Chrome's extension storage
- The API key is transmitted only to OpenRouter's API endpoint for authentication
- The API key is never transmitted to the extension developer or any other third party
- The extension developer has no access to user API keys

### No Remote Code Execution

- The extension does not load or execute any remote JavaScript
- All extension code is bundled and distributed through the Chrome Web Store
- No external scripts are fetched or executed at runtime

---

## Privacy

The extension is designed with user privacy as a priority:

1. **Local storage only**: All user settings (API key, model preferences) are stored locally in Chrome's extension storage. No user data is stored on external servers controlled by the extension developer.

2. **User-initiated requests only**: The extension only sends data to OpenRouter when the user explicitly clicks the trigger button. There is no background data collection, automatic scraping, or passive monitoring.

3. **Minimal data transmission**: Only the user-selected text and surrounding context are sent to OpenRouter. No other page content, URLs, or metadata are transmitted.

4. **No analytics**: The extension does not include any analytics, tracking, or telemetry code.

5. **No data retention by developer**: The extension developer does not receive, store, or have access to any user data, API keys, or selected text.

6. **Third-party data handling**: Text sent to OpenRouter is subject to OpenRouter's privacy policy and terms of service. Users should review OpenRouter's policies at https://openrouter.ai/privacy.

---

## Troubleshooting

**Popup doesn't appear?**
- Make sure you've added your API key in the extension settings
- Try refreshing the page
- Check if the extension is enabled

**Getting errors?**
- Verify your API key is correct
- Check your OpenRouter account has credits (for paid models)
- Try switching to a free model

---

## License

MIT License - Feel free to modify and distribute!
