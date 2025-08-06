/* global chrome */
// THE QUICKNESS - Background Service Worker (Icon Click to Screenshot)
// Optimized for activeTab permission - scripts injected dynamically

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  console.log('THE QUICKNESS icon clicked, injecting scripts and triggering screenshot');
  
  try {
    // Inject CSS and scripts dynamically (activeTab permission)
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
    
    // Inject scripts in order
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['jspdf.umd.min.js']
    });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['logo-data.js']
    });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Small delay to ensure content script is ready
    setTimeout(() => {
      // Capture the visible tab using Chrome's API for better image quality
      chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 95  // Reduced from 100% for better performance while maintaining quality
      }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to capture tab:', chrome.runtime.lastError);
          return;
        }
        
        // Send the captured screenshot to content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNoteModal',
          screenshot: dataUrl,
          url: tab.url
        }).catch((error) => {
          console.log('Content script not ready:', error);
        });
      });
    }, 200);
    
  } catch (error) {
    console.error('Error injecting scripts:', error);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadPDF') {
    downloadPDFToDownloads(request.pdfData, request.filename, sender.tab.id);
    sendResponse({success: true});
  } else if (request.action === 'createBookmark') {
    createBookmark(request.filename, request.note, request.url, sender.tab.id, sender.tab.title);
    sendResponse({success: true});
  }
  return true;
});

// Bookmark creation function (moved from content script)
async function createBookmark(filename, note, url, tabId, tabTitle) {
  try {
    console.log('Background: Creating bookmark for:', url);
    console.log('Background: Received filename:', filename);
    console.log('Background: Received note:', note);
    console.log('Background: Tab title:', tabTitle);
    
    // Get the bookmarks tree to find the correct bookmarks bar ID
    const bookmarkTree = await new Promise((resolve, reject) => {
      chrome.bookmarks.getTree((results) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting bookmark tree:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(results);
        }
      });
    });
    
    // Find the bookmarks bar - it's one of the top-level folders
    // The root node is at index 0, and its children are the top-level folders
    const rootNode = bookmarkTree[0];
    let bookmarksBarId = null;
    
    // Look for the bookmarks bar among the root's children
    // It's typically titled "Bookmarks bar" or "Bookmarks Bar"
    for (const child of rootNode.children) {
      if (child.title === 'Bookmarks bar' || child.title === 'Bookmarks Bar' || child.title === 'Bookmarks Toolbar') {
        bookmarksBarId = child.id;
        break;
      }
    }
    
    // Fallback: if not found by title, use the first folder without a URL (which should be the bookmarks bar)
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
    const bookmarkBarChildren = await new Promise((resolve, reject) => {
      chrome.bookmarks.getChildren(bookmarksBarId, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting bookmark bar children:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(results);
        }
      });
    });
    
    // Look for existing "THE QUICKNESS" folder
    let quicknessFolder = bookmarkBarChildren.find(item => 
      item.title === 'THE QUICKNESS' && !item.url
    );
    
    // Create "THE QUICKNESS" folder if it doesn't exist
    if (!quicknessFolder) {
      console.log('Background: Creating THE QUICKNESS bookmark folder');
      quicknessFolder = await new Promise((resolve, reject) => {
        chrome.bookmarks.create({
          parentId: bookmarksBarId,
          title: 'THE QUICKNESS'
        }, (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error creating bookmark folder:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
    }
    
    // Create bookmark title from filename (remove .pdf extension only)
    let bookmarkTitle = filename.replace('.pdf', '');
    console.log('Background: After removing .pdf extension:', bookmarkTitle);
    
    // Keep the timestamp prefix to match PDF filename exactly
    // Do NOT remove timestamp - user wants bookmark title to match PDF filename
    
    // If title is empty after cleanup, use the tab title or URL
    if (!bookmarkTitle.trim()) {
      bookmarkTitle = tabTitle || url;
      console.log('Background: Using fallback title:', bookmarkTitle);
    }
    
    console.log('Background: Final bookmark title will be:', bookmarkTitle);
    
    // Check if bookmark with same URL AND title already exists to avoid duplicates
    const existingBookmarks = await new Promise((resolve, reject) => {
      chrome.bookmarks.search({ url: url }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Error searching for existing bookmark:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('Background: Found existing bookmarks for this URL:', existingBookmarks.map(b => b.title));
    
    // Check if a bookmark with the same URL and title already exists
    const duplicateBookmark = existingBookmarks.find(bookmark => 
      bookmark.url === url && bookmark.title === bookmarkTitle
    );
    
    if (duplicateBookmark) {
      console.log('Background: Bookmark with same URL and title already exists:', duplicateBookmark.title);
      notifyContentScriptBookmark(tabId, `Bookmark already exists: ${duplicateBookmark.title}`, true);
      return;
    }
    
    // Create the bookmark in the "THE QUICKNESS" folder
    const newBookmark = await new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: quicknessFolder.id,
        title: bookmarkTitle,
        url: url
      }, (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error creating bookmark:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
    
    console.log('Background: Bookmark created successfully:', newBookmark);
    notifyContentScriptBookmark(tabId, `Bookmark saved: ${bookmarkTitle}`, true);
    
  } catch (error) {
    console.error('Background: Failed to create bookmark:', error);
    notifyContentScriptBookmark(tabId, `Failed to create bookmark: ${error.message}`, false);
  }
}

// Notify content script about bookmark creation result
function notifyContentScriptBookmark(tabId, message, success) {
  try {
    chrome.tabs.sendMessage(tabId, {
      action: success ? 'bookmarkSuccess' : 'bookmarkFailed',
      message: message
    }).catch((error) => {
      console.log('Background: Content script bookmark notification failed (this is normal):', error);
    });
  } catch (error) {
    console.log('Background: Could not send bookmark notification to content script:', error);
  }
}

function downloadPDFToDownloads(pdfDataArray, filename, tabId) {
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
    // Chrome will automatically create the subfolder if it doesn't exist
    const subfolderPath = `THE QUICKNESS/${filename}`;
    
    chrome.downloads.download({
      url: dataUrl,
      filename: subfolderPath, // Save to Downloads/THE QUICKNESS/filename.pdf
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Background: Download failed:', chrome.runtime.lastError);
        notifyContentScript(tabId, filename, false);
      } else {
        console.log('Background: PDF saved successfully to THE QUICKNESS folder:', downloadId);
        notifyContentScript(tabId, filename, true);
        
        // Do not auto-open the PDF - just save it
        console.log('Background: PDF saved to Downloads/THE QUICKNESS/ without auto-opening');
      }
    });
    
  } catch (error) {
    console.error('Background: Error in download process:', error);
    notifyContentScript(tabId, filename, false);
  }
}

function notifyContentScript(tabId, filename, success) {
  try {
    chrome.tabs.sendMessage(tabId, {
      action: success ? 'downloadSuccess' : 'downloadFailed',
      filename: filename
    }).catch((error) => {
      console.log('Background: Content script notification failed (this is normal):', error);
    });
  } catch (error) {
    console.log('Background: Could not send notification to content script:', error);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('THE QUICKNESS extension installed - Downloads folder only');
});
