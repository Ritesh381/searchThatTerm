# SearchThatTerm

A Chrome extension that lets you instantly research any term or sentence without leaving your page. Get quick AI-powered summaries and dive deeper with a contextual chatbot.

## 🎬 Demo Video

Watch the setup and usage tutorial: **[YouTube Demo](https://www.youtube.com/watch?v=P3bIdckAjAo)**

## Features

- **Instant Explanations** - Select any text and get a quick, concise explanation
- **Contextual Chat** - Click "Dive Deeper" to ask follow-up questions
- **Context-Aware** - Uses surrounding text for more relevant explanations
- **Dark UI** - Clean glassmorphism design that works on any site
- **Multiple AI Models** - Choose from various OpenRouter-supported models
- **Free Tier Support** - Works with free OpenRouter models
- **Multi-Popup Support** - Open up to 3 parallel conversations
- **Streaming Responses** - See AI responses appear word-by-word in real-time

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ritesh381/searchThatTerm.git
```

Or download the ZIP file from GitHub and extract it.

### Step 2: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Navigate to the cloned repository and select the **`extension`** folder
5. The extension should now appear in your extensions list

### Step 3: Configure Your API Key

1. Click the SearchThatTerm extension icon in your browser toolbar
2. Enter your OpenRouter API key
3. Select your preferred AI model
4. Start using the extension!

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
├── README.md
├── landing-page/
│   ├── index.html          # Landing page
│   └── privicy-policy.html # Privacy policy
└── extension/
    ├── manifest.json       # Extension configuration (Manifest V3)
    ├── background/
    │   └── background.js   # Service worker for API calls
    ├── content/
    │   ├── content.css     # Popup styling
    │   └── content.js      # Text selection & UI logic
    ├── popup/
    │   ├── popup.html      # Settings page
    │   ├── popup.css       # Settings styling
    │   └── popup.js        # Settings logic
    └── icons/
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

## Privacy

The extension is designed with user privacy as a priority:

1. **Local storage only**: All user settings (API key, model preferences) are stored locally in Chrome's extension storage. No user data is stored on external servers.

2. **User-initiated requests only**: The extension only sends data to OpenRouter when you explicitly click the trigger button. There is no background data collection.

3. **Minimal data transmission**: Only the selected text and surrounding context are sent to OpenRouter. No other page content, URLs, or metadata are transmitted.

4. **No analytics**: The extension does not include any analytics, tracking, or telemetry code.

5. **Third-party data handling**: Text sent to OpenRouter is subject to OpenRouter's privacy policy and terms of service. Review their policies at https://openrouter.ai/privacy.

## Troubleshooting

**Popup doesn't appear?**

- Make sure you've added your API key in the extension settings
- Try refreshing the page
- Check if the extension is enabled in `chrome://extensions/`

**Getting errors?**

- Verify your API key is correct
- Check your OpenRouter account has credits (for paid models)
- Try switching to a free model

**Extension not loading?**

- Make sure you selected the `extension` folder (not the root folder) when loading unpacked
- Check that Developer mode is enabled
- Try removing and re-adding the extension

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - Feel free to modify and distribute!
