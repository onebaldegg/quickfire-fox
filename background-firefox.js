/* global browser */
// THE QUICKNESS - Firefox Background Script
// Converted from Chrome extension to Firefox using browser.* namespace

// Load jsPDF library using dynamic import approach for Firefox
let jsPDF = null;

// Load jsPDF when extension starts
async function loadJsPDF() {
  try {
    // Use dynamic script loading that works with Firefox CSP
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('jspdf.umd.min.js');
    script.onload = () => {
      // Access jsPDF from the global scope after script loads
      jsPDF = window.jspdf?.jsPDF;
      console.log('jsPDF loaded successfully:', !!jsPDF);
    };
    script.onerror = (error) => {
      console.error('Failed to load jsPDF script:', error);
    };
    document.head.appendChild(script);
    
    // Wait a bit for the script to load
    await new Promise(resolve => setTimeout(resolve, 100));
    return !!jsPDF;
  } catch (error) {
    console.error('Failed to load jsPDF:', error);
    return false;
  }
}

// Initialize jsPDF on startup
loadJsPDF();

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
        // Get tab title for the bookmark
        const tab = await browser.tabs.get(sender.tab.id);
        const tabTitle = tab.title;

        // 1. Create the bookmark
        await createBookmark(request.filename, request.note, request.url, sender.tab.id, tabTitle);

        // 2. Generate and download the PDF
        await generateAndDownloadPDF(request.screenshot, request.links, request.note, request.url, sender.tab.id, request.filename);

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
        await generateAndDownloadPDF(request.screenshot, request.links, request.note, request.url, sender.tab.id, request.filename);
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

// Generate PDF directly in background script (proper Firefox approach)
async function generateAndDownloadPDF(screenshot, links, note, url, tabId, filename) {
  try {
    console.log('Background: Starting PDF generation...');
    
    // Check if jsPDF is loaded
    if (!jsPDF) {
      throw new Error('jsPDF not loaded - try reloading the extension');
    }
    
    // Create an image to get proper dimensions
    const img = new Image();
    img.src = screenshot;
    await img.decode(); // Wait for the image to be fully loaded

    const imgWidth = img.width;
    const imgHeight = img.height;

    // A4 page size is 210mm wide x 297mm high
    const pdfWidth = 210;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // Calculate height to keep aspect ratio

    const doc = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });
    
    // Add screenshot image with proper aspect ratio
    doc.addImage(screenshot, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Add clickable link areas
    if (links && links.length > 0) {
      console.log(`Background: Adding ${links.length} clickable links`);
      links.forEach(link => {
        if (link.href && link.x !== undefined && link.y !== undefined) {
          doc.link(link.x, link.y, link.width, link.height, { url: link.href });
        }
      });
    }
    
    // Add note if provided
    if (note && note.trim()) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(255, 255, 255);
      const noteLines = doc.splitTextToSize(`Note: ${note}`, 1500);
      const noteHeight = noteLines.length * 15;
      doc.rect(20, 4760, 1496, noteHeight + 20, 'F');
      doc.text(noteLines, 30, 4780);
    }
    
    // Generate PDF as blob
    const pdfBlob = doc.output('blob');
    
    // Create download URL and save file
    const url_obj = URL.createObjectURL(pdfBlob);
    const downloadId = await browser.downloads.download({
      url: url_obj,
      filename: `THE QUICKNESS/${filename}.pdf`,
      saveAs: false,
      conflictAction: 'uniquify'
    });
    
    console.log('Background: PDF saved successfully:', downloadId);
    
    // Notify content script of success
    await browser.tabs.sendMessage(tabId, {
      action: 'downloadSuccess',
      filename: filename
    });
    
  } catch (error) {
    console.error('Background: PDF generation failed:', error);
    
    // Notify content script of failure
    await browser.tabs.sendMessage(tabId, {
      action: 'downloadFailed',
      filename: filename,
      error: error.message
    });
    
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