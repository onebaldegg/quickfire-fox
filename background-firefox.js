/* global browser */
// THE QUICKNESS - Firefox Background Script
// Converted from Chrome extension to Firefox using browser.* namespace

// Handle extension icon clicks
browser.action.onClicked.addListener(async (tab) => {
  console.log('THE QUICKNESS icon clicked, injecting scripts and triggering screenshot');
  console.log('THE QUICKNESS - Tab info:', tab.id, tab.url);
  
  try {
    // Inject CSS and scripts dynamically (activeTab permission)
    await browser.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
    
    // Inject logo data first, then content script (jsPDF will be loaded via blob)
    console.log('Injecting logo data...');
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['logo-data.js']
    });
    
    console.log('Injecting content script...');
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-firefox.js']
    });
    
    // Small delay to ensure content script is ready
    setTimeout(async () => {
      try {
        // Capture the visible tab using Firefox's API
        const dataUrl = await browser.tabs.captureVisibleTab(null, {
          format: 'png',
          quality: 95
        });
        
        // Send the captured screenshot to content script
        await browser.tabs.sendMessage(tab.id, {
          action: 'showNoteModal',
          screenshot: dataUrl,
          url: tab.url
        });
      } catch (error) {
        console.error('Failed to capture tab or send message:', error);
      }
    }, 200);
    
  } catch (error) {
    console.error('Error injecting scripts:', error);
  }
});

// Handle messages from content script
browser.runtime.onMessage.addListener(async (request, sender) => {
  try {
    if (request.action === 'downloadPDF') {
      await downloadPDFToDownloads(request.pdfData, request.filename, sender.tab.id);
      return { success: true };
    } else if (request.action === 'createBookmark') {
      await createBookmark(request.filename, request.note, request.url, sender.tab.id, sender.tab.title);
      return { success: true };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return { success: false, error: error.message };
  }
});

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
    await notifyContentScriptBookmark(tabId, `Bookmark saved: ${bookmarkTitle}`, true);
    
  } catch (error) {
    console.error('Background: Failed to create bookmark:', error);
    await notifyContentScriptBookmark(tabId, `Failed to create bookmark: ${error.message}`, false);
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

async function downloadPDFToDownloads(pdfDataArray, filename, tabId) {
  try {
    console.log('Background: Starting PDF download to Downloads folder');
    
    // Convert array back to Uint8Array
    const uint8Array = new Uint8Array(pdfDataArray);
    
    // Convert to base64 data URL
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    console.log('Background: Saving PDF to THE QUICKNESS folder:', filename);
    
    // Save to THE QUICKNESS subfolder in Downloads folder
    const subfolderPath = `THE QUICKNESS/${filename}`;
    
    const downloadId = await browser.downloads.download({
      url: dataUrl,
      filename: subfolderPath,
      saveAs: false,
      conflictAction: 'uniquify'
    });
    
    console.log('Background: PDF saved successfully to THE QUICKNESS folder:', downloadId);
    await notifyContentScript(tabId, filename, true);
    
  } catch (error) {
    console.error('Background: Error in download process:', error);
    await notifyContentScript(tabId, filename, false);
  }
}

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