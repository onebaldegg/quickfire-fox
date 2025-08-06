# THE QUICKNESS - Firefox Extension

**Instant webpage screenshots to PDF with notes and bookmarks**

This is the Firefox version of THE QUICKNESS extension, converted from the Chrome version following Mozilla's WebExtensions API standards.

## 🔥 Key Features

- **One-click screenshots** - Click the extension icon to capture any webpage
- **PDF generation** - Automatically creates PDFs with screenshots and notes
- **Smart bookmarks** - Creates organized bookmarks in "THE QUICKNESS" folder
- **Download organization** - Saves PDFs to Downloads/THE QUICKNESS/ folder
- **Cross-platform** - Works on all Firefox-supported platforms

## 📦 Installation

### From Firefox Add-ons Store (AMO)
*Coming soon - extension pending review*

### Manual Installation (Developer Mode)
1. Download the extension files
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest-firefox.json` file

### Using web-ext (Recommended for Development)
```bash
# Install web-ext globally
npm install -g web-ext

# Run in development mode with auto-reload
web-ext run --source-dir=. --start-url=about:debugging

# Build for production
web-ext build --source-dir=.

# Lint for Firefox compatibility
web-ext lint --source-dir=.
```

## 🚀 How to Use

1. **Navigate** to any webpage you want to capture
2. **Click** the THE QUICKNESS extension icon in the toolbar
3. **Wait** for the screenshot to be captured automatically
4. **Add your note** in the popup modal (optional)
5. **Click "Save PDF"** to download and bookmark

## 📁 File Organization

Your PDFs are automatically saved to:
```
Downloads/
└── THE QUICKNESS/
    ├── 010825 1430 meeting notes.pdf
    ├── 010825 1445 research article.pdf
    └── ...
```

Bookmarks are organized in:
```
Bookmarks Toolbar/
└── THE QUICKNESS/
    ├── 010825 1430 meeting notes
    ├── 010825 1445 research article
    └── ...
```

## 🔧 Firefox-Specific Features

- **Native Promise Support** - Uses modern async/await syntax
- **Firefox Bookmark API** - Integrates with Firefox's bookmark system
- **Enhanced Security** - Follows Firefox's strict content security policies
- **Performance Optimized** - Leverages Firefox's efficient extension architecture

## 🆚 Differences from Chrome Version

- Uses `browser.*` namespace instead of `chrome.*`
- Promise-based API calls instead of callbacks
- Firefox-specific manifest keys (`browser_specific_settings`)
- Enhanced bookmark toolbar integration
- Improved error handling and logging

## 🛠️ Development

### Prerequisites
- Node.js and npm
- Firefox Developer Edition (recommended)
- web-ext tool

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd the-quickness-firefox

# Install web-ext
npm install -g web-ext

# Run in development mode
web-ext run
```

### Building
```bash
# Create production build
web-ext build

# This creates a .zip file in web-ext-artifacts/
```

### Testing
```bash
# Lint the extension
web-ext lint

# Run automated tests
web-ext run --start-url=about:debugging
```

## 📋 Firefox Add-on Policies Compliance

This extension complies with Mozilla's Add-on Policies:

- ✅ **No Surprises** - Clear description of functionality
- ✅ **Content Guidelines** - No inappropriate content
- ✅ **Source Code** - Clean, reviewable code provided
- ✅ **Security** - No remote code execution or obfuscation
- ✅ **Data Collection** - Minimal data handling, user consent
- ✅ **Performance** - Optimized for Firefox performance

## 🔒 Privacy & Permissions

### Required Permissions
- `activeTab` - Capture screenshots of current tab
- `scripting` - Inject content scripts for PDF generation
- `downloads` - Save PDFs to Downloads folder
- `bookmarks` - Create organized bookmarks

### Data Handling
- **No external servers** - All processing happens locally
- **No data collection** - No analytics or tracking
- **No remote code** - All code is included in the extension
- **Secure storage** - Uses Firefox's secure extension storage

## 🐛 Troubleshooting

### Extension Not Loading
1. Check that you selected `manifest-firefox.json` (not `manifest.json`)
2. Ensure Firefox version is 109.0 or higher
3. Try reloading in `about:debugging`

### Screenshot Issues
1. Refresh the page and try again
2. Check browser console for errors (F12)
3. Ensure the page is fully loaded before capturing

### PDF Generation Problems
1. Check that jsPDF library loads successfully
2. Verify sufficient browser memory
3. Try shorter notes if filename is too long

### Bookmark Creation Issues
1. Ensure bookmarks permission is granted
2. Check Firefox bookmark settings
3. Verify "THE QUICKNESS" folder is created

## 📞 Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: See Firefox extension docs
- **Community**: Join Mozilla Developer Network

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Mozilla WebExtensions team for excellent documentation
- jsPDF library for PDF generation
- html2canvas library for screenshot capabilities
- Firefox Developer Community for support and guidance

---

**THE QUICKNESS Team** - Making web capture quick and organized for Firefox users.