/* global browser */

// THE QUICKNESS - Firefox Content Script with Proven Iframe CSP Bypass
// Based on research: https://medium.com/@will.bryant.will/browser-extension-special-techniques-part-1-using-iframes-to-bypass-csp-restrictions-2b8cdf1737c5

console.log('THE QUICKNESS - Content script IIFE started');

(function() {
  'use strict';

  // Check if extension is already initialized to prevent multiple instances
  if (window.theQuicknessExtension) {
    console.log('THE QUICKNESS - Extension already exists, exiting');
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      console.log('THE QUICKNESS Firefox - Extension initialized');
      this.librariesLoaded = false;
      this.pdfIframe = null;
      this.init();
    }

    async init() {
      // Wait for PDF iframe to be ready (proven CSP bypass technique)
      await this.waitForLibraries();
      this.setupMessageListener();
    }

    // Create iframe to load jsPDF (proven technique to bypass CSP)
    createPDFIframe() {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'display: none; width: 0; height: 0; border: none;';
        iframe.src = browser.runtime.getURL('pdf-iframe.html');
        
        const messageHandler = (event) => {
          if (event.data.action === 'iframeReady') {
            window.removeEventListener('message', messageHandler);
            resolve(iframe);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        iframe.onerror = () => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Failed to load PDF iframe'));
        };
        
        document.body.appendChild(iframe);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('PDF iframe load timeout'));
        }, 10000);
      });
    }

    async waitForLibraries() {
      console.log('Firefox: Setting up PDF iframe (proven CSP bypass technique)...');
      
      try {
        this.pdfIframe = await this.createPDFIframe();
        console.log('✅ PDF iframe created successfully');
        this.librariesLoaded = true;
      } catch (error) {
        console.error('❌ Failed to create PDF iframe:', error);
        alert('PDF functionality failed to load. Please refresh the page and try again.');
      }
    }

    setupMessageListener() {
      if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('THE QUICKNESS - Received message:', message.action, message);
          this.handleMessage(message, sendResponse);
          return true;
        });
        console.log('THE QUICKNESS - Message listener set up successfully');
      }
    }

    async handleMessage(message, sendResponse) {
      switch (message.action) {
        case 'showNoteModal':
          console.log('THE QUICKNESS - Processing showNoteModal');
          await this.showNoteModal(message.screenshot, message.url);
          break;
        case 'downloadSuccess':
          this.showToast(`PDF saved successfully: ${message.filename}`, 'success');
          break;
        case 'downloadFailed':
          this.showToast(`Failed to save PDF: ${message.filename}`, 'error');
          break;
        case 'bookmarkSuccess':
          this.showToast(message.message, 'success');
          break;
        case 'bookmarkFailed':
          this.showToast(message.message, 'error');
          break;
      }
    }

    async showNoteModal(screenshot, url) {
      // Get all visible links for PDF
      const links = this.extractLinksFromViewport();
      console.log(`Extracted ${links.length} links from viewport for PDF overlay`);
      
      console.log('THE QUICKNESS - showNoteModal called');
      const capturedData = { screenshot, url, links };
      console.log('THE QUICKNESS - capturedData:', capturedData);
      
      this.createModal(capturedData);
    }

    extractLinksFromViewport() {
      const links = [];
      const allLinks = document.querySelectorAll('a[href]');
      
      allLinks.forEach(link => {
        const rect = link.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0 && 
                         rect.bottom <= window.innerHeight && 
                         rect.right <= window.innerWidth;
        
        if (isVisible && link.href && link.textContent.trim()) {
          links.push({
            text: link.textContent.trim().substring(0, 100),
            url: link.href,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      
      return links;
    }

    createModal(capturedData) {
      const modal = document.createElement('div');
      modal.id = 'the-quickness-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 24px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      `;

      content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${typeof window.logoDataUrl !== 'undefined' ? window.logoDataUrl : ''}" 
                 style="width: 40px; height: 40px; object-fit: contain;" 
                 onerror="this.style.display='none'"
                 onload="console.log('Logo image loaded successfully in popup')">
            <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">THE QUICKNESS</h2>
          </div>
          <button id="quickness-close" style="
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <div style="color: white; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Source: ${capturedData.url}</div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <div style="color: white; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Screenshot Preview:</div>
          <div style="background: white; border-radius: 8px; padding: 8px;">
            <img id="quickness-screenshot" src="${capturedData.screenshot}" 
                 style="width: 100%; height: auto; border-radius: 4px; display: block;"
                 onload="console.log('Screenshot loaded successfully in modal')">
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="color: white; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Your Note:</div>
          <textarea id="quickness-note" placeholder="Add your note here..." style="
            width: 100%;
            height: 80px;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            resize: vertical;
            font-family: inherit;
            outline: none;
            background: white;
            color: #333;
            box-sizing: border-box;
          "></textarea>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 12px;">
          <button id="quickness-cancel" style="
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
          ">Cancel</button>
          <button id="quickness-save" style="
            padding: 10px 20px;
            background: #4A90E2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
          ">Save PDF</button>
        </div>
      `;

      modal.appendChild(content);
      
      console.log(`Loading screenshot in modal, data URL length: ${capturedData.screenshot.length}`);
      
      document.body.appendChild(modal);
      console.log('THE QUICKNESS - Modal created and added to DOM');

      // Event listeners
      document.getElementById('quickness-close').onclick = () => {
        document.body.removeChild(modal);
      };

      document.getElementById('quickness-cancel').onclick = () => {
        document.body.removeChild(modal);
      };

      document.getElementById('quickness-save').onclick = () => {
        const note = document.getElementById('quickness-note').value;
        console.log(`Save Bookmark & PDF started with note: ${note}`);
        this.saveBoth(capturedData, note);
      };

      // Focus on textarea
      setTimeout(() => {
        document.getElementById('quickness-note').focus();
      }, 100);
    }

    async savePDF(capturedData, note, customFilename = null) {
      if (!this.librariesLoaded || !this.pdfIframe) {
        console.error('PDF iframe not ready');
        this.showToast('PDF functionality not available', 'error');
        return;
      }

      try {
        console.log('Creating PDF using iframe (proven technique)...');
        
        const requestId = Date.now().toString();
        
        // Set up message listener for PDF response
        const responsePromise = new Promise((resolve, reject) => {
          const messageHandler = (event) => {
            if (event.data.action === 'pdfCreated' && event.data.requestId === requestId) {
              window.removeEventListener('message', messageHandler);
              if (event.data.success) {
                resolve(event.data.pdfData);
              } else {
                reject(new Error(event.data.error || 'PDF creation failed'));
              }
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            reject(new Error('PDF creation timeout'));
          }, 30000);
        });
        
        // Send PDF creation request to iframe
        this.pdfIframe.contentWindow.postMessage({
          action: 'createPDF',
          requestId: requestId,
          data: {
            screenshot: capturedData.screenshot,
            note: note,
            url: capturedData.url
          }
        }, '*');
        
        // Wait for PDF creation
        const pdfArray = await responsePromise;
        
        // Generate filename and send to background
        const filename = customFilename ? `${customFilename}.pdf` : `${this.generateFilename(note)}.pdf`;
        
        await browser.runtime.sendMessage({
          action: 'downloadPDF',
          pdfData: pdfArray,
          filename: filename
        });
        
        console.log('PDF download request sent to background script');
        document.getElementById('the-quickness-modal').remove();
        
      } catch (error) {
        console.error('Error in savePDF:', error);
        this.showToast('Failed to save PDF: ' + error.message, 'error');
      }
    }

    generateFilename(note) {
      const now = new Date();
      
      // Format: MMDDYY HHMM
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const dateTime = `${month}${day}${year} ${hours}${minutes}`;
      
      // Get first 5 words of note
      const words = note.trim().split(/\s+/).slice(0, 5).join(' ');
      const notePrefix = words || 'untitled';
      
      return `${dateTime} ${notePrefix}`;
    }

    async saveBoth(capturedData, note) {
      try {
        const filename = this.generateFilename(note);
        
        // Save bookmark first
        await browser.runtime.sendMessage({
          action: 'createBookmark',
          filename: filename,
          note: note,
          url: capturedData.url
        });
        
        // Then save PDF
        await this.savePDF(capturedData, note, filename);
        
      } catch (error) {
        console.error('Error saving bookmark and PDF:', error);
        this.showToast('Failed to save bookmark and PDF', 'error');
      }
    }

    async saveBookmark(capturedData, note) {
      try {
        const filename = this.generateFilename(note);
        
        await browser.runtime.sendMessage({
          action: 'createBookmark',
          filename: filename,
          note: note,
          url: capturedData.url
        });
        
        console.log('Bookmark creation request sent to background script');
        document.getElementById('the-quickness-modal').remove();
        
      } catch (error) {
        console.error('Error saving bookmark:', error);
        this.showToast('Failed to save bookmark', 'error');
      }
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 2147483648;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        word-wrap: break-word;
      `;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 4000);
    }
  }

  // Initialize extension
  console.log('THE QUICKNESS - About to create TheQuicknessExtension instance');
  window.theQuicknessExtension = new TheQuicknessExtension();
  console.log('THE QUICKNESS - Extension instance created successfully');

})();