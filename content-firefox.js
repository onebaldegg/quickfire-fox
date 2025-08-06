/* global browser */
// THE QUICKNESS - Firefox Content Script
// Converted from Chrome extension to Firefox using browser.* namespace

(function() {
  'use strict';
  
  console.log('THE QUICKNESS - Content script IIFE started');
  
  if (window.theQuicknessExtension) {
    console.log('THE QUICKNESS - Extension already exists, exiting');
    return;
  }

  class TheQuicknessExtension {
    constructor() {
      this.capturedData = null;
      this.modal = null;
      this.librariesLoaded = false;
      this.criticalTimers = [];
      
      this.init();
    }

    init() {
      console.log('THE QUICKNESS Firefox - Extension initialized');
      this.waitForLibraries();
      this.setupMessageListener();
    }
    
    setupMessageListener() {
      // Listen for messages from background script
      try {
        browser.runtime.onMessage.addListener((request, sender) => {
          console.log('THE QUICKNESS - Received message:', request.action, request);
          
          if (request.action === 'takeScreenshot') {
            console.log('THE QUICKNESS - Processing takeScreenshot');
            this.takeScreenshot();
          } else if (request.action === 'showNoteModal') {
            console.log('THE QUICKNESS - Processing showNoteModal');
            // Receive screenshot data directly from background script
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
        console.log('THE QUICKNESS - Message listener set up successfully');
      } catch (error) {
        console.error('THE QUICKNESS - Background script messaging unavailable:', error);
      }
    }

    async waitForLibraries() {
      let attempts = 0;
      console.log('Waiting for jsPDF library to load...');
      
      // Firefox-specific approach: try to load jsPDF directly
      if (!window.jsPDF) {
        try {
          console.log('Attempting to load jsPDF directly in Firefox...');
          // Try to inject jsPDF directly if it's not available
          const script = document.createElement('script');
          script.src = browser.runtime.getURL('jspdf.umd.min.js');
          script.onload = () => {
            console.log('✅ jsPDF loaded via direct script injection');
          };
          script.onerror = (error) => {
            console.error('❌ Failed to load jsPDF via script injection:', error);
          };
          document.head.appendChild(script);
          
          // Wait for the script to load with shorter intervals
          while (!window.jsPDF && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
            
            if (attempts % 5 === 0) {
              console.log(`Firefox jsPDF loading attempt ${attempts}/50...`);
              console.log('jsPDF available:', !!window.jsPDF);
            }
          }
        } catch (error) {
          console.error('Error during Firefox jsPDF loading:', error);
        }
      }
      
      // Fallback: traditional waiting approach
      attempts = 0; // Reset attempts counter
      while (!window.jsPDF && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`Library loading attempt ${attempts}/100...`);
          console.log('jsPDF available:', !!window.jsPDF);
        }
      }
      
      if (window.jsPDF) {
        this.librariesLoaded = true;
        console.log('✅ jsPDF library loaded successfully');
        console.log('jsPDF version:', window.jsPDF?.version || 'unknown');
      } else {
        console.error('❌ jsPDF library failed to load after 10 seconds');
        console.log('jsPDF available:', !!window.jsPDF);
        
        // Firefox fallback: Try to use a simplified approach
        console.log('🔄 Attempting Firefox fallback method...');
        this.useFallbackPDFMethod = true;
        this.librariesLoaded = true; // Continue with fallback
      }
    }

    async takeScreenshot() {
      console.log('Taking viewport screenshot using fallback method...');
      
      this.showLoadingIndicator();
      
      const links = this.extractViewportLinks();
      
      this.capturedData = {
        screenshot: null,
        url: window.location.href,
        links: links
      };
      
      this.hideLoadingIndicator();
      this.showNoteModal();
    }

    showLoadingIndicator() {
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
      
      document.querySelectorAll('a[href]').forEach(link => {
        const rect = link.getBoundingClientRect();
        
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
      console.log('THE QUICKNESS - showNoteModal called');
      console.log('THE QUICKNESS - capturedData:', this.capturedData);
      
      try {
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
      
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: transparent;';
      
      const logoContainer = document.createElement('div');
      logoContainer.style.cssText = 'display: inline-block; background: #333; border-radius: 6px; padding: 8px 12px;';
      
      const logoImg = document.createElement('img');
      logoImg.src = window.LOGO_BASE64 || '';
      logoImg.alt = 'THE QUICKNESS';
      logoImg.style.cssText = 'height: 69px; width: auto; border-radius: 6px; display: block;';
      
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
      
      logoImg.onload = () => {
        console.log('Logo image loaded successfully in popup');
      };
      
      logoContainer.appendChild(logoImg);
      
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
      
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = 'background: white; border-radius: 7px; padding: 13px; margin-bottom: 13px;';
      
      const sourceDiv = document.createElement('div');
      sourceDiv.style.cssText = 'font-size: 12px; color: #666; word-break: break-all; margin-bottom: 9px;';
      
      const sourceLabel = document.createElement('strong');
      sourceLabel.textContent = 'Source: ';
      sourceDiv.appendChild(sourceLabel);
      const encodedUrl = encodeURI(this.capturedData.url);
      sourceDiv.appendChild(document.createTextNode(encodedUrl));
      
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
      
      const notesSection = document.createElement('div');
      
      const notesLabel = document.createElement('label');
      notesLabel.style.cssText = 'display: block; font-weight: 500; margin-bottom: 5px; color: #333; font-size: 14px;';
      notesLabel.textContent = 'Your Note:';
      
      const notesTextarea = document.createElement('textarea');
      notesTextarea.id = 'tq-note-input';
      notesTextarea.style.cssText = 'width: 100%; min-height: 81px; padding: 9px; border: 2px solid #e0e0e0; border-radius: 5px; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px;';
      notesTextarea.placeholder = 'Add your note here...';
      notesTextarea.maxLength = 100;
      
      notesSection.appendChild(notesLabel);
      notesSection.appendChild(notesTextarea);
      
      contentContainer.appendChild(sourceDiv);
      contentContainer.appendChild(screenshotSection);
      contentContainer.appendChild(notesSection);
      
      this.modal.appendChild(header);
      this.modal.appendChild(contentContainer);
      
      document.body.appendChild(backdrop);
      document.body.appendChild(this.modal);
      
      this.loadScreenshotInModal();
      this.bindModalEvents(backdrop);
      
      const textarea = this.modal.querySelector('#tq-note-input');
      setTimeout(() => textarea.focus(), 100);
      
      console.log('THE QUICKNESS - Modal created and added to DOM');
      } catch (error) {
        console.error('THE QUICKNESS - Error creating modal:', error);
        alert('Error showing screenshot modal: ' + error.message);
      }
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
      
      img.src = this.capturedData.screenshot;
    }

    bindModalEvents(backdrop) {
      const cancelBtn = this.modal.querySelector('#tq-cancel-btn');
      const saveBtn = this.modal.querySelector('#tq-save-btn');
      const textarea = this.modal.querySelector('#tq-note-input');
      
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
      
      if (!window.jsPDF && !this.useFallbackPDFMethod) {
        console.error('jsPDF library not loaded');
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
      }
      
      // Use fallback method if jsPDF is not available
      if (this.useFallbackPDFMethod || !window.jsPDF) {
        console.log('Using fallback PDF method');
        await this.savePDFWithFallback(note);
        return;
      }
      
      try {
        const data = this.capturedData;
        
        let noteWords = '';
        if (note && note.trim()) {
          const words = note.trim().split(/\s+/);
          console.log('Total words in note:', words.length, 'Words:', words);
          
          noteWords = words
            .slice(0, 5)
            .join(' ')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
            
          console.log('Using 5 words for filename:', noteWords);
        }
        
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timePrefix = `${month}${day}${year} ${hours}${minutes}`;
        
        let filename;
        if (noteWords && noteWords.length > 0) {
          filename = `${timePrefix} ${noteWords}.pdf`;
        } else {
          filename = `${timePrefix} screenshot.pdf`;
        }
        
        filename = filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
        
        console.log('Final filename will be:', filename);
        
        const jsPDF = window.jsPDF.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        const pageHeaderHeight = 25;
        const logoHeight = 10;
        const noteHeight = note ? 25 : 0;
        
        let yPosition = margin;
        
        // Add logo if available
        if (window.LOGO_BASE64) {
          try {
            pdf.addImage(window.LOGO_BASE64, 'PNG', margin, yPosition, 40, logoHeight);
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text('THE QUICKNESS', margin + 45, yPosition + 7);
            yPosition += logoHeight + 5;
          } catch (logoError) {
            console.warn('Could not add logo to PDF:', logoError);
          }
        }
        
        // Add URL
        pdf.setFontSize(10);
        pdf.setTextColor(0, 100, 200);
        const urlLines = pdf.splitTextToSize(data.url, contentWidth);
        pdf.text(urlLines, margin, yPosition);
        yPosition += (urlLines.length * 4) + 5;
        
        // Add note if provided
        if (note && note.trim()) {
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Note:', margin, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(10);
          const noteLines = pdf.splitTextToSize(note, contentWidth);
          pdf.text(noteLines, margin, yPosition);
          yPosition += (noteLines.length * 5) + 10;
        }
        
        // Add screenshot if available
        if (data.screenshot) {
          const availableHeight = pageHeight - yPosition - margin;
          const maxImageHeight = Math.min(availableHeight - 20, 150);
          
          try {
            const imgProps = pdf.getImageProperties(data.screenshot);
            const aspectRatio = imgProps.width / imgProps.height;
            
            let imageWidth = contentWidth;
            let imageHeight = imageWidth / aspectRatio;
            
            if (imageHeight > maxImageHeight) {
              imageHeight = maxImageHeight;
              imageWidth = imageHeight * aspectRatio;
            }
            
            const xCentered = margin + (contentWidth - imageWidth) / 2;
            
            pdf.addImage(data.screenshot, 'PNG', xCentered, yPosition, imageWidth, imageHeight);
            yPosition += imageHeight + 10;
          } catch (imageError) {
            console.warn('Could not add screenshot to PDF:', imageError);
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Screenshot could not be embedded', margin, yPosition);
            yPosition += 10;
          }
        }
        
        // Add links if any fit
        if (data.links && data.links.length > 0) {
          const remainingSpace = pageHeight - yPosition - margin;
          
          if (remainingSpace > 30) {
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Links found on page:', margin, yPosition);
            yPosition += 7;
            
            pdf.setFontSize(8);
            pdf.setTextColor(0, 100, 200);
            
            for (const link of data.links.slice(0, 10)) {
              if (yPosition + 5 > pageHeight - margin) break;
              
              const linkText = `• ${link.text} (${link.href})`;
              const linkLines = pdf.splitTextToSize(linkText, contentWidth);
              
              if (yPosition + (linkLines.length * 3) > pageHeight - margin) break;
              
              pdf.text(linkLines, margin + 5, yPosition);
              yPosition += (linkLines.length * 3) + 2;
            }
          }
        }
        
        // Generate PDF data
        const pdfData = pdf.output('arraybuffer');
        const pdfArray = Array.from(new Uint8Array(pdfData));
        
        console.log('PDF generated, size:', pdfArray.length, 'bytes');
        
        // Send to background script for download
        const response = await browser.runtime.sendMessage({
          action: 'downloadPDF',
          pdfData: pdfArray,
          filename: filename
        });
        
        if (response && response.success) {
          console.log('PDF download initiated successfully');
          
          // Create bookmark if note is provided
          if (note && note.trim()) {
            try {
              await browser.runtime.sendMessage({
                action: 'createBookmark',
                filename: filename,
                note: note,
                url: data.url
              });
            } catch (bookmarkError) {
              console.warn('Bookmark creation failed:', bookmarkError);
            }
          }
          
          this.closeModal();
        } else {
          throw new Error('Background script reported download failure');
        }
        
      } catch (error) {
        console.error('PDF generation/save error:', error);
        alert(`Failed to save PDF: ${error.message}`);
      }
    }

    async savePDFWithFallback(note) {
      console.log('Starting fallback PDF method (no jsPDF)');
      
      try {
        const data = this.capturedData;
        
        // Create filename using the same logic
        let noteWords = '';
        if (note && note.trim()) {
          const words = note.trim().split(/\s+/);
          noteWords = words
            .slice(0, 5)
            .join(' ')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timePrefix = `${month}${day}${year} ${hours}${minutes}`;
        
        let filename;
        if (noteWords && noteWords.length > 0) {
          filename = `${timePrefix} ${noteWords}.txt`;
        } else {
          filename = `${timePrefix} screenshot.txt`;
        }
        
        filename = filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
        
        // Create text content instead of PDF
        let textContent = 'THE QUICKNESS - Website Capture\n';
        textContent += '=====================================\n\n';
        textContent += `Date: ${new Date().toLocaleString()}\n`;
        textContent += `Source: ${data.url}\n\n`;
        
        if (note && note.trim()) {
          textContent += `Note:\n${note}\n\n`;
        }
        
        if (data.links && data.links.length > 0) {
          textContent += 'Links found on page:\n';
          textContent += '--------------------\n';
          data.links.slice(0, 20).forEach(link => {
            textContent += `• ${link.text}: ${link.href}\n`;
          });
        }
        
        // Create blob and download
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Fallback text file download initiated');
        this.showSuccessNotification(`Text file saved: ${filename}`);
        
        // Create bookmark if note is provided
        if (note && note.trim()) {
          try {
            await browser.runtime.sendMessage({
              action: 'createBookmark',
              filename: filename,
              note: note,
              url: data.url
            });
          } catch (bookmarkError) {
            console.warn('Bookmark creation failed:', bookmarkError);
          }
        }
        
        this.closeModal();
        
      } catch (error) {
        console.error('Fallback save error:', error);
        alert(`Failed to save file: ${error.message}`);
      }
    }

    closeModal() {
      if (this.modal) {
        // Clean up event listeners
        if (this.modalEventHandlers) {
          document.removeEventListener('keydown', this.modalEventHandlers.keydown);
        }
        
        // Remove modal elements
        const backdrop = document.querySelector('.tq-modal-backdrop');
        if (backdrop) backdrop.remove();
        
        this.modal.remove();
        this.modal = null;
        this.modalEventHandlers = null;
      }
    }

    showSuccessNotification(message) {
      this.showNotification(message, 'success');
    }
    
    showFailureNotification(message) {
      this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'success') {
      const existingToast = document.querySelector('.tq-toast');
      if (existingToast) {
        existingToast.remove();
      }
      
      const toast = document.createElement('div');
      toast.className = `tq-toast ${type === 'error' ? 'error' : ''}`;
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: ${type === 'error' ? '#dc3545' : '#28a745'}; color: white;
        padding: 12px 20px; border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2147483647; font-size: 14px; font-weight: 500;
        opacity: 0; transform: translateX(100%);
        transition: all 0.3s ease; max-width: 300px;
      `;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }, 100);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (toast.parentNode) {
              toast.remove();
            }
          }, 300);
        }
      }, 3000);
    }

    cleanup() {
      this.closeModal();
      
      // Clear any critical timers
      this.criticalTimers.forEach(timer => clearTimeout(timer));
      this.criticalTimers = [];
      
      // Remove loading indicators
      this.hideLoadingIndicator();
      
      console.log('THE QUICKNESS cleanup completed');
    }
  }

  // Initialize extension
  console.log('THE QUICKNESS - About to create TheQuicknessExtension instance');
  try {
    window.theQuicknessExtension = new TheQuicknessExtension();
    console.log('THE QUICKNESS - Extension instance created successfully');
  } catch (error) {
    console.error('THE QUICKNESS - Error creating extension instance:', error);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.theQuicknessExtension) {
      window.theQuicknessExtension.cleanup();
    }
  });

})();
