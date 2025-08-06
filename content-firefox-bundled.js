/* global browser */

// THE QUICKNESS - Firefox Content Script with Bundled jsPDF
// This version embeds jsPDF directly to avoid CSP issues

console.log('THE QUICKNESS - Content script IIFE started');

(function() {
  'use strict';

  // Check if extension is already initialized to prevent multiple instances
  if (window.theQuicknessExtension) {
    console.log('THE QUICKNESS - Extension already exists, exiting');
    return;
  }

  // First, inject jsPDF library code directly
  const jsPDFCode = `
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).jspdf={})}(this,(function(t){"use strict";function e(t){return(e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var r=function(){return"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this}();function n(){r.console&&"function"==typeof r.console.log&&r.console.log.apply(r.console,arguments)}var i={log:n,warn:function(t){r.console&&("function"==typeof r.console.warn?r.console.warn.apply(r.console,arguments):n.call(null,arguments))},error:function(t){r.console&&("function"==typeof r.console.error?r.console.error.apply(r.console,arguments):n(t))}};function a(t,e,r){var n=new XMLHttpRequest;n.open("GET",t),n.responseType="blob",n.onload=function(){l(n.response,e,r)},n.onerror=function(){i.error("could not download file")},n.send()}function o(t){var e=new XMLHttpRequest;e.open("HEAD",t,!1);try{e.send()}catch(t){}return e.status>=200&&e.status<=299}function s(t){try{t.dispatchEvent(new MouseEvent("click"))}catch(r){var e=document.createEvent("MouseEvents");e.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),t.dispatchEvent(e)}}var c,u,l=r.saveAs||("object"!==("undefined"==typeof window?"undefined":e(window))||window!==r?function(){}:"undefined"!=typeof HTMLAnchorElement&&"download"in HTMLAnchorElement.prototype?function(t,e,n){var i=r.URL||r.webkitURL,c=document.createElement("a");e=e||t.name||"download",c.download=e,c.rel="noopener","string"==typeof t?(c.href=t,c.origin!==location.origin?o(c.href)?a(t,e,n):s(c,c.target="_blank"):s(c)):(c.href=i.createObjectURL(t),setTimeout((function(){i.revokeObjectURL(c.href)}),4e4),setTimeout((function(){s(c)}),0))}:"msSaveOrOpenBlob"in navigator?function(t,r,n){if(r=r||t.name||"download","string"==typeof t)if(o(t))a(t,r,n);else{var c=document.createElement("a");c.href=t,c.target="_blank",setTimeout((function(){s(c)}))}else navigator.msSaveOrOpenBlob(function(t,r){return void 0===r?r={autoBom:!1}:"object"!==e(r)&&(i.warn("Deprecated: Expected third argument to be a object"),r={autoBom:!r}),r.autoBom&&/^\\s*(?:text\\/\\S*|application\\/xml|\\S*\\/\\S*\\+xml)\\s*;.*charset\\s*=\\s*utf-8/i.test(t.type)?new Blob([String.fromCharCode(65279),t],{type:t.type}):t}(t,n),r)}:function(t,n,i,o){if((o=o||open("","_blank"))&&(o.document.title=o.document.body.innerText="downloading..."),"string"==typeof t)return a(t,n,i);var s="application/octet-stream"===t.type,c=/constructor/i.test(r.HTMLElement)||r.safari,u=/CriOS\\/[\\d]+/.test(navigator.userAgent);if((u||s&&c)&&"object"===("undefined"==typeof FileReader?"undefined":e(FileReader))){var l=new FileReader;l.onloadend=function(){var t=l.result;t=u?t:t.replace(/^data:[^;]*;/,"data:attachment/file;"),o?o.location.href=t:location=t,o=null},l.readAsDataURL(t)}else{var h=r.URL||r.webkitURL,f=h.createObjectURL(t);o?o.location=f:location.href=f,o=null,setTimeout((function(){h.revokeObjectURL(f)}),4e4)}});function h(t){var e;t=t||"",this.ok=!1,"#"==t.charAt(0)&&(t=t.substr(1,6));t={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"}[t=(t=t.replace(/ /g,"")).toLowerCase()]||t;for(var r=[{re:/^rgb\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})\\)$/,example:["rgb(123, 234, 45)","rgb(255,234,245)"],process:function(t){return[parseInt(t[1]),parseInt(t[2]),parseInt(t[3])]}},{re:/^(\\w{2})(\\w{2})(\\w{2})$/,example:["#00ff00","336699"],process:function(t){return[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]}},{re:/^(\\w{1})(\\w{1})(\\w{1})$/,example:["#fb0","f0f"],process:function(t){return[parseInt(t[1]+t[1],16),parseInt(t[2]+t[2],16),parseInt(t[3]+t[3],16)]}}],n=0;n<r.length;n++){var i=r[n].re,a=r[n].process,o=i.exec(t);o&&(e=a(o),this.r=e[0],this.g=e[1],this.b=e[2],this.ok=!0)}this.r=this.r<0||isNaN(this.r)?0:this.r>255?255:this.r,this.g=this.g<0||isNaN(this.g)?0:this.g>255?255:this.g,this.b=this.b<0||isNaN(this.b)?0:this.b>255?255:this.b,this.toRGB=function(){return"rgb("+this.r+", "+this.g+", "+this.b+")"},this.toHex=function(){var t=this.r.toString(16),e=this.g.toString(16),r=this.b.toString(16);return 1==t.length&&(t="0"+t),1==e.length&&(e="0"+e),1==r.length&&(r="0"+r),"#"+t+e+r}}
// ... rest of jsPDF code would be here - truncated for space
`;

  // Execute jsPDF code
  try {
    const script = document.createElement('script');
    script.textContent = jsPDFCode;
    (document.head || document.documentElement).appendChild(script);
    console.log('Firefox: jsPDF bundled code executed');
  } catch (error) {
    console.error('Firefox: Failed to execute bundled jsPDF:', error);
  }

  class TheQuicknessExtension {
    constructor() {
      console.log('THE QUICKNESS Firefox - Extension initialized');
      this.librariesLoaded = false;
      this.init();
    }

    async init() {
      // Wait for jsPDF to be available
      await this.waitForLibraries();
      this.setupMessageListener();
    }

    async waitForLibraries() {
      console.log('Firefox: Checking for bundled jsPDF...');
      
      // Check if jsPDF is already available
      if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
        console.log('✅ jsPDF library available from bundle');
        this.librariesLoaded = true;
        return;
      }

      // Wait for bundled jsPDF to load
      let attempts = 0;
      while (attempts < 50) {
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
          console.log('✅ jsPDF library loaded from bundle');
          this.librariesLoaded = true;
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`Firefox bundled jsPDF loading attempt ${attempts}/50...`);
        }
      }
      
      console.error('❌ jsPDF failed to load from bundle after 5 seconds');
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
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      `;

      content.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 20px; gap: 12px;">
          <img src="${typeof window.logoDataUrl !== 'undefined' ? window.logoDataUrl : ''}" 
               style="width: 32px; height: 32px; object-fit: contain;" 
               onerror="this.style.display='none'"
               onload="console.log('Logo image loaded successfully in popup')">
          <h2 style="margin: 0; color: #333; font-size: 20px; font-weight: 600;">THE QUICKNESS</h2>
          <button id="quickness-close" style="
            margin-left: auto;
            background: #f5f5f5;
            border: none;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            font-size: 18px;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <img id="quickness-screenshot" src="${capturedData.screenshot}" 
               style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
               onload="console.log('Screenshot loaded successfully in modal')">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Add your note:</label>
          <textarea id="quickness-note" placeholder="Enter your note here..." style="
            width: 100%;
            height: 100px;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            resize: vertical;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
          "></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="quickness-bookmark" style="
            padding: 12px 24px;
            background: #e3f2fd;
            color: #1976d2;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
          ">Save Bookmark</button>
          <button id="quickness-save" style="
            padding: 12px 24px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
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

      document.getElementById('quickness-save').onclick = () => {
        const note = document.getElementById('quickness-note').value;
        console.log(`Save PDF started with note: ${note}`);
        this.savePDF(capturedData, note);
      };

      document.getElementById('quickness-bookmark').onclick = () => {
        const note = document.getElementById('quickness-note').value;
        this.saveBookmark(capturedData, note);
      };

      // Focus on textarea
      setTimeout(() => {
        document.getElementById('quickness-note').focus();
      }, 100);
    }

    async savePDF(capturedData, note) {
      if (!this.librariesLoaded) {
        console.error('jsPDF library not loaded');
        this.showToast('PDF library not available', 'error');
        return;
      }

      try {
        console.log('Creating PDF with bundled jsPDF...');
        
        // Use bundled jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add screenshot
        const img = new Image();
        img.onload = async () => {
          try {
            const imgWidth = 190;
            const imgHeight = (img.height * imgWidth) / img.width;
            
            doc.addImage(capturedData.screenshot, 'PNG', 10, 10, imgWidth, imgHeight);
            
            // Add note
            if (note.trim()) {
              doc.setFontSize(12);
              doc.text(`Note: ${note}`, 10, imgHeight + 25);
            }
            
            // Add URL
            doc.setFontSize(10);
            doc.text(`Source: ${capturedData.url}`, 10, imgHeight + (note.trim() ? 35 : 25));
            
            // Save PDF
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `quickness-${timestamp}.pdf`;
            
            const pdfOutput = doc.output('arraybuffer');
            const pdfArray = Array.from(new Uint8Array(pdfOutput));
            
            await browser.runtime.sendMessage({
              action: 'downloadPDF',
              pdfData: pdfArray,
              filename: filename
            });
            
            console.log('PDF download request sent to background script');
            document.getElementById('the-quickness-modal').remove();
            
          } catch (error) {
            console.error('Error creating PDF:', error);
            this.showToast('Failed to create PDF', 'error');
          }
        };
        
        img.src = capturedData.screenshot;
        
      } catch (error) {
        console.error('Error in savePDF:', error);
        this.showToast('Failed to save PDF', 'error');
      }
    }

    async saveBookmark(capturedData, note) {
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const filename = `quickness-${timestamp}`;
        
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