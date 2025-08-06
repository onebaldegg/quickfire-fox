/* global chrome */
// THE QUICKNESS - Icon Click Screenshot with Notes

(function() {
  'use strict';
  
  if (window.theQuicknessExtension) {
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      this.criticalTimers = []; // Track only critical timers for cleanup
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS - Icon Click Screenshot Mode');
      this.waitForLibraries();
      this.setupMessageListener();
    }
    
    setupMessageListener() {
      // Listen for messages from background script
      try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'takeScreenshot') {
            this.takeScreenshot();
          } else if (request.action === 'showNoteModal') {
            // New approach: receive screenshot data directly from background script
            this.capturedData = {
              screenshot: request.screenshot,
              url: request.url,
              links: this.extractViewportLinks()
            };
            this.hideLoadingIndicator();
            this.showNoteModal();
          } else if (request.action === 'downloadSuccess') {
            this.showSuccessNotification(`PDF saved to Downloads/THE QUICKNESS: ${request.filename}`);
          } else if (request.action === 'downloadFailed') {
            this.showFailureNotification(`PDF save failed: ${request.filename}`);
          } else if (request.action === 'bookmarkSuccess') {
            this.showSuccessNotification(request.message);
          } else if (request.action === 'bookmarkFailed') {
            this.showFailureNotification(request.message);
          }
        });
      } catch (error) {
        console.log('Background script messaging unavailable:', error);
      }
    }

    async waitForLibraries() {
      let attempts = 0;
      console.log('Waiting for jsPDF library to load...');
      
      while (!window.jspdf && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`Library loading attempt ${attempts}/100...`);
          console.log('jsPDF available:', !!window.jspdf);
        }
      }
      
      if (window.jspdf) {
        this.librariesLoaded = true;
        console.log('✅ jsPDF library loaded successfully');
        console.log('jsPDF version:', window.jspdf?.version || 'unknown');
      } else {
        console.error('❌ jsPDF library failed to load after 10 seconds');
        console.log('jsPDF available:', !!window.jspdf);
      }
    }

    async takeScreenshot() {
      // Fallback method - now primarily handled by background script
      console.log('Taking viewport screenshot using fallback method...');
      
      // Show loading indicator
      this.showLoadingIndicator();
      
      // Extract links before screenshot
      const links = this.extractViewportLinks();
      
      // For fallback, use current URL
      this.capturedData = {
        screenshot: null,
        url: window.location.href,
        links: links
      };
      
      // Hide loading and show modal (screenshot will be handled by background)
      this.hideLoadingIndicator();
      this.showNoteModal();
    }

    showLoadingIndicator() {
      // Remove any existing indicator
      this.hideLoadingIndicator();
      
      const indicator = document.createElement('div');
      indicator.className = 'tq-loading-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(184, 133, 216, 0.95);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 2px solid #333;
      `;
      
      // Create spinner element safely without innerHTML
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 3px solid transparent;
        border-top: 3px solid white;
        border-radius: 50%;
        animation: tq-spin 1s linear infinite;
      `;
      
      const text = document.createElement('span');
      text.textContent = 'Capturing screenshot...';
      
      indicator.appendChild(spinner);
      indicator.appendChild(text);
      
      // Add CSS animation
      if (!document.querySelector('#tq-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'tq-spinner-style';
        style.textContent = `
          @keyframes tq-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
      const existing = document.querySelector('.tq-loading-indicator');
      if (existing) {
        existing.remove();
      }
    }

    extractViewportLinks() {
      const links = [];
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      
      // Get all links that are visible in the current viewport
      document.querySelectorAll('a[href]').forEach(link => {
        const rect = link.getBoundingClientRect();
        
        // Check if link is visible in viewport
        if (rect.top >= 0 && rect.top <= viewportHeight && 
            rect.left >= 0 && rect.left <= window.innerWidth &&
            rect.width > 0 && rect.height > 0) {
          
          const linkData = {
            text: link.textContent.trim(),
            href: link.href,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          
          if (linkData.text && linkData.href && linkData.text.length > 0) {
            links.push(linkData);
          }
        }
      });
      
      console.log(`Extracted ${links.length} links from viewport for PDF overlay`);
      return links;
    }

    showNoteModal() {
      const backdrop = document.createElement('div');
      backdrop.className = 'tq-modal-backdrop';
      backdrop.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.5); z-index: 2147483647;
      `;
      
      this.modal = document.createElement('div');
      this.modal.className = 'tq-note-modal';
      this.modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #BF77F6; border-radius: 9px; padding: 20px; 
        box-shadow: 0 23px 69px rgba(0, 0, 0, 0.3);
        z-index: 2147483647; min-width: 403px; max-width: 564px;
        border: 2px solid #333;
      `;
      
      // Create modal content safely without innerHTML to prevent XSS
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: transparent;';
      
      // Create logo container with immediate fallback
      const logoContainer = document.createElement('div');
      logoContainer.style.cssText = 'display: inline-block; background: #333; border-radius: 6px; padding: 8px 12px;';
      
      // Try to create image logo first
      const logoImg = document.createElement('img');
      logoImg.src = window.LOGO_BASE64 || '';
      logoImg.alt = 'THE QUICKNESS';
      logoImg.style.cssText = 'height: 69px; width: auto; border-radius: 6px; display: block;';
      
      // Add error handling and text fallback for popup
      logoImg.onerror = () => {
        console.warn('Logo image failed to load in popup, using text fallback');
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
      
      // Add successful load handler
      logoImg.onload = () => {
        console.log('Logo image loaded successfully in popup');
      };
      
      logoContainer.appendChild(logoImg);
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 9px;';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'tq-cancel-btn';
      cancelBtn.style.cssText = 'padding: 9px 20px; border: none; border-radius: 5px; background: #6c757d; color: white; cursor: pointer; font-weight: 500; font-size: 14px;';
      cancelBtn.textContent = 'Cancel';
      
      const saveBtn = document.createElement('button');
      saveBtn.id = 'tq-save-btn';
      saveBtn.style.cssText = 'padding: 9px 20px; border: none; border-radius: 5px; background: #007cff; color: white; cursor: pointer; font-weight: 500; font-size: 14px;';
      saveBtn.textContent = 'Save PDF';
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(saveBtn);
      
      header.appendChild(logoContainer);
      header.appendChild(buttonContainer);
      
      // Create content container
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = 'background: white; border-radius: 7px; padding: 13px; margin-bottom: 13px;';
      
      // Create source URL section
      const sourceDiv = document.createElement('div');
      sourceDiv.style.cssText = 'font-size: 12px; color: #666; word-break: break-all; margin-bottom: 9px;';
      
      const sourceLabel = document.createElement('strong');
      sourceLabel.textContent = 'Source: ';
      sourceDiv.appendChild(sourceLabel);
      // Source URL with proper encoding for security
      const encodedUrl = encodeURI(this.capturedData.url);
      sourceDiv.appendChild(document.createTextNode(encodedUrl));
      
      // Create screenshot section
      const screenshotSection = document.createElement('div');
      screenshotSection.style.cssText = 'margin-bottom: 13px;';
      
      const screenshotTitle = document.createElement('div');
      screenshotTitle.style.cssText = 'font-weight: 500; margin-bottom: 7px; color: #333; font-size: 14px;';
      screenshotTitle.textContent = 'Screenshot Preview:';
      
      const screenshotContainer = document.createElement('div');
      screenshotContainer.id = 'screenshot-container';
      screenshotContainer.style.cssText = 'min-height: 161px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;';
      
      const screenshotImg = document.createElement('img');
      screenshotImg.id = 'screenshot-img';
      screenshotImg.style.cssText = 'max-width: 100%; max-height: 161px; border-radius: 5px; display: none;';
      
      const screenshotLoading = document.createElement('div');
      screenshotLoading.id = 'screenshot-loading';
      screenshotLoading.style.cssText = 'color: #666; font-size: 14px;';
      screenshotLoading.textContent = 'Loading screenshot...';
      
      screenshotContainer.appendChild(screenshotImg);
      screenshotContainer.appendChild(screenshotLoading);
      
      screenshotSection.appendChild(screenshotTitle);
      screenshotSection.appendChild(screenshotContainer);
      
      // Create notes section
      const notesSection = document.createElement('div');
      
      const notesLabel = document.createElement('label');
      notesLabel.style.cssText = 'display: block; font-weight: 500; margin-bottom: 5px; color: #333; font-size: 14px;';
      notesLabel.textContent = 'Your Note:';
      
      const notesTextarea = document.createElement('textarea');
      notesTextarea.id = 'tq-note-input';
      notesTextarea.style.cssText = 'width: 100%; min-height: 81px; padding: 9px; border: 2px solid #e0e0e0; border-radius: 5px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px;';
      notesTextarea.placeholder = 'Add your note here...';
      notesTextarea.maxLength = 100;
      
      notesSection.appendChild(notesLabel);
      notesSection.appendChild(notesTextarea);
      
      // Assemble content container
      contentContainer.appendChild(sourceDiv);
      contentContainer.appendChild(screenshotSection);
      contentContainer.appendChild(notesSection);
      
      // Assemble modal
      this.modal.appendChild(header);
      this.modal.appendChild(contentContainer);
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      // Load screenshot after modal is added to DOM
      this.loadScreenshotInModal();
      
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('#tq-note-input');
      setTimeout(() => textarea.focus(), 100);
    }

    loadScreenshotInModal() {
      const img = this.modal.querySelector('#screenshot-img');
      const loading = this.modal.querySelector('#screenshot-loading');
      
      if (!this.capturedData.screenshot) {
        loading.textContent = 'No screenshot available';
        return;
      }
      
      console.log('Loading screenshot in modal, data URL length:', this.capturedData.screenshot.length);
      
      img.onload = () => {
        console.log('Screenshot loaded successfully in modal');
        img.style.display = 'block';
        loading.style.display = 'none';
      };
      
      img.onerror = () => {
        console.error('Screenshot failed to load in modal');
        loading.textContent = 'Screenshot failed to load';
        loading.style.color = '#dc3545';
      };
      
      // Set the screenshot source
      img.src = this.capturedData.screenshot;
    }

    bindModalEvents(backdrop) {
      const cancelBtn = this.modal.querySelector('#tq-cancel-btn');
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const textarea = this.modal.querySelector('#tq-note-input');
      
      // Store event handlers for cleanup
      this.modalEventHandlers = {
        cancel: () => this.closeModal(),
        save: () => {
          const note = textarea.value.trim();
          this.savePDF(note);
        },
        backdrop: () => this.closeModal(),
        keydown: (e) => {
          if (e.key === 'Escape' && this.modal) {
            this.closeModal();
          }
        }
      };
      
      cancelBtn.addEventListener('click', this.modalEventHandlers.cancel);
      saveBtn.addEventListener('click', this.modalEventHandlers.save);
      backdrop.addEventListener('click', this.modalEventHandlers.backdrop);
      document.addEventListener('keydown', this.modalEventHandlers.keydown);
    }

    async savePDF(note) {
      console.log('Save PDF started with note:', note);
      
      if (!window.jspdf) {
        console.error('jsPDF library not loaded');
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
      }
      
      try {
        const data = this.capturedData;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        // Create filename with timestamp and first five words of note
        let noteWords = '';
        if (note && note.trim()) {
          const words = note.trim().split(/\s+/);
          console.log('Total words in note:', words.length, 'Words:', words);
          
          noteWords = words
            .slice(0, 5)  // First 5 words
            .join(' ')
            .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special characters
            .replace(/\s+/g, ' ')  // Normalize spaces
            .trim();
            
          console.log('Using 5 words for filename:', noteWords);
        }
        
        // Format: MMDDYY HHMM + first 5 words
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timePrefix = `${month}${day}${year} ${hours}${minutes}`;
        
        // Ensure filename is valid and not empty
        let filename;
        if (noteWords && noteWords.length > 0) {
          filename = `${timePrefix} ${noteWords}.pdf`;
        } else {
          filename = `${timePrefix} screenshot.pdf`;
        }
        
        // Sanitize filename for cross-platform compatibility
        filename = filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
        
        console.log('Creating landscape PDF with filename:', filename);
        
        const { jsPDF } = window.jspdf;
        // Create PDF in landscape mode
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // A4 landscape dimensions: 297mm x 210mm
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 15;
        
        // Logo top-left - Use fallback logo approach
        try {
          if (window.loadLogoAsBase64) {
            // Load the logo with fallback handling
            const logoBase64 = await window.loadLogoAsBase64();
            if (logoBase64) {
              // Extract image format and data from base64 string
              const imageFormat = logoBase64.includes('data:image/png') ? 'PNG' : 
                                logoBase64.includes('data:image/svg') ? 'SVG' : 'PNG';
              pdf.addImage(logoBase64, imageFormat, margin, margin, 98, 39); // 15% larger than previous (was 85x34)
              console.log('Logo added to PDF successfully');
            } else {
              // Text fallback if logo completely fails
              pdf.setFontSize(24);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(245, 158, 11); // Orange color
              pdf.text('THE QUICKNESS', margin, margin + 20);
              pdf.setTextColor(0, 0, 0); // Reset to black
              console.log('Used text fallback for logo');
            }
          } else {
            // Text fallback if logo function not available
            pdf.setFontSize(24);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(245, 158, 11); // Orange color
            pdf.text('THE QUICKNESS', margin, margin + 20);
            pdf.setTextColor(0, 0, 0); // Reset to black
            console.log('Used text fallback for logo (no function)');
          }
        } catch (logoError) {
          console.warn('Logo loading failed, using text fallback:', logoError);
          // Fallback to text
          pdf.setFontSize(24);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(245, 158, 11);
          pdf.text('THE QUICKNESS', margin, margin + 20);
          pdf.setTextColor(0, 0, 0);
        }
        
        // Source URL top-right with proper wrapping
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 255);
        const urlText = data.url;
        const maxUrlWidth = 100; // Reduced from 120 to leave space for larger logo
        const urlLines = pdf.splitTextToSize(urlText, maxUrlWidth);
        const urlStartY = margin + 5;
        const urlStartX = pageWidth - margin - maxUrlWidth;
        
        // Draw URL lines
        for (let i = 0; i < urlLines.length; i++) {
          pdf.textWithLink(urlLines[i], urlStartX, urlStartY + (i * 4), { url: data.url });
        }
        pdf.setTextColor(0, 0, 0);
        
        // Move screenshot and notes further down with 30pt spacing after larger logo
        let yPos = margin + 34 + 11; // Logo height (34) + 30pt spacing converted to mm (≈11mm)
        let screenshotX = 0;
        let screenshotY = 0;
        let screenshotWidth = 0;
        let screenshotHeight = 0;
        
        try {
          console.log('Adding screenshot to PDF...');
          
          if (!data.screenshot) {
            throw new Error('No screenshot data available');
          }
          
          // Create image element and load screenshot data
          const screenshotImg = new Image();
          
          await new Promise((resolve, reject) => {
            screenshotImg.onload = () => {
              try {
                console.log('Screenshot image loaded for PDF, dimensions:', screenshotImg.width, 'x', screenshotImg.height);
                
                // Calculate screenshot dimensions to maximize size while fitting on one page
                const availableWidth = pageWidth - (margin * 2);
                // Leave less space for notes since limit is now 100 characters (15mm should be enough)
                const availableHeight = (pageHeight - yPos - margin - 15);
                
                const aspectRatio = screenshotImg.width / screenshotImg.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / aspectRatio;
                
                // If height is too much, scale down proportionally
                if (imgHeight > availableHeight) {
                  imgHeight = availableHeight;
                  imgWidth = imgHeight * aspectRatio;
                }
                
                // Center the screenshot horizontally on the page
                const imgX = (pageWidth - imgWidth) / 2;
                
                // Store screenshot coordinates for link overlay
                screenshotX = imgX;
                screenshotY = yPos;
                screenshotWidth = imgWidth;
                screenshotHeight = imgHeight;
                
                // Add the image to PDF
                pdf.addImage(data.screenshot, 'PNG', imgX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
                console.log('Screenshot added to PDF successfully');
                resolve();
              } catch (error) {
                console.error('Error adding screenshot to PDF:', error);
                pdf.setFontSize(12);
                pdf.text('Screenshot could not be processed', margin, yPos);
                yPos += 15;
                resolve(); // Continue even if screenshot fails
              }
            };
            
            screenshotImg.onerror = (error) => {
              console.error('Error loading screenshot image for PDF:', error);
              pdf.setFontSize(12);
              pdf.text('Screenshot could not be loaded', margin, yPos);
              yPos += 15;
              resolve(); // Continue even if screenshot fails
            };
            
            // Set the screenshot source
            screenshotImg.src = data.screenshot;
          });
          
        } catch (error) {
          console.error('Screenshot processing failed:', error);
          pdf.setFontSize(12);
          pdf.text('Screenshot processing failed', margin, yPos);
          yPos += 15;
        }
        
        // Add clickable link overlays on screenshot
        if (data.links && data.links.length > 0 && screenshotWidth > 0) {
          console.log(`Adding ${data.links.length} clickable link overlays to PDF`);
          
          // Calculate scale factors between screenshot and viewport
          const scaleX = screenshotWidth / window.innerWidth;
          const scaleY = screenshotHeight / window.innerHeight;
          
          data.links.forEach(link => {
            try {
              // Convert viewport coordinates to PDF coordinates
              const linkX = screenshotX + (link.x * scaleX);
              const linkY = screenshotY + (link.y * scaleY);
              const linkWidth = link.width * scaleX;
              const linkHeight = link.height * scaleY;
              
              // Add invisible clickable area overlay
              pdf.link(linkX, linkY, linkWidth, linkHeight, { url: link.href });
              
              console.log(`Added clickable overlay for: ${link.text} at (${linkX.toFixed(1)}, ${linkY.toFixed(1)})`);
            } catch (error) {
              console.error('Error adding link overlay:', error);
            }
          });
        }
        
        // User notes below screenshot
        if (note) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Notes:', margin, yPos);
          yPos += 8;
          
          pdf.setFont(undefined, 'normal');
          const noteLines = pdf.splitTextToSize(note, pageWidth - (margin * 2));
          pdf.text(noteLines, margin, yPos);
          yPos += noteLines.length * 4;
        }
        
        console.log('PDF generation complete, starting download');
        
        // Use background script for download
        try {
          const pdfData = pdf.output('arraybuffer');
          
          console.log('Sending PDF to background script for download');
          
          chrome.runtime.sendMessage({
            action: 'downloadPDF',
            pdfData: Array.from(new Uint8Array(pdfData)),
            filename: filename
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send to background script:', chrome.runtime.lastError);
              this.fallbackDownload(pdf.output('blob'), filename);
            } else {
              console.log('PDF sent to background script successfully');
            }
          });
          
        } catch (downloadError) {
          console.error('Background script communication failed:', downloadError);
          this.fallbackDownload(pdf.output('blob'), filename);
        }
        
        // Close modal
        this.closeModal();
        
        // Create Chrome bookmark after successful PDF save
        this.createBookmark(filename, note, data.url);
        
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed: ' + error.message);
      }
    }

    async createBookmark(filename, note, url) {
      try {
        console.log('Sending bookmark creation request to background script');
        console.log('Filename being sent:', filename);
        console.log('Note being sent:', note);
        console.log('URL being sent:', url);
        
        // Send message to background script to create bookmark
        const response = await chrome.runtime.sendMessage({
          action: 'createBookmark',
          filename: filename,
          note: note,
          url: url
        });
        
        console.log('Bookmark creation request sent successfully');
        
      } catch (error) {
        console.error('Failed to send bookmark creation request:', error);
        this.showFailureNotification(`Failed to create bookmark: ${error.message}`);
      }
    }

    fallbackDownload(pdfBlob, filename) {
      console.log('Using fallback download method');
      try {
        const url = URL.createObjectURL(pdfBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Ensure no auto-opening by not setting target
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('Fallback download triggered to Downloads folder (no auto-open)');
        this.showSuccessNotification(`PDF saved: ${filename}`);
        
      } catch (error) {
        console.error('Fallback download also failed:', error);
        alert('PDF download failed. Please try again.');
      }
    }

    showSuccessNotification(message) {
      try {
        const existing = document.querySelector('.tq-success-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'tq-success-notification';
        notification.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #10b981 !important;
          color: white !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          z-index: 2147483647 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.3s ease !important;
          pointer-events: none !important;
        `;
        
        notification.textContent = `✓ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        const removeTimer = setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }
        }, 3000);
        
        // Only track the main removal timer for cleanup
        this.criticalTimers.push(removeTimer);
        
      } catch (error) {
        console.error('Notification failed:', error);
        console.log('✓', message);
      }
    }

    showFailureNotification(message) {
      try {
        const existing = document.querySelector('.tq-failure-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'tq-failure-notification';
        notification.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          z-index: 2147483647 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.3s ease !important;
          pointer-events: none !important;
        `;
        
        notification.textContent = `❌ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
          }
        }, 10);
        
        const removeTimer = setTimeout(() => {
          if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }
        }, 5000);
        
        // Only track the main removal timer for cleanup
        this.criticalTimers.push(removeTimer);
        
      } catch (error) {
        console.error('Error notification failed:', error);
        console.log('❌', message);
      }
    }

    closeModal() {
      if (this.modal) {
        // Clean up event listeners to prevent memory leaks
        if (this.modalEventHandlers) {
          document.removeEventListener('keydown', this.modalEventHandlers.keydown);
        }
        
        const backdrop = document.querySelector('.tq-modal-backdrop');
        if (backdrop) backdrop.remove();
        this.modal.remove();
        this.modal = null;
        this.modalEventHandlers = null;
      }
    }

    // Cleanup method to clear critical timers and prevent memory leaks
    cleanup() {
      // Clear only critical tracked timers
      this.criticalTimers.forEach(timer => clearTimeout(timer));
      this.criticalTimers = [];
      
      // Close modal if open
      this.closeModal();
      
      // Clear any remaining notifications
      const notifications = document.querySelectorAll('.tq-success-notification, .tq-failure-notification');
      notifications.forEach(notification => notification.remove());
    }
  }

  window.theQuicknessExtension = new TheQuicknessExtension();

})();