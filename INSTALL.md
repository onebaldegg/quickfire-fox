# THE QUICKNESS Extension - Installation Guide

## Quick Installation Steps

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in your Chrome address bar
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load THE QUICKNESS Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `the-quickness-extension` folder
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - Look for "THE QUICKNESS" in your Chrome toolbar
   - Click on it to see the popup with keyboard shortcuts

## Test the Extension

### Test Screenshot Capture
1. Go to any webpage (e.g., https://google.com)
2. Press `Ctrl+Alt+Q`
3. You should see a crosshair cursor
4. Click and drag to select an area
5. Add a note and click "Save PDF"
6. Check your Downloads/THE QUICKNESS folder for the PDF

### Test Hover Capture
1. Go to a webpage with images or text
2. Press `Ctrl+Alt+W`
3. Hover over images or text - they should highlight in orange
4. Click on a highlighted element
5. Add a note and save the PDF

### Test Quick Notes
1. On any webpage, press `Ctrl+Alt+E`
2. Type a note in the popup
3. Click "Save PDF"
4. The PDF should contain the URL and your note

## File Structure

```
the-quickness-extension/
├── manifest.json           # Extension configuration
├── background.js          # Background service worker
├── content.js            # Main extension logic
├── content.css           # Styling for overlays
├── popup.html            # Extension popup interface
├── jspdf.umd.min.js      # PDF generation library
├── html2canvas.min.js    # Screenshot capture library
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md             # Detailed documentation
└── INSTALL.md            # This file
```

## Keyboard Shortcuts

- `Ctrl+Alt+Q` - Screenshot region selection
- `Ctrl+Alt+W` - Hover capture mode
- `Ctrl+Alt+E` - Quick note
- `Escape` - Cancel current operation

## Troubleshooting

### Extension Not Loading
- Make sure Developer Mode is enabled
- Check that all files are present in the extension folder
- Look for error messages in the Extensions page

### Shortcuts Not Working
- Ensure the webpage has focus (click on it first)
- Check if other extensions are using the same shortcuts
- Try refreshing the page

### PDFs Not Saving
- Check your Downloads folder for "THE QUICKNESS" subfolder
- Ensure Chrome has download permissions
- Check Chrome's download settings

### Screenshots Appear Blank
- Some websites block screenshot capture for security
- Try refreshing and capturing again
- Check the browser console for error messages

## Privacy & Security

- All processing happens locally on your computer
- No data is sent to external servers
- URLs and content are only used for local PDF generation
- Files are saved only to your local Downloads folder

## Next Steps

After installation, THE QUICKNESS is ready to use! Simply use the keyboard shortcuts on any webpage to start capturing content. All your captures will be automatically saved as formatted PDFs in your Downloads/THE QUICKNESS folder.

For detailed usage instructions, see the main README.md file.