# THE QUICKNESS - Chrome Extension

A powerful Chrome extension for quick capture of screenshots with notes and automatic bookmark saving.

## Features

- **One-Click Screenshot**: Click the extension icon to instantly capture the visible viewport
- **Note Modal**: Add personal notes with a purple-themed interface
- **Local PDF Saving**: Automatically saves screenshots with notes as landscape PDFs
- **Link Preservation**: Maintains clickable links from the original webpage in the PDF
- **Automatic Bookmarking**: Saves the current page URL as a bookmark in "THE QUICKNESS" folder
- **Formatted Layout**: PDFs include logo, source URL, screenshot, and notes in organized layout

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the `the-quickness-extension` folder containing this extension
5. The extension should now appear in your extensions list and be ready to use

### Method 2: Chrome Web Store (Future)
*This extension will be submitted to the Chrome Web Store in the future*

## Usage

### Screenshot Capture
1. Click the extension icon on any webpage
2. The extension will automatically capture the visible viewport
3. A purple-themed modal will appear with the screenshot preview
4. Add your notes in the text area
5. Click "Save PDF" to save both the PDF and create a bookmark

## File Organization

All captures are saved as PDFs in your browser's Downloads folder. Bookmarks are saved in "THE QUICKNESS" folder on your Bookmarks Bar.

**Naming Format**: `MMDDYY HHMM first-three-words-of-note.pdf`

**Example**: A screenshot on May 12, 2025 at 2:23pm with note "Shark bites man in the ocean" saves as:
- **PDF**: `051225 1423 Shark bites man.pdf`
- **Bookmark**: `051225 1423 Shark bites man`

## PDF Layout

Each PDF contains:
1. **Header**: "THE QUICKNESS" logo (top-left)
2. **Source URL**: Clickable link to the original webpage (top-right)
3. **Screenshot**: Full viewport capture with preserved clickable links
4. **Notes**: Your personal notes below the screenshot

## Permissions

This extension requires the following permissions:
- **activeTab**: To interact with the current webpage
- **scripting**: To inject content scripts for capture functionality
- **downloads**: To save PDFs to your local Downloads folder
- **storage**: To store extension settings
- **tabs**: To access tab information for URLs and titles
- **bookmarks**: To create and organize bookmarks automatically
- **host_permissions**: To work on all websites

## Technical Details

- **Manifest Version**: 3 (Latest Chrome extension standard)
- **Screenshot Technology**: HTML2Canvas for high-quality viewport capture
- **PDF Generation**: jsPDF for creating formatted landscape PDFs
- **File Saving**: Chrome Downloads API for local file management
- **Bookmarking**: Chrome Bookmarks API for automatic bookmark creation

## Troubleshooting

### Extension Not Working
- Ensure Developer Mode is enabled in Chrome Extensions
- Check that the extension is enabled in your extensions list
- Refresh the webpage and try again

### Captures Not Saving
- Check your Downloads folder for PDF files
- Ensure Chrome has permission to download files
- Check Chrome's download settings

### Screenshots Appear Blank
- Some websites may block screenshot capture due to security policies
- Try refreshing the page and capturing again
- Check browser console for any error messages

### Bookmarks Not Created
- Ensure the extension has bookmarks permission
- Check if "THE QUICKNESS" folder appears in your Bookmarks Bar
- Verify you're not on a restricted page (chrome:// URLs)

## Privacy

THE QUICKNESS operates entirely locally:
- No data is sent to external servers
- All captures are saved locally on your computer
- No personal information is collected or transmitted
- URLs and content are only processed locally for PDF generation and bookmarking

## Version History

### v1.0
- Initial release with icon-click screenshot functionality
- Purple-themed note modal with logo display
- Landscape PDF generation with organized layout
- Link preservation in screenshots and PDFs
- Automatic Chrome bookmark creation
- Local file saving with structured naming

## Support

For issues, bugs, or feature requests, please refer to the extension's support documentation or contact the developer.

## License

This extension is provided as-is for personal use. Please refer to the license file for detailed terms and conditions.