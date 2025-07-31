// 共通ユーティリティ関数
if (typeof window.CommonUtils === 'undefined') {
class CommonUtils {
    /**
     * クリップボードAPIが利用可能かチェック
     */
    static isClipboardAvailable() {
        return navigator.clipboard &&
            typeof navigator.clipboard.writeText === 'function' &&
            window.isSecureContext;
    }

    /**
     * クリップボードにテキストをコピー
     */
    static async copyToClipboard(text) {
        if (this.isClipboardAvailable()) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Failed to copy with clipboard API:', err);
                return this.fallbackCopyToClipboard(text);
            }
        } else {
            return this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * フォールバッククリップボード機能
     */
    static fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.className = 'html-to-markdown-extension-ui';
            textArea.value = text;
            textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;pointer-events:none;';
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        }
    }

    /**
     * 通知を表示
     */
    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'html-to-markdown-extension-ui';
        notification.textContent = message;

        const colors = {
            success: 'rgba(16, 185, 129, 0.95)',
            error: 'rgba(239, 68, 68, 0.95)',
            info: 'rgba(59, 130, 246, 0.95)'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            background: colors[type] || colors.success,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: `0 8px 32px ${colors[type] || colors.success}30`,
            color: 'white',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '15px',
            fontWeight: '500',
            padding: '12px 20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: '10001',
            opacity: '0',
            pointerEvents: 'none'
        });

        document.body.appendChild(notification);

        // アニメーション
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 制限されたURLかチェック
     */
    static isRestrictedUrl(url) {
        const restrictedPrefixes = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'https://chrome.google.com',
            'https://chromewebstore.google.com',
            'edge://',
            'about:',
            'data:',
            'javascript:'
        ];
        return restrictedPrefixes.some(prefix => url.startsWith(prefix));
    }

    /**
     * 現在のタブ情報を取得
     */
    static async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return tab;
        } catch (error) {
            console.error('Error getting current tab:', error);
            return null;
        }
    }

    /**
     * ストレージから設定を読み込み
     */
    static async loadSettings(defaultSettings = {}) {
        try {
            return await chrome.storage.sync.get(defaultSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    }

    /**
     * ストレージに設定を保存
     */
    static async saveSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
}

// グローバルに公開
window.CommonUtils = CommonUtils;
}