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
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'tq-modal-backdrop';
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); z-index: 2147483646;';
      
      // Create modal container with purple background
      const modal = document.createElement('div');
      modal.id = 'the-quickness-modal';
      modal.className = 'tq-note-modal';
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #BF77F6;
        border-radius: 9px;
        padding: 20px;
        box-shadow: 0 23px 69px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        min-width: 403px;
        max-width: 564px;
        border: 2px solid #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // Create header with logo left, buttons right
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;';
      
      // Logo container (left side)
      const logoContainer = document.createElement('div');
      logoContainer.style.cssText = 'display: inline-block; background: #333; border-radius: 6px; padding: 8px 12px;';
      
      const logoImg = document.createElement('img');
      logoImg.src = window.GITHUB_ASSETS?.LOGO_URL || window.LOGO_BASE64 || '';
      logoImg.alt = 'THE QUICKNESS';
      logoImg.style.cssText = 'height: 69px; width: auto; border-radius: 6px; display: block;';
      
      logoImg.onerror = () => {
        logoContainer.innerHTML = '';
        logoContainer.style.cssText = 'display: inline-block; background: linear-gradient(45deg, #FF6B35, #F59E0B); border-radius: 6px; padding: 8px 12px; color: white; font-weight: bold; font-size: 14px; text-align: center; min-width: 120px;';
        
        const logoText = document.createElement('div');
        logoText.textContent = 'THE QUICKNESS';
        logoText.style.cssText = 'margin: 0; line-height: 1.2;';
        
        const subText = document.createElement('div');
        subText.textContent = 'Screenshot & PDF Tool';
        subText.style.cssText = 'font-size: 10px; opacity: 0.9; margin-top: 2px;';
        
        logoContainer.appendChild(logoText);
        logoContainer.appendChild(subText);
      };
      
      logoContainer.appendChild(logoImg);
      
      // Button container (right side)
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 9px;';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'quickness-cancel';
      cancelBtn.className = 'tq-button tq-button-secondary';
      cancelBtn.style.cssText = 'padding: 9px 20px; border: none; border-radius: 5px; background: #6c757d; color: white; cursor: pointer; font-weight: 500; font-size: 14px;';
      cancelBtn.textContent = 'Cancel';
      
      const saveBtn = document.createElement('button');
      saveBtn.id = 'quickness-save';
      saveBtn.className = 'tq-button tq-button-primary';
      saveBtn.style.cssText = 'padding: 9px 20px; border: none; border-radius: 5px; background: #007cff; color: white; cursor: pointer; font-weight: 500; font-size: 14px;';
      saveBtn.textContent = 'Save PDF';
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(saveBtn);
      
      header.appendChild(logoContainer);
      header.appendChild(buttonContainer);
      
      // White content container
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = 'background: white; border-radius: 7px; padding: 13px; margin-bottom: 13px;';
      
      // Source URL section
      const sourceDiv = document.createElement('div');
      sourceDiv.style.cssText = 'font-size: 12px; color: #666; word-break: break-all; margin-bottom: 9px;';
      
      const sourceLabel = document.createElement('strong');
      sourceLabel.textContent = 'Source: ';
      sourceDiv.appendChild(sourceLabel);
      sourceDiv.appendChild(document.createTextNode(capturedData.url));
      
      // Screenshot Preview section
      const screenshotSection = document.createElement('div');
      screenshotSection.className = 'tq-preview-section';
      screenshotSection.style.cssText = 'margin-bottom: 13px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;';
      
      const screenshotTitle = document.createElement('div');
      screenshotTitle.className = 'tq-preview-title';
      screenshotTitle.style.cssText = 'font-size: 14px; font-weight: 500; color: #495057; margin-bottom: 8px;';
      screenshotTitle.textContent = 'Screenshot Preview:';
      
      const screenshotContent = document.createElement('div');
      screenshotContent.className = 'tq-preview-content';
      screenshotContent.style.cssText = 'max-height: 200px; overflow: auto; border: 1px solid #dee2e6; border-radius: 4px; background: white; padding: 8px;';
      
      const screenshotImg = document.createElement('img');
      screenshotImg.className = 'tq-preview-image';
      screenshotImg.src = capturedData.screenshot;
      screenshotImg.style.cssText = 'max-width: 100%; max-height: 150px; object-fit: contain; border-radius: 4px;';
      
      screenshotContent.appendChild(screenshotImg);
      screenshotSection.appendChild(screenshotTitle);
      screenshotSection.appendChild(screenshotContent);
      
      // Notes section
      const notesSection = document.createElement('div');
      notesSection.className = 'tq-form-group';
      
      const notesLabel = document.createElement('label');
      notesLabel.className = 'tq-label';
      notesLabel.style.cssText = 'display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 6px;';
      notesLabel.textContent = 'Your Note:';
      
      const notesTextarea = document.createElement('textarea');
      notesTextarea.id = 'quickness-note';
      notesTextarea.className = 'tq-textarea';
      notesTextarea.style.cssText = 'width: 100%; min-height: 100px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; line-height: 1.4; resize: vertical; font-family: inherit; transition: border-color 0.2s ease; box-sizing: border-box;';
      notesTextarea.placeholder = 'Add your note here...';
      
      notesSection.appendChild(notesLabel);
      notesSection.appendChild(notesTextarea);
      
      // Assemble content container
      contentContainer.appendChild(sourceDiv);
      contentContainer.appendChild(screenshotSection);
      contentContainer.appendChild(notesSection);
      
      // Assemble modal
      modal.appendChild(header);
      modal.appendChild(contentContainer);
      
      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      
      console.log(`Loading screenshot in modal, data URL length: ${capturedData.screenshot.length}`);
      console.log('THE QUICKNESS - Modal created and added to DOM');

      // Event listeners
      backdrop.onclick = () => {
        backdrop.remove();
        modal.remove();
      };

      cancelBtn.onclick = () => {
        backdrop.remove();
        modal.remove();
      };

      saveBtn.onclick = () => {
        const note = notesTextarea.value;
        console.log(`Save Bookmark & PDF started with note: ${note}`);
        backdrop.remove();
        modal.remove();
        this.saveBoth(capturedData, note);
      };

      // Focus on textarea
      setTimeout(() => {
        notesTextarea.focus();
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