/**
 * StreamManager - مدير البث المباشر
 * يدعم: HLS (.m3u8), FLV, HTTP streams
 * 
 * المكتبات المطلوبة:
 * - HLS.js: https://cdn.jsdelivr.net/npm/hls.js@latest
 * - FLV.js: https://cdn.jsdelivr.net/npm/flv.js@latest/dist/flv.min.js
 */

class StreamManager {
    constructor() {
        this.streams = new Map(); // Map of cameraId -> stream instance
        this.config = this.loadConfig();
        this.reconnectAttempts = new Map(); // Track reconnection attempts
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
    }

    /**
     * تحديد نوع البث تلقائياً من URL
     */
    detectStreamType(url) {
        if (!url) return null;
        url = url.toLowerCase();

        if (url.includes('.m3u8') || url.includes('hls')) return 'hls';
        if (url.includes('.flv') || url.includes('flv=') || url.includes('httpflv')) return 'flv';
        if (url.includes('.mp4')) return 'mp4';

        // Default to HLS for unknown types
        return 'hls';
    }

    /**
     * اتصال ببث لكاميرا معينة
     */
    async connect(cameraId, url, type = 'auto') {
        // Disconnect existing stream first
        this.disconnect(cameraId);

        if (!url) {
            console.error(`[StreamManager] No URL provided for camera ${cameraId}`);
            return false;
        }

        // Detect stream type if auto
        const streamType = type === 'auto' ? this.detectStreamType(url) : type;

        // Get video element
        const videoElement = document.querySelector(`.video-feed[data-camera="${cameraId}"] .video-player`);
        if (!videoElement) {
            console.error(`[StreamManager] Video element not found for camera ${cameraId}`);
            return false;
        }

        // Update UI to connecting state
        this.updateStreamStatus(cameraId, 'connecting', 'جاري الاتصال...');

        try {
            let streamInstance = null;

            switch (streamType) {
                case 'hls':
                    streamInstance = await this.connectHLS(videoElement, url, cameraId);
                    break;
                case 'flv':
                    streamInstance = await this.connectFLV(videoElement, url, cameraId);
                    break;
                case 'mp4':
                    streamInstance = await this.connectMP4(videoElement, url, cameraId);
                    break;
                default:
                    throw new Error(`Unsupported stream type: ${streamType}`);
            }

            if (streamInstance !== null) {
                this.streams.set(cameraId, {
                    instance: streamInstance,
                    type: streamType,
                    url: url,
                    videoElement: videoElement
                });

                // Reset reconnect attempts on successful connection
                this.reconnectAttempts.set(cameraId, 0);

                // Show video, hide placeholder
                const feed = document.querySelector(`.video-feed[data-camera="${cameraId}"]`);
                if (feed) {
                    feed.classList.add('streaming');
                }

                this.updateStreamStatus(cameraId, 'connected', 'متصل');
                console.log(`[StreamManager] Connected camera ${cameraId} via ${streamType}`);
                return true;
            }
        } catch (error) {
            console.error(`[StreamManager] Connection failed for camera ${cameraId}:`, error);
            this.updateStreamStatus(cameraId, 'error', 'فشل الاتصال');
            this.handleReconnect(cameraId, url, type);
            return false;
        }

        return false;
    }

