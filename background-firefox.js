/* global browser */
// THE QUICKNESS - Firefox Background Script
// Converted from Chrome extension to Firefox using browser.* namespace


// Handle extension icon clicks
browser.action.onClicked.addListener(async (tab) => {
  console.log('THE QUICKNESS icon clicked, capturing screenshot');
  
  try {
    // Inject CSS and content script for modal UI
    await browser.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
    
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['logo-data.js']
    });
    
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-firefox-iframe.js']
    });
    
    // Capture screenshot directly in background script
    const dataUrl = await browser.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 95
    });
    
    // Send screenshot to content script for note modal
    await browser.tabs.sendMessage(tab.id, {
      action: 'showNoteModal',
      screenshot: dataUrl,
      url: tab.url
    });
    
  } catch (error) {
    console.error('Error in extension icon click handler:', error);
  }
});

// Handle messages from content script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  // Handle the new combined action
  if (request.action === 'saveBookmarkAndPDF') {
    (async () => {
      try {
        const tab = await browser.tabs.get(sender.tab.id);

        // 1. Fetch fresh link data directly from the tab
        const links = await getLinkData(sender.tab.id);

        // 2. Create the bookmark
        await createBookmark(request.filename, request.note, request.url, sender.tab.id, tab.title);

        // 3. Generate and download the PDF using the fresh link data
        await generateAndDownloadPDF(request.screenshot, links, request.note, request.url, sender.tab.id, request.filename, request.logo_base64);

        sendResponse({ success: true });
      } catch (error) {
        console.error('Failed during saveBookmarkAndPDF:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  } else if (request.action === 'generatePDF') {
    // Handle PDF generation with proper async response
    (async () => {
      try {
        await generateAndDownloadPDF(request.screenshot, request.links, request.note, request.url, sender.tab.id, request.filename, request.logo_base64);
        sendResponse({ success: true });
      } catch (error) {
        console.error('PDF generation failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  } else if (request.action === 'createBookmark') {
    // Handle bookmark creation with proper async response
    (async () => {
      try {
        await createBookmark(request.filename, request.note, request.url, sender.tab.id, sender.tab.title);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Bookmark creation failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
});

// ADD THIS ENTIRE NEW FUNCTION to background-firefox.js
async function getLinkData(tabId) {
  console.log('Background: Actively fetching link data from tab...');
  const results = await browser.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      const visibleLinks = [];
      document.querySelectorAll('a[href]').forEach(link => {
        const rect = link.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0 &&
                         rect.bottom <= window.innerHeight &&
                         rect.right <= window.innerWidth &&
                         rect.width > 0 && rect.height > 0;
        
        if (isVisible) {
          visibleLinks.push({
            href: link.href,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          });
        }
      });
      return visibleLinks;
    }
  });
  // The result is an array, so we take the first element's result
  return results[0].result;
}

// Generate PDF directly in background script with professional layout
async function generateAndDownloadPDF(screenshot, links, note, url, tabId, filename, logo_base64) {
  try {
    console.log('Background: Starting PDF generation with custom layout...');

    if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
      throw new Error('jsPDF library not found. Check manifest.json.');
    }

    const PAGE_MARGIN = 10;
    const A4_WIDTH = 297;
    const A4_HEIGHT = 210;
    const CONTENT_WIDTH = A4_WIDTH - (PAGE_MARGIN * 2);

    const doc = new jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Header, etc. ... (No changes here)
    const header_y_start = PAGE_MARGIN;
    if (logo_base64) {
      doc.addImage(logo_base64, 'PNG', PAGE_MARGIN, header_y_start, 40, 15);
    }
    doc.setFontSize(9);
    doc.setTextColor(0, 102, 204);
    doc.textWithLink(url, A4_WIDTH - PAGE_MARGIN, header_y_start + 8, { url: url, align: 'right' });
    const header_height = 30;
    doc.setDrawColor(200);
    doc.line(PAGE_MARGIN, header_height - 5, A4_WIDTH - PAGE_MARGIN, header_height - 5);

    // Screenshot
    const img = new Image();
    img.src = screenshot;
    await img.decode();
    const imgAspectRatio = img.height / img.width;
    const screenshotHeight = CONTENT_WIDTH * imgAspectRatio;
    const screenshot_y_start = header_height;
    doc.addImage(screenshot, 'PNG', PAGE_MARGIN, screenshot_y_start, CONTENT_WIDTH, screenshotHeight);
    
    // --- START OF DEBUG LOGGING ---

    // DEBUG: Log the dimensions to check our inputs
    console.log(`DEBUG: Image dimensions (px): ${img.width}w x ${img.height}h`);
    console.log(`DEBUG: PDF content area (mm): ${CONTENT_WIDTH}w x ${screenshotHeight}h`);

    if (links && links.length > 0) {
      const scaleX = CONTENT_WIDTH / img.width;
      const scaleY = screenshotHeight / img.height;

      // DEBUG: Log the calculated scale factors
      console.log(`DEBUG: Scale factors: scaleX=${scaleX}, scaleY=${scaleY}`);

      links.forEach((link, index) => {
        if (link.href) {
          const scaledX = link.x * scaleX + PAGE_MARGIN;
          const scaledY = link.y * scaleY + screenshot_y_start;
          const scaledWidth = link.width * scaleX;
          const scaledHeight = link.height * scaleY;
          
          // DEBUG: Log the data for the first link
          if (index === 0) {
            console.log('--- DEBUG: First Link Data ---');
            console.log('Original (px):', { x: link.x, y: link.y, w: link.width, h: link.height });
            console.log('Scaled (mm):', { x: scaledX, y: scaledY, w: scaledWidth, h: scaledHeight });
            console.log('URL:', link.href);
            console.log('-----------------------------');
          }
          
          doc.link(scaledX, scaledY, scaledWidth, scaledHeight, { url: link.href });
        }
      });
    } else {
      console.log("DEBUG: No links array or empty links array was received.");
    }
    
    // --- END OF DEBUG LOGGING ---
    
    // Note drawing, etc. ... (No changes here)
    if (note && note.trim()) {
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      const note_y_start = screenshot_y_start + screenshotHeight + 10;
      const noteLines = doc.splitTextToSize(`Notes: ${note}`, CONTENT_WIDTH);
      doc.text(noteLines, PAGE_MARGIN, note_y_start);
    }
    
    // Saving the document...
    const pdfBlob = doc.output('blob');
    const url_obj = URL.createObjectURL(pdfBlob);
    await browser.downloads.download({
      url: url_obj,
      filename: `THE QUICKNESS/${filename}.pdf`,
      saveAs: false,
      conflictAction: 'uniquify'
    });

  } catch (error) {
    console.error('Background: PDF generation failed:', error);
    throw error;
  }
}

// Bookmark creation function (converted to promises)
async function createBookmark(filename, note, url, tabId, tabTitle) {
  try {
    console.log('Background: Creating bookmark for:', url);
    console.log('Background: Received filename:', filename);
    console.log('Background: Received note:', note);
    console.log('Background: Tab title:', tabTitle);
    
    // Get the bookmarks tree to find the correct bookmarks bar ID
    const bookmarkTree = await browser.bookmarks.getTree();
    
    // Find the bookmarks bar - it's one of the top-level folders
    const rootNode = bookmarkTree[0];
    let bookmarksBarId = null;
    
    // Look for the bookmarks bar among the root's children
    for (const child of rootNode.children) {
      if (child.title === 'Bookmarks Toolbar' || child.title === 'Bookmarks Bar' || child.title === 'Bookmarks bar') {
        bookmarksBarId = child.id;
        break;
      }
    }
    
    // Fallback: if not found by title, use the first folder without a URL
    if (!bookmarksBarId && rootNode.children.length > 0) {
      for (const child of rootNode.children) {
        if (!child.url) { // Folders don't have URLs
          bookmarksBarId = child.id;
          break;
        }
      }
    }
    
    if (!bookmarksBarId) {
      throw new Error('Could not find bookmarks bar');
    }
    
    console.log('Background: Found bookmarks bar ID:', bookmarksBarId);
    
    // Search for existing "THE QUICKNESS" folder in the bookmarks bar
    const bookmarkBarChildren = await browser.bookmarks.getChildren(bookmarksBarId);
    
    // Look for existing "THE QUICKNESS" folder
    let quicknessFolder = bookmarkBarChildren.find(item => 
      item.title === 'THE QUICKNESS' && !item.url
    );
    
    // Create "THE QUICKNESS" folder if it doesn't exist
    if (!quicknessFolder) {
      console.log('Background: Creating THE QUICKNESS bookmark folder');
      quicknessFolder = await browser.bookmarks.create({
        parentId: bookmarksBarId,
        title: 'THE QUICKNESS'
      });
    }
    
    // Create bookmark title from filename (remove .pdf extension only)
    let bookmarkTitle = filename.replace('.pdf', '');
    console.log('Background: After removing .pdf extension:', bookmarkTitle);
    
    // If title is empty after cleanup, use the tab title or URL
    if (!bookmarkTitle.trim()) {
      bookmarkTitle = tabTitle || url;
      console.log('Background: Using fallback title:', bookmarkTitle);
    }
    
    console.log('Background: Final bookmark title will be:', bookmarkTitle);
    
    // Check if bookmark with same URL AND title already exists to avoid duplicates
    const existingBookmarks = await browser.bookmarks.search({ url: url });
    
    console.log('Background: Found existing bookmarks for this URL:', existingBookmarks.map(b => b.title));
    
    // Check if a bookmark with the same URL and title already exists
    const duplicateBookmark = existingBookmarks.find(bookmark => 
      bookmark.url === url && bookmark.title === bookmarkTitle
    );
    
    if (duplicateBookmark) {
      console.log('Background: Bookmark with same URL and title already exists:', duplicateBookmark.title);
      await notifyContentScriptBookmark(tabId, `Bookmark already exists: ${duplicateBookmark.title}`, true);
      return;
    }
    
    // Create the bookmark in the "THE QUICKNESS" folder
    const newBookmark = await browser.bookmarks.create({
      parentId: quicknessFolder.id,
      title: bookmarkTitle,
      url: url
    });
    
    console.log('Background: Bookmark created successfully:', newBookmark);
    
  } catch (error) {
    console.error('Background: Failed to create bookmark:', error);
    throw error;
  }
}

// Notify content script about bookmark creation result
async function notifyContentScriptBookmark(tabId, message, success) {
  try {
    await browser.tabs.sendMessage(tabId, {
      action: success ? 'bookmarkSuccess' : 'bookmarkFailed',
      message: message
    });
  } catch (error) {
    console.log('Background: Content script bookmark notification failed (this is normal):', error);
  }
}

// Remove the old downloadPDFToDownloads function - PDF generation now happens directly in background

async function notifyContentScript(tabId, filename, success) {
  try {
    await browser.tabs.sendMessage(tabId, {
      action: success ? 'downloadSuccess' : 'downloadFailed',
      filename: filename
    });
  } catch (error) {
    console.log('Background: Could not send notification to content script:', error);
  }
}

// Extension installation
browser.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS Firefox extension installed - Downloads folder only');
});