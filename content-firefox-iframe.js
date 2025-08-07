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
      // Directly set up the listener. No need to wait for an iframe.
      this.setupMessageListener();
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
      console.log('Content: Starting PDF generation in background script...');
      
      try {
        const filename = customFilename || this.generateFilename(note);
        
        // Send PDF generation request directly to background script
        const response = await browser.runtime.sendMessage({
          action: 'generatePDF',
          screenshot: capturedData.screenshot,
          links: capturedData.links,
          note: note,
          url: capturedData.url,
          filename: filename
        });
        
        if (response.success) {
          console.log('PDF generation successful');
        } else {
          throw new Error(response.error || 'PDF generation failed');
        }
        
      } catch (error) {
        console.error('Content: PDF generation failed:', error);
        this.showToast(`Failed to generate PDF: ${error.message}`, 'error');
        throw error;
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
        
        // Send ONE message with ALL data to the background script
        await browser.runtime.sendMessage({
          action: 'saveBookmarkAndPDF', // New combined action
          filename: filename,
          note: note,
          url: capturedData.url,
          screenshot: capturedData.screenshot,
          links: capturedData.links
        });

      } catch (error) {
        console.error('Error in saveBoth:', error);
        this.showToast(`Failed to save: ${error.message}`, 'error');
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