    /**
     * اتصال ببث HLS
     */
    async connectHLS(videoElement, url, cameraId) {
        return new Promise((resolve, reject) => {
            // Check if HLS.js is available
            if (typeof Hls === 'undefined') {
                // Try native HLS support (Safari)
                if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    videoElement.src = url;
                    videoElement.play().then(() => {
                        resolve(null); // Native playback, no instance needed
                    }).catch(reject);
                    return;
                }
                reject(new Error('HLS.js not loaded and native HLS not supported'));
                return;
            }

            if (!Hls.isSupported()) {
                // Try native HLS support
                if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    videoElement.src = url;
                    videoElement.play().then(() => resolve(null)).catch(reject);
                    return;
                }
                reject(new Error('HLS not supported in this browser'));
                return;
            }

            const hls = new Hls({
                lowLatencyMode: true,
                liveSyncDuration: 1,
                liveMaxLatencyDuration: 3,
                liveDurationInfinity: true,
                enableWorker: true,
                backBufferLength: 0
            });

            hls.loadSource(url);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().then(() => {
                    resolve(hls);
                }).catch((err) => {
                    // Autoplay might be blocked, still resolve
                    console.warn('[StreamManager] Autoplay blocked, user interaction required');
                    resolve(hls);
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('[StreamManager] HLS network error');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('[StreamManager] HLS media error');
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            reject(new Error(`HLS fatal error: ${data.type}`));
                            break;
                    }
                }
            });

            // Timeout for connection
            setTimeout(() => {
                if (!videoElement.readyState) {
                    hls.destroy();
                    reject(new Error('HLS connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * اتصال ببث FLV
     */
    async connectFLV(videoElement, url, cameraId) {
        return new Promise((resolve, reject) => {
            // Check if FLV.js is available
            if (typeof flvjs === 'undefined') {
                reject(new Error('FLV.js not loaded'));
                return;
            }

            if (!flvjs.isSupported()) {
                reject(new Error('FLV not supported in this browser'));
                return;
            }

            const player = flvjs.createPlayer({
                type: 'flv',
                url: url,
                isLive: true,
                hasAudio: true,
                hasVideo: true,
                enableStashBuffer: false,
                stashInitialSize: 128
            }, {
                enableWorker: true,
                lazyLoadMaxDuration: 3 * 60,
                seekType: 'range'
            });

            player.attachMediaElement(videoElement);
            player.load();

            player.on(flvjs.Events.LOADING_COMPLETE, () => {
                resolve(player);
            });

            player.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
                console.error('[StreamManager] FLV error:', errorType, errorDetail);
                reject(new Error(`FLV error: ${errorType} - ${errorDetail}`));
            });

            // Try to play
            player.play().then(() => {
                resolve(player);
            }).catch((err) => {
                console.warn('[StreamManager] FLV autoplay blocked');
                resolve(player);
            });

            // Timeout
            setTimeout(() => {
                if (!videoElement.readyState) {
                    player.destroy();
                    reject(new Error('FLV connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * اتصال ببث MP4 مباشر
     */
    async connectMP4(videoElement, url, cameraId) {
        return new Promise((resolve, reject) => {
            videoElement.src = url;

            videoElement.onloadeddata = () => {
                videoElement.play().then(() => {
                    resolve(null);
                }).catch((err) => {
                    console.warn('[StreamManager] MP4 autoplay blocked');
                    resolve(null);
                });
            };

            videoElement.onerror = () => {
                reject(new Error('MP4 loading failed'));
            };

            // Timeout
            setTimeout(() => {
                if (!videoElement.readyState) {
                    reject(new Error('MP4 connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * قطع اتصال كاميرا معينة
     */
    disconnect(cameraId) {
        const stream = this.streams.get(cameraId);
        if (!stream) return;

        try {
            if (stream.instance) {
                if (stream.type === 'hls' && stream.instance.destroy) {
                    stream.instance.destroy();
                } else if (stream.type === 'flv' && stream.instance.destroy) {
                    stream.instance.unload();
                    stream.instance.detachMediaElement();
                    stream.instance.destroy();
                }
            }

            if (stream.videoElement) {
                stream.videoElement.pause();
                stream.videoElement.src = '';
                stream.videoElement.load();
            }
        } catch (e) {
            console.warn('[StreamManager] Error during disconnect:', e);
        }

        this.streams.delete(cameraId);

        // Update UI
        const feed = document.querySelector(`.video-feed[data-camera="${cameraId}"]`);
        if (feed) {
            feed.classList.remove('streaming');
        }

        this.updateStreamStatus(cameraId, 'disconnected', 'غير متصل');
        console.log(`[StreamManager] Disconnected camera ${cameraId}`);
    }

    /**
     * قطع اتصال جميع الكاميرات
     */
    disconnectAll() {
        this.streams.forEach((stream, cameraId) => {
            this.disconnect(cameraId);
        });
    }

    /**
     * معالجة إعادة الاتصال التلقائي
     */
    handleReconnect(cameraId, url, type) {
        const attempts = (this.reconnectAttempts.get(cameraId) || 0) + 1;
        this.reconnectAttempts.set(cameraId, attempts);

        if (attempts <= this.maxReconnectAttempts) {
            console.log(`[StreamManager] Reconnecting camera ${cameraId}, attempt ${attempts}/${this.maxReconnectAttempts}`);
            this.updateStreamStatus(cameraId, 'reconnecting', `إعادة الاتصال (${attempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect(cameraId, url, type);
            }, this.reconnectDelay * attempts);
        } else {
            console.error(`[StreamManager] Max reconnect attempts reached for camera ${cameraId}`);
            this.updateStreamStatus(cameraId, 'error', 'فشل الاتصال - حاول مرة أخرى');
        }
    }

    /**
     * تحديث حالة البث في الواجهة
     */
    updateStreamStatus(cameraId, status, message) {
        const feed = document.querySelector(`.video-feed[data-camera="${cameraId}"]`);
        if (!feed) return;

        // Remove existing status
        let statusEl = feed.querySelector('.stream-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'stream-status';
            feed.appendChild(statusEl);
        }

        // Update status class and content
        statusEl.className = `stream-status ${status}`;

        const icons = {
            'connecting': 'fa-spinner fa-spin',
            'connected': 'fa-check-circle',
            'disconnected': 'fa-plug',
            'error': 'fa-exclamation-circle',
            'reconnecting': 'fa-sync fa-spin'
        };

        statusEl.innerHTML = `<i class="fas ${icons[status] || 'fa-circle'}"></i> ${message}`;
    }

    /**
     * حفظ إعدادات البث في localStorage
     */
    saveConfig() {
        const config = {};

        document.querySelectorAll('.stream-config').forEach(configEl => {
            const cameraId = configEl.dataset.camera;
            const urlInput = configEl.querySelector('input[type="text"]');
            const typeSelect = configEl.querySelector('.stream-type-select');

            if (urlInput && cameraId) {
                config[cameraId] = {
                    url: urlInput.value,
                    type: typeSelect ? typeSelect.value : 'auto'
                };
            }
        });

        localStorage.setItem('rasd_stream_config', JSON.stringify(config));
        console.log('[StreamManager] Configuration saved');
        return config;
    }

    /**
     * تحميل إعدادات البث من localStorage
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('rasd_stream_config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('[StreamManager] Error loading config:', e);
        }
        return {};
    }

    /**
     * تطبيق الإعدادات المحفوظة على الواجهة
     */
    applyConfigToUI() {
        const config = this.config;

        Object.keys(config).forEach(cameraId => {
            const configEl = document.querySelector(`.stream-config[data-camera="${cameraId}"]`);
            if (configEl) {
                const urlInput = configEl.querySelector('input[type="text"]');
                const typeSelect = configEl.querySelector('.stream-type-select');

                if (urlInput && config[cameraId].url) {
                    urlInput.value = config[cameraId].url;
                }
                if (typeSelect && config[cameraId].type) {
                    typeSelect.value = config[cameraId].type;
                }
            }
        });
    }

    /**
     * اتصال بجميع الكاميرات المُعدّة
     */
    async connectAll() {
        const config = this.config;
        const promises = [];

        Object.keys(config).forEach(cameraId => {
            if (config[cameraId].url) {
                promises.push(this.connect(cameraId, config[cameraId].url, config[cameraId].type));
            }
        });

        await Promise.allSettled(promises);
        console.log('[StreamManager] All configured streams connected');
    }

    /**
     * الحصول على حالة جميع البثوث
     */
    getStatus() {
        const status = {};
        this.streams.forEach((stream, cameraId) => {
            status[cameraId] = {
                type: stream.type,
                url: stream.url,
                isPlaying: stream.videoElement && !stream.videoElement.paused
            };
        });
        return status;
    }
}

// إنشاء instance عام
window.streamManager = new StreamManager();

// تصدير للاستخدام في modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamManager;
}
