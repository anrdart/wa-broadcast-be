/* global QRCode, Papa */

class WhatsAppBroadcastApp {
    constructor() {
        this.socket = null;
        this.contacts = [];
        this.selectedContacts = new Set();
        this.isConnected = false;
        this.isSending = false;
        this.MAX_CONTACTS = 256;
        
        this.initializeElements();
        this.attachEventListeners();
        this.connectToServer();
    }

    initializeElements() {
        // Status elements
        this.statusElement = document.getElementById('connection-status');
        this.statusText = document.getElementById('status-text');
        this.connectBtn = document.getElementById('connect-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.importCsvBtn = document.getElementById('import-csv');
        this.csvFileInput = document.createElement('input');
        this.csvFileInput.type = 'file';
        this.csvFileInput.accept = '.csv';
        this.csvFileInput.style.display = 'none';
        document.body.appendChild(this.csvFileInput);
        
        // QR elements
        this.qrSection = document.getElementById('qr-section');
        this.qrContainer = document.getElementById('qr-container');
        
        // Contacts elements
        this.contactsList = document.getElementById('contacts-list');
        this.totalContacts = document.getElementById('total-contacts');
        this.refreshContactsBtn = document.getElementById('refresh-contacts');
        this.searchContacts = document.getElementById('search-contacts');
        this.filterSaved = document.getElementById('filter-saved');
        this.filterCsv = document.getElementById('filter-csv');
        
        // Message elements
        this.messageText = document.getElementById('message-text');
        this.includeMedia = document.getElementById('include-media');
        this.mediaFile = document.getElementById('media-file');
        this.selectMedia = document.getElementById('select-media');
        this.selectedCount = document.getElementById('selected-count');
        this.sendBroadcast = document.getElementById('send-broadcast');
        
        // Progress elements
        this.progressSection = document.getElementById('progress-section');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.progressPercentage = document.getElementById('progress-percentage');
        this.progressLog = document.getElementById('progress-log');
    }

    attachEventListeners() {
        // Connection
        this.connectBtn.addEventListener('click', () => this.handleConnect());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.importCsvBtn.addEventListener('click', () => this.csvFileInput.click());
        this.csvFileInput.addEventListener('change', () => this.handleCsvImport());
        
        // Contacts
        this.refreshContactsBtn.addEventListener('click', () => this.refreshContacts());
        this.searchContacts.addEventListener('input', () => this.filterContacts());
        this.filterSaved.addEventListener('change', () => this.filterContacts());
        this.filterCsv.addEventListener('change', () => this.filterContacts());
        
        // Add select all functionality
        document.addEventListener('click', (e) => {
            if (e.target.id === 'select-all-contacts') {
                this.selectAllContacts(e.target.checked);
            }
        });
        
        // Media
        this.includeMedia.addEventListener('change', () => this.toggleMediaSelection());
        this.selectMedia.addEventListener('click', () => this.mediaFile.click());
        this.mediaFile.addEventListener('change', () => this.handleMediaSelection());
        
        // Broadcast
        this.sendBroadcast.addEventListener('click', () => this.handleSendBroadcast());
        this.messageText.addEventListener('input', () => this.updateSendButton());
    }

    connectToServer() {
        try {
            this.socket = new WebSocket('ws://localhost:3000');
            
            this.socket.onopen = () => {
                console.log('Connected to server');
                this.updateStatus('connecting', 'Menghubungkan ke WhatsApp...');
                this.socket.send(JSON.stringify({ type: 'connect' }));
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from server');
                this.updateStatus('disconnected', 'Tidak Terhubung');
                this.isConnected = false;
                this.connectBtn.innerHTML = '<i class="fas fa-play"></i> Mulai Koneksi';
                this.connectBtn.disabled = false;
                this.logoutBtn.style.display = 'none';
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('disconnected', 'Error Koneksi');
            };
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.updateStatus('disconnected', 'Server Tidak Tersedia');
        }
    }

    handleServerMessage(data) {
        console.log('Received message from server:', data);
        switch (data.type) {
        case 'qr':
            this.showQRCode(data.qr);
            break;
        case 'authenticated':
            this.handleAuthenticated();
            break;
        case 'ready':
            this.handleReady();
            break;
        case 'contacts':
            this.handleContacts(data.contacts);
            break;
        case 'broadcast_progress':
            this.handleBroadcastProgress(data);
            break;
        case 'broadcast_complete':
            this.handleBroadcastComplete(data);
            break;
        case 'disconnected':
            this.handleDisconnected(data.message);
            break;
        case 'error':
            this.handleError(data.message);
            break;
        }
    }

    

    showQRCode(qrData) {
        console.log('Attempting to show QR code:', qrData);
        this.qrSection.style.display = 'block';
        this.qrContainer.innerHTML = '';
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            this.qrContainer.innerHTML = '<p>Error: QR Code library tidak tersedia</p>';
            return;
        }
        
        new QRCode(this.qrContainer, {
            text: qrData,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR Code generated successfully');
        
        this.updateStatus('connecting', 'Scan QR Code dengan WhatsApp');
    }

    handleAuthenticated() {
        this.qrSection.style.display = 'none';
        this.updateStatus('connecting', 'Autentikasi berhasil, memuat data...');
    }

    handleReady() {
        this.isConnected = true;
        this.updateStatus('connected', 'Terhubung ke WhatsApp');
        this.connectBtn.innerHTML = '<i class="fas fa-check"></i> Terhubung';
        this.connectBtn.disabled = true;
        this.logoutBtn.style.display = 'inline-block';
        this.refreshContacts();
    }

    handleContacts(contacts) {
        this.contacts = contacts;
        this.renderContacts();
        this.totalContacts.textContent = contacts.length;
    }

    handleCsvImport() {
        const file = this.csvFileInput.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedContacts = results.data.map(row => ({
                id: row.number || row.phone,
                name: row.name || null,
                number: this.formatNumber(row.number || row.phone),
                isMyContact: false,
                isFromCSV: true
            }));
                // Deduplikasi berdasarkan number
                const uniqueImported = importedContacts.filter(imp => !this.contacts.some(existing => existing.number === imp.number));
                // Batasi jumlah import agar tidak melebihi sisa slot
                const availableSlots = this.MAX_CONTACTS - this.selectedContacts.size;
                const addedContacts = uniqueImported.slice(0, availableSlots);
                this.contacts = [...this.contacts, ...addedContacts];
                this.renderContacts();
                this.totalContacts.textContent = this.contacts.length;
                this.csvFileInput.value = '';
                if (uniqueImported.length > addedContacts.length) {
                    alert(`Hanya ${addedContacts.length} kontak baru ditambahkan. Sisa dibatasi karena limit maksimal.`);
                }
                this.filterCsv.checked = true;
                this.filterContacts();
            }
        });
    }

    formatNumber(number) {
        if (number.startsWith('62')) {
            return '0' + number.substring(2);
        }
        return number;
    }

    refreshContacts() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isConnected) {
            this.refreshContactsBtn.innerHTML = '<div class="loading"></div> Loading...';
            this.refreshContactsBtn.disabled = true;
            this.socket.send(JSON.stringify({ type: 'get_contacts' }));
            
            setTimeout(() => {
                this.refreshContactsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                this.refreshContactsBtn.disabled = false;
            }, 2000);
        }
    }

    renderContacts() {
        if (this.contacts.length === 0) {
            this.contactsList.innerHTML = `
                <div class="no-contacts">
                    <i class="fas fa-users"></i>
                    <p>Belum ada kontak. Pastikan WhatsApp sudah terhubung.</p>
                </div>
            `;
            return;
        }

        const filteredContacts = this.getFilteredContacts();
        
        this.contactsList.innerHTML = filteredContacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <input type="checkbox" class="contact-checkbox" data-id="${contact.id}">
                <div class="contact-avatar">
                    ${this.getContactInitials(contact.name || contact.number)}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name || 'Tidak Dikenal'}</div>
                    <div class="contact-number">${contact.number}</div>
                </div>
                <span class="contact-type ${contact.isMyContact ? 'contact-saved' : (contact.isFromCSV ? 'contact-csv' : 'contact-unsaved')}">
                    ${contact.isMyContact ? 'Tersimpan' : (contact.isFromCSV ? 'Dari CSV' : 'Tidak Tersimpan')}
                </span>
            </div>
        `).join('');

        // Attach checkbox event listeners
        this.contactsList.querySelectorAll('.contact-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleContactSelection(e));
        });

        // Attach contact item click listeners
        this.contactsList.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('.contact-checkbox');
                    checkbox.checked = !checkbox.checked;
                    this.handleContactSelection({ target: checkbox });
                }
            });
        });
    }

    getFilteredContacts() {
        let filtered = this.contacts;
        
        // Filter by search term
        const searchTerm = this.searchContacts.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(contact => 
                (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
                contact.number.includes(searchTerm)
            );
        }
        
        // Filter by type
        const showSaved = this.filterSaved.checked;
        const showCsv = this.filterCsv.checked;
        
        if (!showSaved || !showCsv) {
            filtered = filtered.filter(contact => {
                if (showSaved && contact.isMyContact) return true;
                if (showCsv && (contact.isFromCSV || !contact.isMyContact)) return true;
                return false;
            });
        }
        
        return filtered;
    }

    filterContacts() {
        this.renderContacts();
        this.updateSelectedContacts();
    }

    handleContactSelection(e) {
        const contactId = e.target.dataset.id;
        const isChecked = e.target.checked;
        
        if (isChecked) {
            if (this.selectedContacts.size >= this.MAX_CONTACTS) {
                e.target.checked = false;
                alert('Maksimal 256 kontak yang dapat dipilih.');
                return;
            }
            this.selectedContacts.add(contactId);
            e.target.closest('.contact-item').classList.add('selected');
        } else {
            this.selectedContacts.delete(contactId);
            e.target.closest('.contact-item').classList.remove('selected');
        }
        
        this.updateSelectedContacts();
    }

    updateSelectedContacts() {
        this.selectedCount.textContent = `${this.selectedContacts.size}/${this.MAX_CONTACTS}`;
        this.updateSendButton();
    }

    getContactInitials(name) {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }

    toggleMediaSelection() {
        const showMedia = this.includeMedia.checked;
        this.selectMedia.style.display = showMedia ? 'inline-flex' : 'none';
        this.mediaFile.style.display = showMedia ? 'block' : 'none';
    }

    handleMediaSelection() {
        const file = this.mediaFile.files[0];
        if (file) {
            this.selectMedia.innerHTML = `<i class="fas fa-paperclip"></i> ${file.name}`;
        }
    }

    selectAllContacts(checked) {
        const checkboxes = this.contactsList.querySelectorAll('.contact-checkbox');
        
        if (checked) {
            let added = this.selectedContacts.size;
            checkboxes.forEach(checkbox => {
                if (added >= this.MAX_CONTACTS) {
                    checkbox.checked = false;
                    return;
                }
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    const contactId = checkbox.dataset.id;
                    this.selectedContacts.add(contactId);
                    checkbox.closest('.contact-item').classList.add('selected');
                    added++;
                }
            });
        } else {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                const contactId = checkbox.dataset.id;
                this.selectedContacts.delete(contactId);
                checkbox.closest('.contact-item').classList.remove('selected');
            });
        }
        
        this.updateSelectedContacts();
    }

    updateSendButton() {
        const hasMessage = this.messageText.value.trim().length > 0;
        const hasContacts = this.selectedContacts.size > 0;
        const canSend = hasMessage && hasContacts && this.isConnected && !this.isSending;
        
        this.sendBroadcast.disabled = !canSend;
    }

    handleSendBroadcast() {
        if (this.isSending) return;
        
        const message = this.messageText.value.trim();
        const selectedContactIds = Array.from(this.selectedContacts);
        
        if (!message || selectedContactIds.length === 0) {
            alert('Silakan masukkan pesan dan pilih kontak terlebih dahulu.');
            return;
        }
        
        // Show confirmation modal
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmOk = document.getElementById('confirm-ok');
        const confirmCancel = document.getElementById('confirm-cancel');
        
        confirmMessage.textContent = `Kirim pesan ke ${selectedContactIds.length} kontak?`;
        confirmModal.classList.remove('hidden');
        
        const handleConfirm = () => {
            confirmModal.classList.add('hidden');
            confirmOk.removeEventListener('click', onOk);
            confirmCancel.removeEventListener('click', onCancel);
        };
        
        const onOk = () => {
            handleConfirm();
            this.isSending = true;
            this.sendBroadcast.innerHTML = '<div class="loading"></div> Mengirim...';
            this.sendBroadcast.disabled = true;
            
            this.progressSection.style.display = 'block';
            this.progressFill.style.width = '0%';
            this.progressText.textContent = `0 / ${selectedContactIds.length}`;
            this.progressPercentage.textContent = '0%';
            this.progressLog.innerHTML = '';
            
            const broadcastData = {
                type: 'send_broadcast',
                message: message,
                contacts: selectedContactIds,
                media: this.includeMedia.checked && this.mediaFile.files[0] ? {
                    name: this.mediaFile.files[0].name,
                    type: this.mediaFile.files[0].type,
                    size: this.mediaFile.files[0].size
                } : null
            };
            
            this.socket.send(JSON.stringify(broadcastData));
            
            this.addLogEntry('info', 'Memulai pengiriman broadcast...');
        };
        
        const onCancel = () => {
            handleConfirm();
        };
        
        confirmOk.addEventListener('click', onOk);
        confirmCancel.addEventListener('click', onCancel);
    }

    handleBroadcastProgress(data) {
        const { current, total, contact, success, error } = data;
        const percentage = Math.round((current / total) * 100);
        
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${current} / ${total}`;
        this.progressPercentage.textContent = `${percentage}%`;
        
        if (success) {
            this.addLogEntry('success', `✓ Berhasil kirim ke ${contact.name || contact.number}`);
        } else if (error) {
            this.addLogEntry('error', `✗ Gagal kirim ke ${contact.name || contact.number}: ${error}`);
        }
    }

    handleBroadcastComplete(data) {
        this.isSending = false;
        this.sendBroadcast.innerHTML = '<i class="fas fa-broadcast-tower"></i> Kirim Broadcast';
        this.updateSendButton();
        
        const { successful, failed, total } = data;
        this.addLogEntry('info', `Broadcast selesai! Berhasil: ${successful}, Gagal: ${failed}, Total: ${total}`);
        
        // Clear selections
        this.selectedContacts.clear();
        this.messageText.value = '';
        this.mediaFile.value = '';
        this.includeMedia.checked = false;
        this.toggleMediaSelection();
        this.renderContacts();
        this.updateSelectedContacts();
    }

    addLogEntry(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.progressLog.appendChild(logEntry);
        this.progressLog.scrollTop = this.progressLog.scrollHeight;
    }

    handleDisconnected(message) {
        this.isConnected = false;
        this.qrSection.style.display = 'none';
        this.updateStatus('disconnected', message || 'Terputus dari WhatsApp');
        this.connectBtn.innerHTML = '<i class="fas fa-play"></i> Mulai Koneksi';
        this.connectBtn.disabled = false;
        this.logoutBtn.style.display = 'none';
        this.contacts = [];
        this.selectedContacts.clear();
        this.renderContacts();
        this.updateSelectedContacts();
        this.totalContacts.textContent = '0';
        console.log('WhatsApp disconnected:', message);
    }

    handleLogout() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'logout' }));
        }
    }

    handleError(message) {
        console.error('Error:', message);
        this.addLogEntry('error', message);
        
        // Don't show alert for minor errors
        if (message.includes('Authentication failed') || message.includes('disconnected')) {
            this.updateStatus('disconnected', 'Error Koneksi');
            this.connectBtn.innerHTML = '<i class="fas fa-play"></i> Mulai Koneksi';
            this.connectBtn.disabled = false;
        }
    }

    updateStatus(status, text) {
        this.statusElement.className = `status-${status}`;
        this.statusText.textContent = text;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WhatsAppBroadcastApp();
});