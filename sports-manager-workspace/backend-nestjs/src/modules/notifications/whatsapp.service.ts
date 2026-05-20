import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';

// Baileys is ESM-only — loaded via dynamic import
type WASocket = Awaited<ReturnType<typeof import('@whiskeysockets/baileys')['default']>>;

const SESSION_DIR = path.join(process.cwd(), '.whatsapp-session');

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sock: WASocket | null = null;
  private ready = false;

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
      } = await import('@whiskeysockets/baileys');

      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // muestra el QR en la terminal del servidor
        logger: (await import('pino')).default({ level: 'silent' }),
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
          this.ready = true;
          this.logger.log('WhatsApp conectado correctamente');
        }
        if (connection === 'close') {
          this.ready = false;
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = code !== DisconnectReason.loggedOut;
          this.logger.warn(`WhatsApp desconectado (código ${code}). Reconectando: ${shouldReconnect}`);
          if (shouldReconnect) {
            setTimeout(() => this.connect(), 5000);
          }
        }
      });
    } catch (err) {
      this.logger.error('Error iniciando WhatsApp', err);
    }
  }

  async sendText(phone: string, message: string): Promise<void> {
    if (!this.ready || !this.sock) {
      this.logger.warn(`WhatsApp no está listo — mensaje no enviado a ${phone}`);
      return;
    }
    const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: message });
  }

  async sendFile(phone: string, buffer: Buffer, filename: string, caption = ''): Promise<void> {
    if (!this.ready || !this.sock) {
      this.logger.warn(`WhatsApp no está listo — archivo no enviado a ${phone}`);
      return;
    }
    const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, {
      document: buffer,
      fileName: filename,
      mimetype: 'application/pdf',
      caption,
    });
  }

  isReady(): boolean {
    return this.ready;
  }
}
